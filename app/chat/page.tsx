'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import ReactMarkdown from 'react-markdown'
import { PERSONAS, type Message, type Conversation } from '@/types'
import { createClient } from '@/lib/supabase/client'

function ChatContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const personaId = searchParams.get('persona') ?? ''
  const persona = PERSONAS.find((p) => p.id === personaId)

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!personaId) {
      router.push('/persona')
      return
    }
    loadConversations()
  }, [personaId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadConversations = async () => {
    const res = await fetch('/api/conversations')
    const data = await res.json()
    setConversations(data.conversations ?? [])
  }

  const loadConversation = async (id: string) => {
    setConversationId(id)
    const res = await fetch(`/api/conversations/${id}/messages`)
    const data = await res.json()
    setMessages(data.messages ?? [])
  }

  const startNewChat = () => {
    setConversationId(null)
    setMessages([])
    inputRef.current?.focus()
  }

  const sendMessage = async () => {
    const trimmed = input.trim()
    if (!trimmed || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmed,
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          conversationId,
          personaId,
        }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        created_at: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, assistantMessage])
      if (!conversationId && data.conversationId) {
        setConversationId(data.conversationId)
        loadConversations()
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          created_at: new Date().toISOString(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const SUGGESTED_QUESTIONS = persona?.suggestedQuestions ?? [
    'What market trends are shaping the AV industry right now?',
    'What technology categories are seeing the most growth?',
    'What are the main adoption challenges across the channel?',
    'How are channel relationships evolving between vendors and resellers?',
  ]

  return (
    <div className="flex flex-col h-screen bg-white">
      <Header personaId={personaId} showPersonaSwitch />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'w-64' : 'w-0'
          } transition-all duration-200 border-r border-gray-200 bg-gray-50 flex flex-col overflow-hidden flex-shrink-0`}
        >
          <div className="p-3 border-b border-gray-200">
            <Button onClick={startNewChat} variant="secondary" size="sm" className="w-full">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New chat
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {conversations.length === 0 ? (
              <p className="text-xs text-gray-400 text-center mt-4">No conversations yet</p>
            ) : (
              <div className="flex flex-col gap-0.5">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => loadConversation(conv.id)}
                    className={`text-left w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                      conv.id === conversationId
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <p className="truncate">{conv.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(conv.updated_at).toLocaleDateString()}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 border-t border-gray-200">
            <a
              href="/admin"
              className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Manage knowledge base
            </a>
          </div>
        </aside>

        {/* Main chat area */}
        <main className="flex flex-col flex-1 overflow-hidden">
          {/* Sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="absolute top-16 left-0 z-10 w-5 h-8 bg-gray-200 hover:bg-gray-300 rounded-r flex items-center justify-center transition-colors"
          >
            <svg
              className={`w-3 h-3 text-gray-600 transition-transform ${sidebarOpen ? '' : 'rotate-180'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-6 max-w-2xl mx-auto">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Ask Channel Agent
                </h2>
                <p className="text-gray-500 text-sm text-center mb-6">
                  Get market intelligence insights tailored to the AV industry,
                  powered by survey data and research.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => {
                        setInput(q)
                        inputRef.current?.focus()
                      }}
                      className="text-left text-sm text-gray-600 bg-gray-50 border border-gray-200 hover:border-blue-300 hover:bg-blue-50 px-3 py-2.5 rounded-lg transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto py-6 px-4 flex flex-col gap-6">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white rounded-br-sm whitespace-pre-wrap'
                          : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                      }`}
                    >
                      {msg.role === 'user' ? msg.content : (
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                            li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                            em: ({ children }) => <em className="italic">{children}</em>,
                            h1: ({ children }) => <h1 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-sm font-bold mb-2 mt-3 first:mt-0">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 mt-2 first:mt-0">{children}</h3>,
                            h4: ({ children }) => <h4 className="text-sm font-semibold mb-1 mt-2 first:mt-0">{children}</h4>,
                            code: ({ children }) => <code className="bg-gray-200 rounded px-1 py-0.5 text-xs font-mono">{children}</code>,
                            pre: ({ children }) => <pre className="bg-gray-200 rounded p-2 text-xs font-mono overflow-x-auto mb-2">{children}</pre>,
                            hr: () => <hr className="border-gray-300 my-3" />,
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      )}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="border-t border-gray-200 bg-white p-4">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-end gap-2 bg-gray-50 border border-gray-300 rounded-xl px-4 py-2 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Ask about the AV industry as a ${persona?.name ?? 'professional'}...`}
                  rows={1}
                  className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none max-h-32 py-1.5"
                  style={{ height: 'auto' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement
                    target.style.height = 'auto'
                    target.style.height = target.scrollHeight + 'px'
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  className="w-8 h-8 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 rounded-lg flex items-center justify-center flex-shrink-0 mb-0.5 transition-colors"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                Enter to send · Shift+Enter for new line · Responses based on survey data
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-gray-500">Loading...</div>}>
      <ChatContent />
    </Suspense>
  )
}
