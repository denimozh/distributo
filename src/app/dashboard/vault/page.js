'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Search, 
  Filter, 
  Play, 
  Eye, 
  Bookmark,
  ArrowRight,
  Sparkles,
  TrendingUp,
  MessageCircle,
  Video,
  Image,
  Type,
  Link2
} from 'lucide-react'

// Seed blueprints matching the database
const blueprints = [
  {
    id: 1,
    niche: 'skincare',
    hook_type: 'curiosity',
    format: 'talking_head',
    cta_type: 'link_bio',
    views: 2300000,
    script_template: 'POV: you just discovered the [PRODUCT_TYPE] that actually [BENEFIT]...',
    why_it_works: 'Creates curiosity gap with POV format, validates skepticism, shows transformation',
    freshness: 0.95,
  },
  {
    id: 2,
    niche: 'skincare',
    hook_type: 'problem',
    format: 'talking_head',
    cta_type: 'comment',
    views: 1800000,
    script_template: 'If you\'re struggling with [PROBLEM], stop scrolling...',
    why_it_works: 'Direct problem callout stops scroll, failed solutions build credibility',
    freshness: 0.90,
  },
  {
    id: 3,
    niche: 'skincare',
    hook_type: 'story',
    format: 'talking_head',
    cta_type: 'shop',
    views: 4100000,
    script_template: 'Storytime: how I accidentally fixed my [PROBLEM]...',
    why_it_works: 'Storytime format promises narrative payoff, embarrassment creates empathy',
    freshness: 0.98,
  },
  {
    id: 4,
    niche: 'supplements',
    hook_type: 'curiosity',
    format: 'talking_head',
    cta_type: 'link_bio',
    views: 1500000,
    script_template: 'Nobody talks about this [SUPPLEMENT_TYPE] hack...',
    why_it_works: 'Secret/hack framing creates intrigue, addresses common frustration',
    freshness: 0.85,
  },
  {
    id: 5,
    niche: 'supplements',
    hook_type: 'direct',
    format: 'product_demo',
    cta_type: 'shop',
    views: 980000,
    script_template: 'This is the [SUPPLEMENT_TYPE] I take every morning...',
    why_it_works: 'Direct format feels authentic, benefit list is scannable',
    freshness: 0.80,
  },
  {
    id: 6,
    niche: 'saas',
    hook_type: 'problem',
    format: 'talking_head',
    cta_type: 'link_bio',
    views: 890000,
    script_template: 'If you\'re still [MANUAL_PROCESS], you\'re wasting [TIME/MONEY]...',
    why_it_works: 'Direct pain callout, before/after contrast, specific numbers',
    freshness: 0.88,
  },
  {
    id: 7,
    niche: 'saas',
    hook_type: 'story',
    format: 'talking_head',
    cta_type: 'comment',
    views: 1100000,
    script_template: 'I almost quit my [JOB/BUSINESS] because of [PROBLEM]...',
    why_it_works: 'Near-quit moment is dramatic, work-life struggle is relatable',
    freshness: 0.92,
  },
  {
    id: 8,
    niche: 'ecommerce',
    hook_type: 'curiosity',
    format: 'product_demo',
    cta_type: 'shop',
    views: 3200000,
    script_template: 'Wait until you see what this [PRODUCT_TYPE] does...',
    why_it_works: 'Anticipation hook creates curiosity, live demo is compelling',
    freshness: 0.96,
  },
]

const niches = ['all', 'skincare', 'supplements', 'saas', 'ecommerce', 'fashion']
const hookTypes = ['all', 'curiosity', 'problem', 'story', 'direct']
const formats = ['all', 'talking_head', 'product_demo', 'before_after', 'slideshow']

const formatViews = (views) => {
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`
  if (views >= 1000) return `${(views / 1000).toFixed(0)}K`
  return views
}

const hookColors = {
  curiosity: 'bg-purple-100 text-purple-700',
  problem: 'bg-red-100 text-red-700',
  story: 'bg-blue-100 text-blue-700',
  direct: 'bg-green-100 text-green-700',
  question: 'bg-amber-100 text-amber-700',
}

const formatIcons = {
  talking_head: Video,
  product_demo: Play,
  before_after: Image,
  slideshow: Image,
  text_only: Type,
}

export default function VaultPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNiche, setSelectedNiche] = useState('all')
  const [selectedHook, setSelectedHook] = useState('all')
  const [selectedFormat, setSelectedFormat] = useState('all')

  const filteredBlueprints = blueprints.filter((bp) => {
    if (selectedNiche !== 'all' && bp.niche !== selectedNiche) return false
    if (selectedHook !== 'all' && bp.hook_type !== selectedHook) return false
    if (selectedFormat !== 'all' && bp.format !== selectedFormat) return false
    if (searchQuery && !bp.script_template.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-500" />
            Viral Vault
          </h1>
          <p className="text-gray-500 mt-1">Proven content formulas with millions of views</p>
        </div>
        <Link
          href="/dashboard/vault/analyze"
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          <Link2 className="w-4 h-4" />
          Analyze URL
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search blueprints..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Niche Filter */}
          <select
            value={selectedNiche}
            onChange={(e) => setSelectedNiche(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          >
            {niches.map((n) => (
              <option key={n} value={n}>{n === 'all' ? 'All Niches' : n.charAt(0).toUpperCase() + n.slice(1)}</option>
            ))}
          </select>

          {/* Hook Filter */}
          <select
            value={selectedHook}
            onChange={(e) => setSelectedHook(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          >
            {hookTypes.map((h) => (
              <option key={h} value={h}>{h === 'all' ? 'All Hooks' : h.charAt(0).toUpperCase() + h.slice(1)}</option>
            ))}
          </select>

          {/* Format Filter */}
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          >
            {formats.map((f) => (
              <option key={f} value={f}>{f === 'all' ? 'All Formats' : f.replace('_', ' ').charAt(0).toUpperCase() + f.replace('_', ' ').slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Count */}
      <p className="text-sm text-gray-500 mb-4">
        Showing {filteredBlueprints.length} blueprint{filteredBlueprints.length !== 1 ? 's' : ''}
      </p>

      {/* Blueprint Grid */}
      <div className="grid grid-cols-2 gap-4">
        {filteredBlueprints.map((bp) => {
          const FormatIcon = formatIcons[bp.format] || Video
          return (
            <div
              key={bp.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-gray-300 hover:shadow-md transition-all group"
            >
              {/* Preview Area */}
              <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-50 relative flex items-center justify-center">
                <div className="text-center px-6">
                  <p className="text-gray-600 font-medium text-sm leading-relaxed">
                    "{bp.script_template}"
                  </p>
                </div>
                
                {/* Views Badge */}
                <div className="absolute top-3 right-3 bg-black/70 text-white text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {formatViews(bp.views)}
                </div>

                {/* Freshness Indicator */}
                <div className="absolute top-3 left-3">
                  {bp.freshness > 0.9 ? (
                    <span className="bg-green-500 text-white text-xs font-medium px-2 py-1 rounded-full">🔥 Fresh</span>
                  ) : bp.freshness > 0.8 ? (
                    <span className="bg-amber-500 text-white text-xs font-medium px-2 py-1 rounded-full">⚡ Active</span>
                  ) : null}
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                {/* Tags */}
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${hookColors[bp.hook_type]}`}>
                    {bp.hook_type}
                  </span>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600 flex items-center gap-1">
                    <FormatIcon className="w-3 h-3" />
                    {bp.format.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                    {bp.niche}
                  </span>
                </div>

                {/* Why it works */}
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  💡 {bp.why_it_works}
                </p>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <button className="text-gray-400 hover:text-gray-600 transition-colors">
                    <Bookmark className="w-5 h-5" />
                  </button>
                  <Link
                    href={`/dashboard/experiments/new?blueprint=${bp.id}`}
                    className="flex items-center gap-1 text-sm font-medium text-green-600 hover:text-green-700 transition-colors"
                  >
                    Use This
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filteredBlueprints.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No blueprints match your filters</p>
          <button 
            onClick={() => {
              setSelectedNiche('all')
              setSelectedHook('all')
              setSelectedFormat('all')
              setSearchQuery('')
            }}
            className="text-green-600 hover:text-green-700 font-medium mt-2"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  )
}
