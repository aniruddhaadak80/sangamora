/** Uppercase mono caption used above headings. */
import type { ReactNode } from "react";

export interface EyebrowProps {
  /** Caption content. */
  children: ReactNode;
  /** Extra classes merged onto the element. */
  className?: string;
}

export function Eyebrow({ children, className = "" }: EyebrowProps): ReactNode {
  return (
    <p className={`font-mono text-[11px] uppercase tracking-widest text-saffron ${className}`}>
      {children}
    </p>
  );
}
