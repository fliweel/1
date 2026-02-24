import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { PERSONAS } from '@/types'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

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

    // Retrieve conversation history (last 20 messages, including the one just saved)
    const { data: history } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', activeConversationId)
      .order('created_at', { ascending: true })
      .limit(20)

    // Build persona-aware system prompt
    const persona = PERSONAS.find((p) => p.id === personaId)

    const systemPrompt = `You are Channel Agent, an expert market intelligence assistant for the AV/UC (Audio Visual / Unified Communications) industry. You provide data-driven insights, trends, and analysis grounded in channel research and industry survey data.

${persona?.systemPromptHint ?? ''}

Guidelines:
- Ground all answers in the knowledge base retrieved by the file_search tool
- Be specific and quantitative where the data supports it
- Cite the source document or survey when referencing data (e.g. "According to the distributor survey...")
- Be honest if the knowledge base does not contain sufficient information for a query
- Keep responses professional, concise, and directly relevant to the user's persona`

    // Build input messages for the Responses API
    const inputMessages = (history ?? []).map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }))

    // Build tool config — only include file_search if a vector store is configured
    const vectorStoreId = process.env.OPENAI_VECTOR_STORE_ID

    // Call OpenAI Responses API (handles retrieval + generation in one call)
    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o',
      instructions: systemPrompt,
      ...(vectorStoreId
        ? { tools: [{ type: 'file_search' as const, vector_store_ids: [vectorStoreId] }] }
        : {}),
      input: inputMessages,
    })

    const assistantMessage = response.output_text

    // Save assistant message
    await supabase.from('messages').insert({
      conversation_id: activeConversationId,
      role: 'assistant',
      content: assistantMessage,
    })

    return NextResponse.json({
      message: assistantMessage,
      conversationId: activeConversationId,
    })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
