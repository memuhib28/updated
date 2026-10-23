import { test, expect } from "@playwright/test";
test("guided headache-free entry, home logos and no demo", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Let’s get to know your days" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Get started", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "No", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "How many hours did you sleep last night?",
    }),
  ).toBeVisible();
  await page.getByLabel("Sleep duration (hours)").fill("8");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "No", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByRole("button", { name: "Skip this question", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Skip this question", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Save and finish", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Dashboard" }),
  ).toBeVisible();
  await expect(page.getByText("Expo Demo", { exact: true })).toHaveCount(0);
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Learn About Migraine", exact: true })
    .click();
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "MigraMap home", exact: true })
    .click();
  await expect(page.locator("h1")).toHaveText("Dashboard");
  await page.reload();
  await expect(page.locator("h1")).toHaveText("Dashboard");
});
test("mobile onboarding fits and supports RTL", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "اردو", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator(".onboarding")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.getByRole("button", { name: "English", exact: true }).click();
  await page
    .getByRole("button", { name: "MigraMap home", exact: true })
    .click();
  await page
    .locator(".bottom-nav")
    .getByRole("button", { name: "Calendar", exact: true })
    .click();
  await page
    .locator(".topbar")
    .getByRole("button", { name: "MigraMap home", exact: true })
    .click();
  await expect(page.locator("h1")).toHaveText("Dashboard");
});
