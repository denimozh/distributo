import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    // Get user from Supabase using server client
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

    // Fetch repos from GitHub
    const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
      headers: {
        'Authorization': `Bearer ${account.access_token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('GitHub API error:', error);
      throw new Error(error.message || 'Failed to fetch repos');
    }

    const repos = await response.json();

    // Return simplified repo data
    const simplifiedRepos = repos.map(repo => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      html_url: repo.html_url,
      default_branch: repo.default_branch,
      private: repo.private,
      language: repo.language,
      updated_at: repo.updated_at,
    }));

    return NextResponse.json({ repos: simplifiedRepos });

  } catch (err) {
    console.error('Error fetching repos:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}