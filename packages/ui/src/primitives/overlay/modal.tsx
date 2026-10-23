/** Modal dialog: portal overlay, esc-to-close and a basic focus trap. */
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

/** Server-safe mount gate: false while SSR-rendered, true after hydration. */
const NO_EVENTS = (): (() => void) => () => {};

export interface ModalProps {
  /** Mounts the dialog. */
  open: boolean;
  /** Close request (esc, backdrop or close button). */
  onClose: () => void;
  /** Accessible dialog name; doubles as the header text. */
  title: string;
  /** Dialog body. */
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps): ReactNode {
  const mounted = useSyncExternalStore(NO_EVENTS, () => true, () => false);
  const panel = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open) return;
    panel.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || panel.current === null) return;
      const list = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <motion.div
            className="absolute inset-0 bg-ink/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            ref={panel}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18 }}
            className="relative z-10 max-h-[82vh] w-full max-w-lg overflow-y-auto rounded-xl border border-ink-10 bg-surface p-5 shadow-lg"
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="font-serif text-lg text-paper">{title}</h3>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="-mr-1 rounded p-1 text-paper/60 hover:text-paper focus-visible:outline-2 focus-visible:outline-saffron focus-visible:outline-offset-2"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
            <div className="mt-3 text-sm text-paper/80">{children}</div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
