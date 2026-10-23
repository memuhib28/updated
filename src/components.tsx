import { type ReactNode, useEffect, useState } from "react";
import {
  Activity,
  ArrowRight,
  BookOpen,
  CalendarDays,
  ChartNoAxesCombined,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Download,
  FlaskConical,
  Heart,
  House,
  Info,
  Menu,
  Plus,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  X,
} from "lucide-react";
import { useT } from "./i18n";
export const icons = {
  dashboard: House,
  day: Sun,
  attack: Plus,
  diary: CalendarDays,
  patterns: ChartNoAxesCombined,
  summary: ClipboardList,
  learn: BookOpen,
  roll: FlaskConical,
  research: Sparkles,
  settings: Settings,
};
export {
  Activity,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Heart,
  Info,
  Menu,
  Plus,
  ShieldCheck,
  Sun,
  Trash2,
  X,
};
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={"card " + className}>{children}</section>;
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function Notice({
  children,
  kind = "info",
}: {
  children: ReactNode;
  kind?: string;
}) {
  return (
    <div className={"notice " + kind}>
      <Info size={18} />
      <div>{children}</div>
    </div>
  );
}
export function Empty({ children }: { children: ReactNode }) {
  const t = useT();
  return (
    <div className="empty">
      <CalendarDays size={36} />
      <h3>
        {t("A little space for your story", "آپ کی روزمرہ کیفیت کے لیے جگہ")}
      </h3>
      <p>{children}</p>
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const t = useT();
  useEffect(() => {
    const old = document.activeElement as HTMLElement;
    const dialog = document.querySelector<HTMLDialogElement>("dialog");
    dialog?.showModal();
    return () => {
      dialog?.close();
      old?.focus();
    };
  }, []);
  return (
    <dialog
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="row between">
        <h2>{title}</h2>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label={t("Close", "بند کریں")}
        >
          <X />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Confirm({
  title,
  body,
  onConfirm,
  onClose,
}: {
  title: string;
  body: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <Modal title={title} onClose={onClose}>
      <p>{body}</p>
      {error && <p role="alert">{error}</p>}
      <div className="row end">
        <button onClick={onClose}>{t("Cancel", "منسوخ")}</button>
        <button
          className="danger"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onConfirm();
              onClose();
            } catch (e) {
              setError(String(e));
              setBusy(false);
            }
          }}
        >
          {busy ? t("Working…", "جاری ہے…") : t("Confirm", "تصدیق کریں")}
        </button>
      </div>
    </Modal>
  );
}
export function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
