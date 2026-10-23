import { useEffect, useState } from "react";
import {
  Brain,
  GitBranch,
  NotebookPen,
  Pause,
  Play,
  RotateCcw,
  Wind,
} from "lucide-react";
import { Card, Notice } from "./components";
import { useT } from "./i18n";
import { project } from "./config";
export function Animation() {
  const t = useT();
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [narrate, setNarrate] = useState(true);
  const [voiceMessage, setVoiceMessage] = useState("");
  const language = t("en", "ur");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    const update = () => setVoices(synth.getVoices());
    update();
    synth.addEventListener("voiceschanged", update);
    return () => {
      synth.removeEventListener("voiceschanged", update);
      synth.cancel();
    };
  }, []);
  const [reduce, setReduce] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const scenes = [
    {
      icon: Brain,
      title: t("01 · Susceptibility", "01 · حساسیت"),
      text: t(
        "Genetic susceptibility and nervous-system processes contribute to migraine, a neurological disorder.",
        "جینیاتی حساسیت اور اعصابی عمل مائیگرین، ایک اعصابی عارضے، میں کردار ادا کرتے ہیں۔",
      ),
    },
    {
      icon: Wind,
      title: t("02 · Possible triggers", "02 · ممکنہ محرکات"),
      text: t(
        "Experiences such as strong smells or changes in routine may precede attacks for some people. Possible triggers vary.",
        "بعض افراد میں تیز خوشبو یا معمول میں تبدیلی دورے سے پہلے ہوسکتی ہے۔ ممکنہ محرکات ہر فرد میں مختلف ہیں۔",
      ),
    },
    {
      icon: GitBranch,
      title: t("03 · Pain signalling", "03 · درد کے پیغامات"),
      text: t(
        "Trigeminal pathways and the signalling molecule CGRP are involved in migraine biology. This is a simplified concept, not an anatomical model.",
        "ٹرائی جیمینل اعصابی راستے اور پیغام رساں مادہ CGRP مائیگرین میں کردار ادا کرتے ہیں۔ یہ سادہ تصور ہے، جسمانی ساخت کا ماڈل نہیں۔",
      ),
    },
    {
      icon: NotebookPen,
      title: t("04 · Record, then discuss", "04 · درج کریں، پھر گفتگو کریں"),
      text: t(
        "A diary records experiences over time. Patterns can support a clinical conversation, but do not diagnose migraine or establish causes.",
        "ڈائری وقت کے ساتھ کیفیات درج کرتی ہے۔ رجحانات معالج سے گفتگو میں مدد دیتے ہیں، مگر مائیگرین کی تشخیص یا وجہ ثابت نہیں کرتے۔",
      ),
    },
  ];
  const sceneText = scenes[step].title + ". " + scenes[step].text;
  useEffect(() => {
    if (!playing) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    let watchdog: ReturnType<typeof setTimeout>;
    const next = () => {
      if (!active) return;
      active = false;
      clearTimeout(timer);
      clearTimeout(watchdog);
      if (step === 3) setPlaying(false);
      else setStep(step + 1);
    };
    const fallback = () => {
      clearTimeout(timer);
      timer = setTimeout(next, 6000);
    };
    const synth = window.speechSynthesis;
    const voice = voices.find((v) => v.lang.toLowerCase().startsWith(language));
    setVoiceMessage("");
    if (narrate && synth && window.SpeechSynthesisUtterance && voice) {
      const utterance = new SpeechSynthesisUtterance(sceneText);
      utterance.voice = voice;
      utterance.lang = voice.lang;
      utterance.rate = 0.9;
      utterance.onend = next;
      utterance.onerror = () => {
        if (active) {
          setVoiceMessage(
            language === "ur"
              ? "آواز نہیں چل سکی۔ تحریری مناظر جاری ہیں۔"
              : "Audio could not play. The text scenes will continue.",
          );
          fallback();
        }
      };
      synth.cancel();
      try {
        synth.resume();
        synth.speak(utterance);
        // A broken speech engine must never leave the lesson stuck on one scene.
        watchdog = setTimeout(
          () => {
            if (!active) return;
            setVoiceMessage(
              language === "ur"
                ? "آواز دستیاب نہیں۔ تحریری مناظر جاری ہیں۔"
                : "Narration did not finish. Continuing with text scenes.",
            );
            next();
            synth.cancel();
          },
          Math.max(20000, sceneText.split(/\s+/).length * 650),
        );
      } catch {
        setVoiceMessage(
          language === "ur"
            ? "آواز نہیں چل سکی۔ تحریری مناظر جاری ہیں۔"
            : "Audio could not play. The text scenes will continue.",
        );
        fallback();
      }
    } else {
      if (narrate)
        setVoiceMessage(
          language === "ur"
            ? "اس براؤزر میں اردو آواز دستیاب نہیں۔ تحریری مناظر جاری ہیں۔"
            : "No English voice is available in this browser. The text scenes will continue.",
        );
      fallback();
    }
    return () => {
      active = false;
      clearTimeout(timer);
      clearTimeout(watchdog);
      if (synth) synth.cancel();
    };
  }, [playing, step, narrate, language, sceneText, voices]);
  const Icon = scenes[step].icon;
  return (
    <Card className="animation-card">
      <div className="row between wrap">
        <h2>{t("Understanding the bigger picture", "بڑی تصویر کو سمجھیں")}</h2>
        <span className="tag">
          {t("Four scenes · optional narration", "چار مناظر · اختیاری آواز")}
        </span>
      </div>
      <div
        className={"animation-stage " + (playing && !reduce ? "playing" : "")}
      >
        <div className="signal-ring">
          <Icon size={82} strokeWidth={1.2} />
          <i />
          <i />
          <i />
        </div>
        <div>
          <span className="eyebrow">
            {t("MIGRAINE, EXPLAINED SIMPLY", "مائیگرین، آسان الفاظ میں")}
          </span>
          <h3>{scenes[step].title}</h3>
          <p aria-live="polite">{scenes[step].text}</p>
        </div>
      </div>
      <div className="scene-progress">
        {scenes.map((s, i) => (
          <button
            key={i}
            className={i === step ? "active" : ""}
            aria-label={s.title}
            aria-current={i === step ? "step" : undefined}
            onClick={() => {
              setStep(i);
            }}
          >
            <span />
            {i + 1}
          </button>
        ))}
      </div>
      <div className="row wrap">
        <button
          className="primary"
          onClick={() => {
            setPlaying(!playing);
          }}
        >
          {playing ? <Pause size={16} /> : <Play size={16} />}{" "}
          {playing ? t("Pause", "روکیں") : t("Play", "چلائیں")}
        </button>
        <button
          onClick={() => {
            setStep(0);
            setPlaying(false);
          }}
        >
          <RotateCcw size={16} />
          {t("Restart", "دوبارہ شروع")}
        </button>
        <label className="check">
          <input
            type="checkbox"
            checked={reduce}
            onChange={(e) => {
              setReduce(e.target.checked);
            }}
          />
          {t("Reduced motion: no animation", "کم حرکت: اینیمیشن بند")}
        </label>
      </div>
      <label className="check">
        <input
          type="checkbox"
          checked={narrate}
          onChange={(e) => setNarrate(e.target.checked)}
        />
        {t("Read scenes aloud", "مناظر بلند آواز میں پڑھیں")}
      </label>
      {voiceMessage && (
        <p role="status" className="small">
          {voiceMessage}
        </p>
      )}
      <p className="small muted">
        {t(
          "Play starts from the selected scene. Voice availability depends on your browser and installed languages.",
          "چلائیں منتخب منظر سے شروع ہوتا ہے۔ آواز کی دستیابی براؤزر اور نصب زبانوں پر منحصر ہے۔",
        )}
      </p>
      <details>
        <summary>{t("Read the transcript", "مکمل تحریر پڑھیں")}</summary>
        {scenes.map((s) => (
          <div key={s.title}>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
          </div>
        ))}
      </details>
    </Card>
  );
}
export function Learn() {
  const t = useT();
  return (
    <>
      <Notice>
        {t(
          "Educational information, not personal medical advice. Urdu medical wording requires supervisor and qualified translation review before use with patients.",
          "یہ تعلیمی معلومات ہیں، ذاتی طبی مشورہ نہیں۔ مریضوں کے استعمال سے پہلے اردو طبی متن کا نگران اور ماہر مترجم سے جائزہ ضروری ہے۔",
        )}
      </Notice>
      <Animation />
      <div className="two-col">
        {[
          [
            t("More than a headache", "سر درد سے بڑھ کر"),
            t(
              "Migraine is a neurological disorder. It can involve pain, nausea, vomiting, and sensitivity to light or sound. Not everyone experiences aura.",
              "مائیگرین اعصابی عارضہ ہے۔ درد، متلی، قے، روشنی یا آواز سے حساسیت ہوسکتی ہے۔ ہر شخص کو آورا نہیں ہوتا۔",
            ),
          ],
          [
            t("Biology and susceptibility", "حیاتیات اور حساسیت"),
            t(
              "Genetic susceptibility and nervous-system processes contribute. Trigeminal pathways and CGRP are involved in migraine biology.",
              "جینیاتی حساسیت اور اعصابی عمل کردار ادا کرتے ہیں۔ ٹرائی جیمینل راستے اور CGRP مائیگرین کی حیاتیات میں شامل ہیں۔",
            ),
          ],
          [
            t("A trigger is not an underlying cause", "محرک بنیادی وجہ نہیں"),
            t(
              "Possible triggers differ between people. Strong smells, light or a changed routine may be noticed around an attack; a diary association cannot prove causation.",
              "ممکنہ محرکات افراد میں مختلف ہوتے ہیں۔ تیز خوشبو، روشنی یا معمول کی تبدیلی دورے کے آس پاس محسوس ہوسکتی ہے؛ ڈائری کا تعلق وجہ ثابت نہیں کرتا۔",
            ),
          ],
          [
            t(
              "Bring your experience to the conversation",
              "اپنی کیفیت گفتگو میں لائیں",
            ),
            t(
              "Record both headache and headache-free days. A diary can help you describe your experience to a healthcare professional. Diagnosis needs clinical assessment.",
              "سر درد والے اور سر درد کے بغیر دونوں دن درج کریں۔ ڈائری ماہر صحت کو کیفیت بتانے میں مدد دیتی ہے۔ تشخیص کے لیے طبی معائنہ ضروری ہے۔",
            ),
          ],
        ].map(([title, body]) => (
          <Card key={title}>
            <h2>{title}</h2>
            <p>{body}</p>
          </Card>
        ))}
      </div>
      <Card className="urgent">
        <h2>{t("When to seek urgent medical help", "فوری طبی مدد کب لیں")}</h2>
        <p>
          {t(
            "Seek urgent medical help for a sudden explosive or worst-ever headache; headache with new speech, vision, movement or balance problems, confusion or loss of consciousness; headache with fever and a stiff neck; or headache following a head injury. Contact your local emergency service or go to an emergency department.",
            "اچانک انتہائی شدید یا زندگی کا بدترین سر درد؛ سر درد کے ساتھ بولنے، دیکھنے، حرکت یا توازن میں نئی مشکل، الجھن یا بے ہوشی؛ بخار اور گردن کی اکڑن؛ یا سر کی چوٹ کے بعد سر درد ہو تو فوری طبی مدد لیں۔ مقامی ایمرجنسی سروس سے رابطہ کریں یا ایمرجنسی شعبے جائیں۔",
          )}
        </p>
        <p>
          {t(
            "This is not an exhaustive list. The app does not assess whether symptoms are safe.",
            "یہ مکمل فہرست نہیں۔ ایپ یہ تعین نہیں کرتی کہ علامات محفوظ ہیں۔",
          )}
        </p>
        <a
          href="https://medlineplus.gov/ency/article/003024.htm"
          target="_blank"
          rel="noreferrer"
        >
          MedlinePlus · {t("Headache: when to seek help", "سر درد: مدد کب لیں")}{" "}
          ↗
        </a>
      </Card>
      <Card>
        <h2>{t("Sources and review", "ذرائع اور جائزہ")}</h2>
        <p className="small">
          {t("Source check", "ذرائع کی جانچ")}: {project.sourceReviewDate}.{" "}
          {t(
            "Human clinical and Urdu translation review is pending.",
            "انسانی طبی اور اردو ترجمے کا جائزہ ابھی باقی ہے۔",
          )}
        </p>
        <ul className="source-list">
          <li>
            <a
              href="https://medlineplus.gov/migraine.html"
              target="_blank"
              rel="noreferrer"
            >
              MedlinePlus · Migraine ↗
            </a>
          </li>
          <li>
            <a
              href="https://www.ninds.nih.gov/health-information/disorders/migraine"
              target="_blank"
              rel="noreferrer"
            >
              NINDS · Migraine ↗
            </a>
          </li>
          <li>
            <a
              href="https://www.ninds.nih.gov/sites/default/files/2025-05/headache-hope-through-research.pdf"
              target="_blank"
              rel="noreferrer"
            >
              NINDS · Headache: Hope Through Research ↗
            </a>
          </li>
          <li>
            <a
              href="https://health.nih.gov/health-topics-a-z/migraine"
              target="_blank"
              rel="noreferrer"
            >
              NIH · Migraine (NINDS information) ↗
            </a>
          </li>
          <li>
            <a
              href="https://www.nccih.nih.gov/health/peppermint-oil"
              target="_blank"
              rel="noreferrer"
            >
              NCCIH · Peppermint Oil: Usefulness and Safety ↗
            </a>
          </li>
        </ul>
      </Card>
    </>
  );
}
export function RollOn() {
  const t = useT();
  return (
    <>
      <div className="hero roll-hero">
        <div>
          <span className="eyebrow">
            {t(
              "SEPARATE STUDENT FORMULATION STUDY",
              "الگ طالب علمی فارمولیشن تحقیق",
            )}
          </span>
          <h2>{project.rollOnName}</h2>
          <p>
            {t(
              "A small prototype. A carefully defined research question.",
              "ایک چھوٹا نمونہ۔ ایک واضح تحقیقی سوال۔",
            )}
          </p>
          <span className="tag">
            {t(
              "Planned study · No results collected",
              "مجوزہ تحقیق · نتائج جمع نہیں ہوئے",
            )}
          </span>
        </div>
        <div
          className="bottle-art"
          aria-label={t(
            "Concept illustration of a roll-on bottle",
            "رول آن بوتل کا تصوری خاکہ",
          )}
        >
          <div className="bottle-cap" />
          <div className="bottle">
            <span>{project.rollOnName}</span>
            <small>{t("STUDENT CONCEPT", "طالب علمی تصور")}</small>
            <i />
          </div>
        </div>
      </div>
      <Notice kind="warning">
        {t(
          "Student formulation prototype. Clinical migraine efficacy has not been established.",
          "طالب علمی فارمولیشن کا نمونہ۔ مائیگرین کے لیے طبی افادیت ثابت نہیں ہوئی۔",
        )}
      </Notice>
      <Card>
        <h2>
          {t(
            "One blend. Three carrier systems.",
            "ایک آمیزہ۔ تین حامل تیل کے نظام۔",
          )}
        </h2>
        <p>
          {t(
            "The proposed study compares carrier systems while keeping a supervisor-selected essential-oil blend constant. Exact oil identities, concentrations and safety limits require supervisor approval. No skin-use formula is provided.",
            "مجوزہ تحقیق میں نگران کے منتخب کردہ خوشبودار تیلوں کے آمیزے کو یکساں رکھتے ہوئے حامل تیلوں کا موازنہ ہوگا۔ تیلوں کی شناخت، مقدار اور حفاظتی حدود کے لیے نگران کی منظوری ضروری ہے۔ جلد پر استعمال کا نسخہ فراہم نہیں کیا گیا۔",
          )}
        </p>
        <div className="three-col">
          {[
            ["F1", t("Fractionated coconut oil", "فریکشنیٹڈ ناریل کا تیل")],
            [
              "F2",
              t(
                "Fractionated coconut + grapeseed blend",
                "فریکشنیٹڈ ناریل اور انگور کے بیج کے تیل کا آمیزہ",
              ),
            ],
            ["F3", t("Grapeseed oil", "انگور کے بیج کا تیل")],
          ].map(([n, s]) => (
            <div className="formula" key={n}>
              <span>{n}</span>
              <h3>{s}</h3>
              <p>{t("Carrier system", "حامل تیل کا نظام")}</p>
            </div>
          ))}
        </div>
      </Card>
      <div className="two-col">
        <Card>
          <h2>
            {t("What the study will measure", "تحقیق میں کیا ناپا جائے گا")}
          </h2>
          <ul>
            <li>
              {t(
                "Mass delivered per standardized stroke",
                "ہر معیاری اسٹروک میں خارج ہونے والا وزن",
              )}
            </li>
            <li>{t("Delivery consistency", "اخراج میں یکسانیت")}</li>
            <li>{t("Appearance and leakage", "ظاہری کیفیت اور رساؤ")}</li>
            <li>
              {t("Short-term physical changes", "مختصر مدت کی طبعی تبدیلیاں")}
            </li>
          </ul>
          <p className="small muted">
            {t(
              "No measurements or efficacy findings are available.",
              "کوئی پیمائش یا افادیت کے نتائج دستیاب نہیں۔",
            )}
          </p>
        </Card>
        <Card>
          <h2>{t("Safety and boundaries", "حفاظت اور حدود")}</h2>
          <p>
            {t(
              "Strong smells can trigger attacks for some people. Essential oils may cause skin irritation or allergy. This prototype is not recommended in response to symptoms, pain scores or diary patterns.",
              "تیز خوشبو بعض افراد میں دورے کا محرک ہوسکتی ہے۔ خوشبودار تیل جلد میں جلن یا الرجی پیدا کرسکتے ہیں۔ علامات، درد کی شدت یا ڈائری کے رجحانات پر اس نمونے کی تجویز نہیں دی جاتی۔",
            )}
          </p>
          <a
            href="https://www.nccih.nih.gov/health/peppermint-oil"
            target="_blank"
            rel="noreferrer"
          >
            NCCIH · {t("Safety source", "حفاظتی معلومات")} ↗
          </a>
        </Card>
      </div>
      <Card>
        <h2>
          {t("Category inspiration, not a clone", "زمرے سے تحریک، نقل نہیں")}
        </h2>
        <p>
          {t(
            "The project brief references Pure Luna Migraine Manager as a roll-on category example. Its exact percentages are not established here. No clone formula, clinical equivalence, endorsement or partnership is claimed. The referenced product page could not be independently retrieved during this build.",
            "منصوبے میں پیور لونا مائیگرین مینیجر کو رول آن زمرے کی مثال کے طور پر ذکر کیا گیا ہے۔ اس کی درست شرحیں یہاں معلوم نہیں۔ نقل، طبی برابری، تائید یا شراکت کا دعویٰ نہیں۔ تعمیر کے دوران مذکورہ صفحے تک آزادانہ رسائی نہیں ہوسکی۔",
          )}
        </p>
        <p className="small">
          {t("Reference supplied in project brief", "منصوبے میں دیا گیا حوالہ")}
          : pureluna.store/products/migraine-manager
        </p>
      </Card>
    </>
  );
}
export function Research() {
  const t = useT();
  const tasks = [
    t("Record a fictional headache-free day", "فرضی سر درد سے پاک دن درج کریں"),
    t("Add a fictional attack", "فرضی دورہ شامل کریں"),
    t("Edit an entry", "اندراج میں ترمیم کریں"),
    t("Find a chart", "چارٹ تلاش کریں"),
    t("Export a summary", "خلاصہ برآمد کریں"),
    t("Delete a demo entry", "نمائشی اندراج حذف کریں"),
  ];
  return (
    <>
      <Card className="research-heading">
        <a href="./poster.html" target="_blank" rel="noreferrer">
          {t("Open research poster ↗", "تحقیقی پوسٹر کھولیں ↗")}
        </a>
        <span className="eyebrow">
          {t(
            "FIRST-YEAR PHARM-D · RESEARCH EXPO",
            "فرسٹ ایئر فارم ڈی · تحقیقی نمائش",
          )}
        </span>
        <h2>
          {t(
            "Development and Usability Evaluation of a Bilingual Headache Diary App",
            "مائیگرا میپ: مائیگرین ڈائری کے نمونے کی تیاری اور قابلِ استعمال ہونے کا جائزہ۔",
          )}
        </h2>
        <p>
          {t(
            "Proposed need: evaluate a simple bilingual interface with the intended users. Migraine diaries already exist; this study evaluates this prototype’s usability.",
            "مجوزہ ضرورت: مطلوبہ صارفین کے ساتھ ایک سادہ دو لسانی انٹرفیس کا جائزہ۔ مائیگرین ڈائریاں پہلے سے موجود ہیں؛ یہ تحقیق اس نمونے کے استعمال کا جائزہ لیتی ہے۔",
          )}
        </p>
        <span className="tag">
          {t(
            "Study planned · No usability findings yet",
            "مجوزہ تحقیق · استعمال کے نتائج ابھی نہیں",
          )}
        </span>
      </Card>
      <div className="two-col">
        <Card>
          <h2>{t("Study A · App usability", "تحقیق الف · ایپ کا استعمال")}</h2>
          <p>
            {t(
              "Observe task completion, time on task, navigation errors and user feedback. Document improvements after testing. Use fictional records and institution-approved participant procedures.",
              "کام کی تکمیل، وقت، راستہ تلاش کرنے کی غلطیوں اور صارفین کی رائے کا مشاہدہ کریں۔ جانچ کے بعد بہتری درج کریں۔ فرضی ریکارڈ اور ادارے کے منظور شدہ طریقے استعمال کریں۔",
            )}
          </p>
        </Card>
        <Card>
          <h2>
            {t(
              "Study B · Formulation properties",
              "تحقیق ب · فارمولیشن کی خصوصیات",
            )}
          </h2>
          <p>
            {t(
              "Evaluate carrier-dependent delivery and physical properties of the separate roll-on prototype. App usability does not establish product efficacy, and formulation measurements do not validate the app clinically.",
              "الگ رول آن نمونے میں حامل تیل کے مطابق اخراج اور طبعی خصوصیات کا جائزہ لیں۔ ایپ کا استعمال مصنوعات کی افادیت ثابت نہیں کرتا اور فارمولیشن کی پیمائش ایپ کی طبی توثیق نہیں ہے۔",
            )}
          </p>
        </Card>
      </div>
      <Card>
        <h2>
          {t(
            "Transparent, supervised use of AI",
            "شفاف، زیر نگرانی مصنوعی ذہانت کا استعمال",
          )}
        </h2>
        <p>
          {t(
            "AI assisted UI development, storyboard and educational drafts. Humans must verify sources, medical wording and translations. AI does not diagnose patients or create research results. The app has no live AI connection and sends no diary data to AI services.",
            "مصنوعی ذہانت نے انٹرفیس، منظرنامے اور تعلیمی مسودوں میں مدد دی۔ انسانوں کو ذرائع، طبی متن اور ترجمے کی تصدیق کرنی ہے۔ مصنوعی ذہانت مریضوں کی تشخیص یا تحقیقی نتائج تخلیق نہیں کرتی۔ ایپ کا براہ راست AI رابطہ نہیں اور ڈائری کا ڈیٹا AI خدمات کو نہیں بھیجا جاتا۔",
          )}
        </p>
      </Card>
      <Card className="observer">
        <div className="row between wrap">
          <h2>
            {t("Blank observer checklist", "مشاہدہ کرنے والے کی خالی فہرست")}
          </h2>
          <button
            className="no-print"
            onClick={() => {
              document.body.classList.add("print-observer");
              window.print();
              document.body.classList.remove("print-observer");
            }}
          >
            {t("Print checklist", "فہرست پرنٹ کریں")}
          </button>
        </div>
        <p>
          {t(
            "Session code: __________   Date: __________   Interface language: __________",
            "نشست کا کوڈ: __________   تاریخ: __________   زبان: __________",
          )}
        </p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {[
                  t("Task", "کام"),
                  t(
                    "Complete / partial / not complete",
                    "مکمل / جزوی / نامکمل",
                  ),
                  t("Time (s)", "وقت (سیکنڈ)"),
                  t("Navigation errors", "راستے کی غلطیاں"),
                  t("Feedback / changes", "رائے / تبدیلیاں"),
                ].map((x) => (
                  <th key={x}>{x}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tasks.map((x) => (
                <tr key={x}>
                  <td>{x}</td>
                  <td>□ / □ / □</td>
                  <td>_______</td>
                  <td>_______</td>
                  <td>_______________</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          {t(
            "Observer notes: __________________________________________________________",
            "مشاہداتی نوٹس: __________________________________________________________",
          )}
        </p>
      </Card>
    </>
  );
}
