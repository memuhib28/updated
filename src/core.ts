import {
  type CheckIn,
  locations,
  descriptions,
  checkInSymptoms,
  impacts,
  contexts,
} from "./checkin-model";
export type Mode = "demo" | "personal";
export type Day = {
  id: string;
  date: string;
  headache: "yes" | "no" | "unsure";
  sleep: number | null;
  quality: string;
  meals: "yes" | "no" | "unknown";
  caffeine: number | null;
  exposures: string;
  notes: string;
  checkIn?: CheckIn;
  pressureHpa?: number | null;
};
export const symptoms = [
  "Nausea",
  "Vomiting",
  "Light sensitivity",
  "Sound sensitivity",
  "Self-reported aura-like symptoms",
] as const;
export type Attack = {
  id: string;
  start: string;
  end: string | null;
  pain: number;
  location: string;
  description: string;
  symptoms: string[];
  medication: string;
  dose: string;
  taken: string | null;
  notes: string;
};
export type Data = { days: Day[]; attacks: Attack[] };
export type Backup = { app: "MigraMap"; version: 1; mode: Mode; data: Data };
export const empty = (): Data => ({ days: [], attacks: [] });
export const zone = (mode: Mode) =>
  mode === "demo"
    ? "Asia/Karachi"
    : Intl.DateTimeFormat().resolvedOptions().timeZone;
export function dateKey(d: Date | string = new Date(), tz = zone("personal")) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(d));
  return ["year", "month", "day"]
    .map((t) => parts.find((p) => p.type === t)!.value)
    .join("-");
}
export function shiftDate(date: string, n: number) {
  const d = new Date(date + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export function validDate(s: unknown): s is string {
  return (
    typeof s === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(s) &&
    Number.isFinite(Date.parse(s)) &&
    new Date(s).toISOString().slice(0, 10) === s
  );
}
export function dates(from: string, to: string) {
  if (!validDate(from) || !validDate(to) || from > to)
    throw Error("Choose a valid date range.");
  const n = Math.round((Date.parse(to) - Date.parse(from)) / 86400000);
  if (n > 3660) throw Error("Choose a range of ten years or less.");
  return Array.from({ length: n + 1 }, (_, i) => shiftDate(from, i));
}
export function localTime(iso: string, mode: Mode) {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: zone(mode),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const v = (t: string) => p.find((x) => x.type === t)!.value;
  return `${v("year")}-${v("month")}-${v("day")}T${v("hour")}:${v("minute")}`;
}
export function toInstant(s: string, mode: Mode) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s) || !validDate(s.slice(0, 10)))
    throw Error("Invalid date or time.");
  const d = new Date(s + (mode === "demo" ? "+05:00" : ""));
  if (!Number.isFinite(+d) || localTime(d.toISOString(), mode) !== s)
    throw Error("Invalid local time (possibly a daylight-saving transition).");
  return d.toISOString();
}
function text(v: unknown) {
  return typeof v === "string" && v.length <= 10000;
}
function instant(v: unknown): v is string {
  return (
    typeof v === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/.test(v) &&
    validDate(v.slice(0, 10)) &&
    Number.isFinite(Date.parse(v)) &&
    new Date(v).toISOString().slice(0, 19) === v.slice(0, 19)
  );
}
export function validateDay(d: Day, today = dateKey(), now = new Date()) {
  if (!d || !text(d.id) || !d.id || !validDate(d.date) || d.date > today)
    throw Error("Enter a valid date that is not in the future.");
  if (
    !["yes", "no", "unsure"].includes(d.headache) ||
    !["yes", "no", "unknown"].includes(d.meals)
  )
    throw Error("Choose a headache status and meal response.");
  if (
    d.sleep !== null &&
    (typeof d.sleep !== "number" ||
      !Number.isFinite(d.sleep) ||
      d.sleep < 0 ||
      d.sleep > 24)
  )
    throw Error("Sleep must be between 0 and 24 hours.");
  if (
    d.caffeine !== null &&
    (typeof d.caffeine !== "number" ||
      !Number.isFinite(d.caffeine) ||
      d.caffeine < 0 ||
      d.caffeine > 10000)
  )
    throw Error("Enter caffeine in mg between 0 and 10000, or leave blank.");
  if (
    !["", "Poor", "Fair", "Good"].includes(d.quality) ||
    ![d.exposures, d.notes].every(text)
  )
    throw Error("Invalid daily fields.");
  if (d.pressureHpa !== undefined && d.pressureHpa !== null && (typeof d.pressureHpa !== "number" || !Number.isFinite(d.pressureHpa) || d.pressureHpa < 800 || d.pressureHpa > 1100)) throw Error("Pressure must be between 800 and 1100 hPa.");
  if (d.checkIn !== undefined) validateCheckIn(d.checkIn, d.headache, now);
}
export function validateCheckIn(
  q: CheckIn,
  headache: Day["headache"],
  now = new Date(),
) {
  if (
    !q ||
    q.version !== 1 ||
    typeof q.startUnknown !== "boolean" ||
    !["yes", "no", "unknown"].includes(q.ongoing) ||
    !["yes", "no", "unknown"].includes(q.medicine)
  )
    throw Error("Invalid check-in answers.");
  for (const v of [q.start, q.end, q.medicineTime])
    if (v !== null && (!instant(v) || Date.parse(v) > +now))
      throw Error("Check-in times must be valid and not in the future.");
  if (q.startUnknown && q.start !== null)
    throw Error("Unknown start time cannot contain a timestamp.");
  if (
    q.end !== null &&
    (q.ongoing !== "no" ||
      (q.start !== null && Date.parse(q.end) <= Date.parse(q.start)))
  )
    throw Error(
      "End must be after start and only recorded when pain has ended.",
    );
  if (
    q.peakPain !== null &&
    (typeof q.peakPain !== "number" ||
      !Number.isFinite(q.peakPain) ||
      q.peakPain < 0 ||
      q.peakPain > 10)
  )
    throw Error("Pain must be between 0 and 10.");
  if (
    !["", ...locations].includes(q.location as any) ||
    !["", ...descriptions].includes(q.description as any) ||
    !["", ...impacts].includes(q.impact as any)
  )
    throw Error("Invalid check-in answers.");
  for (const [values, allowed] of [
    [q.symptoms, checkInSymptoms],
    [q.context, contexts],
  ] as const)
    if (
      !Array.isArray(values) ||
      values.some((v) => !allowed.includes(v as never)) ||
      new Set(values).size !== values.length
    )
      throw Error("Invalid check-in choices.");
  if (
    (q.symptoms.includes("None") && q.symptoms.length > 1) ||
    (q.context.some((v) => ["Nothing noticed", "Unsure"].includes(v)) &&
      q.context.length > 1)
  )
    throw Error("None or unsure cannot be combined with other choices.");
  if (![q.symptomOther, q.contextOther, q.medicineName].every(text))
    throw Error("Invalid check-in text.");
  if (
    (!q.symptoms.includes("Other") && q.symptomOther) ||
    (!q.context.includes("Other") && q.contextOther)
  )
    throw Error("Other details require the Other choice.");
  if (q.medicine !== "yes" && (q.medicineName || q.medicineTime))
    throw Error("Medication details require a Yes response.");
  if (
    headache === "no" &&
    (q.start ||
      q.startUnknown ||
      q.end ||
      q.ongoing !== "unknown" ||
      q.peakPain !== null ||
      q.location ||
      q.description ||
      q.symptoms.length ||
      q.symptomOther ||
      q.impact ||
      q.medicine !== "unknown" ||
      q.medicineName ||
      q.medicineTime)
  )
    throw Error("Headache-free check-ins cannot contain episode answers.");
}
export function validateAttack(a: Attack, now = new Date()) {
  if (
    !a ||
    !text(a.id) ||
    !a.id ||
    !instant(a.start) ||
    Date.parse(a.start) > +now
  )
    throw Error("Start date/time is required and cannot be in the future.");
  if (
    a.end !== null &&
    (!instant(a.end) ||
      Date.parse(a.end) <= Date.parse(a.start) ||
      Date.parse(a.end) > +now)
  )
    throw Error("End must be after start and not in the future.");
  if (
    typeof a.pain !== "number" ||
    !Number.isFinite(a.pain) ||
    a.pain < 0 ||
    a.pain > 10
  )
    throw Error("Pain must be between 0 and 10.");
  if (
    !Array.isArray(a.symptoms) ||
    a.symptoms.some((s) => !symptoms.includes(s as any)) ||
    new Set(a.symptoms).size !== a.symptoms.length
  )
    throw Error("Invalid symptoms.");
  if (a.taken !== null && (!instant(a.taken) || Date.parse(a.taken) > +now))
    throw Error("Medication time is invalid or in the future.");
  if (![a.location, a.description, a.medication, a.dose, a.notes].every(text))
    throw Error("Invalid attack fields.");
}
export function overlap(a: Attack, b: Attack, now = new Date()) {
  return (
    a.id !== b.id &&
    Date.parse(a.start) < (b.end ? Date.parse(b.end) : +now) &&
    Date.parse(b.start) < (a.end ? Date.parse(a.end) : +now)
  );
}
export function status(data: Data, date: string, tz: string, now = new Date()) {
  const daily = data.days.find((d) => d.date === date);
  const attacks = data.attacks.filter(
    (a) =>
      dateKey(a.start, tz) <= date &&
      dateKey(a.end ? new Date(Date.parse(a.end) - 1) : now, tz) >= date,
  );
  return {
    daily,
    attacks,
    kind:
      attacks.length || daily?.headache === "yes"
        ? "headache"
        : daily?.headache === "no"
          ? "free"
          : daily
            ? "unsure"
            : "unrecorded",
    conflict: !!attacks.length && daily?.headache === "no",
  };
}
export function summarize(
  data: Data,
  from: string,
  to: string,
  tz: string,
  now = new Date(),
) {
  const all = dates(from, to).map((date) => ({
    date,
    ...status(data, date, tz, now),
  }));
  const attacks = data.attacks.filter(
    (a) =>
      dateKey(a.start, tz) <= to &&
      dateKey(a.end ? new Date(Date.parse(a.end) - 1) : now, tz) >= from,
  );
  const completed = attacks.filter((a) => a.end);
  const mean = (v: number[]) =>
    v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
  return {
    all,
    attacks,
    completed,
    recorded: all.filter((d) => d.kind !== "unrecorded").length,
    headache: all.filter((d) => d.kind === "headache").length,
    free: all.filter((d) => d.kind === "free").length,
    unsure: all.filter((d) => d.kind === "unsure").length,
    unrecorded: all.filter((d) => d.kind === "unrecorded").length,
    intensity: mean(attacks.map((a) => a.pain)),
    duration: mean(
      completed.map(
        (a) => (Date.parse(a.end!) - Date.parse(a.start)) / 3600000,
      ),
    ),
    conflicts: all.filter((d) => d.conflict).length,
  };
}
export const definitions =
  "Coverage counts unique local calendar days with a check-in or an overlapping attack. A reported attack takes precedence over a headache-free check-in; conflicts are flagged. Uncertain days count as recorded, but not headache-free. Attacks overlap [start, end); an attack ending exactly at midnight does not add the next day. Ongoing attacks extend to the current time. Day counts are clipped to the selected range. Attack counts and mean intensity include distinct attacks overlapping the range. Completed-duration mean uses the full duration of those completed attacks, not clipped fragments; ongoing attacks are excluded. Missing observations are not zero. Counts of observed events may be zero; means without observations are not available.";
export function validateBackup(
  raw: unknown,
  mode: Mode,
  now = new Date(),
): Backup {
  const b = raw as Backup;
  if (
    !b ||
    b.app !== "MigraMap" ||
    b.version !== 1 ||
    b.mode !== mode ||
    !b.data ||
    !Array.isArray(b.data.days) ||
    !Array.isArray(b.data.attacks)
  )
    throw Error(
      "Invalid backup, unsupported version, or different mode. Demo and personal backups cannot mix.",
    );
  if (b.data.days.length > 20000 || b.data.attacks.length > 50000)
    throw Error("Backup exceeds the supported size.");
  b.data.days.forEach((d) => validateDay(d, dateKey(now, zone(mode)), now));
  b.data.attacks.forEach((a) => validateAttack(a, now));
  if (
    new Set(b.data.days.map((d) => d.date)).size !== b.data.days.length ||
    new Set([...b.data.days, ...b.data.attacks].map((d) => d.id)).size !==
      b.data.days.length + b.data.attacks.length
  )
    throw Error("Duplicate dates or entry identifiers in backup.");
  return {
    app: "MigraMap",
    version: 1,
    mode,
    data: JSON.parse(JSON.stringify(b.data)),
  };
}
export function mergeData(current: Data, incoming: Data): Data {
  const days = [
    ...current.days.filter(
      (d) => !incoming.days.some((i) => i.date === d.date || i.id === d.id),
    ),
    ...incoming.days,
  ];
  const attacks = [
    ...current.attacks.filter(
      (a) => !incoming.attacks.some((i) => i.id === a.id),
    ),
    ...incoming.attacks,
  ];
  if (
    new Set([...days, ...attacks].map((d) => d.id)).size !==
    days.length + attacks.length
  )
    throw Error("Conflicting identifiers; merge cancelled.");
  return { days, attacks };
}
export function csvCell(v: unknown) {
  let s = String(v ?? "");
  if (/^[\s]*[=+@\-\t\r\n]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
}
export function csv(data: Data) {
  const rows: unknown[][] = [
    [
      "type",
      "id",
      "date_or_start",
      "end",
      "headache",
      "sleep_hours",
      "sleep_quality",
      "meals_skipped",
      "caffeine_mg",
      "possible_exposures",
      "pain_0_10",
      "location",
      "description",
      "symptoms",
      "medication",
      "dose_recorded",
      "time_taken",
      "notes",
      "checkin_start",
      "checkin_start_unknown",
      "checkin_ongoing",
      "checkin_end",
      "checkin_peak_pain",
      "checkin_location",
      "checkin_description",
      "checkin_symptoms",
      "checkin_symptoms_other",
      "checkin_activity_impact",
      "checkin_medicine_taken",
      "checkin_medicine_name",
      "checkin_medicine_time",
      "daily_context",
      "daily_context_other",
      "pressure_hpa",
    ],
  ];
  data.days.forEach((d) =>
    rows.push([
      "day",
      d.id,
      d.date,
      "",
      d.headache,
      d.sleep,
      d.quality,
      d.meals,
      d.caffeine,
      d.exposures,
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      d.notes,
      d.checkIn?.start,
      d.checkIn?.startUnknown,
      d.checkIn?.ongoing,
      d.checkIn?.end,
      d.checkIn?.peakPain,
      d.checkIn?.location,
      d.checkIn?.description,
      d.checkIn?.symptoms.join("; "),
      d.checkIn?.symptomOther,
      d.checkIn?.impact,
      d.checkIn?.medicine,
      d.checkIn?.medicineName,
      d.checkIn?.medicineTime,
      d.checkIn?.context.join("; "),
      d.checkIn?.contextOther,
      d.pressureHpa ?? "",
    ]),
  );
  data.attacks.forEach((a) =>
    rows.push([
      "attack",
      a.id,
      a.start,
      a.end ?? "ongoing",
      "",
      "",
      "",
      "",
      "",
      "",
      a.pain,
      a.location,
      a.description,
      a.symptoms.join("; "),
      a.medication,
      a.dose,
      a.taken,
      a.notes,
      ...Array(16).fill(""),
    ]),
  );
  return "\uFEFF" + rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
}
export function demoData(now = new Date()): Data {
  const today = dateKey(now, "Asia/Karachi");
  const data = empty();
  for (let i = 27; i >= 1; i--) {
    if ([4, 9, 18, 22].includes(i)) continue;
    const date = shiftDate(today, -i);
    const headache = [2, 5, 8, 12, 16, 20, 25].includes(i);
    data.days.push({
      id: "demo-day-" + i,
      date,
      headache: headache ? "yes" : "no",
      sleep: headache ? 6 : 7.5,
      quality: headache ? "Fair" : "Good",
      meals: i % 4 === 0 ? "yes" : "no",
      caffeine: 80,
      exposures: headache ? "Unusual routine (fictional)" : "",
      notes: "Fictional expo record",
    });
    if (headache)
      data.attacks.push({
        id: "demo-attack-" + i,
        start: date + "T09:00:00.000Z",
        end: date + "T13:00:00.000Z",
        pain: (i % 3) + 4,
        location: "One side",
        description: "Throbbing",
        symptoms: ["Light sensitivity", ...(i % 2 ? ["Nausea"] : [])],
        medication: "",
        dose: "",
        taken: null,
        notes: "Fictional expo attack",
      });
  }
  return data;
}
