"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * SmoothScroll — momentum / velocity smooth scrolling (Lenis) wired into GSAP
 * ScrollTrigger so the pinned 3D sections and scrubbed timelines stay in sync
 * with the eased scroll position.
 *
 * Desktop gets the smooth "weighted" wheel feel; touch devices keep native
 * scrolling (syncTouch off) so mobile stays reliable and never fights the
 * pinned sections. Reduced-motion users get plain native scrolling.
 */
export default function SmoothScroll() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      lerp: 0.11,
      wheelMultiplier: 1,
      smoothWheel: true,
      syncTouch: false,
    });

    // Keep ScrollTrigger in lockstep with Lenis' eased scroll position.
    lenis.on("scroll", ScrollTrigger.update);

    const onRaf = (time: number) => {
      lenis.raf(time * 1000); // gsap ticker time is seconds; Lenis wants ms
    };
    gsap.ticker.add(onRaf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(onRaf);
      lenis.destroy();
    };
  }, []);

  return null;
}
