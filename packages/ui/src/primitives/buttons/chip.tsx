/** Compact status pill with palette-mapped colours. */
import type { ReactNode } from "react";

export type ChipStatus = "neutral" | "info" | "success" | "warn" | "danger";

const STATUS_CLASSES: Record<ChipStatus, string> = {
  neutral: "bg-paper/10 text-paper",
  info: "bg-river/15 text-river",
  success: "bg-risk-green/15 text-risk-green",
  warn: "bg-risk-amber/15 text-risk-amber",
  danger: "bg-vermillion/15 text-vermillion",
};

export interface ChipProps {
  /** Palette status driving colours. */
  status: ChipStatus;
  /** Label content. */
  children: ReactNode;
  /** Extra classes merged onto the pill. */
  className?: string;
}

export function Chip({ status, children, className = "" }: ChipProps): ReactNode {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${STATUS_CLASSES[status]} ${className}`}>
      {children}
    </span>
  );
}
