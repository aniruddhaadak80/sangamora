/** Thin vertical icon rail for section navigation. */
import type { ReactNode } from "react";

export interface RailItem {
  /** Stable item id. */
  id: string;
  /** Accessible + title label. */
  label: string;
  /** Icon glyph. */
  icon: ReactNode;
}

export interface RailProps {
  /** Items top-to-bottom. */
  items: readonly RailItem[];
  /** Active item id. */
  activeId: string;
  /** Emits the clicked item id. */
  onNavigate: (id: string) => void;
  /** Accessible nav name. */
  label: string;
}

export function Rail({ items, activeId, onNavigate, label }: RailProps): ReactNode {
  return (
    <nav aria-label={label} className="flex h-full w-12 shrink-0 flex-col items-center gap-1 border-r border-ink-10 bg-ink/70 py-2">
      {items.map((item) => {
        const active = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            title={item.label}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
            onClick={() => onNavigate(item.id)}
            className={`grid size-9 place-items-center rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-saffron focus-visible:outline-offset-2 ${active ? "bg-saffron/15 text-saffron" : "text-paper/60 hover:bg-paper/10 hover:text-paper"}`}
          >
            {item.icon}
          </button>
        );
      })}
    </nav>
  );
}
