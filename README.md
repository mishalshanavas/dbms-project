# Lost & Found — Sahrdaya College

A community platform for reporting and reclaiming lost & found items within Sahrdaya College of Engineering & Technology.

## Tech Stack

- **Framework**: Nuxt 4 (Vue 3 + Nitro)
- **Database**: CockroachDB Serverless (PostgreSQL-compatible)
- **ORM**: Drizzle ORM
- **Auth**: Google OAuth via `nuxt-auth-utils` (restricted to `@sahrdaya.ac.in`)
- **UI**: Tailwind CSS v4, Radix Vue, CVA, Lucide icons
- **Package Manager**: pnpm

## Features

- Google SSO restricted to college domain (`@sahrdaya.ac.in`)
- Report lost or found items with photo upload (auto-compressed to ~300KB)
- Browse, search, and filter the community feed
- Claim items with messages and contact info
- Item owner can accept/reject claims
- Personal dashboard for your items and claims
- Admin panel with stats, status management, and moderation
- Dark/light theme with system preference detection
- Mobile-first responsive layout with bottom navigation

## Getting Started

```bash
# Install dependencies
pnpm install

# Copy env file and fill in values
cp .env.example .env

# Start development server
pnpm dev
```

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | CockroachDB connection string |
| `NUXT_SESSION_PASSWORD` | Session encryption key (min 32 chars) |
| `NUXT_OAUTH_GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `NUXT_OAUTH_GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `ADMIN_EMAILS` | Comma-separated admin email addresses |

## Project Structure

```
shared/          → Shared types & utils (auto-imported on client + server)
app/
  assets/css/    → Tailwind theme (main.css)
  components/ui/ → Shadcn-style UI primitives
  composables/   → useToast, useImageCompress
  layouts/       → Default layout (navbar + mobile nav)
  middleware/    → Auth & admin route guards
  pages/         → Login, Feed, Report, Item detail, Dashboard, Admin
  utils/         → Constants (re-exports from shared)
  lib/           → cn() utility
server/
  api/           → Nitro API routes (items, claims, user, admin)
  middleware/    → Server auth middleware
  plugins/       → DB initialization on startup
  routes/auth/   → Google OAuth callback
  utils/         → Database connection (Drizzle + pg Pool)
db/
  schema.ts      → Drizzle schema (users, items, claims)
```
