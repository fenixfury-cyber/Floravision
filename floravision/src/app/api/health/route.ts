import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDeploymentReadiness } from "@/lib/env";

export async function GET() {
  const readiness = getDeploymentReadiness();

  try {
    await prisma.shop.count();

    const status =
      readiness.usesLocalSqlite || !readiness.hasConfiguredAppUrl || !readiness.hasStrongSessionSecret
        ? "degraded"
        : "ok";

    return NextResponse.json(
      {
        status,
        timestamp: new Date().toISOString(),
        checks: {
          database: "ok",
          env: readiness,
        },
        notes: [
          readiness.usesLocalSqlite
            ? "DATABASE_URL still points to local SQLite; this is fine for development but not for public beta hosting."
            : null,
          readiness.providerMatchesUrl ? null : "Database provider mode does not match DATABASE_URL.",
          readiness.usesLocalFileStorage
            ? "Storage is still set to local filesystem. Fine for development, but not for Vercel beta hosting."
            : null,
          readiness.hasBlobToken ? null : "BLOB_READ_WRITE_TOKEN is missing for blob storage mode.",
          readiness.hasConfiguredAppUrl ? null : "APP_URL is not configured yet.",
          readiness.hasStrongSessionSecret ? null : "SESSION_SECRET should be replaced before external testing.",
        ].filter(Boolean),
      },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown health check error.";

    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        checks: {
          database: "error",
          env: readiness,
        },
        error: message,
      },
      { status: 503 },
    );
  }
}
