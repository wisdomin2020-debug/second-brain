# Second Brain AI Agent

A personal AI assistant designed for creative professionals. Capture thoughts, voice notes, and tasks, and transform them into actionable drafts using the power of Gemini and Supabase Vector Search.

## 🚀 Key Features
- **Voice Capture**: Instantly transcribe and ingest thoughts via Deepgram.
- **Semantic Memory**: Uses `gemini-embedding-001` (3072 dimensions) to retrieve context from your past notes.
- **Execution Partner**: A specialized chat interface to help you brainstorm and generate content based on your stored memories.
- **Content Engine**: Automatically generate social media posts, outlines, and summaries from your captured ideas.

## 🛠 Tech Stack
- **Framework**: Next.js 16 (App Router)
- **AI SDK**: Vercel AI SDK v6
- **LLM**: Google Gemini 2.5 Flash
- **Database**: Supabase + pgvector
- **Transcription**: Deepgram SDK v5

## ⚙️ Environment Variables
Ensure the following are set in your `.env.local` and Vercel Project Settings:

```bash
# Google AI
GOOGLE_GENERATIVE_AI_API_KEY=your_key_here

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_here

# Deepgram
DEEPGRAM_API_KEY=your_key_here

# Deployment
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## 🏗 Setup & Build
```bash
npm install
npm run dev
npm run build
```
