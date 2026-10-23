"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { EDGES, formatIndian, MELA_DAYS, SCENARIOS, SECTORS, TIMETABLE } from "@sangamora/core";
import { Button, Diya, Eyebrow, Heading, Lead, Stat } from "@sangamora/ui";

const FEATURES = [
  { href: "/map", title: "Crowd-flow engine", body: "24 sectors, 54 edges, mass-conserving social-force flow. Watch 5.2M pilgrims move." },
  { href: "/risk", title: "Stampede risk", body: "Closed-form risk scores, bands, triage. The chokepoints turn red before they fail." },
  { href: "/bazaar", title: "Emergent bazaar", body: "336 vendors, price elasticity, stockouts, Shahi-day spikes. Poke the economy." },
  { href: "/rails", title: "Rail waves", body: "24 modeled rakes across 7 days. Cohort injection into station sectors." },
  { href: "/replay", title: "Time machine", body: "Replay any minute. State hashes prove determinism: same seed, same universe." },
  { href: "/scenarios", title: "Scenarios", body: "8 presets: no-marshal, monsoon surge, pontoon shutdown, 11M stress test." },
];

export default function HomePage() {
  const shahiDays = MELA_DAYS.filter((d) => d.isShahi).length;
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:py-20">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="grid md:grid-cols-2 gap-10 items-center"
      >
        <div>
          <Eyebrow className="text-saffron">Kumbh Mela · simulation sandbox</Eyebrow>
          <Heading size="display-xl" className="mt-3 text-paper">
            The widest experience <span className="text-saffron">one prompt</span> can build.
          </Heading>
          <Lead className="mt-4 text-paper/70">
            A deterministic, zero-API-key simulation of the world&apos;s largest human gathering. 5.2 million
            pilgrims flow through 24 sectors and 54 edges toward the Triveni Sangam — and you can poke
            every lever.
          </Lead>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/map"><Button size="lg">Open the Sangam Map</Button></Link>
            <Link href="/explainer"><Button variant="secondary" size="lg">What is the Kumbh?</Button></Link>
          </div>
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Pilgrims modeled" value={formatIndian(5_200_000)} />
            <Stat label="Sectors" value={String(SECTORS.length)} />
            <Stat label="Edges" value={String(EDGES.length)} />
            <Stat label="Shahi snan days" value={String(shahiDays)} />
          </div>
        </div>
        <div className="relative flex justify-center">
          <Diya size={220} className="text-saffron" />
        </div>
      </motion.section>

      <section className="mt-16">
        <Heading size="h3" className="text-paper">What you can do</Heading>
        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <Link key={f.href} href={f.href} className="block group">
              <div className="h-full p-5 rounded-xl bg-surface border border-paper/10 hover:border-saffron/40 transition-colors">
                <Heading size="h4" className="text-paper group-hover:text-saffron">{f.title}</Heading>
                <p className="mt-2 text-sm text-paper/60">{f.body}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-16 grid md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-surface border border-paper/10">
          <Eyebrow className="text-river">Zero keys</Eyebrow>
          <p className="mt-2 text-sm text-paper/70">
            Every &quot;AI&quot; is a deterministic finite-state marshal. No LLM, no network, no secrets. Same
            seed, same universe, byte for byte.
          </p>
        </div>
        <div className="p-5 rounded-xl bg-surface border border-paper/10">
          <Eyebrow className="text-river">Polyglot</Eyebrow>
          <p className="mt-2 text-sm text-paper/70">
            TypeScript core, Rust BPR parity engine, Python marshal service, Go SSE relay — all
            green on CI.
          </p>
        </div>
        <div className="p-5 rounded-xl bg-surface border border-paper/10">
          <Eyebrow className="text-river">Open source</Eyebrow>
          <p className="mt-2 text-sm text-paper/70">
            MIT licensed. {TIMETABLE.length} modeled trains, {SCENARIOS.length} scenarios, 14 locales
            on the roadmap.
          </p>
        </div>
      </section>
    </div>
  );
}