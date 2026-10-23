/** Standard body paragraph. */
import type { ReactNode } from "react";

export interface PProps {
  /** Body copy. */
  children: ReactNode;
  /** Extra classes merged onto the element. */
  className?: string;
}

export function P({ children, className = "" }: PProps): ReactNode {
  return <p className={`max-w-prose text-sm leading-relaxed text-paper/75 ${className}`}>{children}</p>;
}
