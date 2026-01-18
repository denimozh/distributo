import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET - Fetch saved opportunities
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Fetch opportunities from database
    const { data: opportunities, error } = await supabaseAdmin
      .from('reply_opportunities')
      .select('*')
      .eq('user_id', userId)
      .eq('is_replied', false)
      .eq('is_skipped', false)
      .order('relevance_score', { ascending: false })
      .limit(20);

    if (error) {
      console.error('[REPLY-FINDER] DB Error:', error);
      // Return empty array instead of throwing - table might not exist yet
      return NextResponse.json({ 
        success: true, 
        opportunities: [],
        message: 'No opportunities found. Click "Find Conversations" to search.'
      });
    }

    // Transform to frontend format
    const formatted = (opportunities || []).map(opp => ({
      id: opp.id,
      platform: opp.platform,
      author: opp.author_username,
      authorName: opp.author_display_name,
      avatarUrl: opp.author_avatar_url,
      content: opp.content,
      relevance: opp.relevance_score,
      engagement: {
        likes: opp.likes_count || 0,
        replies: opp.replies_count || 0,
        reposts: opp.reposts_count || 0,
        impressions: opp.impressions_count || 0,
      },
      timeAgo: getTimeAgo(opp.posted_at),
      url: opp.post_url,
      isQuestion: opp.is_question,
      matchedKeyword: opp.matched_keyword,
    }));

    return NextResponse.json({ 
      success: true, 
      opportunities: formatted 
    });

  } catch (err) {
    console.error('[REPLY-FINDER] Error:', err);
    return NextResponse.json({ 
      success: true, 
      opportunities: [],
      error: err.message 
    });
  }
}

// POST - Search for new opportunities
export async function POST(request) {
  try {
    const { userId, keywords } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    console.log(`[REPLY-FINDER] Looking for X account for user: ${userId}`);

    // Get user's X access token
    const { data: xAccount, error: accountError } = await supabaseAdmin
      .from('connected_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', 'x')
      .eq('is_active', true)
      .single();

    // Debug: Log all connected accounts for this user
    const { data: allAccounts } = await supabaseAdmin
      .from('connected_accounts')
      .select('id, platform, platform_username, is_active')
      .eq('user_id', userId);
    
    console.log(`[REPLY-FINDER] All accounts for user:`, allAccounts);
    console.log(`[REPLY-FINDER] X account query result:`, { xAccount, accountError });

    if (accountError || !xAccount) {
      console.log('[REPLY-FINDER] No X account found for user');
      return NextResponse.json({ 
        error: 'X account not connected. Please connect your X account in Integrations.',
        needsConnection: true,
        debug: { allAccounts, accountError }
      }, { status: 400 });
    }

    if (!xAccount.access_token) {
      return NextResponse.json({ 
        error: 'X access token missing. Please reconnect your X account.',
        needsConnection: true 
      }, { status: 400 });
    }

    // Get user's keywords
    let searchKeywords = keywords;
    if (!searchKeywords || searchKeywords.length === 0) {
      const { data: savedKeywords } = await supabaseAdmin
        .from('reply_keywords')
        .select('keyword')
        .eq('user_id', userId)
        .eq('is_active', true);
      
      searchKeywords = (savedKeywords || []).map(k => k.keyword);
    }

    if (searchKeywords.length === 0) {
      return NextResponse.json({ 
        error: 'No keywords configured. Add some keywords first.',
        needsKeywords: true 
      }, { status: 400 });
    }

    console.log(`[REPLY-FINDER] Searching for ${searchKeywords.length} keywords with token: ${xAccount.access_token.slice(0, 20)}...`);

    // Get user's profile for relevance scoring
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('product_name, product_description, target_audience')
      .eq('id', userId)
      .single();

    // Search X for each keyword
    const allOpportunities = [];
    const errors = [];
    
    for (const keyword of searchKeywords.slice(0, 5)) { // Limit to 5 keywords per search
      try {
        console.log(`[REPLY-FINDER] Searching for: "${keyword}"`);
        const tweets = await searchXForKeyword(xAccount.access_token, keyword);
        console.log(`[REPLY-FINDER] Found ${tweets.length} tweets for "${keyword}"`);
        
        // Score and filter tweets
        const scored = tweets.map(tweet => ({
          ...tweet,
          matchedKeyword: keyword,
          relevance: calculateRelevanceScore(tweet, keyword, profile),
        })).filter(t => t.relevance >= 60); // Only keep relevant ones
        
        allOpportunities.push(...scored);
      } catch (err) {
        console.error(`[REPLY-FINDER] Error searching "${keyword}":`, err.message);
        errors.push({ keyword, error: err.message });
      }
    }

    // If all keywords failed, return the error
    if (allOpportunities.length === 0 && errors.length > 0) {
      return NextResponse.json({ 
        success: false,
        error: errors[0].error,
        errors,
      }, { status: 400 });
    }

    // Dedupe by tweet ID
    const uniqueOpportunities = Array.from(
      new Map(allOpportunities.map(o => [o.tweetId, o])).values()
    );

    // Sort by relevance
    uniqueOpportunities.sort((a, b) => b.relevance - a.relevance);

    console.log(`[REPLY-FINDER] Found ${uniqueOpportunities.length} unique opportunities`);

    // Save to database
    let savedCount = 0;
    for (const opp of uniqueOpportunities.slice(0, 20)) { // Save top 20
      try {
        const { error: insertError } = await supabaseAdmin
          .from('reply_opportunities')
          .upsert({
            user_id: userId,
            platform: 'x',
            platform_post_id: opp.tweetId,
            author_username: opp.author,
            author_display_name: opp.authorName,
            author_avatar_url: opp.avatarUrl,
            content: opp.content,
            post_url: opp.url,
            posted_at: opp.postedAt,
            likes_count: opp.likes,
            replies_count: opp.replies,
            reposts_count: opp.reposts,
            impressions_count: opp.impressions,
            relevance_score: opp.relevance,
            matched_keyword: opp.matchedKeyword,
            is_question: opp.isQuestion,
            is_replied: false,
            is_skipped: false,
          }, {
            onConflict: 'user_id,platform,platform_post_id',
            ignoreDuplicates: false,
          });

        if (!insertError) savedCount++;
      } catch (err) {
        console.error('[REPLY-FINDER] Insert error:', err);
      }
    }

    return NextResponse.json({ 
      success: true, 
      newOpportunities: savedCount,
      total: uniqueOpportunities.length,
    });

  } catch (err) {
    console.error('[REPLY-FINDER] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ==========================================
// X API SEARCH
// ==========================================

async function searchXForKeyword(accessToken, keyword) {
  // Build search query for high-quality, recent tweets
  // Exclude retweets, include questions, require some engagement
  const query = encodeURIComponent(
    `${keyword} -is:retweet lang:en -is:reply`
  );

  // X API v2 recent search endpoint
  const url = `https://api.twitter.com/2/tweets/search/recent?query=${query}&max_results=15&tweet.fields=created_at,public_metrics,author_id,text&expansions=author_id&user.fields=name,username,profile_image_url,public_metrics`;

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[X-SEARCH] API error:', response.status, errorData);
      
      // Handle specific errors
      if (response.status === 429) {
        throw new Error('X API rate limited. Please try again in 15 minutes.');
      }
      if (response.status === 401 || response.status === 403) {
        throw new Error('X API access denied. Please reconnect your X account or upgrade your API tier.');
      }
      
      throw new Error(`X API error: ${response.status} - ${errorData.detail || errorData.title || 'Unknown error'}`);
    }

    const data = await response.json();
    
    if (!data.data || data.data.length === 0) {
      console.log(`[X-SEARCH] No results for keyword: ${keyword}`);
      return [];
    }

    // Map user data for quick lookup
    const users = new Map();
    if (data.includes?.users) {
      data.includes.users.forEach(user => {
        users.set(user.id, user);
      });
    }

    // Transform tweets
    const tweets = data.data.map(tweet => {
      const author = users.get(tweet.author_id) || {};
      const metrics = tweet.public_metrics || {};
      
      return {
        tweetId: tweet.id,
        content: tweet.text,
        author: `@${author.username || 'unknown'}`,
        authorName: author.name || author.username,
        avatarUrl: author.profile_image_url,
        authorFollowers: author.public_metrics?.followers_count || 0,
        url: `https://x.com/${author.username}/status/${tweet.id}`,
        postedAt: tweet.created_at,
        likes: metrics.like_count || 0,
        replies: metrics.reply_count || 0,
        reposts: metrics.retweet_count || 0,
        impressions: metrics.impression_count || 0,
        isQuestion: /\?|how do|what .*(tool|app|use)|looking for|recommend|anyone know|help me/i.test(tweet.text),
      };
    });

    // Filter by minimum engagement
    return tweets.filter(t => t.likes >= 5 || t.replies >= 2);

  } catch (err) {
    console.error('[X-SEARCH] Error:', err.message);
    throw err;
  }
}

// ==========================================
// RELEVANCE SCORING
// ==========================================

function calculateRelevanceScore(tweet, keyword, profile) {
  let score = 50; // Base score

  // Keyword match bonus
  const content = tweet.content.toLowerCase();
  const keywordLower = keyword.toLowerCase();
  if (content.includes(keywordLower)) {
    score += 15;
  }

  // Question bonus (best opportunities)
  if (tweet.isQuestion) {
    score += 20;
  }

  // Engagement quality bonus
  if (tweet.likes >= 100) score += 10;
  if (tweet.likes >= 500) score += 5;
  if (tweet.replies >= 20) score += 10;
  if (tweet.replies >= 50) score += 5;

  // Author follower bonus (sweet spot: 1k-100k)
  if (tweet.authorFollowers >= 1000 && tweet.authorFollowers <= 100000) {
    score += 10;
  }

  // Product relevance (if profile has product info)
  if (profile?.product_description) {
    const productKeywords = extractKeywords(profile.product_description);
    const matchCount = productKeywords.filter(pk => content.includes(pk)).length;
    score += matchCount * 5;
  }

  // Target audience match
  if (profile?.target_audience) {
    const audienceKeywords = extractKeywords(profile.target_audience);
    const matchCount = audienceKeywords.filter(ak => content.includes(ak)).length;
    score += matchCount * 3;
  }

  // Penalty for very long tweets (harder to reply meaningfully)
  if (tweet.content.length > 250) {
    score -= 5;
  }

  // Penalty for tweets with lots of links/mentions (probably promotional)
  const linkCount = (tweet.content.match(/https?:\/\//g) || []).length;
  const mentionCount = (tweet.content.match(/@\w+/g) || []).length;
  if (linkCount > 1) score -= 10;
  if (mentionCount > 3) score -= 10;

  // Cap at 100
  return Math.min(100, Math.max(0, score));
}

function extractKeywords(text) {
  // Simple keyword extraction
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3)
    .filter(word => !['that', 'this', 'with', 'from', 'have', 'will', 'your', 'they', 'been'].includes(word));
}

// ==========================================
// HELPERS
// ==========================================

function getTimeAgo(dateString) {
  if (!dateString) return 'recently';
  
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
  
  return date.toLocaleDateString();
}