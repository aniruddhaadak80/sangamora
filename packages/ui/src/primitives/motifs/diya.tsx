/** Oil-lamp motif with a framer-motion flickering flame. */
import { motion } from "framer-motion";
import type { ReactNode } from "react";

export interface DiyaProps {
  /** Square render size in px (default 96). */
  size?: number;
  /** Extra classes merged onto the svg. */
  className?: string;
}

export function Diya({ size = 96, className = "" }: DiyaProps): ReactNode {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" className={className}>
      <title>Diya oil lamp with a flickering flame</title>
      <motion.path
        d="M50 18 C60 30 62 38 56 46 C53 51 47 51 44 46 C38 38 40 30 50 18 Z"
        className="fill-saffron"
        style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}
        animate={{ scaleY: [1, 1.08, 0.94, 1.05, 1], scaleX: [1, 0.94, 1.03, 0.97, 1], opacity: [1, 0.85, 0.95, 0.8, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.path
        d="M50 30 C55 36 56 40 53 44 C51 47 48 47 46 44 C44 40 45 36 50 30 Z"
        className="fill-marigold"
        style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}
        animate={{ scaleY: [1, 0.9, 1.06] }}
        transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* wick */}
      <line x1="50" y1="46" x2="50" y2="50" className="stroke-ink" strokeWidth="2" />
      {/* oil glow on the rim */}
      <ellipse cx="50" cy="56" rx="24" ry="3" className="fill-saffron/30" />
      {/* clay bowl */}
      <path d="M20 56 Q50 78 80 56 Q70 86 50 86 Q30 86 20 56 Z" className="fill-vermillion" fillOpacity="0.9" />
      <path d="M18 55 Q50 65 82 55" fill="none" className="stroke-gold" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
