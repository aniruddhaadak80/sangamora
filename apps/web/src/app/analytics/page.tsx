"use client";

import { useMemo } from "react";
import { useSim } from "@/lib/sim-store";
import { Button } from "@sangamora/ui";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

export default function AnalyticsPage() {
  const { current, ticks, tick, reset } = useSim();
  const data = useMemo(() => ticks.map((t) => ({ t: t.tick, snan: t.gotSnan, moved: t.totalMoved })), [ticks]);
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="flex items-center gap-3 mb-4">
        <h1 className="font-display text-2xl text-paper">Analytics</h1>
        <div className="ml-auto flex gap-2">
          <Button onClick={tick}>Tick</Button>
          <Button variant="secondary" onClick={reset}>Reset</Button>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-surface border border-paper/10 h-72">
          <div className="text-xs text-paper/50 mb-2">Snan count over time</div>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid stroke="rgba(255,246,232,0.06)" />
              <XAxis dataKey="t" tick={{ fill: "#FFF6E8", fontSize: 10 }} />
              <YAxis tick={{ fill: "#FFF6E8", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#2A1533", border: "1px solid rgba(255,246,232,0.1)", color: "#FFF6E8" }} />
              <Line type="monotone" dataKey="snan" stroke="#FF8A00" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="p-4 rounded-xl bg-surface border border-paper/10 h-72">
          <div className="text-xs text-paper/50 mb-2">Moved per minute</div>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid stroke="rgba(255,246,232,0.06)" />
              <XAxis dataKey="t" tick={{ fill: "#FFF6E8", fontSize: 10 }} />
              <YAxis tick={{ fill: "#FFF6E8", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#2A1533", border: "1px solid rgba(255,246,232,0.1)", color: "#FFF6E8" }} />
              <Line type="monotone" dataKey="moved" stroke="#0E7C7B" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <p className="mt-3 text-xs text-paper/40">Current tick: {current?.tick ?? 0} | frames: {ticks.length}</p>
    </div>
  );
}