import { test, expect } from "@playwright/test";

test.describe("Landing page", () => {
  test("root shows hero, parents, games, faq, safety and CTAs", async ({ page }) => {
    await page.goto("/");

    // Hero (default: Indonesian)
    await expect(
      page.locator("h1:has-text('bikin orang tua tenang')")
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Buat akun gratis" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Masuk" }).first()).toBeVisible();

    // Parents
    await expect(page.locator("h2:has-text('tanpa perlu jadi psikolog')")).toBeVisible();

    // Kids
    await expect(page.locator("h2:has-text('bukan ujian')")).toBeVisible();

    // How it works
    await expect(page.locator("h2:has-text('rencana latihan')")).toBeVisible();

    // Games — substring without the game count, which grows as games ship
    await expect(page.locator("h2:has-text('kemampuan inti')")).toBeVisible({ timeout: 15_000 });
    // 15s: a freshly started production server renders the below-fold section
    // slightly after the first paint.
    await expect(page.getByText("Memory Matrix").first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Target Watch").first()).toBeVisible({ timeout: 15_000 });

    // FAQ
    await expect(page.locator("h2:has-text('ditanyakan orang tua')")).toBeVisible();

    // Safety
    await expect(page.locator("h2:has-text('tenang untuk orang tua')")).toBeVisible();
    await expect(
      page.locator("h3:has-text('Pernyataan penting')")
    ).toBeVisible();
  });

  test("language toggle switches between Indonesian and English", async ({ page }) => {
    await page.goto("/");

    // Starts in Indonesian
    await expect(page.locator("h1:has-text('bikin orang tua tenang')")).toBeVisible();

    // Switch to English
    await page.click(`button:has-text("English")`);
    await expect(page.locator("h1:has-text('feel good about')")).toBeVisible();
    await expect(page.getByRole("link", { name: "Create a free account" }).first()).toBeVisible();

    // Switch back to Indonesian
    await page.click(`button:has-text("Bahasa Indonesia")`);
    await expect(page.locator("h1:has-text('bikin orang tua tenang')")).toBeVisible();
  });

  test("CTAs link to signup and login", async ({ page }) => {
    await page.goto("/");

    const startLink = page.getByRole("link", { name: "Buat akun gratis" }).first();
    expect(await startLink.getAttribute("href")).toBe("/signup");

    const signInLink = page.getByRole("link", { name: "Masuk" }).first();
    expect(await signInLink.getAttribute("href")).toBe("/login");
  });
});
