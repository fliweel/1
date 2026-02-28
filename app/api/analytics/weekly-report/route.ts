import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWeeklyReport } from '@/lib/email'
import { PERSONAS } from '@/types'

export async function POST(request: NextRequest) {
  // Allow either a valid CRON_SECRET or an authenticated admin session
  let authorized = false

  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    authorized = true
  }

  if (!authorized) {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()
      if (profile?.is_admin) authorized = true
    }
  }

  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const recipients = (process.env.ANALYTICS_EMAIL_TO ?? '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean)

  if (recipients.length === 0) {
    return NextResponse.json(
      { error: 'ANALYTICS_EMAIL_TO environment variable is not configured' },
      { status: 500 }
    )
  }

  const admin = createAdminClient()
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(weekStart.getDate() - 7)
  const prevWeekStart = new Date(weekStart)
  prevWeekStart.setDate(prevWeekStart.getDate() - 7)

  // This week's conversations
  const { data: thisWeekConvs, error } = await admin
    .from('conversations')
    .select('id, persona_id, user_id')
    .gte('created_at', weekStart.toISOString())
    .lte('created_at', now.toISOString())

  if (error) {
    console.error('Weekly report fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }

  // Last week's conversations (for comparison)
  const { data: lastWeekConvs } = await admin
    .from('conversations')
    .select('id')
    .gte('created_at', prevWeekStart.toISOString())
    .lt('created_at', weekStart.toISOString())

  const convIds = (thisWeekConvs ?? []).map((c) => c.id)
  let messages: Array<{ conversation_id: string }> = []
  if (convIds.length > 0) {
    const { data } = await admin
      .from('messages')
      .select('conversation_id')
      .in('conversation_id', convIds)
    messages = data ?? []
  }

  const msgCount: Record<string, number> = {}
  for (const m of messages) {
    msgCount[m.conversation_id] = (msgCount[m.conversation_id] ?? 0) + 1
  }

  const total = thisWeekConvs?.length ?? 0
  const totalMsgs = messages.length
  const activeUsers = new Set((thisWeekConvs ?? []).map((c) => c.user_id)).size
  const engaged = Object.values(msgCount).filter((n) => n >= 4).length
  const engagementRate = total > 0 ? Math.round((engaged / total) * 100) : 0
  const avgMsgs = total > 0 ? Math.round((totalMsgs / total) * 10) / 10 : 0

  const personaMap: Record<string, number> = {}
  for (const c of thisWeekConvs ?? []) {
    personaMap[c.persona_id] = (personaMap[c.persona_id] ?? 0) + 1
  }
  const topPersonaId = Object.entries(personaMap).sort((a, b) => b[1] - a[1])[0]?.[0]
  const topPersona = PERSONAS.find((p) => p.id === topPersonaId)?.name ?? topPersonaId ?? 'N/A'

  const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  const period = `${fmt(weekStart)} – ${fmt(now)}`

  try {
    await sendWeeklyReport(
      {
        period,
        totalConversations: total,
        totalMessages: totalMsgs,
        activeUsers,
        engagedConversations: engaged,
        abandonedConversations: total - engaged,
        engagementRate,
        avgMessagesPerConversation: avgMsgs,
        topPersona,
        prevTotalConversations: lastWeekConvs?.length ?? 0,
      },
      recipients
    )
  } catch (err) {
    console.error('Failed to send weekly report:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to send email' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    period,
    sentTo: recipients,
    stats: { total, activeUsers, engagementRate },
  })
}
