import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Moon,
  Heart,
  NotebookPen,
} from "lucide-react";
import { BrainMark, CheckInDetails, checkInUr } from "./checkin";
import {
  type Data,
  type Day,
  dateKey,
  localTime,
  toInstant,
  validateDay,
} from "./core";
import {
  newCheckIn,
  clearEpisode,
  checkInSymptoms,
  locations,
  descriptions,
  impacts,
  contexts,
  toggleExclusive,
  type CheckIn,
} from "./checkin-model";
import { useT, useErrorText } from "./i18n";
import { Field, Notice } from "./components";
export function Onboarding({
  data,
  onSave,
  onDone,
  ur,
  setUr,
}: {
  data: Data;
  onSave: (d: Data) => Promise<void>;
  onDone: () => void | Promise<void>;
  ur: boolean;
  setUr: (v: boolean) => void;
}) {
  const t = useT(),
    errorText = useErrorText();
  const [d, setD] = useState<Day>(() => ({
    id: crypto.randomUUID(),
    date: dateKey(),
    headache: "unsure",
    sleep: null,
    quality: "",
    meals: "unknown",
    caffeine: null,
    exposures: "",
    notes: "",
  }));
  const [q, setQ] = useState(newCheckIn),
    [step, setStep] = useState("intro"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [saved, setSaved] = useState(false);
  const [start, setStart] = useState(""),
    [end, setEnd] = useState(""),
    [medicineTime, setMedicineTime] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const episode = [
    "start",
    "ongoing",
    "pain",
    "location",
    "feeling",
    "symptoms",
    "impact",
  ];
  const order = [
    "intro",
    "date",
    "headache",
    ...(d.headache === "no" ? [] : episode),
    "sleep",
    "meals",
    ...(d.headache === "no" ? [] : ["medicine"]),
    "context",
    "notes",
    "review",
  ];
  const index = order.indexOf(step),
    total = order.length - 1;
  useEffect(() => {
    heading.current?.focus();
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [step, saved]);
  const day = (key: keyof Day, value: unknown) =>
    setD((old) => ({ ...old, [key]: value }));
  const answer = (key: keyof CheckIn, value: unknown) =>
    setQ((old) => ({ ...old, [key]: value }));
  const labels: Record<string, [string, string]> = {
    intro: ["Let’s get to know your days", "آئیے آپ کے دنوں کو سمجھیں"],
    date: [
      "Which date are you recording?",
      "آپ کس تاریخ کا ریکارڈ درج کر رہے ہیں؟",
    ],
    headache: ["Did you have a headache today?", "کیا آج آپ کو سر درد ہوا؟"],
    start: ["When did the headache start?", "سر درد کب شروع ہوا؟"],
    ongoing: ["Is the pain still present?", "کیا درد ابھی بھی ہے؟"],
    pain: [
      "What was the highest pain in this episode?",
      "اس دورے میں سب سے زیادہ درد کتنا تھا؟",
    ],
    location: ["Where was the pain?", "درد کہاں تھا؟"],
    feeling: ["What did the pain feel like?", "درد کیسا محسوس ہوا؟"],
    symptoms: ["What else did you feel?", "ساتھ میں کیا محسوس ہوا؟"],
    impact: [
      "How were your daily activities affected?",
      "روزمرہ کے کام کتنے متاثر ہوئے؟",
    ],
    sleep: [
      "How many hours did you sleep last night?",
      "پچھلی رات کتنے گھنٹے سوئے؟",
    ],
    meals: ["Did you skip any meals today?", "کیا آج کوئی کھانا چھوڑا؟"],
    medicine: [
      "Did you take medicine for the pain?",
      "کیا آپ نے درد کے لیے کوئی دوا لی؟",
    ],
    context: ["Daily context", "روزانہ کا پس منظر"],
    notes: [
      "Anything else you would like to note?",
      "کیا آپ کچھ اور نوٹ کرنا چاہیں گے؟",
    ],
    review: [
      "Your diary is ready to begin",
      "آپ کی ڈائری شروع ہونے کے لیے تیار ہے",
    ],
  };
  const yesNo = [
    ["yes", t("Yes", "ہاں")],
    ["no", t("No", "نہیں")],
    ["unknown", t("Not recorded", "درج نہیں")],
  ];
  const choices = (
    value: string,
    items: readonly (readonly string[])[],
    change: (v: string) => void,
  ) => (
    <div
      className="onboarding-choices"
      role="group"
      aria-label={t(...labels[step])}
    >
      {items.map(([v, label]) => (
        <button
          type="button"
          key={v}
          aria-pressed={value === v}
          className={"onboarding-choice " + (value === v ? "selected" : "")}
          onClick={() => change(v)}
        >
          <span>{label}</span>
          {value === v ? (
            <Check size={21} />
          ) : (
            <span className="selection-circle" />
          )}
        </button>
      ))}
    </div>
  );
  const options = (values: readonly string[]) =>
    values.map((v) => [v, t(v, checkInUr[v] ?? v)]);
  const multi = (
    values: string[],
    items: readonly string[],
    exclusive: string[],
    change: (v: string[]) => void,
  ) => (
    <div className="onboarding-choices multi">
      {items.map((v) => (
        <button
          type="button"
          key={v}
          aria-pressed={values.includes(v)}
          className={
            "onboarding-choice " + (values.includes(v) ? "selected" : "")
          }
          onClick={() => change(toggleExclusive(values, v, exclusive))}
        >
          <span>
            {t(
              v === "Menstrual period" ? "Menstrual period (optional)" : v,
              checkInUr[v] ?? v,
            )}
          </span>
          {values.includes(v) ? (
            <Check size={20} />
          ) : (
            <span className="selection-circle" />
          )}
        </button>
      ))}
    </div>
  );
  const prepare = (): Day => ({
    ...d,
    checkIn:
      d.headache === "no"
        ? clearEpisode(q)
        : {
            ...q,
            start:
              q.startUnknown || !start ? null : toInstant(start, "personal"),
            end: q.ongoing === "no" && end ? toInstant(end, "personal") : null,
            medicineName: q.medicine === "yes" ? q.medicineName : "",
            medicineTime:
              q.medicine === "yes" && medicineTime
                ? toInstant(medicineTime, "personal")
                : null,
          },
  });
  const validate = () => {
    const record = prepare();
    validateDay(record);
    if (record.checkIn?.start && dateKey(record.checkIn.start) > d.date)
      throw Error(
        t(
          "The episode cannot start after the date being recorded.",
          "دورہ درج کردہ تاریخ کے بعد شروع نہیں ہوسکتا۔",
        ),
      );
    if (
      record.checkIn?.end &&
      dateKey(new Date(Date.parse(record.checkIn.end) - 1)) < d.date
    )
      throw Error(
        t(
          "The episode ended before this record date. Review the date or episode times.",
          "دورہ اس تاریخ سے پہلے ختم ہوا تھا۔ تاریخ یا دورے کا وقت دیکھیں۔",
        ),
      );
    return record;
  };
  const next = async () => {
    setError("");
    try {
      if (step !== "intro") {
        validate();
        if (data.days.some((x) => x.date === d.date))
          throw Error(
            t(
              "A check-in already exists for this date. Choose another date or open your diary to edit it.",
              "اس تاریخ کا اندراج پہلے سے موجود ہے۔ دوسری تاریخ منتخب کریں یا ڈائری میں ترمیم کریں۔",
            ),
          );
      }
      if (step === "review") {
        setBusy(true);
        const record = validate();
        await onSave({ ...data, days: [...data.days, record] });
        setSaved(true);
      } else setStep(order[index + 1]);
    } catch (e) {
      setError(errorText((e as Error).message));
    } finally {
      setBusy(false);
    }
  };
  const skip = () => {
    setError("");
    switch (step) {
      case "start":
        setStart("");
        answer("startUnknown", false);
        break;
      case "ongoing":
        answer("ongoing", "unknown");
        setEnd("");
        break;
      case "pain":
        answer("peakPain", null);
        break;
      case "location":
        answer("location", "");
        break;
      case "feeling":
        answer("description", "");
        break;
      case "symptoms":
        setQ((v) => ({ ...v, symptoms: [], symptomOther: "" }));
        break;
      case "impact":
        answer("impact", "");
        break;
      case "sleep":
        day("sleep", null);
        break;
      case "meals":
        day("meals", "unknown");
        break;
      case "medicine":
        setQ((v) => ({
          ...v,
          medicine: "unknown",
          medicineName: "",
          medicineTime: null,
        }));
        setMedicineTime("");
        break;
      case "context":
        setQ((v) => ({ ...v, context: [], contextOther: "" }));
        break;
      case "notes":
        day("notes", "");
        break;
    }
    setStep(order[index + 1]);
  };
  let content: ReactNode;
  switch (step) {
    case "intro":
      content = (
        <>
          <BrainMark large />
          <p>
            {t(
              "Record today’s experience. This questionnaire does not diagnose. You can skip optional questions.",
              "اپنا آج کا تجربہ درج کریں۔ یہ سوالنامہ تشخیص نہیں کرتا۔ آپ اختیاری سوالات چھوڑ سکتے ہیں۔",
            )}
          </p>
          <div className="onboarding-info">
            <NotebookPen />
            <p>
              {t(
                "One question at a time. No previous migraine diagnosis is needed.",
                "ایک وقت میں ایک سوال۔ مائیگرین کی پہلے سے تشخیص ضروری نہیں۔",
              )}
            </p>
          </div>
          <p className="small muted">
            {t(
              "Records stay in this browser. Export a backup from Profile.",
              "ریکارڈ اسی براؤزر میں رہتے ہیں۔ پروفائل سے بیک اپ برآمد کریں۔",
            )}
          </p>
        </>
      );
      break;
    case "date":
      content = (
        <Field label={t("Record date", "اندراج کی تاریخ")}>
          <input
            required
            type="date"
            value={d.date}
            max={dateKey()}
            onChange={(e) => day("date", e.target.value)}
          />
        </Field>
      );
      break;
    case "headache":
      content = choices(
        d.headache,
        [
          ["yes", t("Yes", "ہاں")],
          ["no", t("No", "نہیں")],
          ["unsure", t("Not sure", "پتا نہیں")],
        ],
        (v) => day("headache", v),
      );
      break;
    case "start":
      content = (
        <>
          <Field
            label={t(
              "Start date and time (optional)",
              "شروع کی تاریخ اور وقت (اختیاری)",
            )}
          >
            <input
              type="datetime-local"
              max={localTime(new Date().toISOString(), "personal")}
              disabled={q.startUnknown}
              value={start}
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
        </>
      );
      break;
    case "ongoing":
      content = (
        <>
          {choices(q.ongoing, yesNo, (v) => {
            answer("ongoing", v);
            if (v !== "no") setEnd("");
          })}
          {q.ongoing === "no" && (
            <Field
              label={t(
                "End date and time (optional)",
                "اختتام کی تاریخ اور وقت (اختیاری)",
              )}
            >
              <input
                type="datetime-local"
                max={localTime(new Date().toISOString(), "personal")}
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </Field>
          )}
        </>
      );
      break;
    case "pain":
      content = (
        <>
          <div className="onboarding-pain" aria-hidden="true">
            <Heart size={54} />
            <strong>{q.peakPain ?? "—"}</strong>
          </div>
          <div
            className="pain-choices"
            role="group"
            aria-label={t("Pain rating", "درد کی درجہ بندی")}
          >
            {Array.from({ length: 11 }, (_, i) => (
              <button
                type="button"
                className={
                  "pain-choice " + (q.peakPain === i ? "is-selected" : "")
                }
                aria-pressed={q.peakPain === i}
                key={i}
                onClick={() => answer("peakPain", i)}
              >
                {i}
              </button>
            ))}
          </div>
          <p className="small">
            {t(
              "0 = no pain · 10 = worst imaginable pain",
              "0 = درد نہیں · 10 = انتہائی شدید درد",
            )}
          </p>
          <p className="muted small">
            {t(
              "A diary measure only, not a diagnostic score.",
              "صرف ڈائری کا پیمانہ، تشخیصی اسکور نہیں۔",
            )}
          </p>
        </>
      );
      break;
    case "location":
      content = choices(q.location, options(locations), (v) =>
        answer("location", v),
      );
      break;
    case "feeling":
      content = choices(q.description, options(descriptions), (v) =>
        answer("description", v),
      );
      break;
    case "symptoms":
      content = (
        <>
          {multi(q.symptoms, checkInSymptoms, ["None"], (v) =>
            setQ((o) => ({
              ...o,
              symptoms: v,
              symptomOther: v.includes("Other") ? o.symptomOther : "",
            })),
          )}
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
        </>
      );
      break;
    case "impact":
      content = choices(q.impact, options(impacts), (v) => answer("impact", v));
      break;
    case "sleep":
      content = (
        <>
          <Moon className="onboarding-symbol" size={70} />
          <Field label={t("Sleep duration (hours)", "نیند کا دورانیہ (گھنٹے)")}>
            <input
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
            onClick={() => day("sleep", null)}
          >
            {t("Don’t remember / clear", "یاد نہیں / خالی کریں")}
          </button>
        </>
      );
      break;
    case "meals":
      content = choices(
        d.meals,
        [
          ["yes", t("Yes", "ہاں")],
          ["no", t("No", "نہیں")],
          ["unknown", t("Don’t remember", "یاد نہیں")],
        ],
        (v) => day("meals", v),
      );
      break;
    case "medicine":
      content = (
        <>
          {choices(q.medicine, yesNo, (v) => {
            setQ((o) => ({
              ...o,
              medicine: v as CheckIn["medicine"],
              medicineName: v === "yes" ? o.medicineName : "",
              medicineTime: null,
            }));
            if (v !== "yes") setMedicineTime("");
          })}
          {q.medicine === "yes" && (
            <>
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
                label={t("Time taken (optional)", "دوا لینے کا وقت (اختیاری)")}
              >
                <input
                  type="datetime-local"
                  max={localTime(new Date().toISOString(), "personal")}
                  value={medicineTime}
                  onChange={(e) => setMedicineTime(e.target.value)}
                />
              </Field>
            </>
          )}
        </>
      );
      break;
    case "context":
      content = (
        <>
          <p>
            {t(
              "Did you notice any situation you want to record? Your observation does not prove a cause.",
              "کیا آپ نے کوئی صورت حال محسوس کی جسے درج کرنا چاہتے ہیں؟ آپ کا مشاہدہ وجہ ثابت نہیں کرتا۔",
            )}
          </p>
          {multi(q.context, contexts, ["Nothing noticed", "Unsure"], (v) =>
            setQ((o) => ({
              ...o,
              context: v,
              contextOther: v.includes("Other") ? o.contextOther : "",
            })),
          )}
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
        </>
      );
      break;
    case "notes":
      content = (
        <Field label={t("Notes (optional)", "نوٹس (اختیاری)")}>
          <textarea
            rows={6}
            maxLength={10000}
            value={d.notes}
            onChange={(e) => day("notes", e.target.value)}
          />
        </Field>
      );
      break;
    case "review":
      content = (
        <div className="onboarding-review">
          <p>
            <b>{d.date}</b> ·{" "}
            {d.headache === "no"
              ? t("Headache-free", "سر درد نہیں")
              : d.headache === "yes"
                ? t("Headache", "سر درد")
                : t("Not sure", "پتا نہیں")}
          </p>
          <p>
            {t("Sleep (hours)", "نیند (گھنٹے)")}: {d.sleep ?? "—"}
          </p>
          <p>
            {t("Meals skipped", "کھانا چھوڑا")}:{" "}
            {d.meals === "yes"
              ? t("Yes", "ہاں")
              : d.meals === "no"
                ? t("No", "نہیں")
                : t("Not recorded", "درج نہیں")}
          </p>
          <CheckInDetails day={prepare()} mode="personal" />
          {d.notes && <p className="prewrap">{d.notes}</p>}
          <button type="button" onClick={() => setStep("date")}>
            {t("Review my answers", "میرے جوابات دیکھیں")}
          </button>
        </div>
      );
      break;
  }
  const leave = async () => { setBusy(true); setError(""); try { await onDone(); } catch(e) { setError((e as Error).message); } finally { setBusy(false); } };
  return (
    <div className="onboarding">
      <header className="onboarding-header">
        <button
          className="brand-home"
          aria-label={t("MigraMap home", "مائیگرا میپ ہوم")}
          onClick={() => void leave()}
          disabled={busy}
        >
          <BrainMark />
          <strong>MigraMap</strong>
        </button>
        <button className="language-button" onClick={() => setUr(!ur)}>
          {ur ? "English" : "اردو"}
        </button>
      </header>
      <main className="onboarding-shell">
        <div className="onboarding-progress">
          <button
            className="icon-button"
            aria-label={t("Back", "واپس")}
            disabled={index === 0 || busy || saved}
            onClick={() => {
              setError("");
              setStep(order[index - 1]);
            }}
          >
            <ArrowLeft />
          </button>
          <progress
            aria-label={t("Onboarding progress", "ابتدائی اندراج کی پیش رفت")}
            max={total}
            value={saved ? total : index}
          />
          <span>
            {saved ? total : index}/{total}
          </span>
        </div>
        <h1 ref={heading} tabIndex={-1}>
          {saved
            ? t("Your entry is saved.", "آپ کا اندراج محفوظ ہوگیا۔")
            : t(...labels[step])}
        </h1>
        {saved ? (
          <div className="onboarding-complete">{error && <p role="alert">{error}</p>}
            <CheckCircle2 size={76} />
            <p>
              {t(
                "Your entry is saved. View your diary or prepare a summary for your healthcare professional.",
                "آپ کا اندراج محفوظ ہوگیا۔ اپنی ڈائری دیکھیں یا ماہر صحت کے لیے خلاصہ تیار کریں۔",
              )}
            </p>
            <button className="primary" onClick={() => void leave()}>
              {t("Go to home", "ہوم پر جائیں")}
              <ArrowRight size={20} />
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void next();
            }}
          >
            <div className="onboarding-question" key={step}>
              {content}
            </div>
            {error && (
              <Notice kind="error">
                <span role="alert">{error}</span>
              </Notice>
            )}
            <div className="onboarding-actions">
              <button className="primary" disabled={busy}>
                {busy
                  ? t("Saving…", "محفوظ ہو رہا ہے…")
                  : step === "review"
                    ? t("Save and finish", "محفوظ کریں اور ختم کریں")
                    : step === "intro"
                      ? t("Get started", "شروع کریں")
                      : t("Continue", "آگے بڑھیں")}
                <ArrowRight size={20} />
              </button>
              {!["intro", "date", "headache", "review"].includes(step) && (
                <button type="button" className="text-button" onClick={skip}>
                  {t("Skip this question", "یہ سوال چھوڑ دیں")}
                </button>
              )}
              <button
                type="button"
                className="text-button"
                disabled={busy}
                onClick={() => void leave()}
              >
                {t(
                  "Set up later — go to home",
                  "بعد میں درج کریں — ہوم پر جائیں",
                )}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
