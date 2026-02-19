'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PERSONAS } from '@/types'
import { Button } from '@/components/ui/button'

const PERSONA_ICONS: Record<string, string> = {
  av_integrator: '🔧',
  manufacturer: '🏭',
  distributor: '📦',
  end_user: '💼',
  consultant: '📋',
  managed_services: '🖥️',
}

export default function PersonaPage() {
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleContinue = async () => {
    if (!selected) return
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('profiles')
        .upsert({ id: user.id, persona_id: selected }, { onConflict: 'id' })
    }

    router.push(`/chat?persona=${selected}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome to Channel Agent</h1>
          <p className="text-gray-500 mt-2">
            Select your role to get insights tailored to your perspective in the AV industry.
          </p>
        </div>

        {/* Persona Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {PERSONAS.map((persona) => (
            <button
              key={persona.id}
              onClick={() => setSelected(persona.id)}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                selected === persona.id
                  ? 'border-blue-500 bg-blue-50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{PERSONA_ICONS[persona.id] ?? '👤'}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">{persona.name}</p>
                    {selected === persona.id && (
                      <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{persona.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <Button
          onClick={handleContinue}
          disabled={!selected}
          loading={loading}
          size="lg"
          className="w-full"
        >
          Continue as {selected ? PERSONAS.find((p) => p.id === selected)?.name : '...'}
        </Button>
      </div>
    </div>
  )
}
