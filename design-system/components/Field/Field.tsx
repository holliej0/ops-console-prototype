import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

interface FieldShellProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  /** Hide the label visually but keep it for screen readers (use sparingly, e.g. a search box with a visible icon). */
  hideLabel?: boolean;
}

function FieldShell({
  id,
  label,
  hint,
  error,
  required,
  hideLabel,
  children,
}: FieldShellProps & { id: string; children: ReactNode }) {
  return (
    <div className="rds-field">
      <label htmlFor={id} className={hideLabel ? "rds-visually-hidden" : "rds-field__label"}>
        {label}
        {required && (
          <span className="rds-field__required" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {hint && !error && (
        <span id={`${id}-hint`} className="rds-field__hint">
          {hint}
        </span>
      )}
      {error && (
        <span id={`${id}-error`} className="rds-field__error" role="alert">
          <span aria-hidden="true">!</span>
          {error}
        </span>
      )}
    </div>
  );
}

const describedBy = (id: string, hint?: string, error?: string) =>
  error ? `${id}-error` : hint ? `${id}-hint` : undefined;

export type TextFieldProps = FieldShellProps & Omit<InputHTMLAttributes<HTMLInputElement>, "id">;

export function TextField({ label, hint, error, required, hideLabel, ...input }: TextFieldProps) {
  const id = useId();
  return (
    <FieldShell {...{ id, label, hint, error, required, hideLabel }}>
      <input
        {...input}
        id={id}
        className="rds-input"
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
      />
    </FieldShell>
  );
}

export type TextAreaProps = FieldShellProps & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id">;

export function TextArea({ label, hint, error, required, hideLabel, ...input }: TextAreaProps) {
  const id = useId();
  return (
    <FieldShell {...{ id, label, hint, error, required, hideLabel }}>
      <textarea
        {...input}
        id={id}
        className="rds-input"
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
      />
    </FieldShell>
  );
}

export interface SelectOption {
  value: string;
  label: string;
}

export type SelectProps = FieldShellProps &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, "id"> & { options: SelectOption[] };

/** A styled native select: keyboard, screen reader and mobile behavior come for free. */
export function Select({ label, hint, error, required, hideLabel, options, ...select }: SelectProps) {
  const id = useId();
  return (
    <FieldShell {...{ id, label, hint, error, required, hideLabel }}>
      <select
        {...select}
        id={id}
        className="rds-input"
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}
