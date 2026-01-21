import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import crypto from 'crypto';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { repoFullName } = await request.json();

    if (!repoFullName) {
      return NextResponse.json({ error: 'Repository name required' }, { status: 400 });
    }

    // Get user using server client
    const supabase = await createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get GitHub access token
    const { data: account, error: accountError } = await supabaseAdmin
      .from('connected_accounts')
      .select('access_token')
      .eq('user_id', user.id)
      .eq('platform', 'github')
      .eq('is_active', true)
      .single();

    if (accountError || !account) {
      console.error('Account error:', accountError);
      return NextResponse.json({ error: 'GitHub not connected' }, { status: 400 });
    }

    // Generate webhook secret
    const webhookSecret = crypto.randomBytes(32).toString('hex');

    // Create webhook on GitHub with extended events
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/github/webhook`;
    
    console.log(`[WEBHOOK] Creating webhook for ${repoFullName} -> ${webhookUrl}`);
    
    const response = await fetch(`https://api.github.com/repos/${repoFullName}/hooks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${account.access_token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'web',
        active: true,
        // Extended events for all features
        events: [
          'push',           // Commits
          'release',        // Releases / launches
          'pull_request',   // PR merged → feature announcements
          'issues',         // Issue closed → bug fix posts
        ],
        config: {
          url: webhookUrl,
          content_type: 'json',
          secret: webhookSecret,
          insecure_ssl: '0',
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('GitHub webhook error:', error);
      
      // Check if webhook already exists
      if (error.errors?.some(e => e.message?.includes('already exists'))) {
        console.log('Webhook already exists for', repoFullName);
        
        // Try to update existing webhook to include new events
        try {
          await updateExistingWebhook(repoFullName, account.access_token, webhookUrl);
        } catch (updateErr) {
          console.log('Could not update existing webhook:', updateErr.message);
        }
        
        return NextResponse.json({ message: 'Webhook already exists', success: true });
      }
      
      throw new Error(error.message || 'Failed to create webhook');
    }

    const webhookData = await response.json();

    // Update repo with webhook info
    const { error: updateError } = await supabaseAdmin
      .from('github_repos')
      .update({
        webhook_id: webhookData.id,
        webhook_secret: webhookSecret,
        webhook_active: true,
        webhook_events: ['push', 'release', 'pull_request', 'issues'],
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('repo_full_name', repoFullName);

    if (updateError) {
      console.error('Update error:', updateError);
    }

    console.log(`[WEBHOOK] Created webhook for ${repoFullName}: ${webhookData.id}`);

    return NextResponse.json({
      success: true,
      webhookId: webhookData.id,
      events: ['push', 'release', 'pull_request', 'issues'],
    });

  } catch (err) {
    console.error('Error setting up webhook:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Update existing webhook to include new events
async function updateExistingWebhook(repoFullName, accessToken, webhookUrl) {
  // First, list existing webhooks
  const listResponse = await fetch(
    `https://api.github.com/repos/${repoFullName}/hooks`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    }
  );

  if (!listResponse.ok) {
    throw new Error('Could not list webhooks');
  }

  const hooks = await listResponse.json();
  const ourHook = hooks.find(h => h.config?.url?.includes('/api/github/webhook'));

  if (ourHook) {
    // Update the webhook with new events
    const updateResponse = await fetch(
      `https://api.github.com/repos/${repoFullName}/hooks/${ourHook.id}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          events: ['push', 'release', 'pull_request', 'issues'],
          active: true,
        }),
      }
    );

    if (updateResponse.ok) {
      console.log(`[WEBHOOK] Updated existing webhook for ${repoFullName}`);
    }
  }
}

// Delete webhook
export async function DELETE(request) {
  try {
    const { repoFullName, webhookId } = await request.json();

    // Get user using server client
    const supabase = await createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get GitHub access token
    const { data: account } = await supabaseAdmin
      .from('connected_accounts')
      .select('access_token')
      .eq('user_id', user.id)
      .eq('platform', 'github')
      .eq('is_active', true)
      .single();

    if (!account) {
      return NextResponse.json({ error: 'GitHub not connected' }, { status: 400 });
    }

    // Delete webhook from GitHub
    const response = await fetch(`https://api.github.com/repos/${repoFullName}/hooks/${webhookId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${account.access_token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok && response.status !== 404) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete webhook');
    }

    // Clear webhook info from repo
    await supabaseAdmin
      .from('github_repos')
      .update({
        webhook_id: null,
        webhook_secret: null,
        webhook_active: false,
        webhook_events: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('repo_full_name', repoFullName);

    console.log(`[WEBHOOK] Deleted webhook for ${repoFullName}`);

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error('Error deleting webhook:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}