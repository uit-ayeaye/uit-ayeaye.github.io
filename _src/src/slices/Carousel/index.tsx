"use client";

import { Center, Environment, View } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { ReactNode, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import clsx from "clsx";
import { Group } from "three";
import gsap from "gsap";

import FloatingCan from "@/components/FloatingCan";
import { DRINKS } from "@/data/drinks";
import { ArrowIcon } from "./ArrowIcon";
import { ThunderBolts, ThunderBoltsHandle } from "./ThunderBolts";
import { WavyCircles } from "./WavyCircles";
import ShinyText from "@/components/reactbits/ShinyText";
import GradientText from "@/components/reactbits/GradientText";
import StarBorder from "@/components/reactbits/StarBorder";
import Magnet from "@/components/reactbits/Magnet";
import { asset } from "@/lib/asset";

const SPINS_ON_CHANGE = 8;

// ─── Front-facing adjustment ────────────────────────────────────────────
// The can group's resting rotation. Since the flavor-change spin below
// moves the can by whole multiples of 2*PI (`+=`/`-=`), whatever value you
// set here is where the can settles after every spin too — so this alone
// controls which side faces the camera in the carousel.
const CAN_FRONT_ROTATION_Y = -(Math.PI * 1 * 1.62); // 10% turn left

/**
 * Carousel — "Choose Your Nakama" character drink selector.
 */
const Carousel = (): JSX.Element => {
  const [currentFlavorIndex, setCurrentFlavorIndex] = useState(0);
  const sodaCanRef = useRef<Group>(null);
  const thunderRef = useRef<ThunderBoltsHandle>(null);
  const chipRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const railRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ down: false, startX: 0, scrollLeft: 0, moved: false });

  // Pointer drag-to-scroll for the crew gallery (mouse only — touch keeps
  // native momentum scrolling). `moved` suppresses the click after a drag so
  // you don't accidentally select a can while scrolling the row.
  function onRailPointerDown(e: ReactPointerEvent) {
    if (e.pointerType !== "mouse" || !railRef.current) return;
    drag.current = {
      down: true,
      startX: e.clientX,
      scrollLeft: railRef.current.scrollLeft,
      moved: false,
    };
  }
  function onRailPointerMove(e: ReactPointerEvent) {
    if (!drag.current.down || !railRef.current) return;
    const dx = e.clientX - drag.current.startX;
    if (Math.abs(dx) > 4) drag.current.moved = true;
    railRef.current.scrollLeft = drag.current.scrollLeft - dx;
  }
  function onRailPointerUp() {
    drag.current.down = false;
  }

  function changeFlavor(index: number) {
    if (!sodaCanRef.current) return;

    const nextIndex = (index + DRINKS.length) % DRINKS.length;

    // Thunderclap tinted with the next character's color
    thunderRef.current?.strike(DRINKS[nextIndex].color);

    const dir = index > currentFlavorIndex ? -1 : 1;
    const spin = Math.PI * 2 * SPINS_ON_CHANGE;

    const tl = gsap.timeline();

    tl
      // Bouncy spin — overshoots slightly and settles instead of a flat stop.
      .to(
        sodaCanRef.current.rotation,
        {
          y: dir < 0 ? `-=${spin}` : `+=${spin}`,
          ease: "back.out(1.3)",
          duration: 1.1,
        },
        0,
      )
      // Squash-and-stretch punch on the swap.
      .fromTo(
        sodaCanRef.current.scale,
        { x: 1, y: 1, z: 1 },
        { x: 1.16, y: 1.16, z: 1.16, duration: 0.25, ease: "power2.out" },
        0,
      )
      .to(
        sodaCanRef.current.scale,
        { x: 1, y: 1, z: 1, duration: 0.9, ease: "elastic.out(1, 0.5)" },
        0.25,
      )
      // A little hop so the can feels bouncy and alive.
      .fromTo(
        sodaCanRef.current.position,
        { y: 0 },
        { y: 0.4, duration: 0.25, ease: "power2.out" },
        0,
      )
      .to(
        sodaCanRef.current.position,
        { y: 0, duration: 0.9, ease: "elastic.out(1, 0.55)" },
        0.25,
      )
      .to(
        ".background, .wavy-circles-outer, .wavy-circles-inner",
        {
          backgroundColor: DRINKS[nextIndex].color,
          fill: DRINKS[nextIndex].color,
          ease: "power2.inOut",
          duration: 1,
        },
        0,
      )
      .to(".text-wrapper", { duration: 0.2, y: -10, opacity: 0 }, 0)
      .to({}, { onStart: () => setCurrentFlavorIndex(nextIndex) }, 0.5)
      .to(".text-wrapper", { duration: 0.2, y: 0, opacity: 1 }, 0.7);
  }

  // Keep the active crew chip scrolled into view in the roster rail.
  useEffect(() => {
    chipRefs.current[currentFlavorIndex]?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [currentFlavorIndex]);

  const current = DRINKS[currentFlavorIndex];

  return (
    <section
      id="crew"
      className="carousel op-grain op-seam relative flex min-h-screen flex-col items-center justify-start gap-5 overflow-hidden bg-[#0B0E14] px-4 py-16 text-[#ECE4D3] md:justify-center md:gap-7 md:py-24"
    >
      <div className="background pointer-events-none absolute inset-0 bg-[#141C2B] opacity-70" />

      {/* Tiled wanted-poster texture, very faint. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-repeat opacity-[0.06] mix-blend-screen"
        style={{ backgroundImage: `url('${asset("/images/bg-wanted-posters.jfif")}')` }}
      />

      <WavyCircles className="absolute left-1/2 top-1/2 h-[120vmin] -translate-x-1/2 -translate-y-1/2 text-[#141C2B] opacity-80" />

      <ThunderBolts ref={thunderRef} />

      {/* Header */}
      <div className="relative z-10 shrink-0 text-center">
        <p className="op-kicker text-xs text-[#C9A227] md:text-sm">
          <ShinyText text="Pick Your Fighter" speed={6} />
        </p>
        <h2 className="op-title mt-2 text-4xl uppercase sm:text-5xl md:text-7xl lg:text-8xl">
          <GradientText colors={["#E7CF7A", "#C9A227", "#B3111C", "#C9A227"]}>
            Choose Your Nakama
          </GradientText>
        </h2>
      </div>

      {/* Featured can */}
      <div className="relative z-10 grid w-full max-w-4xl shrink-0 grid-cols-[auto,1fr,auto] items-center">
        <ArrowButton
          onClick={() => changeFlavor(currentFlavorIndex + 1)}
          direction="left"
          label="Previous Drink"
        />
        <View className="mx-auto aspect-square h-[46vmin] min-h-[12rem] w-full md:h-[56vmin]">
          <Center position={[0, 0, 1.5]}>
            {/* Slow turntable group — keeps the featured can alive; the
                change-spin animates the inner can group on top of it. */}
            <Turntable speed={0.5} scale={1.15}>
              <FloatingCan
                ref={sodaCanRef}
                floatIntensity={0.5}
                rotationIntensity={0.35}
                flavor={current.key}
                rotation={[0, CAN_FRONT_ROTATION_Y, 0]}
              >
                {/* Character-tinted glow that travels with the can — same
                    intensity/decay as the SkyDive hero can. */}
                <pointLight
                  intensity={30}
                  decay={0.6}
                  color={current.color}
                  position={[0, 0.5, -1.6]}
                />
              </FloatingCan>
            </Turntable>
          </Center>

          {/* Exact SkyDive-can lighting: field HDRI @1.5 + cool ambient,
              no hard direct lights. Reads as a clean, attractive product
              instead of a harsh mirror, and keeps the label readable. */}
          <Environment
            files={asset("/hdr/field.hdr")}
            environmentIntensity={1.5}
          />
          <ambientLight intensity={2} color="#9DDEFA" />
        </View>
        <ArrowButton
          onClick={() => changeFlavor(currentFlavorIndex - 1)}
          direction="right"
          label="Next Drink"
        />
      </div>

      {/* Crew gallery — all 14 cans. Drag (mouse) or swipe (touch) to scroll
          the row; tap a card to feature that can above. */}
      <div className="relative z-10 w-full max-w-5xl shrink-0">
        <div
          ref={railRef}
          onPointerDown={onRailPointerDown}
          onPointerMove={onRailPointerMove}
          onPointerUp={onRailPointerUp}
          onPointerLeave={onRailPointerUp}
          className="crew-rail flex cursor-grab select-none gap-3 overflow-x-auto px-4 pb-3 pt-2 active:cursor-grabbing md:gap-4"
        >
          {DRINKS.map((drink, i) => {
            const active = i === currentFlavorIndex;
            return (
              <button
                key={drink.key}
                ref={(el) => {
                  chipRefs.current[i] = el;
                }}
                aria-label={`Select ${drink.character} — ${drink.name}`}
                aria-pressed={active}
                onClick={() => {
                  if (drag.current.moved) return;
                  changeFlavor(i);
                }}
                className={clsx(
                  "group relative shrink-0 overflow-hidden rounded-2xl border-2 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227]",
                  active
                    ? "h-36 w-[6.5rem] -translate-y-1.5 border-[#C9A227] shadow-[0_0_30px_rgba(201,162,39,0.55)] md:h-44 md:w-32"
                    : "h-32 w-24 border-[#C9A227]/20 opacity-75 hover:-translate-y-0.5 hover:border-[#C9A227]/60 hover:opacity-100 md:h-40 md:w-[7rem]",
                )}
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                  style={{
                    backgroundImage: `url('${asset(`/labels/${drink.key}.webp`)}')`,
                    filter: active ? "none" : "saturate(0.85) brightness(0.92)",
                  }}
                />
                {/* glossy sheen for a premium can-card look */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/15"
                />
                <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent px-1.5 pb-2 pt-8">
                  <span className="block truncate text-center font-display text-[11px] uppercase tracking-wide text-[#ECE4D3]">
                    {drink.character.split(" ").pop()}
                  </span>
                </span>
                {active && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-inset ring-[#C9A227]/70"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Details for the featured can */}
      <div className="text-area relative z-10 mx-auto max-w-2xl shrink-0 px-2 text-center">
        <div className="text-wrapper">
          <p className="op-title text-3xl md:text-5xl">
            <GradientText colors={["#F5E6B3", "#C9A227", "#E7CF7A"]}>
              {current.name}
            </GradientText>
          </p>
          <p className="mt-1 font-pirate text-lg tracking-[0.2em] text-[#C9A227] md:text-xl">
            {current.character}
          </p>
          <p className="mt-2 text-sm text-[#ECE4D3]/60 md:text-base">
            &ldquo;{current.tagline}&rdquo;
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm font-normal leading-relaxed text-[#ECE4D3]/80 md:text-base">
            {current.flavorNotes}
          </p>
          {/* One Piece bounty — wanted-poster flavour */}
          <div className="mt-3 flex items-center justify-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-md border border-[#B3111C]/40 bg-[#0B0E14]/60 px-3 py-1 shadow-[0_0_18px_rgba(179,17,28,0.25)]">
              <span className="font-display text-[10px] uppercase tracking-[0.35em] text-[#B3111C]">
                Wanted
              </span>
              <span className="font-pirate text-lg leading-none text-[#C9A227]">
                {"฿"}
                {current.bounty.toLocaleString("en-US")}
              </span>
            </span>
            <span className="hidden font-display text-xs uppercase tracking-[0.3em] text-[#C9A227]/70 sm:inline">
              300 Berries · 12-Pack
            </span>
          </div>
        </div>

        <Magnet strength={16} className="mt-5 inline-block">
          <StarBorder as="a" href="#manifest" speed="6s">
            Stow in the Hold
          </StarBorder>
        </Magnet>
      </div>
    </section>
  );
};

export default Carousel;

/**
 * Turntable — spins its children slowly and continuously on the Y axis so the
 * featured can always feels alive. Runs inside the R3F canvas (via `<View>`),
 * so useFrame drives it frame-rate-independently and the ref is always ready.
 * `scale` sets the resting size of the showcased can.
 */
function Turntable({
  children,
  speed = 0.5,
  scale = 1,
}: {
  children: ReactNode;
  speed?: number;
  scale?: number;
}) {
  const ref = useRef<Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * speed;
  });
  return (
    <group ref={ref} scale={scale}>
      {children}
    </group>
  );
}

type ArrowButtonProps = {
  direction?: "right" | "left";
  label: string;
  onClick: () => void;
};

function ArrowButton({ label, onClick, direction = "right" }: ArrowButtonProps) {
  return (
    <button
      onClick={onClick}
      className="z-10 size-12 rounded-full border border-[#C9A227]/40 bg-[#141C2B]/60 p-3 text-[#C9A227] backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:border-[#C9A227] hover:bg-[#141C2B] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227] md:size-16 lg:size-20"
    >
      <ArrowIcon className={clsx(direction === "right" && "-scale-x-100")} />
      <span className="sr-only">{label}</span>
    </button>
  );
}
