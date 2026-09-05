import { test, expect } from "@playwright/test";
import { testEmail, signup as signupUser, login as loginUser, createChild } from "./helpers";

test.describe("Security — IDOR Protection", () => {
  test("unauthenticated user cannot access children API", async ({ page }) => {
    const response = await page.request.get("/api/children");
    expect(response.status()).toBe(401);
  });

  test("unauthenticated user cannot create child", async ({ page }) => {
    const response = await page.request.post("/api/children", {
      data: { displayName: "Test", birthYear: 2015, birthMonth: 6 },
    });
    expect(response.status()).toBe(401);
  });

  test("unauthenticated user cannot access assessments", async ({ page }) => {
    const response = await page.request.get("/api/assessments?childId=fake-id");
    expect(response.status()).toBe(401);
  });

  test("unauthenticated user cannot access training sessions", async ({ page }) => {
    const response = await page.request.get("/api/training/sessions?childId=fake-id");
    expect(response.status()).toBe(401);
  });

  test("unauthenticated user cannot access game runs", async ({ page }) => {
    const response = await page.request.get("/api/game-runs?childId=fake-id");
    expect(response.status()).toBe(401);
  });

  test("unauthenticated user cannot export data", async ({ page }) => {
    const response = await page.request.get("/api/data/export");
    expect(response.status()).toBe(401);
  });

  test("unauthenticated user cannot delete data", async ({ page }) => {
    const response = await page.request.post("/api/data/delete", {
      data: { childId: "fake-id", confirmDelete: true },
    });
    expect(response.status()).toBe(401);
  });
});

test.describe("Security — Authorization", () => {
  // Distinct suffixes: testEmail() is ms-timestamped, so two same-tick calls
  // would collide and the second signup would fail in beforeAll.
  const email1 = testEmail("sec-a");
  const email2 = testEmail("sec-b");
  let child1Id: string;
  let child2Id: string;

  test.beforeAll(async ({ browser }) => {
    // Create two users with children — ids come from createChild's response,
    // not the page URL (signup lands on /dashboard, not the child page).
    const page1 = await browser.newPage();
    await signupUser(page1, email1, "Password123!");
    child1Id = await createChild(page1, "Child1");
    await page1.close();

    const page2 = await browser.newPage();
    await signupUser(page2, email2, "Password123!");
    child2Id = await createChild(page2, "Child2");
    await page2.close();
  });

  test("user cannot access another user's child", async ({ page }) => {
    await loginUser(page, email1, "Password123!");

    // Try to access child2 (belongs to user2)
    const response = await page.request.get(`/api/children/${child2Id}`);
    expect(response.status()).toBe(403);
  });

  test("user cannot update another user's child", async ({ page }) => {
    await loginUser(page, email1, "Password123!");

    const response = await page.request.patch(`/api/children/${child2Id}`, {
      data: { displayName: "Hacked" },
    });
    expect(response.status()).toBe(403);
  });

  test("user cannot delete another user's child", async ({ page }) => {
    await loginUser(page, email1, "Password123!");

    const response = await page.request.delete(`/api/children/${child2Id}`);
    expect(response.status()).toBe(403);
  });

  test("user cannot access another user's assessments", async ({ page }) => {
    await loginUser(page, email1, "Password123!");

    const response = await page.request.get(`/api/assessments?childId=${child2Id}`);
    expect(response.status()).toBe(403);
  });

  test("user cannot create assessment for another user's child", async ({ page }) => {
    await loginUser(page, email1, "Password123!");

    const response = await page.request.post("/api/assessments", {
      data: { childId: child2Id, assessmentVersion: "mvp-1" },
    });
    expect(response.status()).toBe(403);
  });
});

test.describe("Security — Input Validation", () => {
  test("signup rejects invalid email", async ({ page }) => {
    const response = await page.request.post("/api/auth/signup", {
      data: { email: "not-an-email", password: "Password123!" },
    });
    expect(response.status()).toBe(400);
  });

  test("signup rejects weak password", async ({ page }) => {
    const response = await page.request.post("/api/auth/signup", {
      data: { email: testEmail(), password: "123" },
    });
    expect(response.status()).toBe(400);
  });

  test("login rejects missing fields", async ({ page }) => {
    const response = await page.request.post("/api/auth/login", {
      data: { email: testEmail() },
    });
    expect(response.status()).toBe(400);
  });

  test("create child rejects missing fields", async ({ page }) => {
    await signupUser(page, testEmail(), "Password123!");

    const response = await page.request.post("/api/children", {
      data: {},
    });
    expect(response.status()).toBe(400);
  });

  test("create child rejects invalid birth year", async ({ page }) => {
    const email = testEmail();
    await signupUser(page, email, "Password123!");

    const response = await page.request.post("/api/children", {
      data: { displayName: "Test", birthYear: 2030, birthMonth: 6 },
    });
    expect(response.status()).toBe(400);
  });
});

test.describe("Security — Data Export", () => {
  test("user can export their own data", async ({ page }) => {
    const email = testEmail();
    await signupUser(page, email, "Password123!");
    await createChild(page, "ExportTest");

    const response = await page.request.get("/api/data/export");
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.children).toBeDefined();
    expect(data.children.length).toBeGreaterThan(0);
  });
});

test.describe("Security — Data Deletion", () => {
  test("user can delete their own child data", async ({ page }) => {
    const email = testEmail();
    await signupUser(page, email, "Password123!");
    const childId = await createChild(page, "DeleteTest");

    // Delete requires confirmation
    const response = await page.request.post("/api/data/delete", {
      data: { childId, confirmDelete: true },
    });
    expect(response.status()).toBe(200);

    // Verify child is deleted
    const getResponse = await page.request.get(`/api/children/${childId}`);
    expect(getResponse.status()).toBe(404);
  });

  test("deletion requires confirmation", async ({ page }) => {
    const email = testEmail();
    await signupUser(page, email, "Password123!");
    const childId = await createChild(page, "NoDelete");

    const response = await page.request.post("/api/data/delete", {
      data: { childId, confirmDelete: false },
    });
    expect(response.status()).toBe(400);
  });
});
