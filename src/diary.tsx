import { CheckInDetails } from "./checkin";
import { useState } from "react";
import {
  type Attack,
  type Data,
  type Day,
  type Mode,
  dateKey,
  dates,
  localTime,
  shiftDate,
  status,
  symptoms,
  zone,
} from "./core";
import {
  Card,
  ChevronLeft,
  ChevronRight,
  Empty,
  Field,
  Notice,
  Plus,
} from "./components";
import { symptomUr, useT } from "./i18n";
export function Diary({
  data,
  mode,
  from,
  to,
  onEditDay,
  onEditAttack,
  onDelete,
  onNewDay,
}: {
  data: Data;
  mode: Mode;
  from: string;
  to: string;
  onEditDay: (d: Day) => void;
  onEditAttack: (a: Attack) => void;
  onDelete: (kind: "days" | "attacks", id: string) => void;
  onNewDay: (date: string) => void;
}) {
  const t = useT();
  const [month, setMonth] = useState(to.slice(0, 7));
  const [selected, setSelected] = useState(to);
  const [view, setView] = useState("calendar");
  const [filter, setFilter] = useState("");
  const first = month + "-01";
  const last = shiftDate(
    new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 1))
      .toISOString()
      .slice(0, 10),
    -1,
  );
  const move = (n: number) => {
    const d = new Date(first + "T12:00:00Z");
    d.setUTCMonth(d.getUTCMonth() + n);
    setMonth(d.toISOString().slice(0, 7));
  };
  const label = (kind: string) =>
    kind === "headache"
      ? t("Headache", "سر درد")
      : kind === "free"
        ? t("Headache-free", "سر درد نہیں")
        : kind === "unsure"
          ? t("Not sure", "یقین نہیں")
          : t("Unrecorded", "درج نہیں");
  const rows = dates(from, to)
    .map((d) => ({ date: d, ...status(data, d, zone(mode)) }))
    .filter(
      (s) =>
        s.kind !== "unrecorded" &&
        (!filter ||
          s.daily?.checkIn?.symptoms.includes(filter) ||
          s.attacks.some((a) => a.symptoms.includes(filter))),
    );
  const chosen = status(data, selected, zone(mode));
  return (
    <>
      <div className="row between wrap">
        <div className="segmented">
          <button
            className={view === "calendar" ? "active" : ""}
            onClick={() => setView("calendar")}
          >
            {t("Calendar", "کیلنڈر")}
          </button>
          <button
            className={view === "list" ? "active" : ""}
            onClick={() => setView("list")}
          >
            {t("List", "فہرست")}
          </button>
        </div>
        <Field
          label={t("Filter by recorded symptom", "درج کردہ علامت سے فلٹر کریں")}
        >
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">{t("All symptoms", "تمام علامات")}</option>
            {symptoms.map((s) => (
              <option key={s} value={s}>
                {t(s, symptomUr[s])}
              </option>
            ))}
          </select>
        </Field>
      </div>
      {view === "calendar" ? (
        <Card>
          <div className="row between">
            <button
              className="icon-button"
              aria-label={t("Previous month", "پچھلا مہینہ")}
              onClick={() => move(-1)}
            >
              <ChevronLeft />
            </button>
            <h2>
              {new Date(first + "T12:00:00Z").toLocaleDateString(
                t("en-GB", "ur-PK"),
                { month: "long", year: "numeric", timeZone: "UTC" },
              )}
            </h2>
            <button
              className="icon-button"
              aria-label={t("Next month", "اگلا مہینہ")}
              onClick={() => move(1)}
            >
              <ChevronRight />
            </button>
          </div>
          <div className="calendar">
            {[
              t("Sun", "اتوار"),
              t("Mon", "پیر"),
              t("Tue", "منگل"),
              t("Wed", "بدھ"),
              t("Thu", "جمعرات"),
              t("Fri", "جمعہ"),
              t("Sat", "ہفتہ"),
            ].map((x) => (
              <small key={x}>{x}</small>
            ))}
            {Array.from(
              { length: new Date(first + "T12:00:00Z").getUTCDay() },
              (_, i) => (
                <span key={"blank" + i} />
              ),
            )}
            {dates(first, last).map((date) => {
              const s = status(data, date, zone(mode));
              const disabled =
                date < from ||
                date > to ||
                (!!filter &&
                  !s.attacks.some((a) => a.symptoms.includes(filter)));
              return (
                <button
                  disabled={disabled}
                  className={
                    "calendar-day " +
                    s.kind +
                    (date === selected ? " selected" : "")
                  }
                  key={date}
                  onClick={() => setSelected(date)}
                  aria-label={`${date}: ${label(s.kind)}`}
                >
                  <b>{Number(date.slice(-2))}</b>
                  <span>
                    {s.kind === "headache"
                      ? "●"
                      : s.kind === "free"
                        ? "✓"
                        : s.kind === "unsure"
                          ? "?"
                          : "—"}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="legend">
            <span>● {label("headache")}</span>
            <span>✓ {label("free")}</span>
            <span>? {label("unsure")}</span>
            <span>— {label("unrecorded")}</span>
          </div>
        </Card>
      ) : (
        <Card>
          {rows.length ? (
            rows.map((s) => (
              <button
                key={s.date}
                className={
                  "diary-row " + (selected === s.date ? "selected" : "")
                }
                onClick={() => setSelected(s.date)}
              >
                <span>{s.date}</span>
                <span className={"tag " + s.kind}>{label(s.kind)}</span>
                <span>
                  {s.attacks.length} {t("attacks", "دورے")}
                </span>
              </button>
            ))
          ) : (
            <Empty>
              {t(
                "No matching records in this date range.",
                "اس مدت میں کوئی متعلقہ اندراج نہیں۔",
              )}
            </Empty>
          )}
        </Card>
      )}
      <Card>
        <div className="row between wrap">
          <h2>
            {selected} · {label(chosen.kind)}
          </h2>
          {!chosen.daily && selected <= dateKey(new Date(), zone(mode)) && (
            <button onClick={() => onNewDay(selected)}>
              <Plus size={16} />
              {t("Record this day", "یہ دن درج کریں")}
            </button>
          )}
        </div>
        {chosen.conflict && (
          <Notice kind="warning">
            {t(
              "An attack overlaps a headache-free check-in. This day counts as a headache day; review your records.",
              "سر درد نہ ہونے کے اندراج کے ساتھ دورہ موجود ہے۔ یہ دن سر درد والا شمار ہوگا؛ اندراج دیکھیں۔",
            )}
          </Notice>
        )}
        {chosen.daily && (
          <div className="entry">
            <h3>{t("Daily check-in", "روزانہ اندراج")}</h3>
            <dl className="details">
              <dt>{t("Sleep", "نیند")}</dt>
              <dd>
                {chosen.daily.sleep ?? t("Not recorded", "درج نہیں")}{" "}
                {chosen.daily.sleep !== null ? t("hours", "گھنٹے") : ""} ·{" "}
                {chosen.daily.quality === "Good"
                  ? t("Good", "اچھا")
                  : chosen.daily.quality === "Fair"
                    ? t("Fair", "درمیانہ")
                    : chosen.daily.quality === "Poor"
                      ? t("Poor", "خراب")
                      : "—"}
              </dd>
              <dt>{t("Meals skipped", "کھانا چھوڑا")}</dt>
              <dd>
                {chosen.daily.meals === "unknown"
                  ? t("Not recorded", "درج نہیں")
                  : chosen.daily.meals === "yes"
                    ? t("Yes", "ہاں")
                    : t("No", "نہیں")}
              </dd>
              <dt>{t("Caffeine", "کیفین")}</dt>
              <dd>
                {chosen.daily.caffeine === null
                  ? t("Not recorded", "درج نہیں")
                  : `${chosen.daily.caffeine} mg`}
              </dd>
              <dt>{t("Possible exposures", "ممکنہ کیفیات")}</dt>
              <dd>{chosen.daily.exposures || "—"}</dd>
              <dt>{t("Notes", "نوٹس")}</dt>
              <dd>{chosen.daily.notes || "—"}</dd>
            </dl>
            <CheckInDetails day={chosen.daily} mode={mode} />
            <div className="row">
              <button onClick={() => onEditDay(chosen.daily!)}>
                {t("Edit check-in", "اندراج میں ترمیم")}
              </button>
              <button
                className="text-danger"
                onClick={() => onDelete("days", chosen.daily!.id)}
              >
                {t("Delete check-in", "اندراج حذف کریں")}
              </button>
            </div>
          </div>
        )}
        {chosen.attacks.map((a) => (
          <div className="entry" key={a.id}>
            <div className="row between wrap">
              <h3>{t("Recorded attack", "درج کردہ دورہ")}</h3>
              <span className="tag headache">{a.pain}/10</span>
            </div>
            <p dir="ltr">
              {localTime(a.start, mode).replace("T", " ")} →{" "}
              {a.end
                ? localTime(a.end, mode).replace("T", " ")
                : t("Ongoing", "جاری")}
            </p>
            <p>
              {a.symptoms.map((s) => t(s, symptomUr[s])).join(" · ") ||
                t("No symptoms recorded", "علامات درج نہیں")}
            </p>
            <p>
              {a.location} {a.description}
            </p>
            {(a.medication || a.dose || a.taken) && (
              <p>
                {t("Medication record", "دوا کا ریکارڈ")}: {a.medication || "—"}{" "}
                · {a.dose || "—"} ·{" "}
                {a.taken ? localTime(a.taken, mode).replace("T", " ") : "—"}
              </p>
            )}
            <p className="prewrap">{a.notes}</p>
            <div className="row">
              <button onClick={() => onEditAttack(a)}>
                {t("Edit attack", "دورے میں ترمیم")}
              </button>
              <button
                className="text-danger"
                onClick={() => onDelete("attacks", a.id)}
              >
                {t("Delete attack", "دورہ حذف کریں")}
              </button>
            </div>
          </div>
        ))}
        {!chosen.daily && !chosen.attacks.length && (
          <p className="muted">
            {t(
              "No diary information. This is not a headache-free day.",
              "ڈائری کی معلومات نہیں۔ اسے سر درد سے پاک دن نہیں سمجھا جاتا۔",
            )}
          </p>
        )}
      </Card>
    </>
  );
}
