// Railway FFmpeg Microservice
// Handles video muxing, caption burning, and compositing
// Deploy to Railway with Docker

const express = require('express');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const execAsync = promisify(exec);
const app = express();
app.use(express.json({ limit: '50mb' }));

const PORT = process.env.PORT || 3001;
const TEMP_DIR = '/tmp/ffmpeg-work';

// ===========================================
// HEALTH CHECK
// ===========================================

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'distributo-ffmpeg' });
});

// ===========================================
// MUX AUDIO + VIDEO
// ===========================================

app.post('/mux', async (req, res) => {
  const { video_url, audio_url, output_format = 'mp4', resolution = '1080x1920', fps = 30 } = req.body;

  if (!video_url || !audio_url) {
    return res.status(400).json({ error: 'video_url and audio_url required' });
  }

  const workId = crypto.randomBytes(8).toString('hex');
  const workDir = path.join(TEMP_DIR, workId);

  try {
    await fs.mkdir(workDir, { recursive: true });

    const videoPath = path.join(workDir, 'input.mp4');
    const audioPath = path.join(workDir, 'audio.mp3');
    const outputPath = path.join(workDir, `output.${output_format}`);

    // Download video and audio
    console.log(`[Mux ${workId}] Downloading files...`);
    await downloadFile(video_url, videoPath);
    await downloadFile(audio_url, audioPath);

    // Mux audio onto video
    console.log(`[Mux ${workId}] Muxing audio...`);
    const ffmpegCmd = `ffmpeg -y -i "${videoPath}" -i "${audioPath}" -c:v copy -c:a aac -map 0:v:0 -map 1:a:0 -shortest "${outputPath}"`;
    
    await execAsync(ffmpegCmd);

    // Upload to storage and return URL
    const outputUrl = await uploadToStorage(outputPath, `muxed/${workId}.${output_format}`);

    // Cleanup
    await fs.rm(workDir, { recursive: true, force: true });

    console.log(`[Mux ${workId}] Complete: ${outputUrl}`);
    res.json({ success: true, output_url: outputUrl });

  } catch (error) {
    console.error(`[Mux ${workId}] Error:`, error);
    await fs.rm(workDir, { recursive: true, force: true }).catch(() => {});
    res.status(500).json({ error: error.message });
  }
});

// ===========================================
// BURN CAPTIONS
// ===========================================

app.post('/captions', async (req, res) => {
  const { video_url, script, style } = req.body;

  if (!video_url || !script) {
    return res.status(400).json({ error: 'video_url and script required' });
  }

  const workId = crypto.randomBytes(8).toString('hex');
  const workDir = path.join(TEMP_DIR, workId);

  try {
    await fs.mkdir(workDir, { recursive: true });

    const videoPath = path.join(workDir, 'input.mp4');
    const outputPath = path.join(workDir, 'output.mp4');
    const assPath = path.join(workDir, 'captions.ass');

    // Download video
    console.log(`[Captions ${workId}] Downloading video...`);
    await downloadFile(video_url, videoPath);

    // Get video duration
    const duration = await getVideoDuration(videoPath);

    // Generate ASS subtitle file with word-by-word timing
    console.log(`[Captions ${workId}] Generating captions...`);
    const assContent = generateASSCaptions(script, duration, style);
    await fs.writeFile(assPath, assContent);

    // Burn captions using FFmpeg
    console.log(`[Captions ${workId}] Burning captions...`);
    const ffmpegCmd = `ffmpeg -y -i "${videoPath}" -vf "ass=${assPath}" -c:a copy "${outputPath}"`;
    
    await execAsync(ffmpegCmd);

    // Upload and return
    const outputUrl = await uploadToStorage(outputPath, `captioned/${workId}.mp4`);

    // Cleanup
    await fs.rm(workDir, { recursive: true, force: true });

    console.log(`[Captions ${workId}] Complete: ${outputUrl}`);
    res.json({ success: true, output_url: outputUrl });

  } catch (error) {
    console.error(`[Captions ${workId}] Error:`, error);
    await fs.rm(workDir, { recursive: true, force: true }).catch(() => {});
    res.status(500).json({ error: error.message });
  }
});

// ===========================================
// COMPOSITE SEGMENTS
// ===========================================

app.post('/composite', async (req, res) => {
  const { segments, output_format = 'mp4', resolution = '1080x1920', fps = 30, transition = 'cut' } = req.body;

  if (!segments || !Array.isArray(segments) || segments.length < 2) {
    return res.status(400).json({ error: 'At least 2 segments required' });
  }

  const workId = crypto.randomBytes(8).toString('hex');
  const workDir = path.join(TEMP_DIR, workId);

  try {
    await fs.mkdir(workDir, { recursive: true });

    const segmentPaths = [];
    const concatListPath = path.join(workDir, 'concat.txt');
    const outputPath = path.join(workDir, `output.${output_format}`);

    // Download and prepare each segment
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const segmentPath = path.join(workDir, `segment_${i}.mp4`);
      const preparedPath = path.join(workDir, `prepared_${i}.mp4`);

      console.log(`[Composite ${workId}] Downloading segment ${i + 1}/${segments.length}...`);
      await downloadFile(segment.url, segmentPath);

      // Normalize segment to target resolution and duration
      const [width, height] = resolution.split('x');
      const trimDuration = segment.duration || 5;

      const normalizeCmd = `ffmpeg -y -i "${segmentPath}" -t ${trimDuration} -vf "scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1" -r ${fps} -c:v libx264 -preset fast -c:a aac -ar 44100 "${preparedPath}"`;
      
      await execAsync(normalizeCmd);
      segmentPaths.push(preparedPath);
    }

    // Create concat list
    const concatContent = segmentPaths.map(p => `file '${p}'`).join('\n');
    await fs.writeFile(concatListPath, concatContent);

    // Concatenate all segments
    console.log(`[Composite ${workId}] Concatenating ${segments.length} segments...`);
    const concatCmd = `ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -c copy "${outputPath}"`;
    
    await execAsync(concatCmd);

    // Upload and return
    const outputUrl = await uploadToStorage(outputPath, `composite/${workId}.${output_format}`);

    // Cleanup
    await fs.rm(workDir, { recursive: true, force: true });

    console.log(`[Composite ${workId}] Complete: ${outputUrl}`);
    res.json({ success: true, output_url: outputUrl });

  } catch (error) {
    console.error(`[Composite ${workId}] Error:`, error);
    await fs.rm(workDir, { recursive: true, force: true }).catch(() => {});
    res.status(500).json({ error: error.message });
  }
});

// ===========================================
// EXTRACT BEST POSTER FRAME
// ===========================================

app.post('/poster', async (req, res) => {
  const { video_url } = req.body;

  if (!video_url) {
    return res.status(400).json({ error: 'video_url required' });
  }

  const workId = crypto.randomBytes(8).toString('hex');
  const workDir = path.join(TEMP_DIR, workId);

  try {
    await fs.mkdir(workDir, { recursive: true });

    const videoPath = path.join(workDir, 'input.mp4');
    const framesDir = path.join(workDir, 'frames');
    await fs.mkdir(framesDir);

    // Download video
    console.log(`[Poster ${workId}] Downloading video...`);
    await downloadFile(video_url, videoPath);

    // Extract first 15 frames
    console.log(`[Poster ${workId}] Extracting frames...`);
    await execAsync(`ffmpeg -y -i "${videoPath}" -vframes 15 -vf "fps=5" "${framesDir}/frame_%03d.jpg"`);

    // Find best frame (highest file size = most detail/expression)
    const files = await fs.readdir(framesDir);
    let bestFrame = null;
    let bestSize = 0;

    for (const file of files) {
      const filePath = path.join(framesDir, file);
      const stats = await fs.stat(filePath);
      if (stats.size > bestSize) {
        bestSize = stats.size;
        bestFrame = filePath;
      }
    }

    if (!bestFrame) {
      throw new Error('No frames extracted');
    }

    // Upload best frame as poster
    const posterUrl = await uploadToStorage(bestFrame, `posters/${workId}.jpg`);

    // Cleanup
    await fs.rm(workDir, { recursive: true, force: true });

    console.log(`[Poster ${workId}] Complete: ${posterUrl}`);
    res.json({ success: true, poster_url: posterUrl });

  } catch (error) {
    console.error(`[Poster ${workId}] Error:`, error);
    await fs.rm(workDir, { recursive: true, force: true }).catch(() => {});
    res.status(500).json({ error: error.message });
  }
});

// ===========================================
// HELPER FUNCTIONS
// ===========================================

async function downloadFile(url, destPath) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download failed: ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(destPath, buffer);
}

async function getVideoDuration(videoPath) {
  const { stdout } = await execAsync(
    `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${videoPath}"`
  );
  return parseFloat(stdout.trim()) || 5;
}

function generateASSCaptions(script, duration, style = {}) {
  const {
    fontsize = 52,
    fontcolor = 'FFFFFF',
    fontface = 'Arial',
    outline = 3,
    outline_color = '000000',
    position = 'center,70%',
    words_per_line = 3,
    highlight_color = 'FFFF00',
  } = style;

  // Parse position
  const [hAlign, vPos] = (position || 'center,70%').split(',');
  const alignment = hAlign === 'center' ? 2 : (hAlign === 'left' ? 1 : 3);
  const marginV = parseInt(vPos) || 70;

  // Split script into words
  const words = script.split(/\s+/).filter(w => w.length > 0);
  const totalWords = words.length;
  const timePerWord = duration / totalWords;

  // Generate ASS header
  let ass = `[Script Info]
Title: Auto-generated captions
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${fontface},${fontsize},&H00${fontcolor},&H00${highlight_color},&H00${outline_color},&H80000000,1,0,0,0,100,100,0,0,1,${outline},0,${alignment},10,10,${Math.round((100 - marginV) * 19.2)},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  // Generate word-by-word captions
  for (let i = 0; i < totalWords; i += words_per_line) {
    const chunk = words.slice(i, i + words_per_line);
    const startTime = i * timePerWord;
    const endTime = Math.min((i + words_per_line) * timePerWord, duration);

    // Build text with highlighted current word group
    const text = chunk.join(' ').toUpperCase();
    
    ass += `Dialogue: 0,${formatASSTime(startTime)},${formatASSTime(endTime)},Default,,0,0,0,,${text}\n`;
  }

  return ass;
}

function formatASSTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const cs = Math.floor((seconds % 1) * 100);
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

async function uploadToStorage(filePath, destPath) {
  // For local dev, return a file:// URL
  // In production, upload to Supabase/S3/etc
  
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    
    const fileBuffer = await fs.readFile(filePath);
    const { error } = await supabase.storage
      .from('videos')
      .upload(destPath, fileBuffer, { contentType: 'video/mp4' });
    
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage.from('videos').getPublicUrl(destPath);
    return publicUrl;
  }
  
  // Fallback: return local path (for dev)
  return `file://${filePath}`;
}

// ===========================================
// START SERVER
// ===========================================

app.listen(PORT, () => {
  console.log(`FFmpeg service running on port ${PORT}`);
});
