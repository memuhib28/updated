import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  type Attack,
  type Data,
  type Day,
  type Mode,
  dateKey,
  dates,
  empty,
  shiftDate,
  zone,
} from "./core";
import { readData, writeData } from "./db";
import { LanguageContext, useT, useErrorText } from "./i18n";
import {
  ArrowRight,
  Card,
  Confirm,
  Field,
  icons,
  Menu,
  Notice,
  Plus,
  ShieldCheck,
  X,
} from "./components";
import { AttackForm } from "./forms";
import { Patterns, Summary } from "./insights";
import { Diary } from "./diary";
import { Learn } from "./education";
import { Settings } from "./settings";
import "./style.css";
import "./theme.css";
import "./pink.css";


import {PinkDashboard,PinkReports,ProfilePanel} from "./pink-ui";
import {House,CalendarDays,ChartColumn,UserRound,Zap} from "lucide-react";
import { CheckInForm, BrainMark } from "./checkin";
import { Onboarding } from "./onboarding";
function getPref(key: string, fallback: string) {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}
function setPref(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* Preferences are optional; diary storage errors are surfaced separately. */
  }
}
export function App() {
  const [ur, setUr] = useState(getPref("migramap-language", "en") === "ur");
  useEffect(() => {
    document.documentElement.lang = ur ? "ur" : "en";
    document.documentElement.dir = ur ? "rtl" : "ltr";
    setPref("migramap-language", ur ? "ur" : "en");
  }, [ur]);
  return (
    <LanguageContext.Provider value={ur}>
      <Shell ur={ur} setUr={setUr}/>
    </LanguageContext.Provider>
  );
}
function Shell({ ur, setUr }: { ur: boolean; setUr: (v: boolean) => void }) {
  const t = useT();
  const errorText = useErrorText();
  const [saving, setSaving] = useState(false);
  const mode: Mode = "personal";
  const [page, setPage] = useState("dashboard");
  const [welcome, setWelcome] = useState(
    getPref("migramap-onboarding-v1", "") !== "done",
  );
  const [data, setData] = useState<Data>(empty());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [mobile, setMobile] = useState(false);
  const [editingDay, setEditingDay] = useState<Day>();
  const [editingAttack, setEditingAttack] = useState<Attack>();
  const [newDate, setNewDate] = useState<string>();
  const [confirm, setConfirm] = useState<{
    title: string;
    body: string;
    action: () => Promise<void>;
  } | null>(null);
  const today = dateKey(new Date(), zone(mode));
  const [range, setRange] = useState({
    from: shiftDate(today, -27),
    to: today,
  });
  const [draftRange, setDraftRange] = useState(range);
  const [rangeError, setRangeError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    readData(mode)
      .then(async (d) => {
        await writeData(mode, d);
        if (active) {
          setData(d);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (active) {
          setError(errorText((e as Error).message));
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [mode, retry]);
  useEffect(() => {
    if (!saved) return;
    const id = setTimeout(() => setSaved(""), 4500);
    return () => clearTimeout(id);
  }, [saved]);
  const save = async (d: Data) => {
    setSaving(true);
    try {
      await writeData(mode, d);
      setData(d);
      setSaved(
        t(
          "Changes saved on this device.",
          "تبدیلیاں اسی ڈیوائس پر محفوظ ہوگئیں۔",
        ),
      );
    } finally {
      setSaving(false);
    }
  };
  const go = (p: string) => {
    setPage(p);
    setMobile(false);
    if (p === "day") {
      setEditingDay(undefined);
      setNewDate(undefined);
    }
    if (p === "attack") setEditingAttack(undefined);
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  };
  const nav: [string, string, string][] = [
    ["dashboard", "Dashboard", "ڈیش بورڈ"],
    ["day", "My Headache Check-in", "دن درج کریں"],
    ["attack", "Add an Attack", "دورہ شامل کریں"],
    ["diary", "Calendar", "کیلنڈر"],
    ["reports", "Reports", "رپورٹس"],
    ["patterns", "Patterns", "رجحانات"],
    ["summary", "My Summary", "معالج کا خلاصہ"],
    ["learn", "Learn About Migraine", "مائیگرین کی آگاہی"],
    ["settings", "Profile", "پروفائل"],
  ];
  const current = nav.find((n) => n[0] === page)!;
  const props = { data, mode, ...range };
  const finishOnboarding = async () => {
    setPref("migramap-onboarding-v1", "done");
    setWelcome(false);
    go("dashboard");
  };
  if (welcome && !loading && !error)
    return (
      <Onboarding
        data={data}
        onSave={async d => { await save(d); await finishOnboarding(); }}
        onDone={finishOnboarding}
        ur={ur}
        setUr={setUr}
      />
    );
  return (
    <div className="app">
      <a className="skip-link" href="#main">
        {t("Skip to content", "مواد پر جائیں")}
      </a>
      <aside className={"sidebar " + (mobile ? "open" : "")}>
        <div className="brand">
          <button
            className="brand-home"
            aria-label={t("MigraMap home", "مائیگرا میپ ہوم")}
            onClick={() => go("dashboard")}
          >
            <span className="brand-mark">
              <BrainMark />
            </span>
            <div>
              Migra<span>Map</span>
              <small>
                {t("From Signals to Patterns", "روزانہ مشاہدات سے رجحانات تک")}
              </small>
            </div>
          </button>
          <button
            className="mobile-only icon-button"
            aria-label={t("Close navigation", "راستے بند کریں")}
            onClick={() => setMobile(false)}
          >
            <X />
          </button>
        </div>
        <span className="nav-label">
          {t("YOUR EVERYDAY COMPANION", "آپ کا روزمرہ ساتھی")}
        </span>
        <nav aria-label={t("Main navigation", "مرکزی راستے")}>
          {nav.map(([id, en, u], i) => {
            const Icon = id==="reports"?ChartColumn:icons[id as keyof typeof icons];
            return (
              <React.Fragment key={id}>
                {i === 6 && (
                  <span className="nav-label section-label">
                    {t("LEARN & EXPLORE", "جانیں اور دریافت کریں")}
                  </span>
                )}
                <button
                  className={page === id ? "active" : ""}
                  aria-current={page === id ? "page" : undefined}
                  onClick={() => go(id)}
                >
                  <Icon size={19} strokeWidth={1.7} />
                  <span>{t(en, u)}</span>
                  {page === id && <i />}
                </button>
              </React.Fragment>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <ShieldCheck size={20} />
          <b>{t("Local. Personal. Yours.", "ذاتی۔ آپ کا۔")}</b>
          <p>
            {t(
              "Your diary stays in this browser.",
              "آپ کی ڈائری اسی براؤزر میں رہتی ہے۔",
            )}
          </p>
          <button className="text-button" onClick={() => go("settings")}>
            {t("Manage your data", "اپنا ڈیٹا سنبھالیں")}
            <ArrowRight size={14} />
          </button>
        </div>
      </aside>
      {mobile && (
        <button
          className="sidebar-scrim"
          aria-label={t("Close navigation", "راستے بند کریں")}
          onClick={() => setMobile(false)}
        />
      )}
      <div className="workspace">
        <header className="topbar">
          <div className="row">
            <button
              className="icon-button mobile-only"
              aria-label={t("Open navigation", "راستے کھولیں")}
              onClick={() => setMobile(true)}
            >
              <Menu />
            </button>
            <button
              className="mobile-brand"
              aria-label={t("MigraMap home", "مائیگرا میپ ہوم")}
              dir="ltr"
              onClick={() => go("dashboard")}
            >
              <BrainMark />
              <strong>
                Migra<span>Map</span>
              </strong>
            </button>
            <span className="breadcrumb">
              {t("Your wellbeing journal", "آپ کی کیفیت کی ڈائری")}
              <span>/</span>
              <b>{t(current[1], current[2])}</b>
            </span>
          </div>
          <div className="row">
            <button className="language-button" onClick={() => setUr(!ur)}>
              {ur ? "English" : "اردو"} <span>◎</span>
            </button>
          </div>
        </header>
        <main id="main" tabIndex={-1}>
          <div className="page-heading">
            <div>
              <span className="eyebrow">
                {t("MIGRAMAP / YOUR DIARY", "مائیگرا میپ / آپ کی ڈائری")}
              </span>
              <h1>
                {page === "dashboard"
                  ? t(
                      "Dashboard",
                      "ڈیش بورڈ",
                    )
                  : t(current[1], current[2])}
              </h1>
              <p>
                {page === "dashboard"
                  ? t(
                      "Track your days. Understand your patterns.",
                      "اپنے دن درج کریں۔ اپنے رجحانات سمجھیں۔",
                    )
                  : t(
                      "A thoughtful record, one observation at a time.",
                      "سوچ سمجھ کر کیا گیا ریکارڈ، ایک وقت میں ایک مشاہدہ۔",
                    )}
              </p>
            </div>
            {page === "dashboard" && (
              <div className="dashboard-actions"><button className="primary desktop-checkin" onClick={() => go("day")}><Plus size={17}/>{t("Record your day", "اپنا دن درج کریں")}</button><button onClick={() => go("attack")}>
                <Plus size={17} />
                {t("Add an attack", "دورہ شامل کریں")}
              </button></div>
            )}
          </div>
          {["diary", "reports", "patterns", "summary"].includes(page) && (
            <form
              className="date-filter no-print"
              onSubmit={(e) => {
                e.preventDefault();
                try {
                  dates(draftRange.from, draftRange.to);
                  if (draftRange.to > today)
                    throw Error(
                      t(
                        "End date cannot be in the future.",
                        "اختتامی تاریخ مستقبل میں نہیں ہوسکتی۔",
                      ),
                    );
                  setRange(draftRange);
                  setRangeError("");
                } catch (e) {
                  setRangeError(errorText((e as Error).message));
                }
              }}
            >
              <div className="row wrap">
                <Field label={t("From", "سے")}>
                  <input
                    aria-label={t("From", "سے")}
                    required
                    type="date"
                    max={today}
                    value={draftRange.from}
                    onChange={(e) =>
                      setDraftRange({ ...draftRange, from: e.target.value })
                    }
                  />
                </Field>
                <Field label={t("To", "تک")}>
                  <input
                    aria-label={t("To", "تک")}
                    required
                    type="date"
                    max={today}
                    value={draftRange.to}
                    onChange={(e) =>
                      setDraftRange({ ...draftRange, to: e.target.value })
                    }
                  />
                </Field>
                <button>{t("Apply range", "مدت لاگو کریں")}</button>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => {
                    const r = { from: shiftDate(today, -27), to: today };
                    setRange(r);
                    setDraftRange(r);
                    setRangeError("");
                  }}
                >
                  {t("Last 28 days", "گزشتہ 28 دن")}
                </button>
              </div>
              <span className="small muted">{zone(mode)}</span>
              {rangeError && <p role="alert">{rangeError}</p>}
            </form>
          )}
          {saved && (
            <div className="toast" role="status">
              ✓ {saved}
            </div>
          )}
          {loading ? (
            <Card>
              <p role="status">
                {t(
                  "Opening your local diary…",
                  "آپ کی مقامی ڈائری کھل رہی ہے…",
                )}
              </p>
            </Card>
          ) : error ? (
            <Notice kind="error">
              <p role="alert">{error}</p>
              <button onClick={() => setRetry(retry + 1)}>
                {t("Retry storage", "ذخیرہ دوبارہ کھولیں")}
              </button>
            </Notice>
          ) : (
            <>
              {page === "dashboard" && <PinkDashboard {...props} go={go} save={save} onDate={date=>{const entry=data.days.find(d=>d.date===date);setEditingDay(entry);setNewDate(date);setPage("day")}}/>}{" "}
              {page === "day" && (
                <CheckInForm
                  key={editingDay?.id ?? newDate ?? "new-day"}
                  data={data}
                  mode={mode}
                  entry={editingDay}
                  date={newDate}
                  onSummary={() => go("summary")}
                  onSave={save}
                  onDone={() => go("diary")}
                />
              )}{" "}
              {page === "attack" && (
                <AttackForm
                  key={editingAttack?.id ?? "new-attack"}
                  data={data}
                  mode={mode}
                  entry={editingAttack}
                  onSave={save}
                  onDone={() => go("diary")}
                />
              )}{" "}
              {page === "diary" && (
                <Diary
                  {...props}
                  onEditDay={(d) => {
                    setEditingDay(d);
                    setPage("day");
                  }}
                  onEditAttack={(a) => {
                    setEditingAttack(a);
                    setPage("attack");
                  }}
                  onNewDay={(date) => {
                    setEditingDay(undefined);
                    setNewDate(date);
                    setPage("day");
                  }}
                  onDelete={(kind, id) =>
                    setConfirm({
                      title: t("Delete this entry?", "یہ اندراج حذف کریں؟"),
                      body: t(
                        "This entry will be removed from the current mode. This cannot be undone without a backup.",
                        "یہ اندراج موجودہ موڈ سے حذف ہوگا۔ بیک اپ کے بغیر واپس نہیں ہوسکتا۔",
                      ),
                      action: () =>
                        save({
                          ...data,
                          [kind]: data[kind].filter((d) => d.id !== id),
                        }),
                    })
                  }
                />
              )}{" "}
              {page === "reports" && <PinkReports {...props} go={go}/>}{page === "patterns" && <Patterns {...props} />}{" "}
              {page === "summary" && <Summary {...props} />}{" "}
              {page === "learn" && <Learn />}
              {page === "settings" && (
                <ProfilePanel ur={ur} setUr={setUr}><Settings
                  key={mode}
                  data={data}
                  mode={mode}
                  save={save}
                /></ProfilePanel>
              )}
            </>
          )}
          <footer>
            {t(
              "Made for understanding. Designed with care.",
              "سمجھنے کے لیے بنایا گیا۔ احتیاط سے ترتیب دیا گیا۔",
            )}
            <span>
              {t(
                "Student prototype · Not a diagnostic tool",
                "طالب علمی نمونہ · تشخیص کا آلہ نہیں",
              )}
            </span>
          </footer>
        </main>
      </div>
      <nav
        className="bottom-nav"
        aria-label={t("Quick navigation", "فوری راستے")}
      >
        {([{id:'dashboard',en:'Dashboard',ur:'ڈیش بورڈ',Icon:House},{id:'diary',en:'Calendar',ur:'کیلنڈر',Icon:CalendarDays},{id:'reports',en:'Reports',ur:'رپورٹس',Icon:ChartColumn},{id:'settings',en:'Profile',ur:'پروفائل',Icon:UserRound}]).map(({id,en,ur:u,Icon})=><button key={id} aria-current={page===id?'page':undefined} className={page===id?'active':''} onClick={()=>go(id)}><Icon size={23}/><span>{t(en,u)}</span></button>)}
      </nav>
      <button className="quick-checkin" aria-label={t("Quick check-in","فوری اندراج")} onClick={()=>go("day")}><Zap size={27}/></button>
      {confirm && (
        <Confirm
          title={confirm.title}
          body={confirm.body}
          onConfirm={confirm.action}
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <main>
        <h1>MigraMap</h1>
        <p>
          The page could not be displayed. Your saved diary has not been
          deleted. Reload to retry.
        </p>
        <button onClick={() => location.reload()}>
          Reload / دوبارہ کھولیں
        </button>
      </main>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
