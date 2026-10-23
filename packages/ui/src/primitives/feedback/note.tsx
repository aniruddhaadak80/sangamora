/** Inline advisory panel in info / warn / danger tones. */
import { CircleAlert, Info, TriangleAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export type NoteTone = "info" | "warn" | "danger";

const TONES: Record<NoteTone, { cls: string; Icon: LucideIcon }> = {
  info: { cls: "border-river/60 bg-river/10 text-river", Icon: Info },
  warn: { cls: "border-risk-amber/60 bg-risk-amber/10 text-risk-amber", Icon: TriangleAlert },
  danger: { cls: "border-vermillion/60 bg-vermillion/10 text-vermillion", Icon: CircleAlert },
};

export interface NoteProps {
  /** Advisory severity. */
  tone: NoteTone;
  /** Bold one-liner. */
  title: string;
  /** Supporting copy. */
  children?: ReactNode;
  /** Extra classes merged onto the panel. */
  className?: string;
}

export function Note({ tone, title, children, className = "" }: NoteProps): ReactNode {
  const { cls, Icon } = TONES[tone];
  return (
    <div role="note" className={`flex items-start gap-2 rounded-lg border-l-4 px-3 py-2.5 text-sm ${cls} ${className}`}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="font-semibold">{title}</p>
        {children ? <div className="text-paper/75">{children}</div> : null}
      </div>
    </div>
  );
}
