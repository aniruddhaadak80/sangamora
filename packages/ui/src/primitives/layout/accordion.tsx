/** Controlled single-open disclosure list. */
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

export interface AccordionItem {
  /** Stable item id. */
  id: string;
  /** Header label. */
  title: string;
  /** Collapsible body. */
  body: ReactNode;
}

export interface AccordionProps {
  /** The one open item; null collapses everything. */
  openId: string | null;
  /** Emits the next open id (null to collapse). */
  onOpenChange: (id: string | null) => void;
  /** Items in display order. */
  items: readonly AccordionItem[];
}

export function Accordion({ openId, onOpenChange, items }: AccordionProps): ReactNode {
  return (
    <ul className="divide-y divide-ink-10 rounded-lg border border-ink-10">
      {items.map((item) => {
        const open = item.id === openId;
        return (
          <li key={item.id}>
            <button
              type="button"
              aria-expanded={open}
              onClick={() => onOpenChange(open ? null : item.id)}
              className="flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left text-sm font-semibold text-paper hover:bg-paper/5 focus-visible:outline-2 focus-visible:outline-saffron focus-visible:outline-offset-2"
            >
              {item.title}
              <ChevronDown
                className={`size-4 shrink-0 text-paper/60 transition-transform ${open ? "rotate-180" : ""}`}
                aria-hidden
              />
            </button>
            {open ? <div className="px-3.5 pb-3 text-sm leading-relaxed text-paper/75">{item.body}</div> : null}
          </li>
        );
      })}
    </ul>
  );
}
