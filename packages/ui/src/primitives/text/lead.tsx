/** Slightly larger opening paragraph. */
import type { ReactNode } from "react";

export interface LeadProps {
  /** Body copy. */
  children: ReactNode;
  /** Extra classes merged onto the element. */
  className?: string;
}

export function Lead({ children, className = "" }: LeadProps): ReactNode {
  return (
    <p className={`max-w-prose text-lg leading-relaxed text-paper/80 ${className}`}>
      {children}
    </p>
  );
}
