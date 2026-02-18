'use client'

import { useState } from 'react'
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'

// Mock patterns (empty for dogfooding start)
const mockPatterns = []

const confidenceConfig = {
  high: { label: 'High Confidence', color: 'bg-green-100 text-green-700 border-green-200', barColor: 'bg-green-500' },
  medium: { label: 'Medium Confidence', color: 'bg-amber-100 text-amber-700 border-amber-200', barColor: 'bg-amber-500' },
  low: { label: 'Low Confidence', color: 'bg-gray-100 text-gray-600 border-gray-200', barColor: 'bg-gray-400' },
}

export default function PatternsPage() {
  const [patterns, setPatterns] = useState(mockPatterns)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-purple-500" />
            Content Intelligence
          </h1>
          <p className="text-gray-500 mt-1">Patterns discovered from your experiments</p>
        </div>
      </div>

      {/* Empty State */}
      {patterns.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lightbulb className="w-8 h-8 text-purple-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No patterns yet</h2>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Run experiments and log results to discover what content patterns work best for your audience.
          </p>
          
          <Link
            href="/dashboard/experiments/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            Start First Experiment
            <ArrowRight className="w-4 h-4" />
          </Link>
          
          <div className="mt-8 pt-8 border-t border-gray-100 max-w-lg mx-auto">
            <h3 className="text-sm font-medium text-gray-900 mb-4">What you'll discover</h3>
            <div className="space-y-3 text-left">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Which hook types work best</p>
                  <p className="text-sm text-gray-500">Curiosity vs problem vs story hooks</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Optimal video formats</p>
                  <p className="text-sm text-gray-500">Talking head vs slideshow vs demos</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Best CTAs for engagement</p>
                  <p className="text-sm text-gray-500">Comment triggers vs link in bio</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Patterns List */}
      {patterns.length > 0 && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {patterns.filter(p => p.confidence === 'high').length}
                  </p>
                  <p className="text-sm text-gray-500">High Confidence</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {patterns.filter(p => p.confidence === 'medium').length}
                  </p>
                  <p className="text-sm text-gray-500">Emerging Patterns</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{patterns.length}</p>
                  <p className="text-sm text-gray-500">Total Insights</p>
                </div>
              </div>
            </div>
          </div>

          {/* Pattern Cards */}
          <div className="space-y-4">
            {patterns.map((pattern) => {
              const conf = confidenceConfig[pattern.confidence]
              const isPositive = pattern.performance_vs_avg > 1
              return (
                <div key={pattern.id} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${conf.color}`}>
                          {conf.label}
                        </span>
                        <span className="text-xs text-gray-500">
                          Based on {pattern.sample_size} videos
                        </span>
                      </div>
                      
                      <p className="text-lg font-medium text-gray-900 mb-1">
                        {pattern.insight_text}
                      </p>
                      
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-2">
                          {isPositive ? (
                            <TrendingUp className="w-5 h-5 text-green-500" />
                          ) : (
                            <TrendingDown className="w-5 h-5 text-red-500" />
                          )}
                          <span className={`font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {isPositive ? '+' : ''}{((pattern.performance_vs_avg - 1) * 100).toFixed(0)}%
                          </span>
                          <span className="text-sm text-gray-500">vs average</span>
                        </div>
                        
                        {/* Confidence bar */}
                        <div className="flex-1 max-w-xs">
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${conf.barColor}`}
                              style={{ width: `${pattern.confidence === 'high' ? 100 : pattern.confidence === 'medium' ? 66 : 33}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
