// src/app/api/cron/weekly-report/route.js
// Weekly Report Generation Cron
// Runs every Monday at 9am to generate and send reports

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateAllWeeklyReports, sendWeeklyReportEmail } from "@/lib/intelligence/weekly-report";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[Weekly Report] Starting generation...");

  try {
    // Step 1: Generate reports
    const generationResults = await generateAllWeeklyReports();

    console.log(`[Weekly Report] Generated ${generationResults.generated}/${generationResults.total} reports`);

    // Step 2: Send emails for generated reports
    const emailResults = {
      sent: 0,
      failed: 0,
    };

    // Get users who want email reports (could add a preference field)
    const { data: reports } = await supabase
      .from("weekly_reports")
      .select("user_id")
      .is("sent_at", null)
      .eq("report_date", new Date().toISOString().split("T")[0]);

    for (const report of reports || []) {
      const result = await sendWeeklyReportEmail(report.user_id);
      if (result.success) {
        emailResults.sent++;
      } else {
        emailResults.failed++;
      }
    }

    console.log(`[Weekly Report] Sent ${emailResults.sent} emails`);

    return NextResponse.json({
      success: true,
      generation: generationResults,
      emails: emailResults,
    });

  } catch (error) {
    console.error("[Weekly Report] Error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// Manual trigger
export async function POST(request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` &&
      authHeader !== `Bearer ${process.env.ADMIN_API_KEY}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Allow generating for a specific user
  const body = await request.json().catch(() => ({}));
  const { userId } = body;

  if (userId) {
    const { generateWeeklyReport } = await import("@/lib/intelligence/weekly-report");
    const result = await generateWeeklyReport(userId);
    return NextResponse.json(result);
  }

  return GET(request);
}
