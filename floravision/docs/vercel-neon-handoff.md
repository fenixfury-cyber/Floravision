# Vercel + Neon Handoff

This is the shortest path from local development to a real private beta.

## Target Stack

- App host: Vercel Hobby
- Database: Neon Free
- File storage: Vercel Blob

## Required Environment Variables

For beta hosting, set these in Vercel:

- `FLORAVISION_DB_PROVIDER=postgres`
- `FLORAVISION_STORAGE_PROVIDER=blob`
- `DATABASE_URL=<Neon connection string>`
- `BLOB_READ_WRITE_TOKEN=<Vercel Blob token>`
- `SESSION_SECRET=<strong generated secret>`
- `APP_URL=<your Vercel deployment URL>`

## Local Prep Commands

Run these before deployment when you have the hosted services ready:

```bash
npm run prisma:generate:postgres
npm run db:push:postgres
npm run db:seed:postgres
npm run readiness
```

Generate a production session secret with:

```bash
npm run session:secret
```

## Beta-Ready Check

Do not send testers a link until all of these are true:

1. `npm run readiness` has no warnings.
2. `/api/health` returns `ok`.
3. Login works on the deployed URL.
4. Order photo upload works on the deployed URL.
5. Shop routes load from the hosted Postgres database.

## What I Will Need From You Later

I only need these account-side actions when we are ready:

1. Create or sign in to a Neon account.
2. Create or sign in to a Vercel account.
3. Create a Neon database and provide the connection string.
4. Create a Vercel Blob store or enable Blob and provide the token.

Everything else can be prepared in code before that point.
