/** Semantic domain tag: forecast / shahi / marshal / rail / risk. */
import type { ReactNode } from "react";

export type TagKind = "forecast" | "shahi" | "marshal" | "rail" | "risk";

const KIND_CLASSES: Record<TagKind, string> = {
  forecast: "border-river/40 bg-river/10 text-river",
  shahi: "border-saffron/40 bg-saffron/10 text-saffron",
  marshal: "border-gold/40 bg-gold/10 text-gold",
  rail: "border-lotus/40 bg-lotus/10 text-lotus",
  risk: "border-vermillion/40 bg-vermillion/10 text-vermillion",
};

export interface TagProps {
  /** Domain token driving colour. */
  kind: TagKind;
  /** Tag label. */
  children: ReactNode;
}

export function Tag({ kind, children }: TagProps): ReactNode {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${KIND_CLASSES[kind]}`}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}
