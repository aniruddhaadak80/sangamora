/** Wave-pattern SVG divider line. */
import type { ReactNode } from "react";

export type DividerTone = "saffron" | "river" | "lotus";

const STROKE_CLASSES: Record<DividerTone, string> = {
  saffron: "stroke-saffron/50",
  river: "stroke-river/50",
  lotus: "stroke-lotus/50",
};

export interface DividerProps {
  /** Stroke colour token. */
  tone: DividerTone;
  /** Extra classes; height utilities compose well. */
  className?: string;
}

export function Divider({ tone, className = "" }: DividerProps): ReactNode {
  return (
    <svg viewBox="0 0 120 8" preserveAspectRatio="none" role="img" className={`h-2 w-full ${className}`}>
      <title>Wave divider ornament</title>
      <path
        d="M0 4 Q 7.5 0 15 4 T 30 4 T 45 4 T 60 4 T 75 4 T 90 4 T 105 4 T 120 4"
        fill="none"
        className={STROKE_CLASSES[tone]}
        strokeWidth="1.5"
      />
    </svg>
  );
}
