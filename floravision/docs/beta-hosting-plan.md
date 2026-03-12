# FloraVision Beta Hosting Plan

This project is currently optimized for cheap local development:

- Next.js app
- local SQLite database
- seeded demo tenant data

That is the right setup while features are still moving. It is not the right setup for external beta testers.

## Recommended Free Beta Stack

Recommended first beta stack:

1. Vercel Hobby for the Next.js application.
2. Neon Free for the hosted Postgres database.
3. Keep photo uploads simple at first, then move to object storage when needed.

Why this stack:

- Vercel is the lowest-friction host for a Next.js App Router app.
- Neon gives a real hosted Postgres database without forcing paid infrastructure on day one.
- This avoids paying for production-grade capacity before the product is proven.

## Current State

As of March 11, 2026, the codebase has a local SQLite development schema in `prisma/schema.prisma`.

This repo now also includes a beta-target Postgres schema in `prisma/schema.postgres.prisma` so the cutover path is explicit.

## Beta Cutover Checklist

1. Create a hosted Postgres database.
2. Set `DATABASE_URL`, `SESSION_SECRET`, and `APP_URL` in the deployment environment.
3. Switch Prisma generation/migration work to the Postgres schema.
4. Replace the SQLite-specific runtime in `src/lib/prisma.ts`.
5. Run the health endpoint and readiness script.
6. Verify login, shop routing, orders, customers, time clock, inventory, procurement, and proposals against the hosted database.
7. Only then send the tester link.

## What Still Blocks External Beta

These are still unresolved:

- runtime Prisma setup is SQLite-specific
- no hosted Postgres database is wired yet
- photos still use URL entry instead of managed uploads

## Beta-Ready Definition

The app is ready for external beta only when all of the following are true:

1. `/api/health` returns `ok`, not `degraded`
2. `npm run readiness` reports no warnings
3. login and core shop workflows work against the hosted database
4. demo credentials are removed or clearly isolated from tester accounts

## Hosting Recommendation

Use Vercel Hobby first unless there is a strong reason not to.

If you later want more control over infrastructure, we can move to another Node-capable host after the product proves itself.
