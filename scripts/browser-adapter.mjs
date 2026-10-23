// Executes the Playwright specs against an already-running local Chrome via CDP.
// This avoids worker/stdio pipe restrictions in the build environment.
export { expect } from "@playwright/test";
export const cases = [];
export const hooks = [];
export function test(name, fn) {
  cases.push({ name, fn });
}
test.beforeEach = (fn) => hooks.push(fn);
