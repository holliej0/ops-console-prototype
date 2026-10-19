import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Use one primary button per view for the main action. */
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner, keeps the label visible and blocks repeat clicks. */
  loading?: boolean;
  /** Optional icon placed before the label. Decorative, so it is hidden from screen readers. */
  icon?: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  disabled,
  children,
  className = "",
  type = "button",
  onClick,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      className={`rds-button rds-button--${variant} rds-button--${size} ${className}`.trim()}
      // aria-disabled instead of disabled while loading keeps focus on the button,
      // so keyboard and screen reader users don't lose their place.
      disabled={disabled}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      onClick={loading ? (e) => e.preventDefault() : onClick}
    >
      {loading ? <span className="rds-button__spinner" aria-hidden="true" /> : icon ? <span aria-hidden="true">{icon}</span> : null}
      {children}
    </button>
  );
}
