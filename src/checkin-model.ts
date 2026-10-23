export const locations = [
  "One side",
  "Both sides",
  "Around the eye",
  "Other place",
  "Unsure",
] as const;
export const descriptions = [
  "Throbbing",
  "Pressure or tightness",
  "Stabbing",
  "Other",
  "Unsure",
] as const;
export const checkInSymptoms = [
  "Nausea",
  "Vomiting",
  "Light sensitivity",
  "Sound sensitivity",
  "None",
  "Other",
] as const;
export const impacts = [
  "Not at all",
  "Activities were difficult",
  "Had to stop some activities",
  "Could not do activities",
] as const;
export const contexts = [
  "Sleep change",
  "Missed meal",
  "Bright light",
  "Strong smell",
  "Caffeine change",
  "Menstrual period",
  "Other",
  "Nothing noticed",
  "Unsure",
] as const;
export type CheckIn = {
  version: 1;
  start: string | null;
  startUnknown: boolean;
  ongoing: "yes" | "no" | "unknown";
  end: string | null;
  peakPain: number | null;
  location: string;
  description: string;
  symptoms: string[];
  symptomOther: string;
  impact: string;
  medicine: "yes" | "no" | "unknown";
  medicineName: string;
  medicineTime: string | null;
  context: string[];
  contextOther: string;
};
export const newCheckIn = (): CheckIn => ({
  version: 1,
  start: null,
  startUnknown: false,
  ongoing: "unknown",
  end: null,
  peakPain: null,
  location: "",
  description: "",
  symptoms: [],
  symptomOther: "",
  impact: "",
  medicine: "unknown",
  medicineName: "",
  medicineTime: null,
  context: [],
  contextOther: "",
});
export function clearEpisode(q: CheckIn): CheckIn {
  return { ...newCheckIn(), context: q.context, contextOther: q.contextOther };
}
export function toggleExclusive(
  values: string[],
  value: string,
  exclusive: string[],
) {
  if (values.includes(value)) return values.filter((v) => v !== value);
  if (exclusive.includes(value)) return [value];
  return [...values.filter((v) => !exclusive.includes(v)), value];
}
