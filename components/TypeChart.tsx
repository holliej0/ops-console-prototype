import type { ExceptionType, ShipmentException } from "@/lib/data";

interface Props {
  items: ShipmentException[];
  onSelectType: (type: ExceptionType) => void;
}

/**
 * Horizontal bars, sorted largest first, with the number printed on each bar.
 * Each bar is a button that filters the queue, so the chart is a way in, not just a picture.
 */
export function TypeChart({ items, onSelectType }: Props) {
  const open = items.filter((e) => e.status !== "Resolved");
  const counts = new Map<ExceptionType, { total: number; critical: number }>();
  for (const e of open) {
    const c = counts.get(e.type) ?? { total: 0, critical: 0 };
    c.total++;
    if (e.severity === "Critical") c.critical++;
    counts.set(e.type, c);
  }
  const rows = [...counts.entries()].sort((a, b) => b[1].total - a[1].total);
  const max = Math.max(1, ...rows.map(([, c]) => c.total));

  return (
    <section className="oc-card" aria-labelledby="chart-title">
      <div className="oc-card__head">
        <h2 id="chart-title" className="oc-h2">Open exceptions by type</h2>
        <span className="oc-muted">Select a type to filter the queue</span>
      </div>
      <ul className="oc-bars">
        {rows.map(([type, c]) => (
          <li key={type}>
            <button type="button" className="oc-bar" onClick={() => onSelectType(type)}>
              <span className="oc-bar__label">{type}</span>
              <span className="oc-bar__track" aria-hidden="true">
                <span className="oc-bar__fill" style={{ width: `${(c.total / max) * 100}%` }}>
                  {c.critical > 0 && <span className="oc-bar__critical" style={{ width: `${(c.critical / c.total) * 100}%` }} />}
                </span>
              </span>
              <span className="oc-bar__value">
                {c.total}
                {c.critical > 0 && <span className="oc-muted"> · {c.critical} critical</span>}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
