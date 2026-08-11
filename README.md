# SoundWave Pro — Support Chatbot

A RAG-powered customer support chatbot for a wireless headphone store, with a
staff dashboard for managing conversations and the FAQ knowledge base.

- **Customer widget** — answers product questions using retrieval-augmented
  generation over a curated FAQ knowledge base, and escalates to a human
  agent when it doesn't have a confident answer.
- **Admin dashboard** — live view of conversations, reply-to-customer for
  escalated chats, FAQ CRUD, and an analytics overview (volume trend, status
  breakdown, CSV export).

## Stack

| | |
|---|---|
| Backend | NestJS, Prisma, PostgreSQL + [pgvector](https://github.com/pgvector/pgvector) |
| LLM | [Groq](https://groq.com/) (`llama-3.3-70b-versatile`), streamed via SSE |
| Embeddings | `Xenova/paraphrase-multilingual-MiniLM-L12-v2` (local, via `@huggingface/transformers`) |
| Frontend | Next.js (App Router), Tailwind CSS, daisyUI |
| Auth | JWT (admin dashboard only; the customer widget is anonymous) |

## Project structure

```
backend/    NestJS API — chat, RAG retrieval, admin auth, conversations, FAQ CRUD, stats
frontend/   Next.js app — customer-facing landing page + chat widget, admin dashboard
```

## Getting started

### 1. Database

```bash
docker compose up -d
```

Starts Postgres with the pgvector extension on `localhost:5433`.

### 2. Backend

```bash
cd backend
cp .env.example .env   # fill in GROQ_API_KEY, JWT_SECRET, ADMIN_SEED_*
npm install
npx prisma migrate deploy
npm run seed:admin                                            # creates the first admin user
npx ts-node -r tsconfig-paths/register prisma/seed.ts         # seeds the FAQ knowledge base
npm run start:dev
```

API runs on `http://localhost:3001`. Always use `start:dev` (watch mode) in
development — running the stale `dist/` build via `npm start` is a common
source of confusing bugs.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs on `http://localhost:3000`. Set `NEXT_PUBLIC_API_URL` if the backend
isn't on `http://localhost:3001`.

### 4. Log in to the admin dashboard

Visit `http://localhost:3000/admin/login` with the `ADMIN_SEED_EMAIL` /
`ADMIN_SEED_PASSWORD` from your `.env`.

## How the chat flow works

1. Customer message comes in on `POST /chat`.
2. The message is embedded and matched against `knowledge_base` via cosine
   distance (pgvector `<=>`). If the closest match is farther than
   `SIMILARITY_DISTANCE_THRESHOLD`, the conversation is escalated to a human
   agent instead of guessing.
3. Otherwise, the top matching FAQ entries (plus the last 20 turns of
   conversation history) are sent to Groq, and the reply is streamed back
   over SSE.
4. If Groq returns an empty completion (rare, but silent), that's treated as
   a failure and the conversation is escalated rather than showing nothing.
5. An escalated conversation shows up in the admin dashboard, where staff
   can reply directly; replies push to the customer's open chat via SSE.

## Managing the knowledge base

FAQs (`question` → `content` pairs, with an optional `category`) are managed
at `/admin/faqs`. Each entry is re-embedded on save, so retrieval quality
depends on writing FAQ questions the way a customer would actually phrase
them.
