/**
 * The seven-day mela calendar (2019-01-14 through 2019-01-20) with the three
 * Shahi Snan spike days marked. Pure data + one lookup helper: the economy
 * reads festival weights from here, the UI formats dates from TIMELINE_DATE.
 *
 * WEIGHT CONSISTENCY: the Shahi weights 0.18 / 0.42 / 0.22 mirror the UNJITTERED
 * base schedule in `crowd/waveforms.ts`. That module jitters its waves ±6% per
 * engine seed, so no single seeded value is importable as truth — these are the
 * canonical nominal weights it starts from (see tests/calendar.dates.test.ts
 * which asserts the same three values the waveforms tests bound).
 */

/** 2019-01-14 00:00 UTC (Makar Sankranti, day 0 of the timeline). Exported so the UI can format dates. */
export const TIMELINE_DATE = Date.UTC(2019, 0, 14);

/** Minutes of sim time per mela day (ticks are minutes). */
export const MINUTES_PER_DAY = 1440;

/** Day index union 0..6 — the calendar has exactly seven days. */
export type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface MelaDay {
  dayIndex: DayIndex;
  label: string;
  hi: string;
  isShahi: boolean;
  /**
   * Nominal crowd-weight of the day's snan wave when it is a Shahi day,
   * matching crowd/waveforms.ts base values; 0 for ordinary days.
   */
  shahiWeight: number;
}

export const MELA_DAYS: readonly MelaDay[] = [
  { dayIndex: 0, label: "Makar Sankranti (Shahi Snan)", hi: "मकर संक्रांति (शाही स्नान)", isShahi: true, shahiWeight: 0.18 },
  { dayIndex: 1, label: "Ordinary snan day", hi: "सामान्य स्नान दिवस", isShahi: false, shahiWeight: 0 },
  { dayIndex: 2, label: "Ekadashi snan / Kalpvas build-up", hi: "एकादशी स्नान / कल्पवास उतराई", isShahi: false, shahiWeight: 0 },
  { dayIndex: 3, label: "Mauni Amavasya (Shahi Snan)", hi: "मौनी अमावस्या (शाही स्नान)", isShahi: true, shahiWeight: 0.42 },
  { dayIndex: 4, label: "Kalpvas aarambh", hi: "कल्पवास आरंभ", isShahi: false, shahiWeight: 0 },
  { dayIndex: 5, label: "Basant Bahar snan", hi: "बसंत बहार स्नान", isShahi: false, shahiWeight: 0 },
  { dayIndex: 6, label: "Vasant Panchami (Shahi Snan)", hi: "वसंत पंचमी (शाही स्नान)", isShahi: true, shahiWeight: 0.22 },
];

/** The biggest single-day draw of the whole mela — Mauni Amavasya's 0.42 share. */
export const MAX_SHAHI_WEIGHT = 0.42;

const DAYS_BY_INDEX = new Map<number, MelaDay>(MELA_DAYS.map((d) => [d.dayIndex, d]));

/**
 * The mela day a sim tick (minutes since TIMELINE_DATE) falls on. Days beyond
 * the seven-day window clamp into the last day; negative ticks clamp to day 0.
 */
export function melaDayAt(tick: number): MelaDay {
  if (typeof tick !== "number" || !Number.isFinite(tick)) {
    throw new Error(`melaDayAt(${String(tick)}): tick must be a finite number`);
  }
  const dayFloat = Math.floor(tick / MINUTES_PER_DAY);
  const clamped = Math.min(Math.max(dayFloat, 0), MELA_DAYS.length - 1) as DayIndex;
  return DAYS_BY_INDEX.get(clamped) as MelaDay;
}
