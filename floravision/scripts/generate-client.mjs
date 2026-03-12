import "dotenv/config";
import { spawnSync } from "node:child_process";

const provider = process.env.FLORAVISION_DB_PROVIDER ?? "sqlite";
const schema = provider === "postgres" ? "prisma/schema.postgres.prisma" : "prisma/schema.prisma";

const result = spawnSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["prisma", "generate", "--schema", schema],
  {
    stdio: "inherit",
    env: process.env,
  },
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
