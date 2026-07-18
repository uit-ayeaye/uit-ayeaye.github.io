"use client";

import { useEffect, useState } from "react";
import { Bounded } from "@/components/Bounded";
import { DRINKS } from "@/data/drinks";
import SplitText from "@/components/reactbits/SplitText";
import ShinyText from "@/components/reactbits/ShinyText";
import CountUp from "@/components/reactbits/CountUp";
import SpotlightCard from "@/components/reactbits/SpotlightCard";
import Aurora from "@/components/reactbits/Aurora";
import { asset } from "@/lib/asset";

/**
 * FlavorGrid — "The Full Manifest". A spotlight-card grid of the whole
 * crew lineup plus a count-up stat strip. This is the page's product
 * catalogue beat: scannable, premium, and it makes the range feel complete.
 * Each card previews the character straight from their can label, so the
 * grid scales to any roster size.
 */
type Drink = (typeof DRINKS)[number];

const FlavorGrid = (): JSX.Element => {
  const [selected, setSelected] = useState<Drink | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <Bounded
      as="section"
      className="manifest op-grain relative overflow-hidden bg-[#0B0E14] py-24 text-[#ECE4D3] md:py-32"
    >
      <div id="manifest" className="absolute -top-24" aria-hidden="true" />
      <Aurora
        colors={["#B3111C", "#C9A227", "#122B47"]}
        intensity={0.28}
        className="z-0"
      />

      <div className="relative z-10 w-full">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="op-kicker text-xs text-[#C9A227] md:text-sm">
            <ShinyText text="The Full Manifest" speed={6} />
          </p>
          <SplitText
            as="h2"
            text="Fourteen Legends. One Cooler."
            splitBy="words"
            stagger={0.06}
            className="op-title mt-4 text-4xl uppercase md:text-7xl"
          />
          <div className="op-rule mx-auto mt-6 w-32" />
          <p className="mt-6 text-lg text-[#ECE4D3]/70">
            The whole crew, bottled. Pick a fighter — or requisition the full
            case and sail with the lot.
          </p>
        </div>

        {/* Stat strip */}
        <div className="mx-auto mt-14 grid max-w-3xl grid-cols-3 gap-4 border-y border-[#C9A227]/20 py-8 text-center">
          <Stat value={<CountUp to={DRINKS.length} />} label="Devil Fruit Grades" />
          <Stat value={<CountUp to={0} />} label="Curses Included" />
          <Stat
            value={
              <>
                <CountUp to={100} />%
              </>
            }
            label="Real Fruit"
          />
        </div>

        {/* Cards */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {DRINKS.map((drink) => (
            <button
              key={drink.key}
              type="button"
              onClick={() => setSelected(drink)}
              aria-label={`View ${drink.character} — ${drink.name}`}
              className="group block rounded-2xl text-left transition-transform duration-300 hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227]"
            >
            <SpotlightCard
              spotlightColor="rgba(201, 162, 39, 0.22)"
              className="flex h-full flex-col p-6"
            >
              {/* accent bar tinted with the can color */}
              <span
                className="mb-6 block h-1 w-12 rounded-full"
                style={{ backgroundColor: drink.color }}
              />

              <div
                className="relative mb-6 overflow-hidden rounded-xl ring-1 ring-[#C9A227]/15"
                role="img"
                aria-label={`${drink.character} — ${drink.name}`}
              >
                {/* the character, centre-cropped from their own can label */}
                <div
                  className="aspect-[4/5] w-full bg-cover bg-center bg-no-repeat transition-transform duration-500 group-hover:scale-125"
                  style={{
                    backgroundImage: `url('${asset(`/labels/${drink.key}.webp`)}')`,
                  }}
                />
                {/* can-colored wash that warms up on hover */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 mix-blend-overlay transition-opacity duration-500 group-hover:opacity-30"
                  style={{ backgroundColor: drink.color }}
                  aria-hidden="true"
                />
                {/* bottom vignette so the card text below reads cleanly */}
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/50 to-transparent"
                  aria-hidden="true"
                />
              </div>

              <p className="font-pirate text-sm tracking-[0.2em] text-[#C9A227]">
                {drink.character}
              </p>
              <h3 className="op-title mt-1 text-2xl md:text-3xl">{drink.name}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-[#ECE4D3]/70">
                {drink.flavorNotes}
              </p>

              <div className="mt-6 flex items-center justify-between border-t border-[#C9A227]/15 pt-4">
                <span className="font-display text-xs uppercase tracking-[0.25em] text-[#C9A227]/80">
                  300 Berries
                </span>
                <span className="font-pirate text-sm text-[#ECE4D3]/60">
                  {drink.tagline}
                </span>
              </div>
            </SpotlightCard>
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox — tap a card to view the full can art + dossier */}
      {selected && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`${selected.character} — ${selected.name}`}
          onClick={() => setSelected(null)}
        >
          <div
            className="relative max-h-[92vh] w-full max-w-sm overflow-y-auto rounded-2xl border border-[#C9A227]/30 bg-[#0B0E14] shadow-[0_0_60px_rgba(0,0,0,0.6)]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelected(null)}
              aria-label="Close"
              className="absolute right-3 top-3 z-10 flex size-9 items-center justify-center rounded-full border border-[#C9A227]/40 bg-black/50 text-[#ECE4D3] backdrop-blur-sm transition hover:bg-black/70"
            >
              ✕
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={asset(`/labels/${selected.key}.webp`)}
              alt={`${selected.character} — ${selected.name} can label`}
              className="w-full"
            />
            <div className="p-6 text-center">
              <p className="font-pirate text-sm tracking-[0.2em] text-[#C9A227]">
                {selected.character}
              </p>
              <h3 className="op-title mt-1 text-3xl">{selected.name}</h3>
              <p className="mt-3 text-sm italic text-[#ECE4D3]/60">
                &ldquo;{selected.tagline}&rdquo;
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[#ECE4D3]/80">
                {selected.flavorNotes}
              </p>
              <div className="mt-5 flex items-center justify-center gap-2">
                <span className="font-display text-[10px] uppercase tracking-[0.35em] text-[#B3111C]">
                  Wanted
                </span>
                <span className="font-pirate text-xl text-[#C9A227]">
                  {"฿"}
                  {selected.bounty.toLocaleString("en-US")}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </Bounded>
  );
};

function Stat({
  value,
  label,
}: {
  value: React.ReactNode;
  label: string;
}) {
  return (
    <div>
      <p className="op-title text-4xl text-[#C9A227] md:text-6xl">{value}</p>
      <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[#ECE4D3]/60 md:text-sm">
        {label}
      </p>
    </div>
  );
}

export default FlavorGrid;
