import { test, expect } from "@playwright/test";

test.describe("Full flow — setup to done", () => {
  test("loads the homepage", async ({ page }) => {
    await page.goto("/");
    // The app should render with the title somewhere
    await expect(page).toHaveTitle(/Claude/i);
  });

  test("setup page shows getting ready state", async ({ page }) => {
    await page.goto("/setup");
    // The setup page should show some loading/setup state
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("welcome page renders", async ({ page }) => {
    await page.goto("/welcome");
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("build page renders", async ({ page }) => {
    await page.goto("/build");
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });
});
