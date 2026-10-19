import type { ReactNode } from "react";
import type { Tone } from "../Badge/Badge";

export interface AlertProps {
  tone?: Exclude<Tone, "neutral">;
  title: string;
  children?: ReactNode;
  /** Optional action, e.g. a Button to retry or undo. */
  action?: ReactNode;
}

const icons = { info: "i", success: "✓", warning: "!", danger: "!" } as const;

/**
 * Inline message for the current view. Danger and warning use role="alert" so they are
 * announced right away; info and success use role="status" so they don't interrupt.
 */
export function Alert({ tone = "info", title, children, action }: AlertProps) {
  const urgent = tone === "danger" || tone === "warning";
  return (
    <div className={`rds-alert rds-alert--${tone}`} role={urgent ? "alert" : "status"}>
      <span className="rds-alert__icon" aria-hidden="true">
        {icons[tone]}
      </span>
      <div>
        <p className="rds-alert__title">{title}</p>
        {children && <p className="rds-alert__body">{children}</p>}
      </div>
      {action}
    </div>
  );
}
