export default function ExplainerPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 prose-invert">
      <h1 className="font-display text-3xl text-paper">What is the Kumbh Mela?</h1>
      <p className="mt-4 text-paper/70">
        The Kumbh Mela is the world&apos;s largest periodic human gathering — tens of millions of pilgrims
        converge on the Triveni Sangam (the confluence of the Ganga, Yamuna and the mythical
        Saraswati) over roughly seven weeks. The 2019 Prayagraj edition drew an estimated 240 million
        visitors across its span.
      </p>
      <h2 className="mt-6 font-display text-xl text-paper">Why crowd safety matters</h2>
      <p className="mt-2 text-paper/70">
        The dominant risk at a Kumbh is not violence — it is crush. When density exceeds roughly four
        people per square metre on a narrow pontoon bridge, flow collapses into a stop-and-go wave
        that can become lethal within minutes. Marshals, barriers and timed entry exist to keep
        density below that threshold.
      </p>
      <h2 className="mt-6 font-display text-xl text-paper">How this simulation abstracts it</h2>
      <p className="mt-2 text-paper/70">
        sangamora models pilgrims as mass flowing along capacity-limited edges between 24 sectors.
        Each edge&apos;s travel time follows a BPR curve (alpha 0.15, beta 4) so congestion inflates
        smoothly and then catastrophically. Risk scores blend utilization, crush density and stalled
        time into green / amber / orange / red bands. A deterministic marshal brain widens the worst
        chokes and spills onto airy parallel surfaces — and reverts when a widen backfires.
      </p>
      <h2 className="mt-6 font-display text-xl text-paper">Learn more</h2>
      <ul className="mt-2 text-paper/70 list-disc pl-5 space-y-1">
        <li><a className="text-saffron" href="https://en.wikipedia.org/wiki/Kumbh_Mela">Kumbh Mela — Wikipedia</a></li>
        <li><a className="text-saffron" href="https://www.weforum.org/stories/2019/03/kumbh-mela-ai-crowd-management/">WEF: AI-driven crowd management at Kumbh 2019</a></li>
        <li>docs/adr/0003-world-mirrors-2019-modeled-not-verbatim.md</li>
        <li>docs/guides/the-marshal-brain.md</li>
      </ul>
    </div>
  );
}