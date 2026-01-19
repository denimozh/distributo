import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/x/communities - Get user's saved communities
export async function GET(request) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: communities, error } = await supabase
    .from('x_communities')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('community_name', { ascending: true });

  if (error) {
    console.error('Error fetching communities:', error);
    return NextResponse.json({ error: 'Failed to fetch communities' }, { status: 500 });
  }

  return NextResponse.json({ communities });
}

// POST /api/x/communities - Add a new community
export async function POST(request) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { communityId, communityName, communityDescription } = body;

    // Validate
    if (!communityId || !communityName) {
      return NextResponse.json({ 
        error: 'Community ID and name are required' 
      }, { status: 400 });
    }

    // Clean community ID (in case user pastes full URL)
    const cleanCommunityId = communityId
      .replace('https://x.com/i/communities/', '')
      .replace('https://twitter.com/i/communities/', '')
      .trim();

    // Check if already exists
    const { data: existing } = await supabase
      .from('x_communities')
      .select('id')
      .eq('user_id', user.id)
      .eq('community_id', cleanCommunityId)
      .single();

    if (existing) {
      // Reactivate if it was disabled
      await supabase
        .from('x_communities')
        .update({ 
          is_active: true, 
          community_name: communityName,
          community_description: communityDescription || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      return NextResponse.json({ 
        success: true, 
        message: 'Community updated',
        communityId: cleanCommunityId
      });
    }

    // Insert new community
    const { data: community, error: insertError } = await supabase
      .from('x_communities')
      .insert({
        user_id: user.id,
        community_id: cleanCommunityId,
        community_name: communityName,
        community_description: communityDescription || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error adding community:', insertError);
      return NextResponse.json({ error: 'Failed to add community' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      community,
      message: 'Community added!'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/x/communities - Remove a community
export async function DELETE(request) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const communityId = searchParams.get('communityId');

  if (!communityId) {
    return NextResponse.json({ error: 'Community ID is required' }, { status: 400 });
  }

  // Soft delete - just mark as inactive
  const { error } = await supabase
    .from('x_communities')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('community_id', communityId);

  if (error) {
    console.error('Error removing community:', error);
    return NextResponse.json({ error: 'Failed to remove community' }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'Community removed' });
}
