/** Titled content band with optional eyebrow, heading and lead-in. */
import type { ReactNode } from "react";
import { Eyebrow } from "../text/eyebrow";

export interface SectionProps {
  /** Small caption rendered above the heading. */
  eyebrow?: string;
  /** Section heading text. */
  heading: string;
  /** One-liner under the heading. */
  description?: string;
  /** Section body. */
  children: ReactNode;
  /** Extra classes on the wrapper. */
  className?: string;
}

export function Section({ eyebrow, heading, description, children, className = "" }: SectionProps): ReactNode {
  return (
    <section className={`flex flex-col gap-2.5 ${className}`}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2 className="text-2xl font-serif tracking-tight text-paper">{heading}</h2>
      {description ? <p className="max-w-prose text-sm leading-relaxed text-paper/70">{description}</p> : null}
      <div className="mt-1">{children}</div>
    </section>
  );
}
