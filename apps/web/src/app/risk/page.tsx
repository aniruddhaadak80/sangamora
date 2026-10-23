"use client";

import { useSim } from "@/lib/sim-store";
import { Button } from "@sangamora/ui";

export default function RiskPage() {
  const { current, tick, reset } = useSim();
  const edges = current?.edgeStates ?? [];
  const sorted = [...edges].sort((a, b) => b.utilization - a.utilization);
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="flex items-center gap-3 mb-4">
        <h1 className="font-display text-2xl text-paper">Risk grid</h1>
        <div className="ml-auto flex gap-2">
          <Button onClick={tick}>Tick</Button>
          <Button variant="secondary" onClick={reset}>Reset</Button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-paper/10">
        <table className="w-full text-sm">
          <thead className="bg-surface text-paper/60">
            <tr>
              <th className="text-left p-3">Edge</th>
              <th className="text-right p-3">Flow</th>
              <th className="text-right p-3">Capacity</th>
              <th className="text-right p-3">Util</th>
              <th className="text-right p-3">Travel min</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((e) => {
              const band = e.utilization > 0.85 ? "bg-risk-red" : e.utilization > 0.6 ? "bg-risk-orange" : e.utilization > 0.35 ? "bg-risk-amber" : "bg-risk-green";
              return (
                <tr key={e.edgeId} className="border-t border-paper/5">
                  <td className="p-3 text-paper/80 font-mono text-xs">{e.edgeId}</td>
                  <td className="p-3 text-right text-paper/70">{Math.round(e.flow)}</td>
                  <td className="p-3 text-right text-paper/70">{Math.round(e.capacity)}</td>
                  <td className="p-3 text-right">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs text-ink ${band}`}>{(e.utilization * 100).toFixed(0)}%</span>
                  </td>
                  <td className="p-3 text-right text-paper/70">{e.travelTimeMin.toFixed(1)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {sorted.length === 0 && <p className="mt-6 text-paper/50 text-sm">Tick the simulation to populate the risk grid.</p>}
    </div>
  );
}