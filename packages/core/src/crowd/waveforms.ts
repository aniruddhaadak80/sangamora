import { hashString, Rng } from "../rng";

export interface Wave {
  label: string;
  /** Hour (0-based, 168h window) the wave's ramp begins. */
  startHr: number;
  /** Relative intensity share; the three Shahi spikes carry ~0.18 / 0.42 / 0.22. */
  weight: number;
}

/**
 * 2019-real base schedule: three Shahi Snan spikes — Makar Sankranti (day 1),
 * Mauni Amavasya (day 3, the biggest), Vasant Panchami (day 6) — plus five
 * filler snan waves. Deterministic seeded jitter: startHr +-1.5h (keeps each
 * Shahi inside its correct day), weight +-6%; result sorted ascending.
 */
export function pilgrimageWaves(seed: number): Wave[] {
  const rng = new Rng(hashString(`waves::${seed}`));
  const base: readonly Wave[] = [
    { label: "Paush Purnima Snan", startHr: 8, weight: 0.05 },
    { label: "Makar Sankranti Shahi Snan", startHr: 10, weight: 0.18 },
    { label: "Ekadashi Snaan", startHr: 44, weight: 0.04 },
    { label: "Mauni Amavasya Shahi Snan", startHr: 58, weight: 0.42 },
    { label: "Kalpvas Aarambh Snaan", startHr: 82, weight: 0.04 },
    { label: "Basant Bahar Snaan", startHr: 106, weight: 0.05 },
    { label: "Vasant Panchami Shahi Snan", startHr: 130, weight: 0.22 },
    { label: "Magh Saptami Vishranti Snaan", startHr: 154, weight: 0.02 },
  ];
  return base
    .map((w) => ({
      label: w.label,
      startHr: w.startHr + rng.float(-1.5, 1.5),
      weight: w.weight * rng.float(0.94, 1.06),
    }))
    .sort((a, b) => a.startHr - b.startHr);
}
