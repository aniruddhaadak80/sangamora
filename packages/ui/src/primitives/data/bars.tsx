/** Labelled SVG bar chart with a cycling palette. */
import type { ReactNode } from "react";

export type BarColor = "saffron" | "river" | "lotus" | "gold" | "marigold" | "vermillion";

const FILL_CLASSES: Record<BarColor, string> = {
  saffron: "fill-saffron",
  river: "fill-river",
  lotus: "fill-lotus",
  gold: "fill-gold",
  marigold: "fill-marigold",
  vermillion: "fill-vermillion",
};

export interface BarDatum {
  /** Bar label rendered under the baseline. */
  label: string;
  /** Value; non-finite folds to 0. */
  value: number;
  /** Optional colour override; palette cycles otherwise. */
  color?: BarColor;
}

export interface ScaledBar {
  readonly label: string;
  /** Height in viewBox units; 0-value bars render a 1-unit stub. */
  readonly height: number;
  readonly color: BarColor;
}

/** Deterministic scaling: heights proportional to the data maximum. */
export function scaleBars(bars: readonly BarDatum[]): readonly ScaledBar[] {
  const valueOf = (bar: BarDatum): number => (Number.isFinite(bar.value) ? Math.max(0, bar.value) : 0);
  if (bars.length === 0) return [];
  const max = Math.max(1e-9, ...bars.map(valueOf));
  const cycle: readonly BarColor[] = ["saffron", "river", "lotus"];
  return bars.map((bar, i) => ({
    label: bar.label,
    height: valueOf(bar) === 0 ? 1 : Math.max(4, Math.round((valueOf(bar) / max) * 84)),
    color: bar.color ?? cycle[i % cycle.length] ?? "saffron",
  }));
}

export interface BarsProps {
  /** Bars in order. */
  bars: readonly BarDatum[];
  /** Square size in px (default 120). */
  size?: number;
  /** Extra classes merged onto the svg. */
  className?: string;
}

export function Bars({ bars, size = 120, className = "" }: BarsProps): ReactNode {
  const data = scaleBars(bars);
  if (data.length === 0) return null;
  const slot = 100 / data.length;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" className={className}>
      <title>Bar chart of {data.length} labelled values</title>
      <line x1="0" y1="88" x2="100" y2="88" className="stroke-paper/20" strokeWidth="1" />
      {data.map((bar, i) => (
        <rect
          key={`b-${i}`}
          x={i * slot + slot * 0.18}
          y={88 - bar.height}
          width={slot * 0.64}
          height={bar.height}
          className={FILL_CLASSES[bar.color]}
        />
      ))}
      {data.map((bar, i) => (
        <text key={`l-${i}`} x={i * slot + slot * 0.5} y="97" fontSize="6" textAnchor="middle" className="fill-paper/70">
          {bar.label}
        </text>
      ))}
    </svg>
  );
}
