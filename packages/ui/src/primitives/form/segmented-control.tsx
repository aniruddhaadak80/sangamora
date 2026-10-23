/** Compact mutually-exclusive option strip (speed 1x/2x/4x/8x etc.). */
import type { ReactNode } from "react";

export interface SegmentedOption {
  /** Stable option id. */
  id: string;
  /** Visible label. */
  label: string;
}

export interface SegmentedControlProps {
  /** Options in order. */
  options: readonly SegmentedOption[];
  /** Currently selected option id. */
  value: string;
  /** Emits the next selected id. */
  onChange: (next: string) => void;
  /** Accessible group name. */
  label?: string;
}

export function SegmentedControl({ options, value, onChange, label }: SegmentedControlProps): ReactNode {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-lg border border-ink-10 bg-ink p-0.5">
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.id)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-saffron focus-visible:outline-offset-2 ${active ? "bg-saffron text-ink" : "text-paper/70 hover:text-paper"}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
