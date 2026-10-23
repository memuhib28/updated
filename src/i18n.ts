import { createContext, useContext } from "react";
export const LanguageContext = createContext(false);
export function useT() {
  const ur = useContext(LanguageContext);
  return (en: string, urdu: string) => (ur ? urdu : en);
}
export const symptomUr: Record<string, string> = {
  Nausea: "متلی",
  Vomiting: "قے",
  "Light sensitivity": "روشنی سے حساسیت",
  "Sound sensitivity": "آواز سے حساسیت",
  "Self-reported aura-like symptoms": "خود بیان کردہ آورا جیسی علامات",
};
export const errorUr: Record<string, string> = {
  "Invalid check-in answers.": "اندراج کے جوابات درست نہیں۔",
  "Check-in times must be valid and not in the future.":
    "اندراج کے اوقات درست ہوں اور مستقبل میں نہ ہوں۔",
  "Unknown start time cannot contain a timestamp.":
    "نامعلوم وقت کے ساتھ وقت درج نہیں ہوسکتا۔",
  "End must be after start and only recorded when pain has ended.":
    "اختتام شروع کے بعد ہو اور صرف درد ختم ہونے پر درج ہو۔",
  "Invalid check-in choices.": "اندراج کے انتخاب درست نہیں۔",
  "None or unsure cannot be combined with other choices.":
    "کوئی نہیں یا یقین نہیں کے ساتھ دوسرے انتخاب نہیں ہوسکتے۔",
  "Invalid check-in text.": "اندراج کا متن درست نہیں۔",
  "Other details require the Other choice.":
    "دیگر تفصیل کے لیے کچھ اور منتخب کریں۔",
  "Medication details require a Yes response.":
    "دوا کی تفصیل کے لیے ہاں منتخب کریں۔",
  "Headache-free check-ins cannot contain episode answers.":
    "سر درد سے پاک دن میں دورے کی تفصیل نہیں ہوسکتی۔",

  "Enter a valid date that is not in the future.":
    "درست تاریخ درج کریں جو مستقبل میں نہ ہو۔",
  "Choose a headache status and meal response.":
    "سر درد کی حالت اور کھانے کا جواب منتخب کریں۔",
  "Sleep must be between 0 and 24 hours.":
    "نیند 0 سے 24 گھنٹے کے درمیان ہونی چاہیے۔",
  "Enter caffeine in mg between 0 and 10000, or leave blank.":
    "کیفین 0 سے 10000 ملی گرام کے درمیان درج کریں یا خالی چھوڑ دیں۔",
  "Invalid daily fields.": "روزانہ اندراج کی معلومات درست نہیں۔",
  "Start date/time is required and cannot be in the future.":
    "شروع کی تاریخ اور وقت ضروری ہیں اور مستقبل میں نہیں ہوسکتے۔",
  "End must be after start and not in the future.":
    "اختتام شروع کے بعد ہو اور مستقبل میں نہ ہو۔",
  "Pain must be between 0 and 10.": "درد کی شدت 0 سے 10 کے درمیان ہونی چاہیے۔",
  "Invalid symptoms.": "علامات درست نہیں۔",
  "Medication time is invalid or in the future.":
    "دوا کا وقت غلط ہے یا مستقبل میں ہے۔",
  "Invalid attack fields.": "دورے کی معلومات درست نہیں۔",
  "Invalid date or time.": "تاریخ یا وقت درست نہیں۔",
  "Invalid local time (possibly a daylight-saving transition).":
    "مقامی وقت درست نہیں، ممکن ہے موسمی وقت کی تبدیلی ہو۔",
  "Invalid backup, unsupported version, or different mode. Demo and personal backups cannot mix.":
    "بیک اپ غلط، ورژن غیر معاون یا موڈ مختلف ہے۔ نمائشی اور ذاتی بیک اپ نہیں مل سکتے۔",
  "Backup exceeds the supported size.": "بیک اپ معاون حجم سے بڑا ہے۔",
  "Duplicate dates or entry identifiers in backup.":
    "بیک اپ میں تاریخ یا اندراج کی شناخت دہرائی گئی ہے۔",
  "Conflicting identifiers; merge cancelled.":
    "شناختوں میں تضاد؛ ضم کرنا منسوخ ہوگیا۔",
  "Choose a valid date range.": "درست مدت منتخب کریں۔",
  "Choose a range of ten years or less.": "دس سال یا اس سے کم مدت منتخب کریں۔",
  "Browser database could not be opened. Check storage permissions.":
    "براؤزر ڈیٹابیس نہیں کھل سکی۔ ذخیرے کی اجازت دیکھیں۔",
  "Close other MigraMap tabs and retry.":
    "مائیگرا میپ کے دوسرے ٹیب بند کرکے دوبارہ کوشش کریں۔",
  "Could not save. Storage may be full or unavailable. Your previous records were preserved.":
    "محفوظ نہیں ہوسکا۔ ذخیرہ بھرا یا غیر دستیاب ہوسکتا ہے۔ پچھلے اندراجات برقرار ہیں۔",
  "Save cancelled; please retry.": "محفوظ کرنا منسوخ ہوگیا؛ دوبارہ کوشش کریں۔",
};
export function useErrorText() {
  const t = useT();
  return (message: string) =>
    t(message, errorUr[message] ?? `معلومات کی جانچ کریں: ${message}`);
}
