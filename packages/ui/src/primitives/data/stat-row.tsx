/** Even strip of Stat figures for dashboard rows. */
import type { ReactNode } from "react";
import { Stat } from "./stat";
import type { StatProps } from "./stat";

export type StatEntry = StatProps;

export interface StatRowProps {
  /** Stats rendered across the strip. */
  stats: readonly StatEntry[];
  /** Extra classes merged onto the grid. */
  className?: string;
}

export function StatRow({ stats, className = "" }: StatRowProps): ReactNode {
  return (
    <div className={`grid grid-cols-2 gap-3 lg:grid-cols-4 ${className}`}>
      {stats.map((stat) => (
        <Stat key={stat.label} {...stat} />
      ))}
    </div>
  );
}
