/** Sticky application header with brand block and actions. */
import type { ReactNode } from "react";

export interface TopbarProps {
  /** App or page title. */
  title: string;
  /** Secondary tag beside the title. */
  subtitle?: string;
  /** Right-aligned action cluster. */
  actions?: ReactNode;
  /** Optional middle area (search etc.). */
  children?: ReactNode;
}

export function Topbar({ title, subtitle, actions, children }: TopbarProps): ReactNode {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-ink-10 bg-ink/80 px-4 py-2.5 backdrop-blur">
      <div className="flex min-w-0 items-baseline gap-3">
        <h2 className="truncate text-sm font-semibold text-paper">{title}</h2>
        {subtitle ? <p className="hidden shrink-0 text-[11px] text-paper/50 sm:block">{subtitle}</p> : null}
      </div>
      {children ? <div className="hidden flex-1 md:block">{children}</div> : null}
      <div className="flex shrink-0 items-center gap-2">{actions}</div>
    </header>
  );
}
