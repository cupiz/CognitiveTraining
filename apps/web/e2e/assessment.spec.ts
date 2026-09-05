import { test, expect } from "@playwright/test";
import { testEmail, TEST_PASSWORD, signup } from "./helpers";

test.describe("Assessment Session Management", () => {
  let testUserEmail = "";
  let childId = "";

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    testUserEmail = testEmail("assessment");
    await signup(page, testUserEmail, TEST_PASSWORD);

    // Create a child via API (using page context — shares cookies)
    const childRes = await page.request.post("/api/children", {
      data: {
        displayName: "Test Child",
        birthYear: 2016,
        birthMonth: 6,
        locale: "en",
      },
    });
    expect(childRes.ok()).toBeTruthy();
    const childData = await childRes.json();
    childId = childData.data.id;

    // Grant consent
    await page.request.post(`/api/children/${childId}/consent`, {
      data: { consentType: "training", documentVersion: "2026-01" },
    });
    await page.request.post(`/api/children/${childId}/consent`, {
      data: { consentType: "assessment", documentVersion: "2026-01" },
    });

    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.waitForSelector('input[type="email"]', { timeout: 10_000 });
    await page.fill('input[type="email"]', testUserEmail);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    // Wait for navigation to dashboard OR stay on login (retry)
    try {
      await page.waitForURL("**/dashboard**", { timeout: 10_000 });
    } catch {
      // Retry once
      await page.goto("/login");
      await page.waitForSelector('input[type="email"]', { timeout: 10_000 });
      await page.fill('input[type="email"]', testUserEmail);
      await page.fill('input[type="password"]', TEST_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL("**/dashboard**", { timeout: 15_000 });
    }
  });

  test("can create an assessment via API", async ({ page }) => {
    const res = await page.request.post("/api/assessments", {
      data: { childId, assessmentVersion: "mvp-1" },
    });
    expect(res.ok()).toBeTruthy();

    const data = await res.json();
    expect(data.data.assessmentId).toBeTruthy();
    expect(data.data.blocks.length).toBe(5);
    expect(data.data.status).toBe("pending");

    const block = data.data.blocks[0];
    expect(block.domain).toBeTruthy();
    expect(block.gameKey).toBeTruthy();
    expect(block.gameVersion).toBeTruthy();
    expect(block.blockId).toBeTruthy();
  });

  test("prevents duplicate active assessments", async ({ page }) => {
    // Create and complete any existing active assessment first
    const listRes = await page.request.get(`/api/assessments?childId=${childId}`);
    const listData = await listRes.json();
    for (const a of listData.data.assessments) {
      if (a.status === "pending" || a.status === "in_progress") {
        await page.request.post(`/api/assessments/${a.id}/complete`);
      }
    }

    // Create first assessment
    const res1 = await page.request.post("/api/assessments", {
      data: { childId, assessmentVersion: "mvp-1" },
    });
    expect(res1.ok()).toBeTruthy();

    // Try to create second - should get 409
    const res2 = await page.request.post("/api/assessments", {
      data: { childId, assessmentVersion: "mvp-1" },
    });
    expect(res2.status()).toBe(409);
  });

  test("can list assessments", async ({ page }) => {
    const res = await page.request.get(`/api/assessments?childId=${childId}`);
    expect(res.ok()).toBeTruthy();

    const data = await res.json();
    expect(data.data.assessments).toBeDefined();
    expect(Array.isArray(data.data.assessments)).toBeTruthy();
  });

  test("can complete an assessment", async ({ page }) => {
    // Clean up any active assessments first
    const listRes = await page.request.get(`/api/assessments?childId=${childId}`);
    const listData = await listRes.json();
    for (const a of listData.data.assessments) {
      if (a.status === "pending" || a.status === "in_progress") {
        await page.request.post(`/api/assessments/${a.id}/complete`);
      }
    }

    const createRes = await page.request.post("/api/assessments", {
      data: { childId, assessmentVersion: "mvp-1" },
    });
    const createData = await createRes.json();
    const assessmentId = createData.data.assessmentId;

    const completeRes = await page.request.post(`/api/assessments/${assessmentId}/complete`);
    expect(completeRes.ok()).toBeTruthy();

    const completeData = await completeRes.json();
    expect(completeData.data.status).toBe("completed");
    expect(completeData.data.completedAt).toBeTruthy();
  });

  test("training session lifecycle", async ({ page }) => {
    const sessionRes = await page.request.post("/api/training/sessions", {
      data: { childId },
    });
    expect(sessionRes.ok()).toBeTruthy();
    const sessionData = await sessionRes.json();
    expect(sessionData.data.sessionId).toBeTruthy();
    expect(sessionData.data.status).toBe("pending");
    const sessionId = sessionData.data.sessionId;

    // Create game run
    const gameRunRes = await page.request.post("/api/game-runs", {
      data: {
        sessionId,
        gameKey: "memory_matrix",
        gameVersion: "1.0.0",
        configuration: { difficulty: 5 },
      },
    });
    expect(gameRunRes.ok()).toBeTruthy();
    const gameRunData = await gameRunRes.json();
    const gameRunId = gameRunData.data.id;
    expect(gameRunData.data.status).toBe("pending");

    // Start game run
    const startRes = await page.request.post(`/api/game-runs/${gameRunId}/start`);
    expect(startRes.ok()).toBeTruthy();
    const startData = await startRes.json();
    expect(startData.data.status).toBe("in_progress");

    // Finish game run
    const finishRes = await page.request.patch(`/api/game-runs/${gameRunId}/finish`, {
      data: { status: "completed" },
    });
    expect(finishRes.ok()).toBeTruthy();
    const finishData = await finishRes.json();
    expect(finishData.data.status).toBe("completed");

    // Complete training session
    const completeRes = await page.request.post(`/api/training/sessions/${sessionId}/complete`);
    expect(completeRes.ok()).toBeTruthy();
    const completeData = await completeRes.json();
    expect(completeData.data.status).toBe("completed");
  });

  test("game run state transitions are enforced", async ({ page }) => {
    const sessionRes = await page.request.post("/api/training/sessions", {
      data: { childId },
    });
    const sessionId = (await sessionRes.json()).data.sessionId;

    const gameRunRes = await page.request.post("/api/game-runs", {
      data: {
        sessionId,
        gameKey: "target_watch",
        gameVersion: "1.0.0",
        configuration: { difficulty: 3 },
      },
    });
    const gameRunId = (await gameRunRes.json()).data.id;

    // Can't finish a pending game run
    const finishRes = await page.request.patch(`/api/game-runs/${gameRunId}/finish`, {
      data: { status: "completed" },
    });
    expect(finishRes.status()).toBe(409);

    // Start it
    await page.request.post(`/api/game-runs/${gameRunId}/start`);

    // Can't start again
    const startAgainRes = await page.request.post(`/api/game-runs/${gameRunId}/start`);
    expect(startAgainRes.status()).toBe(409);

    // Finish it
    const finishRes2 = await page.request.patch(`/api/game-runs/${gameRunId}/finish`, {
      data: { status: "completed" },
    });
    expect(finishRes2.ok()).toBeTruthy();

    // Can't finish again
    const finishRes3 = await page.request.patch(`/api/game-runs/${gameRunId}/finish`, {
      data: { status: "completed" },
    });
    expect(finishRes3.status()).toBe(409);
  });
});
