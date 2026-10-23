/** 0-100 load bar with green/amber/orange/red risk bands. */
import type { ReactNode } from "react";

export type MeterBand = "green" | "amber" | "orange" | "red";

const FILL_CLASSES: Record<MeterBand, string> = {
  green: "bg-risk-green",
  amber: "bg-risk-amber",
  orange: "bg-risk-orange",
  red: "bg-risk-red",
};

/** Clamps any number into the 0-100 scale; NaN folds to 0. */
export function clampPercent(raw: number): number {
  if (Number.isNaN(raw)) return 0;
  return Math.min(100, Math.max(0, raw));
}

/** Maps a 0-100 load onto the risk palette (thresholds at 45 / 70 / 85). */
export function meterBand(value: number): MeterBand {
  const v = clampPercent(value);
  if (v >= 85) return "red";
  if (v >= 70) return "orange";
  if (v >= 45) return "amber";
  return "green";
}

export interface MeterProps {
  /** Load percentage 0-100; clamped and non-finite-safe. */
  value: number;
  /** Visible + accessible label. */
  label?: string;
  /** Prints the clamped value right of the label row. */
  showValue?: boolean;
}

export function Meter({ value, label, showValue = false }: MeterProps): ReactNode {
  const clamped = clampPercent(value);
  return (
    <div className="flex flex-col gap-1">
      {label || showValue ? (
        <div className="flex items-baseline justify-between gap-2">
          {label ? <span className="text-xs font-medium text-paper/70">{label}</span> : null}
          {showValue ? <span className="font-mono text-[11px] text-paper/60">{Math.round(clamped)}</span> : null}
        </div>
      ) : null}
      <div
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(clamped)}
        aria-label={label ?? "Load"}
        className="h-1.5 overflow-hidden rounded-full bg-paper/10"
      >
        <div className={`h-full rounded-full ${FILL_CLASSES[meterBand(value)]}`} style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}
