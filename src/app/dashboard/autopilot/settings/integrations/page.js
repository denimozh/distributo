"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";

// ==========================================
// ICONS
// ==========================================

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

const IconAlertCircle = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const IconRefresh = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

const IconTrash = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const IconExternalLink = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const IconLoader = ({ className }) => (
  <svg className={className + " animate-spin"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12a9 9 0 11-6.219-8.56" />
  </svg>
);

const IconShield = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

// ==========================================
// DISCONNECT MODAL
// ==========================================

function DisconnectModal({ platform, accountName, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <IconAlertCircle className="w-6 h-6 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
          Disconnect {platform}?
        </h3>
        <p className="text-sm text-gray-500 text-center mb-6">
          This will disconnect <strong>{accountName}</strong> from Distributo. 
          You won't be able to post to this account until you reconnect.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <IconLoader className="w-4 h-4" /> : <IconTrash className="w-4 h-4" />}
            Disconnect
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// INTEGRATION CARD
// ==========================================

function IntegrationCard({ 
  platform, 
  name, 
  description, 
  icon: Icon, 
  iconBg, 
  account, 
  onConnect, 
  onDisconnect, 
  onRefresh,
  connecting,
  features 
}) {
  const isConnected = !!account;
  const lastSync = account?.updated_at ? new Date(account.updated_at) : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{name}</h3>
              <p className="text-sm text-gray-500">{description}</p>
            </div>
          </div>
          {isConnected ? (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full">
              <IconCheck className="w-3.5 h-3.5" />
              Connected
            </span>
          ) : (
            <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">
              Not connected
            </span>
          )}
        </div>

        {/* Features List */}
        {features && (
          <div className="mb-4 p-3 bg-gray-50 rounded-xl">
            <div className="text-xs font-medium text-gray-500 mb-2">Features enabled:</div>
            <div className="flex flex-wrap gap-2">
              {features.map((feature, i) => (
                <span key={i} className="text-xs text-gray-600 bg-white px-2 py-1 rounded-lg border border-gray-200">
                  {feature}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Connected Account Info */}
        {isConnected && account && (
          <div className="mb-4 p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {account.account_name || account.username || 'Connected Account'}
                </div>
                {account.account_username && (
                  <div className="text-xs text-gray-500">@{account.account_username}</div>
                )}
              </div>
              {lastSync && (
                <div className="text-xs text-gray-400">
                  Last sync: {lastSync.toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {isConnected ? (
            <>
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  <IconRefresh className="w-4 h-4" />
                  Refresh
                </button>
              )}
              <button
                onClick={onDisconnect}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
              >
                <IconTrash className="w-4 h-4" />
                Disconnect
              </button>
            </>
          ) : (
            <button
              onClick={onConnect}
              disabled={connecting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {connecting ? (
                <IconLoader className="w-4 h-4" />
              ) : (
                <IconExternalLink className="w-4 h-4" />
              )}
              Connect {name}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// MAIN PAGE
// ==========================================

export default function IntegrationsPage() {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState({
    x: null,
    linkedin: null,
    github: null,
  });
  const [connecting, setConnecting] = useState(null);
  const [disconnectModal, setDisconnectModal] = useState(null);
  const [disconnecting, setDisconnecting] = useState(false);

  const supabase = createClient();
  const { addToast } = useToast();

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: connectedAccounts, error } = await supabase
        .from('connected_accounts')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const accountsMap = {
        x: connectedAccounts?.find(a => a.platform === 'x' && a.is_active) || null,
        linkedin: connectedAccounts?.find(a => a.platform === 'linkedin' && a.is_active) || null,
        github: connectedAccounts?.find(a => a.platform === 'github' && a.is_active) || null,
      };

      setAccounts(accountsMap);
    } catch (error) {
      console.error('[INTEGRATIONS] Load error:', error);
      addToast('Failed to load integrations', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (platform) => {
    setConnecting(platform);
    
    try {
      // Redirect to OAuth flow
      const redirectUrl = `${window.location.origin}/api/${platform}/auth`;
      window.location.href = redirectUrl;
    } catch (error) {
      addToast(`Failed to connect ${platform}`, 'error');
      setConnecting(null);
    }
  };

  const handleDisconnect = async () => {
    if (!disconnectModal) return;
    
    setDisconnecting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Soft delete - set is_active to false
      const { error } = await supabase
        .from('connected_accounts')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('platform', disconnectModal.platform);

      if (error) throw error;

      setAccounts(prev => ({
        ...prev,
        [disconnectModal.platform]: null,
      }));

      addToast(`${disconnectModal.name} disconnected`, 'success');
      setDisconnectModal(null);
    } catch (error) {
      console.error('[INTEGRATIONS] Disconnect error:', error);
      addToast('Failed to disconnect', 'error');
    } finally {
      setDisconnecting(false);
    }
  };

  const handleRefreshGitHub = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      addToast('Syncing GitHub activity...', 'success');

      const response = await fetch('/api/github/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      if (response.ok) {
        addToast('GitHub sync complete!', 'success');
      } else {
        throw new Error('Sync failed');
      }
    } catch (error) {
      addToast('Failed to sync GitHub', 'error');
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <IconLoader className="w-8 h-8 text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
        <p className="text-gray-500 mt-1">Connect your accounts to enable automated posting</p>
      </div>

      {/* Security Note */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
        <IconShield className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <div className="text-sm font-medium text-blue-900">Your data is secure</div>
          <div className="text-xs text-blue-700 mt-0.5">
            We use OAuth for authentication and never store your passwords. You can revoke access at any time.
          </div>
        </div>
      </div>

      {/* Social Platforms */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Social Platforms
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <IntegrationCard
            platform="x"
            name="X / Twitter"
            description="Post tweets and threads automatically"
            icon={IconX}
            iconBg="bg-gray-900"
            account={accounts.x}
            onConnect={() => handleConnect('x')}
            onDisconnect={() => setDisconnectModal({ 
              platform: 'x', 
              name: 'X / Twitter',
              accountName: accounts.x?.account_name || accounts.x?.account_username || 'your account'
            })}
            connecting={connecting === 'x'}
            features={['Auto-posting', 'Threads', 'Communities', 'Scheduling']}
          />

          <IntegrationCard
            platform="linkedin"
            name="LinkedIn"
            description="Share professional updates"
            icon={IconLinkedIn}
            iconBg="bg-[#0A66C2]"
            account={accounts.linkedin}
            onConnect={() => handleConnect('linkedin')}
            onDisconnect={() => setDisconnectModal({ 
              platform: 'linkedin', 
              name: 'LinkedIn',
              accountName: accounts.linkedin?.account_name || 'your account'
            })}
            connecting={connecting === 'linkedin'}
            features={['Auto-posting', 'Professional tone', 'Scheduling']}
          />
        </div>
      </div>

      {/* Developer Tools */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Developer Tools
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <IntegrationCard
            platform="github"
            name="GitHub"
            description="Generate content from your commits"
            icon={IconGitHub}
            iconBg="bg-gray-800"
            account={accounts.github}
            onConnect={() => handleConnect('github')}
            onDisconnect={() => setDisconnectModal({ 
              platform: 'github', 
              name: 'GitHub',
              accountName: accounts.github?.account_username || 'your account'
            })}
            onRefresh={accounts.github ? handleRefreshGitHub : null}
            connecting={connecting === 'github'}
            features={['Commit analysis', 'Build-in-public content', 'Autopilot source']}
          />

          {/* Placeholder for future integrations */}
          <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-6 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
              <span className="text-2xl">🚀</span>
            </div>
            <h3 className="font-medium text-gray-700 mb-1">More coming soon</h3>
            <p className="text-sm text-gray-500">
              Reddit, Figma, Notion, and more
            </p>
          </div>
        </div>
      </div>

      {/* Connection Status Summary */}
      <div className="bg-gray-50 rounded-2xl p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Connection Status</h3>
        <div className="space-y-3">
          {[
            { key: 'x', name: 'X / Twitter', required: true },
            { key: 'linkedin', name: 'LinkedIn', required: false },
            { key: 'github', name: 'GitHub', required: false },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${accounts[item.key] ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                <span className="text-sm text-gray-700">{item.name}</span>
                {item.required && (
                  <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Required</span>
                )}
              </div>
              <span className={`text-sm ${accounts[item.key] ? 'text-emerald-600' : 'text-gray-400'}`}>
                {accounts[item.key] ? 'Connected' : 'Not connected'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Disconnect Modal */}
      {disconnectModal && (
        <DisconnectModal
          platform={disconnectModal.name}
          accountName={disconnectModal.accountName}
          onConfirm={handleDisconnect}
          onCancel={() => setDisconnectModal(null)}
          loading={disconnecting}
        />
      )}
    </div>
  );
}