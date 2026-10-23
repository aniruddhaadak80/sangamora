"use client";

import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useUI } from "@/lib/ui-provider";

const COMMANDS = [
  { label: "Go to Sangam Map", href: "/map", keywords: "map swarm canvas" },
  { label: "Go to Risk console", href: "/risk", keywords: "risk triage alerts" },
  { label: "Go to Bazaar", href: "/bazaar", keywords: "bazaar economy vendors" },
  { label: "Go to Rails", href: "/rails", keywords: "rails trains arrivals" },
  { label: "Go to Sectors", href: "/sectors", keywords: "sectors camps ghats" },
  { label: "Go to Replay", href: "/replay", keywords: "replay time machine hash" },
  { label: "Go to Calendar", href: "/calendar", keywords: "calendar shahi snan" },
  { label: "Go to Analytics", href: "/analytics", keywords: "analytics charts" },
  { label: "Go to Scenarios", href: "/scenarios", keywords: "scenarios presets" },
  { label: "Go to Explainer", href: "/explainer", keywords: "explainer about" },
  { label: "Go home", href: "/", keywords: "home landing" },
];

export function Palette() {
  const open = useUI((s) => s.paletteOpen);
  const setOpen = useUI((s) => s.setPaletteOpen);
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!open);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-24" onClick={() => setOpen(false)}>
      <div className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <Command className="bg-surface border border-paper/10 rounded-xl shadow-2xl overflow-hidden">
          <Command.Input
            autoFocus
            placeholder="Search the mela…"
            className="w-full px-4 py-3 bg-transparent text-paper outline-none border-b border-paper/10"
          />
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="px-3 py-2 text-sm text-paper/50">No results.</Command.Empty>
            {COMMANDS.map((c) => (
              <Command.Item
                key={c.href}
                value={`${c.label} ${c.keywords}`}
                onSelect={() => {
                  router.push(c.href);
                  setOpen(false);
                }}
                className="px-3 py-2 text-sm text-paper/80 rounded cursor-pointer data-[selected=true]:bg-saffron/20 data-[selected=true]:text-saffron"
              >
                {c.label}
              </Command.Item>
            ))}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}