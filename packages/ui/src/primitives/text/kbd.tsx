/** Keyboard-chord badge. */
import type { ReactNode } from "react";

export interface KbdProps {
  /** Chord content, e.g. individual keys or + chains. */
  children: ReactNode;
  /** Extra classes merged onto the element. */
  className?: string;
}

export function Kbd({ children, className = "" }: KbdProps): ReactNode {
  return (
    <kbd className={`rounded border border-ink-10 bg-ink px-1.5 py-0.5 font-mono text-xs text-paper ${className}`}>
      {children}
    </kbd>
  );
}
