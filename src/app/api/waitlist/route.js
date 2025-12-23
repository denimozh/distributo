import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// In production, replace this with your database (Supabase, etc.)
// This is a simple in-memory store for development
const waitlist = [];

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, source, timestamp } = body;

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check for duplicate (in production, check your database)
    const existingEntry = waitlist.find(entry => entry.email === normalizedEmail);
    if (existingEntry) {
      return NextResponse.json(
        { success: false, message: "You're already on the waitlist!" },
        { status: 409 }
      );
    }

    // Add to waitlist
    waitlist.push({
      email: normalizedEmail,
      timestamp: timestamp || new Date().toISOString(),
      source: source || 'landing_page'
    });

    const position = waitlist.length;
    console.log('New waitlist signup:', normalizedEmail, '| Position:', position);

    // Send welcome email via Resend
    try {
      await resend.emails.send({
        from: 'Denis <hello@distributo.dev>', // Change to your verified domain
        to: normalizedEmail,
        subject: "You're in 🎉 Welcome to the Distributo waitlist",
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a2e; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
  
  <div style="text-align: center; margin-bottom: 32px;">
    <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #3B82F6, #6366F1); border-radius: 16px; margin: 0 auto 16px; display: inline-block;">
      <span style="font-size: 28px; line-height: 60px;">📦</span>
    </div>
  </div>

  <h1 style="font-size: 24px; margin-bottom: 24px;">Hey!</h1>
  
  <p>You're officially on the Distributo waitlist. Thanks for being early — it means a lot.</p>
  
  <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid #3B82F6;">
    <strong style="color: #1a1a2e;">Quick reminder of what we're building:</strong>
    <p style="margin: 12px 0 0 0; color: #4b5563;">Distributo turns your GitHub commits into marketing content for Reddit, X, and LinkedIn. You ship code, we help you ship the content.</p>
  </div>
  
  <h2 style="font-size: 18px; margin-top: 32px;">What happens next:</h2>
  
  <p><strong>1.</strong> We're building fast. Early access launches in the next few weeks.</p>
  <p><strong>2.</strong> You'll get first access before we open to the public.</p>
  <p><strong>3.</strong> Early users get locked-in pricing (even when we raise it later).</p>
  
  <div style="background: linear-gradient(135deg, #3B82F6, #6366F1); border-radius: 12px; padding: 24px; margin: 32px 0; color: white;">
    <strong>Want to skip the line?</strong>
    <p style="margin: 12px 0 0 0;">Reply to this email and tell me: What are you building? What's your biggest marketing struggle?</p>
    <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 14px;">I read every reply. Seriously.</p>
  </div>
  
  <p>Talk soon,</p>
  <p><strong>Denis</strong><br>
  <span style="color: #6b7280;">Founder, Distributo</span></p>
  
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
  
  <p style="color: #9ca3af; font-size: 14px;">
    P.S. — Want to follow along while I build this in public? 
    <a href="https://x.com/denimozh_uk" style="color: #3B82F6;">Follow me on X →</a>
  </p>
  
</body>
</html>
        `
      });
      console.log('Welcome email sent to:', normalizedEmail);
    } catch (emailError) {
      // Don't fail the signup if email fails - just log it
      console.error('Failed to send welcome email:', emailError);
    }

    // TODO: In production, also save to Supabase:
    await supabase.from('waitlist').insert({ email: normalizedEmail, source, position });

    return NextResponse.json({
      success: true,
      message: "You're on the list!",
      position: position
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
  // Return waitlist count (for admin or social proof)
  return NextResponse.json({
    count: waitlist.length
  });
}