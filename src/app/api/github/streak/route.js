import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const anthropic = process.env.ANTHROPIC_API_KEY 
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

// Get shipping streak stats
export async function GET(request) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get all commits from the last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { data: commits, error } = await supabaseAdmin
      .from('github_commits')
      .select('committed_at, repo_id, message')
      .eq('user_id', user.id)
      .eq('skipped', false)
      .gte('committed_at', ninetyDaysAgo.toISOString())
      .order('committed_at', { ascending: true });

    if (error) throw error;

    // Calculate streak
    const streakData = calculateStreak(commits || []);

    // Get milestones
    const milestones = getMilestones(streakData.currentStreak);

    // Get weekly stats
    const weeklyStats = getWeeklyStats(commits || []);

    return NextResponse.json({
      success: true,
      streak: streakData,
      milestones,
      weeklyStats,
    });

  } catch (err) {
    console.error('[STREAK] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Generate and share a streak milestone post
export async function POST(request) {
  try {
    const { action, milestone, platform = 'x' } = await request.json();

    const supabase = await createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (action === 'share_milestone') {
      // Generate milestone post
      const content = await generateMilestonePost(milestone, user.id);

      // Save as draft
      const { data: post, error: postError } = await supabaseAdmin
        .from('posts')
        .insert({
          user_id: user.id,
          content: content,
          platform: platform,
          status: 'draft',
          source: 'github_streak',
          metadata: {
            milestone: milestone,
            is_milestone_post: true,
          },
        })
        .select()
        .single();

      if (postError) throw postError;

      return NextResponse.json({
        success: true,
        post,
        content,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (err) {
    console.error('[STREAK] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Calculate current streak and stats
function calculateStreak(commits) {
  if (!commits || commits.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalCommits: 0,
      totalDays: 0,
      averagePerDay: 0,
      streakStartDate: null,
      lastCommitDate: null,
    };
  }

  // Group commits by date (local date)
  const commitsByDate = new Map();
  
  commits.forEach(commit => {
    const date = new Date(commit.committed_at).toISOString().split('T')[0];
    if (!commitsByDate.has(date)) {
      commitsByDate.set(date, []);
    }
    commitsByDate.get(date).push(commit);
  });

  const sortedDates = [...commitsByDate.keys()].sort();
  const totalDays = sortedDates.length;
  const totalCommits = commits.length;

  // Calculate current streak
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  
  let currentStreak = 0;
  let streakStartDate = null;
  
  // Check if there are commits today or yesterday
  if (commitsByDate.has(today) || commitsByDate.has(yesterday)) {
    // Count backwards from the most recent commit day
    const startDate = commitsByDate.has(today) ? today : yesterday;
    let checkDate = new Date(startDate);
    
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (commitsByDate.has(dateStr)) {
        currentStreak++;
        streakStartDate = dateStr;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 1;
  
  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i - 1]);
    const currDate = new Date(sortedDates[i]);
    const diffDays = Math.round((currDate - prevDate) / 86400000);
    
    if (diffDays === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

  return {
    currentStreak,
    longestStreak,
    totalCommits,
    totalDays,
    averagePerDay: totalDays > 0 ? (totalCommits / totalDays).toFixed(1) : 0,
    streakStartDate,
    lastCommitDate: sortedDates[sortedDates.length - 1],
    isActive: commitsByDate.has(today),
  };
}

// Get milestone badges
function getMilestones(currentStreak) {
  const milestoneThresholds = [
    { days: 7, label: '1 Week', emoji: '🔥', achieved: false },
    { days: 14, label: '2 Weeks', emoji: '⚡', achieved: false },
    { days: 30, label: '1 Month', emoji: '🚀', achieved: false },
    { days: 50, label: '50 Days', emoji: '💪', achieved: false },
    { days: 100, label: '100 Days', emoji: '🏆', achieved: false },
    { days: 365, label: '1 Year', emoji: '👑', achieved: false },
  ];

  return milestoneThresholds.map(m => ({
    ...m,
    achieved: currentStreak >= m.days,
    progress: Math.min(100, Math.round((currentStreak / m.days) * 100)),
  }));
}

// Get weekly stats for chart
function getWeeklyStats(commits) {
  const weeks = [];
  const now = new Date();
  
  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - (i * 7) - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    const weekCommits = commits.filter(c => {
      const commitDate = new Date(c.committed_at);
      return commitDate >= weekStart && commitDate < weekEnd;
    });

    weeks.push({
      weekStart: weekStart.toISOString().split('T')[0],
      commits: weekCommits.length,
      days: new Set(weekCommits.map(c => 
        new Date(c.committed_at).toISOString().split('T')[0]
      )).size,
    });
  }

  return weeks;
}

// Generate milestone celebration post
async function generateMilestonePost(milestone, userId) {
  // Get some context about recent work
  const { data: recentCommits } = await supabaseAdmin
    .from('github_commits')
    .select('message, github_repos(repo_name)')
    .eq('user_id', userId)
    .eq('skipped', false)
    .order('committed_at', { ascending: false })
    .limit(10);

  const repoNames = [...new Set(recentCommits?.map(c => c.github_repos?.repo_name).filter(Boolean))];
  const highlights = recentCommits?.slice(0, 3).map(c => c.message.split('\n')[0]).join(', ');

  if (!anthropic) {
    // Fallback template
    return `${milestone.days} days of shipping in a row ${milestone.emoji}

Building ${repoNames.slice(0, 2).join(' & ') || 'in public'} every single day.

Consistency > perfection.

#buildinpublic`;
  }

  const prompt = `Generate a celebratory tweet for hitting a shipping streak milestone.

Milestone: ${milestone.days} days (${milestone.label})
Emoji: ${milestone.emoji}
Projects: ${repoNames.join(', ') || 'various projects'}
Recent work: ${highlights || 'shipping features'}

Write an authentic, proud (but humble) milestone celebration tweet. Under 280 chars. Focus on the journey and consistency. Include #buildinpublic.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });

    return response.content[0].text.trim();
  } catch (err) {
    console.error('[STREAK] AI generation failed:', err);
    return `${milestone.days} days of shipping in a row ${milestone.emoji}

Consistency beats everything.

#buildinpublic`;
  }
}