import "dotenv/config";
import { dirname, resolve } from "node:path";
import { mkdir, rm } from "node:fs/promises";
import { spawn } from "node:child_process";

function getDbProvider() {
  return process.env.FLORAVISION_DB_PROVIDER ?? "sqlite";
}

function resolveSqlitePath(databaseUrl) {
  if (!databaseUrl?.startsWith("file:")) {
    throw new Error("DATABASE_URL must use sqlite file: syntax for local setup.");
  }

  const relativePath = databaseUrl.replace(/^file:/, "");
  return resolve(process.cwd(), relativePath);
}

function runSqlite(dbPath) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn("sqlite3", [dbPath, `.read prisma/migrations/0001_init/migration.sql`], {
      cwd: process.cwd(),
      stdio: "inherit",
    });

    child.on("error", rejectPromise);
    child.on("exit", (code) => {
      if (code === 0) {
        resolvePromise();
        return;
      }

      rejectPromise(new Error(`sqlite3 exited with code ${code}`));
    });
  });
}

async function main() {
  if (getDbProvider() !== "sqlite") {
    throw new Error("db:init only supports local SQLite. Use Prisma db push/migrate for Postgres environments.");
  }

  const databaseUrl = process.env.DATABASE_URL;
  const dbPath = resolveSqlitePath(databaseUrl);

  await mkdir(dirname(dbPath), { recursive: true });
  await rm(dbPath, { force: true });
  await runSqlite(dbPath);

  console.log(`Initialized SQLite database at ${dbPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
