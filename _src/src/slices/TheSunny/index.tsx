"use client";

import { Bounded } from "@/components/Bounded";
import { View } from "@react-three/drei";
import Scene from "./Scene";
import ShinyText from "@/components/reactbits/ShinyText";
import GradientText from "@/components/reactbits/GradientText";
import { asset } from "@/lib/asset";

/**
 * TheSunny — a dedicated "Board the Thousand Sunny" moment. A generated 3D
 * ship model slowly turns on a turntable while the copy frames it like a
 * ship-in-a-bottle centrepiece.
 */
const TheSunny = (): JSX.Element => {
  return (
    <Bounded className="the-sunny op-grain op-seam relative min-h-screen overflow-hidden bg-[#0b1420]">
      {/* New World sky backdrop — dramatic golden-hour clouds, sun & rainbow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${asset("/images/newworld-sky.jpg")}')` }}
      />
      {/* Top scrim so the heading stays legible over the bright sky */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-2/3 bg-gradient-to-b from-black/55 via-black/15 to-transparent" />

      {/* Copy overlay (top) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col items-center gap-3 px-4 pt-16 text-center md:pt-24">
        <p className="op-kicker text-xs text-[#C9A227] md:text-sm">
          <ShinyText text="The Ship of Dreams" speed={6} />
        </p>
        <h2 className="op-title text-4xl uppercase sm:text-5xl md:text-7xl">
          <GradientText colors={["#E7CF7A", "#C9A227", "#B3111C", "#C9A227"]}>
            Board the Thousand Sunny
          </GradientText>
        </h2>
        <p className="max-w-md font-pirate text-base text-[#ECE4D3]/70 md:max-w-xl md:text-xl">
          Sun on the sails, the first crew bobbing alongside — forever chasing
          the horizon.
        </p>
      </div>

      {/* 3D ship */}
      <View className="h-screen w-screen">
        <Scene />
      </View>

      {/* Corner framing marks */}
      <span className="pointer-events-none absolute bottom-6 left-6 z-20 h-10 w-10 border-b border-l border-[#C9A227]/40 md:bottom-10 md:left-10" />
      <span className="pointer-events-none absolute bottom-6 right-6 z-20 h-10 w-10 border-b border-r border-[#C9A227]/40 md:bottom-10 md:right-10" />
    </Bounded>
  );
};

export default TheSunny;
