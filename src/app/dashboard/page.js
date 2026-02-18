'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Plus, 
  TrendingUp, 
  Video, 
  FlaskConical, 
  Lightbulb,
  ArrowRight,
  Sparkles,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

// Mock data for dogfooding
const mockStats = {
  totalVideos: 0,
  experimentsRun: 0,
  patternsFound: 0,
  creditsRemaining: 10,
}

const mockActivity = [
  { id: 1, type: 'system', title: 'Welcome to Experiment Engine!', description: 'Start by browsing the Viral Vault or creating your first experiment.', time: 'Just now', icon: Sparkles },
]

const quickActions = [
  { 
    title: 'Browse Viral Vault', 
    description: 'Find proven content formulas', 
    href: '/dashboard/vault',
    icon: Sparkles,
    color: 'bg-purple-500'
  },
  { 
    title: 'New Experiment', 
    description: 'Test what works for your audience', 
    href: '/dashboard/experiments/new',
    icon: FlaskConical,
    color: 'bg-green-500'
  },
  { 
    title: 'Analyze URL', 
    description: 'Paste a viral video to recreate', 
    href: '/dashboard/vault/analyze',
    icon: TrendingUp,
    color: 'bg-blue-500'
  },
]

export default function DashboardPage() {
  const [stats, setStats] = useState(mockStats)
  const [activity, setActivity] = useState(mockActivity)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Find your winning content formula</p>
        </div>
        <Link
          href="/dashboard/experiments/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Experiment
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Video className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalVideos}</p>
              <p className="text-sm text-gray-500">Videos Created</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FlaskConical className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.experimentsRun}</p>
              <p className="text-sm text-gray-500">Experiments</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.patternsFound}</p>
              <p className="text-sm text-gray-500">Patterns Found</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.creditsRemaining}</p>
              <p className="text-sm text-gray-500">AI Credits</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          <div className="grid grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                href={action.href}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 hover:shadow-sm transition-all group"
              >
                <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center mb-3`}>
                  <action.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                  {action.title}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{action.description}</p>
              </Link>
            ))}
          </div>

          {/* Getting Started Guide */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6 mt-6">
            <h3 className="font-semibold text-gray-900 mb-4">🚀 Getting Started</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">1</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Browse the Viral Vault</p>
                  <p className="text-sm text-gray-600">Find proven content formulas that are working right now</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">2</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Create Your First Experiment</p>
                  <p className="text-sm text-gray-600">Pick a blueprint and generate 6+ video variations</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">3</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Post & Log Results</p>
                  <p className="text-sm text-gray-600">Track metrics to discover what works for YOUR audience</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Activity</h2>
            <button className="text-sm text-green-600 hover:text-green-700 font-medium">
              View All
            </button>
          </div>
          <div className="space-y-4">
            {activity.map((item) => (
              <div key={item.id} className="flex gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {item.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {activity.length === 1 && (
            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="text-center">
                <p className="text-sm text-gray-500">No experiments yet</p>
                <Link 
                  href="/dashboard/experiments/new"
                  className="text-sm text-green-600 hover:text-green-700 font-medium inline-flex items-center gap-1 mt-1"
                >
                  Create your first
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
