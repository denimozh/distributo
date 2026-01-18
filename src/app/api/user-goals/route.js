import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET - Fetch user's goals and streak info
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get or create user goals
    let { data: goals, error } = await supabase
      .from('user_goals')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // Create default goals
      const { data: newGoals, error: createError } = await supabase
        .from('user_goals')
        .insert({
          user_id: userId,
          daily_reply_target: 5,
          current_streak: 0,
          longest_streak: 0,
          total_replies: 0,
        })
        .select()
        .single();

      if (createError) throw createError;
      goals = newGoals;
    } else if (error) {
      throw error;
    }

    // Get today's reply count
    const today = new Date().toISOString().split('T')[0];
    const { count: todayReplies } = await supabase
      .from('user_replies')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('replied_at', `${today}T00:00:00`)
      .lte('replied_at', `${today}T23:59:59`);

    // Get this week's replies
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const { count: weekReplies } = await supabase
      .from('user_replies')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('replied_at', weekStart.toISOString());

    // Check and update streak
    const updatedGoals = await checkAndUpdateStreak(userId, goals);

    return NextResponse.json({
      success: true,
      goals: updatedGoals,
      today: {
        replies: todayReplies || 0,
        target: updatedGoals.daily_reply_target,
        remaining: Math.max(0, updatedGoals.daily_reply_target - (todayReplies || 0)),
        completed: (todayReplies || 0) >= updatedGoals.daily_reply_target,
      },
      week: {
        replies: weekReplies || 0,
      },
      streak: {
        current: updatedGoals.current_streak,
        longest: updatedGoals.longest_streak,
      },
    });

  } catch (error) {
    console.error('User goals error:', error);
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
  }
}

// PUT - Update user's daily target
export async function PUT(request) {
  try {
    const body = await request.json();
    const { userId, dailyTarget } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const target = Math.min(20, Math.max(1, dailyTarget || 5));

    const { data, error } = await supabase
      .from('user_goals')
      .upsert({
        user_id: userId,
        daily_reply_target: target,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      goals: data,
    });

  } catch (error) {
    console.error('Update goals error:', error);
    return NextResponse.json({ error: 'Failed to update goals' }, { status: 500 });
  }
}

// POST - Record a reply (increments streak if target met)
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, opportunityId, platform = 'x', repliedToUsername, replyContent, replyUrl } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Record the reply
    const { data: reply, error: replyError } = await supabase
      .from('user_replies')
      .insert({
        user_id: userId,
        opportunity_id: opportunityId,
        platform,
        replied_to_username: repliedToUsername,
        reply_content: replyContent,
        reply_url: replyUrl,
        replied_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (replyError) throw replyError;

    // Update opportunity status if provided
    if (opportunityId) {
      await supabase
        .from('reply_opportunities')
        .update({ 
          status: 'replied',
          replied_at: new Date().toISOString(),
        })
        .eq('id', opportunityId);
    }

    // Update total replies and check streak
    const { data: goals } = await supabase
      .from('user_goals')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (goals) {
      // Get today's reply count
      const today = new Date().toISOString().split('T')[0];
      const { count: todayReplies } = await supabase
        .from('user_replies')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('replied_at', `${today}T00:00:00`)
        .lte('replied_at', `${today}T23:59:59`);

      const targetMet = todayReplies >= goals.daily_reply_target;
      const todayDate = today;
      const lastActivity = goals.last_activity_date;

      let newStreak = goals.current_streak;
      
      // If target just met today and we haven't counted today yet
      if (targetMet && lastActivity !== todayDate) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastActivity === yesterdayStr) {
          // Continuing streak
          newStreak = goals.current_streak + 1;
        } else if (!lastActivity) {
          // First day
          newStreak = 1;
        } else {
          // Streak broken, start new
          newStreak = 1;
        }

        await supabase
          .from('user_goals')
          .update({
            current_streak: newStreak,
            longest_streak: Math.max(newStreak, goals.longest_streak),
            last_activity_date: todayDate,
            total_replies: (goals.total_replies || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);
      } else {
        // Just update total
        await supabase
          .from('user_goals')
          .update({
            total_replies: (goals.total_replies || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);
      }
    }

    return NextResponse.json({
      success: true,
      reply,
      message: 'Reply recorded!',
    });

  } catch (error) {
    console.error('Record reply error:', error);
    return NextResponse.json({ error: 'Failed to record reply' }, { status: 500 });
  }
}

// Helper: Check and update streak status
async function checkAndUpdateStreak(userId, goals) {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // If last activity was before yesterday, streak is broken
  if (goals.last_activity_date && 
      goals.last_activity_date !== today && 
      goals.last_activity_date !== yesterdayStr &&
      goals.current_streak > 0) {
    
    const { data: updated } = await supabase
      .from('user_goals')
      .update({
        current_streak: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    return updated || goals;
  }

  return goals;
}