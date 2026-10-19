export interface StatTileProps {
  label: string;
  value: string | number;
  /** Plain-language change, e.g. "+4 since 8 AM". */
  delta?: string;
  /** Whether the change is good or bad for the user. Up is not always good. */
  trend?: "good" | "bad" | "neutral";
  /** Adds a colored edge for values that need attention. */
  emphasis?: "none" | "warning" | "danger";
}

export function StatTile({ label, value, delta, trend = "neutral", emphasis = "none" }: StatTileProps) {
  return (
    <div className={`rds-stat ${emphasis !== "none" ? `rds-stat--${emphasis}` : ""}`.trim()}>
      <p className="rds-stat__label">{label}</p>
      <p className="rds-stat__value">{value}</p>
      {delta && (
        <p className={`rds-stat__delta ${trend !== "neutral" ? `rds-stat__delta--${trend}` : ""}`.trim()}>
          {trend !== "neutral" && <span className="rds-visually-hidden">{trend === "good" ? "Improving: " : "Getting worse: "}</span>}
          {delta}
        </p>
      )}
    </div>
  );
}
