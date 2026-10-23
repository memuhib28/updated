// Allows the same unit specifications to run without Vitest worker subprocesses.
import assert from "node:assert/strict";
export { describe, it } from "node:test";
export function expect(actual: unknown) {
  const api = {
    toBe: (v: unknown) => assert.equal(actual, v),
    toEqual: (v: unknown) => assert.deepEqual(actual, v),
    toHaveLength: (n: number) => assert.equal((actual as any).length, n),
    toBeNull: () => assert.equal(actual, null),
    toBeGreaterThan: (n: number) => assert.ok((actual as number) > n),
    toContain: (v: unknown) => assert.ok((actual as any).includes(v)),
    toThrow: () => assert.throws(actual as () => void),
    not: { toThrow: () => assert.doesNotThrow(actual as () => void) },
  };
  return api;
}
