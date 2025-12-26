"use client";

import { useState } from 'react';

export default function DraftsPage() {
  const [prompt, setPrompt] = useState('');
  const [platform, setPlatform] = useState('x');
  const [tone, setTone] = useState('casual');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');

  const tones = [
    { id: 'casual', label: 'Casual', emoji: '😊' },
    { id: 'professional', label: 'Professional', emoji: '👔' },
    { id: 'witty', label: 'Witty', emoji: '😏' },
    { id: 'educational', label: 'Educational', emoji: '📚' },
    { id: 'provocative', label: 'Provocative', emoji: '🔥' },
  ];

  const templates = [
    { id: 'launch', label: 'Product Launch', icon: '🚀' },
    { id: 'update', label: 'Build Update', icon: '🛠️' },
    { id: 'milestone', label: 'Milestone', icon: '🎯' },
    { id: 'tip', label: 'Quick Tip', icon: '💡' },
    { id: 'thread', label: 'Thread', icon: '🧵' },
    { id: 'question', label: 'Engagement Q', icon: '❓' },
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    
    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const sampleOutputs = {
      x: `Just shipped something I'm really proud of 🚀

${prompt}

Took me 3 weeks of focused work. Here's what I learned:

1. Start with the user problem
2. Ship early, iterate fast  
3. Listen to feedback

What's the last thing you shipped?

#buildinpublic`,
      reddit: `Hey r/SaaS! 

I've been working on ${prompt} and wanted to share my progress.

**The Problem:**
Most founders struggle with consistent marketing while building.

**My Solution:**
Built a tool that automates content distribution across platforms.

**Results so far:**
- 50+ early users
- 3x engagement vs manual posting
- Saved 10+ hours/week

Would love to hear your thoughts! AMA in the comments.`,
      linkedin: `Excited to share a milestone! 🎉

After weeks of development, I've finally shipped ${prompt}.

Here's what this journey taught me:

→ Building in public creates accountability
→ Early users are your best advisors  
→ Consistency beats perfection

For fellow founders: What's been your biggest learning this quarter?

#SaaS #Entrepreneurship #BuildInPublic`,
    };

    setGeneratedContent(sampleOutputs[platform] || sampleOutputs.x);
    setIsGenerating(false);
  };

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      {/* Header */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <SparklesIcon className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-lg font-semibold text-gray-900">AI Draft Generator</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Credits: <span className="font-medium text-gray-900">47</span></span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-6">
            {/* Platform Selector */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <label className="block text-sm font-medium text-gray-700 mb-3">Platform</label>
              <div className="flex gap-2">
                {[
                  { id: 'x', label: 'X', icon: '⚫' },
                  { id: 'reddit', label: 'Reddit', icon: '🟠' },
                  { id: 'linkedin', label: 'LinkedIn', icon: '🔵' },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPlatform(p.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-all ${
                      platform === p.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-lg">{p.icon}</span>
                    <span className="text-sm font-medium">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tone Selector */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <label className="block text-sm font-medium text-gray-700 mb-3">Tone</label>
              <div className="flex flex-wrap gap-2">
                {tones.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTone(t.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border transition-all ${
                      tone === t.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <span>{t.emoji}</span>
                    <span className="text-sm font-medium">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Templates */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <label className="block text-sm font-medium text-gray-700 mb-3">Quick Templates</label>
              <div className="grid grid-cols-3 gap-2">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setPrompt(`${t.label}: `)}
                    className="flex flex-col items-center gap-1 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
                  >
                    <span className="text-xl">{t.icon}</span>
                    <span className="text-xs font-medium text-gray-600">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt Input */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <label className="block text-sm font-medium text-gray-700 mb-3">What do you want to share?</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                placeholder="E.g., Just shipped a new feature that lets users schedule posts..."
              />
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className="w-full mt-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <LoadingIcon className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-5 h-5" />
                    Generate Draft
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Output Section */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 h-fit">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700">Generated Draft</h3>
              {generatedContent && (
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Copy">
                    <CopyIcon className="w-4 h-4 text-gray-400" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Regenerate">
                    <RefreshIcon className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              )}
            </div>

            {generatedContent ? (
              <div className="space-y-4">
                {/* Platform Preview */}
                <div className={`p-4 rounded-xl border ${
                  platform === 'x' ? 'bg-gray-50 border-gray-200' :
                  platform === 'reddit' ? 'bg-orange-50 border-orange-200' :
                  'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">
                      {platform === 'x' ? '⚫' : platform === 'reddit' ? '🟠' : '🔵'}
                    </span>
                    <span className="text-sm font-medium text-gray-700">
                      {platform === 'x' ? 'X / Twitter' : platform === 'reddit' ? 'Reddit' : 'LinkedIn'} Preview
                    </span>
                  </div>
                  <div className="whitespace-pre-wrap text-gray-800 text-sm leading-relaxed">
                    {generatedContent}
                  </div>
                </div>

                {/* Character Count */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{generatedContent.length} characters</span>
                  {platform === 'x' && (
                    <span className={generatedContent.length > 280 ? 'text-red-500' : 'text-green-500'}>
                      {280 - generatedContent.length} remaining
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button className="flex-1 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm">
                    Save as Draft
                  </button>
                  <button className="flex-1 py-2.5 bg-[#1a1a2e] text-white font-medium rounded-lg hover:bg-[#2d2d44] transition-colors text-sm">
                    Schedule Post
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                <SparklesIcon className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm">Your generated content will appear here</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Drafts */}
        <div className="mt-8 bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Recent Drafts</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { platform: 'x', content: 'Just shipped dark mode for our dashboard...', time: '2 hours ago' },
              { platform: 'reddit', content: 'Weekly update: Here\'s what we built...', time: '1 day ago' },
              { platform: 'linkedin', content: 'Excited to announce our Series A...', time: '3 days ago' },
            ].map((draft, idx) => (
              <div key={idx} className="p-4 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors cursor-pointer">
                <div className="flex items-center gap-2 mb-2">
                  <span>{draft.platform === 'x' ? '⚫' : draft.platform === 'reddit' ? '🟠' : '🔵'}</span>
                  <span className="text-xs text-gray-400">{draft.time}</span>
                </div>
                <p className="text-sm text-gray-700 line-clamp-2">{draft.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Icons
function SparklesIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

function LoadingIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

function CopyIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function RefreshIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}