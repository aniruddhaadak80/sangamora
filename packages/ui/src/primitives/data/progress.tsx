/** Determinate 0-100 progress bar with band colours. */
import type { ReactNode } from "react";
import { clampPercent, meterBand, type MeterBand } from "./meter";

const BAND_CLASSES: Record<MeterBand, string> = {
  green: "bg-risk-green",
  amber: "bg-risk-amber",
  orange: "bg-risk-orange",
  red: "bg-risk-red",
};

export interface ProgressProps {
  /** Completion percentage 0-100; clamped. */
  value: number;
  /** Fill colour override; auto-banded from the value otherwise. */
  band?: MeterBand;
  /** Accessible progressbar name. */
  label?: string;
  /** Extra classes merged onto the track. */
  className?: string;
}

export function Progress({ value, band, label, className = "" }: ProgressProps): ReactNode {
  const clamped = clampPercent(value);
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      aria-label={label ?? "Progress"}
      className={`h-2 overflow-hidden rounded-full bg-paper/10 ${className}`}
    >
      <div
        className={`h-full rounded-full ${BAND_CLASSES[band ?? meterBand(value)]}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
