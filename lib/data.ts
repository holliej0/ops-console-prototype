// Fictional demo data. No real companies, patients or shipments.
// Generated from a fixed seed and a fixed "now" so the demo and screenshots are stable.

export type Severity = "Critical" | "High" | "Medium" | "Low";
export type Status = "New" | "In progress" | "Escalated" | "Resolved";
export type ExceptionType =
  | "Temperature excursion"
  | "Missed pickup"
  | "Address unverified"
  | "Customs hold"
  | "Damaged in transit"
  | "Delivery window at risk";

export interface TimelineEvent {
  at: number; // minutes relative to DEMO_NOW (negative = past)
  text: string;
}

export interface ShipmentException {
  id: string;
  type: ExceptionType;
  severity: Severity;
  status: Status;
  facility: string;
  customer: string;
  contents: string;
  carrier: string;
  slaMinutes: number; // minutes until SLA breach; negative = already breached
  assignee: string | null;
  openedMinutesAgo: number;
  detail: string;
  timeline: TimelineEvent[];
}

export const CURRENT_USER = "You";
export const DEMO_NOW = new Date("2026-10-20T09:45:00");

const TYPES: ExceptionType[] = [
  "Temperature excursion",
  "Missed pickup",
  "Address unverified",
  "Customs hold",
  "Damaged in transit",
  "Delivery window at risk",
];
const FACILITIES = ["Newark DC", "Columbus DC", "Reno DC"];
const CUSTOMERS = [
  "St. Brigid Medical Center",
  "Lakeview Community Hospital",
  "Harbor Point Clinic",
  "Northfield Pharmacy Group",
  "Cedar Ridge Health",
  "Mercy Valley Hospital",
  "Riverside Dialysis Center",
];
const CONTENTS = [
  "Insulin pens, 40 cartons",
  "COVID-19 vaccine, 12 trays",
  "Surgical kits, 18 cases",
  "IV fluids, 60 cases",
  "Oncology infusion, 6 cartons",
  "Diagnostic reagents, 24 boxes",
];
const CARRIERS = ["Swiftline Freight", "Northstar Courier", "Bluepeak Logistics"];
const TEAMMATES = ["Dana K.", "Marcus T.", "Priya S."];

// Small deterministic random number generator (mulberry32).
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const detailFor = (type: ExceptionType, r: () => number): string => {
  switch (type) {
    case "Temperature excursion":
      return `Reefer sensor logged ${(8.4 + r() * 2).toFixed(1)}°C for ${10 + Math.floor(r() * 25)} minutes. Allowed range is 2 to 8°C.`;
    case "Missed pickup":
      return "Driver did not arrive in the pickup window. Carrier has not confirmed a new time.";
    case "Address unverified":
      return "Delivery address failed validation. The dock number does not match the customer record.";
    case "Customs hold":
      return "Shipment held at the border pending a corrected commercial invoice.";
    case "Damaged in transit":
      return "Carrier reported crushed outer packaging on 2 cases. Inner packaging not yet inspected.";
    case "Delivery window at risk":
      return "Current ETA is later than the customer's receiving window.";
  }
};

export function generateExceptions(count = 42): ShipmentException[] {
  const r = rng(20261020);
  const pick = <T,>(arr: T[]) => arr[Math.floor(r() * arr.length)];
  return Array.from({ length: count }, (_, i) => {
    const type = pick(TYPES);
    const sevRoll = r();
    const severity: Severity =
      type === "Temperature excursion" ? (sevRoll < 0.6 ? "Critical" : "High") : sevRoll < 0.15 ? "Critical" : sevRoll < 0.45 ? "High" : sevRoll < 0.8 ? "Medium" : "Low";
    const statusRoll = r();
    const status: Status = statusRoll < 0.18 ? "Resolved" : statusRoll < 0.3 ? "Escalated" : statusRoll < 0.6 ? "In progress" : "New";
    const assignee = status === "New" ? null : statusRoll < 0.45 ? CURRENT_USER : pick(TEAMMATES);
    const base = { Critical: 60, High: 180, Medium: 360, Low: 720 }[severity];
    const slaMinutes = Math.round(base * (r() * 1.3 - 0.2));
    const openedMinutesAgo = 5 + Math.floor(r() * 240);
    const timeline: TimelineEvent[] = [{ at: -openedMinutesAgo, text: "Exception opened from carrier event" }];
    if (assignee) timeline.push({ at: -Math.floor(openedMinutesAgo * 0.6), text: `Assigned to ${assignee === CURRENT_USER ? "you" : assignee}` });
    if (status === "Escalated") timeline.push({ at: -Math.floor(openedMinutesAgo * 0.3), text: "Escalated to carrier account manager" });
    if (status === "Resolved") timeline.push({ at: -Math.floor(openedMinutesAgo * 0.2), text: "Marked resolved" });
    return {
      id: `SHP-${10400 + count * 2 - i * 2 + (i % 3)}`,
      type,
      severity,
      status,
      facility: pick(FACILITIES),
      customer: pick(CUSTOMERS),
      contents: pick(CONTENTS),
      carrier: pick(CARRIERS),
      slaMinutes: status === "Resolved" ? Math.abs(slaMinutes) : slaMinutes,
      assignee,
      openedMinutesAgo,
      detail: detailFor(type, r),
      timeline,
    };
  });
}

/** Rule-based playbook. Kept simple and visible so people can see why a step is suggested. */
export function recommendedStep(e: ShipmentException): { step: string; why: string } {
  switch (e.type) {
    case "Temperature excursion":
      return {
        step: "Quarantine the shipment and request a stability review from Quality before delivery.",
        why: "Product left its allowed range. Quality decides if it is still usable.",
      };
    case "Missed pickup":
      return { step: "Ask the carrier for a confirmed pickup time, or rebook with a backup carrier.", why: "No new pickup time has been confirmed." };
    case "Address unverified":
      return { step: "Confirm the receiving dock with the customer before the truck departs.", why: "Wrong docks are the most common cause of refused deliveries." };
    case "Customs hold":
      return { step: "Send the corrected commercial invoice to the customs broker.", why: "The hold clears once paperwork matches." };
    case "Damaged in transit":
      return { step: "Ask the receiving site to inspect inner packaging and send photos.", why: "Outer damage alone doesn't mean the product is unusable." };
    case "Delivery window at risk":
      return { step: "Tell the customer the new ETA and ask if late receiving is possible.", why: "Early notice gives the site time to plan staff." };
  }
}
