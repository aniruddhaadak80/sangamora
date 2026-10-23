"use client";

import { useEffect, useRef } from "react";
import { useSim } from "@/lib/sim-store";
import { EDGES, formatIndian, SCENARIOS, SECTORS, triage } from "@sangamora/core";
import { Button, SegmentedControl, Stat } from "@sangamora/ui";

const POSITIONS: Record<string, [number, number]> = {};
SECTORS.forEach((s, i) => {
  const col = i % 6;
  const row = Math.floor(i / 6);
  POSITIONS[s.id] = [80 + col * 120, 60 + row * 110];
});

export default function MapPage() {
  const { current, running, speed, setRunning, setSpeed, tick, reset, seed, setSeed, scenarioId, setScenario, marshalsOn, setMarshals } = useSim();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let acc = 0;
    const loop = () => {
      acc += 1;
      if (acc >= 60 / (speed * 4)) { tick(); acc = 0; }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running, speed, tick]);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    for (const e of EDGES) {
      const a = POSITIONS[e.from];
      const b = POSITIONS[e.to];
      if (!a || !b) continue;
      const es = current?.edgeStates.find((x) => x.edgeId === e.id);
      const util = es?.utilization ?? 0;
      ctx.strokeStyle = util > 0.8 ? "#E03E2D" : util > 0.6 ? "#FF7A00" : util > 0.35 ? "#FFB020" : "rgba(255,246,232,0.18)";
      ctx.lineWidth = Math.max(1, e.widthM / 4);
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
      ctx.stroke();
    }
    for (const s of SECTORS) {
      const p = POSITIONS[s.id];
      if (!p) continue;
      const ss = current?.sectorStates.find((x) => x.sectorId === s.id);
      const pop = ss?.population ?? 0;
      const r = 6 + Math.min(18, Math.sqrt(pop / 50000));
      ctx.fillStyle = s.kind === "sangam" ? "#FF8A00" : s.kind === "station" ? "#0E7C7B" : "#2A1533";
      ctx.beginPath();
      ctx.arc(p[0], p[1], r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,246,232,0.85)";
      ctx.font = "10px sans-serif";
      ctx.fillText(s.name.slice(0, 12), p[0] + r + 2, p[1] + 3);
    }
  }, [current]);

  const worst = current ? (triage(current.edgeStates, current.sectorStates, current.tick) as unknown as { alerts: { edgeId: string; score: number }[] }) : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <h1 className="font-display text-2xl text-paper">Sangam Map</h1>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button onClick={() => setRunning(!running)}>{running ? "Pause" : "Play"}</Button>
          <Button variant="secondary" onClick={reset}>Reset</Button>
          <SegmentedControl value={String(speed)} onChange={(v) => setSpeed(Number(v))} options={[{ id: "1", label: "1x" }, { id: "2", label: "2x" }, { id: "4", label: "4x" }, { id: "8", label: "8x" }]} />
        </div>
      </div>
      <div className="grid md:grid-cols-[1fr_320px] gap-4">
        <div className="map-canvas rounded-xl border border-paper/10 overflow-hidden">
          <canvas ref={canvasRef} width={800} height={500} className="w-full h-auto" />
        </div>
        <aside className="space-y-3">
          <div className="p-4 rounded-xl bg-surface border border-paper/10">
            <div className="text-xs text-paper/50 mb-2">Simulation</div>
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Tick" value={String(current?.tick ?? 0)} />
              <Stat label="Snan'd" value={formatIndian(current?.gotSnan ?? 0)} />
              <Stat label="Moved/min" value={formatIndian(current?.totalMoved ?? 0)} />
              <Stat label="Worst risk" value={worst?.alerts[0]?.score?.toFixed(2) ?? "-"} />
            </div>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-paper/10">
            <div className="text-xs text-paper/50 mb-2">Controls</div>
            <label className="text-xs text-paper/60">Seed</label>
            <input type="number" value={seed} onChange={(e) => setSeed(Number(e.target.value))} className="w-full mt-1 px-2 py-1 rounded bg-ink border border-paper/10 text-paper text-sm" />
            <label className="text-xs text-paper/60 mt-2 block">Scenario</label>
            <select value={scenarioId} onChange={(e) => setScenario(e.target.value)} className="w-full mt-1 px-2 py-1 rounded bg-ink border border-paper/10 text-paper text-sm">
              {SCENARIOS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <label className="flex items-center gap-2 mt-2 text-xs text-paper/70">
              <input type="checkbox" checked={marshalsOn} onChange={(e) => setMarshals(e.target.checked)} />
              Marshals on
            </label>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-paper/10 max-h-48 overflow-y-auto">
            <div className="text-xs text-paper/50 mb-2">Top alerts</div>
            {(worst?.alerts ?? []).slice(0, 6).map((a) => (
              <div key={a.edgeId} className="text-xs text-paper/70 flex justify-between">
                <span>{a.edgeId}</span>
                <span className="font-mono">{a.score.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}