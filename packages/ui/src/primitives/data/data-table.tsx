/** Generic table with optional header sorting. */
import { useState } from "react";
import type { ReactNode } from "react";

export interface DataTableColumn<T extends object> {
  /** Row property carrying the cell text. */
  key: keyof T & string;
  /** Header label. */
  header: string;
  /** Right-align numeric content. */
  align?: "left" | "right";
}

/** Coerces any cell value into a comparable primitive. */
export function sortableValue(value: unknown): number | string {
  if (typeof value === "number") return value;
  if (typeof value === "string") return value;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (value instanceof Date) return value.getTime();
  return value == null ? "" : String(value);
}

/** Immutable, non-mutating sort of rows by a single key. */
export function sortRows<T extends object>(rows: readonly T[], key: keyof T & string, dir: "asc" | "desc"): T[] {
  const copy = [...rows];
  copy.sort((a, b) => {
    const va = sortableValue(a[key]);
    const vb = sortableValue(b[key]);
    const order =
      typeof va === "number" && typeof vb === "number"
        ? va - vb
        : String(va).localeCompare(String(vb));
    return dir === "asc" ? order : -order;
  });
  return copy;
}

export interface DataTableProps<T extends object> {
  /** Column declarations in display order. */
  columns: readonly DataTableColumn<T>[];
  /** Data rows; integrity is preserved (sort copies). */
  rows: readonly T[];
  /** Renders sort toggles in the header row. */
  sortable: boolean;
  /** Accessible table name. */
  ariaLabel: string;
  /** Extra classes merged onto the frame. */
  className?: string;
}

export function DataTable<T extends object>({ columns, rows, sortable, ariaLabel, className = "" }: DataTableProps<T>): ReactNode {
  const [sortKey, setSortKey] = useState<keyof T & string | null>(
    sortable ? (columns[0]?.key ?? null) : null,
  );
  const [dir, setDir] = useState<"asc" | "desc">("asc");
  const keyed = sortKey !== null ? sortRows(rows, sortKey, dir) : rows;
  return (
    <div className={`overflow-x-auto rounded-lg border border-ink-10 ${className}`}>
      <table aria-label={ariaLabel} className="w-full border-collapse text-left text-sm text-paper">
        <thead className="bg-ink/80 text-[11px] uppercase tracking-wide text-paper/60">
          <tr>
            {columns.map((col) => {
              const active = sortKey !== null && col.key === sortKey;
              return (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
                  className={`border-b border-ink-10 px-3 py-2 ${col.align === "right" ? "text-right" : ""}`}
                >
                  {sortable ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (active) {
                          setDir(dir === "asc" ? "desc" : "asc");
                        } else {
                          setSortKey(col.key);
                          setDir("asc");
                        }
                      }}
                      className="inline-flex items-center gap-1 uppercase focus-visible:outline-2 focus-visible:outline-saffron focus-visible:outline-offset-2"
                    >
                      {col.header}
                      <span aria-hidden className="font-mono">{active ? (dir === "asc" ? "▲" : "▼") : "↕"}</span>
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {keyed.map((row, index) => {
            const record = row as Record<string, unknown>;
            return (
              <tr key={`r-${index}`} className={index % 2 === 1 ? "bg-paper/5" : ""}>
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`border-b border-ink-10/60 px-3 py-2 ${col.align === "right" ? "text-right font-mono" : ""}`}
                  >
                    {String(sortableValue(record[col.key]))}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
