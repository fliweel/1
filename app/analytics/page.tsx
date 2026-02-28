'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PERSONAS } from '@/types'

type OverviewStats = {
  totalConversations: number
  totalMessages: number
  activeUsers: number
  avgMessagesPerConversation: number
  engagedConversations: number
  abandonedConversations: number
  engagementRate: number
}

type DailyPoint = {
  date: string
  conversations: number
  messages: number
}

type PersonaBreakdown = {
  persona: string
  count: number
  percentage: number
}

type RecentConversation = {
  id: string
  title: string
  persona_id: string
  created_at: string
  message_count: number
  outcome: 'engaged' | 'abandoned'
}

type AnalyticsData = {
  overview: OverviewStats
  daily: DailyPoint[]
  byPersona: PersonaBreakdown[]
  recentConversations: RecentConversation[]
  period: number
}

const PERIODS = [
  { label: '7d', value: 7 },
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
]

const KPI_CARDS = (o: OverviewStats) => [
  { label: 'Total Sessions', value: o.totalConversations, suffix: '' },
  { label: 'Total Messages', value: o.totalMessages, suffix: '' },
  { label: 'Active Users', value: o.activeUsers, suffix: '' },
  { label: 'Avg Msgs / Session', value: o.avgMessagesPerConversation, suffix: '' },
  { label: 'Engagement Rate', value: o.engagementRate, suffix: '%' },
]

export default function AnalyticsPage() {
  const router = useRouter()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [days, setDays] = useState(30)
  const [sendingReport, setSendingReport] = useState(false)
  const [reportMessage, setReportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/analytics?days=${days}`)
      if (res.status === 403) {
        setError('Access denied. Admin privileges required.')
        return
      }
      if (!res.ok) throw new Error('Failed to load analytics data')
      const json = await res.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const handleSendReport = async () => {
    setSendingReport(true)
    setReportMessage(null)
    try {
      const res = await fetch('/api/analytics/weekly-report', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to send report')
      setReportMessage({
        type: 'success',
        text: `Report sent to ${json.sentTo.join(', ')} covering ${json.period}`,
      })
    } catch (err) {
      setReportMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unknown error',
      })
    } finally {
      setSendingReport(false)
    }
  }

  const maxConvs = data ? Math.max(...data.daily.map((d) => d.conversations), 1) : 1

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <span className="font-semibold text-gray-900 text-lg">Channel Agent</span>
          <span className="text-gray-300">|</span>
          <span className="text-sm font-medium text-gray-600">Analytics</span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/admin"
            className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Knowledge Base
          </a>
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-6 space-y-5">
        {/* Page title + controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Monitor session volumes, performance KPIs, and engagement.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Period selector */}
            <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden">
              {PERIODS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setDays(p.value)}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                    days === p.value
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {/* Send weekly report */}
            <button
              onClick={handleSendReport}
              disabled={sendingReport}
              className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              {sendingReport ? 'Sending…' : 'Send Weekly Report'}
            </button>
          </div>
        </div>

        {/* Report send result */}
        {reportMessage && (
          <div
            className={`px-4 py-3 rounded-lg text-sm ${
              reportMessage.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            {reportMessage.text}
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Loading spinner */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {data && !loading && (
          <>
            {/* ── KPI Cards ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {KPI_CARDS(data.overview).map((kpi) => (
                <div key={kpi.label} className="bg-white border border-gray-200 rounded-xl p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide leading-tight">
                    {kpi.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {kpi.value}
                    {kpi.suffix}
                  </p>
                </div>
              ))}
            </div>

            {/* ── Session Outcomes ── */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-700">
                    {data.overview.engagedConversations}
                  </p>
                  <p className="text-sm font-medium text-green-600">Successful sessions</p>
                  <p className="text-xs text-green-500">4+ messages exchanged</p>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
                  <svg
                    className="w-5 h-5 text-orange-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L3.18 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-700">
                    {data.overview.abandonedConversations}
                  </p>
                  <p className="text-sm font-medium text-orange-600">Abandoned sessions</p>
                  <p className="text-xs text-orange-500">Fewer than 4 messages</p>
                </div>
              </div>
            </div>

            {/* ── Charts row ── */}
            <div className="grid lg:grid-cols-3 gap-4">
              {/* Daily volume bar chart */}
              <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5">
                <h2 className="font-semibold text-gray-900 mb-1">Session Volume</h2>
                <p className="text-xs text-gray-400 mb-4">Daily sessions over the last {days} days</p>

                {data.daily.every((d) => d.conversations === 0) ? (
                  <div className="h-40 flex items-center justify-center text-sm text-gray-400">
                    No sessions in this period
                  </div>
                ) : (
                  <>
                    <div className="flex items-end gap-px h-40">
                      {data.daily.map((d) => (
                        <div
                          key={d.date}
                          className="flex-1 relative group flex flex-col justify-end"
                          style={{ height: '100%' }}
                        >
                          <div
                            className="w-full bg-blue-500 hover:bg-blue-600 rounded-sm transition-colors cursor-default"
                            style={{
                              height: `${Math.max(
                                (d.conversations / maxConvs) * 100,
                                d.conversations > 0 ? 4 : 1
                              )}%`,
                              minHeight: d.conversations > 0 ? '4px' : '1px',
                              opacity: d.conversations > 0 ? 1 : 0.2,
                            }}
                          />
                          {/* Hover tooltip */}
                          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs rounded-md px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                            {d.date}: {d.conversations} session{d.conversations !== 1 ? 's' : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-400">
                      <span>{data.daily[0]?.date}</span>
                      <span>{data.daily[Math.floor(data.daily.length / 2)]?.date}</span>
                      <span>{data.daily[data.daily.length - 1]?.date}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Persona breakdown */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h2 className="font-semibold text-gray-900 mb-1">Persona Breakdown</h2>
                <p className="text-xs text-gray-400 mb-4">Sessions per persona this period</p>
                {data.byPersona.length === 0 ? (
                  <p className="text-sm text-gray-400">No data for this period.</p>
                ) : (
                  <div className="space-y-3">
                    {data.byPersona.map((p) => {
                      const name = PERSONAS.find((x) => x.id === p.persona)?.name ?? p.persona
                      return (
                        <div key={p.persona}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-700 font-medium">{name}</span>
                            <span className="text-gray-400 tabular-nums">
                              {p.count} · {p.percentage}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${p.percentage}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ── Recent Sessions table ── */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">Recent Sessions</h2>
              </div>

              {data.recentConversations.length === 0 ? (
                <div className="px-6 py-10 text-center text-sm text-gray-400">No sessions yet.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-6 py-3 font-medium text-gray-500">Session</th>
                      <th className="text-left px-6 py-3 font-medium text-gray-500">Persona</th>
                      <th className="text-right px-6 py-3 font-medium text-gray-500">Messages</th>
                      <th className="text-right px-6 py-3 font-medium text-gray-500">Outcome</th>
                      <th className="text-right px-6 py-3 font-medium text-gray-500">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentConversations.map((conv, i) => (
                      <tr
                        key={conv.id}
                        className={i < data.recentConversations.length - 1 ? 'border-b border-gray-100' : ''}
                      >
                        <td className="px-6 py-3 text-gray-900 font-medium max-w-xs">
                          <span className="block truncate" title={conv.title}>
                            {conv.title}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-gray-500">
                          {PERSONAS.find((p) => p.id === conv.persona_id)?.name ?? conv.persona_id}
                        </td>
                        <td className="px-6 py-3 text-right text-gray-600 tabular-nums">
                          {conv.message_count}
                        </td>
                        <td className="px-6 py-3 text-right">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              conv.outcome === 'engaged'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-orange-100 text-orange-700'
                            }`}
                          >
                            {conv.outcome === 'engaged' ? 'Successful' : 'Abandoned'}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right text-gray-400 tabular-nums">
                          {new Date(conv.created_at).toLocaleDateString('en-GB')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* ── Setup info box ── */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
              <p className="font-medium mb-2">Automated weekly email reports</p>
              <ul className="list-disc list-inside space-y-1 text-blue-600">
                <li>
                  Set{' '}
                  <code className="bg-blue-100 px-1 rounded text-xs">RESEND_API_KEY</code> and{' '}
                  <code className="bg-blue-100 px-1 rounded text-xs">EMAIL_FROM</code> in your environment
                </li>
                <li>
                  Set{' '}
                  <code className="bg-blue-100 px-1 rounded text-xs">ANALYTICS_EMAIL_TO</code> (comma-separated
                  recipient emails)
                </li>
                <li>
                  <strong>Vercel Cron:</strong> add{' '}
                  <code className="bg-blue-100 px-1 rounded text-xs">vercel.json</code> (included in this repo)
                  to schedule weekly reports every Monday at 9 AM UTC
                </li>
                <li>
                  <strong>GCP Cloud Scheduler:</strong> call{' '}
                  <code className="bg-blue-100 px-1 rounded text-xs">POST /api/analytics/weekly-report</code>{' '}
                  with{' '}
                  <code className="bg-blue-100 px-1 rounded text-xs">
                    Authorization: Bearer &lt;CRON_SECRET&gt;
                  </code>
                </li>
                <li>Or use the &quot;Send Weekly Report&quot; button above to trigger manually at any time</li>
              </ul>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
