/** Frosted glass panel for app chrome and overlay cards. */
import type { ReactNode } from "react";

export interface SurfaceProps {
  /** Content inside the glass panel. */
  children: ReactNode;
  /** Extra classes merged onto the panel. */
  className?: string;
}

export function Surface({ children, className = "" }: SurfaceProps): ReactNode {
  return <div className={`rounded-lg border border-ink-10 bg-surface/70 shadow-sm backdrop-blur-md ${className}`}>{children}</div>;
}
