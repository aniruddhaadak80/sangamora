/** Single key-value row with a mono value slot. */
import type { ReactNode } from "react";

export interface KvProps {
  /** Left-hand key. */
  k: string;
  /** Right-hand value. */
  v: ReactNode;
  /** Value font: mono (default) or plain body. */
  mono: boolean;
}

export function Kv({ k, v, mono = true }: KvProps): ReactNode {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-ink-10/60 py-1.5 text-sm">
      <dt className="shrink-0 text-xs uppercase tracking-wide text-paper/55">{k}</dt>
      <dd className={`text-right text-paper ${mono ? "font-mono" : ""}`}>{v}</dd>
    </div>
  );
}
