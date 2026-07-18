"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * SiteThunder — an ambient, viewport-wide lightning storm layered over the
 * whole site. It fires on its own at random intervals: a couple of glowing
 * jagged bolts plus a soft colored sky-flash, tinted from the brand palette
 * (mikan gold, storm blue, vest red). Purely decorative — pointer-events are
 * off and it lightens only (mix-blend-screen), so it never blocks the UI.
 * Respects `prefers-reduced-motion`.
 *
 * Mobile: the expensive parts here are the per-bolt `drop-shadow` filters and
 * the full-screen `mix-blend-screen` flash repainting on every strike. On
 * small / touch screens we run a "lite" path — one filter-less bolt, fewer
 * branches, a dimmer flash and a longer gap between strikes — so weaker GPUs
 * don't stutter. Desktop behaviour is unchanged.
 */

// Brand-tinted storm colors (gold / electric blue / vest red)
const TINTS = ["#C9A227", "#1E90B8", "#B3111C"];

/** Small / touch screens get the cheaper strike path. */
function isLiteMode() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(max-width: 768px)").matches ||
    window.matchMedia("(hover: none)").matches
  );
}

/** Mix a hex color toward white so it reads as hot lightning */
function lighten(hex: string, amount: number) {
  const n = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

/**
 * Build a short jagged horizontal crackle arc around (cx, cy) — the red
 * "cracks in the air" look of Conqueror's Haki, rather than a sky bolt.
 */
function makeCrackle(cx: number, cy: number) {
  let x = cx;
  let y = cy;
  let d = `M${x},${y}`;
  const dir = Math.random() < 0.5 ? -1 : 1;
  const segs = 4 + Math.floor(Math.random() * 4);
  for (let i = 0; i < segs; i++) {
    x += dir * (35 + Math.random() * 75);
    y += (Math.random() - 0.5) * 70;
    d += ` L${x},${y}`;
  }
  return d;
}

/** Build a jagged main bolt path + a few branch paths (viewBox 0..1000) */
function makeBolt(startX: number, branchProb = 0.4) {
  const points: [number, number][] = [[startX, -20]];
  let x = startX;
  let y = -20;
  while (y < 980) {
    y += 60 + Math.random() * 110;
    x += (Math.random() - 0.5) * 190;
    points.push([x, Math.min(y, 1000)]);
  }
  const main = "M" + points.map(([px, py]) => `${px},${py}`).join(" L");

  const branches: string[] = [];
  for (let i = 1; i < points.length - 2; i++) {
    if (Math.random() < branchProb) {
      const [bx, by] = points[i];
      const dir = Math.random() < 0.5 ? -1 : 1;
      branches.push(
        `M${bx},${by} L${bx + dir * (60 + Math.random() * 90)},${
          by + 70 + Math.random() * 90
        } L${bx + dir * (110 + Math.random() * 130)},${
          by + 150 + Math.random() * 120
        }`,
      );
    }
  }
  return { main, branches };
}

export default function SiteThunder() {
  const svgRef = useRef<SVGSVGElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    let timer = 0;

    const strike = () => {
      const svg = svgRef.current;
      const flash = flashRef.current;
      if (!svg || !flash) return;

      const lite = isLiteMode();

      // ~1 in 3 strikes is a Conqueror's Haki burst: deep-crimson bolts that
      // KEEP their red (barely lightened), ringed by a dark blood-red halo,
      // plus jagged horizontal crackle arcs — the "cracks in the air" from
      // the anime — instead of another plain white flash.
      const haki = Math.random() < 0.35;

      const tint = haki
        ? "#B3111C"
        : TINTS[Math.floor(Math.random() * TINTS.length)];
      const core = haki ? lighten(tint, 0.28) : lighten(tint, 0.85);
      const glow = haki ? "#6E0A12" : lighten(tint, 0.4);

      svg.innerHTML = "";
      // Lite mode: a single bolt keeps the SVG cheap on mobile GPUs.
      const boltCount = lite ? 1 : 1 + Math.floor(Math.random() * 2); // 1–2 bolts
      const groups: SVGGElement[] = [];

      const mkInto = (
        g: SVGGElement,
        d: string,
        w: number,
        stroke: string,
        op: number,
      ) => {
        const p = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "path",
        );
        p.setAttribute("d", d);
        p.setAttribute("fill", "none");
        p.setAttribute("stroke", stroke);
        p.setAttribute("stroke-width", String(w));
        p.setAttribute("stroke-linecap", "round");
        p.setAttribute("stroke-linejoin", "round");
        p.setAttribute("opacity", String(op));
        g.appendChild(p);
      };

      for (let i = 0; i < boltCount; i++) {
        const startX = 120 + Math.random() * 760;
        const { main, branches } = makeBolt(startX, lite ? 0.15 : 0.4);
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        // drop-shadow filters are the main mobile cost — skip them in lite mode
        // and let the wider glow stroke carry the halo instead.
        g.style.filter = lite
          ? "none"
          : `drop-shadow(0 0 6px ${glow}) drop-shadow(0 0 18px ${glow})`;

        const mk = (d: string, w: number, stroke: string, op: number) =>
          mkInto(g, d, w, stroke, op);

        if (haki) {
          // Dark outline under the red stroke — reads as black-red Haki
          // energy instead of hot white lightning.
          mk(main, 12, "#1A0305", 0.55);
          mk(main, 6, glow, 0.7);
          mk(main, 2.5, core, 0.95);
          branches.forEach((b) => {
            mk(b, 7, "#1A0305", 0.4);
            mk(b, 3.5, glow, 0.55);
            mk(b, 1.3, core, 0.85);
          });
        } else {
          mk(main, 9, glow, 0.5); // outer glow stroke
          mk(main, 3, core, 1); // hot core
          branches.forEach((b) => {
            mk(b, 5, glow, 0.35);
            mk(b, 1.5, core, 0.85);
          });
        }

        svg.appendChild(g);
        groups.push(g);
      }

      // Haki crackle arcs — short horizontal red fractures scattered across
      // the sky. Fewer on lite mode so mobile GPUs stay smooth.
      if (haki) {
        const crackleCount = lite ? 2 : 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < crackleCount; i++) {
          const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
          g.style.filter = lite
            ? "none"
            : `drop-shadow(0 0 8px rgba(179, 17, 28, 0.8))`;
          const d = makeCrackle(
            80 + Math.random() * 700,
            120 + Math.random() * 700,
          );
          mkInto(g, d, 7, "#1A0305", 0.5);
          mkInto(g, d, 3.5, "#8C0A13", 0.85);
          mkInto(g, d, 1.4, lighten("#B3111C", 0.45), 0.9);
          svg.appendChild(g);
          groups.push(g);
        }
      }

      // Flicker each bolt like real lightning (staggered double-strike)
      groups.forEach((g, i) => {
        gsap
          .timeline({ delay: i * 0.08 })
          .fromTo(g, { opacity: 0 }, { opacity: 1, duration: 0.04, ease: "none" })
          .to(g, { opacity: 0.15, duration: 0.05 })
          .to(g, { opacity: 1, duration: 0.04 })
          .to(g, { opacity: 0, duration: 0.35, ease: "power2.in" }, "+=0.08");
      });

      // Soft colored sky flash — kept subtle so text stays readable, and
      // dimmer still in lite mode so the full-screen repaint is cheaper.
      gsap
        .timeline()
        .set(flash, { backgroundColor: core })
        .fromTo(
          flash,
          { opacity: 0 },
          { opacity: lite ? 0.12 : 0.22, duration: 0.05, ease: "none" },
        )
        .to(flash, { opacity: 0.05, duration: 0.06 })
        .to(flash, { opacity: lite ? 0.09 : 0.16, duration: 0.05 })
        .to(flash, { opacity: 0, duration: 0.5, ease: "power2.out" });
    };

    const loop = () => {
      strike();
      // next strike: ambient on desktop (5–12s), rarer on mobile (9–18s)
      const delay = isLiteMode()
        ? 9000 + Math.random() * 9000
        : 5000 + Math.random() * 7000;
      timer = window.setTimeout(loop, delay);
    };

    // first strike shortly after load
    timer = window.setTimeout(loop, 2000 + Math.random() * 2000);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[60]">
      <div ref={flashRef} className="absolute inset-0 opacity-0 mix-blend-screen" />
      <svg
        ref={svgRef}
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      />
    </div>
  );
}
