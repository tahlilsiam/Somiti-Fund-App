# Somiti-Fund-App (Sophnochura Somiti)

A transaction-led finance & member management system for **Sophnochura Somiti**.

Members submit payments, admins review and approve them, and only approved
payments post to the official transaction ledger. All balances, installments,
dues, and reports are derived from that ledger — the single source of truth.

## Tech stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4 + shadcn/ui
- Supabase (PostgreSQL, Auth, Storage)
- Zod for validation
- Deployed on Vercel

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase keys
npm run dev
```

Open http://localhost:3000.

## Environment variables

See `.env.example`. Required:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY` (server-only — never expose to the browser)

## Database

SQL migrations live in `supabase/migrations/`. Run them in the Supabase SQL
Editor (or via the Supabase CLI) in filename order.

## Roles

- `super_admin`, `admin` — access `/admin`
- `member` — accesses `/member`
