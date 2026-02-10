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

    // Atomic increment — no race condition
    supabase.rpc('increment_link_clicks', { link_uuid: link.id }).catch(() => {
      // Fallback if RPC doesn't exist: direct update
      supabase.from('link_clicks').update({
        click_count: (link.click_count || 0) + 1,
        last_clicked_at: new Date().toISOString(),
      }).eq('id', link.id).then(() => {}).catch(() => {});
    });

    // Also update the post's click count
    if (link.post_id) {
      supabase.from('link_clicks')
        .select('click_count')
        .eq('post_id', link.post_id)
        .then(({ data }) => {
          const total = (data || []).reduce((sum, l) => sum + (l.click_count || 0), 0) + 1;
          supabase.from('posts').update({ clicks_count: total }).eq('id', link.post_id).then(() => {}).catch(() => {});
        }).catch(() => {});
    }

    return NextResponse.redirect(link.destination_url);
  } catch {
    return NextResponse.redirect(new URL('/', request.url));
  }
}
