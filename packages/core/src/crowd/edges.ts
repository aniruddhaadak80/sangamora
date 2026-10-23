/** Physical kind of a flow surface. "ghat" edges are the final bath steps into the Sangam. */
export type EdgeKind = "road" | "bridge" | "ghat" | "rail" | "pond" | "corridor";

export interface Edge {
  id: string;
  from: string;
  to: string;
  /** Cross-section width in meters — the engine's capacity unit (width * 46 people/min). */
  widthM: number;
  lengthM: number;
  kind: EdgeKind;
}

/**
 * 54 one-way-signed surface declarations. Flow direction is chosen per tick by
 * the BFS routing (mass moves toward the wave's snan ghat), so an edge behaves
 * as a bidirectional surface whose useful direction is decided downstream —
 * the pontoon bridges (widths 8–9 m) are deliberately the narrowest arterial
 * chokepoints, while bath steps (4–7 m) are the final bottleneck into Sangam.
 */
export const EDGES: readonly Edge[] = [
  // -- station egress ------------------------------------------------------
  { id: "station-yard", from: "prayagraj-jn", to: "akhara-1", widthM: 24, lengthM: 500, kind: "road" },
  { id: "preetamnagar-marg", from: "prayagraj-jn", to: "akhara-2", widthM: 22, lengthM: 700, kind: "road" },
  { id: "sangam-marg", from: "prayagraj-jn", to: "chaitanya-mela-bazaar", widthM: 26, lengthM: 1100, kind: "road" },
  { id: "jhunsi-siding", from: "prayagraj-jn", to: "akhara-4", widthM: 14, lengthM: 900, kind: "rail" },
  { id: "katra-connector", from: "prayagraj-jn", to: "akhara-3", widthM: 20, lengthM: 850, kind: "road" },
  { id: "rambagh-viaduct", from: "rambagh", to: "akhara-5", widthM: 22, lengthM: 600, kind: "road" },
  { id: "dariyabad-marg", from: "rambagh", to: "akhara-7", widthM: 20, lengthM: 800, kind: "road" },
  { id: "grand-trunk-marg", from: "rambagh", to: "chaitanya-mela-bazaar", widthM: 24, lengthM: 1000, kind: "road" },
  { id: "rambagh-siding", from: "rambagh", to: "akhara-6", widthM: 12, lengthM: 650, kind: "rail" },
  // -- bazaar hub ----------------------------------------------------------
  { id: "chowk-connector", from: "chaitanya-mela-bazaar", to: "akhara-3", widthM: 20, lengthM: 850, kind: "road" },
  { id: "hospital-road", from: "chaitanya-mela-bazaar", to: "central-medical-post", widthM: 16, lengthM: 600, kind: "road" },
  { id: "ambulance-lane", from: "central-medical-post", to: "akhara-4", widthM: 14, lengthM: 500, kind: "road" },
  { id: "sewa-marg", from: "central-medical-post", to: "akhara-8", widthM: 14, lengthM: 560, kind: "road" },
  { id: "med-east-link", from: "central-medical-post", to: "akhara-5", widthM: 12, lengthM: 1000, kind: "road" },
  // -- akhara ring roads ---------------------------------------------------
  { id: "sector-link-1-2", from: "akhara-1", to: "akhara-2", widthM: 18, lengthM: 350, kind: "road" },
  { id: "sector-link-2-3", from: "akhara-2", to: "akhara-3", widthM: 18, lengthM: 380, kind: "road" },
  { id: "sector-link-3-4", from: "akhara-3", to: "akhara-4", widthM: 18, lengthM: 320, kind: "road" },
  { id: "sector-link-4-1", from: "akhara-4", to: "akhara-1", widthM: 18, lengthM: 300, kind: "road" },
  { id: "sector-link-5-6", from: "akhara-5", to: "akhara-6", widthM: 18, lengthM: 340, kind: "road" },
  { id: "sector-link-6-7", from: "akhara-6", to: "akhara-7", widthM: 18, lengthM: 350, kind: "road" },
  { id: "sector-link-7-8", from: "akhara-7", to: "akhara-8", widthM: 18, lengthM: 330, kind: "road" },
  { id: "sector-link-8-5", from: "akhara-8", to: "akhara-5", widthM: 18, lengthM: 310, kind: "road" },
  { id: "shankracharya-marg", from: "akhara-4", to: "akhara-5", widthM: 20, lengthM: 900, kind: "road" },
  { id: "kali-marg", from: "chaitanya-mela-bazaar", to: "akhara-2", widthM: 16, lengthM: 900, kind: "road" },
  { id: "parikrama-trunk", from: "akhara-8", to: "akhara-1", widthM: 18, lengthM: 1500, kind: "road" },
  // -- ghat approaches -----------------------------------------------------
  { id: "ghat-approach-west", from: "akhara-1", to: "saraswati-ghat", widthM: 18, lengthM: 700, kind: "road" },
  { id: "hanuman-path", from: "akhara-3", to: "bade-hanuman-mandir", widthM: 12, lengthM: 400, kind: "road" },
  { id: "sangam-steps-marg", from: "bade-hanuman-mandir", to: "triveni-sangam", widthM: 10, lengthM: 250, kind: "road" },
  { id: "triveni-marg", from: "akhara-4", to: "triveni-sangam", widthM: 20, lengthM: 750, kind: "road" },
  { id: "ram-ghat-road", from: "akhara-6", to: "ram-ghat", widthM: 18, lengthM: 800, kind: "road" },
  { id: "dashashwamedh-road", from: "akhara-7", to: "dashashwamedh-ghat", widthM: 18, lengthM: 850, kind: "road" },
  { id: "gau-ghat-approach", from: "akhara-7", to: "gau-ghat", widthM: 16, lengthM: 900, kind: "road" },
  { id: "riverbank-north-link", from: "saraswati-ghat", to: "triveni-sangam", widthM: 16, lengthM: 400, kind: "road" },
  { id: "riverbank-link", from: "triveni-sangam", to: "dashashwamedh-ghat", widthM: 14, lengthM: 420, kind: "road" },
  { id: "riverbank-east-link", from: "dashashwamedh-ghat", to: "ram-ghat", widthM: 14, lengthM: 450, kind: "road" },
  { id: "riverbank-south-link", from: "ram-ghat", to: "gau-ghat", widthM: 14, lengthM: 500, kind: "road" },
  { id: "arail-approach", from: "gau-ghat", to: "arail-ghat", widthM: 12, lengthM: 600, kind: "road" },
  { id: "arail-ram-link", from: "arail-ghat", to: "ram-ghat", widthM: 14, lengthM: 550, kind: "road" },
  // -- parikrama temple lanes ----------------------------------------------
  { id: "fort-steps", from: "triveni-sangam", to: "akshayavat-mandir", widthM: 8, lengthM: 300, kind: "road" },
  { id: "patalpuri-descent", from: "akshayavat-mandir", to: "patalpuri-mandir", widthM: 6, lengthM: 200, kind: "road" },
  { id: "vasuki-marg", from: "ram-ghat", to: "nagvasuki-mandir", widthM: 10, lengthM: 350, kind: "road" },
  { id: "bazaar-temple-lane", from: "chaitanya-mela-bazaar", to: "mankameshwar-mandir", widthM: 10, lengthM: 450, kind: "road" },
  { id: "rambagh-mandir-marg", from: "rambagh", to: "bade-hanuman-mandir", widthM: 16, lengthM: 1400, kind: "road" },
  // -- overhead crossing ---------------------------------------------------
  { id: "sangam-overcross", from: "chaitanya-mela-bazaar", to: "triveni-sangam", widthM: 6, lengthM: 1300, kind: "corridor" },
  // -- pontoon bridges (the chokepoints) -----------------------------------
  { id: "tilbari-pontoon", from: "akhara-5", to: "dashashwamedh-ghat", widthM: 9, lengthM: 850, kind: "bridge" },
  { id: "jhusi-pontoon", from: "akhara-6", to: "triveni-sangam", widthM: 8, lengthM: 1000, kind: "bridge" },
  { id: "phaphamau-pontoon", from: "akhara-2", to: "saraswati-ghat", widthM: 9, lengthM: 700, kind: "bridge" },
  { id: "naini-pontoon", from: "akhara-8", to: "gau-ghat", widthM: 8, lengthM: 900, kind: "bridge" },
  // -- bath steps & causeways (everything that enters the Sangam) ----------
  { id: "bath-saraswati", from: "saraswati-ghat", to: "sangam-terminal", widthM: 5, lengthM: 600, kind: "ghat" },
  { id: "bath-gau", from: "gau-ghat", to: "sangam-terminal", widthM: 4, lengthM: 550, kind: "ghat" },
  { id: "bath-arail", from: "arail-ghat", to: "sangam-terminal", widthM: 5, lengthM: 700, kind: "ghat" },
  { id: "bath-dashashwamedh", from: "dashashwamedh-ghat", to: "sangam-terminal", widthM: 6, lengthM: 500, kind: "ghat" },
  { id: "triveni-causeway", from: "triveni-sangam", to: "sangam-terminal", widthM: 7, lengthM: 400, kind: "pond" },
  { id: "ramghat-causeway", from: "ram-ghat", to: "sangam-terminal", widthM: 6, lengthM: 480, kind: "pond" },
];
