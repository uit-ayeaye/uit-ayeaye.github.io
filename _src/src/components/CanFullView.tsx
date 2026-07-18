"use client";

import { Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Center, Environment, OrbitControls } from "@react-three/drei";

import { SodaCan } from "@/components/SodaCan";
import type { Drink } from "@/data/drinks";
import { asset } from "@/lib/asset";

// Same resting angle the carousel uses so the character art greets you.
const FRONT_Y = -(Math.PI * 1.62);

/**
 * CanFullView — an immersive product-viewer modal for one can. Runs its own
 * small canvas (the site-wide canvas sits at z-30, below modal chrome) with
 * OrbitControls, so it "just works" on every input: one finger / mouse drag
 * to rotate, pinch or scroll to zoom. Escape, ✕ or the backdrop closes it.
 */
export default function CanFullView({
  drink,
  onClose,
}: {
  drink: Drink;
  onClose: () => void;
}) {
  // Lock page scroll behind the modal; Escape closes.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`${drink.character} — ${drink.name} full view`}
      onClick={onClose}
      onWheel={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close full view"
        className="absolute right-4 top-4 z-10 flex size-10 items-center justify-center rounded-full border border-[#C9A227]/40 bg-black/50 text-[#ECE4D3] backdrop-blur-sm transition hover:bg-black/70"
      >
        ✕
      </button>

      <div
        className="flex w-full max-w-2xl flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-[56vh] w-full md:h-[64vh]">
          <Canvas
            dpr={[1, 2]}
            camera={{ fov: 30, position: [0, 0, 3.6] }}
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
              enablePan={false}
              minDistance={2.3}
              maxDistance={5.5}
              autoRotate
              autoRotateSpeed={1.1}
            />
          </Canvas>
        </div>

        <div className="pointer-events-none -mt-2 text-center">
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
          <p className="mt-2 text-[11px] uppercase tracking-[0.3em] text-[#ECE4D3]/40">
            Drag to rotate · pinch or scroll to zoom
          </p>
        </div>
      </div>
    </div>
  );
}
