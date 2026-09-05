import { test, expect } from "@playwright/test";
import { signup, testEmail, signupWithChild } from "./helpers";

/** Every game shows a how-to screen first; tap "Mulai main!" to start the round. */
async function startArena(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Mulai main!" }).click();
}

/** Per-game marker proving the arena booted into real game UI. */
const GAMES = [
  { key: "memory_matrix", marker: "Ingat ubin yang menyala" },
  { key: "target_watch", marker: "Ketuk saat melihat" },
  { key: "quick_match", marker: "Temukan pasangannya" },
  { key: "stop_signal", marker: "Ketuk arah panah" },
  { key: "rule_switch", marker: '[aria-label="Pilihan 1"]' },
  { key: "spice_stall", marker: "Ingat pesanan pelanggan" },
  { key: "red_light", marker: "Lampu Merah" },
  { key: "courier_map", marker: "Antar paket ke bendera" },
  { key: "lighthouse_keeper", marker: "Penjaga Mercusuar" },
  { key: "sushi_express", marker: "Sushi Express" },
  { key: "crystal_palace", marker: "Temukan semua kristal yang cocok" },
  { key: "train_n_back", marker: "Bunyikan lonceng" },
  { key: "dual_garden", marker: "Misi:" },
  { key: "crystal_tower", marker: "antar semua kristal ke menara kanan" },
  { key: "wide_view", marker: "posisi burung yang berkedip" },
];

test.describe("Game availability", () => {
  for (const game of GAMES) {
    test(`${game.key} boots into game UI`, async ({ page }) => {
      const childId = await signupWithChild(page, `game-${game.key}`);
      await page.goto(`/dashboard/play/${game.key}?childId=${childId}`);
      await startArena(page);

      const marker =
        game.marker.startsWith("[") || game.marker.startsWith(".")
          ? page.locator(game.marker)
          : page.getByText(game.marker).first();
      await expect(marker).toBeVisible({ timeout: 20_000 });
      // Score header proves the trial HUD rendered, not an error card.
      await expect(page.getByText("poin").first()).toBeVisible({ timeout: 10_000 });
    });
  }
});

test.describe("Spice Stall trial", () => {
  test("order → recall → tap → feedback", async ({ page }) => {
    await signup(page, testEmail("spice-trial"));
    const { createChild } = await import("./helpers");
    const childId = await createChild(page);
    await page.goto(`/dashboard/play/spice_stall?childId=${childId}`);
    await startArena(page);

    await expect(
      page.getByText("Ingat pesanan pelanggan").first(),
    ).toBeVisible({ timeout: 20_000 });
    await expect(
      page.getByText("Racik dengan urutan yang sama").first(),
    ).toBeVisible({ timeout: 15_000 });

    const tiles = page.locator('[aria-label^="Bahan "]');
    const n = Math.min(await tiles.count(), 4);
    expect(n).toBeGreaterThan(0);
    for (let i = 0; i < n; i++) {
      await tiles.nth(i).click();
    }
    await expect(
      page.getByText(/Pelanggan senang|Belum pas/).first(),
    ).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("Game navigation", () => {
  test("can navigate to each game from URL", async ({ page }) => {
    // 11 games × (goto + how-to + marker) comfortably exceeds the 60s default.
    test.setTimeout(240_000);
    await signup(page, testEmail("nav-e2e"));
    const { createChild } = await import("./helpers");
    const childId = await createChild(page);

    for (const game of GAMES) {
      await page.goto(`/dashboard/play/${game.key}?childId=${childId}`);
      await startArena(page);
      const marker =
        game.marker.startsWith("[") || game.marker.startsWith(".")
          ? page.locator(game.marker)
          : page.getByText(game.marker).first();
      await expect(marker).toBeVisible({ timeout: 20_000 });
    }
  });

  test("unauthenticated user redirected from game page", async ({ page }) => {
    await page.goto("/dashboard/play/memory_matrix");
    await page.waitForURL("**/login**", { timeout: 5_000 });
    expect(page.url()).toContain("/login");
  });

  test("all 6 games are available in the game registry", async ({ page }) => {
    await signup(page, testEmail("registry-e2e"));
    const { createChild } = await import("./helpers");
    const childId = await createChild(page);

    for (const game of GAMES) {
      await page.goto(`/dashboard/play/${game.key}?childId=${childId}`);
      const body = await page.textContent("body");
      expect(body).not.toContain("belum tersedia");
    }
  });
});
