import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const supabase = await createClient();
  const body = await request.json();
  const { email, source } = body;

  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
  }

  // Check if email already exists
  const { data: existing } = await supabase
    .from('waitlist')
    .select('id')
    .eq('email', email)
    .single();

  if (existing) {
    return NextResponse.json({ message: 'Already on waitlist' });
  }

  const { error } = await supabase
    .from('waitlist')
    .insert({
      email,
      source: source || 'landing_page',
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Added to waitlist' });
}
