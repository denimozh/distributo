// ============================================================================
// SHARED CONTENT CORE
// Used by both autopilot-generate and generate-batch
// Single source of truth for scoring, detection, cleaning, logging
// ============================================================================

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ============================================================================
// ACTIVITY LOGGING — Makes the machine visible
// ============================================================================
export async function logActivity(userId, type, message, { platform = null, postId = null, metadata = null } = {}) {
  try {
    await supabase.from('activity_log').insert({
      user_id: userId,
      type, // generate | publish | metrics | learn | error | system
      platform, // x | linkedin | github | null
      post_id: postId,
      message,
      metadata,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    // Activity logging should never break the main flow
    console.error('[ACTIVITY_LOG] Failed to log:', err.message);
  }
}

// ============================================================================
// ALIGNMENT SCORE — Unified for both generators
// ============================================================================
export function calculateAlignmentScore(hook, { format = null } = {}) {
  let score = 60;

  const firstLine = hook.split('\n')[0] || '';
  const lines = hook.split('\n').filter(l => l.trim());

  // Negative hook bonus (highest performing on X)
  const negativePatterns = [
    'I almost', 'I broke', 'I failed', 'I wasted', 'I regret',
    "Everyone's wrong", 'Everyone says', 'Nobody tells you',
    'The worst part', 'Confession:', "I've been lying",
    'Nothing pisses me off', "I'm tired of", 'Stop telling me'
  ];
  if (negativePatterns.some(p => firstLine.includes(p))) score += 15;

  // Reply-intent detection (statements that invite replies without ?)
  const replyIntentPatterns = [
    'Fight me', 'Convince me otherwise', 'Change my mind',
    'Curious if this is just me', 'Am I the only one',
    'Unpopular opinion', 'Hot take', 'I dare you'
  ];
  if (replyIntentPatterns.some(p => hook.includes(p))) score += 12;

  // Broetry structure bonus
  if (lines.length >= 4) score += 10;
  const avgLineLength = lines.length > 0 ? lines.reduce((s, l) => s + l.length, 0) / lines.length : 50;
  if (avgLineLength < 50) score += 5;

  // Engagement triggers
  if (hook.endsWith('?')) score += 10;
  if (/\d+/.test(hook)) score += 5;

  // Emotional language
  const emotionalWords = ['hurt', 'scared', 'excited', 'angry', 'frustrated', 'tired', 'obsessed', 'addicted'];
  if (emotionalWords.some(w => hook.toLowerCase().includes(w))) score += 5;

  // Specificity bonus
  if (hook.includes('auth') || hook.includes('API') || hook.includes('bug') || hook.includes('code')) score += 5;

  // Penalize corporate speak
  const bannedStarts = ["I'm excited", 'Just shipped', "Here's what", 'Pro tip', 'Thread'];
  if (bannedStarts.some(p => firstLine.startsWith(p))) score -= 15;

  // Penalize generic content
  if (hook.includes('building something') || hook.includes('working on')) score -= 10;

  // Length checks — DON'T penalize one-liners or questions
  const isOneLiner = lines.length <= 2 && hook.length < 150;
  const isQuestion = hook.endsWith('?');
  if (hook.length < 80 && !isOneLiner && !isQuestion) score -= 10;
  if (hook.length > 270) score -= 5;

  return Math.min(100, Math.max(0, score));
}

// ============================================================================
// FORMAT DETECTION — Runs on every post, overrides AI self-label
// ============================================================================
export function detectFormat(content) {
  if (!content) return 'mixed';
  const lines = content.split('\n').filter(l => l.trim());
  const totalLength = content.length;

  // One-liner: short, punchy, single thought
  if (totalLength < 150 && lines.length <= 2) return 'one_liner';

  // Question: ends with ? and is relatively short
  if (content.trim().endsWith('?') && totalLength < 200) return 'question';

  // Mini-list: uses arrows, bullets, or numbers
  const listMarkers = lines.filter(l => /^[\s]*(→|•|[-]|\d+[.)])\s/.test(l));
  if (listMarkers.length >= 3) return 'mini_list';

  // Broetry: 4+ lines, short lines (< 60 chars avg)
  if (lines.length >= 4) {
    const avgLen = lines.reduce((s, l) => s + l.length, 0) / lines.length;
    if (avgLen < 60) return 'broetry';
  }

  // Narrative: everything else (longer prose)
  return 'narrative';
}

// ============================================================================
// HOOK TYPE DETECTION
// ============================================================================
export function detectHookType(content) {
  if (!content) return 'observational';
  const firstLine = content.split('\n')[0].toLowerCase();

  if (/\b(fail|broke|wrong|waste|regret|mistake|terrible|worst)\b/.test(firstLine)) return 'negative';
  if (firstLine.endsWith('?')) return 'question';
  if (/\d+[%xk$]|\b\d{2,}\b/.test(firstLine)) return 'data';
  if (/\b(shipped|launched|built|deployed|released|live)\b/.test(firstLine)) return 'technical_win';
  return 'observational';
}

// ============================================================================
// POST NORMALIZATION — Clean AI output consistently
// ============================================================================
export function normalizePost(rawPost) {
  let hook = (rawPost.hook || rawPost.content || '').trim();
  let plug = (rawPost.plug || rawPost.reply || '').trim();

  // Remove markdown artifacts
  hook = hook.replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
  plug = plug.replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');

  // Detect actual format (override AI self-label)
  const detectedFormat = detectFormat(hook);
  const detectedHookType = detectHookType(hook);

  // Calculate system alignment score
  const systemScore = calculateAlignmentScore(hook, { format: detectedFormat });

  return {
    hook,
    plug: plug || null,
    format: detectedFormat,
    hookType: detectedHookType,
    systemAlignmentScore: systemScore,
    modelAlignmentScore: rawPost.alignment_score || null,
    communityId: rawPost.communityId || rawPost.community_id || null,
    isSilencePost: !plug || plug.length === 0,
  };
}

// ============================================================================
// VOICE BLOCK — Shared prompt section for both generators
// ============================================================================
export function buildVoiceBlock(styleProfile, userSettings) {
  let block = '';

  if (styleProfile && styleProfile.writing_rules) {
    block += `\n## YOUR VOICE (from analyzed posts)
- Tone: ${styleProfile.tone || 'casual'}
- Style: ${styleProfile.sentence_style || 'short and punchy'}
- Formatting: ${styleProfile.formatting_preference || 'minimal'}
- Writing rules:
${styleProfile.writing_rules.map(r => `  - ${r}`).join('\n')}
${styleProfile.signature_phrases?.length > 0 ? `- Signature phrases: ${styleProfile.signature_phrases.join(', ')}` : ''}
${styleProfile.personality_traits?.length > 0 ? `- Personality: ${styleProfile.personality_traits.join(', ')}` : ''}

CRITICAL: Match this voice exactly. Every post should sound like the user wrote it.`;
  }

  if (userSettings) {
    const prefs = [];
    if (userSettings.defaultTone) prefs.push(`Tone: ${userSettings.defaultTone}`);
    if (userSettings.includeHashtags === false) prefs.push('NO hashtags');
    if (userSettings.includeEmojis === false) prefs.push('NO emojis');
    if (userSettings.includeEmojis === true) prefs.push('Max 1-2 emojis, only when natural');
    if (prefs.length > 0) {
      block += `\n\n## USER PREFERENCES\n${prefs.join('\n')}`;
    }
  }

  return block;
}

// ============================================================================
// INSIGHTS BLOCK — Shared prompt section for content intelligence
// ============================================================================
export function buildInsightsBlock(contentInsights) {
  if (!contentInsights || contentInsights.posts_analyzed < 5) return '';

  let block = `\n## WHAT WORKS FOR YOUR AUDIENCE (${contentInsights.posts_analyzed} posts analyzed)
- Best format: ${contentInsights.best_format}
- Best time: ${contentInsights.best_posting_hour}:00 on ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][contentInsights.best_posting_day || 0]}
- Avg impressions: ${contentInsights.avg_impressions} | Avg replies: ${contentInsights.avg_replies}`;

  if (contentInsights.top_hook_patterns?.length > 0) {
    block += `\n- Top hooks: ${contentInsights.top_hook_patterns.slice(0, 3).map(h => `"${h.hook}"`).join(', ')}`;
  }

  // Format performance directives
  if (contentInsights.format_performance) {
    const entries = Object.entries(contentInsights.format_performance);
    const best = entries.sort((a, b) => {
      const scoreA = typeof a[1] === 'object' ? a[1].avg_score : a[1];
      const scoreB = typeof b[1] === 'object' ? b[1].avg_score : b[1];
      return scoreB - scoreA;
    });
    if (best.length > 0) {
      const [topFormat, topData] = best[0];
      const mult = typeof topData === 'object' ? topData.multiplier : null;
      if (mult && mult >= 1.2) {
        block += `\n\nFORMAT DIRECTIVE: "${topFormat}" performs ${mult}x better. Generate ~45% in this format. Distribute rest across others for variety.`;
      }
    }
  }

  return block;
}

// ============================================================================
// WRITING DNA — Shared extraction
// ============================================================================
export function extractWritingDNA(topPosts) {
  if (!topPosts || topPosts.length === 0) {
    return {
      avgSentenceLength: 'medium',
      usesEmoji: false,
      signaturePatterns: [],
      avgLineCount: 4,
    };
  }

  const allContent = topPosts.map(p => p.hook_content || p.content || '').filter(Boolean);
  const avgLength = allContent.reduce((s, c) => s + c.length, 0) / allContent.length;
  const avgLines = allContent.reduce((s, c) => s + c.split('\n').filter(l => l.trim()).length, 0) / allContent.length;
  const usesEmoji = allContent.some(c => /[\u{1F300}-\u{1FAFF}]/u.test(c));

  const patterns = [];
  if (allContent.some(c => c.includes('→'))) patterns.push('arrow_list');
  if (allContent.some(c => c.endsWith('?'))) patterns.push('question_ender');
  if (allContent.some(c => /\d+[%xk]/.test(c))) patterns.push('data_points');

  return {
    avgSentenceLength: avgLength < 100 ? 'very_short' : avgLength < 200 ? 'short' : 'medium',
    usesEmoji,
    signaturePatterns: patterns,
    avgLineCount: Math.round(avgLines),
  };
}

// ============================================================================
// SILENCE POST ENFORCEMENT
// 10-15% of posts should have no plug, no CTA — just exist
// ============================================================================
export function shouldBeSilencePost(index, totalPosts) {
  // Every ~7th post is a silence post (14%)
  return (index + 1) % 7 === 0;
}

// ============================================================================
// COMMUNITY PROMPT RULE
// ============================================================================
export function buildCommunityRule() {
  return `\nCOMMUNITY POSTS: When communityId is specified, the post MUST feel like a contribution to a conversation, not a broadcast. No self-promo feel. No "just shipped X" energy. Instead: share an insight, ask a genuine question, or make an observation that helps others. The plug reply can still mention your product but the main post should stand alone as valuable.`;
}

// ============================================================================
// LINKEDIN PROMPT MODIFIER
// ============================================================================
export function buildLinkedInModifier() {
  return `\nLINKEDIN FORMAT: When generating for LinkedIn:
- Professional but human tone (not corporate)
- 2-4 short paragraphs instead of single-line broetry
- Add context that X posts skip (why this matters, what you learned)
- No emojis, no Twitter shorthand
- Include a call-to-action or question at the end
- No hashtags inline — they go at the bottom if at all`;
}
