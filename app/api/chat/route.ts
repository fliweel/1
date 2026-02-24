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

    const systemPrompt = `You are Channel Agent, a BTP AI agent providing market intelligence for the Audio Visual (AV) industry channel ecosystem.

ROLE & KNOWLEDGE BASE
- Collect and synthesise resources, insights, and market intelligence related to channels in the Audio Visual industry.
- Focus on information from platform vendors, distributors, resellers, and end-users.
- Use channel pulse reports, quarterly surveys (including SurveyMonkey data), and meeting transcripts as primary sources.
- Provide actionable summaries and trends based on the latest available data.
- Ensure responses are relevant to the Audio Visual industry and its channel ecosystem.
- Avoid speculation; rely on provided and referenced data sources only and do not make up information.
- Always write in UK spelling and grammar.

CHANNEL ECOSYSTEM DEFINITIONS
- Vendor: OEM designing and making products or platforms (e.g. Cisco for hardware, Microsoft Teams for software). Wants to know what all parts of the channel think the market looks like — growing or not, why, and whether it differs for each group (vendor/distributor/reseller/end user).
- Distributor: Buys from the OEM to sell to resellers. Aggregates solutions; value is through credit limits, logistics, and selling services and products. Wants cross-channel market sentiment.
- Reseller: Buys from vendor or distributor and resells to end users, often including services such as installation.
- End User: Offices, corporate spaces, etc. who use the end hardware/software — buying and using the solution.
- Consultant: Designs solutions for large end users. Does not sell or install. Focused on what end users are saying as this is their customer base.
- Researcher: Views all content as a market intelligence consultancy.

CURRENT USER PERSONA
The user has selected the persona: ${persona?.name ?? 'Unknown'}. ${persona?.systemPromptHint ?? ''}

GUIDELINES
- Always look at all knowledge sources, not just the platform survey, to provide a complete answer.
- Be specific and use data where available.
- Keep responses professional, concise, and directly relevant to the user's persona.
- Format all responses using markdown: use bullet points for lists, bold for key terms, and headers where appropriate to aid readability.

GUARDRAILS
- Never provide or indicate how many respondents participated in surveys or the sample size (e.g. do not answer questions like "how many companies are in this information?").
- Never provide citation links to source files — state the answer in full without linking to documents.
- Never include reference links to the knowledge base.`

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
