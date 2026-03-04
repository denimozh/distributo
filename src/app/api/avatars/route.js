// src/app/api/avatars/route.js
// Get available avatars (system + user's custom)

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const supabase = createServiceClient();

    // Get system avatars + user's custom avatars
    let query = supabase
      .from('avatars')
      .select('*, voices(id, name, style, gender)')
      .order('is_system', { ascending: false })
      .order('name');

    if (userId) {
      // System avatars OR user's own avatars
      query = query.or(`is_system.eq.true,user_id.eq.${userId}`);
    } else {
      // Only system avatars
      query = query.eq('is_system', true);
    }

    const { data: avatars, error } = await query;

    if (error) {
      console.error('Failed to fetch avatars:', error);
      return NextResponse.json(
        { error: 'Failed to fetch avatars' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      avatars,
      count: avatars.length,
    });

  } catch (error) {
    console.error('Avatars API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
