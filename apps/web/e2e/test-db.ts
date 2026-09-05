/**
 * Shared E2E run constants.
 *
 * The E2E suite runs against its OWN production server (port 3100) and its
 * OWN database, so it never touches the developer's `next dev` data on
 * port 3000 / cognitive_training.
 */

export const E2E_PORT = 3100;
export const E2E_BASE_URL = `http://localhost:${E2E_PORT}`;

/**
 * Disposable database for E2E runs. Override with E2E_DATABASE_URL if your
 * local Postgres credentials differ.
 */
export const TEST_DB_URL =
  process.env.E2E_DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/cognitive_training_test";

/** Maintenance connection (default `postgres` database) used to CREATE the test db. */
export const MAINTENANCE_DB_URL = TEST_DB_URL.replace(/\/[^/?]+(\?|$)/, "/postgres$1");

export const TEST_DB_NAME = "cognitive_training_test";
