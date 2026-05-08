# 아나바다 장터 🛍️

School flea-market reservation system — SvelteKit + Supabase.

## Quick Start

### 1. Supabase Setup

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor → New Query**, paste and run `supabase/schema.sql`
3. In **Storage**, confirm the `items` bucket was created (public)

### 2. Environment Variables

```bash
cp .env.example .env
```

Fill in `.env`:

| Variable | Where to find |
|---|---|
| `PUBLIC_SUPABASE_URL` | Project Settings → API → Project URL |
| `PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API → service_role secret |
| `ADMIN_PASSWORD` | Choose any password for the teacher login |

### 3. Install & Run

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Pages

| Path | Description |
|---|---|
| `/` | Main dashboard — chart + item grid + reservation |
| `/upload` | Group upload page — register items |
| `/admin` | Teacher admin — password protected, manage all items |

## Tech Stack

- **SvelteKit 2** — file-based routing, server actions, SSR
- **Tailwind CSS 3** — utility-first styling
- **Supabase** — PostgreSQL database + storage
- **Chart.js 4** — bar chart for class stats

## Deployment

Deploy to **Vercel** or **Netlify** by connecting the repo. Make sure to add all `.env` variables to the deployment environment settings.
