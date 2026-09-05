import { test, expect } from "@playwright/test";
import { signupWithChild } from "./helpers";

/**
 * Pause flow + trial time bar.
 *
 * These guard the fixes for two real incidents:
 * - pausing could never be undone (pause-bus latched after exiting mid-pause,
 *   and a second pause no longer froze game timers), and
 * - the per-trial response window had no visible countdown.
 */

const TIME_BAR = "[role='progressbar'][aria-label='Sisa waktu menjawab']";

/** The pause modal's own Lanjutkan button (the header toggle shares the name). */
function modalResume(page: import("@playwright/test").Page) {
  return page
    .locator(".card", { hasText: "Permainan dijeda" })
    .getByRole("button", { name: "Lanjutkan" });
}

test.describe("Pause flow", () => {
  test("pause modal opens, Lanjutkan resumes the round", async ({ page }) => {
    const childId = await signupWithChild(page, "pause-resume");
    await page.goto(`/dashboard/play/quick_match?childId=${childId}`);
    await page.getByRole("button", { name: "Mulai main!" }).click();
    await page.waitForTimeout(4500); // countdown 3-2-1 → playing

    await page.getByRole("button", { name: "Jeda" }).click();
    await expect(page.getByRole("heading", { name: "Permainan dijeda" })).toBeVisible();

    await modalResume(page).click();
    await expect(page.getByRole("heading", { name: "Permainan dijeda" })).toBeHidden({
      timeout: 3_000,
    });
    // The round is alive again: a response window (time bar) is running.
    await expect(page.locator(TIME_BAR)).toBeVisible({ timeout: 10_000 });
  });

  test("pausing during the countdown holds it until resumed", async ({ page }) => {
    const childId = await signupWithChild(page, "pause-countdown");
    await page.goto(`/dashboard/play/quick_match?childId=${childId}`);
    await page.getByRole("button", { name: "Mulai main!" }).click();
    await page.waitForTimeout(600); // mid-countdown

    await page.getByRole("button", { name: "Jeda" }).click();
    await expect(page.getByRole("heading", { name: "Permainan dijeda" })).toBeVisible();

    // The round must NOT start behind the modal.
    await page.waitForTimeout(4_000);
    await expect(page.getByText("poin").first()).toBeHidden();

    await modalResume(page).click();
    // Countdown finishes and the arena boots.
    await expect(page.getByText("poin").first()).toBeVisible({ timeout: 10_000 });
  });

  test("exiting while paused does not latch the next round's countdown", async ({
    page,
  }) => {
    const childId = await signupWithChild(page, "pause-exit");
    await page.goto(`/dashboard/play/quick_match?childId=${childId}`);
    await page.getByRole("button", { name: "Mulai main!" }).click();
    await page.waitForTimeout(4500);

    await page.getByRole("button", { name: "Jeda" }).click();
    await expect(page.getByRole("heading", { name: "Permainan dijeda" })).toBeVisible();
    await page.getByRole("button", { name: "Keluar dari game" }).click();
    await page.getByRole("button", { name: "Tinggalkan ronde" }).click();
    // The dev server can take a while to complete the client-side navigation.
    await page.waitForURL("**/dashboard/**", { timeout: 15_000 });

    // Next round: the countdown must run its course instead of freezing at 3.
    await page.goto(`/dashboard/play/quick_match?childId=${childId}`);
    await page.getByRole("button", { name: "Mulai main!" }).click();
    await expect(page.getByText("poin").first()).toBeVisible({ timeout: 12_000 });
  });
});

test.describe("Trial time bar", () => {
  test("appears during the response window and shrinks", async ({ page }) => {
    const childId = await signupWithChild(page, "time-bar");
    // Courier Map arms a long (18s) deadline — easy to sample twice.
    await page.goto(`/dashboard/play/courier_map?childId=${childId}`);
    await page.getByRole("button", { name: "Mulai main!" }).click();
    await page.waitForTimeout(4500); // countdown → first trial

    const bar = page.locator(TIME_BAR);
    await expect(bar).toBeVisible({ timeout: 10_000 });
    const first = Number(await bar.getAttribute("aria-valuenow"));
    await page.waitForTimeout(1_500);
    const second = Number(await bar.getAttribute("aria-valuenow"));
    expect(first).toBeGreaterThan(0);
    expect(second).toBeLessThan(first);
  });

  test("pausing freezes the displayed time", async ({ page }) => {
    const childId = await signupWithChild(page, "time-bar-pause");
    await page.goto(`/dashboard/play/courier_map?childId=${childId}`);
    await page.getByRole("button", { name: "Mulai main!" }).click();
    await page.waitForTimeout(4500);

    const bar = page.locator(TIME_BAR);
    await expect(bar).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: "Jeda" }).click();
    await expect(page.getByRole("heading", { name: "Permainan dijeda" })).toBeVisible();

    const frozen = Number(await bar.getAttribute("aria-valuenow"));
    await page.waitForTimeout(1_500);
    expect(Number(await bar.getAttribute("aria-valuenow"))).toBe(frozen);
  });
});
