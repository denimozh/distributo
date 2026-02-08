import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getValidAccessToken } from '@/lib/x-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  if (authHeader?.replace('Bearer ', '').trim() !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: posts } = await supabase
      .from('posts')
      .select('id, external_id, user_id, platform, metadata, posted_at')
      .eq('status', 'posted').eq('platform', 'x')
      .not('external_id', 'is', null)
      .gte('posted_at', sevenDaysAgo)
      .or(`metrics_fetched_at.is.null,metrics_fetched_at.lt.${sixHoursAgo}`)
      .limit(50);

    if (!posts?.length) return NextResponse.json({ success: true, checked: 0 });

    const userPosts = {};
    for (const p of posts) { (userPosts[p.user_id] ||= []).push(p); }

    let totalChecked = 0;

    for (const [userId, userPostList] of Object.entries(userPosts)) {
      const { data: account } = await supabase
        .from('connected_accounts').select('*')
        .eq('user_id', userId).eq('platform', 'x').eq('is_active', true).single();
      if (!account) continue;

      try {
        const accessToken = await getValidAccessToken(account);
        for (const post of userPostList) {
          try {
            const res = await fetch(
              `https://api.twitter.com/2/tweets/${post.external_id}?tweet.fields=public_metrics`,
              { headers: { 'Authorization': `Bearer ${accessToken}` } }
            );
            if (!res.ok) { if (res.status === 429) break; continue; }
            const data = await res.json();
            const m = data.data?.public_metrics;
            if (m) {
              const score = (m.reply_count || 0) * 13.5 + (m.retweet_count || 0) * 20 +
                (m.bookmark_count || 0) * 15 + (m.like_count || 0) * 0.5;
              await supabase.from('posts').update({
                impressions_count: m.impression_count || 0,
                likes_count: m.like_count || 0,
                replies_count: m.reply_count || 0,
                retweets_count: m.retweet_count || 0,
                bookmarks_count: m.bookmark_count || 0,
                engagement_score: score,
                metrics_fetched_at: new Date().toISOString(),
              }).eq('id', post.id);
              totalChecked++;
            }
          } catch {}
          await new Promise(r => setTimeout(r, 3100));
        }
      } catch {}
    }

    // Update content insights for each user
    for (const userId of Object.keys(userPosts)) {
      try { await updateContentInsights(userId); } catch {}
    }

    return NextResponse.json({ success: true, checked: totalChecked, users: Object.keys(userPosts).length });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function updateContentInsights(userId) {
  const { data: posts } = await supabase
    .from('posts').select('*')
    .eq('user_id', userId).eq('status', 'posted')
    .not('engagement_score', 'is', null).gt('engagement_score', 0)
    .order('engagement_score', { ascending: false }).limit(100);

  if (!posts?.length || posts.length < 5) return;

  const formatScores = {}, hourScores = {}, dayScores = {};
  for (const post of posts) {
    const format = post.metadata?.format || 'mixed';
    const postedAt = new Date(post.posted_at || post.scheduled_at);
    const hour = postedAt.getHours(), day = postedAt.getDay();
    (formatScores[format] ||= []).push(post.engagement_score);
    (hourScores[hour] ||= []).push(post.engagement_score);
    (dayScores[day] ||= []).push(post.engagement_score);
  }

  const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
  const formatPerf = Object.fromEntries(Object.entries(formatScores).map(([k, v]) => [k, Math.round(avg(v) * 10) / 10]));
  const bestFormat = Object.entries(formatPerf).sort((a, b) => b[1] - a[1])[0]?.[0] || 'mixed';
  const bestHour = Object.entries(hourScores).map(([h, s]) => [+h, avg(s)]).sort((a, b) => b[1] - a[1])[0]?.[0] || 12;
  const bestDay = Object.entries(dayScores).map(([d, s]) => [+d, avg(s)]).sort((a, b) => b[1] - a[1])[0]?.[0] || 2;

  const topHooks = posts.slice(0, 5).map(p => ({
    hook: (p.hook_content || p.content || '').split('\n')[0].slice(0, 80),
    score: Math.round(p.engagement_score),
  }));

  await supabase.from('content_insights').upsert({
    user_id: userId, best_format: bestFormat, best_posting_hour: bestHour,
    best_posting_day: bestDay,
    avg_impressions: Math.round(avg(posts.map(p => p.impressions_count || 0))),
    avg_replies: Math.round(avg(posts.map(p => p.replies_count || 0)) * 10) / 10,
    avg_likes: Math.round(avg(posts.map(p => p.likes_count || 0)) * 10) / 10,
    top_hook_patterns: topHooks, format_performance: formatPerf,
    posts_analyzed: posts.length, last_analyzed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
}
