/** Animated numeric counter that tweens between previous and next values. */
import { animate, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

/** Folds hostile counter inputs to 0: NaN, Infinity and negatives clamp. */
export function sanitizeCounter(raw: number): number {
  if (!Number.isFinite(raw)) return 0;
  return Math.max(0, raw);
}

export interface TickerProps {
  /** Target value; animates up from the previously displayed value. */
  value: number;
  /** Accessible description of what is counted. */
  label: string;
  /** Extra classes merged onto the number. */
  className?: string;
}

export function Ticker({ value, label, className = "" }: TickerProps): ReactNode {
  const reduce = useReducedMotion() ?? false;
  const last = useRef(sanitizeCounter(value));
  const [display, setDisplay] = useState(() => sanitizeCounter(value));
  useEffect(() => {
    const target = sanitizeCounter(value);
    const controls = animate(last.current, target, {
      duration: reduce ? 0 : 0.9,
      ease: "easeOut",
      onUpdate: (latest) => {
        last.current = latest;
        setDisplay(latest);
      },
    });
    return () => controls.stop();
  }, [value, reduce]);
  return (
    <span className={`font-mono text-paper ${className}`} title={label}>
      {Math.round(display).toLocaleString("en-IN")}
    </span>
  );
}
