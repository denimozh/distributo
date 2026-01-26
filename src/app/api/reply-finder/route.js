import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ==========================================
// REPLY FINDER - X API FREE TIER
// ==========================================
// Uses X API v2 Recent Search (Free tier: 1,500 tweets/month)
// User's OAuth token for authentication
// ==========================================

// GET - Fetch saved opportunities
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const { data: opportunities } = await supabaseAdmin
      .from('reply_opportunities')
      .select('*')
      .eq('user_id', userId)
      .eq('is_replied', false)
      .eq('is_skipped', false)
      .order('relevance_score', { ascending: false })
      .limit(50);

    const formatted = (opportunities || []).map(formatOpportunity);

    return NextResponse.json({ success: true, opportunities: formatted });
  } catch (err) {
    return NextResponse.json({ success: true, opportunities: [] });
  }
}

// POST - Actions
export async function POST(request) {
  try {
    const { userId, action, keywords, tweetId, replyText, opportunityId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // ==========================================
    // ACTION: Find Opportunities via X API
    // ==========================================
    if (action === 'find_opportunities') {
      // Get user's X account
      const { data: xAccount } = await supabaseAdmin
        .from('connected_accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('platform', 'x')
        .eq('is_active', true)
        .single();

      if (!xAccount?.access_token) {
        return NextResponse.json({ 
          error: 'X account not connected. Please connect in Integrations.',
          needsConnection: true 
        }, { status: 400 });
      }

      // Check if token needs refresh
      let accessToken = xAccount.access_token;
      if (xAccount.expires_at && new Date(xAccount.expires_at) < new Date()) {
        accessToken = await refreshXToken(userId, xAccount);
        if (!accessToken) {
          return NextResponse.json({ 
            error: 'X token expired. Please reconnect your account.',
            needsConnection: true 
          }, { status: 400 });
        }
      }

      // Get keywords
      let searchKeywords = keywords;
      if (!searchKeywords?.length) {
        const { data: saved } = await supabaseAdmin
          .from('reply_keywords')
          .select('keyword')
          .eq('user_id', userId)
          .eq('is_active', true);
        searchKeywords = (saved || []).map(k => k.keyword);
      }

      if (!searchKeywords?.length) {
        return NextResponse.json({ error: 'Add keywords first', needsKeywords: true }, { status: 400 });
      }

      // Get user profile for relevance scoring
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('product_name, product_description, target_audience')
        .eq('id', userId)
        .single();

      const allOpportunities = [];
      const errors = [];
      
      // Search for each keyword (limit to 2 to conserve API quota)
      for (const keyword of searchKeywords.slice(0, 2)) {
        try {
          console.log(`[X-API] Searching for: "${keyword}"`);
          const tweets = await searchXAPI(accessToken, keyword);
          console.log(`[X-API] Found ${tweets.length} tweets for "${keyword}"`);
          
          const scored = tweets.map(t => ({
            ...t,
            matchedKeyword: keyword,
            relevance: calculateRelevanceScore(t, keyword, profile),
          }));

          // Log scores for debugging
          scored.forEach(t => console.log(`[X-API] Tweet score: ${t.relevance} - "${t.content.substring(0, 50)}..."`));

          const filtered = scored.filter(t => t.relevance >= 40); // Lowered threshold
          console.log(`[X-API] ${filtered.length} tweets passed relevance filter`);

          allOpportunities.push(...filtered);
        } catch (err) {
          console.error(`[X-API] Error for "${keyword}":`, err.message);
          errors.push({ keyword, error: err.message });
          
          // If rate limited, stop searching
          if (err.message.includes('429') || err.message.includes('rate')) {
            break;
          }
        }
      }

      // Dedupe by tweet ID
      const unique = Array.from(
        new Map(allOpportunities.map(o => [o.tweetId, o])).values()
      ).sort((a, b) => b.relevance - a.relevance);

      console.log(`[X-API] Saving ${unique.length} opportunities to database`);

      // Save to database
      let savedCount = 0;
      for (const opp of unique.slice(0, 20)) {
        const { error } = await supabaseAdmin
          .from('reply_opportunities')
          .upsert({
            user_id: userId,
            platform: 'x',
            platform_post_id: opp.tweetId,
            author_username: opp.author,
            author_display_name: opp.authorName,
            author_avatar_url: opp.avatarUrl,
            author_followers: opp.authorFollowers,
            content: opp.content,
            post_url: opp.url,
            posted_at: opp.postedAt,
            likes_count: opp.likes,
            replies_count: opp.replies,
            reposts_count: opp.reposts,
            relevance_score: opp.relevance,
            matched_keyword: opp.matchedKeyword,
            is_question: opp.isQuestion,
            is_replied: false,
            is_skipped: false,
          }, { onConflict: 'user_id,platform_post_id' });
        
        if (error) {
          console.error('[X-API] Save error:', error);
        } else {
          savedCount++;
        }
      }

      console.log(`[X-API] Successfully saved ${savedCount} opportunities`);

      // Return result with any errors
      if (savedCount === 0 && errors.length > 0) {
        return NextResponse.json({ 
          success: false, 
          error: errors[0].error,
          errors 
        }, { status: 400 });
      }

      return NextResponse.json({ 
        success: true, 
        newOpportunities: savedCount,
        totalFound: unique.length,
        errors: errors.length > 0 ? errors : undefined,
      });
    }

    // ==========================================
    // ACTION: Post Reply via X API
    // ==========================================
    if (action === 'post_reply') {
      if (!tweetId || !replyText) {
        return NextResponse.json({ error: 'Tweet ID and reply required' }, { status: 400 });
      }

      const { data: xAccount } = await supabaseAdmin
        .from('connected_accounts')
        .select('access_token, expires_at, refresh_token')
        .eq('user_id', userId)
        .eq('platform', 'x')
        .eq('is_active', true)
        .single();

      if (!xAccount?.access_token) {
        return NextResponse.json({ 
          error: 'X account not connected',
          needsConnection: true,
          fallback: 'clipboard',
        }, { status: 400 });
      }

      // Refresh token if needed
      let accessToken = xAccount.access_token;
      if (xAccount.expires_at && new Date(xAccount.expires_at) < new Date()) {
        accessToken = await refreshXToken(userId, xAccount);
        if (!accessToken) {
          return NextResponse.json({ 
            error: 'Token expired',
            fallback: 'clipboard' 
          }, { status: 400 });
        }
      }

      try {
        const response = await fetch('https://api.twitter.com/2/tweets', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: replyText,
            reply: { in_reply_to_tweet_id: tweetId },
          }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          console.error('[X-API] Post reply error:', response.status, err);
          
          if (response.status === 429) {
            return NextResponse.json({ 
              error: 'Rate limited. Try again in 15 minutes.',
              fallback: 'clipboard' 
            }, { status: 429 });
          }
          if (response.status === 401 || response.status === 403) {
            return NextResponse.json({ 
              error: 'Not authorized to post. Please reconnect X account.',
              needsConnection: true,
              fallback: 'clipboard' 
            }, { status: 403 });
          }
          throw new Error(`X API: ${response.status}`);
        }

        const data = await response.json();

        // Mark as replied
        if (opportunityId) {
          await supabaseAdmin
            .from('reply_opportunities')
            .update({ is_replied: true })
            .eq('id', opportunityId);
        } else {
          await supabaseAdmin
            .from('reply_opportunities')
            .update({ is_replied: true })
            .eq('user_id', userId)
            .eq('platform_post_id', tweetId);
        }

        // Log reply
        await supabaseAdmin.from('user_replies').insert({
          user_id: userId,
          opportunity_id: opportunityId,
          platform: 'x',
          reply_content: replyText,
          external_reply_id: data.data?.id,
        });

        return NextResponse.json({ 
          success: true, 
          replyId: data.data?.id,
          replyUrl: `https://x.com/i/status/${data.data?.id}`,
        });

      } catch (err) {
        console.error('[X-API] Post reply error:', err);
        return NextResponse.json({ 
          error: err.message, 
          fallback: 'clipboard' 
        }, { status: 500 });
      }
    }

    // ==========================================
    // ACTION: Skip
    // ==========================================
    if (action === 'skip') {
      await supabaseAdmin
        .from('reply_opportunities')
        .update({ is_skipped: true })
        .eq('id', opportunityId);
      return NextResponse.json({ success: true });
    }

    // ==========================================
    // ACTION: Mark replied (manual/clipboard)
    // ==========================================
    if (action === 'mark_replied') {
      await supabaseAdmin
        .from('reply_opportunities')
        .update({ is_replied: true })
        .eq('id', opportunityId);

      if (replyText) {
        await supabaseAdmin.from('user_replies').insert({
          user_id: userId,
          opportunity_id: opportunityId,
          platform: 'x',
          reply_content: replyText,
        });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (err) {
    console.error('[REPLY-FINDER]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ==========================================
// X API v2 RECENT SEARCH
// ==========================================

async function searchXAPI(accessToken, keyword) {
  // Build query - search for keyword, exclude retweets and replies, English only
  const query = encodeURIComponent(`${keyword} -is:retweet -is:reply lang:en`);
  
  // Calculate start_time for last 3 hours
  const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
  
  // X API v2 Recent Search endpoint
  // Free tier: 1 request per second, 10 results max
  const url = `https://api.twitter.com/2/tweets/search/recent?query=${query}&max_results=10&start_time=${threeHoursAgo}&tweet.fields=created_at,public_metrics,author_id,conversation_id&expansions=author_id&user.fields=name,username,profile_image_url,public_metrics`;

  console.log(`[X-API] Request: ${url}`);
  console.log(`[X-API] Searching tweets from last 3 hours (since ${threeHoursAgo})`);

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('[X-API] Search error:', response.status, errorData);
    
    if (response.status === 429) {
      throw new Error('Rate limited (429). X Free tier: 1 request/sec, 1,500 tweets/month.');
    }
    if (response.status === 401) {
      throw new Error('Unauthorized (401). Token may be expired.');
    }
    if (response.status === 403) {
      throw new Error('Forbidden (403). Your X app may not have search access. Check your X Developer Portal permissions.');
    }
    
    throw new Error(`X API error: ${response.status} - ${errorData.detail || errorData.title || 'Unknown'}`);
  }

  const data = await response.json();
  
  if (!data.data || data.data.length === 0) {
    console.log(`[X-API] No results for: ${keyword}`);
    return [];
  }

  // Map users for quick lookup
  const users = new Map();
  if (data.includes?.users) {
    data.includes.users.forEach(user => {
      users.set(user.id, user);
    });
  }

  // Transform tweets and filter for accounts with 2.5k+ followers
  const MIN_FOLLOWERS = 2500;
  
  const tweets = data.data.map(tweet => {
    const author = users.get(tweet.author_id) || {};
    const metrics = tweet.public_metrics || {};
    
    return {
      tweetId: tweet.id,
      content: tweet.text,
      author: `@${author.username || 'unknown'}`,
      authorName: author.name || author.username,
      avatarUrl: author.profile_image_url?.replace('_normal', '_200x200'),
      authorFollowers: author.public_metrics?.followers_count || 0,
      url: `https://x.com/${author.username}/status/${tweet.id}`,
      postedAt: tweet.created_at,
      likes: metrics.like_count || 0,
      replies: metrics.reply_count || 0,
      reposts: metrics.retweet_count || 0,
      impressions: metrics.impression_count || 0,
      isQuestion: /\?|how do|what .*(tool|app|software)|looking for|recommend|anyone know|help me|suggestions|advice/i.test(tweet.text || ''),
    };
  });

  // Filter for big accounts (2.5k+ followers)
  const filtered = tweets.filter(t => t.authorFollowers >= MIN_FOLLOWERS);
  console.log(`[X-API] Filtered to ${filtered.length}/${tweets.length} tweets from accounts with ${MIN_FOLLOWERS}+ followers`);
  
  return filtered;
}

// ==========================================
// TOKEN REFRESH
// ==========================================

async function refreshXToken(userId, xAccount) {
  if (!xAccount.refresh_token) {
    console.log('[X-API] No refresh token available');
    return null;
  }

  try {
    const clientId = process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID;
    const clientSecret = process.env.TWITTER_CLIENT_SECRET;
    
    const response = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: xAccount.refresh_token,
      }),
    });

    if (!response.ok) {
      console.error('[X-API] Token refresh failed:', response.status);
      return null;
    }

    const tokens = await response.json();
    
    // Update tokens in database
    await supabaseAdmin
      .from('connected_accounts')
      .update({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      })
      .eq('user_id', userId)
      .eq('platform', 'x');

    console.log('[X-API] Token refreshed successfully');
    return tokens.access_token;
  } catch (err) {
    console.error('[X-API] Token refresh error:', err);
    return null;
  }
}

// ==========================================
// HELPERS
// ==========================================

function formatOpportunity(opp) {
  return {
    id: opp.id,
    tweetId: opp.platform_post_id,
    author: opp.author_username,
    authorName: opp.author_display_name,
    avatarUrl: opp.author_avatar_url,
    authorFollowers: opp.author_followers,
    content: opp.content,
    relevance: opp.relevance_score,
    engagement: {
      likes: opp.likes_count || 0,
      replies: opp.replies_count || 0,
      reposts: opp.reposts_count || 0,
    },
    timeAgo: getTimeAgo(opp.posted_at),
    url: opp.post_url,
    isQuestion: opp.is_question,
    matchedKeyword: opp.matched_keyword,
  };
}

function getTimeAgo(dateString) {
  if (!dateString) return '';
  const seconds = Math.floor((Date.now() - new Date(dateString)) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

function calculateRelevanceScore(tweet, keyword, profile) {
  let score = 50;
  const content = (tweet.content || '').toLowerCase();

  // Keyword match
  if (keyword && content.includes(keyword.toLowerCase())) score += 15;
  
  // Question = high value
  if (tweet.isQuestion) score += 25;
  
  // Engagement signals (weighted higher for recent tweets)
  if (tweet.likes >= 5) score += 5;
  if (tweet.likes >= 20) score += 5;
  if (tweet.likes >= 50) score += 5;
  if (tweet.replies >= 3) score += 5;
  if (tweet.replies >= 10) score += 5;
  
  // Follower tiers - reward bigger accounts
  if (tweet.authorFollowers >= 2500 && tweet.authorFollowers < 10000) score += 10;
  if (tweet.authorFollowers >= 10000 && tweet.authorFollowers < 50000) score += 15;
  if (tweet.authorFollowers >= 50000 && tweet.authorFollowers < 200000) score += 12;
  if (tweet.authorFollowers >= 200000) score += 8; // Slightly less - harder to get noticed
  
  // Product relevance
  if (profile?.product_description) {
    const words = profile.product_description.toLowerCase().split(/\s+/).filter(w => w.length > 4);
    const matches = words.filter(w => content.includes(w)).length;
    score += Math.min(matches * 3, 12);
  }

  // Penalty for spammy content
  const links = (content.match(/https?:\/\//g) || []).length;
  const mentions = (content.match(/@\w+/g) || []).length;
  if (links > 2) score -= 15;
  if (mentions > 3) score -= 10;
  
  // Penalty for very short content
  if (content.length < 50) score -= 10;

  return Math.min(100, Math.max(0, Math.round(score)));
}