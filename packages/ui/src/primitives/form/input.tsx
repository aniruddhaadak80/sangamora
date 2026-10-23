/** Themed single-line text input. */
import type { InputHTMLAttributes, ReactNode } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Swaps the border to danger red for validation state. */
  invalid: boolean;
}

export function Input({ invalid, className = "", ...rest }: InputProps): ReactNode {
  return (
    <input
      className={`w-full rounded-lg border bg-ink px-3 py-2 text-sm text-paper transition-colors placeholder:text-paper/40 focus-visible:outline-2 focus-visible:outline-saffron focus-visible:outline-offset-2 ${invalid ? "border-vermillion" : "border-ink-10"} ${className}`}
      {...rest}
    />
  );
}
