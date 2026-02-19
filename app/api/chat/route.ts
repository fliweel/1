import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { searchKnowledgeBase, buildContext } from '@/lib/rag'
import { PERSONAS } from '@/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message, conversationId, personaId } = await request.json()

    if (!message || !personaId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get or create conversation
    let activeConversationId = conversationId
    if (!activeConversationId) {
      const { data: conversation, error } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          persona_id: personaId,
          title: message.slice(0, 60) + (message.length > 60 ? '...' : ''),
        })
        .select()
        .single()

      if (error) throw error
      activeConversationId = conversation.id
    }

    // Save user message
    await supabase.from('messages').insert({
      conversation_id: activeConversationId,
      role: 'user',
      content: message,
    })

    // Retrieve conversation history (last 10 messages)
    const { data: history } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', activeConversationId)
      .order('created_at', { ascending: true })
      .limit(10)

    // Search knowledge base (vector search if embeddings available, else full-text)
    const chunks = await searchKnowledgeBase(message, null, 5)
    const context = buildContext(chunks)

    // Find persona
    const persona = PERSONAS.find((p) => p.id === personaId)
    const personaHint = persona?.systemPromptHint ?? ''

    // Build system prompt
    const systemPrompt = `You are Channel Agent, an expert market intelligence assistant for the Audio Visual (AV) industry. You provide data-driven insights, trends, and analysis based on industry survey data and research.

${personaHint}

Your responses should be:
- Grounded in the knowledge base data provided below
- Specific and quantitative where data supports it
- Actionable and relevant to the user's persona
- Professional but conversational in tone
- Honest about limitations when data is insufficient

When referencing survey data, cite the source type (e.g., "According to survey respondents..." or "The data indicates...").
If the knowledge base doesn't contain relevant information for a query, say so clearly and offer to discuss what you do know.

${context ? context : 'Note: No specific knowledge base results were found for this query. Respond based on general AV industry knowledge and acknowledge the limitation.'}
`

    // Build message history for Claude
    const messages: Anthropic.MessageParam[] = (history || []).map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }))

    // Ensure last message is from user
    if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
      messages.push({ role: 'user', content: message })
    }

    // Call Claude
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    })

    const assistantMessage =
      response.content[0].type === 'text' ? response.content[0].text : ''

    // Save assistant message
    await supabase.from('messages').insert({
      conversation_id: activeConversationId,
      role: 'assistant',
      content: assistantMessage,
    })

    return NextResponse.json({
      message: assistantMessage,
      conversationId: activeConversationId,
      sourcesFound: chunks.length,
    })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
