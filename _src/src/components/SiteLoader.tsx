"use client";

import { useEffect, useState } from "react";
import { useProgress } from "@react-three/drei";
import clsx from "clsx";

import { StrawHatMark } from "@/components/StrawHatMark";

/**
 * SiteLoader — a One Piece-styled boot screen for the 3D assets. Tracks the
 * global THREE loading manager (models, labels, HDRIs, water normals) and
 * shows the emblem + a gold progress bar until everything hits 100%, then
 * fades away and unmounts for good. Later lazy loads never re-summon it.
 */
export default function SiteLoader() {
  const { progress } = useProgress();
  const [done, setDone] = useState(false);
  // Latch on the FIRST time progress reaches 100%. We deliberately ignore
  // drei's `active` flag: the site now runs two canvases (the shared one and
  // the carousel's own in-flow canvas), and `active` can flicker back true as
  // the second canvas warms its cached assets — which would keep the straw-hat
  // boot logo on screen. `progress >= 100` means every queued asset is in, and
  // the `finished` latch guarantees the logo is removed for good afterwards.
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (progress >= 100) setFinished(true);
  }, [progress]);

  // Fade out once finished, then unmount so it can never reappear.
  useEffect(() => {
    if (!finished) return;
    const t = window.setTimeout(() => setDone(true), 550);
    return () => window.clearTimeout(t);
  }, [finished]);

  // Hard safety net: never let the boot logo linger past 10s even if a loader
  // stalls or a texture request hangs.
  useEffect(() => {
    const hard = window.setTimeout(() => setFinished(true), 10000);
    return () => window.clearTimeout(hard);
  }, []);

  if (done) return null;

  return (
    <div
      aria-hidden={finished}
      className={clsx(
        "fixed inset-0 z-[99] grid place-items-center bg-[#0B0E14] transition-opacity duration-500",
        finished ? "pointer-events-none opacity-0" : "opacity-100",
      )}
    >
      <div className="flex flex-col items-center gap-5 px-6 text-center">
        <StrawHatMark className="h-20 w-20 animate-pulse md:h-24 md:w-24" />
        <p className="op-kicker text-xs text-[#C9A227] md:text-sm">
          Setting Sail
        </p>
        {/* Gold progress bar */}
        <div className="h-1 w-56 overflow-hidden rounded-full bg-[#ECE4D3]/10 md:w-72">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#C9A227] to-[#E7CF7A] transition-[width] duration-300 ease-out"
            style={{ width: `${Math.max(4, Math.round(progress))}%` }}
          />
        </div>
        <p className="font-display text-xs tracking-[0.3em] text-[#ECE4D3]/50">
          {Math.round(progress)}%
        </p>
      </div>
    </div>
  );
}
