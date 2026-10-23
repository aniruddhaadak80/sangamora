/** Empty-state panel with rangoli art and an optional action slot. */
import type { ReactNode } from "react";
import { Rangoli } from "../motifs/rangoli";

export interface EmptyProps {
  /** Bold state title. */
  title: string;
  /** Longer explanation. */
  description?: string;
  /** Action area under the copy. */
  children?: ReactNode;
}

export function Empty({ title, description, children }: EmptyProps): ReactNode {
  return (
    <section className="flex flex-col items-center gap-2 rounded-xl border border-ink-10 bg-ink/50 px-6 py-8 text-center">
      <Rangoli size={72} />
      <h3 className="text-sm font-semibold text-paper">{title}</h3>
      {description ? <p className="max-w-prose text-xs leading-relaxed text-paper/60">{description}</p> : null}
      {children ? <div className="mt-1">{children}</div> : null}
    </section>
  );
}
