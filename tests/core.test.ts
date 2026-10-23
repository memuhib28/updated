import { describe, it, expect } from "vitest";
import {
  type Attack,
  type Day,
  csv,
  csvCell,
  dateKey,
  dates,
  demoData,
  empty,
  localTime,
  mergeData,
  overlap,
  shiftDate,
  status,
  summarize,
  toInstant,
  validateAttack,
  validateBackup,
  validateDay,
} from "../src/core";
const now = new Date("2026-10-16T12:00:00Z");
const tz = "Asia/Karachi";
const day = (patch: Partial<Day> = {}): Day => ({
  id: "day1",
  date: "2026-10-10",
  headache: "no",
  sleep: null,
  quality: "",
  meals: "unknown",
  caffeine: null,
  exposures: "",
  notes: "",
  ...patch,
});
const attack = (patch: Partial<Attack> = {}): Attack => ({
  id: "a1",
  start: "2026-10-10T18:00:00.000Z",
  end: "2026-10-10T21:00:00.000Z",
  pain: 6,
  location: "",
  description: "",
  symptoms: [],
  medication: "",
  dose: "",
  taken: null,
  notes: "",
  ...patch,
});
describe("calendar and timezone boundaries", () => {
  it("uses Karachi dates and converts time without device-zone dependence", () => {
    expect(dateKey("2026-10-10T20:00:00Z", tz)).toBe("2026-10-11");
    expect(toInstant("2026-10-11T01:00", "demo")).toBe(
      "2026-10-10T20:00:00.000Z",
    );
    expect(localTime("2026-10-10T20:00:00Z", "demo")).toBe("2026-10-11T01:00");
  });
  it("handles leap years and rejects invalid dates", () => {
    expect(shiftDate("2024-02-28", 1)).toBe("2024-02-29");
    expect(dates("2024-02-28", "2024-03-01")).toHaveLength(3);
    expect(() => dates("2025-02-29", "2025-03-01")).toThrow();
    expect(() => toInstant("2026-02-30T12:00", "demo")).toThrow();
    expect(() => toInstant("2026-10-10T24:30", "demo")).toThrow();
  });
  it("rejects reversed and excessively large ranges", () => {
    expect(() => dates("2026-10-12", "2026-10-10")).toThrow();
    expect(() => dates("2000-01-01", "2026-01-01")).toThrow();
  });
});
describe("recorded-day semantics", () => {
  it("counts separate attacks without duplicating headache days", () => {
    const data = {
      days: [],
      attacks: [
        attack({ end: "2026-10-10T18:30:00.000Z" }),
        attack({
          id: "a2",
          start: "2026-10-10T18:40:00.000Z",
          end: "2026-10-10T18:50:00.000Z",
        }),
      ],
    };
    const s = summarize(data, "2026-10-10", "2026-10-11", tz, now);
    expect(s.headache).toBe(1);
    expect(s.attacks).toHaveLength(2);
    expect(s.unrecorded).toBe(1);
  });
  it("counts overnight attacks on both days", () => {
    const s = summarize(
      { days: [], attacks: [attack()] },
      "2026-10-10",
      "2026-10-11",
      tz,
      now,
    );
    expect(s.headache).toBe(2);
    expect(s.duration).toBe(3);
  });
  it("does not add midnight end day and clips days but not full duration", () => {
    const a = attack({ end: "2026-10-11T19:00:00.000Z" });
    const data = { days: [], attacks: [a] };
    expect(status(data, "2026-10-12", tz, now).kind).toBe("unrecorded");
    const s = summarize(data, "2026-10-11", "2026-10-12", tz, now);
    expect(s.headache).toBe(1);
    expect(s.duration).toBe(25);
  });
  it("keeps missing and uncertain distinct from headache-free", () => {
    const data = {
      days: [day(), day({ id: "d2", date: "2026-10-11", headache: "unsure" })],
      attacks: [],
    };
    const s = summarize(data, "2026-10-10", "2026-10-12", tz, now);
    expect(s.recorded).toBe(2);
    expect(s.free).toBe(1);
    expect(s.unsure).toBe(1);
    expect(s.unrecorded).toBe(1);
    expect(s.intensity).toBeNull();
    expect(s.duration).toBeNull();
  });
  it("gives overlapping attacks priority and flags conflicts", () => {
    const s = summarize(
      { days: [day()], attacks: [attack()] },
      "2026-10-10",
      "2026-10-11",
      tz,
      now,
    );
    expect(s.free).toBe(0);
    expect(s.headache).toBe(2);
    expect(s.conflicts).toBe(1);
  });
  it("ongoing attacks extend only to now and are excluded from duration", () => {
    const s = summarize(
      { days: [], attacks: [attack({ end: null })] },
      "2026-10-10",
      "2026-10-16",
      tz,
      now,
    );
    expect(s.headache).toBe(7);
    expect(s.duration).toBeNull();
    expect(s.completed).toHaveLength(0);
  });
  it("returns unavailable means on empty data, observed counts zero", () => {
    const s = summarize(empty(), "2026-10-10", "2026-10-16", tz, now);
    expect(s.recorded).toBe(0);
    expect(s.unrecorded).toBe(7);
    expect(s.intensity).toBeNull();
    expect(s.duration).toBeNull();
  });
  it("updates calculations after edits and deletes", () => {
    const data = { days: [day()], attacks: [attack()] };
    expect(summarize(data, "2026-10-10", "2026-10-11", tz, now).intensity).toBe(
      6,
    );
    data.attacks[0].pain = 2;
    expect(summarize(data, "2026-10-10", "2026-10-11", tz, now).intensity).toBe(
      2,
    );
    data.attacks = [];
    expect(summarize(data, "2026-10-10", "2026-10-11", tz, now).free).toBe(1);
  });
});
describe("validation and overlap", () => {
  it("requires valid dates, statuses, and numeric ranges", () => {
    for (const patch of [
      { date: "2026-10-17" },
      { sleep: 25 },
      { sleep: NaN },
      { caffeine: -1 },
      { headache: "bogus" },
    ])
      expect(() =>
        validateDay(day(patch as Partial<Day>), "2026-10-16"),
      ).toThrow();
    expect(() => validateDay(day(), "2026-10-16")).not.toThrow();
  });
  it("rejects future events, bad ordering, scores and invalid symptoms", () => {
    for (const patch of [
      { start: "2026-10-17T12:00:00.000Z" },
      { end: "2026-10-10T17:00:00.000Z" },
      { pain: 11 },
      { pain: NaN },
      { symptoms: ["Diagnosis"] },
      { taken: "2026-10-17T12:00:00.000Z" },
      { start: "2026-02-30T12:00:00.000Z" },
      { notes: 12 },
    ])
      expect(() =>
        validateAttack(attack(patch as Partial<Attack>), now),
      ).toThrow();
    expect(() =>
      validateAttack(attack({ end: null, pain: 0 }), now),
    ).not.toThrow();
  });
  it("warns for overlapping distinct records, not adjacent or same IDs", () => {
    expect(overlap(attack(), attack({ id: "a2" }), now)).toBe(true);
    expect(overlap(attack(), attack(), now)).toBe(false);
    expect(
      overlap(
        attack(),
        attack({ id: "a2", start: "2026-10-10T21:00:00.000Z", end: null }),
        now,
      ),
    ).toBe(false);
  });
});
describe("backup and CSV", () => {
  const backup = () => ({
    app: "MigraMap",
    version: 1,
    mode: "demo",
    data: { days: [day()], attacks: [attack()] },
  });
  it("roundtrips validated backups and rejects cross-mode, bad version and shape", () => {
    expect(
      validateBackup(JSON.parse(JSON.stringify(backup())), "demo", now).data
        .days,
    ).toHaveLength(1);
    expect(() => validateBackup(backup(), "personal", now)).toThrow();
    expect(() =>
      validateBackup({ ...backup(), version: 2 }, "demo", now),
    ).toThrow();
    expect(() => validateBackup({ app: "MigraMap" }, "demo", now)).toThrow();
  });
  it("rejects duplicate days and IDs before mutation", () => {
    const b = backup();
    b.data.days.push(day({ id: "day2" }));
    expect(() => validateBackup(b, "demo", now)).toThrow();
    const c = backup();
    c.data.attacks[0].id = "day1";
    expect(() => validateBackup(c, "demo", now)).toThrow();
  });
  it("merges incoming days by date and attacks by ID without mutating input", () => {
    const original = { days: [day()], attacks: [attack()] };
    const merged = mergeData(original, {
      days: [day({ id: "new-id", headache: "yes" })],
      attacks: [attack({ pain: 2 })],
    });
    expect(merged.days).toHaveLength(1);
    expect(merged.days[0].headache).toBe("yes");
    expect(merged.attacks[0].pain).toBe(2);
    expect(original.days[0].headache).toBe("no");
  });
  it("escapes formula prefixes, whitespace, quotes and newlines", () => {
    expect(csvCell("=SUM(A1)")).toBe('"\'=SUM(A1)"');
    expect(csvCell("  +cmd")).toBe('"\'  +cmd"');
    expect(csvCell('a,"b"')).toBe('"a,""b"""');
    expect(csvCell("\n@cmd")).toBe('"\'\n@cmd"');
    const out = csv({
      days: [day({ notes: "=1+1", sleep: null })],
      attacks: [attack({ end: null })],
    });
    expect(out).toContain('"\'=1+1"');
    expect(out).toContain('"ongoing"');
    expect(out).toContain('"sleep_hours"');
  });
  it("builds only valid fictional sample entries", () => {
    const d = demoData(now);
    d.days.forEach((x) => validateDay(x, "2026-10-16"));
    d.attacks.forEach((x) => validateAttack(x, now));
    expect(d.days.every((x) => x.notes.includes("Fictional"))).toBe(true);
  });
});
import {
  newCheckIn,
  clearEpisode,
  toggleExclusive,
} from "../src/checkin-model";
import { validateCheckIn } from "../src/core";
describe("non-diagnostic questionnaire integrity", () => {
  it("accepts skipped answers and zero pain without requiring a diagnosis", () => {
    expect(() => validateCheckIn(newCheckIn(), "unsure", now)).not.toThrow();
    expect(() =>
      validateCheckIn({ ...newCheckIn(), peakPain: 0 }, "yes", now),
    ).not.toThrow();
  });
  it("clears episode answers for a headache-free day but preserves context", () => {
    const q = clearEpisode({
      ...newCheckIn(),
      peakPain: 7,
      medicine: "yes",
      medicineName: "Fictional",
      context: ["Sleep change"],
    });
    expect(q.peakPain).toBe(null);
    expect(q.context).toEqual(["Sleep change"]);
    expect(() => validateCheckIn(q, "no", now)).not.toThrow();
    expect(() => validateCheckIn({ ...q, peakPain: 0 }, "no", now)).toThrow();
  });
  it("prevents contradictory choices and unknown timestamps", () => {
    expect(toggleExclusive(["Nausea"], "None", ["None"])).toEqual(["None"]);
    expect(toggleExclusive(["None"], "Vomiting", ["None"])).toEqual([
      "Vomiting",
    ]);
    expect(() =>
      validateCheckIn(
        { ...newCheckIn(), symptoms: ["None", "Nausea"] },
        "yes",
        now,
      ),
    ).toThrow();
    expect(() =>
      validateCheckIn(
        { ...newCheckIn(), startUnknown: true, start: now.toISOString() },
        "yes",
        now,
      ),
    ).toThrow();
  });
  it("validates chronology, future dates and medication details", () => {
    expect(() =>
      validateCheckIn(
        {
          ...newCheckIn(),
          ongoing: "no",
          start: "2026-10-10T13:00:00Z",
          end: "2026-10-10T12:00:00Z",
        },
        "yes",
        now,
      ),
    ).toThrow();
    expect(() =>
      validateCheckIn({ ...newCheckIn(), medicineName: "X" }, "yes", now),
    ).toThrow();
    expect(() =>
      validateCheckIn(
        { ...newCheckIn(), start: "2027-01-01T12:00:00Z" },
        "yes",
        now,
      ),
    ).toThrow();
  });
  it("roundtrips optional answers through backups and includes them in CSV", () => {
    const d = day({
      headache: "yes",
      checkIn: {
        ...newCheckIn(),
        peakPain: 0,
        startUnknown: true,
        context: ["Bright light"],
      },
    });
    const raw = JSON.stringify({
      app: "MigraMap",
      version: 1,
      mode: "personal",
      data: { days: [d], attacks: [] },
    });
    expect(validateBackup(JSON.parse(raw), "personal", now).data.days[0].checkIn?.peakPain).toBe(
      0,
    );
    expect(csv({ days: [d], attacks: [] })).toContain("Bright light");
  });
});
