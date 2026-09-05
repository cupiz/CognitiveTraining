/**
 * Playwright global setup: guarantee a ready, empty database for the E2E run.
 *
 * 1. Create the test database if it does not exist (via the maintenance db).
 * 2. `prisma migrate deploy` — bring the schema up to date.
 * 3. Truncate accounts (cascades to children/sessions/telemetry) so every run
 *    starts from a clean slate and the disposable test db stays small.
 */
import { execSync } from "node:child_process";
import path from "node:path";
import { MAINTENANCE_DB_URL, TEST_DB_NAME, TEST_DB_URL } from "./test-db";

// Playwright runs webServer/globalSetup with cwd = the config directory
// (apps/web); the repo root is two levels up.
const REPO_ROOT = path.resolve(process.cwd(), "../..");
const DB_PKG = "@cog/db";

function run(cmd: string, env?: NodeJS.ProcessEnv) {
  execSync(cmd, {
    cwd: REPO_ROOT,
    stdio: "inherit",
    env: env ? { ...process.env, ...env } : process.env,
  });
}

function runDbSql(sql: string, url: string) {
  try {
    execSync(`pnpm --filter ${DB_PKG} exec prisma db execute --url "${url}" --stdin`, {
      cwd: REPO_ROOT,
      input: sql,
      stdio: ["pipe", "inherit", "pipe"],
    });
  } catch (err) {
    const stderr = (err as { stderr?: Buffer }).stderr?.toString() ?? "";
    const base = err instanceof Error ? err.message : String(err);
    const message = `${base}\n${stderr}`;
    if (message.includes("already exists")) {
      console.log(`[e2e] database ${TEST_DB_NAME} already exists`);
      return;
    }
    throw new Error(message);
  }
}

export default function globalSetup() {
  // 1. Create the test database (ignore "already exists").
  runDbSql(`CREATE DATABASE "${TEST_DB_NAME}"`, MAINTENANCE_DB_URL);
  console.log(`[e2e] test database ready: ${TEST_DB_NAME}`);

  // 2. Sync the schema. `db push` (not `migrate deploy`) on purpose: the
  // disposable test db must always match schema.prisma exactly, even when
  // local schema changes were never captured as migration files.
  run("pnpm --filter @cog/db exec prisma db push --skip-generate", { DATABASE_URL: TEST_DB_URL });
  console.log("[e2e] schema synced");

  // 3. Fresh slate: cascade-truncate accounts (children/sessions/events follow).
  runDbSql('TRUNCATE TABLE "accounts" CASCADE', TEST_DB_URL);
  console.log("[e2e] accounts truncated — clean slate");

  // 4. Deterministic game visibility: the E2E suite expects the full game
  // collection showcased (landing test reads game names). Admin-configured
  // defaults (classics hidden) live only in seeded databases, but a test run
  // may inherit them — force every game visible for the run.
  const keys = [
    "memory_matrix",
    "target_watch",
    "quick_match",
    "stop_signal",
    "rule_switch",
    "spice_stall",
    "red_light",
    "courier_map",
    "lighthouse_keeper",
    "sushi_express",
    "crystal_palace",
  ];
  const sql = keys
    .map(
      (key) =>
        `INSERT INTO "game_visibility" ("game_key", "visible", "updated_at") VALUES ('${key}', true, now()) ON CONFLICT ("game_key") DO UPDATE SET visible = true;`,
    )
    .join("\n");
  runDbSql(sql, TEST_DB_URL);
  console.log("[e2e] all games set visible");
}

// Allow running directly (`npx tsx e2e/global-setup.ts`) for manual setup.
if (process.argv[1]?.replace(/\\/g, "/").endsWith("global-setup.ts")) {
  globalSetup();
}
