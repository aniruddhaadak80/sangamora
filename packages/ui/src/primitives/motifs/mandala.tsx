/** Ornamental mandala ring with petal studs. */
import type { ReactNode } from "react";

export interface MandalaDot {
  readonly cx: number;
  readonly cy: number;
}

/** Deterministic dot positions around a ring of `petals` studs. */
export function mandalaDots(petals = 12, radius = 42, center = 50): readonly MandalaDot[] {
  const dots: MandalaDot[] = [];
  for (let i = 0; i < petals; i++) {
    const angle = (Math.PI * 2 * i) / petals - Math.PI / 2;
    dots.push({
      cx: Math.round(center + radius * Math.cos(angle)),
      cy: Math.round(center + radius * Math.sin(angle)),
    });
  }
  return dots;
}

export interface MandalaProps {
  /** Square render size in px (default 96). */
  size?: number;
  /** Extra classes merged onto the svg. */
  className?: string;
}

export function Mandala({ size = 96, className = "" }: MandalaProps): ReactNode {
  const dots = mandalaDots(12, size * 0.42, size / 2);
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" className={className}>
      <title>Ornamental mandala ring</title>
      <circle cx={size / 2} cy={size / 2} r={size * 0.48} fill="none" className="stroke-gold/40" strokeWidth="1" />
      <circle cx={size / 2} cy={size / 2} r={size * 0.32} fill="none" className="stroke-lotus/40" strokeWidth="1" strokeDasharray="3 3" />
      <circle cx={size / 2} cy={size / 2} r={size * 0.18} className="fill-festival/20" />
      {dots.map((dot, i) => (
        <circle
          key={`dot-${i}`}
          cx={dot.cx}
          cy={dot.cy}
          r={size * 0.045}
          className={i % 2 === 0 ? "fill-saffron" : "fill-gold"}
        />
      ))}
    </svg>
  );
}
