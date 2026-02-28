export interface WeeklyStats {
  period: string
  totalConversations: number
  totalMessages: number
  activeUsers: number
  engagedConversations: number
  abandonedConversations: number
  engagementRate: number
  avgMessagesPerConversation: number
  topPersona: string
  prevTotalConversations: number
}

export async function sendWeeklyReport(stats: WeeklyStats, recipients: string[]): Promise<void> {
  const subject = `Channel Agent – Weekly Report: ${stats.period}`
  const html = buildWeeklyReportHtml(stats)
  await sendEmail(recipients, subject, html)
}

async function sendEmail(to: string[], subject: string, html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('RESEND_API_KEY environment variable is not configured')

  const from = process.env.EMAIL_FROM ?? 'noreply@channelbot.com'

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Resend API error ${res.status}: ${body}`)
  }
}

function buildWeeklyReportHtml(stats: WeeklyStats): string {
  const convChange = stats.totalConversations - stats.prevTotalConversations
  const convChangeText = convChange >= 0 ? `+${convChange}` : `${convChange}`
  const convChangeColor = convChange >= 0 ? '#16a34a' : '#dc2626'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Channel Agent – Weekly Report</title>
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;margin:0;padding:32px 16px;">
  <div style="max-width:580px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:#2563eb;padding:24px 32px;">
      <p style="margin:0;color:#bfdbfe;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;">Channel Agent</p>
      <h1 style="margin:6px 0 0;color:#ffffff;font-size:22px;font-weight:700;">Weekly Performance Report</h1>
      <p style="margin:6px 0 0;color:#93c5fd;font-size:14px;">${stats.period}</p>
    </div>

    <!-- KPI Grid -->
    <div style="padding:28px 32px 0;">
      <h2 style="margin:0 0 16px;color:#1e293b;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">This Week at a Glance</h2>
      <table style="width:100%;border-collapse:separate;border-spacing:8px;">
        <tr>
          <td style="background:#eff6ff;border:1px solid #dbeafe;border-radius:8px;padding:16px;text-align:center;">
            <div style="font-size:30px;font-weight:700;color:#1d4ed8;">${stats.totalConversations}</div>
            <div style="font-size:12px;color:#64748b;margin-top:4px;">Sessions</div>
            <div style="font-size:12px;font-weight:600;color:${convChangeColor};margin-top:4px;">${convChangeText} vs last week</div>
          </td>
          <td style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;text-align:center;">
            <div style="font-size:30px;font-weight:700;color:#15803d;">${stats.activeUsers}</div>
            <div style="font-size:12px;color:#64748b;margin-top:4px;">Active Users</div>
            <div style="font-size:12px;color:#64748b;margin-top:4px;">unique this week</div>
          </td>
          <td style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:16px;text-align:center;">
            <div style="font-size:30px;font-weight:700;color:#a16207;">${stats.engagementRate}%</div>
            <div style="font-size:12px;color:#64748b;margin-top:4px;">Engagement</div>
            <div style="font-size:12px;color:#64748b;margin-top:4px;">sessions with 4+ msgs</div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Session Outcomes -->
    <div style="padding:24px 32px 0;">
      <h2 style="margin:0 0 16px;color:#1e293b;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Session Outcomes</h2>
      <table style="width:100%;border-collapse:separate;border-spacing:8px;">
        <tr>
          <td style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;">
            <div style="font-size:24px;font-weight:700;color:#15803d;">${stats.engagedConversations}</div>
            <div style="font-size:13px;font-weight:600;color:#15803d;margin-top:4px;">Successful</div>
            <div style="font-size:12px;color:#4ade80;margin-top:2px;">4+ messages exchanged</div>
          </td>
          <td style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:16px;">
            <div style="font-size:24px;font-weight:700;color:#c2410c;">${stats.abandonedConversations}</div>
            <div style="font-size:13px;font-weight:600;color:#c2410c;margin-top:4px;">Abandoned</div>
            <div style="font-size:12px;color:#fb923c;margin-top:2px;">Fewer than 4 messages</div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Performance Details -->
    <div style="padding:24px 32px;">
      <h2 style="margin:0 0 16px;color:#1e293b;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Performance Details</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr style="border-bottom:1px solid #f1f5f9;">
          <td style="padding:10px 0;color:#64748b;">Total Messages</td>
          <td style="padding:10px 0;text-align:right;color:#1e293b;font-weight:600;">${stats.totalMessages}</td>
        </tr>
        <tr style="border-bottom:1px solid #f1f5f9;">
          <td style="padding:10px 0;color:#64748b;">Avg Messages per Session</td>
          <td style="padding:10px 0;text-align:right;color:#1e293b;font-weight:600;">${stats.avgMessagesPerConversation}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:#64748b;">Most Used Persona</td>
          <td style="padding:10px 0;text-align:right;color:#1e293b;font-weight:600;">${stats.topPersona}</td>
        </tr>
      </table>
    </div>

    <!-- Footer -->
    <div style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;text-align:center;">
      <p style="margin:0;color:#94a3b8;font-size:12px;">Channel Agent Analytics · Automated weekly report</p>
      <p style="margin:6px 0 0;color:#94a3b8;font-size:12px;">Log in to the admin panel to view the full dashboard.</p>
    </div>
  </div>
</body>
</html>`
}
