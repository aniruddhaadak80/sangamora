/** Border-ring loading spinner. */
import type { ReactNode } from "react";

export interface SpinnerProps {
  /** Box size in px (default 16). */
  size?: number;
  /** Extra classes merged onto the element. */
  className?: string;
}

export function Spinner({ size = 16, className = "" }: SpinnerProps): ReactNode {
  return (
    <span role="status" className={`inline-block ${className}`}>
      <span
        aria-hidden
        style={{ width: size, height: size }}
        className="inline-block animate-spin rounded-full border-2 border-paper/25 border-t-saffron"
      />
      <span className="sr-only">Loading</span>
    </span>
  );
}
