import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export interface TabItem {
  id: string;
  label: string;
  /** Optional count shown next to the label, e.g. items in a queue. */
  count?: number;
  content: ReactNode;
}

export interface TabsProps {
  label: string;
  items: TabItem[];
  defaultTab?: string;
  /** Controlled mode: pass value and onChange together. */
  value?: string;
  onChange?: (id: string) => void;
}

/** WAI-ARIA tabs with roving focus: Left/Right move between tabs, Home/End jump to the ends. */
export function Tabs({ label, items, defaultTab, value, onChange }: TabsProps) {
  const [internal, setInternal] = useState(defaultTab ?? items[0]?.id);
  const active = value ?? internal;
  const base = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const select = (id: string) => {
    setInternal(id);
    onChange?.(id);
  };

  const onKeyDown = (e: KeyboardEvent, index: number) => {
    const last = items.length - 1;
    const keys: Record<string, number> = { ArrowRight: index === last ? 0 : index + 1, ArrowLeft: index === 0 ? last : index - 1, Home: 0, End: last };
    const next = keys[e.key];
    if (next === undefined) return;
    e.preventDefault();
    refs.current[next]?.focus();
    select(items[next].id);
  };

  return (
    <div>
      <div role="tablist" aria-label={label} className="rds-tabs__list">
        {items.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="tab"
            type="button"
            id={`${base}-tab-${t.id}`}
            aria-selected={active === t.id}
            aria-controls={`${base}-panel-${t.id}`}
            tabIndex={active === t.id ? 0 : -1}
            className="rds-tabs__tab"
            onClick={() => select(t.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            {t.label}
            {t.count !== undefined && <span className="rds-tabs__count">{t.count}</span>}
          </button>
        ))}
      </div>
      {items.map((t) => (
        <div
          key={t.id}
          role="tabpanel"
          id={`${base}-panel-${t.id}`}
          aria-labelledby={`${base}-tab-${t.id}`}
          hidden={active !== t.id}
          tabIndex={0}
          className="rds-tabs__panel"
        >
          {active === t.id && t.content}
        </div>
      ))}
    </div>
  );
}
