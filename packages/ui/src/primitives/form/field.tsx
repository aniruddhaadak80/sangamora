/** Label + hint + error wrapper for form controls. */
import type { ReactNode } from "react";
import { InlineError } from "../feedback/inline-error";

export interface FieldProps {
  /** Visible label text. */
  label: string;
  /** id of the wrapped control. */
  htmlFor: string;
  /** Help text; hidden while an error shows. */
  hint?: string;
  /** Validation message rendered as an alert. */
  error?: string;
  /** The form control. */
  children: ReactNode;
  /** Marks the label with a required star. */
  required?: boolean;
}

export function Field({ label, htmlFor, hint, error, children, required = false }: FieldProps): ReactNode {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-xs font-semibold uppercase tracking-wide text-paper/70">
        {label}
        {required ? <span aria-hidden className="text-vermillion"> *</span> : null}
      </label>
      {children}
      {error ? (
        <InlineError message={error} />
      ) : (
        hint ? <p className="text-xs text-paper/50">{hint}</p> : null
      )}
    </div>
  );
}
