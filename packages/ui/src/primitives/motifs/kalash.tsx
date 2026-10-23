/** Ceremonial kalash pot motif. */
import type { ReactNode } from "react";

export interface KalashProps {
  /** Square render size in px (default 96). */
  size?: number;
  /** Extra classes merged onto the svg. */
  className?: string;
}

export function Kalash({ size = 96, className = "" }: KalashProps): ReactNode {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" className={className}>
      <title>Kalash ceremonial pot with leaves and coconut</title>
      {/* pot body */}
      <path d="M30 44 C24 60 30 80 50 80 C70 80 76 60 70 44 Z" className="fill-gold" fillOpacity="0.9" />
      {/* belly band */}
      <path d="M31 60 H69" className="stroke-marigold" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="6 4" />
      {/* rim */}
      <rect x="28" y="36" width="44" height="8" rx="4" className="fill-marigold" />
      {/* neck */}
      <rect x="39" y="27" width="22" height="9" rx="4" className="fill-gold" />
      {/* coconut */}
      <circle cx="50" cy="22" r="8" className="fill-saffron" />
      <line x1="50" y1="20" x2="50" y2="24" className="stroke-ink" strokeWidth="1.5" />
      {/* mango leaves */}
      <path d="M40 32 C28 28 24 20 26 14 C36 18 40 26 40 32 Z" className="fill-river" />
      <path d="M60 32 C72 28 76 20 74 14 C64 18 60 26 60 32 Z" className="fill-river" />
    </svg>
  );
}
