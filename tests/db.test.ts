import "fake-indexeddb/auto";
import { describe, it, expect } from "vitest";
import { readData, writeData } from "../src/db";
import { empty, demoData } from "../src/core";
describe("IndexedDB persistence and isolation", () => {
  it("persists data across database reopen and keeps mode stores separate", async () => {
    await writeData("personal", empty());
    const demo = demoData();
    await writeData("demo", demo);
    expect((await readData("personal")).days).toHaveLength(0);
    expect((await readData("demo")).days.length).toBeGreaterThan(0);
    const personal = {
      days: [{ ...demo.days[0], id: "personal-1", notes: "Personal fixture" }],
      attacks: [],
    };
    await writeData("personal", personal);
    expect(await readData("personal")).toEqual(personal);
    expect((await readData("demo")).days[0].notes).toBe(
      "Fictional expo record",
    );
    await writeData("demo", empty());
    expect(await readData("personal")).toEqual(personal);
    await writeData("personal", empty());
    expect(await readData("personal")).toEqual(empty());
  });
});
