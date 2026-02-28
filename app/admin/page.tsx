'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'

type Document = {
  id: string
  name: string
  type: string
  chunk_count: number
  created_at: string
}

export default function AdminPage() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    const res = await fetch('/api/documents')
    if (res.ok) {
      const data = await res.json()
      setDocuments(data.documents ?? [])
    }
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setResult(null)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data.message)
      setFile(null)
      loadDocuments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) setFile(dropped)
  }

  const fileTypeIcon: Record<string, string> = {
    xlsx: '📊',
    xls: '📊',
    csv: '📋',
    pdf: '📄',
    txt: '📝',
    md: '📝',
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header showPersonaSwitch={false} navLinks={[{ label: 'Analytics', href: '/analytics' }]} />

      <main className="flex-1 max-w-3xl mx-auto w-full p-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Knowledge Base</h1>
          <p className="text-sm text-gray-500 mt-1">
            Upload survey data and documents to power Channel Agent&apos;s insights.
          </p>
        </div>

        {/* Upload Area */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Upload Document</h2>

          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <svg className="w-10 h-10 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <p className="text-sm text-gray-600 mb-1">
              {file ? (
                <span className="font-medium text-blue-600">{file.name}</span>
              ) : (
                <>Drop a file here or <span className="text-blue-600">browse</ span></>
              )}
            </p>
            <p className="text-xs text-gray-400">Supported: Excel (.xlsx, .xls), CSV, Text (.txt, .md)</p>

            <input
              type="file"
              accept=".xlsx,.xls,.csv,.txt,.md"
              className="hidden"
              id="file-upload"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <label
              htmlFor="file-upload"
              className="mt-3 inline-block cursor-pointer text-sm text-blue-600 hover:underline"
            >
              {file ? 'Change file' : 'Choose file'}
            </label>
          </div>

          {result && (
            <div className="mt-4 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">
              {result}
            </div>
          )}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <Button onClick={handleUpload} disabled={!file} loading={uploading}>
              {uploading ? 'Processing...' : 'Upload & Ingest'}
            </Button>
          </div>
        </div>

        {/* Documents Table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Ingested Documents</h2>
          </div>

          {documents.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-gray-400">
              No documents uploaded yet. Upload your first dataset above.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Document</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Type</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Chunks</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc, i) => (
                  <tr key={doc.id} className={i < documents.length - 1 ? 'border-b border-gray-100' : ''}>
                    <td className="px-6 py-3 text-gray-900 font-medium">
                      <span className="mr-2">{fileTypeIcon[doc.type] ?? '📄'}</span>
                      {doc.name}
                    </td>
                    <td className="px-6 py-3 text-gray-500 uppercase text-xs font-mono">{doc.type}</td>
                    <td className="px-6 py-3 text-right text-gray-600">{doc.chunk_count}</td>
                    <td className="px-6 py-3 text-right text-gray-400">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Info box */}
        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
          <p className="font-medium mb-1">How ingestion works</p>
          <ul className="list-disc list-inside space-y-1 text-blue-600">
            <li>Excel rows are converted to text and split into chunks</li>
            <li>Chunks are stored and indexed for full-text search</li>
            <li>When you chat, the most relevant chunks are retrieved and sent to Claude</li>
            <li>Adding vector embeddings later will improve retrieval accuracy</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
