/** Navigation shell: static column on lg, overlay drawer below. */
import { X } from "lucide-react";
import type { ReactNode } from "react";

export interface NavLink {
  /** Visible label. */
  label: string;
  /** Route href. */
  href: string;
  /** Marks the active route. */
  current?: boolean;
}

export interface SidebarProps {
  /** Links in display order. */
  links: readonly NavLink[];
  /** Mobile drawer visibility (ignored at lg+). */
  open: boolean;
  /** Closes the mobile drawer. */
  onClose: () => void;
  /** Slot at the bottom of the column. */
  children?: ReactNode;
}

function linkClasses(current: boolean): string {
  return `flex items-center rounded-lg px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-saffron focus-visible:outline-offset-2 ${current ? "bg-saffron/15 text-saffron" : "text-paper/75 hover:bg-paper/10 hover:text-paper"}`;
}

function LinkList({ links }: { links: readonly NavLink[] }): ReactNode {
  return (
    <ul className="flex flex-col gap-1">
      {links.map((link) => (
        <li key={link.href}>
          <a href={link.href} aria-current={link.current ? "page" : undefined} className={linkClasses(link.current ?? false)}>
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  );
}

export function Sidebar({ links, open, onClose, children }: SidebarProps): ReactNode {
  return (
    <>
      <aside aria-label="Primary" className="hidden w-60 shrink-0 border-r border-ink-10 bg-ink/60 p-3 lg:block">
        <LinkList links={links} />
        {children ? <div className="mt-4">{children}</div> : null}
      </aside>
      {open ? (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-40">
            <div aria-hidden className="absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={onClose} />
            <aside aria-label="Primary" className="absolute inset-y-0 left-0 z-10 w-64 border-r border-ink-10 bg-surface p-3 shadow-lg">
              <div className="mb-2 flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close navigation"
                  className="rounded p-1 text-paper/60 hover:text-paper focus-visible:outline-2 focus-visible:outline-saffron focus-visible:outline-offset-2"
                >
                  <X className="size-4" aria-hidden />
                </button>
              </div>
              <LinkList links={links} />
              {children ? <div className="mt-4">{children}</div> : null}
            </aside>
          </div>
        </div>
      ) : null}
    </>
  );
}
