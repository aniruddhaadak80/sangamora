/** Accessible on/off control with a sliding thumb. */
import type { ReactNode } from "react";

export interface SwitchProps {
  /** Accessible name. */
  label: string;
  /** Controlled state. */
  checked: boolean;
  /** State change callback with the next value. */
  onCheckedChange: (checked: boolean) => void;
  /** Disables interaction. */
  disabled?: boolean;
  /** Extra classes merged onto the control. */
  className?: string;
}

export function Switch({ label, checked, onCheckedChange, disabled = false, className = "" }: SwitchProps): ReactNode {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors focus-visible:outline-2 focus-visible:outline-saffron focus-visible:outline-offset-2 ${checked ? "bg-river" : "bg-paper/20"} ${className}`}
    >
      <span
        className={`block size-4 rounded-full bg-paper shadow transition-transform ${checked ? "translate-x-4" : ""}`}
      />
    </button>
  );
}
