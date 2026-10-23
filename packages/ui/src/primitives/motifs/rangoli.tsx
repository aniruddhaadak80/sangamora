/** Decorative rangoli: 12 radial triangles in a symmetric mandala. */
import type { ReactNode } from "react";

export interface RangoliTriangle {
  /** First polygon vertex "x,y". */
  readonly p0: string;
  /** Tip vertex "x,y". */
  readonly p1: string;
  /** Third vertex "x,y". */
  readonly p2: string;
  /** Palette fill class cycling the festival palette. */
  readonly fill: string;
}

const FILLS: readonly string[] = [
  "fill-saffron",
  "fill-marigold",
  "fill-lotus",
  "fill-river",
  "fill-gold",
  "fill-festival",
];

/**
 * Deterministic triangle geometry for `sectors` wedges inside a square of
 * `size` px. Same inputs → identical output on every run.
 */
export function rangoliTriangles(sectors = 12, size = 96): readonly RangoliTriangle[] {
  const c = size / 2;
  const inner = (size / 2) * 0.42;
  const outer = (size / 2) * 0.92;
  const step = (Math.PI * 2) / sectors;
  const out: RangoliTriangle[] = [];
  for (let i = 0; i < sectors; i++) {
    const a0 = i * step - Math.PI / 2;
    const a1 = a0 + step / 2;
    const a2 = a0 + step;
    const pt = (r: number, a: number): string =>
      `${Math.round(c + r * Math.cos(a))},${Math.round(c + r * Math.sin(a))}`;
    out.push({
      p0: pt(inner, a0),
      p1: pt(outer, a1),
      p2: pt(inner, a2),
      fill: FILLS[i % FILLS.length] ?? "fill-saffron",
    });
  }
  return out;
}

export interface RangoliProps {
  /** Square render size in px (default 96). */
  size?: number;
  /** Extra classes merged onto the svg. */
  className?: string;
}

export function Rangoli({ size = 96, className = "" }: RangoliProps): ReactNode {
  const triangles = rangoliTriangles(12, size);
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" className={className}>
      <title>Decorative rangoli mandala with 12 sectors</title>
      {triangles.map((t, i) => (
        <polygon
          key={`t-${i}`}
          points={`${t.p0} ${t.p1} ${t.p2}`}
          className={t.fill}
          fillOpacity={i % 2 === 0 ? 0.85 : 0.55}
        />
      ))}
      <circle cx={size / 2} cy={size / 2} r={size * 0.16} className="fill-paper" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={size * 0.46}
        fill="none"
        className="stroke-saffron/40"
        strokeWidth="1"
        strokeDasharray="3 3"
      />
    </svg>
  );
}
