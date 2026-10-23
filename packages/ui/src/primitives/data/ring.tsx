/** SVG donut gauge for a single 0-100 figure. */
import type { ReactNode } from "react";
import { clampPercent, meterBand, type MeterBand } from "./meter";

const STROKE_CLASSES: Record<MeterBand, string> = {
  green: "stroke-risk-green",
  amber: "stroke-risk-amber",
  orange: "stroke-risk-orange",
  red: "stroke-risk-red",
};

const CIRCUMFERENCE = 2 * Math.PI * 40;

export interface RingProps {
  /** Gauge percentage 0-100. */
  value: number;
  /** Short label under the number. */
  label?: string;
  /** Square size in px (default 96). */
  size?: number;
  /** Stroke band override; auto-mapped from the value when omitted. */
  band?: MeterBand;
}

export function Ring({ value, label, size = 96, band }: RingProps): ReactNode {
  const clamped = clampPercent(value);
  const dash = CIRCUMFERENCE * (1 - clamped / 100);
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" className="shrink-0">
      <title>Load ring at {Math.round(clamped)} percent</title>
      <circle cx="50" cy="50" r="40" fill="none" className="stroke-paper/15" strokeWidth="10" />
      <circle
        cx="50"
        cy="50"
        r="40"
        fill="none"
        className={STROKE_CLASSES[band ?? meterBand(value)]}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={dash}
        transform="rotate(-90 50 50)"
      />
      <text x="50" y="48" textAnchor="middle" dominantBaseline="central" fontSize="22" className="fill-paper font-mono">
        {Math.round(clamped)}
      </text>
      {label ? <text x="50" y="76" textAnchor="middle" fontSize="8" className="fill-paper/60">{label}</text> : null}
    </svg>
  );
}
