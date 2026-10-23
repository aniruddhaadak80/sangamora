"use client";

import Link from "next/link";
import { useUI } from "@/lib/ui-provider";
import { Button } from "@sangamora/ui";

const ROUTES = [
  { href: "/", label: "Home" },
  { href: "/map", label: "Sangam Map" },
  { href: "/risk", label: "Risk" },
  { href: "/bazaar", label: "Bazaar" },
  { href: "/rails", label: "Rails" },
  { href: "/sectors", label: "Sectors" },
  { href: "/replay", label: "Replay" },
  { href: "/calendar", label: "Calendar" },
  { href: "/analytics", label: "Analytics" },
  { href: "/scenarios", label: "Scenarios" },
  { href: "/explainer", label: "Explainer" },
];

export function Nav() {
  const setPaletteOpen = useUI((s) => s.setPaletteOpen);
  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-ink/80 border-b border-paper/10">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 font-display font-bold text-lg">
          <span className="text-saffron">संगम</span>
          <span className="text-paper/90">sangamora</span>
        </Link>
        <nav className="hidden md:flex items-center gap-1 ml-4">
          {ROUTES.slice(1).map((r) => (
            <Link key={r.href} href={r.href} className="px-2 py-1 text-sm text-paper/70 hover:text-paper rounded focus-ring">
              {r.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setPaletteOpen(true)}>
            <span className="hidden sm:inline">Search</span> <kbd className="ml-1 text-xs opacity-60">⌘K</kbd>
          </Button>
        </div>
      </div>
      <div className="md:hidden overflow-x-auto px-4 pb-2 flex gap-2">
        {ROUTES.slice(1).map((r) => (
          <Link key={r.href} href={r.href} className="shrink-0 px-3 py-1 text-xs rounded-full bg-ink-muted text-paper/80">
            {r.label}
          </Link>
        ))}
      </div>
    </header>
  );
}