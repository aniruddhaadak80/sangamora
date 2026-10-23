/** Small tinted pill with a fixed palette vocabulary. */
import type { ReactNode } from "react";

export type BadgeTone = "neutral" | "saffron" | "river" | "lotus" | "vermillion" | "gold";

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: "border-paper/25 bg-paper/10 text-paper",
  saffron: "border-saffron/40 bg-saffron/15 text-saffron",
  river: "border-river/40 bg-river/15 text-river",
  lotus: "border-lotus/40 bg-lotus/15 text-lotus",
  vermillion: "border-vermillion/40 bg-vermillion/15 text-vermillion",
  gold: "border-gold/40 bg-gold/15 text-gold",
};

export interface BadgeProps {
  /** Palette tone. */
  tone: BadgeTone;
  /** Pill content. */
  children: ReactNode;
}

export function Badge({ tone, children }: BadgeProps): ReactNode {
  return (
    <span className={`inline-flex rounded-md border px-1.5 py-0.5 text-[11px] font-semibold ${TONE_CLASSES[tone]}`}>
      {children}
    </span>
  );
}
