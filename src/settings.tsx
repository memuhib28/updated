import { useState } from "react";
import {
  type Backup,
  type Data,
  type Mode,
  csv,
  empty,
  mergeData,
  validateBackup,
} from "./core";
import { Card, Confirm, download, Field, Notice } from "./components";
import { useT, useErrorText } from "./i18n";
export function Settings({
  data,
  mode,
  save,
}: {
  data: Data;
  mode: Mode;
  save: (d: Data) => Promise<void>;
}) {
  const t = useT();
  const errorText = useErrorText();
  const [preview, setPreview] = useState<Backup | null>(null);
  const [choice, setChoice] = useState("merge");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  return (
    <>
      <Card>
        <h2>{t("Your data", "آپ کا ڈیٹا")}</h2>
        <p>{t("Your diary is stored in this browser only. Clearing browser storage can erase it. Export a backup.","آپ کی ڈائری صرف اسی براؤزر میں محفوظ ہے۔ ذخیرہ صاف کرنے سے مٹ سکتی ہے۔ بیک اپ برآمد کریں۔")}</p>
      </Card>
      <Card>
        <h2>{t("Export and back up", "برآمد اور بیک اپ")}</h2>
        <p>
          {t(
            "JSON contains a full diary backup. CSV includes all diary records. Use My Summary for date-filtered CSV and print.",
            "JSON میں موجودہ موڈ کا مکمل بیک اپ ہے۔ CSV میں موجودہ موڈ کے تمام اندراجات ہیں۔ مدت کے مطابق CSV اور پرنٹ کے لیے معالج کا خلاصہ استعمال کریں۔",
          )}
        </p>
        <div className="row wrap">
          <button
            className="primary"
            onClick={() =>
              download(
                "migramap-" + mode + "-backup.json",
                JSON.stringify(
                  { app: "MigraMap", version: 1, mode, data },
                  null,
                  2,
                ),
                "application/json",
              )
            }
          >
            {t("Download JSON backup", "JSON بیک اپ ڈاؤن لوڈ کریں")}
          </button>
          <button
            onClick={() =>
              download(
                "migramap-" + mode + "-all.csv",
                csv(data),
                "text/csv;charset=utf-8",
              )
            }
          >
            {t("Export all CSV", "تمام CSV برآمد کریں")}
          </button>
        </div>
      </Card>
      <Card>
        <h2>{t("Restore a backup", "بیک اپ بحال کریں")}</h2>
        <p>
          {t(
            "Only backups from the current mode are accepted. Invalid files are rejected before any records are changed. Maximum file size: 10 MB.",
            "صرف موجودہ موڈ کے بیک اپ قبول ہوتے ہیں۔ غلط فائلیں اندراجات بدلنے سے پہلے مسترد ہوتی ہیں۔ زیادہ سے زیادہ فائل سائز: 10 MB۔",
          )}
        </p>
        <Field
          label={t(
            "Choose a MigraMap JSON backup",
            "مائیگرا میپ JSON بیک اپ منتخب کریں",
          )}
        >
          <input
            type="file"
            accept=".json,application/json"
            onChange={async (e) => {
              setError("");
              setMessage("");
              setPreview(null);
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                if (f.size > 10 * 1024 * 1024)
                  throw Error(t("File is too large.", "فائل بہت بڑی ہے۔"));
                setPreview(validateBackup(JSON.parse(await f.text()), mode));
              } catch (err) {
                setError(errorText((err as Error).message));
              } finally {
                e.target.value = "";
              }
            }}
          />
        </Field>
        {preview && (
          <div className="import-preview">
            <h3>
              {t(
                "Preview — nothing imported yet",
                "پیش منظر — ابھی درآمد نہیں ہوا",
              )}
            </h3>
            <p>
              {preview.data.days.length}{" "}
              {t("daily check-ins", "روزانہ اندراجات")} ·{" "}
              {preview.data.attacks.length} {t("attacks", "دورے")} · {mode}
            </p>
            <Field label={t("Import method", "درآمد کا طریقہ")}>
              <select
                value={choice}
                onChange={(e) => setChoice(e.target.value)}
              >
                <option value="merge">
                  {t(
                    "Merge — incoming dates/IDs replace matching records",
                    "ضم کریں — ملتی تاریخ یا شناخت کے اندراج بدلیں",
                  )}
                </option>
                <option value="replace">
                  {t(
                    "Replace — remove current mode records first",
                    "بدل دیں — موجودہ موڈ کے اندراجات پہلے حذف ہوں گے",
                  )}
                </option>
              </select>
            </Field>
            <p className="small">
              {t(
                "Review overlapping attacks and conflicts in the diary after importing.",
                "درآمد کے بعد ڈائری میں ملتے اوقات اور تضادات دیکھیں۔",
              )}
            </p>
            <div className="row">
              <button
                disabled={busy}
                className="primary"
                onClick={async () => {
                  setBusy(true);
                  setError("");
                  try {
                    const checked = validateBackup(preview, mode);
                    await save(
                      choice === "merge"
                        ? mergeData(data, checked.data)
                        : checked.data,
                    );
                    setPreview(null);
                    setMessage(
                      t(
                        "Backup imported successfully.",
                        "بیک اپ کامیابی سے درآمد ہوگیا۔",
                      ),
                    );
                  } catch (e) {
                    setError(errorText((e as Error).message));
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {busy
                  ? t("Importing…", "درآمد ہو رہا ہے…")
                  : t("Confirm import", "درآمد کی تصدیق")}
              </button>
              <button onClick={() => setPreview(null)}>
                {t("Cancel", "منسوخ")}
              </button>
            </div>
          </div>
        )}
        {error && (
          <Notice kind="error">
            <span role="alert">{error}</span>
          </Notice>
        )}
        {message && (
          <Notice>
            <span role="status">{message}</span>
          </Notice>
        )}
      </Card>
      <Card>
        <h2>{t("Delete this mode’s records", "اس موڈ کا ریکارڈ حذف کریں")}</h2>
        <p>
          {t(
            "This removes all records from the currently open diary. Export a backup first if needed.",
            "یہ اس براؤزر سے موجودہ موڈ کی ڈائری حذف کرتا ہے۔ دوسرے موڈ کا ریکارڈ برقرار رہتا ہے۔ ضرورت ہو تو پہلے بیک اپ برآمد کریں۔",
          )}
        </p>
        <button className="danger" onClick={() => setConfirm(true)}>
          {mode === "personal"
            ? t("Delete all personal data", "تمام ذاتی ڈیٹا حذف کریں")
            : t("Clear demo records", "نمائشی ریکارڈ صاف کریں")}
        </button>
      </Card>
      <Card>
        <h2>{t("Student prototype limitations", "طالب علمی نمونے کی حدود")}</h2>
        <p>
          {t(
            "Not clinically validated or production-ready for patient care. No HIPAA/GDPR compliance claim is made. Clinical or cloud deployment would require authentication, authorization, a secure backend, privacy and consent processes, and institutional approval. Future AI summaries would require opt-in, clear disclosure, consent and a secure backend; keys must never be placed in frontend code.",
            "طبی توثیق نہیں ہوئی اور مریضوں کی نگہداشت کے لیے تیار نہیں۔ HIPAA/GDPR تعمیل کا دعویٰ نہیں۔ طبی یا کلاؤڈ استعمال کے لیے شناخت، اجازت، محفوظ سرور، رازداری، رضامندی اور ادارے کی منظوری ضروری ہوگی۔ مستقبل میں AI خلاصوں کے لیے رضاکارانہ انتخاب، واضح معلومات، رضامندی اور محفوظ سرور درکار ہوں گے؛ کلید فرنٹ اینڈ میں نہیں رکھی جاسکتی۔",
          )}
        </p>
      </Card>
      {confirm && (
        <Confirm
          title={t("Delete all records?", "تمام اندراجات حذف کریں؟")}
          body={t(
            "This cannot be undone without a backup. Confirm deletion for the current mode only.",
            "بیک اپ کے بغیر یہ واپس نہیں ہوسکتا۔ صرف موجودہ موڈ کی حذف کاری کی تصدیق کریں۔",
          )}
          onClose={() => setConfirm(false)}
          onConfirm={async () => {
            await save(empty());
            setMessage(t("Records deleted.", "اندراجات حذف ہوگئے۔"));
          }}
        />
      )}
    </>
  );
}
