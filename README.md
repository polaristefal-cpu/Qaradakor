# Qaradakor.kz

Qaradakor.kz is a Vite + React movie library app with Supabase Edge Functions, TMDB integration, AI recommendations, collections, reviews, watchlists and admin screens.

## Local Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
npm run preview
```

The static frontend build is generated in `dist/`.

## Frontend Deployment

Deploy the contents of `dist/` to your static host. This is a React Router SPA, so the host must rewrite unknown routes to `index.html`.

Netlify fallback is already included through `public/_redirects`.

## Supabase Edge Function

The frontend calls:

```text
https://ozqwuskwusqsghkvqdux.supabase.co/functions/v1/make-server-59141208
```

Deploy the matching function folder:

```bash
supabase functions deploy make-server-59141208
```

Required server secrets:

```bash
supabase secrets set SUPABASE_URL=...
supabase secrets set SUPABASE_ANON_KEY=...
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
supabase secrets set TMDB_API_KEY=...
supabase secrets set OPENAI_API_KEY=...
supabase secrets set WAZZUP_API_KEY=...
supabase secrets set MOBIZON_API_KEY=...
```

Use `.env.example` as the local checklist; do not commit real `.env` files.
