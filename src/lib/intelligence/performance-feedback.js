// src/lib/intelligence/performance-feedback.js
// Performance Feedback Loop
// Analyzes video performance and extracts winning patterns
// Injects patterns into future Claude prompts for better content

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ===========================================
// WINNING PATTERN EXTRACTION
// ===========================================

/**
 * Analyze campaign videos and extract winning patterns
 * Run weekly or after significant data accumulation
 */
export async function extractWinningPatterns(userId) {
  console.log(`[Feedback] Extracting winning patterns for user ${userId}`);
  
  // Get all videos with performance data
  const { data: videos, error } = await supabase
    .from("videos")
    .select(`
      *,
      campaigns (
        product_name,
        product_benefit,
        target_audience,
        business_type
      )
    `)
    .eq("user_id", userId)
    .gt("views", 100) // Only analyze videos with meaningful data
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !videos?.length) {
    console.log("[Feedback] No videos with data to analyze");
    return { patterns: [], message: "Not enough data yet" };
  }

  // Calculate engagement rates
  const videosWithMetrics = videos.map(v => ({
    ...v,
    engagementRate: v.views > 0 
      ? (v.likes + v.comments + v.shares) / v.views 
      : 0,
  }));

  // Find top performers (top 20%)
  const sorted = videosWithMetrics.sort((a, b) => b.engagementRate - a.engagementRate);
  const topPerformers = sorted.slice(0, Math.ceil(sorted.length * 0.2));
  
  if (topPerformers.length < 3) {
    console.log("[Feedback] Need at least 3 top performers to extract patterns");
    return { patterns: [], message: "Need more data" };
  }

  // Extract patterns from top performers
  const patterns = [];

  // Pattern 1: Winning pillar/hook types
  const pillarCounts = {};
  const hookTypeCounts = {};
  
  for (const video of topPerformers) {
    const pillar = video.pillar_id || 'unknown';
    const hookType = video.hook_type || 'discovery';
    
    if (!pillarCounts[pillar]) {
      pillarCounts[pillar] = { count: 0, totalEngagement: 0 };
    }
    pillarCounts[pillar].count++;
    pillarCounts[pillar].totalEngagement += video.engagementRate;
    
    if (!hookTypeCounts[hookType]) {
      hookTypeCounts[hookType] = { count: 0, totalEngagement: 0 };
    }
    hookTypeCounts[hookType].count++;
    hookTypeCounts[hookType].totalEngagement += video.engagementRate;
  }

  // Add pillar patterns
  for (const [pillar, data] of Object.entries(pillarCounts)) {
    if (data.count >= 2) { // At least 2 videos with this pillar
      patterns.push({
        pattern_type: 'pillar',
        pattern_value: pillar,
        sample_size: data.count,
        avg_engagement_rate: data.totalEngagement / data.count,
        confidence_score: Math.min(data.count / 10, 1), // Max confidence at 10 samples
      });
    }
  }

  // Add hook type patterns
  for (const [hookType, data] of Object.entries(hookTypeCounts)) {
    if (data.count >= 2) {
      patterns.push({
        pattern_type: 'delivery_mechanism',
        pattern_value: hookType,
        sample_size: data.count,
        avg_engagement_rate: data.totalEngagement / data.count,
        confidence_score: Math.min(data.count / 10, 1),
      });
    }
  }

  // Pattern 2: Extract common phrases from winning scripts
  const winningPhrases = extractCommonPhrases(topPerformers.map(v => v.script));
  for (const phrase of winningPhrases) {
    patterns.push({
      pattern_type: 'hook_phrase',
      pattern_value: phrase.phrase,
      sample_size: phrase.count,
      avg_engagement_rate: phrase.avgEngagement,
      confidence_score: Math.min(phrase.count / 5, 1),
    });
  }

  // Pattern 3: CTA style analysis
  const ctaStyles = analyzeCTAStyles(topPerformers.map(v => v.script));
  for (const cta of ctaStyles) {
    patterns.push({
      pattern_type: 'cta_style',
      pattern_value: cta.style,
      sample_size: cta.count,
      avg_engagement_rate: cta.avgEngagement,
      confidence_score: Math.min(cta.count / 5, 1),
    });
  }

  // Save patterns to database
  const validPatterns = patterns.filter(p => p.confidence_score >= 0.4);
  
  if (validPatterns.length > 0) {
    // Deactivate old patterns
    await supabase
      .from("winning_patterns")
      .update({ is_active: false })
      .eq("user_id", userId);

    // Insert new patterns
    const patternRecords = validPatterns.map(p => ({
      user_id: userId,
      ...p,
      is_active: true,
    }));

    await supabase.from("winning_patterns").insert(patternRecords);
  }

  console.log(`[Feedback] Extracted ${validPatterns.length} winning patterns`);
  return { patterns: validPatterns, message: "Patterns extracted successfully" };
}

/**
 * Extract common opening phrases from winning scripts
 */
function extractCommonPhrases(scripts) {
  const phraseMap = {};
  
  // Common UGC opener patterns to look for
  const openerPatterns = [
    /^(Hey if you're|If you're|If you've been|POV:|Stop|Wait|Okay so)/i,
    /^(I was|I tried|I spent|Nobody told me|The thing about)/i,
    /^(\d+ (days|weeks|months) ago)/i,
  ];
  
  for (const script of scripts) {
    if (!script) continue;
    
    // Get first 10 words
    const firstWords = script.split(/\s+/).slice(0, 10).join(' ');
    
    // Check for pattern matches
    for (const pattern of openerPatterns) {
      const match = firstWords.match(pattern);
      if (match) {
        const phrase = match[0];
        if (!phraseMap[phrase]) {
          phraseMap[phrase] = { count: 0, engagements: [] };
        }
        phraseMap[phrase].count++;
        break;
      }
    }
  }
  
  // Convert to array and filter
  return Object.entries(phraseMap)
    .filter(([_, data]) => data.count >= 2)
    .map(([phrase, data]) => ({
      phrase,
      count: data.count,
      avgEngagement: data.engagements.length > 0 
        ? data.engagements.reduce((a, b) => a + b) / data.engagements.length 
        : 0.05, // Default engagement
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

/**
 * Analyze CTA styles in winning scripts
 */
function analyzeCTAStyles(scripts) {
  const styleMap = {};
  
  // CTA patterns
  const ctaPatterns = {
    'friend_recommendation': /(genuinely think|honestly|just check it out|you should try)/i,
    'soft_cta': /(link in bio|check it out|let me know)/i,
    'question_cta': /(what do you think|have you tried|does anyone else)/i,
    'urgency': /(before|while|limited|only)/i,
  };
  
  for (const script of scripts) {
    if (!script) continue;
    
    // Get last 20 words (CTA area)
    const words = script.split(/\s+/);
    const lastWords = words.slice(-20).join(' ');
    
    for (const [style, pattern] of Object.entries(ctaPatterns)) {
      if (pattern.test(lastWords)) {
        if (!styleMap[style]) {
          styleMap[style] = { count: 0 };
        }
        styleMap[style].count++;
        break;
      }
    }
  }
  
  return Object.entries(styleMap)
    .filter(([_, data]) => data.count >= 2)
    .map(([style, data]) => ({
      style,
      count: data.count,
      avgEngagement: 0.05, // Default
    }))
    .sort((a, b) => b.count - a.count);
}

// ===========================================
// PILLAR PERFORMANCE AGGREGATION
// ===========================================

/**
 * Aggregate pillar performance for a user
 * Creates weekly insights for the analytics page
 */
export async function aggregatePillarPerformance(userId) {
  const weekStart = getWeekStart(new Date());
  
  // Get all videos from this user with performance data
  const { data: videos } = await supabase
    .from("videos")
    .select("*")
    .eq("user_id", userId)
    .gt("views", 0);

  if (!videos?.length) return { insights: [] };

  // Group by pillar
  const pillarGroups = {};
  
  for (const video of videos) {
    const pillarId = video.pillar_id || 'discovery';
    const pillarName = video.pillar_name || 'Discovery';
    
    if (!pillarGroups[pillarId]) {
      pillarGroups[pillarId] = {
        pillarId,
        pillarName,
        videos: [],
        totalViews: 0,
        totalEngagement: 0,
      };
    }
    
    pillarGroups[pillarId].videos.push(video);
    pillarGroups[pillarId].totalViews += video.views || 0;
    pillarGroups[pillarId].totalEngagement += (video.likes || 0) + (video.comments || 0) + (video.shares || 0);
  }

  // Calculate insights for each pillar
  const insights = [];
  
  for (const [pillarId, data] of Object.entries(pillarGroups)) {
    const avgEngagementRate = data.totalViews > 0 
      ? data.totalEngagement / data.totalViews 
      : 0;

    // Find top angles within this pillar
    const topAngles = data.videos
      .filter(v => v.angle)
      .sort((a, b) => {
        const aRate = a.views > 0 ? (a.likes + a.comments + a.shares) / a.views : 0;
        const bRate = b.views > 0 ? (b.likes + b.comments + b.shares) / b.views : 0;
        return bRate - aRate;
      })
      .slice(0, 3)
      .map(v => ({
        angle: v.angle,
        views: v.views,
        engagement: v.likes + v.comments + v.shares,
      }));

    insights.push({
      user_id: userId,
      pillar_id: pillarId,
      pillar_name: data.pillarName,
      business_type: 'ecommerce', // Would get from profile
      total_videos: data.videos.length,
      total_views: data.totalViews,
      total_engagement: data.totalEngagement,
      avg_engagement_rate: avgEngagementRate,
      top_angles: topAngles,
      week_start: weekStart,
    });
  }

  // Upsert insights
  if (insights.length > 0) {
    for (const insight of insights) {
      await supabase
        .from("pillar_insights")
        .upsert(insight, { 
          onConflict: 'user_id,pillar_id,week_start',
        });
    }
  }

  console.log(`[Feedback] Aggregated ${insights.length} pillar insights`);
  return { insights };
}

/**
 * Get week start date (Monday)
 */
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
}

// ===========================================
// WINNER DETECTION
// ===========================================

/**
 * Detect winning videos and angles
 * A "winner" performs 2x the average engagement rate
 */
export async function detectWinners(userId) {
  // Get all videos from last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: videos } = await supabase
    .from("videos")
    .select("*")
    .eq("user_id", userId)
    .gt("views", 50) // Minimum views for significance
    .gte("created_at", thirtyDaysAgo.toISOString());

  if (!videos?.length) return { winners: [] };

  // Calculate engagement rates
  const videosWithMetrics = videos.map(v => ({
    ...v,
    engagementRate: v.views > 0 
      ? (v.likes + v.comments + v.shares) / v.views 
      : 0,
  }));

  // Calculate average
  const avgEngagement = videosWithMetrics.reduce((sum, v) => sum + v.engagementRate, 0) / videosWithMetrics.length;
  const winnerThreshold = avgEngagement * 2; // 2x average = winner

  // Find winners
  const winners = videosWithMetrics.filter(v => v.engagementRate >= winnerThreshold);

  // Mark winners in database
  if (winners.length > 0) {
    const winnerIds = winners.map(w => w.id);
    
    // Update videos
    await supabase
      .from("videos")
      .update({ is_winner: true })
      .in("id", winnerIds);

    // Update content angles if linked
    const angleIds = winners.filter(w => w.content_angle_id).map(w => w.content_angle_id);
    if (angleIds.length > 0) {
      await supabase
        .from("content_angles")
        .update({ is_winner: true })
        .in("id", angleIds);
    }
  }

  console.log(`[Feedback] Detected ${winners.length} winners out of ${videos.length} videos`);
  return { 
    winners: winners.map(w => ({
      id: w.id,
      title: w.title,
      engagementRate: w.engagementRate,
      pillarId: w.pillar_id,
      angle: w.angle,
    })),
    avgEngagement,
    winnerThreshold,
  };
}

// ===========================================
// PROMPT INJECTION
// ===========================================

/**
 * Get winning patterns formatted for Claude prompt injection
 */
export async function getWinningPatternsForPrompt(userId) {
  const { data: patterns } = await supabase
    .from("winning_patterns")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .gte("confidence_score", 0.6)
    .order("avg_engagement_rate", { ascending: false })
    .limit(10);

  if (!patterns?.length) {
    return null;
  }

  // Group by type
  const grouped = {
    pillars: patterns.filter(p => p.pattern_type === 'pillar'),
    deliveryMechanisms: patterns.filter(p => p.pattern_type === 'delivery_mechanism'),
    hookPhrases: patterns.filter(p => p.pattern_type === 'hook_phrase'),
    ctaStyles: patterns.filter(p => p.pattern_type === 'cta_style'),
  };

  return grouped;
}

// ===========================================
// CRON JOB ENTRY POINTS
// ===========================================

/**
 * Run weekly feedback loop for all users
 */
export async function runWeeklyFeedbackLoop() {
  console.log("[Feedback] Starting weekly feedback loop");

  // Get all users with videos
  const { data: users } = await supabase
    .from("profiles")
    .select("id")
    .eq("onboarding_completed", true);

  if (!users?.length) return;

  let processed = 0;
  let errors = 0;

  for (const user of users) {
    try {
      await extractWinningPatterns(user.id);
      await aggregatePillarPerformance(user.id);
      await detectWinners(user.id);
      processed++;
    } catch (error) {
      console.error(`[Feedback] Error processing user ${user.id}:`, error);
      errors++;
    }
  }

  console.log(`[Feedback] Weekly loop complete: ${processed} processed, ${errors} errors`);
  return { processed, errors };
}

// ===========================================
// EXPORTS
// ===========================================

export default {
  extractWinningPatterns,
  aggregatePillarPerformance,
  detectWinners,
  getWinningPatternsForPrompt,
  runWeeklyFeedbackLoop,
};
