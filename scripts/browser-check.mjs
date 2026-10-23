import fs from "node:fs/promises";
import ts from "typescript";
import { chromium } from "playwright";
import { cases, hooks } from "./browser-adapter.mjs";
const source = (await fs.readFile("tests/browser/app.spec.ts", "utf8")).replace(
  "from '@playwright/test'",
  "from '../scripts/browser-adapter.mjs'",
);
await fs.mkdir("test-results", { recursive: true });
await fs.writeFile(
  "test-results/browser-spec.mjs",
  ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
    },
  }).outputText,
);
await import("../test-results/browser-spec.mjs");
const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
const results = [];
for (const spec of cases) {
  const context = await browser.newContext({
    baseURL: "http://127.0.0.1:5173",
    viewport: { width: 1440, height: 1050 },
    acceptDownloads: true,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const started = Date.now();
  try {
    for (const hook of hooks) await hook({ page });
    await spec.fn({ page });
    results.push({
      name: spec.name,
      status: "passed",
      milliseconds: Date.now() - started,
    });
    console.log("PASS", spec.name);
  } catch (e) {
    results.push({ name: spec.name, status: "failed", error: String(e) });
    console.log("FAIL", spec.name, String(e));
    await page.screenshot({
      path: "../../work/failure-" + results.length + ".png",
      fullPage: true,
    });
  } finally {
    await context.close();
  }
}
await fs.writeFile(
  "test-results/browser-results.json",
  JSON.stringify(results, null, 2),
);
await browser.close();
if (results.some((r) => r.status === "failed")) process.exitCode = 1;
