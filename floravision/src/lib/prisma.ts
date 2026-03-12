import { resolve } from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { getDatabaseUrl, getDbProvider, isSqliteUrl } from "@/lib/env";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function resolveSqlitePath(databaseUrl: string | undefined) {
  if (!databaseUrl || !isSqliteUrl(databaseUrl)) {
    throw new Error(
      "This build is currently configured for local SQLite development. Switch the Prisma datasource and client setup before using a hosted database.",
    );
  }

  return resolve(process.cwd(), databaseUrl.replace(/^file:/, ""));
}

function createPrismaClient() {
  const provider = getDbProvider();
  const databaseUrl = getDatabaseUrl();

  if (provider === "sqlite") {
    const adapter = new PrismaBetterSqlite3({
      url: resolveSqlitePath(databaseUrl),
    });

    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
  }

  if (isSqliteUrl(databaseUrl)) {
    throw new Error(
      "FLORAVISION_DB_PROVIDER is set to postgres but DATABASE_URL still points to local SQLite.",
    );
  }

  const pool = new Pool({
    connectionString: databaseUrl,
  });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
