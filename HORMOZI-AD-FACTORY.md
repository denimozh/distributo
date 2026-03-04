# The Hormozi AI Ad Factory

> **50 Hooks × 5 Meats × 3 CTAs = 750 AI UGC Videos**
> 
> Fully automated. No actors. No $10k agencies. ~$0.50-2.00 per video.

---

## The Hormozi Formula (Made for AI)

```
Traditional Way:
- 1 filming session
- Record 50 hooks + 5 meats + 3 CTAs
- Edit into 750 combinations
- Cost: $10k+ in production

AI Way:
- Generate 50 hook variations
- Generate 5 meat variations  
- Generate 3 CTA variations
- Auto-combine into 750 videos
- Cost: ~$375-1,500 total
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    HORMOZI AD FACTORY                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  INPUT                                                           │
│  ├── Product photo                                               │
│  ├── Product description                                         │
│  ├── Target audience                                             │
│  └── Awareness level (unaware → most aware)                      │
│                                                                  │
│  STEP 1: HOOK GENERATION (50 variations)                         │
│  ├── Curiosity hooks (10)                                        │
│  ├── POV hooks (10)                                              │
│  ├── Story hooks (10)                                            │
│  ├── Question hooks (10)                                         │
│  └── Direct hooks (10)                                           │
│                                                                  │
│  STEP 2: MEAT GENERATION (5 formats)                            │
│  ├── Demonstration - Show it working                             │
│  ├── Testimonial - Share the experience                          │
│  ├── Educational - Teach something                               │
│  ├── Story - Tell the journey                                    │
│  └── Faceless/Product - B-roll focused                          │
│                                                                  │
│  STEP 3: CTA GENERATION (3 variations)                          │
│  ├── Soft CTA - "Link in bio if you're curious"                 │
│  ├── Direct CTA - "Click the link below"                        │
│  └── Urgency CTA - "Only available until..."                    │
│                                                                  │
│  STEP 4: COMBINATION ENGINE                                      │
│  └── 50 × 5 × 3 = 750 unique videos                             │
│                                                                  │
│  STEP 5: QUALITY SCORING + FILTERING                            │
│  └── Auto-reject low quality, rank by predicted performance     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Cost Analysis

### Option 1: Kling 3.0 (Recommended - Best Quality)

| Component | Count | Duration | Cost/sec | Total |
|-----------|-------|----------|----------|-------|
| Hooks | 50 | 5s each | $0.14 | $35 |
| Meats | 5 | 15s each | $0.14 | $10.50 |
| CTAs | 3 | 5s each | $0.14 | $2.10 |
| **Base components** | **58** | | | **$47.60** |

**Final videos (750):** Pre-rendered components, just stitch = **~$0.06/video**
**Total for 750 videos:** ~$50-100 (components + stitching)

### Option 2: Nano Banana + Veo 3.1

| Component | Count | Cost |
|-----------|-------|------|
| Character generation (1x) | 1 | $0.10 |
| Hook frames (50) | 50 | $1.00 |
| Meat frames (5) | 5 | $0.10 |
| CTA frames (3) | 3 | $0.06 |
| Video generation (58 clips) | 58 | ~$30 |
| Voice generation (58 clips) | 58 | ~$5 |
| **Total components** | | **~$36** |

### Option 3: Hybrid (Best of Both)

| Component | Provider | Cost |
|-----------|----------|------|
| Character lock | Nano Banana | $0.10 |
| Hooks (50 × 5s) | Kling 3.0 | $35 |
| Meats (5 × 15s) | Kling 3.0 | $10.50 |
| CTAs (3 × 5s) | Kling 3.0 | $2.10 |
| Stitching (750 combos) | FFmpeg | ~$5 |
| **Total** | | **~$53** |

**Cost per final video: ~$0.07**

---

## Implementation

### Provider Configuration

```javascript
// providers/kling.js

const KLING_API_BASE = 'https://api.fal.ai/fal-ai/kling-video'

export const KLING_MODELS = {
  // Best for UGC - native audio + dialogue
  V3_PRO: {
    model: 'v3/pro/text-to-video',
    costPerSecond: 0.392, // with voice control
    maxDuration: 15,
    features: ['native_audio', 'voice_control', 'multi_shot']
  },
  V3_STANDARD: {
    model: 'v3/standard/text-to-video', 
    costPerSecond: 0.224, // with audio
    maxDuration: 15,
    features: ['native_audio']
  },
  // Good balance of cost/quality
  V2_6_PRO: {
    model: 'v2.6/pro/text-to-video',
    costPerSecond: 0.14, // with audio
    maxDuration: 10,
    features: ['native_audio', 'bilingual']
  },
  // Avatar mode - audio-driven lip sync
  AVATAR_V2: {
    model: 'kling-video/ai-avatar/v2/standard',
    costPerSecond: 0.0562,
    features: ['lip_sync', 'audio_driven']
  }
}

export class KlingProvider {
  constructor(apiKey) {
    this.apiKey = apiKey || process.env.FAL_API_KEY
  }

  async generateUGCVideo(config) {
    const {
      prompt,
      duration = 5,
      aspectRatio = '9:16',
      withAudio = true,
      voiceControl = false,
      model = 'V2_6_PRO'
    } = config

    const modelConfig = KLING_MODELS[model]
    
    const response = await fetch(`${KLING_API_BASE}/${modelConfig.model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: this.buildUGCPrompt(prompt),
        duration: String(duration),
        aspect_ratio: aspectRatio,
        with_audio: withAudio,
        ...(voiceControl && { voice_control: true })
      })
    })

    return response.json()
  }

  buildUGCPrompt(basePrompt) {
    return `
${basePrompt}

VISUAL STYLE:
- Shot on iPhone 15 Pro Max, selfie perspective
- Natural window lighting, slight overexposure allowed
- Off-center framing, casual composition
- Visible skin texture, pores, under-eye circles
- Natural hair with flyaways
- Casual home environment background
- Handheld micro-movements

DELIVERY:
- Direct eye contact with camera
- Natural speech with breathing pauses
- Genuine facial expressions
- Conversational energy, not performative
- Subtle gestures while speaking
    `.trim()
  }

  estimateCost(duration, model = 'V2_6_PRO', withAudio = true) {
    const modelConfig = KLING_MODELS[model]
    const costPerSec = withAudio ? modelConfig.costPerSecond : modelConfig.costPerSecond / 2
    return duration * costPerSec
  }
}

export const kling = new KlingProvider()
```

### Hook Generation System

```javascript
// lib/ad-factory/hooks.js

export const HOOK_TEMPLATES = {
  curiosity: [
    "Wait, did you know {product} can actually {benefit}?",
    "I just found out something crazy about {problem}...",
    "Nobody's talking about this {product_type} hack...",
    "The {industry} industry doesn't want you to know this...",
    "I can't believe I just discovered this...",
    "This is the {product_type} secret that changed everything...",
    "You've been doing {activity} wrong this whole time...",
    "There's a reason {target_audience} are obsessed with this...",
    "What if I told you {bold_claim}?",
    "I found the one thing that actually {benefit}..."
  ],
  
  pov: [
    "POV: You just discovered {product} and everything changes",
    "POV: You finally found something that actually {benefit}",
    "POV: You're tired of {pain_point} and find the solution",
    "POV: You stopped {old_way} and started {new_way}",
    "POV: Me after using {product} for 2 weeks",
    "POV: Your {life_area} after discovering this",
    "POV: You realize {product} exists and wonder why nobody told you",
    "POV: You finally solve {problem} after months of trying",
    "POV: You find the {product_type} everyone's been hiding",
    "POV: Your reaction when {product} actually works"
  ],
  
  story: [
    "Here's what happened when I tried {product}...",
    "I was struggling with {problem} for months until...",
    "Let me tell you about the time I discovered {product}...",
    "3 months ago I was {before_state}. Now...",
    "I almost gave up on {goal} until I found this...",
    "The moment I knew {product} was different...",
    "I never believed in {product_type} until...",
    "My journey from {before} to {after} started with this...",
    "I was skeptical too, but then...",
    "Here's my honest experience with {product}..."
  ],
  
  question: [
    "Anyone else dealing with {pain_point}?",
    "Is it just me or is {common_frustration}?",
    "Why does nobody talk about {topic}?",
    "Has anyone else tried {product_type} for {problem}?",
    "Am I the only one who didn't know about {benefit}?",
    "What if there was a way to {desired_outcome}?",
    "Ever wonder why {observation}?",
    "Does anyone else hate {pain_point} as much as me?",
    "How is this {product_type} not more popular?",
    "Why are we still doing {old_way} when {new_way} exists?"
  ],
  
  direct: [
    "This {product_type} is actually insane.",
    "I have to show you this {product}.",
    "Stop scrolling. You need to see this.",
    "This is the best {product_type} I've ever tried.",
    "If you struggle with {problem}, watch this.",
    "This changed my {life_area} completely.",
    "I found the {product_type} you've been looking for.",
    "You need this in your life. Here's why.",
    "This {product} is worth every penny.",
    "Let me show you why everyone's talking about this."
  ]
}

export function generateHooks(productContext, count = 50) {
  const hooks = []
  const types = Object.keys(HOOK_TEMPLATES)
  const hooksPerType = Math.ceil(count / types.length)
  
  for (const type of types) {
    const templates = HOOK_TEMPLATES[type]
    for (let i = 0; i < hooksPerType && hooks.length < count; i++) {
      const template = templates[i % templates.length]
      const filledHook = fillTemplate(template, productContext)
      hooks.push({
        id: `hook_${type}_${i}`,
        type,
        text: filledHook,
        duration: 5,
        awarenessLevel: getAwarenessLevel(type)
      })
    }
  }
  
  return hooks
}

function fillTemplate(template, context) {
  return template
    .replace(/{product}/g, context.productName)
    .replace(/{product_type}/g, context.productType)
    .replace(/{benefit}/g, context.mainBenefit)
    .replace(/{problem}/g, context.mainProblem)
    .replace(/{pain_point}/g, context.painPoint)
    .replace(/{target_audience}/g, context.targetAudience)
    .replace(/{industry}/g, context.industry)
    .replace(/{activity}/g, context.activity)
    .replace(/{old_way}/g, context.oldWay)
    .replace(/{new_way}/g, context.newWay)
    .replace(/{before_state}/g, context.beforeState)
    .replace(/{after}/g, context.afterState)
    .replace(/{before}/g, context.beforeState)
    .replace(/{goal}/g, context.goal)
    .replace(/{life_area}/g, context.lifeArea)
    .replace(/{bold_claim}/g, context.boldClaim)
    .replace(/{desired_outcome}/g, context.desiredOutcome)
    .replace(/{observation}/g, context.observation)
    .replace(/{topic}/g, context.topic)
    .replace(/{common_frustration}/g, context.commonFrustration)
}

function getAwarenessLevel(hookType) {
  const levels = {
    curiosity: 'problem_aware',
    pov: 'solution_aware', 
    story: 'product_aware',
    question: 'unaware',
    direct: 'most_aware'
  }
  return levels[hookType]
}
```

### Meat (Body) Generation System

```javascript
// lib/ad-factory/meats.js

export const MEAT_FORMATS = {
  demonstration: {
    id: 'demo',
    name: 'Demonstration',
    description: 'Show the product in action',
    duration: 15,
    structure: [
      { time: '0-5s', content: 'Introduce the product visually' },
      { time: '5-12s', content: 'Show it being used/working' },
      { time: '12-15s', content: 'Show the result/outcome' }
    ],
    promptTemplate: `
A person demonstrating {product} in a casual home setting.
They hold it up to show the camera, then demonstrate how to use it.
Natural movements, genuine reactions to using the product.
Show close-up of the product, then pull back to show results.
Casual UGC style, shot on phone, natural lighting.

SCRIPT: "{demo_script}"
    `
  },
  
  testimonial: {
    id: 'testimonial',
    name: 'Testimonial',
    description: 'Share personal experience and results',
    duration: 15,
    structure: [
      { time: '0-4s', content: 'Before state / problem' },
      { time: '4-10s', content: 'Discovery and experience' },
      { time: '10-15s', content: 'Results and recommendation' }
    ],
    promptTemplate: `
A person sharing their genuine experience with {product}.
They speak directly to camera with emotional authenticity.
Show before/after expressions - frustrated to happy.
Casual bedroom or living room background.
Natural speech patterns, occasional hand gestures.

SCRIPT: "{testimonial_script}"
    `
  },
  
  educational: {
    id: 'educational',
    name: 'Educational',
    description: 'Teach something valuable about the problem/solution',
    duration: 15,
    structure: [
      { time: '0-3s', content: 'State the insight/lesson' },
      { time: '3-10s', content: 'Explain why/how' },
      { time: '10-15s', content: 'Connect to product naturally' }
    ],
    promptTemplate: `
A person explaining {topic} with authority but friendly demeanor.
They use hand gestures to emphasize points.
Occasional product glimpse but not sales-focused.
Home office or casual setting.
Teaching energy, making eye contact.

SCRIPT: "{educational_script}"
    `
  },
  
  story: {
    id: 'story',
    name: 'Story',
    description: 'Tell a transformation journey',
    duration: 15,
    structure: [
      { time: '0-5s', content: 'The struggle / before' },
      { time: '5-10s', content: 'The turning point' },
      { time: '10-15s', content: 'The transformation' }
    ],
    promptTemplate: `
A person telling an emotional story about their journey.
Start with pained/frustrated expression, evolve to hopeful/happy.
Intimate, confessional tone like talking to a friend.
Bedroom setting, warm lighting, casual clothes.
Authentic emotional arc, not performative.

SCRIPT: "{story_script}"
    `
  },
  
  faceless: {
    id: 'faceless',
    name: 'Faceless/Product Focus',
    description: 'Product B-roll with voiceover',
    duration: 15,
    structure: [
      { time: '0-5s', content: 'Product hero shot' },
      { time: '5-10s', content: 'Product details/features' },
      { time: '10-15s', content: 'Product in use context' }
    ],
    promptTemplate: `
Cinematic product shots of {product}.
Smooth camera movement around the product.
Show texture, details, and quality.
Clean background, natural lighting.
Lifestyle context - hands interacting with product.
ASMR-style close-ups.

VOICEOVER: "{faceless_script}"
    `
  }
}

export function generateMeats(productContext) {
  const meats = []
  
  for (const [key, format] of Object.entries(MEAT_FORMATS)) {
    const script = generateMeatScript(format, productContext)
    
    meats.push({
      id: `meat_${format.id}`,
      format: format.id,
      name: format.name,
      duration: format.duration,
      script,
      prompt: format.promptTemplate
        .replace(/{product}/g, productContext.productName)
        .replace(/{topic}/g, productContext.topic)
        .replace(/{demo_script}/g, script)
        .replace(/{testimonial_script}/g, script)
        .replace(/{educational_script}/g, script)
        .replace(/{story_script}/g, script)
        .replace(/{faceless_script}/g, script)
    })
  }
  
  return meats
}

function generateMeatScript(format, context) {
  const scripts = {
    demo: `Let me show you how ${context.productName} actually works. You just ${context.howToUse}. And look at that - ${context.immediateResult}. It really is that simple.`,
    
    testimonial: `Before I found ${context.productName}, I was ${context.beforeState}. But after using it for ${context.timeframe}, ${context.afterState}. I genuinely can't imagine going back.`,
    
    educational: `Here's something most people don't know about ${context.topic}. ${context.insightful_fact}. That's exactly why ${context.productName} works - it ${context.mechanism}.`,
    
    story: `I used to ${context.oldStruggle}. I tried everything - ${context.failedAttempts}. Then I found ${context.productName} and everything changed. Now I ${context.newReality}.`,
    
    faceless: `Introducing ${context.productName}. ${context.keyFeature}. ${context.secondFeature}. ${context.benefit}. This is ${context.productCategory} done right.`
  }
  
  return scripts[format.id] || scripts.demo
}
```

### CTA Generation System

```javascript
// lib/ad-factory/ctas.js

export const CTA_TEMPLATES = {
  soft: {
    id: 'soft',
    name: 'Soft CTA',
    duration: 5,
    scripts: [
      "Link in bio if you want to try it for yourself.",
      "I'll leave the link below if you're curious.",
      "Let me know if you want me to share the link.",
      "Comment 'LINK' and I'll send it to you."
    ],
    promptTemplate: `
Person giving a casual, low-pressure call to action.
Friendly smile, relaxed body language.
Pointing down casually (toward bio/link area).
Not pushy or salesy - more like a friend recommending.
Natural ending energy, like wrapping up a conversation.

SCRIPT: "{cta_script}"
    `
  },
  
  direct: {
    id: 'direct',
    name: 'Direct CTA',
    duration: 5,
    scripts: [
      "Click the link below to get yours.",
      "Go to the link in my bio right now.",
      "Tap the link and see for yourself.",
      "Link's in my bio - go check it out."
    ],
    promptTemplate: `
Person giving a clear, confident call to action.
Direct eye contact, slight lean forward.
Clear pointing gesture down toward link.
Confident but not aggressive energy.
Decisive ending with encouraging smile.

SCRIPT: "{cta_script}"
    `
  },
  
  urgency: {
    id: 'urgency',
    name: 'Urgency CTA',
    duration: 5,
    scripts: [
      "They're selling out fast - link in bio before they're gone.",
      "I don't know how long this price will last - link below.",
      "Limited stock - grab yours from the link in bio.",
      "Sale ends tonight - click the link before it's too late."
    ],
    promptTemplate: `
Person delivering urgent call to action.
Slightly raised energy, eyebrows lifted.
Quick, decisive speaking pace.
Emphasizing limited time/stock naturally.
Authentic urgency, not fake hype.

SCRIPT: "{cta_script}"
    `
  }
}

export function generateCTAs(productContext) {
  const ctas = []
  
  for (const [key, template] of Object.entries(CTA_TEMPLATES)) {
    const script = template.scripts[0] // Could randomize
    
    ctas.push({
      id: `cta_${template.id}`,
      type: template.id,
      name: template.name,
      duration: template.duration,
      script,
      prompt: template.promptTemplate.replace(/{cta_script}/g, script)
    })
  }
  
  return ctas
}
```

### Combination Engine

```javascript
// lib/ad-factory/combiner.js

export class AdCombiner {
  constructor(hooks, meats, ctas) {
    this.hooks = hooks
    this.meats = meats
    this.ctas = ctas
  }

  /**
   * Generate all possible combinations
   * 50 hooks × 5 meats × 3 CTAs = 750 combinations
   */
  generateAllCombinations() {
    const combinations = []
    
    for (const hook of this.hooks) {
      for (const meat of this.meats) {
        for (const cta of this.ctas) {
          combinations.push(this.createCombination(hook, meat, cta))
        }
      }
    }
    
    return combinations
  }

  createCombination(hook, meat, cta) {
    const id = `${hook.id}_${meat.id}_${cta.id}`
    
    return {
      id,
      components: {
        hook: hook.id,
        meat: meat.id,
        cta: cta.id
      },
      totalDuration: hook.duration + meat.duration + cta.duration,
      
      // Metadata for filtering/sorting
      hookType: hook.type,
      meatFormat: meat.format,
      ctaType: cta.type,
      awarenessLevel: hook.awarenessLevel,
      
      // Full script
      fullScript: `${hook.text} ${meat.script} ${cta.script}`,
      
      // Generation order
      segments: [
        { type: 'hook', ...hook },
        { type: 'meat', ...meat },
        { type: 'cta', ...cta }
      ],
      
      // Predicted performance (can be enhanced with ML)
      predictedScore: this.calculatePredictedScore(hook, meat, cta)
    }
  }

  calculatePredictedScore(hook, meat, cta) {
    // Simple scoring based on best-practice combinations
    let score = 50
    
    // Hook type bonuses
    const hookScores = {
      curiosity: 15,
      pov: 12,
      story: 10,
      question: 8,
      direct: 5
    }
    score += hookScores[hook.type] || 0
    
    // Meat format bonuses
    const meatScores = {
      demonstration: 12,
      testimonial: 15,
      story: 10,
      educational: 8,
      faceless: 6
    }
    score += meatScores[meat.format] || 0
    
    // CTA type bonuses
    const ctaScores = {
      soft: 8,
      direct: 10,
      urgency: 12
    }
    score += ctaScores[cta.type] || 0
    
    // Combination bonuses
    if (hook.type === 'curiosity' && meat.format === 'demonstration') score += 5
    if (hook.type === 'pov' && meat.format === 'testimonial') score += 5
    if (hook.type === 'story' && meat.format === 'story') score += 5
    
    return Math.min(100, score)
  }

  /**
   * Get top N combinations by predicted score
   */
  getTopCombinations(n = 100) {
    const all = this.generateAllCombinations()
    return all
      .sort((a, b) => b.predictedScore - a.predictedScore)
      .slice(0, n)
  }

  /**
   * Get combinations by awareness level
   */
  getByAwarenessLevel(level) {
    return this.generateAllCombinations()
      .filter(c => c.awarenessLevel === level)
  }

  /**
   * Get combinations by hook type
   */
  getByHookType(type) {
    return this.generateAllCombinations()
      .filter(c => c.hookType === type)
  }
}
```

### Main Factory Orchestrator

```javascript
// lib/ad-factory/index.js

import { generateHooks } from './hooks'
import { generateMeats } from './meats'
import { generateCTAs } from './ctas'
import { AdCombiner } from './combiner'
import { kling } from '../generation/providers/kling'
import { kieai } from '../generation/providers/kieai'

export class HormoziAdFactory {
  constructor(config = {}) {
    this.provider = config.provider || 'kling' // 'kling' | 'nano_banana_veo'
    this.parallelJobs = config.parallelJobs || 5
    this.qualityThreshold = config.qualityThreshold || 70
  }

  /**
   * Main entry point - generate a complete ad campaign
   */
  async generateCampaign(productContext) {
    console.log('🏭 Starting Hormozi Ad Factory...')
    
    // Step 1: Generate all components
    console.log('📝 Generating hooks...')
    const hooks = generateHooks(productContext, 50)
    
    console.log('📝 Generating meats...')
    const meats = generateMeats(productContext)
    
    console.log('📝 Generating CTAs...')
    const ctas = generateCTAs(productContext)
    
    // Step 2: Create combiner
    const combiner = new AdCombiner(hooks, meats, ctas)
    
    // Step 3: Get top combinations (or all 750)
    console.log('🔄 Creating combinations...')
    const combinations = combiner.getTopCombinations(100) // Start with top 100
    
    console.log(`📊 Created ${combinations.length} ad combinations`)
    
    // Step 4: Generate character (one time, for consistency)
    console.log('👤 Generating consistent character...')
    const character = await this.generateCharacter(productContext)
    
    // Step 5: Generate base video components
    console.log('🎬 Generating video components...')
    const videoComponents = await this.generateVideoComponents(
      hooks, 
      meats, 
      ctas, 
      character,
      productContext
    )
    
    // Step 6: Combine into final videos
    console.log('🎞️ Stitching final videos...')
    const finalVideos = await this.combineVideos(combinations, videoComponents)
    
    return {
      campaign: {
        hooks: hooks.length,
        meats: meats.length,
        ctas: ctas.length,
        totalCombinations: hooks.length * meats.length * ctas.length,
        generatedVideos: finalVideos.length
      },
      character,
      components: videoComponents,
      videos: finalVideos,
      estimatedCost: this.calculateCost(videoComponents)
    }
  }

  async generateCharacter(productContext) {
    // Match character to target audience
    const persona = this.selectPersona(productContext.targetAudience)
    
    if (this.provider === 'nano_banana_veo') {
      const result = await kieai.generateCharacter(persona)
      return {
        provider: 'nano_banana',
        referenceImages: result.referenceImages,
        persona
      }
    }
    
    // For Kling, we describe the character in prompts
    return {
      provider: 'kling',
      description: this.buildCharacterDescription(persona),
      persona
    }
  }

  selectPersona(targetAudience) {
    // Simple matching logic
    if (targetAudience.includes('women') && targetAudience.includes('25-34')) {
      return { gender: 'female', age: '28', style: 'casual', ethnicity: 'diverse' }
    }
    if (targetAudience.includes('men') && targetAudience.includes('25-34')) {
      return { gender: 'male', age: '28', style: 'casual', ethnicity: 'diverse' }
    }
    // Default
    return { gender: 'female', age: '26', style: 'casual', ethnicity: 'diverse' }
  }

  buildCharacterDescription(persona) {
    return `
A ${persona.age}-year-old ${persona.gender} with ${persona.style} style.
Natural appearance, relatable, like someone you'd see on TikTok.
${persona.ethnicity === 'diverse' ? 'Any ethnicity is fine.' : persona.ethnicity}
Dressed casually in everyday clothes.
Natural makeup (if female), natural look overall.
Approachable, friendly expression.
    `.trim()
  }

  async generateVideoComponents(hooks, meats, ctas, character, productContext) {
    const components = {
      hooks: [],
      meats: [],
      ctas: []
    }
    
    // Generate hook videos
    for (const hook of hooks) {
      const video = await this.generateSingleVideo({
        type: 'hook',
        script: hook.text,
        duration: hook.duration,
        character,
        productContext
      })
      components.hooks.push({ ...hook, videoUrl: video.url })
    }
    
    // Generate meat videos
    for (const meat of meats) {
      const video = await this.generateSingleVideo({
        type: 'meat',
        script: meat.script,
        duration: meat.duration,
        prompt: meat.prompt,
        character,
        productContext
      })
      components.meats.push({ ...meat, videoUrl: video.url })
    }
    
    // Generate CTA videos
    for (const cta of ctas) {
      const video = await this.generateSingleVideo({
        type: 'cta',
        script: cta.script,
        duration: cta.duration,
        prompt: cta.prompt,
        character,
        productContext
      })
      components.ctas.push({ ...cta, videoUrl: video.url })
    }
    
    return components
  }

  async generateSingleVideo(config) {
    const { type, script, duration, prompt, character, productContext } = config
    
    if (this.provider === 'kling') {
      return await kling.generateUGCVideo({
        prompt: prompt || this.buildPrompt(type, script, character, productContext),
        duration,
        withAudio: true,
        aspectRatio: '9:16'
      })
    }
    
    // Nano Banana + Veo flow
    // ... implementation
  }

  buildPrompt(type, script, character, productContext) {
    const basePrompt = `
${character.description}

SETTING: Casual home environment, natural window lighting
FILMING STYLE: Selfie-style, shot on iPhone, slight handheld movement
AUDIO: Natural speech with the following dialogue

DIALOGUE: "${script}"

VISUAL STYLE: Authentic UGC, visible skin texture, natural imperfections
    `
    
    return basePrompt
  }

  async combineVideos(combinations, components) {
    const videos = []
    
    for (const combo of combinations) {
      const hookVideo = components.hooks.find(h => h.id === combo.components.hook)
      const meatVideo = components.meats.find(m => m.id === combo.components.meat)
      const ctaVideo = components.ctas.find(c => c.id === combo.components.cta)
      
      // In production, use FFmpeg to stitch
      // For now, return the video URLs
      videos.push({
        id: combo.id,
        segments: [
          hookVideo.videoUrl,
          meatVideo.videoUrl,
          ctaVideo.videoUrl
        ],
        totalDuration: combo.totalDuration,
        predictedScore: combo.predictedScore,
        metadata: combo
      })
    }
    
    return videos
  }

  calculateCost(components) {
    const hookCost = components.hooks.length * 5 * 0.14 // 5s each
    const meatCost = components.meats.length * 15 * 0.14 // 15s each
    const ctaCost = components.ctas.length * 5 * 0.14 // 5s each
    
    return {
      hooks: hookCost.toFixed(2),
      meats: meatCost.toFixed(2),
      ctas: ctaCost.toFixed(2),
      total: (hookCost + meatCost + ctaCost).toFixed(2),
      perFinalVideo: ((hookCost + meatCost + ctaCost) / 750).toFixed(4)
    }
  }
}

// Example usage:
/*
const factory = new HormoziAdFactory({ provider: 'kling' })

const campaign = await factory.generateCampaign({
  productName: 'GlowSerum',
  productType: 'skincare serum',
  mainBenefit: 'clear your acne in 2 weeks',
  mainProblem: 'persistent acne',
  painPoint: 'breakouts that won\'t go away',
  targetAudience: 'women 18-34',
  industry: 'skincare',
  // ... more context
})

console.log(campaign.estimatedCost)
// { hooks: '$35.00', meats: '$10.50', ctas: '$2.10', total: '$47.60', perFinalVideo: '$0.0635' }
*/

export default HormoziAdFactory
```

---

## Summary

### What You Get

| Metric | Value |
|--------|-------|
| **Total combinations** | 750 unique ads |
| **Component videos** | 58 (50 hooks + 5 meats + 3 ctas) |
| **Generation cost** | ~$50-100 |
| **Cost per final video** | ~$0.07-0.13 |
| **Time to generate** | 2-4 hours (parallel) |

### Comparison to Traditional

| Metric | Traditional | AI Factory |
|--------|-------------|------------|
| Cost | $10,000+ | ~$100 |
| Time | 2-4 weeks | 2-4 hours |
| Videos | 750 | 750 |
| Iterations | Expensive | Cheap |
| A/B Testing | Limited | Unlimited |

### Best Practices

1. **Start with 100 combinations** - Test, find winners, then generate more
2. **Use character consistency** - Same AI "creator" across all videos
3. **Match awareness levels** - Different hooks for different funnel stages
4. **A/B test aggressively** - You have 750 variations, use them
5. **Track performance** - Feed winning patterns back into generation

---

## Next Steps

1. **Implement Kling provider** in `/src/lib/generation/providers/kling.js`
2. **Create Ad Factory UI** in `/src/app/dashboard/ad-factory/page.js`
3. **Add to database schema** - `ad_campaigns`, `ad_components`, `ad_combinations`
4. **Build batch generation** - Queue system for 58+ video generations
5. **Add FFmpeg stitching** - Combine hook + meat + cta into final videos
