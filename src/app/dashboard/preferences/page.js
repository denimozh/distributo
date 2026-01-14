"use client";

import { useState } from "react";

export default function PreferencesPage() {
  const [settings, setSettings] = useState({
    // Automation
    masterAutopilot: true,
    defaultPostsPerDay: 5,
    defaultTimeStart: '09:00',
    defaultTimeEnd: '20:00',
    autoApprove: false,
    
    // Content
    defaultTone: 'casual',
    includeHashtags: true,
    includeEmojis: true,
    
    // Notifications
    emailOnPost: false,
    emailOnFailure: true,
    emailDigest: 'daily',
  });

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    // Save to database
    console.log('Saving settings:', settings);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Preferences</h1>
        <p className="text-gray-500 mt-1">Configure your global automation settings.</p>
      </div>

      <div className="space-y-6">
        {/* Automation Settings */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <BoltIcon className="w-5 h-5 text-gray-400" />
            <h2 className="font-semibold text-gray-900">Automation</h2>
          </div>

          <div className="space-y-6">
            {/* Master Autopilot */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Master Autopilot</label>
                <p className="text-xs text-gray-500 mt-0.5">Enable automation across all platforms</p>
              </div>
              <button
                onClick={() => handleChange('masterAutopilot', !settings.masterAutopilot)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.masterAutopilot ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  settings.masterAutopilot ? 'right-1' : 'left-1'
                }`} />
              </button>
            </div>

            {/* Default posts per day */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Default posts per day</label>
                <span className="text-sm font-bold text-gray-900">{settings.defaultPostsPerDay}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={settings.defaultPostsPerDay}
                onChange={(e) => handleChange('defaultPostsPerDay', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>1</span>
                <span>10 (max)</span>
              </div>
            </div>

            {/* Time window */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Default posting window</label>
              <div className="flex items-center gap-3">
                <input
                  type="time"
                  value={settings.defaultTimeStart}
                  onChange={(e) => handleChange('defaultTimeStart', e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
                <span className="text-gray-400">to</span>
                <input
                  type="time"
                  value={settings.defaultTimeEnd}
                  onChange={(e) => handleChange('defaultTimeEnd', e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
            </div>

            {/* Auto-approve */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Auto-approve posts</label>
                <p className="text-xs text-gray-500 mt-0.5">Publish posts without manual review</p>
              </div>
              <button
                onClick={() => handleChange('autoApprove', !settings.autoApprove)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.autoApprove ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  settings.autoApprove ? 'right-1' : 'left-1'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Content Settings */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <PencilIcon className="w-5 h-5 text-gray-400" />
            <h2 className="font-semibold text-gray-900">Content Preferences</h2>
          </div>

          <div className="space-y-6">
            {/* Default tone */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Default tone</label>
              <div className="flex flex-wrap gap-2">
                {['casual', 'professional', 'witty', 'educational'].map((tone) => (
                  <button
                    key={tone}
                    onClick={() => handleChange('defaultTone', tone)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      settings.defaultTone === tone
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {tone.charAt(0).toUpperCase() + tone.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Include hashtags */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Include hashtags</label>
                <p className="text-xs text-gray-500 mt-0.5">Add relevant hashtags to posts</p>
              </div>
              <button
                onClick={() => handleChange('includeHashtags', !settings.includeHashtags)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.includeHashtags ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  settings.includeHashtags ? 'right-1' : 'left-1'
                }`} />
              </button>
            </div>

            {/* Include emojis */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Include emojis</label>
                <p className="text-xs text-gray-500 mt-0.5">Add emojis to make posts more engaging</p>
              </div>
              <button
                onClick={() => handleChange('includeEmojis', !settings.includeEmojis)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.includeEmojis ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  settings.includeEmojis ? 'right-1' : 'left-1'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <BellIcon className="w-5 h-5 text-gray-400" />
            <h2 className="font-semibold text-gray-900">Notifications</h2>
          </div>

          <div className="space-y-6">
            {/* Email on post */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Email on post</label>
                <p className="text-xs text-gray-500 mt-0.5">Get notified when a post is published</p>
              </div>
              <button
                onClick={() => handleChange('emailOnPost', !settings.emailOnPost)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.emailOnPost ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  settings.emailOnPost ? 'right-1' : 'left-1'
                }`} />
              </button>
            </div>

            {/* Email on failure */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Email on failure</label>
                <p className="text-xs text-gray-500 mt-0.5">Get notified when a post fails</p>
              </div>
              <button
                onClick={() => handleChange('emailOnFailure', !settings.emailOnFailure)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.emailOnFailure ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  settings.emailOnFailure ? 'right-1' : 'left-1'
                }`} />
              </button>
            </div>

            {/* Email digest */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Performance digest</label>
              <div className="flex gap-2">
                {['none', 'daily', 'weekly'].map((freq) => (
                  <button
                    key={freq}
                    onClick={() => handleChange('emailDigest', freq)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      settings.emailDigest === freq
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {freq.charAt(0).toUpperCase() + freq.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg hover:shadow-lg transition-all"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// Icons
function BoltIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function PencilIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  );
}

function BellIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}