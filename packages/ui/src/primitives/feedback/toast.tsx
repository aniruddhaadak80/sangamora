/** Portal-free fixed toast stack pinned to the bottom-right. */
import { X } from "lucide-react";
import type { ReactNode } from "react";
import type { NoteTone } from "./note";

export interface ToastItem {
  /** Stable toast id (used as the React key). */
  id: string;
  /** Bold headline. */
  title: string;
  /** Optional secondary copy. */
  description?: string;
  /** Tint; defaults to info. */
  tone?: NoteTone;
}

const TONE_BORDERS: Record<NoteTone, string> = {
  info: "border-river",
  warn: "border-risk-amber",
  danger: "border-vermillion",
};

export interface ToastProps {
  /** Live toast list; renders nothing when empty. */
  items: readonly ToastItem[];
  /** Dismissal callback with the tost id. */
  onDismiss: (id: string) => void;
}

export function Toast({ items, onDismiss }: ToastProps): ReactNode {
  if (items.length === 0) return null;
  return (
    <ol aria-label="Notifications" className="fixed bottom-4 right-4 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
      {items.map((item) => (
        <li
          key={item.id}
          role="status"
          aria-live="polite"
          className={`flex gap-2 rounded-lg border border-ink-10 border-l-4 bg-surface px-3 py-2 shadow-sm ${TONE_BORDERS[item.tone ?? "info"]}`}
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-paper">{item.title}</p>
            {item.description ? <p className="text-xs text-paper/60">{item.description}</p> : null}
          </div>
          <button
            type="button"
            aria-label={`Dismiss ${item.title}`}
            onClick={() => onDismiss(item.id)}
            className="rounded p-0.5 text-paper/50 hover:text-paper focus-visible:outline-2 focus-visible:outline-saffron focus-visible:outline-offset-2"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </li>
      ))}
    </ol>
  );
}
