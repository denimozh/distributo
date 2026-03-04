// src/app/api/videos/generate/route.js
// Core video generation endpoint - orchestrates the full pipeline
// Avatar image + Script → Audio → Video → Save to DB

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { generateSpeech } from '@/lib/audio/elevenlabs';
import { generateVideoWithAudio } from '@/lib/video/kling';
import { useCreditsAtomic } from '@/lib/billing/credits';
import { trackApiCost } from '@/lib/tracking/costs';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      userId,
      campaignId,
      avatarId,
      voiceId,
      script,
      hookType,
      duration = 15,
      format = 'talking_head',
    } = body;

    if (!userId || !script || !avatarId) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, script, avatarId' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // 1. Check credits
    const creditResult = await useCreditsAtomic(userId, 1, `Video generation: ${hookType || 'custom'}`);
    if (!creditResult.success) {
      return NextResponse.json(
        { error: creditResult.message, code: 'INSUFFICIENT_CREDITS' },
        { status: 402 }
      );
    }

    // 2. Get avatar details
    const { data: avatar, error: avatarError } = await supabase
      .from('avatars')
      .select('*, voices(*)')
      .eq('id', avatarId)
      .single();

    if (avatarError || !avatar) {
      return NextResponse.json(
        { error: 'Avatar not found' },
        { status: 404 }
      );
    }

    // 3. Get voice (from avatar or explicit voiceId)
    let voice = avatar.voices;
    if (voiceId && voiceId !== avatar.voice_id) {
      const { data: explicitVoice } = await supabase
        .from('voices')
        .select('*')
        .eq('id', voiceId)
        .single();
      if (explicitVoice) voice = explicitVoice;
    }

    // 4. Create video record (status: generating)
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .insert({
        user_id: userId,
        campaign_id: campaignId,
        avatar_id: avatarId,
        script: script,
        hook_type: hookType,
        duration: duration,
        format: format,
        status: 'generating',
      })
      .select()
      .single();

    if (videoError) {
      console.error('Failed to create video record:', videoError);
      return NextResponse.json(
        { error: 'Failed to create video record' },
        { status: 500 }
      );
    }

    // 5. Generate audio with ElevenLabs
    console.log(`[Generate] Creating audio for video ${video.id}...`);
    
    let audioUrl = null;
    let audioCost = 0;
    
    if (voice?.elevenlabs_voice_id) {
      try {
        const audioResult = await generateSpeech({
          text: script,
          voiceId: voice.elevenlabs_voice_id,
          style: voice.style || 'conversational',
        });

        if (audioResult.success) {
          // Upload audio to Supabase storage
          const audioBuffer = Buffer.from(await audioResult.audioBlob.arrayBuffer());
          const audioPath = `${userId}/${video.id}.mp3`;
          
          const { error: uploadError } = await supabase.storage
            .from('audio')
            .upload(audioPath, audioBuffer, {
              contentType: 'audio/mpeg',
              upsert: true,
            });

          if (!uploadError) {
            const { data: urlData } = supabase.storage
              .from('audio')
              .getPublicUrl(audioPath);
            audioUrl = urlData.publicUrl;
            audioCost = audioResult.cost || 0;
          }
        }
      } catch (audioError) {
        console.error('[Generate] Audio generation failed:', audioError);
        // Continue without audio - Kling can still generate video
      }
    }

    // 6. Generate video with Kling 3.0
    console.log(`[Generate] Creating video for ${video.id}...`);
    
    const videoResult = await generateVideoWithAudio({
      avatarImageUrl: avatar.image_url,
      audioUrl: audioUrl,
      script: script,
      voiceStyle: voice?.style || 'conversational',
      duration: duration,
      aspectRatio: '9:16',
      setting: 'casual home environment, natural window light',
    });

    if (!videoResult.success) {
      // Update video status to failed
      await supabase
        .from('videos')
        .update({
          status: 'failed',
          generation_error: videoResult.error,
        })
        .eq('id', video.id);

      return NextResponse.json(
        { error: 'Video generation failed', details: videoResult.error },
        { status: 500 }
      );
    }

    // 7. Upload video to Supabase storage
    console.log(`[Generate] Uploading video ${video.id}...`);
    
    const videoResponse = await fetch(videoResult.videoUrl);
    const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
    const videoPath = `${userId}/${video.id}.mp4`;

    const { error: videoUploadError } = await supabase.storage
      .from('videos')
      .upload(videoPath, videoBuffer, {
        contentType: 'video/mp4',
        upsert: true,
      });

    let finalVideoUrl = videoResult.videoUrl;
    if (!videoUploadError) {
      const { data: videoUrlData } = supabase.storage
        .from('videos')
        .getPublicUrl(videoPath);
      finalVideoUrl = videoUrlData.publicUrl;
    }

    // 8. Update video record with success
    const { data: updatedVideo, error: updateError } = await supabase
      .from('videos')
      .update({
        status: 'ready',
        video_url: finalVideoUrl,
        audio_url: audioUrl,
        generation_request_id: videoResult.requestId,
      })
      .eq('id', video.id)
      .select()
      .single();

    // 9. Track costs
    const totalCost = (videoResult.cost || 0) + audioCost;
    await trackApiCost({
      userId,
      service: 'video_generation',
      operation: `${format}_${duration}s`,
      cost: totalCost,
      metadata: {
        videoId: video.id,
        klingCost: videoResult.cost,
        elevenLabsCost: audioCost,
      },
    });

    // 10. Update campaign progress if applicable
    if (campaignId) {
      await supabase.rpc('increment_campaign_videos', {
        p_campaign_id: campaignId,
      });
    }

    console.log(`[Generate] Video ${video.id} complete!`);

    return NextResponse.json({
      success: true,
      video: updatedVideo,
      cost: totalCost,
      creditsRemaining: creditResult.remaining_credits,
    });

  } catch (error) {
    console.error('[Generate] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
