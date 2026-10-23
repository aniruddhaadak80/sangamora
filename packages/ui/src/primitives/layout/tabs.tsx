/** Controlled tab strip for sibling panels. */
import type { ReactNode } from "react";

export interface TabDef {
  /** Stable tab id. */
  id: string;
  /** Visible label. */
  label: string;
  /** Optional count badge. */
  badge?: string;
}

export interface TabsProps {
  /** Currently selected tab id. */
  value: string;
  /** Emits the next selected id. */
  onChange: (id: string) => void;
  /** Tabs in display order. */
  tabs: readonly TabDef[];
  /** Accessible tablist name. */
  label: string;
}

export function Tabs({ value, onChange, tabs, label }: TabsProps): ReactNode {
  return (
    <div role="tablist" aria-label={label} className="flex gap-1 overflow-x-auto border-b border-ink-10">
      {tabs.map((tab) => {
        const selected = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-saffron focus-visible:outline-offset-2 ${selected ? "border-saffron text-paper" : "border-transparent text-paper/60 hover:text-paper"}`}
          >
            {tab.label}
            {tab.badge ? (
              <span className="ml-1.5 rounded-full bg-paper/10 px-1.5 py-0.5 font-mono text-[10px] text-paper/70">
                {tab.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
