# Channel Agent

> AV Industry Market Intelligence Chatbot

Channel Agent is a web-based chatbot that provides market intelligence for the Audio Visual industry. Users select their industry persona and query an AI assistant powered by survey data and research documents.

---

## Features

- **User authentication** – Email/password login via Supabase Auth
- **Persona selection** – 6 AV industry roles (Integrator, Manufacturer, Distributor, End User, Consultant, MSP)
- **Knowledge base** – Upload Excel/CSV survey data; queried via full-text + vector search (RAG)
- **Claude-powered chat** – Persona-aware system prompts using Anthropic Claude
- **Chat history** – Persisted conversations per user
- **Admin panel** – Upload and manage knowledge base documents

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Auth | Supabase Auth |
| Database | Supabase (PostgreSQL + pgvector) |
| LLM | Anthropic Claude (claude-opus-4-6) |
| Document parsing | xlsx (Excel/CSV) |
| RAG | Full-text search (now) + pgvector (when embeddings added) |

---

## Setup

### 1. Clone and install

```bash
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In the **SQL Editor**, run the contents of `supabase/schema.sql`
3. Copy your project URL and keys from **Settings > API**

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=sk-ant-...
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Adding Your First Admin User

After creating your account, grant yourself admin access in Supabase:

```sql
update profiles set is_admin = true where email = 'your@email.com';
```

Then go to `/admin` to upload your Excel survey data.

---

## Uploading Survey Data

1. Navigate to `/admin` (admin users only)
2. Upload your `.xlsx` file containing survey responses
3. The system parses each row into searchable text chunks
4. The chatbot will now retrieve relevant data when users ask questions

### Excel format tips
- Column headers become field names in the knowledge base
- Each row becomes a separate entry
- Survey response columns like `Q1: How satisfied are you?` work well as-is

---

## Adding Vector Embeddings (Optional Upgrade)

Currently the app uses PostgreSQL full-text search for retrieval. For better semantic accuracy, configure an embeddings provider:

1. Sign up for [Voyage AI](https://www.voyageai.com/) (recommended – works with Anthropic)
2. Update `lib/rag/embeddings.ts` with your Voyage API key
3. Re-ingest documents to generate and store embeddings
4. Vector similarity search via pgvector activates automatically

---

## Project Structure

```
app/
  auth/login/       Login page
  auth/register/    Registration page
  persona/          Persona selection
  chat/             Main chat interface
  admin/            Knowledge base management
  api/
    chat/           Claude chat endpoint
    ingest/         Document ingestion endpoint
    conversations/  Conversation CRUD
    documents/      Document list

lib/
  supabase/         Client, server, admin Supabase clients
  rag/              Retrieval-augmented generation utilities

types/              Shared TypeScript types + persona definitions
supabase/
  schema.sql        Database schema (run in Supabase SQL editor)
```

---

## Persona System

Personas are defined in `types/index.ts`. Each persona provides a system prompt hint that tailors Claude's responses to that role's perspective. To add or rename personas, edit the `PERSONAS` array.

Current personas:
- AV Integrator
- Manufacturer / Vendor
- Distributor
- End User / IT Manager
- AV Consultant
- Managed Services Provider
