import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getValidAccessToken } from '@/lib/x-auth';
import { logActivity, detectFormat, detectHookType } from '@/lib/content-core';

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
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id, external_id, user_id, platform, metadata, posted_at')
      .eq('status', 'posted').eq('platform', 'x')
      .not('external_id', 'is', null)
      .gte('posted_at', thirtyDaysAgo)
      .or(`metrics_fetched_at.is.null,metrics_fetched_at.lt.${sixHoursAgo}`)
      .limit(50);

    if (postsError) {
      console.error('[METRICS] Error fetching posts:', postsError);
      return NextResponse.json({ error: postsError.message }, { status: 500 });
    }

    if (!posts?.length) {
      console.log('[METRICS] No posts need metrics update');
      return NextResponse.json({ success: true, checked: 0 });
    }

    const userPosts = {};
    for (const p of posts) { (userPosts[p.user_id] ||= []).push(p); }

    let totalChecked = 0;
    let totalErrors = 0;

    for (const [userId, userPostList] of Object.entries(userPosts)) {
      const { data: account } = await supabase
        .from('connected_accounts').select('*')
        .eq('user_id', userId).eq('platform', 'x').eq('is_active', true).single();
      
      if (!account) {
        console.warn(`[METRICS] No X account for user ${userId.slice(0, 8)}`);
        continue;
      }

      let accessToken;
      try {
        accessToken = await getValidAccessToken(account);
      } catch (tokenErr) {
        console.error(`[METRICS] Token refresh failed for user ${userId.slice(0, 8)}:`, tokenErr.message);
        continue;
      }

      if (!accessToken) continue;

      for (const post of userPostList) {
        try {
          const res = await fetch(
            `https://api.twitter.com/2/tweets/${post.external_id}?tweet.fields=public_metrics`,
            { headers: { 'Authorization': `Bearer ${accessToken}` } }
          );

          if (!res.ok) {
            if (res.status === 429) { console.warn(`[METRICS] Rate limited for ${userId.slice(0, 8)}`); break; }
            if (res.status === 401) { console.error(`[METRICS] Auth failed for ${userId.slice(0, 8)}`); break; }
            totalErrors++;
            continue;
          }

          const data = await res.json();
          const m = data.data?.public_metrics;
          
          if (m) {
            // Get click data from link_clicks table
            let clickCount = 0;
            try {
              const { data: linkData } = await supabase
                .from('link_clicks').select('click_count').eq('post_id', post.id);
              clickCount = (linkData || []).reduce((sum, l) => sum + (l.click_count || 0), 0);
            } catch {}

            // Distributo Score — clicks are worth 20x a like
            const score = 
              (m.like_count || 0) * 1 + 
              (m.reply_count || 0) * 5 + 
              (m.retweet_count || 0) * 10 + 
              (m.bookmark_count || 0) * 15 +
              clickCount * 20;

            await supabase.from('posts').update({
              impressions_count: m.impression_count || 0,
              likes_count: m.like_count || 0,
              replies_count: m.reply_count || 0,
              retweets_count: m.retweet_count || 0,
              bookmarks_count: m.bookmark_count || 0,
              clicks_count: clickCount,
              engagement_score: score,
              metrics_fetched_at: new Date().toISOString(),
            }).eq('id', post.id);

            totalChecked++;
          }
        } catch (fetchErr) {
          console.error(`[METRICS] Error for post ${post.id.slice(0, 8)}:`, fetchErr.message);
          totalErrors++;
        }
        await new Promise(r => setTimeout(r, 3100));
      }
    }

    // Update content insights for each user
    for (const userId of Object.keys(userPosts)) {
      try { 
        await updateContentInsights(userId); 
        await logActivity(userId, 'learn', `Updated content intelligence (${userPosts[userId].length} posts analyzed)`);
      } catch (err) {
        console.error(`[METRICS] Insight update failed for ${userId.slice(0, 8)}:`, err.message);
      }

      await logActivity(userId, 'metrics', `Fetched metrics for ${userPosts[userId].length} posts`, {
        metadata: { postsChecked: userPosts[userId].length },
      });
    }

    console.log(`[METRICS] Done: ${totalChecked} updated, ${totalErrors} errors`);
    return NextResponse.json({ success: true, checked: totalChecked, errors: totalErrors, users: Object.keys(userPosts).length });
  } catch (error) {
    console.error('[METRICS] Cron error:', error);
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

  const now = new Date();
  const formatScores = {}, hourScores = {}, dayScores = {};
  
  for (const post of posts) {
    const format = post.metadata?.format || detectFormat(post.hook_content || post.content);
    const postedAt = new Date(post.posted_at || post.scheduled_at);
    const hour = postedAt.getHours(), day = postedAt.getDay();
    
    // Recency weighting: last 7 days = 1.0, 8-30 days = 0.4
    const daysAgo = (now - postedAt) / 86400000;
    const weight = daysAgo <= 7 ? 1.0 : 0.4;
    const weightedScore = post.engagement_score * weight;
    
    (formatScores[format] ||= []).push({ score: weightedScore, raw: post.engagement_score });
    (hourScores[hour] ||= []).push(weightedScore);
    (dayScores[day] ||= []).push(weightedScore);
  }

  const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  const avgScore = avg(posts.map(p => p.engagement_score));

  const formatPerf = {};
  for (const [format, scores] of Object.entries(formatScores)) {
    const formatAvg = avg(scores.map(s => s.score));
    formatPerf[format] = {
      avg_score: Math.round(formatAvg * 10) / 10,
      count: scores.length,
      multiplier: avgScore > 0 ? Math.round((formatAvg / avgScore) * 10) / 10 : 1,
    };
  }

  const sortedFormats = Object.entries(formatPerf).sort((a, b) => b[1].avg_score - a[1].avg_score);
  const bestFormat = sortedFormats[0]?.[0] || 'mixed';
  const bestHour = Object.entries(hourScores).map(([h, s]) => [+h, avg(s)]).sort((a, b) => b[1] - a[1])[0]?.[0] || 12;
  const bestDay = Object.entries(dayScores).map(([d, s]) => [+d, avg(s)]).sort((a, b) => b[1] - a[1])[0]?.[0] || 2;

  const topHooks = posts.slice(0, 5).map(p => ({
    hook: (p.hook_content || p.content || '').split('\n')[0].slice(0, 100),
    score: Math.round(p.engagement_score),
    format: p.metadata?.format || detectFormat(p.hook_content || p.content),
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

function detectFormat(content) {
  if (!content) return 'mixed';
  const lines = content.split('\n').filter(l => l.trim());
  const avgLineLen = lines.reduce((s, l) => s + l.length, 0) / (lines.length || 1);
  if (lines.length >= 4 && avgLineLen < 60) return 'broetry';
  if (lines.length === 1 && content.length < 150) return 'one_liner';
  if (content.split('\n')[0]?.endsWith('?')) return 'question';
  if (content.includes('→') || /\d+[\.\)]\s/.test(content)) return 'mini_list';
  return 'narrative';
}
