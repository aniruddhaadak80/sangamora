/** CSS-only hover tooltip via group visibility + a title fallback. */
import type { ReactNode } from "react";

export interface TooltipProps {
  /** Tooltip copy; also carried by the wrapper's title attribute. */
  tip: string;
  /** Trigger content. */
  children: ReactNode;
}

export function Tooltip({ tip, children }: TooltipProps): ReactNode {
  return (
    <span className="group relative inline-flex" tabIndex={-1} title={tip}>
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-ink-10 bg-surface px-2 py-1 text-[10px] text-paper shadow-sm group-hover:block group-focus-within:block"
      >
        {tip}
      </span>
    </span>
  );
}
