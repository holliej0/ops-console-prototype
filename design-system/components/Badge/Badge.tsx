import type { HTMLAttributes } from "react";

export type Tone = "neutral" | "info" | "success" | "warning" | "danger";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  /** Adds a status dot. The text still carries the meaning, so color is never the only signal. */
  dot?: boolean;
}

export function Badge({ tone = "neutral", dot = false, className = "", children, ...rest }: BadgeProps) {
  return (
    <span {...rest} className={`rds-badge rds-badge--${tone} ${className}`.trim()}>
      {dot && <span className="rds-badge__dot" aria-hidden="true" />}
      {children}
    </span>
  );
}
