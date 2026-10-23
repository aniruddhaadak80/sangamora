/** Hairline separator with an optional centred caption. */
import type { ReactNode } from "react";

export interface RuleProps {
  /** Optional centered caption. */
  label?: string;
  /** Extra classes merged onto the wrapper. */
  className?: string;
}

export function Rule({ label, className = "" }: RuleProps): ReactNode {
  return (
    <div role="separator" className={`flex items-center gap-3 ${className}`}>
      <span aria-hidden className="h-px flex-1 bg-ink-10" />
      {label ? <span className="font-mono text-[10px] uppercase tracking-widest text-saffron">{label}</span> : null}
      <span aria-hidden className="h-px flex-1 bg-ink-10" />
    </div>
  );
}
