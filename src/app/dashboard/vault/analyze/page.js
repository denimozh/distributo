'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Link2, 
  Loader2, 
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Play,
  Sparkles
} from 'lucide-react'

export default function AnalyzeUrlPage() {
  const [url, setUrl] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [error, setError] = useState(null)

  const handleAnalyze = async () => {
    if (!url.trim()) return
    
    setIsAnalyzing(true)
    setError(null)
    setAnalysis(null)

    // Simulate analysis (in production, this calls Claude API)
    setTimeout(() => {
      // Mock analysis result
      setAnalysis({
        platform: url.includes('tiktok') ? 'TikTok' : url.includes('instagram') ? 'Instagram' : 'Unknown',
        hook_type: 'curiosity',
        format: 'talking_head',
        estimated_views: '1.2M',
        transcript: 'POV: you just discovered the skincare product that actually cleared your acne in 2 weeks. I was so skeptical at first but honestly my skin has never looked better. The secret is niacinamide. Link in bio if you want to try it.',
        structure: {
          hook: { text: 'POV: you just discovered...', duration: '0-3s', type: 'curiosity' },
          problem: { text: 'I was so skeptical...', duration: '3-8s', type: 'relatable_struggle' },
          solution: { text: 'My skin has never looked better...', duration: '8-18s', type: 'transformation' },
          cta: { text: 'Link in bio', duration: '18-22s', type: 'link_bio' }
        },
        why_it_works: [
          'POV format creates immediate curiosity and personal connection',
          'Acknowledging skepticism makes it relatable and trustworthy',
          'Specific timeframe (2 weeks) adds credibility',
          'Revealing a "secret" ingredient provides value',
        ],
        script_template: 'POV: you just discovered the [PRODUCT_TYPE] that actually [BENEFIT] in [TIME_PERIOD]. I was so skeptical at first but honestly [RESULT]. The secret is [KEY_INGREDIENT/FEATURE]. Link in bio if you want to try it.',
      })
      setIsAnalyzing(false)
    }, 2000)
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard/vault" className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block">
          ← Back to Vault
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Link2 className="w-6 h-6 text-blue-500" />
          Analyze Viral Video
        </h1>
        <p className="text-gray-500 mt-1">Paste a TikTok or Instagram URL to extract the winning formula</p>
      </div>

      {/* URL Input */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Video URL
        </label>
        <div className="flex gap-3">
          <input
            type="url"
            placeholder="https://tiktok.com/@user/video/... or https://instagram.com/reel/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <button
            onClick={handleAnalyze}
            disabled={!url.trim() || isAnalyzing}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Analyze
              </>
            )}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          We'll extract the hook, structure, and success factors from this video
        </p>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">Analysis failed</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6">
          {/* Success Banner */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-green-800">Analysis complete!</p>
              <p className="text-sm text-green-600 mt-1">
                {analysis.platform} video • {analysis.hook_type} hook • {analysis.format.replace('_', ' ')}
              </p>
            </div>
          </div>

          {/* Transcript */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-3">📝 Transcript</h3>
            <p className="text-gray-700 bg-gray-50 p-4 rounded-lg italic">
              "{analysis.transcript}"
            </p>
          </div>

          {/* Structure Breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">🎬 Structure Breakdown</h3>
            <div className="space-y-3">
              {Object.entries(analysis.structure).map(([key, section]) => (
                <div key={key} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="w-24 flex-shrink-0">
                    <span className="text-xs font-medium text-gray-500 uppercase">{key}</span>
                    <p className="text-sm font-medium text-gray-900">{section.duration}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">"{section.text}"</p>
                    <span className="text-xs text-gray-500 mt-1 inline-block">{section.type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Why It Works */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-3">💡 Why This Works</h3>
            <ul className="space-y-2">
              {analysis.why_it_works.map((reason, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-green-500 mt-1">✓</span>
                  {reason}
                </li>
              ))}
            </ul>
          </div>

          {/* Script Template */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-3">📋 Reusable Template</h3>
            <p className="text-gray-700 bg-white p-4 rounded-lg border border-green-200">
              {analysis.script_template}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Replace the [PLACEHOLDERS] with your product details
            </p>
          </div>

          {/* Action Button */}
          <div className="flex justify-center">
            <Link
              href={`/dashboard/experiments/new?template=${encodeURIComponent(analysis.script_template)}&hook=${analysis.hook_type}&format=${analysis.format}`}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Create Experiment with This Template
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isAnalyzing && !analysis && !error && (
        <div className="text-center py-12 text-gray-500">
          <Link2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Paste a viral video URL above to analyze its structure</p>
          <p className="text-sm mt-2">Works with TikTok and Instagram Reels</p>
        </div>
      )}
    </div>
  )
}
