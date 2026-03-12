# FloraVision App

FloraVision is a Next.js application for a florist-first POS and operations platform. It is being designed as a multi-tenant SaaS for many flower shops on one platform, with each shop isolated as its own tenant.

The current implementation is owner-first and focuses on the operational core:

- orders and production visibility
- customer history and arrangement memory
- delivery proof and multi-item accountability
- a real Prisma schema for the system foundation
- tenant-aware data modeling rooted at `Shop`
- deployment-readiness checks for the path from local development to hosted beta

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Prisma
- SQLite for local-first development

## Scripts

- `npm run dev`
- `npm run lint`
- `npm run build -- --webpack`
- `npm run prisma:generate`
- `npm run prisma:generate:sqlite`
- `npm run prisma:generate:postgres`
- `npm run prisma:validate:sqlite`
- `npm run prisma:validate:postgres`
- `npm run db:push`
- `npm run db:push:postgres`
- `npm run db:setup:sqlite`
- `npm run session:secret`
- `npm run readiness`

## Project Structure

- `src/app/page.tsx`: platform landing and login
- `src/app/api/health/route.ts`: health and readiness endpoint
- `src/lib/prisma.ts`: Prisma client singleton
- `src/lib/env.ts`: runtime env and readiness helpers
- `src/lib/storage.ts`: upload storage abstraction
- `prisma/schema.prisma`: application data model
- `prisma/schema.postgres.prisma`: hosted beta Postgres target schema
- `prisma/migrations/0001_init/migration.sql`: initial SQL migration snapshot
- `docs/beta-hosting-plan.md`: recommended free beta deployment plan
- `docs/vercel-neon-handoff.md`: account-side deployment handoff

## Notes

- Prisma client generation works in this environment.
- Local development should use `npm run db:setup:sqlite`.
- `prisma db push` currently fails here with a generic schema engine error even though the schema validates and the migration SQL can be generated. That appears to be an environment/runtime issue rather than a schema validity issue.
- `npm run build` using Turbopack is also constrained by this sandbox, so verification is done with `npm run build -- --webpack`.
- The runtime now supports both SQLite and Postgres modes, but the actual hosted Postgres database still needs to be wired before beta.

## Beta Readiness

Use `npm run readiness` for a fast deployment check.

Current beta blockers for a public tester link:

1. `DATABASE_URL` still points to local SQLite.
2. `FLORAVISION_DB_PROVIDER` must match the active database mode.
3. `SESSION_SECRET` must be replaced with a strong non-default value.
4. `APP_URL` should be set to the deployed site URL.
5. `FLORAVISION_STORAGE_PROVIDER` must be switched off local filesystem before Vercel beta hosting.
6. `BLOB_READ_WRITE_TOKEN` must be configured when blob storage mode is enabled.

You can also query the health endpoint locally:

- `GET /api/health`

If the app is healthy but still using local SQLite, local filesystem storage, or a default secret, the endpoint returns `degraded` instead of `ok`. That is the signal that the app is still development-only, not beta-ready.

## Deployment Path

Recommended low-cost path:

1. Keep local SQLite during active feature development.
2. Generate against the correct Prisma schema for the target environment.
3. When ready for private beta, move to a hosted database.
4. Use local uploads during development only.
5. Set `FLORAVISION_DB_PROVIDER=postgres`, `FLORAVISION_STORAGE_PROVIDER=blob`, `BLOB_READ_WRITE_TOKEN`, plus `SESSION_SECRET` and `APP_URL` for the deployed environment.
6. Run `npm run prisma:generate:postgres`, `npm run db:push:postgres`, and `npm run db:seed:postgres` against the hosted database.
7. Deploy to Vercel Hobby first.
8. Use the readiness script and health endpoint before sending testers a link.

## Next Recommended Slice

1. Replace the local upload provider with hosted blob/object storage for beta.
2. Finish the Prisma runtime cutover to a hosted Postgres database.
3. Add reminders and notification workflows.
