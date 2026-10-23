/** Metric figure with mono value, optional delta arrow and caption. */
import type { ReactNode } from "react";

export type StatDirection = "up-good" | "down-good";

export interface StatProps {
  /** Small metric name. */
  label: string;
  /** Pre-formatted value shown in the mono face. */
  value: string;
  /** Signed delta, e.g. -5.2; arrow follows the sign. */
  delta?: number;
  /** Which delta sign reads as improvement. */
  direction?: StatDirection;
  /** Footnote under the value. */
  caption?: string;
}

export function Stat({ label, value, delta, direction = "up-good", caption }: StatProps): ReactNode {
  const positive = delta !== undefined && delta >= 0;
  const good = positive === (direction === "up-good");
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-ink-10 bg-ink/50 px-3 py-2.5">
      <span className="text-[11px] uppercase tracking-wide text-paper/50">{label}</span>
      <span className="font-mono text-xl text-paper">{value}</span>
      {delta === undefined ? null : (
        <span className={`text-xs font-semibold ${good ? "text-risk-green" : "text-vermillion"}`}>
          <span aria-hidden>{positive ? "▲" : "▼"}</span> {Math.abs(delta).toFixed(1)}
        </span>
      )}
      {caption ? <span className="text-[11px] text-paper/40">{caption}</span> : null}
    </div>
  );
}
