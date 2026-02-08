import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request, { params }) {
  const { code } = params;
  if (!code || code.length > 20) return NextResponse.redirect(new URL('/', request.url));

  try {
    const { data: link, error } = await supabase
      .from('link_clicks')
      .select('*')
      .eq('short_code', code)
      .single();

    if (error || !link) return NextResponse.redirect(new URL('/', request.url));

    // Fire-and-forget click increment
    supabase.from('link_clicks').update({
      click_count: (link.click_count || 0) + 1,
      last_clicked_at: new Date().toISOString(),
    }).eq('id', link.id).then(() => {}).catch(() => {});

    if (link.post_id) {
      supabase.from('posts').update({
        clicks_count: (link.click_count || 0) + 1
      }).eq('id', link.post_id).then(() => {}).catch(() => {});
    }

    return NextResponse.redirect(link.destination_url);
  } catch {
    return NextResponse.redirect(new URL('/', request.url));
  }
}
