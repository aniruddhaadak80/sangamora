/** Themed multi-line text input. */
import type { ReactNode, TextareaHTMLAttributes } from "react";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Swaps the border to danger red for validation state. */
  invalid: boolean;
}

export function Textarea({ invalid, className = "", ...rest }: TextareaProps): ReactNode {
  return (
    <textarea
      className={`min-h-[90px] w-full rounded-lg border bg-ink px-3 py-2 text-sm text-paper transition-colors placeholder:text-paper/40 focus-visible:outline-2 focus-visible:outline-saffron focus-visible:outline-offset-2 ${invalid ? "border-vermillion" : "border-ink-10"} ${className}`}
      {...rest}
    />
  );
}
