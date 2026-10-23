import { CheckInDetails } from "./checkin";
import { useState } from "react";
import {
  type Data,
  type Mode,
  csv,
  definitions,
  localTime,
  summarize,
  zone,
} from "./core";
import {
  ArrowRight,
  Card,
  download,
  Empty,
  Notice,
  Plus,
  Sun,
} from "./components";
import { symptomUr, useT } from "./i18n";
type Props = { data: Data; mode: Mode; from: string; to: string };
const value = (n: number | null) =>
  n === null ? "—" : Number(n.toFixed(1)).toString();
export function Definitions() {
  const t = useT();
  return (
    <details className="definitions">
      <summary>
        {t("How these numbers are calculated", "یہ اعداد کیسے شمار ہوتے ہیں")}
      </summary>
      <p>
        {t(
          definitions,
          "اندراج والے دن وہ ہیں جن میں روزانہ اندراج یا دورہ موجود ہو۔ ایک ہی دن کے کئی دورے صرف ایک سر درد والا دن شمار ہوتے ہیں۔ سر درد نہ ہونے کے اندراج کے مقابلے میں دورہ ترجیح پاتا ہے اور تضاد دکھایا جاتا ہے۔ غیر یقینی دن درج شدہ ہیں مگر سر درد سے پاک نہیں۔ اختتامی لمحہ دورے میں شامل نہیں؛ نصف شب پر ختم ہونے والا دورہ اگلے دن میں شمار نہیں ہوتا۔ جاری دورہ موجودہ وقت تک شمار ہوتا ہے۔ دنوں کی گنتی منتخب مدت تک محدود ہے۔ دوروں کی گنتی اور اوسط شدت میں مدت سے ملنے والے تمام الگ دورے شامل ہیں۔ اوسط دورانیہ مکمل دوروں کا پورا دورانیہ ہے؛ جاری دورے شامل نہیں۔ مشاہدہ نہ ہو تو اوسط دستیاب نہیں، جبکہ مشاہدہ شدہ واقعات کی گنتی صفر ہوسکتی ہے۔",
        )}
      </p>
    </details>
  );
}
export function Stats(p: Props) {
  const t = useT();
  const s = summarize(p.data, p.from, p.to, zone(p.mode));
  return (
    <div className="stats">
      {[
        [
          t("Recorded days", "درج شدہ دن"),
          s.recorded,
          `${s.all.length} ${t("days in range", "کل دن")}`,
          "purple",
        ],
        [
          t("Headache days", "سر درد والے دن"),
          s.recorded ? s.headache : t("Not available", "دستیاب نہیں"),
          `${s.attacks.length} ${t("recorded attacks", "درج شدہ دورے")}`,
          "coral",
        ],
        [
          t("Headache-free days", "سر درد کے بغیر دن"),
          s.recorded ? s.free : t("Not available", "دستیاب نہیں"),
          t("Explicitly recorded", "واضح طور پر درج"),
          "teal",
        ],
        [
          t("Unrecorded days", "غیر درج شدہ دن"),
          s.unrecorded,
          t("Missing is not headache-free", "غیر درج کا مطلب درد نہ ہونا نہیں"),
          "gray",
        ],
      ].map(([label, n, sub, color]) => (
        <Card className={"stat " + color} key={String(label)}>
          <span className="stat-label">{label}</span>
          <strong className={typeof n === "string" ? "unavailable" : ""}>
            {n}
          </strong>
          <small>{sub}</small>
        </Card>
      ))}
    </div>
  );
}
export function Timeline(p: Props) {
  const t = useT();
  const s = summarize(p.data, p.from, p.to, zone(p.mode));
  const recent = s.all.slice(-35);
  return (
    <>
      <div
        className="timeline"
        role="img"
        aria-label={t(
          "Daily headache status; exact values in the table below.",
          "روزانہ سر درد کی حالت؛ درست اعداد نیچے جدول میں ہیں۔",
        )}
      >
        {recent.map((d) => (
          <div
            key={d.date}
            title={`${d.date}: ${d.kind}`}
            className={"timeline-column " + d.kind}
          >
            <div className="timeline-bar">
              {d.kind === "free"
                ? "✓"
                : d.kind === "headache"
                  ? "●"
                  : d.kind === "unsure"
                    ? "?"
                    : "—"}
            </div>
            <small>{Number(d.date.slice(-2))}</small>
          </div>
        ))}
      </div>
      <div className="legend">
        <span className="coral-dot">● {t("Headache", "سر درد")}</span>
        <span className="teal-dot">✓ {t("Headache-free", "سر درد نہیں")}</span>
        <span>— {t("Unrecorded", "درج نہیں")}</span>
        <span>? {t("Not sure", "یقین نہیں")}</span>
      </div>
      <p className="small muted">
        {t(
          "Showing the most recent 35 days at most.",
          "زیادہ سے زیادہ حالیہ 35 دن دکھائے گئے ہیں۔",
        )}
      </p>
    </>
  );
}
export function Dashboard(p: Props & { go: (s: string) => void }) {
  const t = useT();
  const s = summarize(p.data, p.from, p.to, zone(p.mode));
  const latest = [
    ...p.data.days.map((d) => ({
      date: d.date,
      note: d.notes,
      title: t("Daily check-in", "روزانہ اندراج"),
    })),
    ...p.data.attacks.map((a) => ({
      date: localTime(a.start, p.mode).replace("T", " "),
      note: a.notes,
      title: t("Recorded attack", "درج کردہ دورہ"),
    })),
  ].sort((a, b) => b.date.localeCompare(a.date))[0];
  return (
    <>
      <div className="hero">
        <div>
          <span className="eyebrow">
            {t("ONE DAY AT A TIME", "ایک وقت میں ایک دن")}
          </span>
          <h2>
            {t(
              "Every day adds a little clarity.",
              "ہر دن کچھ سمجھنے میں مدد دیتا ہے۔",
            )}
          </h2>
          <p>
            {t(
              "A quiet space to record your experiences, notice patterns, and prepare for a conversation with your clinician.",
              "اپنی کیفیت درج کرنے، ریکارڈ میں رجحانات دیکھنے اور معالج سے گفتگو کی تیاری کے لیے ایک پرسکون جگہ۔",
            )}
          </p>
          <button className="primary" onClick={() => p.go("day")}>
            <Plus size={18} />
            {t("Record your day", "اپنا دن درج کریں")}
          </button>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbit one" />
          <div className="orbit two" />
          <div className="art-leaf leaf-one" />
          <div className="art-leaf leaf-two" />
          <div className="art-leaf leaf-three" />
          <div className="art-center">
            <Sun size={42} strokeWidth={1} />
          </div>
          <span className="art-dot" />
        </div>
      </div>
      <Stats {...p} />
      <div className="dashboard-grid">
        <Card>
          <div className="row between wrap">
            <div>
              <h2>{t("Your days, at a glance", "آپ کے دن، ایک نظر میں")}</h2>
              <p className="muted small">
                {t(
                  "Your recorded experience across this date range",
                  "اس مدت میں آپ کی درج کردہ کیفیت",
                )}
              </p>
            </div>
            <button className="text-button" onClick={() => p.go("patterns")}>
              {t("Explore patterns", "رجحانات دیکھیں")}
              <ArrowRight size={16} />
            </button>
          </div>
          <Timeline {...p} />
          <div className="metrics">
            <div>
              <strong className={s.intensity === null ? "unavailable" : ""}>
                {s.intensity === null
                  ? t("Not available", "دستیاب نہیں")
                  : value(s.intensity)}
              </strong>
              <span>{t("Mean intensity / 10", "اوسط شدت / 10")}</span>
            </div>
            <div>
              <strong className={s.duration === null ? "unavailable" : ""}>
                {s.duration === null
                  ? t("Not available", "دستیاب نہیں")
                  : value(s.duration)}{" "}
                {s.duration !== null ? t("h", "گھنٹے") : ""}
              </strong>
              <span>
                {t("Mean completed duration", "مکمل دوروں کا اوسط دورانیہ")}
              </span>
            </div>
            <div>
              <strong>{s.unsure}</strong>
              <span>{t("Uncertain days", "غیر یقینی دن")}</span>
            </div>
          </div>
          {s.intensity === null && (
            <p className="small">
              {t(
                "— Not available: no recorded attacks.",
                "— دستیاب نہیں: کوئی دورہ درج نہیں۔",
              )}
            </p>
          )}
        </Card>
        <Card className="today-card">
          <span className="round-icon">
            <Sun />
          </span>
          <h2>{t("Make room for today", "آج کے لیے وقت نکالیں")}</h2>
          <p>
            {t(
              "A day without headache is worth recording. Small check-ins help fill in the picture.",
              "سر درد کے بغیر دن بھی درج کریں۔ روزانہ کا مختصر اندراج تصویر مکمل کرتا ہے۔",
            )}
          </p>
          <button onClick={() => p.go("day")}>
            {t("Daily check-in", "روزانہ اندراج")}
            <ArrowRight size={16} />
          </button>
          <hr />
          <span className="small muted">
            {t("YOUR DATA STAYS HERE", "آپ کا ڈیٹا یہیں رہتا ہے")}
          </span>
          <p className="small">
            {t(
              "Stored in this browser. Export a backup to keep a separate copy.",
              "اسی براؤزر میں محفوظ ہے۔ الگ نقل رکھنے کے لیے بیک اپ برآمد کریں۔",
            )}
          </p>
        </Card>
      </div>
      <div className="two-col">
        <Card>
          <div className="row between">
            <h2>{t("Latest diary entry", "تازہ ترین اندراج")}</h2>
            <button className="text-button" onClick={() => p.go("diary")}>
              {t("Open diary", "ڈائری کھولیں")}
              <ArrowRight size={16} />
            </button>
          </div>
          {latest ? (
            <>
              <span className="tag">{latest.date}</span>
              <h3>{latest.title}</h3>
              <p className="truncate">
                {latest.note || t("No notes recorded.", "کوئی نوٹ درج نہیں۔")}
              </p>
            </>
          ) : (
            <Empty>
              {t(
                "Start with a daily check-in or an attack record.",
                "روزانہ اندراج یا دورہ درج کرنے سے آغاز کریں۔",
              )}
            </Empty>
          )}
        </Card>
        <Card className="learn-card">
          <span className="eyebrow">
            {t("A LITTLE UNDERSTANDING", "تھوڑی سی آگاہی")}
          </span>
          <h2>
            {t("Patterns are a starting point.", "رجحانات گفتگو کا آغاز ہیں۔")}
          </h2>
          <p>
            {t(
              "An association is not a cause. Learn what a diary can—and cannot—tell you.",
              "تعلق وجہ ثابت نہیں کرتا۔ جانیں کہ ڈائری کیا بتا سکتی ہے اور کیا نہیں۔",
            )}
          </p>
          <button className="text-button" onClick={() => p.go("learn")}>
            {t("Learn about migraine", "مائیگرین کے بارے میں جانیں")}
            <ArrowRight size={16} />
          </button>
        </Card>
      </div>
      <Definitions />
    </>
  );
}
function Bars({
  rows,
  max,
  unit,
}: {
  rows: { label: string; value: number }[];
  max: number;
  unit: string;
}) {
  const t = useT();
  return rows.length ? (
    <div className="bar-chart">
      {rows.map((r, i) => (
        <div className="bar-row" key={i}>
          <span>{r.label}</span>
          <div className="bar-track">
            <div style={{ width: `${Math.max(1, (r.value / max) * 100)}%` }} />
          </div>
          <b>
            {value(r.value)} {unit}
          </b>
        </div>
      ))}
    </div>
  ) : (
    <p className="muted">
      {t(
        "Not available — no observations.",
        "دستیاب نہیں — مشاہدات موجود نہیں۔",
      )}
    </p>
  );
}
export function Patterns(p: Props) {
  const t = useT();
  const s = summarize(p.data, p.from, p.to, zone(p.mode));
  const meals = (v: string) =>
    s.all.filter(
      (d) => d.daily?.meals === v && ["headache", "free"].includes(d.kind),
    );
  return (
    <>
      <Notice>
        {t(
          "Recorded patterns, not confirmed triggers. Small self-reported datasets can be misleading. Associations do not establish causes.",
          "درج کردہ رجحانات تصدیق شدہ محرکات نہیں۔ مختصر ذاتی ریکارڈ گمراہ کن ہوسکتا ہے۔ تعلق وجہ ثابت نہیں کرتا۔",
        )}
      </Notice>
      <Card>
        <h2>
          {t(
            "Reported headache days over time",
            "وقت کے ساتھ درج شدہ سر درد والے دن",
          )}
        </h2>
        <Timeline {...p} />
      </Card>
      <Card>
        <h2>
          {t("Daily peak pain ratings", "روزانہ درد کی بلند ترین درجہ بندی")}
        </h2>
        <p>
          {t(
            "Recorded diary measures, not a diagnostic score. Skipped ratings are not treated as zero; these daily entries do not add timed attacks.",
            "یہ ڈائری کے درج کردہ پیمانے ہیں، تشخیصی اسکور نہیں۔ خالی درجہ بندی صفر نہیں؛ ان اندراجات سے الگ وقت والے دورے شامل نہیں ہوتے۔",
          )}
        </p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t("Date", "تاریخ")}</th>
                <th>{t("Peak pain / 10", "سب سے زیادہ درد / 10")}</th>
              </tr>
            </thead>
            <tbody>
              {p.data.days
                .filter(
                  (d) =>
                    d.date >= p.from &&
                    d.date <= p.to &&
                    d.checkIn &&
                    d.checkIn.peakPain !== null,
                )
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((d) => (
                  <tr key={d.id}>
                    <td>{d.date}</td>
                    <td>{d.checkIn!.peakPain}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {!p.data.days.some(
          (d) =>
            d.date >= p.from &&
            d.date <= p.to &&
            d.checkIn &&
            d.checkIn.peakPain !== null,
        ) && (
          <p>
            {t(
              "No daily pain ratings recorded in this range.",
              "اس مدت میں درد کی روزانہ درجہ بندی درج نہیں۔",
            )}
          </p>
        )}
      </Card>
      <div className="two-col">
        <Card>
          <h2>{t("Recorded attack intensity", "درج شدہ دوروں کی شدت")}</h2>
          <Bars
            rows={s.attacks.map((a) => ({
              label: localTime(a.start, p.mode).replace("T", " "),
              value: a.pain,
            }))}
            max={10}
            unit="/10"
          />
        </Card>
        <Card>
          <h2>{t("Completed attack duration", "مکمل دوروں کا دورانیہ")}</h2>
          <p className="small muted">
            {t(
              "Full duration; ongoing attacks excluded.",
              "پورا دورانیہ؛ جاری دورے شامل نہیں۔",
            )}
          </p>
          <Bars
            rows={s.completed.map((a) => ({
              label: localTime(a.start, p.mode).replace("T", " "),
              value: (Date.parse(a.end!) - Date.parse(a.start)) / 3600000,
            }))}
            max={Math.max(
              1,
              ...s.completed.map(
                (a) => (Date.parse(a.end!) - Date.parse(a.start)) / 3600000,
              ),
            )}
            unit={t("h", "گھنٹے")}
          />
        </Card>
      </div>
      <Card>
        <h2>
          {t("Sleep alongside headache status", "نیند اور سر درد کی حالت")}
        </h2>
        <Bars
          rows={s.all
            .filter(
              (d) => d.daily?.sleep !== null && d.daily?.sleep !== undefined,
            )
            .map((d) => ({
              label: `${d.date} · ${d.kind === "headache" ? t("Headache", "سر درد") : d.kind === "free" ? t("Headache-free", "سر درد نہیں") : t("Not sure", "یقین نہیں")}`,
              value: d.daily!.sleep!,
            }))}
          max={24}
          unit={t("h", "گھنٹے")}
        />
      </Card>
      <Card>
        <h2>
          {t("Meals: a descriptive comparison", "کھانا: ایک وضاحتی موازنہ")}
        </h2>
        <div className="two-col">
          {["yes", "no"].map((v) => {
            const all = meals(v);
            return (
              <div className="comparison" key={v}>
                <span>
                  {v === "yes"
                    ? t("With skipped meals", "کھانا چھوڑنے والے دن")
                    : t("Without skipped meals", "کھانا نہ چھوڑنے والے دن")}
                </span>
                <strong>
                  {all.filter((d) => d.kind === "headache").length} /{" "}
                  {all.length}
                </strong>
                <p>
                  {t(
                    "headache days / days with known headache and meal status",
                    "سر درد والے دن / واضح سر درد اور کھانے کی حالت والے دن",
                  )}
                </p>
              </div>
            );
          })}
        </div>
        <p className="small">
          {t(
            "Missing meal responses and uncertain headache status are excluded. Insufficient recorded data to infer a relationship; these counts describe only your entries.",
            "کھانے کا جواب نہ ہونے اور سر درد کی غیر یقینی حالت والے دن خارج ہیں۔ تعلق اخذ کرنے کے لیے ناکافی ریکارڈ؛ یہ صرف درج کردہ اعداد ہیں۔",
          )}
        </p>
      </Card>
      <Card>
        <h2>{t("Accessible daily data", "روزانہ اعداد کی قابل رسائی جدول")}</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t("Date", "تاریخ")}</th>
                <th>{t("Status", "حالت")}</th>
                <th>{t("Sleep (hours)", "نیند (گھنٹے)")}</th>
                <th>{t("Attacks", "دورے")}</th>
              </tr>
            </thead>
            <tbody>
              {s.all.map((d) => (
                <tr key={d.date}>
                  <td>{d.date}</td>
                  <td>
                    {d.kind === "headache"
                      ? t("Headache", "سر درد")
                      : d.kind === "free"
                        ? t("Headache-free", "سر درد نہیں")
                        : d.kind === "unsure"
                          ? t("Not sure", "یقین نہیں")
                          : t("Unrecorded", "درج نہیں")}
                  </td>
                  <td>{d.daily?.sleep ?? "—"}</td>
                  <td>{d.attacks.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Definitions />
    </>
  );
}
export function Summary(p: Props) {
  const t = useT();
  const s = summarize(p.data, p.from, p.to, zone(p.mode));
  const days = p.data.days.filter((d) => d.date >= p.from && d.date <= p.to);
  const [notes, setNotes] = useState<string[]>([]);
  const noteEntries = [...days, ...s.attacks].filter((d) => d.notes);
  return (
    <>
      <div className="row end no-print">
        <button
          onClick={() =>
            download(
              "migramap-" + p.mode + ".csv",
              csv({ days, attacks: s.attacks }),
              "text/csv;charset=utf-8",
            )
          }
        >
          {t("Export CSV", "CSV برآمد کریں")}
        </button>
        <button
          className="primary"
          onClick={() => {
            const details = Array.from(
              document.querySelectorAll<HTMLDetailsElement>(".report details"),
            );
            const previous = details.map((d) => d.open);
            details.forEach((d) => (d.open = true));
            window.print();
            details.forEach((d, i) => (d.open = previous[i]));
          }}
        >
          {t("Print / Save as PDF", "پرنٹ / PDF محفوظ کریں")}
        </button>
      </div>
      <article className="report">
        <h2>
          {t(
            "MigraMap · Clinician summary",
            "مائیگرا میپ · معالج کے لیے خلاصہ",
          )}
        </h2>
        <p>
          {p.from} — {p.to} · {zone(p.mode)} ·{" "}
          {p.mode === "demo"
            ? t("Fictional demo data", "فرضی نمائشی ڈیٹا")
            : t("Personal diary", "ذاتی ڈائری")}
        </p>
        <Notice>
          {t(
            "Self-reported diary for discussion with a healthcare professional. Not a diagnosis, clinical record system, or treatment recommendation.",
            "ماہر صحت سے گفتگو کے لیے ذاتی ریکارڈ۔ یہ تشخیص، طبی ریکارڈ کا نظام یا علاج کی تجویز نہیں۔",
          )}
        </Notice>
        <Stats {...p} />
        <Card>
          <h2>{t("Daily check-in records", "روزانہ کے اندراجات")}</h2>
          <p>
            {t(
              "Pain ratings are diary measures, not a diagnostic score. These check-ins are separate from timed attack statistics below.",
              "درد کی درجہ بندی ڈائری کا پیمانہ ہے، تشخیصی اسکور نہیں۔ یہ اندراجات نیچے الگ وقت والے دوروں کے اعداد سے جدا ہیں۔",
            )}
          </p>
          {days.length ? (
            days.map((day) => (
              <section className="entry" key={day.id}>
                <h3>
                  {day.date} ·{" "}
                  {day.headache === "no"
                    ? t("Headache-free", "سر درد نہیں")
                    : day.headache === "yes"
                      ? t("Headache", "سر درد")
                      : t("Not sure", "پتا نہیں")}
                </h3>
                <p>
                  {t("Sleep (hours)", "نیند (گھنٹے)")}: {day.sleep ?? "—"} ·{" "}
                  {t("Meals skipped", "کھانا چھوڑا")}:{" "}
                  {day.meals === "yes"
                    ? t("Yes", "ہاں")
                    : day.meals === "no"
                      ? t("No", "نہیں")
                      : t("Not recorded", "درج نہیں")}
                </p>
                <CheckInDetails day={day} mode={p.mode} />
              </section>
            ))
          ) : (
            <p>
              {t("No check-ins in this range.", "اس مدت میں کوئی اندراج نہیں۔")}
            </p>
          )}
        </Card>
        <Card>
          <h2>{t("Recorded observations", "درج کردہ مشاہدات")}</h2>
          <p>
            {t("Mean intensity", "اوسط شدت")}:{" "}
            {s.intensity === null
              ? t("Not available", "دستیاب نہیں")
              : `${value(s.intensity)} / 10`}{" "}
            ({s.attacks.length} {t("attacks", "دورے")})
          </p>
          <p>
            {t("Mean completed duration", "مکمل دوروں کا اوسط دورانیہ")}:{" "}
            {s.duration === null
              ? t("Not available", "دستیاب نہیں")
              : `${value(s.duration)} ${t("hours", "گھنٹے")}`}{" "}
            ({s.completed.length} {t("completed attacks", "مکمل دورے")})
          </p>
          <p>
            {t("Uncertain recorded days", "غیر یقینی درج شدہ دن")}: {s.unsure} ·{" "}
            {t("Conflicting days", "متضاد دن")}: {s.conflicts}
          </p>
        </Card>
        <Card>
          <h2>
            {t(
              "Symptoms and medication records",
              "علامات اور ادویات کا ریکارڈ",
            )}
          </h2>
          {s.attacks.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{t("Start / end", "شروع / اختتام")}</th>
                    <th>{t("Symptoms", "علامات")}</th>
                    <th>{t("Medication as recorded", "درج کردہ دوا")}</th>
                  </tr>
                </thead>
                <tbody>
                  {s.attacks.map((a) => (
                    <tr key={a.id}>
                      <td>
                        {localTime(a.start, p.mode).replace("T", " ")}
                        <br />
                        {a.end
                          ? localTime(a.end, p.mode).replace("T", " ")
                          : t("Ongoing", "جاری")}
                      </td>
                      <td>
                        {a.symptoms.map((x) => t(x, symptomUr[x])).join(", ") ||
                          t("Not recorded", "درج نہیں")}
                      </td>
                      <td>
                        {a.medication || t("Not recorded", "درج نہیں")}
                        <br />
                        {a.dose}
                        <br />
                        {a.taken
                          ? localTime(a.taken, p.mode).replace("T", " ")
                          : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>
              {t(
                "No attacks recorded in this range.",
                "اس مدت میں کوئی دورہ درج نہیں۔",
              )}
            </p>
          )}
        </Card>
        <Card>
          <h2>
            {t("Notes selected for discussion", "گفتگو کے لیے منتخب نوٹس")}
          </h2>
          <p className="no-print muted">
            {t(
              "Choose the notes to include in the printed report. CSV exports include all notes in range.",
              "پرنٹ میں شامل کرنے کے لیے نوٹس منتخب کریں۔ CSV میں مدت کے تمام نوٹس شامل ہیں۔",
            )}
          </p>
          {noteEntries.length ? (
            noteEntries.map((d) => (
              <div
                key={d.id}
                className={
                  notes.includes(d.id) ? "note-row" : "note-row no-print"
                }
              >
                <label className="check">
                  <input
                    className="no-print"
                    type="checkbox"
                    checked={notes.includes(d.id)}
                    onChange={(e) =>
                      setNotes(
                        e.target.checked
                          ? [...notes, d.id]
                          : notes.filter((n) => n !== d.id),
                      )
                    }
                  />
                  <span>
                    <b>{"date" in d ? d.date : localTime(d.start, p.mode)}</b>
                    <br />
                    {d.notes}
                  </span>
                </label>
              </div>
            ))
          ) : (
            <p>{t("No notes recorded.", "کوئی نوٹ درج نہیں۔")}</p>
          )}
          {!notes.length && (
            <p>{t("No notes selected.", "کوئی نوٹ منتخب نہیں۔")}</p>
          )}
        </Card>
        <Card>
          <h2>{t("Definitions and limitations", "تعریفیں اور حدود")}</h2>
          <Definitions />
          <p>
            {t(
              "Self-reported data may be incomplete or inaccurate. This student prototype is not clinically validated. No causal or diagnostic conclusions can be drawn from these summaries.",
              "ذاتی معلومات نامکمل یا غلط ہوسکتی ہیں۔ اس طالب علمی نمونے کی طبی توثیق نہیں ہوئی۔ ان خلاصوں سے تشخیص یا وجہ اخذ نہیں کی جاسکتی۔",
            )}
          </p>
        </Card>
      </article>
    </>
  );
}
