import { createAdminClient } from '@/lib/supabase/admin'

export type RetrievedChunk = {
  content: string
  source: string
  similarity: number
}

/**
 * Search the knowledge base using semantic similarity via pgvector.
 * Falls back to full-text search if no embedding is available.
 */
export async function searchKnowledgeBase(
  query: string,
  queryEmbedding: number[] | null,
  limit = 5
): Promise<RetrievedChunk[]> {
  const supabase = createAdminClient()

  if (queryEmbedding) {
    // Vector similarity search
    const { data, error } = await supabase.rpc('match_document_chunks', {
      query_embedding: queryEmbedding,
      match_threshold: 0.7,
      match_count: limit,
    })

    if (!error && data && data.length > 0) {
      return data.map((row: { content: string; source: string; similarity: number }) => ({
        content: row.content,
        source: row.source,
        similarity: row.similarity,
      }))
    }
  }

  // Fallback: full-text search using Postgres tsvector
  const { data, error } = await supabase
    .from('document_chunks')
    .select('content, source')
    .textSearch('content', query.split(' ').join(' & '), {
      type: 'websearch',
      config: 'english',
    })
    .limit(limit)

  if (error || !data) return []

  return data.map((row: { content: string; source: string }) => ({
    content: row.content,
    source: row.source,
    similarity: 0.5,
  }))
}

/**
 * Build a context string from retrieved chunks for the LLM prompt.
 */
export function buildContext(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) return ''

  const contextParts = chunks.map(
    (chunk, i) => `[Source ${i + 1}: ${chunk.source}]\n${chunk.content}`
  )

  return `## Relevant Knowledge Base Context\n\n${contextParts.join('\n\n---\n\n')}`
}
