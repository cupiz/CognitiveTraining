/**
 * Playwright global setup: guarantee a ready, empty database for the E2E run.
 *
 * 1. Create the test database if it does not exist (via the maintenance db).
 * 2. `prisma db push` — bring the schema up to date.
 * 3. Truncate accounts (cascades to children/sessions/telemetry) so every run
 *    starts from a clean slate.
 * 4. Force every game visible — the E2E suite expects the full collection.
 *
 * Security note: the single execSync command here is a compile-time constant
 * with no shell interpolation — variable data (connection URLs, SQL) flows
 * through environment variables and parameterised Prisma clients instead.
 */
import { execSync } from "node:child_process";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { MAINTENANCE_DB_URL, TEST_DB_NAME, TEST_DB_URL } from "./test-db";

// Playwright runs webServer/globalSetup with cwd = the config directory
// (apps/web); the repo root is two levels up.
const REPO_ROOT = path.resolve(process.cwd(), "../..");

const TRUNCATE_SQL = 'TRUNCATE TABLE "accounts" CASCADE;';
const VISIBILITY_KEYS = [
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
  "train_n_back",
  "dual_garden",
  "crystal_tower",
  "wide_view",
  "tap_critter",
  "pair_cards",
];
const VISIBILITY_SQL = VISIBILITY_KEYS.map(
  (key) =>
    `INSERT INTO "game_visibility" ("game_key", "visible", "updated_at") VALUES ('${key}', true, now()) ON CONFLICT ("game_key") DO UPDATE SET visible = true;`,
);

const E2E_ENV: NodeJS.ProcessEnv = { ...process.env, DATABASE_URL: TEST_DB_URL };

export default async function globalSetup() {
  // 1. Create the test database if it does not exist (ignore "already exists").
  const maintenance = new PrismaClient({
    datasources: { db: { url: MAINTENANCE_DB_URL } },
  });
  try {
    await maintenance
      .$executeRawUnsafe(`CREATE DATABASE "${TEST_DB_NAME}"`)
      .then(() => console.log(`[e2e] created database ${TEST_DB_NAME}`))
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes("already exists")) {
          console.log(`[e2e] database ${TEST_DB_NAME} already exists`);
          return;
        }
        throw err;
      });
  } finally {
    await maintenance.$disconnect();
  }

  // 2. Sync the schema. `db push` (not `migrate deploy`) on purpose: the
  // disposable test db must always match schema.prisma exactly, even when
  // local schema changes were never captured as migration files.
  execSync("pnpm --filter @cog/db exec prisma db push --skip-generate", {
    cwd: REPO_ROOT,
    stdio: "inherit",
    env: E2E_ENV,
  });
  console.log("[e2e] schema synced");

  // 3. Fresh slate + deterministic game visibility for the run.
  const e2eDb = new PrismaClient({
    datasources: { db: { url: TEST_DB_URL } },
  });
  try {
    await e2eDb.$executeRawUnsafe(TRUNCATE_SQL);
    for (const sql of VISIBILITY_SQL) {
      await e2eDb.$executeRawUnsafe(sql);
    }
    console.log("[e2e] accounts truncated, all games visible — clean slate");
  } finally {
    void e2eDb.$disconnect();
  }
}

// Allow running directly (`npx tsx e2e/global-setup.ts`) for manual setup.
if (process.argv[1]?.replace(/\\/g, "/").endsWith("global-setup.ts")) {
  void globalSetup();
}
