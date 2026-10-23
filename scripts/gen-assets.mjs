// Deterministic SVG asset generator for sangamora.
// Run: node scripts/gen-assets.mjs   (writes into apps/web/public/images + docs/images)
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const IMG = join(ROOT, "apps/web/public/images");
const SCREENS = join(IMG, "screens");
const DOCIMG = join(ROOT, "docs/images");
for (const d of [IMG, SCREENS, DOCIMG]) mkdirSync(d, { recursive: true });

const PALETTE = { ink: "#160919", paper: "#FFF6E8", saffron: "#FF8A00", river: "#0E7C7B", surface: "#2A1533" };

function svg(w, h, body, title) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${title}">\n  <title>${title}</title>\n${body}\n</svg>\n`;
}

// logo
writeFileSync(join(IMG, "logo.svg"), svg(200, 48,
  `  <rect x="0" y="0" width="48" height="48" rx="10" fill="${PALETTE.saffron}"/>
  <text x="24" y="32" font-family="sans-serif" font-size="26" font-weight="700" fill="${PALETTE.ink}" text-anchor="middle">स</text>
  <text x="60" y="32" font-family="sans-serif" font-size="22" font-weight="700" fill="${PALETTE.paper}">sangamora</text>`,
  "sangamora logo"));

// banner
let bannerBody = `  <rect width="1280" height="640" fill="${PALETTE.ink}"/>
  <circle cx="980" cy="320" r="220" fill="${PALETTE.saffron}" opacity="0.12"/>
  <circle cx="980" cy="320" r="120" fill="${PALETTE.river}" opacity="0.18"/>
  <text x="80" y="260" font-family="sans-serif" font-size="64" font-weight="700" fill="${PALETTE.paper}">sangamora</text>
  <text x="80" y="320" font-family="sans-serif" font-size="26" fill="${PALETTE.paper}" opacity="0.7">5.2M pilgrims. 24 sectors. 3 shahi snan. Zero API keys.</text>`;
for (let i = 0; i < 40; i++) {
  const x = 80 + (i % 8) * 40 + Math.floor(i / 8) * 6;
  const y = 420 + (i % 5) * 24;
  bannerBody += `\n  <circle cx="${x}" cy="${y}" r="2" fill="${PALETTE.saffron}" opacity="0.6"/>`;
}
writeFileSync(join(IMG, "banner.svg"), svg(1280, 640, bannerBody, "sangamora banner"));

// og
writeFileSync(join(IMG, "og.svg"), svg(1200, 630,
  `  <rect width="1200" height="630" fill="${PALETTE.ink}"/>
  <text x="80" y="260" font-family="sans-serif" font-size="84" font-weight="700" fill="${PALETTE.paper}">sangamora</text>
  <text x="80" y="340" font-family="sans-serif" font-size="30" fill="${PALETTE.paper}" opacity="0.7">The widest experience one prompt can build.</text>
  <text x="80" y="420" font-family="sans-serif" font-size="22" fill="${PALETTE.saffron}">5.2M pilgrims · 24 sectors · 54 edges · 3 shahi snan · zero API keys</text>`,
  "sangamora social card"));

// favicon
writeFileSync(join(IMG, "favicon.svg"), svg(64, 64,
  `  <rect width="64" height="64" rx="12" fill="${PALETTE.saffron}"/>
  <text x="32" y="44" font-family="sans-serif" font-size="36" font-weight="700" fill="${PALETTE.ink}" text-anchor="middle">स</text>`,
  "sangamora favicon"));

// 6 screen mockups
const SCREENS_DATA = ["map", "risk", "bazaar", "rails", "replay", "analytics"];
for (const name of SCREENS_DATA) {
  const body = `  <rect width="1024" height="640" fill="${PALETTE.surface}"/>
  <rect x="0" y="0" width="1024" height="40" fill="${PALETTE.ink}"/>
  <text x="20" y="26" font-family="sans-serif" font-size="14" fill="${PALETTE.paper}">sangamora · ${name}</text>
  <rect x="40" y="80" width="944" height="520" rx="12" fill="${PALETTE.ink}" opacity="0.6"/>
  <text x="512" y="340" font-family="sans-serif" font-size="28" fill="${PALETTE.saffron}" text-anchor="middle">${name.toUpperCase()}</text>`;
  writeFileSync(join(SCREENS, `${name}.svg`), svg(1024, 640, body, `sangamora ${name} screen`));
}

// architecture poster
writeFileSync(join(DOCIMG, "architecture.svg"), svg(1200, 800,
  `  <rect width="1200" height="800" fill="${PALETTE.ink}"/>
  <text x="60" y="60" font-family="sans-serif" font-size="32" font-weight="700" fill="${PALETTE.paper}">sangamora — architecture</text>
  <rect x="60" y="120" width="300" height="120" rx="8" fill="${PALETTE.surface}" stroke="${PALETTE.saffron}"/>
  <text x="80" y="160" font-family="sans-serif" font-size="16" fill="${PALETTE.paper}">Browser client</text>
  <text x="80" y="190" font-family="sans-serif" font-size="12" fill="${PALETTE.paper}" opacity="0.6">Next.js 16 · React 19</text>
  <rect x="440" y="120" width="300" height="120" rx="8" fill="${PALETTE.surface}" stroke="${PALETTE.river}"/>
  <text x="460" y="160" font-family="sans-serif" font-size="16" fill="${PALETTE.paper}">@sangamora/core</text>
  <text x="460" y="190" font-family="sans-serif" font-size="12" fill="${PALETTE.paper}" opacity="0.6">CrowdSim · BazaarSim · MarshalBrain</text>
  <rect x="820" y="120" width="300" height="120" rx="8" fill="${PALETTE.surface}" stroke="${PALETTE.gold}"/>
  <text x="840" y="160" font-family="sans-serif" font-size="16" fill="${PALETTE.paper}">Polyglot services</text>
  <text x="840" y="190" font-family="sans-serif" font-size="12" fill="${PALETTE.paper}" opacity="0.6">Rust · Python · Go</text>
  <line x1="360" y1="180" x2="440" y2="180" stroke="${PALETTE.saffron}" stroke-width="2"/>
  <line x1="740" y1="180" x2="820" y2="180" stroke="${PALETTE.saffron}" stroke-width="2"/>`,
  "sangamora architecture poster"));

console.log("assets generated");
