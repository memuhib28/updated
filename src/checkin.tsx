import { useId, useState, type ReactNode } from "react";
import {
  Brain,
  CheckCircle2,
  ClipboardList,
  LockKeyhole,
  Moon,
  Sun,
} from "lucide-react";
import {
  type Data,
  type Day,
  type Mode,
  dateKey,
  localTime,
  toInstant,
  validateDay,
  zone,
} from "./core";
import {
  type CheckIn,
  newCheckIn,
  clearEpisode,
  contexts,
  descriptions,
  locations,
  impacts,
  checkInSymptoms,
  toggleExclusive,
} from "./checkin-model";
import { Card, Field, Notice, ArrowRight } from "./components";
import { useT, useErrorText } from "./i18n";
export const checkInUr: Record<string, string> = {
  "One side": "ایک طرف",
  "Both sides": "دونوں طرف",
  "Around the eye": "آنکھ کے آس پاس",
  "Other place": "دوسری جگہ",
  Unsure: "یقین نہیں",
  Throbbing: "دھڑکتا ہوا",
  "Pressure or tightness": "دباؤ یا کھنچاؤ",
  Stabbing: "چبھتا ہوا",
  Other: "کچھ اور",
  Nausea: "متلی",
  Vomiting: "قے",
  "Light sensitivity": "روشنی سے تکلیف",
  "Sound sensitivity": "آواز سے تکلیف",
  None: "کوئی نہیں",
  "Not at all": "بالکل نہیں",
  "Activities were difficult": "کام مشکل ہوا",
  "Had to stop some activities": "کچھ کام روکنے پڑے",
  "Could not do activities": "کام نہیں کر سکا/سکی",
  "Sleep change": "نیند میں تبدیلی",
  "Missed meal": "کھانا چھوڑنا",
  "Bright light": "تیز روشنی",
  "Strong smell": "تیز خوشبو",
  "Caffeine change": "کیفین میں تبدیلی",
  "Menstrual period": "ماہواری (اختیاری)",
  "Nothing noticed": "کچھ محسوس نہیں ہوا",
};
export function BrainMark({ large = false }: { large?: boolean }) {
  return (
    <span className={"brain-mark " + (large ? "large" : "")} aria-hidden="true">
      <Brain strokeWidth={1.25} />
      <svg viewBox="0 0 100 80" className="brain-dots">
        <path
          d="M22 48C36 35 42 29 53 41S69 57 81 37"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3"
        />
        {[
          [22, 48],
          [42, 36],
          [64, 48],
          [81, 37],
        ].map(([cx, cy], i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r="3.5"
            fill={i === 1 ? "#168F94" : "#E99888"}
          />
        ))}
      </svg>
    </span>
  );
}
function Radios({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (s: string) => void;
}) {
  const id = useId();
  return (
    <fieldset className="question-options">
      <legend>{label}</legend>
      <div className="choice-row">
        {options.map((o) => (
          <label
            key={o.value}
            className={"choice " + (value === o.value ? "is-selected" : "")}
          >
            <input
              type="radio"
              name={id}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
            />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
function Section({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="question-section">
      <h2>
        <span className="section-number">{number}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}
export function CheckInForm({
  data,
  mode,
  entry,
  date,
  onSave,
  onDone,
  onSummary,
}: {
  data: Data;
  mode: Mode;
  entry?: Day;
  date?: string;
  onSave: (d: Data) => Promise<void>;
  onDone: () => void;
  onSummary: () => void;
}) {
  const t = useT(),
    errorText = useErrorText();
  const [d, setD] = useState<Day>(
    () =>
      entry ?? {
        id: crypto.randomUUID(),
        date: date ?? dateKey(new Date(), zone(mode)),
        headache: "unsure",
        sleep: null,
        quality: "",
        meals: "unknown",
        caffeine: null,
        exposures: "",
        notes: "",
      },
  );
  const [q, setQ] = useState<CheckIn>(() => entry?.checkIn ?? newCheckIn());
  const [start, setStart] = useState(() =>
    q.start ? localTime(q.start, mode) : "",
  );
  const [end, setEnd] = useState(() => (q.end ? localTime(q.end, mode) : ""));
  const [medicineTime, setMedicineTime] = useState(() =>
    q.medicineTime ? localTime(q.medicineTime, mode) : "",
  );
  const [busy, setBusy] = useState(false),
    [saved, setSaved] = useState(false),
    [error, setError] = useState("");
  const day = <K extends keyof Day>(k: K, v: Day[K]) =>
    setD((old) => ({ ...old, [k]: v }));
  const answer = <K extends keyof CheckIn>(k: K, v: CheckIn[K]) =>
    setQ((old) => ({ ...old, [k]: v }));
  const optional = t("Not recorded / skip", "درج نہیں / چھوڑ دیں");
  const yesNo = [
    { value: "yes", label: t("Yes", "ہاں") },
    { value: "no", label: t("No", "نہیں") },
    { value: "unknown", label: optional },
  ];
  const choices = (
    label: string,
    key: "location" | "description" | "impact",
    list: readonly string[],
  ) => (
    <Field label={label}>
      <select value={q[key]} onChange={(e) => answer(key, e.target.value)}>
        <option value="">{optional}</option>
        {list.map((v) => (
          <option value={v} key={v}>
            {t(v, checkInUr[v])}
          </option>
        ))}
      </select>
    </Field>
  );
  if (saved)
    return (
      <Card className="checkin-success">
        <CheckCircle2 size={52} />
        <h2>{t("Your entry is saved.", "آپ کا اندراج محفوظ ہوگیا۔")}</h2>
        <p>
          {t(
            "Your entry is saved. View your diary or prepare a summary for your healthcare professional.",
            "آپ کا اندراج محفوظ ہوگیا۔ اپنی ڈائری دیکھیں یا ماہر صحت کے لیے خلاصہ تیار کریں۔",
          )}
        </p>
        <div className="row wrap">
          <button className="primary" onClick={onDone}>
            {t("View your diary", "اپنی ڈائری دیکھیں")}
            <ArrowRight size={18} />
          </button>
          <button onClick={onSummary}>
            {t("Prepare a summary", "خلاصہ تیار کریں")}
          </button>
          <button className="text-button" onClick={() => setSaved(false)}>
            {t("Edit this check-in", "اس اندراج میں ترمیم کریں")}
          </button>
        </div>
      </Card>
    );
  return (
    <div className="checkin-layout">
      <form
        className="checkin-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          try {
            let record: CheckIn =
              d.headache === "no"
                ? clearEpisode(q)
                : {
                    ...q,
                    start:
                      q.startUnknown || !start ? null : toInstant(start, mode),
                    end:
                      q.ongoing === "no" && end ? toInstant(end, mode) : null,
                    medicineName: q.medicine === "yes" ? q.medicineName : "",
                    medicineTime:
                      q.medicine === "yes" && medicineTime
                        ? toInstant(medicineTime, mode)
                        : null,
                    symptomOther: q.symptoms.includes("Other")
                      ? q.symptomOther
                      : "",
                  };
            record = {
              ...record,
              contextOther: record.context.includes("Other")
                ? record.contextOther
                : "",
            };
            const next = { ...d, checkIn: record };
            validateDay(next, dateKey(new Date(), zone(mode)));
            if (record.start && dateKey(record.start, zone(mode)) > d.date)
              throw Error(
                t(
                  "The episode cannot start after the date being recorded.",
                  "دورہ درج کردہ تاریخ کے بعد شروع نہیں ہوسکتا۔",
                ),
              );
            if (
              record.end &&
              dateKey(new Date(Date.parse(record.end) - 1), zone(mode)) < d.date
            )
              throw Error(
                t(
                  "The episode ended before this record date. Review the date or episode times.",
                  "دورہ اس تاریخ سے پہلے ختم ہوا تھا۔ تاریخ یا دورے کا وقت دیکھیں۔",
                ),
              );
            if (data.days.some((x) => x.date === d.date && x.id !== d.id))
              throw Error(
                t(
                  "A check-in already exists for this date. Edit it in your diary.",
                  "اس تاریخ کا اندراج موجود ہے۔ ڈائری میں اس کی ترمیم کریں۔",
                ),
              );
            setBusy(true);
            await onSave({
              ...data,
              days: [...data.days.filter((x) => x.id !== d.id), next],
            });
            setQ(record);
            setStart(record.start ? localTime(record.start, mode) : "");
            setEnd(record.end ? localTime(record.end, mode) : "");
            setMedicineTime(
              record.medicineTime ? localTime(record.medicineTime, mode) : "",
            );
            setSaved(true);
          } catch (err) {
            setError(errorText((err as Error).message));
          } finally {
            setBusy(false);
          }
        }}
      >
        <p className="checkin-opening">
          {t(
            "Record today's experience. This questionnaire does not diagnose. You can skip optional questions.",
            "اپنا آج کا تجربہ درج کریں۔ یہ سوالنامہ تشخیص نہیں کرتا۔ آپ اختیاری سوالات چھوڑ سکتے ہیں۔",
          )}
        </p>
        <Section number="1" title={t("Your day", "آپ کا دن")}>
          <Field
            label={t(
              "Which date are you recording? *",
              "آپ کس تاریخ کا ریکارڈ درج کر رہے ہیں؟ *",
            )}
          >
            <input
              required
              type="date"
              max={dateKey(new Date(), zone(mode))}
              value={d.date}
              onChange={(e) => day("date", e.target.value)}
            />
          </Field>
          <Radios
            label={t(
              "Did you have a headache today? *",
              "کیا آج آپ کو سر درد ہوا؟ *",
            )}
            value={d.headache}
            onChange={(v) => day("headache", v as Day["headache"])}
            options={[
              { value: "yes", label: t("Yes", "ہاں") },
              { value: "no", label: t("No", "نہیں") },
              { value: "unsure", label: t("Not sure", "پتا نہیں") },
            ]}
          />
          {d.headache === "no" && (
            <p className="branch-note">
              <CheckCircle2 size={17} />
              {t(
                "A headache-free day counts too. Continue with sleep, meals and your notes. Episode answers will not be saved.",
                "سر درد سے پاک دن بھی اہم ہے۔ نیند، کھانے اور نوٹس درج کریں۔ دورے کے جوابات محفوظ نہیں ہوں گے۔",
              )}
            </p>
          )}
        </Section>
        {d.headache !== "no" && (
          <Section
            number="2"
            title={t(
              "Your headache experience (optional)",
              "سر درد کی کیفیت (اختیاری)",
            )}
          >
            <p className="muted">
              {t(
                "No previous migraine diagnosis is needed. Share only what you remember.",
                "مائیگرین کی پہلے سے تشخیص ضروری نہیں۔ صرف وہ درج کریں جو یاد ہو۔",
              )}
            </p>
            <div className="form-grid">
              <Field
                label={t("When did the headache start?", "سر درد کب شروع ہوا؟")}
              >
                <input
                  type="datetime-local"
                  disabled={q.startUnknown}
                  value={q.startUnknown ? "" : start}
                  max={localTime(new Date().toISOString(), mode)}
                  onChange={(e) => setStart(e.target.value)}
                />
              </Field>
              <label className="check">
                <input
                  type="checkbox"
                  checked={q.startUnknown}
                  onChange={(e) => {
                    answer("startUnknown", e.target.checked);
                    if (e.target.checked) setStart("");
                  }}
                />
                {t("Exact time unknown", "صحیح وقت یاد نہیں")}
              </label>
            </div>
            <Radios
              label={t("Is the pain still present?", "کیا درد ابھی بھی ہے؟")}
              value={q.ongoing}
              options={yesNo}
              onChange={(v) => {
                answer("ongoing", v as CheckIn["ongoing"]);
                if (v !== "no") setEnd("");
              }}
            />
            {q.ongoing === "no" && (
              <Field
                label={t(
                  "When did the pain end? (optional)",
                  "درد کب ختم ہوا؟ (اختیاری)",
                )}
                hint={t(
                  "Leave blank if you do not remember the end time.",
                  "اختتامی وقت یاد نہ ہو تو خالی چھوڑ دیں۔",
                )}
              >
                <input
                  type="datetime-local"
                  value={end}
                  max={localTime(new Date().toISOString(), mode)}
                  onChange={(e) => setEnd(e.target.value)}
                />
              </Field>
            )}
            <fieldset className="question-options">
              <legend>
                {t(
                  "What was the highest pain in this episode?",
                  "اس دورے میں سب سے زیادہ درد کتنا تھا؟",
                )}
              </legend>
              <div className="pain-choices">
                {Array.from({ length: 11 }, (_, i) => (
                  <label
                    key={i}
                    className={
                      "pain-choice " + (q.peakPain === i ? "is-selected" : "")
                    }
                  >
                    <input
                      type="radio"
                      name="peak-pain"
                      value={i}
                      checked={q.peakPain === i}
                      onChange={() => answer("peakPain", i)}
                    />
                    <span>{i}</span>
                  </label>
                ))}
              </div>
              <div className="row between wrap small">
                <span>
                  {t(
                    "0 = no pain · 10 = worst imaginable pain",
                    "0 = درد نہیں · 10 = انتہائی شدید درد",
                  )}
                </span>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => answer("peakPain", null)}
                >
                  {t("Skip pain rating", "درد کی شدت چھوڑ دیں")}
                </button>
              </div>
              <p className="small muted">
                {t(
                  "A diary measure only. No diagnostic or total severity score is calculated.",
                  "یہ صرف ڈائری کا پیمانہ ہے۔ کوئی تشخیصی یا مجموعی شدت کا اسکور نہیں بنایا جاتا۔",
                )}
              </p>
            </fieldset>
            <div className="form-grid">
              {choices(
                t("Where was the pain?", "درد کہاں تھا؟"),
                "location",
                locations,
              )}
              {choices(
                t("What did the pain feel like?", "درد کیسا محسوس ہوا؟"),
                "description",
                descriptions,
              )}
            </div>
            <fieldset className="question-options">
              <legend>
                {t("What else did you feel?", "ساتھ میں کیا محسوس ہوا؟")}
              </legend>
              <div className="context-choices">
                {checkInSymptoms.map((s) => (
                  <label
                    className={
                      "choice " + (q.symptoms.includes(s) ? "is-selected" : "")
                    }
                    key={s}
                  >
                    <input
                      type="checkbox"
                      checked={q.symptoms.includes(s)}
                      onChange={() => {
                        const values = toggleExclusive(q.symptoms, s, ["None"]);
                        setQ((old) => ({
                          ...old,
                          symptoms: values,
                          symptomOther: values.includes("Other")
                            ? old.symptomOther
                            : "",
                        }));
                      }}
                    />
                    {t(s, checkInUr[s])}
                  </label>
                ))}
              </div>
            </fieldset>
            {q.symptoms.includes("Other") && (
              <Field
                label={t("Other symptoms (optional)", "دیگر علامات (اختیاری)")}
              >
                <input
                  maxLength={10000}
                  value={q.symptomOther}
                  onChange={(e) => answer("symptomOther", e.target.value)}
                />
              </Field>
            )}
            {choices(
              t(
                "How much were everyday activities affected?",
                "روزمرہ کے کام کتنے متاثر ہوئے؟",
              ),
              "impact",
              impacts,
            )}
            <Radios
              label={t(
                "Did you take medicine for the pain?",
                "کیا آپ نے درد کے لیے کوئی دوا لی؟",
              )}
              value={q.medicine}
              options={yesNo}
              onChange={(v) => {
                setQ((old) => ({
                  ...old,
                  medicine: v as CheckIn["medicine"],
                  medicineName: v === "yes" ? old.medicineName : "",
                  medicineTime: null,
                }));
                if (v !== "yes") setMedicineTime("");
              }}
            />
            {q.medicine === "yes" && (
              <div className="form-grid">
                <Field
                  label={t("Medicine name (optional)", "دوا کا نام (اختیاری)")}
                >
                  <input
                    maxLength={10000}
                    value={q.medicineName}
                    onChange={(e) => answer("medicineName", e.target.value)}
                  />
                </Field>
                <Field
                  label={t(
                    "Time taken (optional)",
                    "دوا لینے کا وقت (اختیاری)",
                  )}
                >
                  <input
                    type="datetime-local"
                    value={medicineTime}
                    max={localTime(new Date().toISOString(), mode)}
                    onChange={(e) => setMedicineTime(e.target.value)}
                  />
                </Field>
              </div>
            )}
            <p className="small muted">
              {t(
                "Medication is recorded only; this app does not recommend a medicine or dose.",
                "دوا صرف درج کی جاتی ہے؛ ایپ کسی دوا یا خوراک کی تجویز نہیں دیتی۔",
              )}
            </p>
          </Section>
        )}
        <Section
          number={d.headache === "no" ? "2" : "3"}
          title={t("Daily wellbeing", "روزانہ کی کیفیت")}
        >
          <div className="form-grid">
            <div>
              <Field
                label={t(
                  "How many hours did you sleep last night?",
                  "پچھلی رات کتنے گھنٹے سوئے؟",
                )}
              >
                <input
                  aria-label={t(
                    "Sleep duration (hours)",
                    "نیند کا دورانیہ (گھنٹے)",
                  )}
                  type="number"
                  min="0"
                  max="24"
                  step="0.25"
                  value={d.sleep ?? ""}
                  onChange={(e) =>
                    day(
                      "sleep",
                      e.target.value === "" ? null : Number(e.target.value),
                    )
                  }
                />
              </Field>
              <button
                type="button"
                className="text-button"
                aria-pressed={d.sleep === null}
                onClick={() => day("sleep", null)}
              >
                {t("Don't remember / clear", "یاد نہیں / خالی کریں")}
              </button>
            </div>
            <Radios
              label={t(
                "Did you skip any meals today?",
                "کیا آج کوئی کھانا چھوڑا؟",
              )}
              value={d.meals}
              options={[
                { value: "yes", label: t("Yes", "ہاں") },
                { value: "no", label: t("No", "نہیں") },
                { value: "unknown", label: t("Don't remember", "یاد نہیں") },
              ]}
              onChange={(v) => day("meals", v as Day["meals"])}
            />
          </div>
        </Section>
        <Section
          number={d.headache === "no" ? "3" : "4"}
          title={t("Daily context (optional)", "روزانہ کا پس منظر (اختیاری)")}
        >
          <p>
            {t(
              "Did you notice any situation you want to record?",
              "کیا آپ نے کوئی ایسی صورت حال محسوس کی جسے درج کرنا چاہتے ہیں؟",
            )}
          </p>
          <div className="context-choices">
            {contexts.map((c) => (
              <label
                key={c}
                className={
                  "choice " + (q.context.includes(c) ? "is-selected" : "")
                }
              >
                <input
                  type="checkbox"
                  checked={q.context.includes(c)}
                  onChange={() => {
                    const values = toggleExclusive(q.context, c, [
                      "Nothing noticed",
                      "Unsure",
                    ]);
                    setQ((old) => ({
                      ...old,
                      context: values,
                      contextOther: values.includes("Other")
                        ? old.contextOther
                        : "",
                    }));
                  }}
                />
                {t(
                  c === "Menstrual period" ? "Menstrual period (optional)" : c,
                  checkInUr[c],
                )}
              </label>
            ))}
          </div>
          {q.context.includes("Other") && (
            <Field
              label={t(
                "Other daily context (optional)",
                "دیگر روزانہ پس منظر (اختیاری)",
              )}
            >
              <input
                maxLength={10000}
                value={q.contextOther}
                onChange={(e) => answer("contextOther", e.target.value)}
              />
            </Field>
          )}
          <p className="small muted">
            {t(
              "Your observation does not prove a cause. These are daily notes, not confirmed triggers.",
              "آپ کا مشاہدہ وجہ ثابت نہیں کرتا۔ یہ روزانہ کے نوٹس ہیں، تصدیق شدہ محرکات نہیں۔",
            )}
          </p>
          <Field
            label={t(
              "Anything else you would like to note? (optional)",
              "کیا آپ کچھ اور نوٹ کرنا چاہیں گے؟ (اختیاری)",
            )}
          >
            <textarea
              aria-label={t("Notes (optional)", "نوٹس (اختیاری)")}
              maxLength={10000}
              value={d.notes}
              onChange={(e) => day("notes", e.target.value)}
            />
          </Field>
        </Section>
        {(entry?.quality ||
          (entry?.caffeine !== null && entry?.caffeine !== undefined) ||
          entry?.exposures) && (
          <Notice>
            {t(
              "Your previously recorded sleep quality, caffeine and free-text exposures are preserved. They remain visible in the diary and exports.",
              "پہلے درج کردہ نیند کا معیار، کیفین اور کیفیات محفوظ رہیں گی۔ ڈائری اور برآمد میں موجود ہیں۔",
            )}
          </Notice>
        )}
        {error && (
          <Notice kind="error">
            <span role="alert">{error}</span>
          </Notice>
        )}
        <div className="row wrap form-actions">
          <button className="primary" disabled={busy}>
            {busy
              ? t("Saving…", "محفوظ ہو رہا ہے…")
              : t("Save check-in", "اندراج محفوظ کریں")}
          </button>
          <button type="button" onClick={onDone}>
            {t("Cancel", "منسوخ")}
          </button>
        </div>
        <p className="small muted">
          {t(
            "Saved on this device. Separate timed attacks can still be added in Add an Attack; this check-in does not create a duplicate attack.",
            "اسی ڈیوائس میں محفوظ ہے۔ الگ وقت والے دورے «دورہ شامل کریں» میں درج ہوسکتے ہیں؛ یہ اندراج اضافی دورہ نہیں بناتا۔",
          )}
        </p>
      </form>
      <aside className="checkin-rail">
        <Card>
          <BrainMark large />
          <h2>
            {t("Your diary, your patterns", "آپ کی ڈائری، آپ کے رجحانات")}
          </h2>
          <p>
            {t(
              "Small daily observations help you describe your experience to your healthcare professional.",
              "روزانہ کے مختصر مشاہدات ماہر صحت کو اپنی کیفیت بتانے میں مدد دیتے ہیں۔",
            )}
          </p>
          <div className="rail-panel">
            <LockKeyhole size={22} />
            <h3>{t("Your privacy matters", "آپ کی رازداری اہم ہے")}</h3>
            <p>
              {t(
                "Records can be lost if browser storage is cleared. Export a backup from Profile.",
                "ریکارڈ اسی براؤزر میں محفوظ ہوتے ہیں۔ براؤزر کا ذخیرہ صاف کرنے سے مقامی ریکارڈ مٹ سکتے ہیں۔ پروفائل سے بیک اپ برآمد کریں۔",
              )}
            </p>
          </div>
          <div className="rail-panel">
            <h3>{t("How it works", "یہ کیسے کام کرتا ہے")}</h3>
            <ol className="workflow-list">
              <li>
                <b>{t("Daily Check-in", "روزانہ اندراج")}</b>
                <p>
                  {t("Record today's experience.", "آج کی کیفیت درج کریں۔")}
                </p>
              </li>
              <li>
                <b>{t("My Diary", "میری ڈائری")}</b>
                <p>
                  {t(
                    "Keep your records together.",
                    "اپنے اندراجات ایک جگہ رکھیں۔",
                  )}
                </p>
              </li>
              <li>
                <b>{t("My Summary", "میرا خلاصہ")}</b>
                <p>
                  {t(
                    "Prepare for a clinical conversation.",
                    "معالج سے گفتگو کی تیاری کریں۔",
                  )}
                </p>
              </li>
            </ol>
          </div>
          <Notice>
            {t(
              "No diagnosis, no total severity score, no product recommendation.",
              "کوئی تشخیص، مجموعی شدت کا اسکور یا مصنوعات کی تجویز نہیں۔",
            )}
          </Notice>
        </Card>
      </aside>
    </div>
  );
}
export function CheckInDetails({ day, mode }: { day: Day; mode: Mode }) {
  const t = useT();
  const q = day.checkIn;
  if (!q) return null;
  const missing = t("Not recorded", "درج نہیں");
  const time = (v: string | null) =>
    v ? localTime(v, mode).replace("T", " ") : missing;
  const translated = (s: string) => (s ? t(s, checkInUr[s] ?? s) : missing);
  return (
    <div className="checkin-details">
      <h3>{t("My Headache Check-in", "میرا سر درد کا اندراج")}</h3>
      {day.headache !== "no" && (
        <dl className="details">
          <dt>{t("Start", "شروع")}</dt>
          <dd>
            {q.startUnknown
              ? t("Exact time unknown", "صحیح وقت یاد نہیں")
              : time(q.start)}
          </dd>
          <dt>{t("Pain still present", "درد ابھی موجود ہے")}</dt>
          <dd>
            {q.ongoing === "yes"
              ? t("Yes", "ہاں")
              : q.ongoing === "no"
                ? t("No", "نہیں")
                : missing}
          </dd>
          <dt>{t("End", "اختتام")}</dt>
          <dd>{time(q.end)}</dd>
          <dt>
            {t("Peak pain (diary measure)", "سب سے زیادہ درد (ڈائری پیمانہ)")}
          </dt>
          <dd>{q.peakPain === null ? missing : `${q.peakPain} / 10`}</dd>
          <dt>{t("Location / feeling", "جگہ / کیفیت")}</dt>
          <dd>
            {translated(q.location)} · {translated(q.description)}
          </dd>
          <dt>{t("Associated symptoms", "ساتھ کی علامات")}</dt>
          <dd>
            {q.symptoms.map(translated).join(" · ") || missing}
            {q.symptomOther && ` — ${q.symptomOther}`}
          </dd>
          <dt>{t("Daily activities", "روزمرہ کے کام")}</dt>
          <dd>{translated(q.impact)}</dd>
          <dt>{t("Medicine taken", "دوا لی")}</dt>
          <dd>
            {q.medicine === "yes"
              ? t("Yes", "ہاں")
              : q.medicine === "no"
                ? t("No", "نہیں")
                : missing}
            {q.medicine === "yes" && (
              <>
                {" "}
                · {q.medicineName || missing} · {time(q.medicineTime)}
              </>
            )}
          </dd>
        </dl>
      )}
      <p>
        <b>{t("Daily context", "روزانہ کا پس منظر")}: </b>
        {q.context.map(translated).join(" · ") || missing}
        {q.contextOther && ` — ${q.contextOther}`}
      </p>
    </div>
  );
}
