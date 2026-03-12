import "dotenv/config";

const checks = [];

function addCheck(name, status, detail) {
  checks.push({ name, status, detail });
}

const databaseUrl = process.env.DATABASE_URL ?? "";
const sessionSecret = process.env.SESSION_SECRET ?? "";
const appUrl = process.env.APP_URL ?? "";
const dbProvider = process.env.FLORAVISION_DB_PROVIDER ?? "sqlite";
const storageProvider = process.env.FLORAVISION_STORAGE_PROVIDER ?? "local";
const blobToken = process.env.BLOB_READ_WRITE_TOKEN ?? "";

if (!["sqlite", "postgres"].includes(dbProvider)) {
  addCheck("FLORAVISION_DB_PROVIDER", "fail", `Unsupported provider "${dbProvider}".`);
} else {
  addCheck("FLORAVISION_DB_PROVIDER", "pass", `Database provider mode is ${dbProvider}.`);
}

if (!["local", "blob"].includes(storageProvider)) {
  addCheck("FLORAVISION_STORAGE_PROVIDER", "fail", `Unsupported storage provider "${storageProvider}".`);
} else if (storageProvider === "local") {
  addCheck(
    "FLORAVISION_STORAGE_PROVIDER",
    "warn",
    "Using local filesystem storage. Fine for development, but not for Vercel beta hosting.",
  );
} else {
  addCheck("FLORAVISION_STORAGE_PROVIDER", "pass", `Storage provider mode is ${storageProvider}.`);
}

if (storageProvider === "blob" && !blobToken) {
  addCheck("BLOB_READ_WRITE_TOKEN", "fail", "Blob storage mode requires BLOB_READ_WRITE_TOKEN.");
} else if (storageProvider === "blob") {
  addCheck("BLOB_READ_WRITE_TOKEN", "pass", "Blob storage token is configured.");
}

if (!databaseUrl) {
  addCheck("DATABASE_URL", "fail", "Missing DATABASE_URL.");
} else if (dbProvider === "sqlite" && databaseUrl.startsWith("file:")) {
  addCheck(
    "DATABASE_URL",
    "warn",
    "Using local SQLite. Fine for development, but move to a hosted database before external beta testing.",
  );
} else if (dbProvider === "sqlite" && !databaseUrl.startsWith("file:")) {
  addCheck("DATABASE_URL", "fail", "SQLite mode requires a file: DATABASE_URL.");
} else if (dbProvider === "postgres" && databaseUrl.startsWith("file:")) {
  addCheck("DATABASE_URL", "fail", "Postgres mode cannot use a local SQLite DATABASE_URL.");
} else {
  addCheck("DATABASE_URL", "pass", "Database URL is configured for a non-local deployment target.");
}

if (!sessionSecret) {
  addCheck("SESSION_SECRET", "fail", "Missing SESSION_SECRET.");
} else if (sessionSecret === "dev-session-secret-change-me" || sessionSecret.length < 24) {
  addCheck("SESSION_SECRET", "warn", "Replace SESSION_SECRET with a stronger production value before beta.");
} else {
  addCheck("SESSION_SECRET", "pass", "Session secret looks production-safe.");
}

if (!appUrl) {
  addCheck("APP_URL", "warn", "APP_URL is not set yet.");
} else {
  addCheck("APP_URL", "pass", `APP_URL is set to ${appUrl}.`);
}

const hasFailure = checks.some((check) => check.status === "fail");
const hasWarning = checks.some((check) => check.status === "warn");

const headline = hasFailure ? "NOT READY" : hasWarning ? "PARTIALLY READY" : "READY";

console.log(`FloraVision deployment readiness: ${headline}`);

for (const check of checks) {
  console.log(`[${check.status.toUpperCase()}] ${check.name}: ${check.detail}`);
}

if (hasFailure) {
  process.exitCode = 1;
}
