/** What a sector physically is — drives renderer iconography and edge semantics. */
export type SectorKind = "ghat" | "temple" | "camp" | "station" | "bazaar" | "medical" | "sangam";

export interface Sector {
  id: string;
  name: string;
  nameHi: string;
  kind: SectorKind;
  /** Nominal service throughput (people/hour) of the sector's own queue; edges carry the real caps. */
  capacityPerHr: number;
  areaM2: number;
  /** True when the sector maintains a reserved accessible lane for elderly/divyang pilgrims. */
  handicapMask: boolean;
}

/** The one absorbing sector where snan completes and pilgrims disperse out of the world. */
export const SANGAM_TERMINAL_ID = "sangam-terminal";

/**
 * The full 2019-Prayagraj-grid-inspired world: 2 stations + 6 bathing ghats +
 * 5 temples + 8 akhara camps + bazaar + medical + sangam terminal = 24 sectors.
 * The four pontoon bridges and the overhead crossing are modeled as edges
 * (`EdgeKind` includes "bridge"), because their capacity lives in their width.
 */
export const SECTORS: readonly Sector[] = [
  // -- stations ------------------------------------------------------------
  { id: "prayagraj-jn", name: "Prayagraj Junction", nameHi: "प्रयागराज जंक्शन", kind: "station", capacityPerHr: 96_000, areaM2: 120_000, handicapMask: true },
  { id: "rambagh", name: "Rambagh Station", nameHi: "रामबाग स्टेशन", kind: "station", capacityPerHr: 84_000, areaM2: 96_000, handicapMask: true },
  // -- bathing ghats -------------------------------------------------------
  { id: "triveni-sangam", name: "Triveni Sangam Ghat", nameHi: "त्रिवेणी संगम घाट", kind: "ghat", capacityPerHr: 40_000, areaM2: 55_000, handicapMask: true },
  { id: "dashashwamedh-ghat", name: "Dashashwamedh Ghat", nameHi: "दशाश्वमेध घाट", kind: "ghat", capacityPerHr: 34_000, areaM2: 40_000, handicapMask: true },
  { id: "saraswati-ghat", name: "Saraswati Ghat", nameHi: "सरस्वती घाट", kind: "ghat", capacityPerHr: 30_000, areaM2: 32_000, handicapMask: true },
  { id: "ram-ghat", name: "Ram Ghat", nameHi: "राम घाट", kind: "ghat", capacityPerHr: 30_000, areaM2: 34_000, handicapMask: true },
  { id: "gau-ghat", name: "Gau Ghat", nameHi: "गौ घाट", kind: "ghat", capacityPerHr: 26_000, areaM2: 28_000, handicapMask: true },
  { id: "arail-ghat", name: "Arail Ghat", nameHi: "अरैल घाट", kind: "ghat", capacityPerHr: 22_000, areaM2: 24_000, handicapMask: true },
  // -- parikrama temples ---------------------------------------------------
  { id: "bade-hanuman-mandir", name: "Bade Hanuman Mandir", nameHi: "बड़े हनुमान मंदिर", kind: "temple", capacityPerHr: 8_000, areaM2: 12_000, handicapMask: false },
  { id: "akshayavat-mandir", name: "Akshayavat Mandir", nameHi: "अक्षयवट मंदिर", kind: "temple", capacityPerHr: 6_000, areaM2: 9_000, handicapMask: false },
  { id: "nagvasuki-mandir", name: "Nag Vasuki Mandir", nameHi: "नाग वासुकी मंदिर", kind: "temple", capacityPerHr: 7_000, areaM2: 10_000, handicapMask: false },
  { id: "mankameshwar-mandir", name: "Mankameshwar Mandir", nameHi: "मानकमेश्वर मंदिर", kind: "temple", capacityPerHr: 6_000, areaM2: 8_000, handicapMask: false },
  { id: "patalpuri-mandir", name: "Patalpuri Mandir", nameHi: "पातालपुरी मंदिर", kind: "temple", capacityPerHr: 5_000, areaM2: 7_500, handicapMask: false },
  // -- akhara camps --------------------------------------------------------
  { id: "akhara-1", name: "Akharas Sector 1", nameHi: "अखाड़ा क्षेत्र 1", kind: "camp", capacityPerHr: 60_000, areaM2: 150_000, handicapMask: false },
  { id: "akhara-2", name: "Akharas Sector 2", nameHi: "अखाड़ा क्षेत्र 2", kind: "camp", capacityPerHr: 55_000, areaM2: 140_000, handicapMask: false },
  { id: "akhara-3", name: "Akharas Sector 3", nameHi: "अखाड़ा क्षेत्र 3", kind: "camp", capacityPerHr: 52_000, areaM2: 132_000, handicapMask: false },
  { id: "akhara-4", name: "Akharas Sector 4", nameHi: "अखाड़ा क्षेत्र 4", kind: "camp", capacityPerHr: 50_000, areaM2: 126_000, handicapMask: false },
  { id: "akhara-5", name: "Akharas Sector 5", nameHi: "अखाड़ा क्षेत्र 5", kind: "camp", capacityPerHr: 62_000, areaM2: 148_000, handicapMask: false },
  { id: "akhara-6", name: "Akharas Sector 6", nameHi: "अखाड़ा क्षेत्र 6", kind: "camp", capacityPerHr: 56_000, areaM2: 138_000, handicapMask: false },
  { id: "akhara-7", name: "Akharas Sector 7", nameHi: "अखाड़ा क्षेत्र 7", kind: "camp", capacityPerHr: 53_000, areaM2: 130_000, handicapMask: false },
  { id: "akhara-8", name: "Akharas Sector 8", nameHi: "अखाड़ा क्षेत्र 8", kind: "camp", capacityPerHr: 51_000, areaM2: 124_000, handicapMask: false },
  // -- civic ---------------------------------------------------------------
  { id: "chaitanya-mela-bazaar", name: "Chaitanya Mela Bazaar", nameHi: "चैतन्य मेला बाज़ार", kind: "bazaar", capacityPerHr: 72_000, areaM2: 110_000, handicapMask: false },
  { id: "central-medical-post", name: "Central Medical Post", nameHi: "केंद्रीय चिकित्सा शिविर", kind: "medical", capacityPerHr: 6_500, areaM2: 18_000, handicapMask: true },
  { id: SANGAM_TERMINAL_ID, name: "Sangam Snan Terminal", nameHi: "संगम स्नान द्वार", kind: "sangam", capacityPerHr: 48_000, areaM2: 50_000, handicapMask: true },
];

/** Sectors where the snan completes; every bath/causeway edge empties into one of these. */
export const SANGAM_IDS: readonly string[] = [SANGAM_TERMINAL_ID];

/** The six bathing ghats — the sim's wave targets rotate over this list. */
export const BATHING_GHAT_IDS: readonly string[] = [
  "triveni-sangam",
  "dashashwamedh-ghat",
  "saraswati-ghat",
  "ram-ghat",
  "gau-ghat",
  "arail-ghat",
];
