/** Term/description stack for detail panels. */
import type { ReactNode } from "react";

export interface DetailItem {
  /** Left-hand label. */
  term: string;
  /** Right-hand value. */
  description: ReactNode;
}

export interface DetailProps {
  /** Rows in order. */
  items: readonly DetailItem[];
  /** Extra classes merged onto the list. */
  className?: string;
}

export function Detail({ items, className = "" }: DetailProps): ReactNode {
  return (
    <dl className={`divide-y divide-ink-10 ${className}`}>
      {items.map((item) => (
        <div key={item.term} className="grid grid-cols-[auto_1fr] items-baseline gap-x-4 py-1.5">
          <dt className="shrink-0 text-xs uppercase tracking-wide text-paper/55">{item.term}</dt>
          <dd className="text-right font-mono text-sm text-paper">{item.description}</dd>
        </div>
      ))}
    </dl>
  );
}
