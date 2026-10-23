import { hashString, Rng } from "../rng";

/** The two mela railheads the sim models. */
export type RailStation = "prayagraj" | "rambagh";

/**
 * One modeled arrival. `scheduledMin` is minutes since TIMELINE_DATE
 * (calendar module); `baseMin` is the hand-authored pre-jitter schedule minute,
 * kept so tests (and the UI) can show how badly a rake is running late.
 */
export interface TrainArrival {
  trainNo: string;
  nameHindi: string;
  originName: string;
  station: RailStation;
  platform: number;
  scheduledMin: number;
  /** Number of coaches (units) the rake turns up with. */
  units: number;
  baseMin: number;
}

/** The whole timetable spans the seven-mela-day window. */
export const TIMELINE_SPAN_MIN = 7 * 1440;
/** Seeded schedule jitter: ±30 minutes of "railway reality". */
export const ARRIVAL_JITTER_MIN = 30;
/** Seeded coach-count jitter: ±8%. */
export const UNITS_JITTER = 0.08;

interface TrainBase {
  trainNo: string;
  nameHindi: string;
  originName: string;
  station: RailStation;
  platform: number;
  min: number;
  units: number;
}

/**
 * THE hand-authored 2019-flavored base: 24 rakes across the 7 days, weighted by
 * footfall (day 0 Makar Sankranti + day 3 Mauni Amavasya carry the arrivals,
 * day 3 the most, since Kalpvasis are already camped by late week). Numbers are
 * real-ish service ids where a real train suits the route, otherwise mela
 * specials in the 0xxxx series. `min` values keep 30+ minutes of jitter margin
 * inside the timeline, so clamping never compresses the spread.
 */
const TRAIN_BASE: readonly TrainBase[] = [
  // -- day 0: Makar Sankranti Shahi Snan ----------------------------------
  { trainNo: "12309", nameHindi: "राजधानी एक्सप्रेस", originName: "Rajendra Nagar", station: "prayagraj", platform: 1, min: 220, units: 22 },
  { trainNo: "12369", nameHindi: "कुम्भ एक्सप्रेस", originName: "Howrah", station: "prayagraj", platform: 4, min: 310, units: 22 },
  { trainNo: "12307", nameHindi: "पूर्वा एक्सप्रेस", originName: "Sealdah", station: "prayagraj", platform: 3, min: 330, units: 22 },
  { trainNo: "12801", nameHindi: "पुरुषोत्तम एक्सप्रेस", originName: "Puri", station: "prayagraj", platform: 6, min: 380, units: 21 },
  { trainNo: "12509", nameHindi: "महामना एक्सप्रेस", originName: "Varanasi", station: "prayagraj", platform: 2, min: 425, units: 16 },
  { trainNo: "12581", nameHindi: "संगम मेला स्पेशल", originName: "Aishbagh", station: "rambagh", platform: 5, min: 495, units: 24 },
  { trainNo: "22417", nameHindi: "महामना एक्सप्रेस", originName: "Vadodara", station: "prayagraj", platform: 2, min: 1320, units: 16 },
  // -- day 1: ordinary ----------------------------------------------------
  { trainNo: "15027", nameHindi: "मौर्या एक्सप्रेस", originName: "Hatia", station: "rambagh", platform: 7, min: 1740, units: 18 },
  { trainNo: "12947", nameHindi: "अजीमाबाद एक्सप्रेस", originName: "Patna", station: "prayagraj", platform: 1, min: 1920, units: 20 },
  { trainNo: "04193", nameHindi: "कुम्भ मेला स्पेशल", originName: "Kanpur Central", station: "rambagh", platform: 5, min: 2130, units: 24 },
  { trainNo: "14217", nameHindi: "उन्चाहार एक्सप्रेस", originName: "Varanasi", station: "prayagraj", platform: 3, min: 2490, units: 20 },
  // -- day 2: Ekadashi / Kalpvas build-up ----------------------------------
  { trainNo: "12659", nameHindi: "गंगा-कावेरी एक्सप्रेस", originName: "Nizamabad", station: "prayagraj", platform: 6, min: 3140, units: 20 },
  { trainNo: "12397", nameHindi: "महाकौशल एक्सप्रेस", originName: "Jabalpur", station: "prayagraj", platform: 2, min: 3380, units: 21 },
  { trainNo: "04817", nameHindi: "कल्पवासी स्पेशल", originName: "Lucknow", station: "rambagh", platform: 8, min: 3600, units: 26 },
  { trainNo: "19165", nameHindi: "साबरमती एक्सप्रेस", originName: "Varanasi", station: "prayagraj", platform: 4, min: 3960, units: 20 },
  // -- day 3: Mauni Amavasya Shahi Snan (heaviest rail day) ----------------
  { trainNo: "12295", nameHindi: "संगमित्रा एक्सप्रेस", originName: "Yesvantpur", station: "prayagraj", platform: 1, min: 4520, units: 22 },
  { trainNo: "04899", nameHindi: "स्नान दर्शन स्पेशल", originName: "Patna", station: "rambagh", platform: 9, min: 4610, units: 26 },
  { trainNo: "04641", nameHindi: "शाही स्नान स्पेशल", originName: "Faizabad", station: "prayagraj", platform: 10, min: 4700, units: 24 },
  { trainNo: "04823", nameHindi: "मौनी स्पेशल", originName: "Varanasi", station: "rambagh", platform: 5, min: 4860, units: 24 },
  { trainNo: "11071", nameHindi: "कामायनी एक्सप्रेस", originName: "Mumbai LTT", station: "prayagraj", platform: 7, min: 5250, units: 21 },
  // -- day 4: Kalpvas aarambh ----------------------------------------------
  { trainNo: "04843", nameHindi: "अध्यात्म स्पेशल", originName: "Dehradun", station: "rambagh", platform: 6, min: 6180, units: 20 },
  { trainNo: "15103", nameHindi: "अंत्योदय एक्सप्रेस", originName: "Motihari", station: "prayagraj", platform: 8, min: 6520, units: 22 },
  // -- day 5 quiet ----------------------------------------------------------
  { trainNo: "01415", nameHindi: "कल्याण कुम्भ स्पेशल", originName: "Panvel", station: "prayagraj", platform: 9, min: 7720, units: 24 },
  // -- day 6: Vasant Panchami Shahi Snan -----------------------------------
  { trainNo: "04561", nameHindi: "संगम स्पेशल", originName: "Anwarganj", station: "rambagh", platform: 4, min: 8890, units: 26 },
];

/**
 * The canonical timetable for the "real mela" — seeded once with the timeline
 * date so every consumer sees the same 24 arrivals.
 */
export const DEFAULT_TIMETABLE_SEED = 20190114;

/**
 * Deterministic timetable builder: one seeded stream consumed in TRAIN_BASE
 * order (2 taps per train: schedule minutes, then coach count), then sorted by
 * arrival minute. Identical seeds give byte-identical tables.
 */
export function buildTimetable(seed: number): TrainArrival[] {
  const rng = new Rng(hashString(`rails::timetable::${seed}`));
  return TRAIN_BASE.map((b) => {
    const delta = rng.int(-ARRIVAL_JITTER_MIN, ARRIVAL_JITTER_MIN + 1);
    const unitFactor = rng.float(1 - UNITS_JITTER, 1 + UNITS_JITTER);
    const scheduledMin = Math.min(Math.max(b.min + delta, 0), TIMELINE_SPAN_MIN - 1);
    return {
      trainNo: b.trainNo,
      nameHindi: b.nameHindi,
      originName: b.originName,
      station: b.station,
      platform: b.platform,
      scheduledMin,
      units: Math.max(4, Math.round(b.units * unitFactor)),
      baseMin: b.min,
    } satisfies TrainArrival;
  }).sort((a, b2) => a.scheduledMin - b2.scheduledMin || (a.trainNo < b2.trainNo ? -1 : 1));
}

/** The default timetable — same seed everywhere, so modules interlock. */
export const TIMETABLE: readonly TrainArrival[] = buildTimetable(DEFAULT_TIMETABLE_SEED);
