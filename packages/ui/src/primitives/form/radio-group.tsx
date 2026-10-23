/** Single-choice group rendered as accessible radio inputs. */
import type { ReactNode } from "react";

export interface RadioOption {
  /** Submitted value. */
  value: string;
  /** Visible label. */
  label: string;
  /** Optional secondary line. */
  description?: string;
}

export interface RadioGroupProps {
  /** Shared input[type=radio] name. */
  name: string;
  /** Controlled value. */
  value: string;
  /** Options rendered in order. */
  options: readonly RadioOption[];
  /** Emits the next selected value. */
  onChange: (next: string) => void;
  /** Accessible group name. */
  label: string;
}

export function RadioGroup({ name, value, options, onChange, label }: RadioGroupProps): ReactNode {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-col gap-2">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <label
            key={option.value}
            className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-ink-10 bg-ink/50 px-3 py-2 focus-within:outline-2 focus-within:outline-saffron focus-within:outline-offset-2"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={selected}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            <span
              aria-hidden
              className={`mt-0.5 block size-3.5 shrink-0 rounded-full border ${selected ? "border-saffron bg-saffron" : "border-paper/40"}`}
            />
            <span className="flex min-w-0 flex-col">
              <span className="text-sm text-paper">{option.label}</span>
              {option.description ? <span className="text-xs text-paper/60">{option.description}</span> : null}
            </span>
          </label>
        );
      })}
    </div>
  );
}
