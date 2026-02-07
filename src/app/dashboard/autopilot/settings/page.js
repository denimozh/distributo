"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";
import Link from "next/link";

// ==========================================
// ICONS
// ==========================================

const IconArrowLeft = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const IconMoon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const IconX = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const IconLinkedIn = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const IconGitHub = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

const IconCheck = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconLoader = ({ className }) => (
  <svg className={className + " animate-spin"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12a9 9 0 11-6.219-8.56" />
  </svg>
);

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function AutopilotSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    enabled: false,
    postsPerDay: 2,
    platforms: ['x'],
    tone: 'founder',
    autoApprove: true,
  });
  const [integrations, setIntegrations] = useState({
    github: false,
    x: false,
    linkedin: false,
  });

  const supabase = createClient();
  const { addToast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load profile settings
      const { data: profile } = await supabase
        .from('profiles')
        .select('autopilot_enabled, autopilot_posts_per_day, autopilot_platforms, autopilot_tone, autopilot_auto_approve')
        .eq('id', user.id)
        .single();

      if (profile) {
        setSettings({
          enabled: profile.autopilot_enabled || false,
          postsPerDay: profile.autopilot_posts_per_day || 2,
          platforms: profile.autopilot_platforms || ['x'],
          tone: profile.autopilot_tone || 'founder',
          autoApprove: profile.autopilot_auto_approve ?? true,
        });
      }

      // Check integrations
      const { data: accounts } = await supabase
        .from('connected_accounts')
        .select('platform, is_active')
        .eq('user_id', user.id);

      const integrationStatus = {
        github: accounts?.some(a => a.platform === 'github' && a.is_active) || false,
        x: accounts?.some(a => a.platform === 'x' && a.is_active) || false,
        linkedin: accounts?.some(a => a.platform === 'linkedin' && a.is_active) || false,
      };
      setIntegrations(integrationStatus);

    } catch (error) {
      console.error('[SETTINGS] Load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings) => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updates = {
        autopilot_enabled: newSettings.enabled,
        autopilot_posts_per_day: newSettings.postsPerDay,
        autopilot_platforms: newSettings.platforms,
        autopilot_tone: newSettings.tone,
        autopilot_auto_approve: newSettings.autoApprove,
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      setSettings(newSettings);
      addToast('Settings saved', 'success');
    } catch (error) {
      addToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const togglePlatform = (platform) => {
    const newPlatforms = settings.platforms.includes(platform)
      ? settings.platforms.filter(p => p !== platform)
      : [...settings.platforms, platform];
    
    // Must have at least one platform
    if (newPlatforms.length === 0) {
      addToast('Must have at least one platform enabled', 'error');
      return;
    }
    
    updateSetting('platforms', newPlatforms);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <IconLoader className="w-8 h-8 text-purple-500" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/dashboard/autopilot"
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <IconArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Autopilot Settings</h1>
          <p className="text-sm text-gray-500">Configure your automated content engine</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Master Toggle */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                settings.enabled ? 'bg-purple-100' : 'bg-gray-100'
              }`}>
                <IconMoon className={`w-6 h-6 ${settings.enabled ? 'text-purple-600' : 'text-gray-400'}`} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Autopilot Mode</h3>
                <p className="text-sm text-gray-500">
                  {settings.enabled ? 'Active - generating and posting automatically' : 'Paused - no automatic actions'}
                </p>
              </div>
            </div>
            <button
              onClick={() => updateSetting('enabled', !settings.enabled)}
              disabled={saving}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                settings.enabled ? 'bg-purple-500' : 'bg-gray-200'
              }`}
            >
              <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                settings.enabled ? 'left-7' : 'left-1'
              }`} />
            </button>
          </div>
        </div>

        {/* Content Volume */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Content Volume</h3>
            <p className="text-sm text-gray-500">How many posts to generate and schedule daily</p>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  onClick={() => updateSetting('postsPerDay', num)}
                  className={`flex-1 py-3 text-sm font-medium rounded-xl transition-all ${
                    settings.postsPerDay === num
                      ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {num} post{num > 1 ? 's' : ''}/day
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3">
              At {settings.postsPerDay} posts/day, a week of content = {settings.postsPerDay * 7} posts
            </p>
          </div>
        </div>

        {/* Platforms */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Platforms</h3>
            <p className="text-sm text-gray-500">Where to post automatically</p>
          </div>
          <div className="p-4 space-y-3">
            {/* X/Twitter */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center">
                  <IconX className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">X / Twitter</div>
                  <div className="text-xs text-gray-500">
                    {integrations.x ? (
                      <span className="text-emerald-600">✓ Connected</span>
                    ) : (
                      <span className="text-amber-600">Not connected</span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => togglePlatform('x')}
                disabled={!integrations.x}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  settings.platforms.includes('x') ? 'bg-gray-900' : 'bg-gray-200'
                } ${!integrations.x ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  settings.platforms.includes('x') ? 'left-6' : 'left-1'
                }`} />
              </button>
            </div>

            {/* LinkedIn */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#0A66C2] flex items-center justify-center">
                  <IconLinkedIn className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">LinkedIn</div>
                  <div className="text-xs text-gray-500">
                    {integrations.linkedin ? (
                      <span className="text-emerald-600">✓ Connected</span>
                    ) : (
                      <span className="text-amber-600">Not connected</span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => togglePlatform('linkedin')}
                disabled={!integrations.linkedin}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  settings.platforms.includes('linkedin') ? 'bg-[#0A66C2]' : 'bg-gray-200'
                } ${!integrations.linkedin ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  settings.platforms.includes('linkedin') ? 'left-6' : 'left-1'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Content Tone */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Content Tone</h3>
            <p className="text-sm text-gray-500">The voice and style of generated content</p>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'founder', label: 'Founder', desc: 'Build in public, entrepreneurial' },
                { id: 'developer', label: 'Developer', desc: 'Technical, nerdy, precise' },
                { id: 'casual', label: 'Casual', desc: 'Relaxed, friendly, conversational' },
              ].map((tone) => (
                <button
                  key={tone.id}
                  onClick={() => updateSetting('tone', tone.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    settings.tone === tone.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`font-medium ${settings.tone === tone.id ? 'text-purple-700' : 'text-gray-900'}`}>
                    {tone.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{tone.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Auto-Approve */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Auto-Approval</h3>
            <p className="text-sm text-gray-500">How generated content is handled</p>
          </div>
          <div className="p-4 space-y-3">
            <button
              onClick={() => updateSetting('autoApprove', true)}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                settings.autoApprove
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className={`font-medium ${settings.autoApprove ? 'text-purple-700' : 'text-gray-900'}`}>
                    Auto-approve & schedule
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Generated posts are automatically scheduled without review
                  </div>
                </div>
                {settings.autoApprove && <IconCheck className="w-5 h-5 text-purple-500" />}
              </div>
            </button>

            <button
              onClick={() => updateSetting('autoApprove', false)}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                !settings.autoApprove
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className={`font-medium ${!settings.autoApprove ? 'text-purple-700' : 'text-gray-900'}`}>
                    Review first
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Generated posts require manual approval before scheduling
                  </div>
                </div>
                {!settings.autoApprove && <IconCheck className="w-5 h-5 text-purple-500" />}
              </div>
            </button>
          </div>
        </div>

        {/* Integration Status */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Integration Status</h3>
            <p className="text-sm text-gray-500">Connected accounts for content generation</p>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
              <div className="flex items-center gap-3">
                <IconGitHub className="w-5 h-5 text-gray-700" />
                <span className="text-sm text-gray-700">GitHub</span>
              </div>
              {integrations.github ? (
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                  Connected
                </span>
              ) : (
                <Link
                  href="/dashboard/settings/integrations"
                  className="text-xs font-medium text-purple-600 hover:text-purple-700"
                >
                  Connect -&gt;
                </Link>
              )}
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
              <div className="flex items-center gap-3">
                <IconX className="w-4 h-4 text-gray-700" />
                <span className="text-sm text-gray-700">X / Twitter</span>
              </div>
              {integrations.x ? (
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                  Connected
                </span>
              ) : (
                <Link
                  href="/dashboard/settings/integrations"
                  className="text-xs font-medium text-purple-600 hover:text-purple-700"
                >
                  Connect -&gt;
                </Link>
              )}
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
              <div className="flex items-center gap-3">
                <IconLinkedIn className="w-5 h-5 text-[#0A66C2]" />
                <span className="text-sm text-gray-700">LinkedIn</span>
              </div>
              {integrations.linkedin ? (
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                  Connected
                </span>
              ) : (
                <Link
                  href="/dashboard/settings/integrations"
                  className="text-xs font-medium text-purple-600 hover:text-purple-700"
                >
                  Connect -&gt;
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="pt-4">
          <Link
            href="/dashboard/autopilot"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
          >
            <IconArrowLeft className="w-4 h-4" />
            Back to Autopilot Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}