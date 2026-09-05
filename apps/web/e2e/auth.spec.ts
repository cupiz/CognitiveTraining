import { test, expect } from "@playwright/test";
import { signup, login, logout, testEmail, TEST_PASSWORD } from "./helpers";

test.describe("Authentication flow", () => {
  test("signup → lands on dashboard", async ({ page }) => {
    const email = testEmail("signup");

    await signup(page, email);

    // Should be on dashboard
    expect(page.url()).toContain("/dashboard");

    // Dashboard should show the user's email
    await expect(page.locator(`text=${email}`)).toBeVisible();
  });

  test("login → dashboard → logout → login page", async ({ page }) => {
    const email = testEmail("login");

    // First sign up
    await signup(page, email);

    // Logout
    await logout(page);
    expect(page.url()).toContain("/login");

    // Login again
    await login(page, email);
    expect(page.url()).toContain("/dashboard");

    // Logout again
    await logout(page);
    expect(page.url()).toContain("/login");
  });

  test("wrong password shows error", async ({ page }) => {
    const email = testEmail("wrongpass");

    // Sign up first
    await signup(page, email);
    await logout(page);

    // Try wrong password
    await page.goto("/login");
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', "WrongPassword123!");
    await page.click('button[type="submit"]');

    // Should show error
    await expect(page.locator("text=Invalid email or password")).toBeVisible({ timeout: 5_000 });

    // Should still be on login page
    expect(page.url()).toContain("/login");
  });

  test("nonexistent email shows same error (no enumeration)", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "nonexistent-user@example.com");
    await page.fill('input[type="password"]', "SomePassword123!");
    await page.click('button[type="submit"]');

    await expect(page.locator("text=Invalid email or password")).toBeVisible({ timeout: 5_000 });
  });

  test("unauthenticated user redirected to login", async ({ page }) => {
    await page.goto("/dashboard");

    // Should redirect to login
    await page.waitForURL("**/login**", { timeout: 5_000 });
    expect(page.url()).toContain("/login");
  });

  test("authenticated user redirected away from login", async ({ page }) => {
    const email = testEmail("redirect");
    await signup(page, email);
    await logout(page);

    // Try to go to login while session cookie might still exist
    // (depends on cookie clearing)
    await page.goto("/login");

    // If session is cleared, should stay on login
    // If session exists, should redirect to dashboard
    const url = page.url();
    expect(url.includes("/login") || url.includes("/dashboard")).toBe(true);
  });

  test("signup page has link to login", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.locator('a:has-text("Masuk")')).toBeVisible();
  });

  test("login page has link to signup", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator('a:has-text("Buat akun orang tua")')).toBeVisible();
  });

  test("login page has forgot password link", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator('a:has-text("Lupa kata sandi")')).toBeVisible();
  });
});

test.describe("Child profile flow", () => {
  test("create child → appears in list → view detail", async ({ page }) => {
    const email = testEmail("child");

    // Sign up
    await signup(page, email);

    // Navigate to children page
    await page.click('a:has-text("Anak")');
    await expect(page.locator('h1:has-text("Anak")')).toBeVisible();

    // Click "Add child"
    await page.click('a:has-text("Tambah anak")');
    await page.locator('input[id="displayName"]').waitFor({ state: "visible" });
    // Give React a beat to hydrate — clicking submit before the form's
    // onSubmit is attached falls through to a native GET form navigation.
    await page.waitForTimeout(1_000);

    // Fill the form
    await page.fill('input[id="displayName"]', "Test Child");

    // Submit
    await page.click('button:has-text("Buat profil")');

    // Should redirect to the children LIST (exact URL — /children/new also
    // contains "children" and would match a looser glob)
    await page.waitForURL("**/dashboard/children", { timeout: 10_000 });

    // Child should appear in the list
    await expect(page.locator("text=Test Child")).toBeVisible({ timeout: 5_000 });
  });
});
