# EXL POC — Voice Sales Trainer (SPIN / Scenario A)

Voice-enabled discovery simulation: reps practice with an AI prospect (Marcus), get SPIN-tagged feedback, and an end-of-session coach debrief.

**Stack:** React, TypeScript, Vite, OpenAI (browser `VITE_OPENAI_API_KEY`).

## Local run

```bash
npm install
cp .env.example .env.local
# Add your OpenAI key to .env.local
npm run dev
```

Open `http://localhost:5173`. Use **Chrome or Edge** for microphone (Web Speech API).

## Environment

| Variable | Required |
|----------|----------|
| `VITE_OPENAI_API_KEY` | Yes, for Marcus replies + AI coach debrief |

Never commit `.env` or real keys. Copy from `.env.example` only.

## Deploy quickly (share a link)

These hosts build the Vite app as static files and give you a URL in minutes.

### Vercel (often fastest)

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. **Add New Project** → import `harjapan-gomagentic/EXL_POC_VOICE_SALES_V2`.
3. Framework preset: **Vite** (auto-detected). Build: `npm run build`, output: `dist`.
4. **Environment Variables:** add `VITE_OPENAI_API_KEY` = your key (Production + Preview).
5. Deploy. Share the `*.vercel.app` URL.

### Netlify

1. [app.netlify.com](https://app.netlify.com) → Add new site from Git → pick the repo.
2. Build command: `npm run build`, publish directory: `dist`.
3. Site settings → Environment variables → add `VITE_OPENAI_API_KEY`.
4. Deploy and share the Netlify URL.

### Cloudflare Pages

1. Pages → Connect repo → build `npm run build`, output `dist`.
2. Add environment variable `VITE_OPENAI_API_KEY`.
3. Deploy and share the `*.pages.dev` URL.

**Note:** The API key is embedded in the client bundle (`VITE_*`). For a real production app, move OpenAI calls to a small backend so the key stays server-side. For a POC demo with a trusted audience, Vercel/Netlify + env is the usual tradeoff.

## Repo

https://github.com/harjapan-gomagentic/EXL_POC_VOICE_SALES_V2
