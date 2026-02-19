import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Use Anthropic's voyage model for embeddings via the API
// Falls back to simple text splitting for now - embeddings via Anthropic's embedding model
export async function generateEmbedding(text: string): Promise<number[]> {
  // Anthropic doesn't have a standalone embeddings API yet
  // We use a deterministic hashing approach or integrate with a lightweight embeddings model
  // For production, swap this with OpenAI ada-002, Cohere, or Voyage AI
  // This stub returns a placeholder - replace with real embedding service
  throw new Error(
    'Configure an embeddings provider. See lib/rag/embeddings.ts - ' +
      'recommended: Voyage AI (voyage-01) via @anthropic-ai or OpenAI text-embedding-3-small'
  )
}

// Cosine similarity between two vectors
export function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0)
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
  return dot / (magA * magB)
}
