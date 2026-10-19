import type { Severity, Status } from "./data";
import type { Tone } from "@/design-system";

export const severityTone: Record<Severity, Tone> = { Critical: "danger", High: "warning", Medium: "info", Low: "neutral" };
export const statusTone: Record<Status, Tone> = { New: "neutral", "In progress": "info", Escalated: "warning", Resolved: "success" };
export const severityRank: Record<Severity, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };

/** "22 min left", "1 h 35 min left", "15 min over". Words, not just a red number. */
export function slaLabel(minutes: number): string {
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const text = h ? `${h} h${m ? ` ${m} min` : ""}` : `${m} min`;
  return minutes < 0 ? `${text} over` : `${text} left`;
}

export function slaTone(minutes: number): Tone {
  if (minutes < 0) return "danger";
  if (minutes <= 60) return "warning";
  return "neutral";
}

export function relativeTime(minutesFromNow: number): string {
  const abs = Math.abs(minutesFromNow);
  if (abs < 1) return "just now";
  if (abs < 60) return `${abs} min ago`;
  const h = Math.floor(abs / 60);
  return `${h} h ${abs % 60} min ago`;
}
