"use client";

import { useSim } from "@/lib/sim-store";
import { MELA_DAYS, TIMETABLE } from "@sangamora/core";
import { Button } from "@sangamora/ui";

export default function CalendarPage() {
  const { tick, reset } = useSim();
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="flex items-center gap-3 mb-4">
        <h1 className="font-display text-2xl text-paper">Calendar</h1>
        <div className="ml-auto flex gap-2">
          <Button onClick={tick}>Tick</Button>
          <Button variant="secondary" onClick={reset}>Reset</Button>
        </div>
      </div>
      <div className="space-y-3">
        {MELA_DAYS.map((d) => {
          const arrivals = TIMETABLE.filter((t) => Math.floor(t.scheduledMin / 1440) === d.dayIndex).length;
          return (
            <div key={d.dayIndex} className={`p-4 rounded-xl border ${d.isShahi ? "bg-saffron/10 border-saffron/40" : "bg-surface border-paper/10"}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-paper">{d.label}</div>
                  <div className="text-xs text-paper/50">{d.hi}</div>
                </div>
                {d.isShahi && <span className="px-2 py-0.5 rounded text-xs bg-saffron text-ink font-semibold">Shahi Snan</span>}
              </div>
              <div className="mt-2 flex items-center gap-3 text-xs text-paper/60">
                <span>weight {d.shahiWeight}</span>
                <span>·</span>
                <span>{arrivals} trains</span>
                {d.isShahi && (
                  <div className="flex-1 h-2 rounded bg-ink overflow-hidden">
                    <div className="h-full bg-saffron" style={{ width: `${(d.shahiWeight / 0.42) * 100}%` }} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}