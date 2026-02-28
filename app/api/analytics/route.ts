import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  // Auth check
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Admin check
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const days = Math.min(parseInt(searchParams.get('days') ?? '30'), 365)

  const admin = createAdminClient()
  const now = new Date()
  const start = new Date(now)
  start.setDate(start.getDate() - days)

  // Fetch all conversations in the period
  const { data: conversations, error: convError } = await admin
    .from('conversations')
    .select('id, persona_id, user_id, created_at')
    .gte('created_at', start.toISOString())
    .order('created_at', { ascending: false })

  if (convError) {
    console.error('Analytics conversations error:', convError)
    return NextResponse.json({ error: 'Failed to load analytics' }, { status: 500 })
  }

  const convIds = (conversations ?? []).map((c) => c.id)

  // Fetch messages for conversations in this period
  let messages: Array<{ conversation_id: string; created_at: string }> = []
  if (convIds.length > 0) {
    const { data } = await admin
      .from('messages')
      .select('conversation_id, created_at')
      .in('conversation_id', convIds)
    messages = data ?? []
  }

  // Message count per conversation
  const msgCount: Record<string, number> = {}
  for (const m of messages) {
    msgCount[m.conversation_id] = (msgCount[m.conversation_id] ?? 0) + 1
  }

  const total = conversations?.length ?? 0
  const totalMsgs = messages.length
  const uniqueUsers = new Set((conversations ?? []).map((c) => c.user_id)).size
  const engaged = Object.values(msgCount).filter((n) => n >= 4).length
  const engagementRate = total > 0 ? Math.round((engaged / total) * 100) : 0
  const avgMsgs = total > 0 ? Math.round((totalMsgs / total) * 10) / 10 : 0

  // Build daily time series (fill every day in the range)
  const dailyMap: Record<string, { conversations: number; messages: number }> = {}
  for (const c of conversations ?? []) {
    const d = c.created_at.slice(0, 10)
    dailyMap[d] ??= { conversations: 0, messages: 0 }
    dailyMap[d].conversations++
  }
  for (const m of messages) {
    const d = m.created_at.slice(0, 10)
    dailyMap[d] ??= { conversations: 0, messages: 0 }
    dailyMap[d].messages++
  }

  const daily = Array.from({ length: days }, (_, i) => {
    const d = new Date(now)
    d.setDate(d.getDate() - (days - 1 - i))
    const date = d.toISOString().slice(0, 10)
    return { date, ...(dailyMap[date] ?? { conversations: 0, messages: 0 }) }
  })

  // Persona breakdown
  const personaMap: Record<string, number> = {}
  for (const c of conversations ?? []) {
    personaMap[c.persona_id] = (personaMap[c.persona_id] ?? 0) + 1
  }
  const byPersona = Object.entries(personaMap)
    .map(([persona, count]) => ({
      persona,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)

  // Fetch the 10 most recent conversations (all-time) with message counts
  const { data: recentConvs } = await admin
    .from('conversations')
    .select('id, title, persona_id, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  const recentIds = (recentConvs ?? []).map((c) => c.id)
  const recentMsgCount: Record<string, number> = {}
  if (recentIds.length > 0) {
    const { data: recentMsgs } = await admin
      .from('messages')
      .select('conversation_id')
      .in('conversation_id', recentIds)
    for (const m of recentMsgs ?? []) {
      recentMsgCount[m.conversation_id] = (recentMsgCount[m.conversation_id] ?? 0) + 1
    }
  }

  const recentConversations = (recentConvs ?? []).map((c) => ({
    ...c,
    message_count: recentMsgCount[c.id] ?? 0,
    outcome: (recentMsgCount[c.id] ?? 0) >= 4 ? 'engaged' : 'abandoned',
  }))

  return NextResponse.json({
    overview: {
      totalConversations: total,
      totalMessages: totalMsgs,
      activeUsers: uniqueUsers,
      avgMessagesPerConversation: avgMsgs,
      engagedConversations: engaged,
      abandonedConversations: total - engaged,
      engagementRate,
    },
    daily,
    byPersona,
    recentConversations,
    period: days,
  })
}
