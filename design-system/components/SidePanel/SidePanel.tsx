import { useEffect, useId, useRef, type ReactNode } from "react";

export interface SidePanelProps {
  open: boolean;
  title: string;
  /** Short line under the title, e.g. an ID or status. */
  subtitle?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * A modal side panel for details and actions without leaving the list.
 * Focus moves into the panel, stays there while it is open (Tab wraps),
 * Escape closes it, and focus returns to whatever opened it.
 */
export function SidePanel({ open, title, subtitle, onClose, children, footer }: SidePanelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Tab" && ref.current) {
        const items = Array.from(ref.current.querySelectorAll<HTMLElement>(FOCUSABLE));
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      opener?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <>
      <div className="rds-panel-backdrop" onClick={onClose} aria-hidden="true" />
      <div ref={ref} className="rds-panel" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="rds-panel__header">
          <div>
            <h2 id={titleId} className="rds-panel__title">
              {title}
            </h2>
            {subtitle && <div style={{ marginTop: 4 }}>{subtitle}</div>}
          </div>
          <button type="button" className="rds-button rds-button--ghost rds-button--sm" onClick={onClose} aria-label="Close panel">
            ✕
          </button>
        </div>
        <div className="rds-panel__body">{children}</div>
        {footer && <div className="rds-panel__footer">{footer}</div>}
      </div>
    </>
  );
}
