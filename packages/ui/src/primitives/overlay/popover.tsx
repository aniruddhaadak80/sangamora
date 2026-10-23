/** Small anchored panel toggled from a labelled trigger. */
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

export interface PopoverProps {
  /** Trigger button label. */
  trigger: string;
  /** Panel content. */
  children: ReactNode;
  /** Aligns the panel to the left or right edge of the trigger. */
  align?: "left" | "right";
}

export function Popover({ trigger, children, align = "left" }: PopoverProps): ReactNode {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open) return;
    const onDocDown = (event: MouseEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div ref={root} className="relative inline-block">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="rounded-lg border border-ink-10 bg-ink px-3 py-1.5 text-xs font-semibold text-paper transition-colors hover:bg-ink-muted focus-visible:outline-2 focus-visible:outline-saffron focus-visible:outline-offset-2"
      >
        {trigger}
      </button>
      {open ? (
        <div
          role="dialog"
          aria-label={trigger}
          className={`absolute ${align === "left" ? "left-0" : "right-0"} z-20 mt-2 w-56 rounded-lg border border-ink-10 bg-surface p-3 text-sm text-paper/80 shadow-lg`}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
