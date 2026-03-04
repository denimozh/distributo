# AI UGC Video Generation System Design

## The Question: Build Custom vs Use HeyGen?

### TL;DR Recommendation

**Build a HYBRID system:**
- Use **Nano Banana Pro** for character/scene image generation (cheap, consistent)
- Use **Veo 3.1** for image-to-video conversion (high quality motion)
- Use **HeyGen/Hedra** as FALLBACK for talking head only (when Veo fails or for specific use cases)
- Use **ElevenLabs** for voice (always)

This gives you:
- 70% cheaper than pure HeyGen
- Better character consistency (Nano Banana locks the face)
- More creative control
- Fallback reliability

---

## The Three Approaches Compared

| Approach | Cost/Video | Character Consistency | Quality | Complexity |
|----------|------------|----------------------|---------|------------|
| **HeyGen Only** | $0.50-1.00 | Limited (their avatars) | Good | Low |
| **Nano Banana + Veo 3** | $0.15-0.30 | Excellent (locked character) | Excellent | Medium |
| **Custom Pipeline** | $0.20-0.40 | Full control | Variable | High |

---

## Recommended System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                 EXPERIMENT ENGINE VIDEO PIPELINE                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  INPUT: Product Photo + Brand Details                           │
│     ↓                                                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ STEP 1: AI CREATIVE DIRECTION (Claude/GPT-4)            │   │
│  │ → Analyze product                                        │   │
│  │ → Generate script variations                             │   │
│  │ → Create scene descriptions                              │   │
│  │ → Define character persona                               │   │
│  └─────────────────────────────────────────────────────────┘   │
│     ↓                                                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ STEP 2: CHARACTER GENERATION (Nano Banana Pro)          │   │
│  │ → Generate consistent character face                     │   │
│  │ → Create 5 reference images (different angles)           │   │
│  │ → Lock character identity for all scenes                 │   │
│  │ → Apply "uglification" prompts for authenticity          │   │
│  └─────────────────────────────────────────────────────────┘   │
│     ↓                                                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ STEP 3: SCENE FRAME GENERATION (Nano Banana Edit)       │   │
│  │ → Generate first frame for each scene                    │   │
│  │ → Maintain character consistency via reference images    │   │
│  │ → Add product integration                                │   │
│  │ → Apply UGC aesthetic (imperfect lighting, angles)       │   │
│  └─────────────────────────────────────────────────────────┘   │
│     ↓                                                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ STEP 4: VIDEO GENERATION (Veo 3.1)                      │   │
│  │ → Image-to-video for each scene (4-8 seconds)           │   │
│  │ → Natural handheld camera movement                       │   │
│  │ → Character motion and expressions                       │   │
│  │ → Parallel generation for speed                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│     ↓                                                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ STEP 5: VOICE + LIP SYNC                                │   │
│  │ Option A: ElevenLabs + Hedra (lip sync on Veo output)   │   │
│  │ Option B: HeyGen talking head (fallback/hybrid)         │   │
│  │ → Generate voice audio                                   │   │
│  │ → Apply lip sync to video                                │   │
│  └─────────────────────────────────────────────────────────┘   │
│     ↓                                                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ STEP 6: POST-PRODUCTION (FFmpeg)                        │   │
│  │ → Stitch all scenes together                             │   │
│  │ → Add captions (auto-generated)                          │   │
│  │ → Add trending audio track                               │   │
│  │ → Apply final color grading                              │   │
│  │ → Export 9:16 for TikTok/Reels                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│     ↓                                                           │
│  OUTPUT: Multiple video variations ready for testing            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## The "Uglification" Prompt System

This is the SECRET to realistic AI UGC. You need to make videos LESS perfect.

### Master Authenticity Prompt

```javascript
const AUTHENTICITY_PROMPT = `
CRITICAL VISUAL REQUIREMENTS FOR REALISM:

CAMERA SETUP:
- Shot on iPhone 15 Pro Max in 4K
- Natural window light only (no studio lighting)
- Off-center, slightly imperfect framing
- Subtle phone-camera grain
- Occasional minor focus drift
- Handheld micro-movements

SKIN AND FACE:
- Visible pores on forehead and cheeks
- Uneven skin texture
- Facial asymmetry
- Under-eye darkness (mild)
- Smile lines and expression wrinkles
- Mild nose redness
- Natural lip texture (not glossy)
- Small imperfections (freckles, marks)

HAIR:
- Controlled flyaways
- Not perfectly styled
- Natural volume variation
- Some strands out of place

ENVIRONMENT:
- Lived-in background (not staged)
- Natural clutter (but not messy)
- Visible window or natural light source
- Real room acoustics implied
- Background slightly out of focus

CLOTHING:
- Casual, comfortable clothes
- Natural wrinkles and folds
- Not brand new looking
- Relatable everyday style

DELIVERY:
- Natural speech pauses
- Occasional "um" or breath
- Eye movement (not staring)
- Genuine micro-expressions
- Not over-performed
`;
```

---

## How Much Should Be User-Controlled vs Automated?

### Recommended User Input (Keep It Simple)

```
┌─────────────────────────────────────────────────────────────────┐
│ USER INPUT FORM                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ 1. PRODUCT (Required)                                           │
│    [ Upload product photo ]                                      │
│    [ Product name: _____________ ]                              │
│    [ One-line description: _____________ ]                      │
│                                                                  │
│ 2. TARGET AUDIENCE (Required)                                   │
│    [ ] Women 18-24          [ ] Men 18-24                       │
│    [ ] Women 25-34          [ ] Men 25-34                       │
│    [ ] Women 35-44          [ ] Men 35-44                       │
│    [ ] General audience                                          │
│                                                                  │
│ 3. VIDEO STYLE (Pick one)                                       │
│    ○ Testimonial - "I tried this and..."                        │
│    ○ Discovery - "POV: you just found..."                       │
│    ○ Problem/Solution - "If you struggle with..."               │
│    ○ Comparison - "I switched from X to this..."                │
│    ○ Tutorial - "Here's how I use..."                           │
│                                                                  │
│ 4. CREATOR PERSONA (Optional - we'll pick for you)              │
│    [ ] Let AI choose best match                                  │
│    [ ] Pick specific: [Emma ▼] [Alex ▼] [Sofia ▼]               │
│                                                                  │
│ 5. HOOK VARIATIONS TO TEST (Pick 2-4)                           │
│    [ ] Curiosity hook - "Wait, did you know..."                 │
│    [ ] POV hook - "POV: you just discovered..."                 │
│    [ ] Story hook - "Here's what happened when..."              │
│    [ ] Direct hook - "This product changed my..."               │
│    [ ] Question hook - "Anyone else dealing with..."            │
│                                                                  │
│ [ Generate 4 Video Variations ] → 2 credits                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### What Gets Automated (Hidden from User)

1. **Script generation** - AI writes full scripts based on inputs
2. **Scene breakdown** - AI splits script into filmable scenes
3. **Character selection/generation** - Matched to target audience
4. **Camera movements** - Natural handheld motion
5. **Lighting setup** - UGC-appropriate lighting
6. **Authenticity details** - The "uglification" prompts
7. **Audio/music selection** - Matched to platform trends
8. **Caption styling** - Platform-optimized text overlays

---

## API Integration Details

### Nano Banana Pro (via KIE.AI)

```javascript
// Character generation with consistency
const generateCharacter = async (persona) => {
  const response = await fetch('https://api.kie.ai/v1/images/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.KIE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'google/nano-banana-pro',
      prompt: `
        Portrait photo of ${persona.description}.
        ${AUTHENTICITY_PROMPT}
        Age: ${persona.age}, ${persona.ethnicity}
        Expression: natural, friendly, approachable
        Looking slightly off-camera (authentic selfie angle)
        9:16 aspect ratio, 1080x1920
      `,
      aspect_ratio: '9:16',
      num_images: 5, // Generate 5 reference angles
    })
  });
  return response.json();
};

// Scene frame with character consistency
const generateSceneFrame = async (characterRefs, sceneDescription) => {
  const response = await fetch('https://api.kie.ai/v1/images/edit', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.KIE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'google/nano-banana-edit',
      image: characterRefs[0], // Primary reference
      reference_images: characterRefs.slice(1), // Additional refs
      prompt: `
        ${sceneDescription}
        CRITICAL: Maintain exact character identity from reference.
        Same face, same features, same person.
        ${AUTHENTICITY_PROMPT}
      `,
      strength: 0.7, // Balance between reference and new scene
    })
  });
  return response.json();
};
```

### Veo 3.1 (via KIE.AI or Google AI)

```javascript
// Image to video with natural motion
const generateVideoFromFrame = async (frameUrl, motionPrompt) => {
  const response = await fetch('https://api.kie.ai/v1/video/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.KIE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'veo-3.1',
      image_url: frameUrl,
      prompt: `
        ${motionPrompt}
        
        CAMERA: Subtle handheld movement, slight drift, natural micro-shakes
        MOVEMENT: Person speaks naturally, subtle gestures, eye contact with camera
        DURATION: 6 seconds
        STYLE: Authentic UGC, not cinematic
        
        The person is recording themselves on a phone, casual selfie style.
        Natural blinking, breathing pauses, genuine expressions.
      `,
      duration: 6,
      aspect_ratio: '9:16',
    })
  });
  
  // Poll for completion
  const jobId = response.job_id;
  return await pollForCompletion(jobId);
};
```

### ElevenLabs + Lip Sync

```javascript
// Generate voice
const generateVoice = async (script, voiceId) => {
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': process.env.ELEVENLABS_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: script,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.4, // Lower = more natural variation
        similarity_boost: 0.7,
        style: 0.5,
      }
    })
  });
  return response.arrayBuffer();
};

// Apply lip sync (using Hedra or similar)
const applyLipSync = async (videoUrl, audioUrl) => {
  const response = await fetch('https://api.hedra.com/v1/lipsync', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.HEDRA_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      video_url: videoUrl,
      audio_url: audioUrl,
      sync_mode: 'natural', // vs 'precise'
    })
  });
  return response.json();
};
```

---

## Cost Breakdown Per Video

### Custom Pipeline (Nano Banana + Veo)

| Step | Provider | Cost |
|------|----------|------|
| Character generation (5 refs) | Nano Banana | $0.10 |
| Scene frames (3 scenes) | Nano Banana Edit | $0.06 |
| Video generation (3 × 6s) | Veo 3.1 | $0.15 |
| Voice generation | ElevenLabs | $0.03 |
| Lip sync | Hedra | $0.10 |
| **Total** | | **$0.44** |

### HeyGen Only

| Step | Provider | Cost |
|------|----------|------|
| Talking head (30s) | HeyGen | $0.50-1.00 |
| **Total** | | **$0.50-1.00** |

### Hybrid (Recommended)

| Step | Provider | Cost |
|------|----------|------|
| Character + scenes | Nano Banana | $0.16 |
| B-roll clips | Veo 3.1 | $0.10 |
| Talking head hook | HeyGen | $0.15 |
| Voice | ElevenLabs | $0.03 |
| **Total** | | **$0.44** |

**Your margin at $1.50/video: 70%**

---

## Complete Video Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ FINAL VIDEO STRUCTURE (30 seconds)                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ SCENE 1: HOOK (0-5s)                                            │
│ ├─ Type: Talking head                                           │
│ ├─ Generator: HeyGen OR Nano Banana + Veo + Lip Sync           │
│ ├─ Character: Looking at camera, holding phone                  │
│ ├─ Script: "POV: you just discovered..."                        │
│ └─ Captions: Bold, centered, animated                           │
│                                                                  │
│ SCENE 2: PROBLEM/CONTEXT (5-12s)                                │
│ ├─ Type: Talking head + product peek                            │
│ ├─ Generator: Nano Banana + Veo                                 │
│ ├─ Character: Showing frustration, then curiosity               │
│ ├─ Script: "I was so skeptical but..."                          │
│ └─ Captions: Standard UGC style                                 │
│                                                                  │
│ SCENE 3: DEMONSTRATION (12-22s)                                 │
│ ├─ Type: Product in hand / using product                        │
│ ├─ Generator: Nano Banana + Veo OR user upload                  │
│ ├─ Character: Interacting with product                          │
│ ├─ Script: Voice over describing benefits                       │
│ └─ Text overlays: Key benefit callouts                          │
│                                                                  │
│ SCENE 4: CTA (22-30s)                                           │
│ ├─ Type: Talking head                                           │
│ ├─ Generator: HeyGen OR Nano Banana + Veo                       │
│ ├─ Character: Excited, recommending                             │
│ ├─ Script: "Link in bio if you want to try it"                  │
│ └─ Captions: Bold CTA text                                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: MVP (Week 1-2)
- [ ] Integrate KIE.AI (Nano Banana + Veo 3.1)
- [ ] Build character generation with consistency
- [ ] Basic scene frame generation
- [ ] Simple FFmpeg stitching
- [ ] Manual testing and quality check

### Phase 2: Voice + Lip Sync (Week 3)
- [ ] ElevenLabs integration
- [ ] Hedra lip sync integration
- [ ] Audio-video synchronization
- [ ] Quality scoring for output

### Phase 3: Full Pipeline (Week 4)
- [ ] End-to-end automation
- [ ] Batch generation (multiple variations)
- [ ] HeyGen fallback for failures
- [ ] Real-time progress tracking

### Phase 4: Polish (Week 5-6)
- [ ] Caption auto-generation
- [ ] Trending audio library
- [ ] A/B test framework
- [ ] Export optimization

---

## Key Decision: User Prompt Control

### Option A: Minimal User Input (Recommended)

User provides:
- Product photo
- Product name
- Target audience
- Video style (dropdown)

AI handles everything else. This is what **Creatify, MakeUGC, and successful tools do.**

**Why:** Users don't know how to write good prompts. They want results, not control.

### Option B: Advanced Mode (Optional)

For power users who want control:
- Custom script editing
- Scene-by-scene adjustments
- Character customization
- Manual prompt tweaking

**Why:** Some agencies want full control. Offer as "Advanced Mode."

### Recommendation

**Default to Option A, unlock Option B for higher tiers.**

```
Starter ($49): Minimal input only
Creator ($99): Minimal + script editing
Growth ($179): Full control + advanced mode
```

---

## Summary: What to Build

1. **Use Nano Banana Pro** for character generation (consistency)
2. **Use Veo 3.1** for image-to-video (quality + motion)
3. **Use ElevenLabs** for voice (always)
4. **Use Hedra** for lip sync (cheaper than HeyGen)
5. **Use HeyGen** as fallback only (reliability)
6. **Keep user input minimal** (product + audience + style)
7. **Automate the "uglification"** (authenticity prompts)
8. **Build quality scoring** (auto-reject bad outputs)

This gives you:
- **70% margins** vs competitors
- **Better consistency** than HeyGen alone
- **Full creative control** without user complexity
- **Reliable fallbacks** for production use

---

## Next Steps

1. Sign up for KIE.AI (Nano Banana + Veo access)
2. Create test pipeline with 1 product
3. Generate 10 variations, assess quality
4. Build into Experiment Engine
5. Dogfood: use to market your own product
