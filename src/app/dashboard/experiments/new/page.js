'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft,
  ArrowRight,
  Sparkles,
  FlaskConical,
  Check,
  Copy,
  Download,
  RefreshCw,
  Loader2,
  Video,
  Image,
  Type,
  Wand2
} from 'lucide-react'

// Blueprints (same as vault)
const blueprints = [
  { id: 1, niche: 'skincare', hook_type: 'curiosity', format: 'talking_head', script_template: 'POV: you just discovered the [PRODUCT_TYPE] that actually [BENEFIT]... I was so skeptical at first but after [TIME_PERIOD], my [PROBLEM] is completely [RESULT]. The secret is [KEY_INGREDIENT/FEATURE]. Link in bio if you want to try it.' },
  { id: 2, niche: 'skincare', hook_type: 'problem', format: 'talking_head', script_template: 'If you\'re struggling with [PROBLEM], stop scrolling. I tried literally everything - [LIST_FAILED_SOLUTIONS] - nothing worked. Then I found [PRODUCT] and within [TIME_PERIOD], [SPECIFIC_RESULT]. Comment "INFO" and I\'ll send you the link.' },
  { id: 3, niche: 'saas', hook_type: 'problem', format: 'talking_head', script_template: 'If you\'re still [MANUAL_PROCESS], you\'re wasting [TIME/MONEY]. I used to spend [TIME_AMOUNT] every [FREQUENCY] doing [TASK]. Then I found [PRODUCT] and now it takes [REDUCED_TIME]. Literally saved me [HOURS/DOLLARS] last [TIME_PERIOD]. Link in bio if you want to try it.' },
  { id: 4, niche: 'saas', hook_type: 'story', format: 'talking_head', script_template: 'I almost quit my [JOB/BUSINESS] because of [PROBLEM]. I was working [LONG_HOURS] just to [PAINFUL_TASK]. My [RELATIONSHIP/HEALTH] was suffering. Then a friend told me about [PRODUCT]. Now I [NEW_REALITY] and actually have time for [LIFE_BENEFIT]. Comment "HOW" if you want me to show you my setup.' },
  { id: 5, niche: 'ecommerce', hook_type: 'curiosity', format: 'product_demo', script_template: 'Wait until you see what this [PRODUCT_TYPE] does... [DEMONSTRATE_FEATURE]. I know, right? And it\'s only [PRICE]. I\'ve been using it for [TIME_PERIOD] and [BENEFIT]. TikTok shop link in bio.' },
]

const hookOptions = [
  { value: 'curiosity', label: 'Curiosity', description: 'POV, secrets, "wait until you see..."' },
  { value: 'problem', label: 'Problem', description: 'Direct pain point, "if you struggle with..."' },
  { value: 'story', label: 'Story', description: 'Narrative hook, "storytime..."' },
  { value: 'direct', label: 'Direct', description: 'Straight to the point, no fluff' },
]

const avatarOptions = [
  { value: 'emma', label: 'Emma', description: 'Female, 25-30, casual' },
  { value: 'sarah', label: 'Sarah', description: 'Female, 30-35, professional' },
  { value: 'alex', label: 'Alex', description: 'Male, 25-30, energetic' },
  { value: 'marcus', label: 'Marcus', description: 'Male, 35-40, authoritative' },
]

const ctaOptions = [
  { value: 'link_bio', label: 'Link in Bio' },
  { value: 'comment', label: 'Comment trigger' },
  { value: 'shop', label: 'Shop link' },
  { value: 'none', label: 'No CTA' },
]

export default function NewExperimentPage() {
  const searchParams = useSearchParams()
  const blueprintId = searchParams.get('blueprint')
  const templateFromUrl = searchParams.get('template')
  
  const [step, setStep] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  
  // Form state
  const [productInfo, setProductInfo] = useState({
    name: 'Experiment Engine',
    description: 'AI tool that finds your winning content formula through structured experiments',
    niche: 'saas',
    targetAudience: 'TikTok Shop sellers, DTC brands, content creators who want to scale their content',
    keyBenefits: 'Stop guessing what content works, 10x faster than manual testing, AI learns what YOUR audience likes',
  })
  
  const [selectedBlueprint, setSelectedBlueprint] = useState(null)
  const [experimentConfig, setExperimentConfig] = useState({
    hooks: ['curiosity', 'problem'],
    avatars: ['emma', 'alex'],
    ctas: ['link_bio'],
  })
  
  const [generatedScripts, setGeneratedScripts] = useState([])
  const [copiedIndex, setCopiedIndex] = useState(null)

  // Load blueprint if specified
  useEffect(() => {
    if (blueprintId) {
      const bp = blueprints.find(b => b.id === parseInt(blueprintId))
      if (bp) {
        setSelectedBlueprint(bp)
        setExperimentConfig(prev => ({
          ...prev,
          hooks: [bp.hook_type],
        }))
      }
    }
    if (templateFromUrl) {
      setSelectedBlueprint({ script_template: templateFromUrl })
    }
  }, [blueprintId, templateFromUrl])

  const generateScripts = async () => {
    setIsGenerating(true)
    
    // Generate script variations based on config
    // In production, this calls Claude API
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const scripts = []
    let index = 0
    
    for (const hook of experimentConfig.hooks) {
      for (const avatar of experimentConfig.avatars) {
        index++
        
        // Generate adapted script based on hook type
        let script = ''
        if (hook === 'curiosity') {
          script = `POV: you just discovered the content tool that actually tells you what works for YOUR audience.

I was so skeptical - another AI tool promising results? But after running just 3 experiments, I found out my audience responds 2.4x better to story hooks than direct pitches.

The secret? Structured testing. Not posting and praying.

${productInfo.name} runs experiments and learns what YOUR specific audience likes.

Link in bio if you want to stop guessing.`
        } else if (hook === 'problem') {
          script = `If you're still posting content and hoping something sticks, you're wasting hours.

I used to spend 10+ hours a week creating content with NO idea what would actually work.

Then I found ${productInfo.name} - it runs structured experiments and tells you EXACTLY what hooks, formats, and styles your audience responds to.

Now I create 1/4 the content but get 3x the engagement.

Comment "HOW" and I'll show you my experiment results.`
        } else if (hook === 'story') {
          script = `I almost gave up on content creation last month.

I was posting every day, trying every trend, changing my style constantly... nothing was working consistently.

Then a friend showed me how they use ${productInfo.name} to run actual experiments on their content.

3 weeks later? I have 8 confirmed patterns about what MY audience likes. Not generic advice - data from MY posts.

Comment "PATTERNS" if you want me to show you how it works.`
        } else {
          script = `This is how I figure out what content works.

${productInfo.name} - it generates video variations, I post them, log the results, and it tells me what's actually working.

No more guessing. No more copying trends that don't fit my brand.

After 2 experiment cycles, I know: story hooks get 47% more saves, slideshow format beats talking head for my niche, and curiosity CTAs drive 2x more comments.

Link in bio to try it.`
        }
        
        scripts.push({
          id: index,
          hook_type: hook,
          avatar: avatar,
          cta: experimentConfig.ctas[0],
          script,
          status: 'ready',
        })
      }
    }
    
    setGeneratedScripts(scripts)
    setIsGenerating(false)
    setStep(3)
  }

  const copyScript = (script, index) => {
    navigator.clipboard.writeText(script)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const downloadAllScripts = () => {
    const content = generatedScripts.map((s, i) => 
      `=== Video ${i + 1} ===\nHook: ${s.hook_type}\nAvatar: ${s.avatar}\n\n${s.script}\n\n`
    ).join('\n---\n\n')
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `experiment-scripts-${Date.now()}.txt`
    a.click()
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard/experiments" className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          Back to Experiments
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FlaskConical className="w-6 h-6 text-green-500" />
          New Experiment
        </h1>
        <p className="text-gray-500 mt-1">Generate script variations to test what works</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-4 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm ${
              step >= s ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {step > s ? <Check className="w-4 h-4" /> : s}
            </div>
            <span className={`text-sm font-medium ${step >= s ? 'text-gray-900' : 'text-gray-400'}`}>
              {s === 1 ? 'Product Info' : s === 2 ? 'Configure Test' : 'Get Scripts'}
            </span>
            {s < 3 && <div className="w-12 h-0.5 bg-gray-200" />}
          </div>
        ))}
      </div>

      {/* Step 1: Product Info */}
      {step === 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tell us about your product</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
              <input
                type="text"
                value={productInfo.name}
                onChange={(e) => setProductInfo({ ...productInfo, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g., Experiment Engine"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">One-line Description</label>
              <input
                type="text"
                value={productInfo.description}
                onChange={(e) => setProductInfo({ ...productInfo, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="What does it do in one sentence?"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Niche</label>
              <select
                value={productInfo.niche}
                onChange={(e) => setProductInfo({ ...productInfo, niche: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              >
                <option value="saas">SaaS / Software</option>
                <option value="ecommerce">E-commerce / Products</option>
                <option value="skincare">Skincare / Beauty</option>
                <option value="supplements">Supplements / Health</option>
                <option value="fashion">Fashion / Apparel</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
              <input
                type="text"
                value={productInfo.targetAudience}
                onChange={(e) => setProductInfo({ ...productInfo, targetAudience: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Who is this for?"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Key Benefits (comma separated)</label>
              <textarea
                value={productInfo.keyBenefits}
                onChange={(e) => setProductInfo({ ...productInfo, keyBenefits: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="What problems does it solve?"
              />
            </div>
          </div>
          
          <div className="flex justify-end mt-6">
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Configure Experiment */}
      {step === 2 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Configure your experiment</h2>
          <p className="text-gray-500 text-sm mb-6">Select the variables you want to test. We'll generate one script for each combination.</p>
          
          {/* Hook Types */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Hook Types to Test</label>
            <div className="grid grid-cols-2 gap-3">
              {hookOptions.map((hook) => (
                <label
                  key={hook.value}
                  className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    experimentConfig.hooks.includes(hook.value)
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={experimentConfig.hooks.includes(hook.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setExperimentConfig({ ...experimentConfig, hooks: [...experimentConfig.hooks, hook.value] })
                      } else {
                        setExperimentConfig({ ...experimentConfig, hooks: experimentConfig.hooks.filter(h => h !== hook.value) })
                      }
                    }}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{hook.label}</p>
                    <p className="text-sm text-gray-500">{hook.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Avatars */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Avatars/Personas to Test</label>
            <div className="grid grid-cols-2 gap-3">
              {avatarOptions.map((avatar) => (
                <label
                  key={avatar.value}
                  className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    experimentConfig.avatars.includes(avatar.value)
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={experimentConfig.avatars.includes(avatar.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setExperimentConfig({ ...experimentConfig, avatars: [...experimentConfig.avatars, avatar.value] })
                      } else {
                        setExperimentConfig({ ...experimentConfig, avatars: experimentConfig.avatars.filter(a => a !== avatar.value) })
                      }
                    }}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{avatar.label}</p>
                    <p className="text-sm text-gray-500">{avatar.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* CTA Type */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">CTA Style</label>
            <div className="flex gap-3">
              {ctaOptions.map((cta) => (
                <label
                  key={cta.value}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition-all ${
                    experimentConfig.ctas.includes(cta.value)
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    checked={experimentConfig.ctas.includes(cta.value)}
                    onChange={() => setExperimentConfig({ ...experimentConfig, ctas: [cta.value] })}
                  />
                  <span className="font-medium text-gray-900">{cta.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Experiment Preview */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600">
              <strong>Experiment Matrix:</strong> {experimentConfig.hooks.length} hooks × {experimentConfig.avatars.length} avatars = {' '}
              <span className="text-green-600 font-bold">{experimentConfig.hooks.length * experimentConfig.avatars.length} video scripts</span>
            </p>
          </div>
          
          <div className="flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-2.5 text-gray-600 hover:text-gray-900 transition-colors"
            >
              Back
            </button>
            <button
              onClick={generateScripts}
              disabled={experimentConfig.hooks.length === 0 || experimentConfig.avatars.length === 0 || isGenerating}
              className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  Generate Scripts
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Generated Scripts */}
      {step === 3 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Your Experiment Scripts</h2>
              <p className="text-gray-500 text-sm">{generatedScripts.length} variations ready to record</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Regenerate
              </button>
              <button
                onClick={downloadAllScripts}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download All
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {generatedScripts.map((script, index) => (
              <div key={script.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {script.hook_type} hook • {script.avatar}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      script.hook_type === 'curiosity' ? 'bg-purple-100 text-purple-700' :
                      script.hook_type === 'problem' ? 'bg-red-100 text-red-700' :
                      script.hook_type === 'story' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {script.hook_type}
                    </span>
                  </div>
                </div>

                {/* Script Content */}
                <div className="p-4">
                  <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                    {script.script}
                  </p>
                </div>

                {/* Actions */}
                <div className="px-4 py-3 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={() => copyScript(script.script, index)}
                    className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-green-600 transition-colors"
                  >
                    {copiedIndex === index ? (
                      <>
                        <Check className="w-4 h-4 text-green-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy Script
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Next Steps */}
          <div className="mt-8 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-3">📋 Next Steps</h3>
            <ol className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                <span>Record yourself reading each script (or use AI avatar tool like HeyGen/MakeUGC)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                <span>Post videos to TikTok/Instagram over 2-3 days (not all at once)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                <span>Wait 48-72 hours for metrics to stabilize</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">4</span>
                <span>Come back to log results and see which hook/style won</span>
              </li>
            </ol>
            
            <div className="mt-4 pt-4 border-t border-green-200">
              <Link
                href="/dashboard/experiments"
                className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
              >
                Go to Experiments Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
