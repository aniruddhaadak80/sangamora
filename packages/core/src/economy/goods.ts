/**
 * The bazaar stock manifest — the goods tray Chaitanya Mela vendors carry.
 * Pure data (no imports, no logic) so every module that needs a good's price
 * or shelf life reads the exact same table.
 *
 * WHY `festivalBoost`: three goods are the festival economy (marigold malas for
 * puja, boat rides for Ganga Pujari, diyas + prasad thalis) — BazaarSim scales
 * their demand up on Shahi days using the calendar's shahiWeight.
 */

export interface Good {
  id: string;
  name: string;
  nameHi: string;
  /** Sale unit shown to pilgrims ("glass", "mala", "ride", ...). */
  unit: string;
  /** Nominal 2019-flavored price in INR — BazaarSim prices around this. */
  basePriceInr: number;
  /** Shelf life in minutes, or null for non-perishable goods. Leftovers decay linearly. */
  spoilMin: number | null;
  /** Provisioned counter stock per 1k pilgrims the vendor's counter would face. */
  stockUnitPer1k: number;
  /** Demand multiplier on Shahi snan days; 1 = no festival spike. */
  festivalBoost: number;
}

export const GOODS: readonly Good[] = [
  { id: "chai-glass", name: "Chai (glass)", nameHi: "चाय (गिलास)", unit: "glass", basePriceInr: 15, spoilMin: 480, stockUnitPer1k: 600, festivalBoost: 1 },
  { id: "kachori", name: "Kachori (plate)", nameHi: "कचौड़ी (प्लेट)", unit: "plate", basePriceInr: 10, spoilMin: 360, stockUnitPer1k: 500, festivalBoost: 1 },
  { id: "jalebi", name: "Jalebi (100 g)", nameHi: "जलेबी (100 ग्राम)", unit: "100g", basePriceInr: 20, spoilMin: 720, stockUnitPer1k: 400, festivalBoost: 1 },
  { id: "laddu", name: "Laddu", nameHi: "लड्डू", unit: "piece", basePriceInr: 25, spoilMin: null, stockUnitPer1k: 350, festivalBoost: 1.2 },
  { id: "marigold-mala", name: "Marigold mala", nameHi: "गेंदा की माला", unit: "mala", basePriceInr: 30, spoilMin: 2880, stockUnitPer1k: 250, festivalBoost: 2.4 },
  { id: "boat-ride", name: "Ganga boat ride", nameHi: "गंगा नाव यात्रा", unit: "ride", basePriceInr: 120, spoilMin: null, stockUnitPer1k: 40, festivalBoost: 1.8 },
  { id: "coconut", name: "Coconut", nameHi: "नारियल", unit: "piece", basePriceInr: 40, spoilMin: 1440, stockUnitPer1k: 220, festivalBoost: 1.2 },
  { id: "diya", name: "Clay diya", nameHi: "मिट्टी का दीया", unit: "piece", basePriceInr: 20, spoilMin: null, stockUnitPer1k: 300, festivalBoost: 1.5 },
  { id: "prasad-plate", name: "Prasad thali", nameHi: "प्रसाद थाली", unit: "thali", basePriceInr: 50, spoilMin: 240, stockUnitPer1k: 260, festivalBoost: 1.3 },
  { id: "padlock", name: "Brass padlock", nameHi: "पीतल ताला", unit: "piece", basePriceInr: 35, spoilMin: null, stockUnitPer1k: 60, festivalBoost: 1 },
  { id: "plaster-splint", name: "Leg splint (plaster)", nameHi: "प्लास्टर स्प्लिंट", unit: "splint", basePriceInr: 60, spoilMin: null, stockUnitPer1k: 30, festivalBoost: 1 },
  { id: "blanket", name: "Kambal blanket", nameHi: "कंबल", unit: "piece", basePriceInr: 180, spoilMin: null, stockUnitPer1k: 80, festivalBoost: 1 },
  { id: "tent-bed", name: "Tent-charpoy (night)", nameHi: "तंबू-खाट (रात)", unit: "night", basePriceInr: 250, spoilMin: null, stockUnitPer1k: 45, festivalBoost: 1 },
  { id: "battery-topup", name: "Phone battery top-up", nameHi: "फोन बैटरी टॉप-अप", unit: "10 min", basePriceInr: 30, spoilMin: null, stockUnitPer1k: 500, festivalBoost: 1 },
];

// -- load-time sanity (mirrors CrowdSim's duplicate-id guard) ----------------

const seenGoods = new Set<string>();
for (const g of GOODS) {
  if (seenGoods.has(g.id)) throw new Error(`GOODS: duplicate good id "${g.id}"`);
  seenGoods.add(g.id);
  if (g.basePriceInr <= 0) throw new Error(`GOODS: good "${g.id}" needs a positive basePriceInr`);
  if (g.stockUnitPer1k <= 0) throw new Error(`GOODS: good "${g.id}" needs a positive stockUnitPer1k`);
  if (g.festivalBoost < 1) throw new Error(`GOODS: good "${g.id}" festivalBoost must be >= 1`);
  if (g.spoilMin !== null && g.spoilMin <= 0) throw new Error(`GOODS: good "${g.id}" spoilMin must be positive or null`);
}
