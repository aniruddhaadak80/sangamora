/** Trend sparkline from a readonly number series (deterministic path). */
import type { ReactNode } from "react";

/**
 * Deterministic polyline points for a series inside a width x height box.
 * Values are min/max normalised per call; non-finite values are dropped;
 * a flat series renders as a centred horizontal line. Same inputs always
 * produce the same string.
 */
export function sparklinePoints(values: readonly number[], width: number, height: number, pad = 2): string {
  const series = values.filter((v) => Number.isFinite(v));
  if (series.length === 0) return "";
  let min = Infinity;
  let max = -Infinity;
  for (const v of series) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const round2 = (x: number): number => Math.round(x * 100) / 100;
  const y = (v: number): number =>
    round2(height - pad - ((v - min) / (max - min)) * (height - pad * 2));
  const spanX = series.length > 1 ? (width - pad * 2) / (series.length - 1) : 0;
  return series
    .map((v, i) => `${round2(series.length > 1 ? pad + spanX * i : width / 2)},${y(v)}`)
    .join(" ");
}

export interface SparklineProps {
  /** Series to plot; non-finite entries are dropped. */
  values: readonly number[];
  /** SVG width in px (default 120). */
  width?: number;
  /** SVG height in px (default 32). */
  height?: number;
  /** Extra classes merged onto the svg. */
  className?: string;
}

export function Sparkline({ values, width = 120, height = 32, className = "" }: SparklineProps): ReactNode {
  const points = sparklinePoints(values, width, height);
  if (points === "") return null;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} role="img" className={className}>
      <title>Trend line across {values.length} plotted points</title>
      <polyline
        points={points}
        fill="none"
        className="stroke-saffron"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
