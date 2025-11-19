export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// TODO: Implement email digest job
// This endpoint will be called by Vercel cron to send daily digest emails
//
// Implementation plan:
// 1. Query yesterday's important events per user
// 2. Group by user and filter based on notification preferences
// 3. Generate HTML email template with personalized content
// 4. Send via SMTP service (Resend, SendGrid, etc.)
// 5. Log delivery status and handle bounces
//
// Scheduling: Add to vercel.json:
// {
//   "crons": [{
//     "path": "/api/jobs/digest",
//     "schedule": "0 9 * * *"  // Daily at 9 AM IST
//   }]
// }

export async function POST() {
  return Response.json({
    message: "Email digest job not yet implemented",
    todo: "Add SMTP integration and email templates",
  })
}
