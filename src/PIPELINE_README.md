# Distributo v6 - Complete Video Generation Pipeline

## New Features in v6

### 1. ElevenLabs Audio Integration
- Automatic voiceover generation for every video
- Avatar-specific voice mapping (each avatar has a matching ElevenLabs voice)
- Natural speech settings: stability 0.4, similarity boost 0.75
- Uses `eleven_turbo_v2_5` model for fast, high-quality output

### 2. FFmpeg Caption Burning
- TikTok-style word-by-word captions
- White bold text with black outline
- Yellow highlight on active word
- Positioned at 70% vertical (lower third, not cut off)
- Three caption styles: `tiktok`, `minimal`, `bold`

### 3. Product Footage Compositing
- Upload product demo video during strategy creation
- Automatic compositing: [Hook 3s] + [Product 5s] + [CTA 2s]
- Hard cuts between segments (native TikTok feel)
- Resolution normalized to 1080x1920 (9:16)

### 4. Three-Angle Avatar References (Kling Elements)
- Each avatar can have front, 3/4, and profile reference images
- Maintains face consistency across entire campaign
- API endpoint to generate reference images from base image

---

## Database Migration

Run the migration to add new columns:

```sql
-- In Supabase SQL Editor, run:
-- /supabase/migrations/20260307_avatar_audio_pipeline.sql
```

New columns added:
- `avatars.image_front`, `image_side`, `image_profile` - Three-angle references
- `avatars.elevenlabs_voice_id` - ElevenLabs voice mapping
- `avatars.physical_description` - For Kling Elements
- `videos.audio_url` - ElevenLabs voiceover URL
- `videos.has_audio`, `has_captions` - Feature flags
- `campaigns.product_footage_url` - Uploaded product video

---

## Environment Variables

Add these to your `.env.local`:

```env
# ElevenLabs (required for audio)
ELEVENLABS_API_KEY=your_elevenlabs_api_key

# Railway FFmpeg Service (required for captions/compositing)
RAILWAY_FFMPEG_URL=https://your-ffmpeg-service.railway.app
RAILWAY_API_KEY=your_railway_api_key

# Existing
FAL_KEY=your_fal_ai_key
ANTHROPIC_API_KEY=your_anthropic_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## Railway FFmpeg Service Deployment

The FFmpeg microservice handles:
- Audio/video muxing (`/mux`)
- Caption burning (`/captions`)
- Segment compositing (`/composite`)

### Deploy to Railway:

```bash
cd services/ffmpeg
railway login
railway init
railway up
```

### Endpoints:

**POST /mux**
```json
{
  "video_url": "https://...",
  "audio_url": "https://...",
  "output_format": "mp4",
  "resolution": "1080x1920"
}
```

**POST /captions**
```json
{
  "video_url": "https://...",
  "script": "Your hook text here",
  "style": {
    "fontsize": 52,
    "fontcolor": "white",
    "highlight_color": "yellow"
  }
}
```

**POST /composite**
```json
{
  "segments": [
    { "url": "https://hook.mp4", "duration": 3 },
    { "url": "https://product.mp4", "duration": 5 },
    { "url": "https://cta.mp4", "duration": 2 }
  ],
  "resolution": "1080x1920"
}
```

---

## Video Generation Pipeline Flow

```
1. Claude writes hook script
   ↓
2. Calculate script timing (~130 words/min)
   ↓
3. ElevenLabs generates voiceover
   ↓
4. Build Kling prompt with imperfection cues
   ↓
5. Kling generates avatar video (9:16, matching audio duration)
   ↓
6. FFmpeg muxes audio onto video
   ↓
7. [Optional] FFmpeg composites with product footage
   ↓
8. FFmpeg burns captions
   ↓
9. Upload final video to Supabase Storage
```

---

## Avatar Voice Mapping

| Avatar | ElevenLabs Voice ID | Voice Name |
|--------|---------------------|------------|
| Alex | EXAVITQu4vr4xnSDxMaL | Bella |
| Emma | EXAVITQu4vr4xnSDxMaL | Bella |
| Chris | VR6AewLTigWG4xSOukaG | Arnold |
| David | nPczCjzI2devNBSz7Koi | Brian |
| Lisa | jBpfuIE2acCO8z3wKNLl | Lily |
| Maria | jBpfuIE2acCO8z3wKNLl | Lily |
| James | pqHfZKP75CvOlQylNhV4 | Bill |
| Marcus | N2lVS1w4EtoT3dr4eOWO | Callum |
| Nina | ThT5KcBeYPX3keUQqHPh | Dorothy |
| Sophie | jsCqWAovK2LkecY7zXl4 | Freya |

---

## Testing Locally

Without FFmpeg service (audio only, no captions):
```bash
npm run dev
```

Videos will generate with audio but without burned captions. The FFmpeg service is required for caption burning and compositing.

---

## File Structure

```
distributo-v6/
├── lib/
│   └── video/
│       └── pipeline.js          # NEW: Complete generation pipeline
├── app/
│   └── api/
│       ├── avatars/
│       │   └── generate-references/  # NEW: Three-angle generation
│       ├── upload/
│       │   └── video/           # NEW: Product footage upload
│       └── campaigns/
│           └── create/          # UPDATED: Uses new pipeline
├── services/
│   └── ffmpeg/                  # NEW: Railway FFmpeg service
│       ├── index.js
│       ├── Dockerfile
│       └── package.json
└── supabase/
    └── migrations/
        └── 20260307_avatar_audio_pipeline.sql  # NEW: Schema updates
```

---

## Graceful Degradation

The pipeline handles missing services gracefully:

- **No ELEVENLABS_API_KEY**: Videos generate without audio
- **No RAILWAY_FFMPEG_URL**: Videos return without captions, audio unmuxed
- **No FAL_KEY**: Video generation skipped, placeholder saved
- **No product footage**: Hook-only video generated

All failures are logged but don't crash the pipeline.
