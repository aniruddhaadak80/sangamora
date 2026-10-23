"use client";

import { useSim } from "@/lib/sim-store";
import { GOODS } from "@sangamora/core";
import { Button } from "@sangamora/ui";

export default function BazaarPage() {
  const { tick, reset, bazaar } = useSim();
  const vendors = bazaar.vendors();
  const hero = vendors.filter((v) => v.sectorId === "prayagraj-jn" && ["chai-glass", "laddu", "marigold-mala", "boat-ride"].includes(v.goodId));
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="flex items-center gap-3 mb-4">
        <h1 className="font-display text-2xl text-paper">Bazaar</h1>
        <div className="ml-auto flex gap-2">
          <Button onClick={tick}>Tick</Button>
          <Button variant="secondary" onClick={reset}>Reset</Button>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-surface border border-paper/10">
          <div className="text-xs text-paper/50 mb-2">Prayagraj junction · live prices · minute {bazaar.minute}</div>
          <table className="w-full text-sm">
            <thead className="text-paper/60">
              <tr><th className="text-left p-2">Good</th><th className="text-right p-2">Price ₹</th><th className="text-right p-2">Stock</th><th className="text-right p-2">Cash ₹</th></tr>
            </thead>
            <tbody>
              {hero.map((v) => {
                const g = GOODS.find((x) => x.id === v.goodId);
                return (
                  <tr key={v.vendorId} className="border-t border-paper/5">
                    <td className="p-2 text-paper/80">{g?.name ?? v.goodId}</td>
                    <td className="p-2 text-right font-mono text-paper">{v.price.toFixed(2)}</td>
                    <td className="p-2 text-right text-paper/70">{Math.round(v.inventory)}</td>
                    <td className="p-2 text-right text-paper/70">{Math.round(v.cash)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="p-4 rounded-xl bg-surface border border-paper/10">
          <div className="text-xs text-paper/50 mb-2">All vendors</div>
          <p className="text-sm text-paper/70">{vendors.length} counters across {new Set(vendors.map((v) => v.sectorId)).size} sectors.</p>
        </div>
      </div>
    </div>
  );
}