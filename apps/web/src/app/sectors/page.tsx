"use client";

import { useSim } from "@/lib/sim-store";
import { SECTORS } from "@sangamora/core";

export default function SectorsPage() {
  const { current } = useSim();
  const groups = ["ghat", "temple", "camp", "station", "bazaar", "medical", "sangam"] as const;
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="font-display text-2xl text-paper mb-4">Sectors</h1>
      {groups.map((g) => {
        const list = SECTORS.filter((s) => s.kind === g);
        if (list.length === 0) return null;
        return (
          <section key={g} className="mb-6">
            <h2 className="text-sm uppercase tracking-widest text-paper/50 mb-2">{g}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {list.map((s) => {
                const ss = current?.sectorStates.find((x) => x.sectorId === s.id);
                const density = ss?.density ?? 0;
                return (
                  <div key={s.id} className="p-4 rounded-xl bg-surface border border-paper/10">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-paper text-sm">{s.name}</span>
                      <span className="text-xs text-paper/40">{s.nameHi}</span>
                    </div>
                    <div className="mt-2 h-2 rounded bg-ink overflow-hidden">
                      <div className="h-full bg-saffron transition-all" style={{ width: `${Math.min(100, density * 100)}%` }} />
                    </div>
                    <div className="mt-1 flex justify-between text-xs text-paper/50">
                      <span>pop {Math.round(ss?.population ?? 0)}</span>
                      <span>cap/hr {s.capacityPerHr}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}