"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";

// ==========================================
// ICONS
// ==========================================

const IconUser = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconBriefcase = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

const IconGlobe = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const IconTarget = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const IconEdit = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const IconSave = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

const IconLoader = ({ className }) => (
  <svg className={className + " animate-spin"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12a9 9 0 11-6.219-8.56" />
  </svg>
);

const IconBell = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const IconClock = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconPalette = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="13.5" cy="6.5" r=".5" />
    <circle cx="17.5" cy="10.5" r=".5" />
    <circle cx="8.5" cy="7.5" r=".5" />
    <circle cx="6.5" cy="12.5" r=".5" />
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z" />
  </svg>
);

// ==========================================
// INPUT COMPONENTS
// ==========================================

function TextInput({ label, value, onChange, placeholder, helpText, maxLength }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors"
      />
      {helpText && <p className="mt-1.5 text-xs text-gray-400">{helpText}</p>}
    </div>
  );
}

function TextAreaInput({ label, value, onChange, placeholder, helpText, rows = 3 }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors resize-none"
      />
      {helpText && <p className="mt-1.5 text-xs text-gray-400">{helpText}</p>}
    </div>
  );
}

function ToggleSwitch({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <div className="text-sm font-medium text-gray-700">{label}</div>
        {description && <div className="text-xs text-gray-400 mt-0.5">{description}</div>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          checked ? 'bg-purple-500' : 'bg-gray-200'
        }`}
      >
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
          checked ? 'left-6' : 'left-1'
        }`} />
      </button>
    </div>
  );
}

// ==========================================
// SECTION CARD
// ==========================================

function SectionCard({ icon: Icon, title, description, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
            <Icon className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
        </div>
      </div>
      <div className="p-5 space-y-4">
        {children}
      </div>
    </div>
  );
}

// ==========================================
// MAIN PAGE
// ==========================================

export default function PreferencesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  const [profile, setProfile] = useState({
    full_name: '',
    product_name: '',
    product_description: '',
    product_url: '',
    website_url: '',
    target_audience: '',
  });

  const [preferences, setPreferences] = useState({
    email_notifications: true,
    weekly_digest: true,
    post_reminders: true,
    timezone: 'auto',
    default_platform: 'x',
  });

  const supabase = createClient();
  const { addToast } = useToast();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile({
          full_name: data.full_name || '',
          product_name: data.product_name || '',
          product_description: data.product_description || '',
          product_url: data.product_url || '',
          website_url: data.website_url || '',
          target_audience: data.target_audience || '',
        });

        setPreferences({
          email_notifications: data.email_notifications ?? true,
          weekly_digest: data.weekly_digest ?? true,
          post_reminders: data.post_reminders ?? true,
          timezone: data.timezone || 'auto',
          default_platform: data.default_platform || 'x',
        });
      }
    } catch (error) {
      console.error('[PREFERENCES] Load error:', error);
      addToast('Failed to load preferences', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = (key, value) => {
    setProfile(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const updatePreference = (key, value) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          ...profile,
          ...preferences,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      setHasChanges(false);
      addToast('Preferences saved!', 'success');
    } catch (error) {
      console.error('[PREFERENCES] Save error:', error);
      addToast('Failed to save preferences', 'error');
    } finally {
      setSaving(false);
    }
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Preferences</h1>
          <p className="text-gray-500 mt-1">Manage your profile and content settings</p>
        </div>
        <button
          onClick={saveAll}
          disabled={!hasChanges || saving}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl transition-all ${
            hasChanges
              ? 'bg-purple-500 text-white hover:bg-purple-600 shadow-lg shadow-purple-500/25'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {saving ? (
            <IconLoader className="w-4 h-4" />
          ) : (
            <IconSave className="w-4 h-4" />
          )}
          Save Changes
        </button>
      </div>

      <div className="space-y-6">
        {/* Personal Info */}
        <SectionCard
          icon={IconUser}
          title="Personal Information"
          description="Your basic profile information"
        >
          <TextInput
            label="Full Name"
            value={profile.full_name}
            onChange={(v) => updateProfile('full_name', v)}
            placeholder="John Doe"
          />
        </SectionCard>

        {/* Product Info */}
        <SectionCard
          icon={IconBriefcase}
          title="Product Information"
          description="Tell us about what you're building"
        >
          <TextInput
            label="Product Name"
            value={profile.product_name}
            onChange={(v) => updateProfile('product_name', v)}
            placeholder="My Awesome SaaS"
            helpText="This will be mentioned in generated content"
          />

          <TextAreaInput
            label="Product Description"
            value={profile.product_description}
            onChange={(v) => updateProfile('product_description', v)}
            placeholder="A tool that helps developers..."
            helpText="A brief description of what your product does"
            rows={3}
          />

          <TextInput
            label="Product URL"
            value={profile.product_url}
            onChange={(v) => updateProfile('product_url', v)}
            placeholder="https://myproduct.com"
            helpText="This link will be included in your posts"
          />

          <TextInput
            label="Website URL"
            value={profile.website_url}
            onChange={(v) => updateProfile('website_url', v)}
            placeholder="https://yourwebsite.com"
            helpText="Your personal or company website"
          />
        </SectionCard>

        {/* Target Audience */}
        <SectionCard
          icon={IconTarget}
          title="Target Audience"
          description="Who are you trying to reach?"
        >
          <TextAreaInput
            label="Describe your ideal audience"
            value={profile.target_audience}
            onChange={(v) => updateProfile('target_audience', v)}
            placeholder="Indie hackers, startup founders, developers building side projects..."
            helpText="AI will tailor content to resonate with this audience"
            rows={3}
          />
        </SectionCard>

        {/* Notifications */}
        <SectionCard
          icon={IconBell}
          title="Notifications"
          description="Control how we communicate with you"
        >
          <ToggleSwitch
            label="Email Notifications"
            description="Receive important updates via email"
            checked={preferences.email_notifications}
            onChange={(v) => updatePreference('email_notifications', v)}
          />
          <ToggleSwitch
            label="Weekly Digest"
            description="Get a summary of your content performance"
            checked={preferences.weekly_digest}
            onChange={(v) => updatePreference('weekly_digest', v)}
          />
          <ToggleSwitch
            label="Post Reminders"
            description="Remind me to approve pending posts"
            checked={preferences.post_reminders}
            onChange={(v) => updatePreference('post_reminders', v)}
          />
        </SectionCard>

        {/* Posting Preferences */}
        <SectionCard
          icon={IconClock}
          title="Posting Preferences"
          description="Default settings for content creation"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Default Platform</label>
            <div className="flex gap-2">
              {[
                { id: 'x', label: 'X / Twitter' },
                { id: 'linkedin', label: 'LinkedIn' },
              ].map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => updatePreference('default_platform', platform.id)}
                  className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${
                    preferences.default_platform === platform.id
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {platform.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Timezone</label>
            <select
              value={preferences.timezone}
              onChange={(e) => updatePreference('timezone', e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white"
            >
              <option value="auto">Auto-detect</option>
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="Europe/London">London (GMT)</option>
              <option value="Europe/Paris">Paris (CET)</option>
              <option value="Asia/Tokyo">Tokyo (JST)</option>
              <option value="Asia/Singapore">Singapore (SGT)</option>
              <option value="Australia/Sydney">Sydney (AEST)</option>
            </select>
            <p className="mt-1.5 text-xs text-gray-400">
              Used for scheduling posts at optimal times
            </p>
          </div>
        </SectionCard>

        {/* Danger Zone */}
        <div className="bg-red-50 rounded-2xl border border-red-100 overflow-hidden">
          <div className="p-5 border-b border-red-100">
            <h3 className="font-semibold text-red-900">Danger Zone</h3>
            <p className="text-xs text-red-600">Irreversible actions</p>
          </div>
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900">Delete Account</div>
                <div className="text-xs text-gray-500">Permanently delete your account and all data</div>
              </div>
              <button className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-xl hover:bg-red-50 transition-colors">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Save Button (mobile) */}
      {hasChanges && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 md:hidden">
          <button
            onClick={saveAll}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-purple-500 text-white font-medium rounded-full shadow-lg shadow-purple-500/30"
          >
            {saving ? <IconLoader className="w-4 h-4" /> : <IconSave className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
}