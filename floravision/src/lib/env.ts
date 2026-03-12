const DEFAULT_DEV_SESSION_SECRET = "dev-session-secret-change-me";
const SUPPORTED_DB_PROVIDERS = ["sqlite", "postgres"] as const;

export type FloraVisionDbProvider = (typeof SUPPORTED_DB_PROVIDERS)[number];

function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

export function getDatabaseUrl() {
  return requireEnv("DATABASE_URL");
}

export function getDbProvider(): FloraVisionDbProvider {
  const provider = process.env.FLORAVISION_DB_PROVIDER ?? "sqlite";

  if ((SUPPORTED_DB_PROVIDERS as readonly string[]).includes(provider)) {
    return provider as FloraVisionDbProvider;
  }

  throw new Error(
    `Unsupported FLORAVISION_DB_PROVIDER "${provider}". Expected one of: ${SUPPORTED_DB_PROVIDERS.join(", ")}.`,
  );
}

export function getSessionSecret() {
  return requireEnv("SESSION_SECRET");
}

export function getAppUrl() {
  return process.env.APP_URL ?? null;
}

export function isSqliteUrl(databaseUrl: string) {
  return databaseUrl.startsWith("file:");
}

export function isDefaultDevSessionSecret(secret: string) {
  return secret === DEFAULT_DEV_SESSION_SECRET;
}

export function isSessionSecretStrong(secret: string) {
  return secret.length >= 24 && !isDefaultDevSessionSecret(secret);
}

export function getDeploymentReadiness() {
  const dbProvider = getDbProvider();
  const databaseUrl = getDatabaseUrl();
  const sessionSecret = getSessionSecret();
  const appUrl = getAppUrl();
  const storageProvider = process.env.FLORAVISION_STORAGE_PROVIDER ?? "local";
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN ?? "";

  return {
    dbProvider,
    databaseUrl,
    appUrl,
    storageProvider,
    usesLocalSqlite: isSqliteUrl(databaseUrl),
    providerMatchesUrl:
      (dbProvider === "sqlite" && isSqliteUrl(databaseUrl)) ||
      (dbProvider === "postgres" && !isSqliteUrl(databaseUrl)),
    hasConfiguredAppUrl: Boolean(appUrl),
    hasStrongSessionSecret: isSessionSecretStrong(sessionSecret),
    usesLocalFileStorage: storageProvider === "local",
    hasBlobToken: storageProvider === "blob" ? Boolean(blobToken) : true,
  };
}
