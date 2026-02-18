'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Plus, 
  FlaskConical,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  ArrowRight,
  Play,
  MoreVertical
} from 'lucide-react'

// Mock experiments for dogfooding display
const mockExperiments = []

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-600', icon: Clock },
  generating: { label: 'Generating', color: 'bg-blue-100 text-blue-600', icon: Clock },
  ready: { label: 'Ready to Post', color: 'bg-amber-100 text-amber-600', icon: Play },
  posting: { label: 'Posting', color: 'bg-blue-100 text-blue-600', icon: Clock },
  logging: { label: 'Logging Results', color: 'bg-purple-100 text-purple-600', icon: BarChart3 },
  complete: { label: 'Complete', color: 'bg-green-100 text-green-600', icon: CheckCircle },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-600', icon: AlertCircle },
}

export default function ExperimentsPage() {
  const [experiments, setExperiments] = useState(mockExperiments)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-green-500" />
            Experiments
          </h1>
          <p className="text-gray-500 mt-1">Run structured tests to find what works</p>
        </div>
        <Link
          href="/dashboard/experiments/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Experiment
        </Link>
      </div>

      {/* Empty State */}
      {experiments.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FlaskConical className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No experiments yet</h2>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Create your first experiment to generate script variations and discover what content style works best for your audience.
          </p>
          <Link
            href="/dashboard/experiments/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create First Experiment
          </Link>
          
          <div className="mt-8 pt-8 border-t border-gray-100">
            <h3 className="text-sm font-medium text-gray-900 mb-4">How it works</h3>
            <div className="grid grid-cols-3 gap-6 text-left max-w-2xl mx-auto">
              <div>
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold mb-2">1</div>
                <p className="text-sm text-gray-600">Pick a viral blueprint or paste a URL to analyze</p>
              </div>
              <div>
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold mb-2">2</div>
                <p className="text-sm text-gray-600">Select hooks and variables to test (we generate scripts)</p>
              </div>
              <div>
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold mb-2">3</div>
                <p className="text-sm text-gray-600">Post, log results, and see which variation won</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Experiments List */}
      {experiments.length > 0 && (
        <div className="space-y-4">
          {experiments.map((exp) => {
            const status = statusConfig[exp.status]
            const StatusIcon = status.icon
            return (
              <div
                key={exp.id}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <FlaskConical className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{exp.name}</h3>
                      <p className="text-sm text-gray-500">
                        Cycle #{exp.cycle_number} • {exp.videos_count} videos • Created {exp.created_at}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1 rounded-full ${status.color}`}>
                      <StatusIcon className="w-4 h-4" />
                      {status.label}
                    </span>
                    <Link
                      href={`/dashboard/experiments/${exp.id}`}
                      className="flex items-center gap-1 text-sm font-medium text-green-600 hover:text-green-700"
                    >
                      View
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* Variables tested */}
                {exp.variables_tested && (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex gap-4">
                    <div className="text-sm">
                      <span className="text-gray-500">Hooks: </span>
                      <span className="text-gray-900">{exp.variables_tested.hooks?.join(', ')}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">Avatars: </span>
                      <span className="text-gray-900">{exp.variables_tested.avatars?.join(', ')}</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
