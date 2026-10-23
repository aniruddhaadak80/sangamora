/** Themed dropdown with a themed caret on dark surfaces. */
import { ChevronDown } from "lucide-react";
import type { ReactNode, SelectHTMLAttributes } from "react";

export interface SelectOption {
  /** Submitted value. */
  value: string;
  /** Displayed label. */
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /** Flat option list; pass children instead for optgroups. */
  options: readonly SelectOption[];
  /** Swaps the border to danger red for validation state. */
  invalid: boolean;
}

export function Select({ options, invalid, className = "", ...rest }: SelectProps): ReactNode {
  return (
    <span className="relative block">
      <select
        className={`w-full appearance-none rounded-lg border bg-ink py-2 pl-3 pr-9 text-sm text-paper transition-colors focus-visible:outline-2 focus-visible:outline-saffron focus-visible:outline-offset-2 ${invalid ? "border-vermillion" : "border-ink-10"} ${className}`}
        {...rest}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-ink text-paper">
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-paper/50"
        aria-hidden
      />
    </span>
  );
}
