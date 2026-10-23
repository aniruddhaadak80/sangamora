/** Componentized grid with a fixed column/gap vocabulary. */
import type { ReactNode } from "react";

export type GridCols = 1 | 2 | 3 | 4 | 6 | 12;

export type GridGap = 2 | 3 | 4 | 6;

const COLS_CLASSES: Record<GridCols, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-2 lg:grid-cols-4",
  6: "grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
  12: "grid-cols-2 lg:grid-cols-4 xl:grid-cols-12",
};

const GAP_CLASSES: Record<GridGap, string> = {
  2: "gap-2",
  3: "gap-3",
  4: "gap-4",
  6: "gap-6",
};

export interface GridProps {
  /** Column track preset (responsive collapses for 4/6/12). */
  cols: GridCols;
  /** Gutter scale. */
  gap: GridGap;
  /** Cell children. */
  children: ReactNode;
  /** Extra classes merged onto the grid. */
  className?: string;
}

export function Grid({ cols, gap, children, className = "" }: GridProps): ReactNode {
  return (
    <div className={`grid ${COLS_CLASSES[cols]} ${GAP_CLASSES[gap]} ${className}`}>
      {children}
    </div>
  );
}
