"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import clsx from "clsx";
import gsap from "gsap";
import { View } from "@react-three/drei";

import { Bounded } from "@/components/Bounded";
import Scene, { SkyDiveHandle } from "./Scene";
import SplitText from "@/components/reactbits/SplitText";
import ShinyText from "@/components/reactbits/ShinyText";
import GradientText from "@/components/reactbits/GradientText";
import { ArrowIcon } from "../Carousel/ArrowIcon";
import { DRINKS, type DrinkKey } from "@/data/drinks";

const SENTENCE = "Set sail. Stay fizzy.";

// The six founding Straw Hats — the first crew, in joining order.
const FIRST_CREW: DrinkKey[] = [
  "luffy",
  "zoro",
  "usopp",
  "nami",
  "sanji",
  "chopper",
];

/**
 * SkyDive — a can free-falling through the clouds above the Grand Line.
 * Now a first-crew gallery: browse the six founding Straw Hats' cans with
 * next/previous, and drag the falling can to spin it yourself.
 */
const SkyDive = (): JSX.Element => {
  const [crewIndex, setCrewIndex] = useState(0);
  const handle = useRef<SkyDiveHandle>({ can: null, spin: null }).current;
  const spinDrag = useRef({ down: false, lastX: 0, vel: 0 });

  const drink = DRINKS.find((d) => d.key === FIRST_CREW[crewIndex])!;

  function step(dir: number) {
    setCrewIndex((i) => (i + dir + FIRST_CREW.length) % FIRST_CREW.length);
  }

  // Bouncy squash-and-pop when the featured crew can swaps.
  useEffect(() => {
    if (!handle.can) return;
    gsap.fromTo(
      handle.can.scale,
      { x: 0.8, y: 0.8, z: 0.8 },
      { x: 1, y: 1, z: 1, duration: 0.9, ease: "elastic.out(1, 0.45)" },
    );
  }, [crewIndex, handle]);

  // ── Drag-to-spin the falling can (mouse + touch). Vertical swipes still
  // scroll the page (touch-action: pan-y); horizontal drags take over the
  // can's rotation, then hand it back to the auto-spin on release.
  function onPointerDown(e: ReactPointerEvent) {
    if ((e.target as HTMLElement).closest("button, a")) return;
    if (!handle.can) return;
    spinDrag.current = { down: true, lastX: e.clientX, vel: 0 };
    handle.spin?.kill();
    handle.spin = null;
    gsap.killTweensOf(handle.can.rotation);
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  }
  function onPointerMove(e: ReactPointerEvent) {
    if (!spinDrag.current.down || !handle.can) return;
    const dx = e.clientX - spinDrag.current.lastX;
    spinDrag.current.lastX = e.clientX;
    spinDrag.current.vel = dx;
    handle.can.rotation.y += dx * 0.012;
  }
  function onPointerUp() {
    if (!spinDrag.current.down || !handle.can) return;
    spinDrag.current.down = false;
    const can = handle.can;
    // Inertia fling, then resume the endless free-fall spin.
    gsap.to(can.rotation, {
      y: `+=${spinDrag.current.vel * 0.012 * 20}`,
      duration: 0.9,
      ease: "power3.out",
      onComplete() {
        handle.spin?.kill();
        handle.spin = gsap.to(can.rotation, {
          y: `+=${Math.PI * 2}`,
          duration: 1.7,
          repeat: -1,
          ease: "none",
        });
      },
    });
  }

  return (
    <Bounded className="skydive relative min-h-screen overflow-hidden bg-[#0D1A2A]">
      <h2 className="sr-only">{SENTENCE}</h2>

      {/* Title-card overlay + first-crew gallery. z-40 keeps the dossier
          card readable ABOVE the fixed 3D canvas (z-30) — on phones the
          falling can is huge and used to cover the card entirely. */}
      <div className="pointer-events-none absolute inset-0 z-40 flex select-none flex-col items-center justify-between px-4 py-14 md:py-20">
        <p className="op-kicker text-xs text-[#C9A227] md:text-sm">
          <ShinyText text="Chapter 01 · The First Crew" speed={6} />
        </p>

        <div className="flex w-full flex-col items-center gap-3 md:gap-4">
          <SplitText
            as="p"
            text="Terminal velocity, maximum fizz."
            splitBy="words"
            stagger={0.08}
            className="font-pirate text-lg text-[#ECE4D3]/80 md:text-3xl"
          />

          {/* Gallery: previous / crewmate dossier / next */}
          <div className="pointer-events-auto flex w-full max-w-xl items-center justify-center gap-3 md:gap-5">
            <GalleryArrow
              direction="left"
              label="Previous crewmate"
              onClick={() => step(-1)}
            />
            <div
              key={drink.key}
              className="op-pop w-60 rounded-2xl border border-[#C9A227]/35 bg-[#0B0E14]/80 px-4 py-3 text-center shadow-[0_10px_40px_rgba(0,0,0,0.45)] backdrop-blur-md md:w-80 md:px-6 md:py-4"
            >
              <p className="font-pirate text-xs tracking-[0.22em] text-[#C9A227] md:text-sm">
                {drink.character}
              </p>
              <p className="op-title text-xl md:text-2xl">
                <GradientText colors={["#F5E6B3", "#C9A227", "#E7CF7A"]}>
                  {drink.name}
                </GradientText>
              </p>
              <p className="mt-0.5 hidden text-xs italic text-[#ECE4D3]/60 md:block">
                &ldquo;{drink.tagline}&rdquo;
              </p>
              <div className="mt-1.5 flex items-center justify-center gap-2">
                <span className="font-display text-[9px] uppercase tracking-[0.3em] text-[#B3111C]">
                  Wanted
                </span>
                <span className="font-pirate text-base leading-none text-[#C9A227] md:text-lg">
                  {"฿"}
                  {drink.bounty.toLocaleString("en-US")}
                </span>
              </div>
            </div>
            <GalleryArrow
              direction="right"
              label="Next crewmate"
              onClick={() => step(1)}
            />
          </div>

          {/* Crew position dots */}
          <div className="pointer-events-auto flex items-center gap-2">
            {FIRST_CREW.map((key, i) => (
              <button
                key={key}
                aria-label={`Show the ${key} can`}
                onClick={() => setCrewIndex(i)}
                className={clsx(
                  "h-2 rounded-full transition-all duration-300",
                  i === crewIndex
                    ? "w-6 bg-[#C9A227]"
                    : "w-2 bg-[#ECE4D3]/30 hover:bg-[#ECE4D3]/60",
                )}
              />
            ))}
          </div>

          <p className="text-center font-pirate text-xs text-[#ECE4D3]/40 md:text-sm">
            Drag the falling can to spin it
          </p>
        </div>
      </div>

      {/* Corner framing marks */}
      <span className="pointer-events-none absolute left-6 top-6 z-20 h-10 w-10 border-l border-t border-[#C9A227]/40 md:left-10 md:top-10" />
      <span className="pointer-events-none absolute right-6 top-6 z-20 h-10 w-10 border-r border-t border-[#C9A227]/40 md:right-10 md:top-10" />
      <span className="pointer-events-none absolute bottom-6 left-6 z-20 h-10 w-10 border-b border-l border-[#C9A227]/40 md:bottom-10 md:left-10" />
      <span className="pointer-events-none absolute bottom-6 right-6 z-20 h-10 w-10 border-b border-r border-[#C9A227]/40 md:bottom-10 md:right-10" />

      <div
        className="h-screen w-screen cursor-grab select-none active:cursor-grabbing"
        style={{ touchAction: "pan-y" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <View className="pointer-events-none h-full w-full">
          <Scene
            flavor={FIRST_CREW[crewIndex]}
            sentence={SENTENCE}
            handle={handle}
          />
        </View>
      </div>
    </Bounded>
  );
};

export default SkyDive;

function GalleryArrow({
  direction,
  label,
  onClick,
}: {
  direction: "left" | "right";
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="size-10 shrink-0 rounded-full border border-[#C9A227]/40 bg-[#0B0E14]/60 p-2.5 text-[#C9A227] backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:border-[#C9A227] hover:bg-[#0B0E14] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227] md:size-12 md:p-3"
    >
      <ArrowIcon className={clsx(direction === "right" && "-scale-x-100")} />
      <span className="sr-only">{label}</span>
    </button>
  );
}
