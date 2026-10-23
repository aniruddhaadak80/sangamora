"use client";

import { useSim } from "@/lib/sim-store";
import { TIMETABLE, RailScheduler, COACH_PILGRIMS } from "@sangamora/core";
import { Button } from "@sangamora/ui";

export default function RailsPage() {
  const { tick, reset } = useSim();
  const sched = new RailScheduler(2019);
  const all = sched.timetable();
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="flex items-center gap-3 mb-4">
        <h1 className="font-display text-2xl text-paper">Rails</h1>
        <div className="ml-auto flex gap-2">
          <Button onClick={tick}>Tick</Button>
          <Button variant="secondary" onClick={reset}>Reset</Button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-paper/10">
        <table className="w-full text-sm">
          <thead className="bg-surface text-paper/60">
            <tr><th className="text-left p-3">Train</th><th className="text-left p-3">Origin</th><th className="text-left p-3">Station</th><th className="text-right p-3">Platform</th><th className="text-right p-3">Arrives (min)</th><th className="text-right p-3">Coaches</th><th className="text-right p-3">Cohort</th></tr>
          </thead>
          <tbody>
            {all.map((a) => (
              <tr key={a.trainNo + a.scheduledMin} className="border-t border-paper/5">
                <td className="p-3 text-paper/80 font-mono text-xs">{a.trainNo}</td>
                <td className="p-3 text-paper/70 text-xs">{a.originName}</td>
                <td className="p-3 text-paper/70 text-xs">{a.station}</td>
                <td className="p-3 text-right text-paper/70">{a.platform}</td>
                <td className="p-3 text-right text-paper/70">{a.scheduledMin}</td>
                <td className="p-3 text-right text-paper/70">{a.units}</td>
                <td className="p-3 text-right text-paper/70">{sched.cohortSize(a)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-paper/40">COACH_PILGRIMS = {COACH_PILGRIMS} · {TIMETABLE.length} modeled rakes across 7 days.</p>
    </div>
  );
}