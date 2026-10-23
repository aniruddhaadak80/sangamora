/** Ranked display heading with type-scale proliferation. */
import type { ReactNode } from "react";

export type HeadingSize = "display-xl" | "display-lg" | "display" | "h3" | "h4";

const SIZE_CLASSES: Record<HeadingSize, string> = {
  "display-xl": "text-4xl font-serif tracking-tight sm:text-5xl lg:text-6xl",
  "display-lg": "text-3xl font-serif tracking-tight sm:text-4xl",
  display: "text-2xl font-serif tracking-tight sm:text-3xl",
  h3: "text-xl font-semibold",
  h4: "text-sm font-semibold uppercase tracking-wide",
};

const TAG_NAMES: Record<HeadingSize, "h1" | "h2" | "h3" | "h4"> = {
  "display-xl": "h1",
  "display-lg": "h1",
  display: "h2",
  h3: "h3",
  h4: "h4",
};

export interface HeadingProps {
  /** Type scale; display sizes render serif. */
  size: HeadingSize;
  /** Heading content. */
  children: ReactNode;
  /** Extra classes merged onto the element. */
  className?: string;
}

export function Heading({ size, children, className = "" }: HeadingProps): ReactNode {
  const Tag = TAG_NAMES[size];
  return <Tag className={`${SIZE_CLASSES[size]} text-paper ${className}`}>{children}</Tag>;
}
