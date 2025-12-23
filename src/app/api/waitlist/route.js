import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Optional: Initialize Resend for email confirmation
// import { Resend } from 'resend';
// const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, source } = body;

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check for existing entry
    const { data: existing } = await supabase
      .from('waitlist')
      .select('id')
      .eq('email', normalizedEmail)
      .single();

    if (existing) {
      return NextResponse.json(
        { success: false, message: "You're already on the waitlist!" },
        { status: 409 }
      );
    }

    // Insert into waitlist
    const { data, error } = await supabase
      .from('waitlist')
      .insert({
        email: normalizedEmail,
        source: source || 'landing_page',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error('Database error');
    }

    // Get waitlist position
    const { count } = await supabase
      .from('waitlist')
      .select('*', { count: 'exact', head: true });

    // Send confirmation email (uncomment when ready)
    /*
    await resend.emails.send({
      from: 'Denis <hello@distributo.io>',
      to: normalizedEmail,
      subject: "🚀 You're on the Distributo waitlist!",
      html: `
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #3B82F6, #6366F1); border-radius: 16px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
              <span style="color: white; font-size: 24px;">📦</span>
            </div>
            <h1 style="color: #1a1a2e; font-size: 28px; margin: 0;">Welcome to Distributo!</h1>
          </div>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            You're officially on the waitlist! We're building the marketing autopilot for founders who'd rather ship code than write content.
          </p>
          
          <div style="background: #f3f4f6; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <p style="color: #1a1a2e; font-size: 14px; margin: 0;">
              <strong>Your position:</strong> #${count}<br/>
              <strong>What's next:</strong> We'll email you as soon as early access opens.
            </p>
          </div>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            In the meantime, want to skip the line? Share Distributo with other founders and we'll bump you up:
          </p>
          
          <a href="https://twitter.com/intent/tweet?text=Just%20joined%20the%20waitlist%20for%20%40distributo_io%20-%20marketing%20autopilot%20for%20founders.%20Check%20it%20out%3A%20https%3A%2F%2Fdistributo.io" 
             style="display: inline-block; background: #1DA1F2; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">
            Share on X →
          </a>
          
          <p style="color: #9ca3af; font-size: 14px; margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
            Cheers,<br/>
            Denis @ Distributo
          </p>
        </div>
      `
    });
    */

    return NextResponse.json({
      success: true,
      message: "You're on the list!",
      position: count || 0
    });

  } catch (error) {
    console.error('Waitlist error:', error);
    return NextResponse.json(
      { success: false, message: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { count, error } = await supabase
      .from('waitlist')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;

    return NextResponse.json({ count: count || 0 });
  } catch (error) {
    return NextResponse.json({ count: 0 });
  }
}