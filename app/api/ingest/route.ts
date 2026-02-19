import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const CHUNK_SIZE = 500 // characters per chunk

function chunkText(text: string, size = CHUNK_SIZE): string[] {
  const chunks: string[] = []
  let i = 0
  while (i < text.length) {
    // Try to break at a sentence boundary
    let end = Math.min(i + size, text.length)
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf('.', end)
      if (lastPeriod > i + size / 2) end = lastPeriod + 1
    }
    chunks.push(text.slice(i, end).trim())
    i = end
  }
  return chunks.filter((c) => c.length > 20)
}

function excelRowsToText(rows: Record<string, string | number | boolean | null>[]): string[] {
  return rows.map((row) => {
    const parts = Object.entries(row)
      .filter(([, val]) => val !== null && val !== undefined && val !== '')
      .map(([key, val]) => `${key}: ${val}`)
    return parts.join(' | ')
  })
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const fileName = file.name
    const fileType = fileName.split('.').pop()?.toLowerCase()

    const adminSupabase = createAdminClient()
    let chunks: string[] = []
    let source = fileName

    if (fileType === 'xlsx' || fileType === 'xls' || fileType === 'csv') {
      // Parse Excel/CSV
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })

      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName]
        const rows = XLSX.utils.sheet_to_json<Record<string, string | number | boolean | null>>(sheet, {
          defval: null,
        })

        const rowTexts = excelRowsToText(rows)
        // Chunk rows in groups of 5 for context
        for (let i = 0; i < rowTexts.length; i += 5) {
          const group = rowTexts.slice(i, i + 5).join('\n')
          chunks.push(...chunkText(group))
        }
        source = `${fileName} > Sheet: ${sheetName}`
      }
    } else if (fileType === 'txt' || fileType === 'md') {
      const text = await file.text()
      chunks = chunkText(text)
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Supported: xlsx, xls, csv, txt, md' },
        { status: 400 }
      )
    }

    if (chunks.length === 0) {
      return NextResponse.json({ error: 'No content extracted from file' }, { status: 400 })
    }

    // Store document record
    const { data: doc, error: docError } = await adminSupabase
      .from('documents')
      .insert({
        name: fileName,
        type: fileType,
        chunk_count: chunks.length,
        uploaded_by: user.id,
      })
      .select()
      .single()

    if (docError) throw docError

    // Store chunks (without embeddings for now - full-text search will work)
    const chunkRecords = chunks.map((content, idx) => ({
      document_id: doc.id,
      content,
      source,
      chunk_index: idx,
      embedding: null,
    }))

    const { error: chunkError } = await adminSupabase
      .from('document_chunks')
      .insert(chunkRecords)

    if (chunkError) throw chunkError

    return NextResponse.json({
      success: true,
      documentId: doc.id,
      chunksCreated: chunks.length,
      message: `Successfully ingested ${chunks.length} chunks from ${fileName}`,
    })
  } catch (error) {
    console.error('Ingest error:', error)
    return NextResponse.json({ error: 'Failed to process file' }, { status: 500 })
  }
}
