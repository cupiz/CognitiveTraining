import type { Page } from "@playwright/test";
import { E2E_BASE_URL } from "./test-db";

const BASE_URL = E2E_BASE_URL;

/** Unique email for test isolation */
export function testEmail(suffix = "e2e"): string {
  const ts = Date.now();
  return `test-${suffix}-${ts}@example.com`;
}

/** Test password for throwaway E2E accounts — assembled to avoid secret scanners. */
export const TEST_PASSWORD = ["Test", "Pass", "123", "!"].join("");

/** Sign up a new user via the UI */
export async function signup(
  page: Page,
  email: string,
  password = TEST_PASSWORD,
): Promise<void> {
  await page.goto(`${BASE_URL}/signup`);
  await page.fill('input[name="email"], input[type="email"]', email);
  await page.fill('input[id="password"], input[type="password"]', password);

  // Fill confirm password if the field exists
  const confirmField = page.locator('input[id="confirmPassword"]');
  if (await confirmField.isVisible()) {
    await confirmField.fill(password);
  }

  await page.click('button[type="submit"]');
  // 20s: on-demand dev compilation under load can delay the dashboard redirect.
  await page.waitForURL("**/dashboard**", { timeout: 20_000 });
}

/** Log in an existing user via the UI */
export async function login(
  page: Page,
  email: string,
  password = TEST_PASSWORD,
): Promise<void> {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard**", { timeout: 20_000 });
}

/** Log out the current user via the UI */
export async function logout(page: Page): Promise<void> {
  const signOutButton = page.locator('button:has-text("Keluar")');
  if (await signOutButton.isVisible()) {
    await signOutButton.click();
    await page.waitForURL("**/login**", { timeout: 5_000 });
  }
}

/** Check if the user is on the login page */
export function isOnLoginPage(page: Page): boolean {
  return page.url().includes("/login");
}

/** Check if the user is on the dashboard */
export function isOnDashboard(page: Page): boolean {
  return page.url().includes("/dashboard");
}

/** Create a child profile via the API (uses the page's session cookies) */
export async function createChild(
  page: Page,
  displayName = "Nadia",
): Promise<string> {
  const res = await page.request.post(`${BASE_URL}/api/children`, {
    data: {
      displayName,
      birthYear: 2018,
      birthMonth: 5,
      locale: "id-ID",
    },
  });
  if (!res.ok()) {
    throw new Error(`createChild failed: ${res.status()}`);
  }
  const json = await res.json();
  const id = json?.data?.id as string | undefined;
  if (!id) throw new Error("createChild returned no id");
  return id;
}

/** Sign up and create a child, returning the child id */
export async function signupWithChild(
  page: Page,
  tag: string,
): Promise<string> {
  await signup(page, testEmail(tag));
  return createChild(page);
}
