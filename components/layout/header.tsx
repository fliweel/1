'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { PERSONAS } from '@/types'

interface HeaderProps {
  personaId?: string | null
  showPersonaSwitch?: boolean
}

export function Header({ personaId, showPersonaSwitch }: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()

  const persona = PERSONAS.find((p) => p.id === personaId)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <header className="border-b border-gray-200 bg-white px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <span className="font-semibold text-gray-900 text-lg">Channel Agent</span>
        </div>
        {persona && (
          <span className="text-sm text-gray-400">|</span>
        )}
        {persona && (
          <span className="text-sm text-gray-500 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium">
            {persona.name}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {showPersonaSwitch && (
          <button
            onClick={() => router.push('/persona')}
            className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Switch Persona
          </button>
        )}
        <button
          onClick={handleSignOut}
          className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          Sign out
        </button>
      </div>
    </header>
  )
}
