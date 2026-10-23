import { useState } from "react";
import {
  type Attack,
  type Data,
  type Day,
  type Mode,
  dateKey,
  localTime,
  overlap,
  symptoms,
  toInstant,
  validateAttack,
  validateDay,
  zone,
} from "./core";
import { Card, Field, Notice } from "./components";
import { symptomUr, useT, useErrorText } from "./i18n";
type Props = {
  data: Data;
  mode: Mode;
  onSave: (data: Data) => Promise<void>;
  onDone: () => void;
};
export function DayForm({
  data,
  mode,
  onSave,
  onDone,
  entry,
  date,
}: { entry?: Day; date?: string } & Props) {
  const t = useT();
  const errorText = useErrorText();
  const [d, set] = useState<Day>(
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
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const change = (key: keyof Day, value: unknown) =>
    set({ ...d, [key]: value });
  return (
    <Card>
      <h2>
        {entry
          ? t("Edit daily check-in", "روزانہ اندراج میں ترمیم")
          : t("How was your day?", "آپ کا دن کیسا گزرا؟")}
      </h2>
      <p className="muted">
        {t(
          "Headache-free days matter, too. Leave optional fields blank if you did not record them.",
          "سر درد کے بغیر دن بھی اہم ہیں۔ اختیاری معلومات نہ ہوں تو خالی چھوڑ دیں۔",
        )}
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          try {
            validateDay(d, dateKey(new Date(), zone(mode)));
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
              days: [...data.days.filter((x) => x.id !== d.id), d],
            });
            onDone();
          } catch (e) {
            setError(errorText((e as Error).message));
            setBusy(false);
          }
        }}
      >
        <div className="form-grid">
          <Field label={t("Local calendar date *", "مقامی تاریخ *")}>
            <input
              type="date"
              required
              value={d.date}
              max={dateKey(new Date(), zone(mode))}
              onChange={(e) => change("date", e.target.value)}
            />
          </Field>
          <Field label={t("Headache today *", "آج سر درد *")}>
            <select
              value={d.headache}
              onChange={(e) => change("headache", e.target.value)}
            >
              <option value="unsure">{t("Not sure", "یقین نہیں")}</option>
              <option value="yes">{t("Yes", "ہاں")}</option>
              <option value="no">
                {t("No — headache-free", "نہیں — سر درد نہیں")}
              </option>
            </select>
          </Field>
          <Field label={t("Sleep duration (hours)", "نیند کا دورانیہ (گھنٹے)")}>
            <input
              type="number"
              min="0"
              max="24"
              step="0.25"
              value={d.sleep ?? ""}
              onChange={(e) =>
                change(
                  "sleep",
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
            />
          </Field>
          <Field label={t("Sleep quality", "نیند کا معیار")}>
            <select
              value={d.quality}
              onChange={(e) => change("quality", e.target.value)}
            >
              <option value="">{t("Not recorded", "درج نہیں")}</option>
              {["Poor", "Fair", "Good"].map((s, i) => (
                <option key={s} value={s}>
                  {t(s, ["خراب", "درمیانہ", "اچھا"][i])}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("Meals skipped", "کھانا چھوڑا")}>
            <select
              value={d.meals}
              onChange={(e) => change("meals", e.target.value)}
            >
              <option value="unknown">{t("Not recorded", "درج نہیں")}</option>
              <option value="yes">{t("Yes", "ہاں")}</option>
              <option value="no">{t("No", "نہیں")}</option>
            </select>
          </Field>
          <Field
            label={t("Caffeine intake (mg)", "کیفین کی مقدار (ملی گرام)")}
            hint={t(
              "Total milligrams recorded from labels or your estimate; not cups.",
              "لیبل یا اپنے اندازے سے کل ملی گرام؛ کپ نہیں۔",
            )}
          >
            <input
              type="number"
              min="0"
              max="10000"
              value={d.caffeine ?? ""}
              onChange={(e) =>
                change(
                  "caffeine",
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
            />
          </Field>
        </div>
        <Field
          label={t(
            "Possible exposures you noticed",
            "آپ کی نوٹ کردہ ممکنہ کیفیات",
          )}
          hint={t(
            "For example: bright light, strong smells, or an unusual routine. This does not confirm a trigger.",
            "مثلاً تیز روشنی، تیز خوشبو یا معمول میں تبدیلی۔ اس سے محرک کی تصدیق نہیں ہوتی۔",
          )}
        >
          <input
            maxLength={10000}
            value={d.exposures}
            onChange={(e) => change("exposures", e.target.value)}
          />
        </Field>
        <Field label={t("Notes (optional)", "نوٹس (اختیاری)")}>
          <textarea
            maxLength={10000}
            value={d.notes}
            onChange={(e) => change("notes", e.target.value)}
          />
        </Field>
        {error && (
          <Notice kind="error">
            <span role="alert">{error}</span>
          </Notice>
        )}
        <div className="row end">
          <button type="button" onClick={onDone}>
            {t("Cancel", "منسوخ")}
          </button>
          <button className="primary" disabled={busy}>
            {busy
              ? t("Saving…", "محفوظ ہو رہا ہے…")
              : t("Save check-in", "اندراج محفوظ کریں")}
          </button>
        </div>
      </form>
    </Card>
  );
}
export function AttackForm({
  data,
  mode,
  onSave,
  onDone,
  entry,
}: { entry?: Attack } & Props) {
  const t = useT();
  const errorText = useErrorText();
  const [a, set] = useState<Attack>(
    entry ?? {
      id: crypto.randomUUID(),
      start: "",
      end: null,
      pain: 5,
      location: "",
      description: "",
      symptoms: [],
      medication: "",
      dose: "",
      taken: null,
      notes: "",
    },
  );
  const [start, setStart] = useState(entry ? localTime(entry.start, mode) : "");
  const [end, setEnd] = useState(entry?.end ? localTime(entry.end, mode) : "");
  const [taken, setTaken] = useState(
    entry?.taken ? localTime(entry.taken, mode) : "",
  );
  const [ongoing, setOngoing] = useState(!entry?.end);
  const [ack, setAck] = useState(false);
  const [warning, setWarning] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const change = (key: keyof Attack, value: unknown) => {
    set({ ...a, [key]: value });
    setAck(false);
  };
  return (
    <Card>
      <h2>
        {entry
          ? t("Edit an attack", "دورے میں ترمیم")
          : t("Record an attack", "دورہ درج کریں")}
      </h2>
      <p className="muted">
        {t(
          "Your experience, in your words. Recording symptoms does not make a diagnosis.",
          "اپنی کیفیت اپنے الفاظ میں درج کریں۔ علامات کا اندراج تشخیص نہیں ہے۔",
        )}{" "}
        · {zone(mode)}
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          try {
            const record = {
              ...a,
              start: toInstant(start, mode),
              end: ongoing ? null : toInstant(end, mode),
              taken: taken ? toInstant(taken, mode) : null,
            };
            validateAttack(record);
            if (data.attacks.some((b) => overlap(record, b)) && !ack) {
              setWarning(true);
              return;
            }
            setBusy(true);
            await onSave({
              ...data,
              attacks: [...data.attacks.filter((x) => x.id !== a.id), record],
            });
            onDone();
          } catch (e) {
            setError(errorText((e as Error).message));
            setBusy(false);
          }
        }}
      >
        <div className="form-grid">
          <Field label={t("Start date and time *", "شروع کی تاریخ اور وقت *")}>
            <input
              required
              type="datetime-local"
              value={start}
              max={localTime(new Date().toISOString(), mode)}
              onChange={(e) => {
                setStart(e.target.value);
                setAck(false);
              }}
            />
          </Field>
          <Field label={t("End date and time", "اختتام کی تاریخ اور وقت")}>
            <input
              required={!ongoing}
              disabled={ongoing}
              type="datetime-local"
              value={end}
              max={localTime(new Date().toISOString(), mode)}
              onChange={(e) => {
                setEnd(e.target.value);
                setAck(false);
              }}
            />
          </Field>
        </div>
        <label className="check">
          <input
            type="checkbox"
            checked={ongoing}
            onChange={(e) => {
              setOngoing(e.target.checked);
              setAck(false);
            }}
          />
          {t("Attack is ongoing", "دورہ ابھی جاری ہے")}
        </label>
        <Field
          label={t(
            `Pain intensity: ${a.pain} / 10`,
            `درد کی شدت: ${a.pain} / 10`,
          )}
        >
          <input
            type="range"
            min="0"
            max="10"
            value={a.pain}
            onChange={(e) => change("pain", Number(e.target.value))}
          />
          <div className="row between small">
            <span>{t("0 · No pain", "0 · درد نہیں")}</span>
            <span>
              {t("10 · Worst imaginable pain", "10 · انتہائی شدید درد")}
            </span>
          </div>
        </Field>
        <div className="form-grid">
          <Field label={t("Pain location (optional)", "درد کی جگہ (اختیاری)")}>
            <input
              maxLength={10000}
              value={a.location}
              onChange={(e) => change("location", e.target.value)}
            />
          </Field>
          <Field
            label={t("Pain description (optional)", "درد کی کیفیت (اختیاری)")}
          >
            <input
              maxLength={10000}
              value={a.description}
              onChange={(e) => change("description", e.target.value)}
            />
          </Field>
        </div>
        <fieldset>
          <legend>
            {t("Associated symptoms (optional)", "ساتھ کی علامات (اختیاری)")}
          </legend>
          <div className="checks">
            {symptoms.map((s) => (
              <label className="check" key={s}>
                <input
                  type="checkbox"
                  checked={a.symptoms.includes(s)}
                  onChange={(e) =>
                    change(
                      "symptoms",
                      e.target.checked
                        ? [...a.symptoms, s]
                        : a.symptoms.filter((x) => x !== s),
                    )
                  }
                />
                {t(s, symptomUr[s])}
              </label>
            ))}
          </div>
          <small>
            {t(
              "Aura-like symptoms are self-reported, not diagnosed by this checklist.",
              "آورا جیسی علامات خود بیان کردہ ہیں؛ اس فہرست سے تشخیص نہیں ہوتی۔",
            )}
          </small>
        </fieldset>
        <Notice>
          {t(
            "Medication is documented only. MigraMap does not recommend medicines or doses, or assess medication overuse.",
            "دوا کا صرف ریکارڈ رکھا جاتا ہے۔ یہ ایپ دوا، خوراک یا زیادہ استعمال کا تعین نہیں کرتی۔",
          )}
        </Notice>
        <div className="form-grid">
          <Field
            label={t("Medication name (optional)", "دوا کا نام (اختیاری)")}
          >
            <input
              maxLength={10000}
              value={a.medication}
              onChange={(e) => change("medication", e.target.value)}
            />
          </Field>
          <Field
            label={t(
              "Dose as recorded (free text)",
              "درج کردہ خوراک (اپنے الفاظ میں)",
            )}
          >
            <input
              maxLength={10000}
              value={a.dose}
              onChange={(e) => change("dose", e.target.value)}
            />
          </Field>
          <Field
            label={t("Time taken (optional)", "دوا لینے کا وقت (اختیاری)")}
          >
            <input
              type="datetime-local"
              value={taken}
              onChange={(e) => setTaken(e.target.value)}
            />
          </Field>
        </div>
        <Field label={t("Notes (optional)", "نوٹس (اختیاری)")}>
          <textarea
            maxLength={10000}
            value={a.notes}
            onChange={(e) => change("notes", e.target.value)}
          />
        </Field>
        {warning && (
          <Notice kind="warning">
            <p>
              {t(
                "This overlaps another recorded attack. Review the times to avoid duplicates.",
                "یہ وقت دوسرے درج کردہ دورے سے ملتا ہے۔ نقل سے بچنے کے لیے وقت دیکھیں۔",
              )}
            </p>
            <label className="check">
              <input
                type="checkbox"
                checked={ack}
                onChange={(e) => setAck(e.target.checked)}
              />
              {t(
                "I reviewed the overlap; save as a separate attack.",
                "میں نے وقت دیکھ لیا ہے؛ الگ دورہ محفوظ کریں۔",
              )}
            </label>
          </Notice>
        )}
        {error && (
          <Notice kind="error">
            <span role="alert">{error}</span>
          </Notice>
        )}
        <div className="row end">
          <button type="button" onClick={onDone}>
            {t("Cancel", "منسوخ")}
          </button>
          <button className="primary" disabled={busy}>
            {busy
              ? t("Saving…", "محفوظ ہو رہا ہے…")
              : t("Save attack", "دورہ محفوظ کریں")}
          </button>
        </div>
      </form>
    </Card>
  );
}
