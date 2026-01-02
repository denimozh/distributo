import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { repoFullName } = await request.json();

    if (!repoFullName) {
      return NextResponse.json({ error: 'Repository name required' }, { status: 400 });
    }

    // Get user
    const cookieStore = cookies();
    const accessToken = cookieStore.get('sb-access-token')?.value;
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get GitHub access token
    const { data: account, error: accountError } = await supabase
      .from('connected_accounts')
      .select('access_token')
      .eq('user_id', user.id)
      .eq('platform', 'github')
      .eq('is_active', true)
      .single();

    if (!account) {
      return NextResponse.json({ error: 'GitHub not connected' }, { status: 400 });
    }

    // Generate webhook secret
    const webhookSecret = crypto.randomBytes(32).toString('hex');

    // Create webhook on GitHub
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/github/webhook`;
    
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
        events: ['push'],
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
      
      // Check if webhook already exists
      if (error.errors?.some(e => e.message?.includes('already exists'))) {
        console.log('Webhook already exists for', repoFullName);
        return NextResponse.json({ message: 'Webhook already exists' });
      }
      
      throw new Error(error.message || 'Failed to create webhook');
    }

    const webhookData = await response.json();

    // Update repo with webhook info
    await supabase
      .from('github_repos')
      .update({
        webhook_id: webhookData.id,
        webhook_secret: webhookSecret,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('full_name', repoFullName);

    console.log(`[WEBHOOK] Created webhook for ${repoFullName}: ${webhookData.id}`);

    return NextResponse.json({
      success: true,
      webhookId: webhookData.id,
    });

  } catch (err) {
    console.error('Error setting up webhook:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Delete webhook
export async function DELETE(request) {
  try {
    const { repoFullName, webhookId } = await request.json();

    // Get user
    const cookieStore = cookies();
    const accessToken = cookieStore.get('sb-access-token')?.value;
    
    const { data: { user } } = await supabase.auth.getUser(accessToken);
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get GitHub access token
    const { data: account } = await supabase
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
    await supabase
      .from('github_repos')
      .update({
        webhook_id: null,
        webhook_secret: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('full_name', repoFullName);

    console.log(`[WEBHOOK] Deleted webhook for ${repoFullName}`);

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error('Error deleting webhook:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}