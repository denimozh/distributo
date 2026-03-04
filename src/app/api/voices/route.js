// src/app/api/voices/route.js
// Get available voices

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(request) {
  try {
    const supabase = createServiceClient();

    const { data: voices, error } = await supabase
      .from('voices')
      .select('*')
      .eq('is_system', true)
      .order('gender')
      .order('name');

    if (error) {
      console.error('Failed to fetch voices:', error);
      return NextResponse.json(
        { error: 'Failed to fetch voices' },
        { status: 500 }
      );
    }

    // Group by gender for easier UI rendering
    const grouped = {
      female: voices.filter(v => v.gender === 'female'),
      male: voices.filter(v => v.gender === 'male'),
      neutral: voices.filter(v => v.gender === 'neutral'),
    };

    return NextResponse.json({
      voices,
      grouped,
      count: voices.length,
    });

  } catch (error) {
    console.error('Voices API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
