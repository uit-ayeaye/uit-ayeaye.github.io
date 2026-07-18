"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import {
  Center,
  Environment,
  OrbitControls,
  useProgress,
} from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import clsx from "clsx";
import gsap from "gsap";

import { SodaCan } from "@/components/SodaCan";
import type { Drink } from "@/data/drinks";
import { asset } from "@/lib/asset";

// Same resting angle the carousel uses so the character art greets you.
const FRONT_Y = -(Math.PI * 1.62);

// Exit animation length — keep in sync with .op-fade-out / .op-zoom-out.
const CLOSE_MS = 220;

// Camera distances for the Close-up toggle.
const DIST_NORMAL = 3.4;
const DIST_CLOSE = 2.45;

/**
 * CanFullView — an immersive product-viewer modal for one can. Runs its own
 * small canvas (the site-wide canvas sits at z-30, below modal chrome) with
 * OrbitControls, so it "just works" on every input: one finger / mouse drag
 * to rotate, pinch or scroll to zoom, plus a one-tap Close-up that glides
 * the camera in on the label. Escape, ✕ or the backdrop closes it.
 */
export default function CanFullView({
  drink,
  onClose,
}: {
  drink: Drink;
  onClose: () => void;
}) {
  const [closing, setClosing] = useState(false);
  const [closeUp, setCloseUp] = useState(false);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  // Small themed spinner while the can's model/textures stream in (only
  // really visible on a cold first open — everything is cached after).
  const { active: loading } = useProgress();

  function close() {
    if (closing) return;
    setClosing(true);
    window.setTimeout(onClose, CLOSE_MS);
  }

  // Glide the camera in/out and recenter on the label — a smooth, guided
  // alternative to pinching for visitors who just want the hero shot.
  function toggleCloseUp() {
    const controls = controlsRef.current;
    if (!controls) return;
    const dist = closeUp ? DIST_NORMAL : DIST_CLOSE;
    gsap.to(controls.object.position, {
      x: 0,
      y: 0,
      z: dist,
      duration: 0.9,
      ease: "power3.inOut",
      onUpdate: () => controls.update(),
    });
    setCloseUp(!closeUp);
  }

  // Lock page scroll behind the modal; Escape closes.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Move focus into the dialog so keyboard / AT users aren't left on the
    // trigger button hidden behind the modal.
    closeBtnRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={clsx(
        "fixed inset-0 z-[95] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm",
        closing ? "op-fade-out" : "op-fade",
      )}
      role="dialog"
      aria-modal="true"
      aria-label={`${drink.character} — ${drink.name} full view`}
      onClick={close}
      onWheel={(e) => e.stopPropagation()}
    >
      <button
        ref={closeBtnRef}
        type="button"
        onClick={close}
        aria-label="Close full view"
        className="absolute right-4 top-4 z-10 flex size-10 items-center justify-center rounded-full border border-[#C9A227]/40 bg-black/50 text-[#ECE4D3] backdrop-blur-sm transition hover:bg-black/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227]"
      >
        ✕
      </button>

      <div
        className={clsx(
          "flex max-h-full min-h-0 w-full max-w-3xl flex-col items-center justify-center gap-2 overflow-hidden md:gap-3",
          closing ? "op-zoom-out" : "op-zoom-pop",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* svh (small viewport height) sizes the stage against the VISIBLE
            area even with the mobile URL bar expanded, so canvas + text never
            overflow and items-center/justify-center truly centers it. Desktop
            keeps 60vh unchanged. */}
        <div className="relative h-[46svh] w-full md:h-[60vh]">
          {/* Character-tinted stage glow — fills the dark void around the
              can so the viewer reads as a lit studio, not empty space. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(circle at 50% 48%, ${drink.color}59, transparent 62%)`,
            }}
          />
          {loading && (
            <div className="absolute inset-0 z-10 grid place-items-center">
              <div className="flex flex-col items-center gap-3">
                <span className="size-8 animate-spin rounded-full border-2 border-[#C9A227]/25 border-t-[#C9A227]" />
                <span className="font-display text-[10px] uppercase tracking-[0.3em] text-[#C9A227]/70">
                  Pouring…
                </span>
              </div>
            </div>
          )}
          <Canvas
            dpr={[1, 2]}
            camera={{ fov: 30, position: [0, 0, DIST_NORMAL] }}
            gl={{ antialias: true }}
          >
            <Suspense fallback={null}>
              <Center>
                <group rotation={[0, FRONT_Y, 0]}>
                  <SodaCan flavor={drink.key} />
                </group>
              </Center>
              {/* Same studio rig as the carousel: character-tinted glow,
                  cool ambient, warm HDRI. */}
              <pointLight
                intensity={30}
                decay={0.6}
                color={drink.color}
                position={[0, 0.5, -1.6]}
              />
              <ambientLight intensity={2} color="#9DDEFA" />
              <Environment
                files={asset("/hdr/field.hdr")}
                environmentIntensity={1.5}
              />
            </Suspense>
            <OrbitControls
              ref={controlsRef}
              enablePan={false}
              minDistance={2.2}
              maxDistance={5.5}
              autoRotate={!closeUp}
              autoRotateSpeed={1.1}
            />
          </Canvas>
        </div>

        <div className="text-center">
          <p className="font-pirate text-sm tracking-[0.22em] text-[#C9A227]">
            {drink.character}
          </p>
          <p className="op-title text-2xl text-[#ECE4D3] md:text-3xl">
            {drink.name}
          </p>
          <div className="mt-1 flex items-center justify-center gap-2">
            <span className="font-display text-[10px] uppercase tracking-[0.35em] text-[#B3111C]">
              Wanted
            </span>
            <span className="font-pirate text-lg leading-none text-[#C9A227]">
              {"฿"}
              {drink.bounty.toLocaleString("en-US")}
            </span>
          </div>

          {/* Guided camera: one tap zooms to the label, tap again steps back */}
          <button
            type="button"
            onClick={toggleCloseUp}
            className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-full border border-[#C9A227]/45 bg-[#0B0E14]/70 px-5 py-2 font-display text-[11px] uppercase tracking-[0.25em] text-[#C9A227] backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-[#C9A227] hover:bg-[#0B0E14] hover:shadow-[0_0_24px_rgba(201,162,39,0.35)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227] md:text-xs"
          >
            {closeUp ? "⊖ Step Back" : "⊕ Close-Up"}
          </button>

          <p className="mt-2 text-[11px] uppercase tracking-[0.3em] text-[#ECE4D3]/70">
            Drag to rotate · pinch or scroll to zoom
          </p>
        </div>
      </div>
    </div>
  );
}
