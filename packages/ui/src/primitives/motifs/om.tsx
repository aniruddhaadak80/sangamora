/** Devanagari ओम glyph motif rendered as SVG text (no emoji). */
import type { ReactNode } from "react";

export interface OmProps {
  /** Square render size in px (default 96). */
  size?: number;
  /** Extra classes merged onto the svg. */
  className?: string;
}

export function Om({ size = 96, className = "" }: OmProps): ReactNode {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" className={className}>
      <title>ओम — the Om symbol</title>
      <circle cx="50" cy="50" r="46" fill="none" className="stroke-saffron/30" strokeWidth="1.5" strokeDasharray="4 3" />
      <text
        x="50"
        y="54"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="64"
        className="fill-saffron"
      >
        ॐ
      </text>
    </svg>
  );
}
