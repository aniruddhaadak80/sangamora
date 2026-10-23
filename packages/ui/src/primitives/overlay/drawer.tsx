/** Side drawer with backdrop; slides from either edge. */
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

export type DrawerSide = "left" | "right";

const NO_EVENTS = (): (() => void) => () => {};

export interface DrawerProps {
  /** Mounts the drawer. */
  open: boolean;
  /** Close request. */
  onClose: () => void;
  /** Edge the panel is anchored to. */
  side: DrawerSide;
  /** Accessible name; doubles as the header text. */
  title: string;
  /** Drawer body. */
  children: ReactNode;
}

export function Drawer({ open, onClose, side, title, children }: DrawerProps): ReactNode {
  const mounted = useSyncExternalStore(NO_EVENTS, () => true, () => false);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!mounted) return null;
  const closedX = side === "left" ? "-100%" : "100%";
  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50">
          <motion.div
            className="absolute inset-0 bg-ink/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={`absolute inset-y-0 ${side === "left" ? "left-0 border-r" : "right-0 border-l"} w-[min(20rem,88vw)] border-ink-10 bg-surface p-4 shadow-lg`}
            initial={{ x: closedX }}
            animate={{ x: "0%" }}
            exit={{ x: closedX }}
            transition={{ type: "tween", duration: 0.22, ease: "easeOut" }}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-serif text-lg text-paper">{title}</h3>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close drawer"
                className="rounded p-1 text-paper/60 hover:text-paper focus-visible:outline-2 focus-visible:outline-saffron focus-visible:outline-offset-2"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
            <div className="mt-3 text-sm text-paper/80">{children}</div>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
