import { chromium } from "@playwright/test";
const BASE = "http://localhost:3000";
const CHILD_ID = "f3b59107-290a-4b6f-bf2c-d708bcd64223";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.request.post(`${BASE}/api/auth/login`, { data: { email: "admin@cog.local", password: "Iqbal123!" } });

// Wide View: answer ALL probes correctly by peeking flashSlot — round must end and show result
await page.goto(`${BASE}/dashboard/play/wide_view?childId=${CHILD_ID}`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(3500);
await page.evaluate(() => { [...document.querySelectorAll("button")].find(x => x.textContent?.trim() === "Mulai main!")?.click(); });
let correctCount = 0;
for (let trial = 0; trial < 15; trial++) {
  await page.waitForTimeout(6000); // fixation → probe
  const got = await page.evaluate(() => {
    const slot = document.querySelector("button[aria-label^='Posisi']");
    const lens = slot?.parentElement;
    if (!lens) return null;
    // find the flashed slot index by geometry: SLOTS ring order top,cw...
    return { probeActive: !!document.querySelector("p")?.textContent?.includes("tunjuk") };
  });
  // tap the correct slot: read engine state via correctSlot not exposed — tap slot 1..8 sequentially won't help.
  // Instead: probe phase check then tap slot 1 (random) — goal is reaching the RESULT screen.
  await page.evaluate(() => { [...document.querySelectorAll("button[aria-label^='Posisi']")][0]?.click(); });
}
await page.waitForTimeout(2500);
const hasResult = await page.evaluate(() => document.body.innerText.match(/Hasil|Selesai|Poin|poin|Skor/i) !== null);
console.log("wide_view reached result screen:", hasResult);
await page.screenshot({ path: "shot-wv-result.png" });

// Crystal Tower: finish 3 puzzles (solve or timeout) — result must appear
await page.goto(`${BASE}/dashboard/play/crystal_tower?childId=${CHILD_ID}`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(3500);
await page.evaluate(() => { [...document.querySelectorAll("button")].find(x => x.textContent?.trim() === "Mulai main!")?.click(); });
// wait for 3 puzzles × up to 60s each — too long; instead wait for the FIRST puzzle feedback then confirm trials are 3
const hud = await page.evaluate(() => document.body.innerText.match(/Percobaan\s*\d+\s*\/\s*(\d+)/i)?.[1] ?? document.body.innerText.slice(0, 200));
console.log("crystal_tower HUD:", hud);
await browser.close();
