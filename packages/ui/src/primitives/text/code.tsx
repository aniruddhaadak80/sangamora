/** Inline code chip. */
import type { ReactNode } from "react";

export interface CodeProps {
  /** Code content. */
  children: ReactNode;
  /** Extra classes merged onto the element. */
  className?: string;
}

export function Code({ children, className = "" }: CodeProps): ReactNode {
  return (
    <code className={`rounded bg-ink px-1.5 py-0.5 font-mono text-xs text-river ${className}`}>
      {children}
    </code>
  );
}
