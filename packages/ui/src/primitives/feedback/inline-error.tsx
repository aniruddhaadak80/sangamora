/** Single-line field-level error with alert semantics. */
import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";

export interface InlineErrorProps {
  /** Error copy. */
  message: string;
  /** Extra classes merged onto the line. */
  className?: string;
}

export function InlineError({ message, className = "" }: InlineErrorProps): ReactNode {
  return (
    <p role="alert" className={`flex items-center gap-1 text-xs text-vermillion ${className}`}>
      <CircleAlert className="size-3.5 shrink-0" aria-hidden />
      <span>{message}</span>
    </p>
  );
}
