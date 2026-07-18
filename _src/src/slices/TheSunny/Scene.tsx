"use client";

import { useEffect, useMemo, useRef } from "react";
import { Cloud, Clouds, Environment, useGLTF, useTexture } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Water } from "three/examples/jsm/objects/Water.js";

import FloatingCan from "@/components/FloatingCan";
import type { DrinkKey } from "@/data/drinks";
import { asset } from "@/lib/asset";

useGLTF.preload(asset("/models/sunny.glb"));
useTexture.preload(asset("/textures/waternormals.jpg"));

const SUN_DIRECTION = new THREE.Vector3(0.35, 0.18, -0.5).normalize();
// Resting angle that turns the character label toward the camera.
const CAN_FRONT_Y = -Math.PI * 1.62;

// Module-level scroll progress (~ -0.5 above → 0 centred → +0.5 below). Kept
// out of React context on purpose so the drei <Environment> is never wrapped
// in a provider (which broke its internal portal). <Scene/> updates it.
const scroll = { value: 0 };

// Clamped parallax: a gentle drift while the section is on screen, but the
// ship and the can fleet stay in frame — they never sink out of view no
// matter how far the visitor scrolls past.
function parallax() {
  return THREE.MathUtils.clamp(scroll.value, -0.35, 0.35);
}

/** Small / touch screens get cheaper water + clouds so phones stay smooth. */
function isLite() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(max-width: 768px)").matches ||
    window.matchMedia("(hover: none)").matches
  );
}

/** Reflective, animated ocean (three.js Water) — vivid anime-blue swell. */
function Ocean() {
  const normals = useTexture(asset("/textures/waternormals.jpg"));
  const water = useMemo(() => {
    const lite = isLite();
    normals.wrapS = normals.wrapT = THREE.RepeatWrapping;
    const geom = new THREE.PlaneGeometry(2400, 2400);
    const w = new Water(geom, {
      // Half-size reflection buffer on phones — the single biggest win for
      // mobile frame rate in this scene, and barely visible at phone size.
      textureWidth: lite ? 256 : 512,
      textureHeight: lite ? 256 : 512,
      waterNormals: normals,
      sunDirection: SUN_DIRECTION.clone(),
      sunColor: 0xffd9a3,
      // Saturated royal azure with strong sparkle — the flat, vivid blue
      // the One Piece anime paints its open sea with.
      waterColor: 0x1b74dd,
      distortionScale: 2.4,
      fog: true,
    });
    w.rotation.x = -Math.PI / 2;
    w.position.y = -1.35;
    (w.material as THREE.ShaderMaterial).uniforms.size.value = 3.4;
    return w;
  }, [normals]);
  useFrame((_, delta) => {
    // A touch slower than before — calm, chill New World swell.
    (water.material as THREE.ShaderMaterial).uniforms.time.value += delta * 0.45;
  });
  return <primitive object={water} />;
}

/** Slow-drifting New World weather — soft clouds hanging over the horizon. */
function SkyWeather() {
  const grp = useRef<THREE.Group>(null);
  const lite = useMemo(isLite, []);
  useFrame((state) => {
    if (!grp.current) return;
    // Lazy sideways drift, like weather rolling across the Grand Line.
    grp.current.position.x = Math.sin(state.clock.elapsedTime * 0.03) * 1.6;
  });
  return (
    <group ref={grp}>
      {/* Two lean horizon clouds — the sea-mist layer was cut entirely: it
          hazed over the fleet and cost render time for little payoff. */}
      <Clouds material={THREE.MeshLambertMaterial} limit={lite ? 100 : 160}>
        <Cloud
          seed={7}
          bounds={[7, 1.4, 2]}
          segments={lite ? 8 : 12}
          position={[-6.5, 2.1, -16]}
          color="#f6d7b4"
          opacity={0.34}
          speed={0.12}
        />
        <Cloud
          seed={13}
          bounds={[8, 1.6, 2]}
          segments={lite ? 8 : 12}
          position={[7, 2.9, -19]}
          color="#f3cfae"
          opacity={0.28}
          speed={0.1}
        />
      </Clouds>
    </group>
  );
}

/** The Thousand Sunny, riding the swell with organic buoyancy. */
function Ship() {
  const { scene } = useGLTF(asset("/models/sunny.glb"));
  const grp = useRef<THREE.Group>(null);
  const narrow = useThree((s) => s.viewport.width) < 2.7;

  const maxDim = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    scene.position.sub(center);
    return Math.max(size.x, size.y, size.z) || 1;
  }, [scene]);

  const scale = (narrow ? 2.4 : 3.1) / maxDim;
  const baseX = narrow ? 0 : -1.15;
  const baseY = narrow ? -0.42 : -0.5;
  const baseZ = narrow ? -2.7 : -3.2;

  useFrame((state) => {
    if (!grp.current) return;
    const t = state.clock.elapsedTime;
    const p = parallax();
    // Two-wave bob so the heave feels like water, not a metronome. The
    // parallax only slides the ship a little sideways — never underwater.
    const heave = Math.sin(t * 0.7) * 0.09 + Math.sin(t * 0.31 + 1.7) * 0.04;
    grp.current.position.set(baseX + p * 0.3, baseY + heave, baseZ);
    grp.current.rotation.set(
      Math.sin(t * 0.45 + 1) * 0.035, // pitch
      0.55,
      Math.sin(t * 0.6) * 0.055 + Math.sin(t * 0.23) * 0.02, // roll
    );
  });

  return (
    <group ref={grp} scale={scale}>
      <primitive object={scene} />
    </group>
  );
}

type Drift = {
  flavor: DrinkKey;
  position: [number, number, number];
  scale: number;
  phase: number;
  rim: string;
};

/** A single character can bobbing on the sea, label kept toward the camera. */
function FloatingDrink({
  flavor,
  position,
  scale,
  phase,
  rim,
  designWidth,
}: Drift & { designWidth: number }) {
  const grp = useRef<THREE.Group>(null);
  const vw = useThree((s) => s.viewport.width);
  // Fleet spread is tuned for a reference viewport width; on narrower
  // windows squeeze the x positions in so no can clips offscreen.
  const xFactor = Math.min(1, Math.max(0.6, vw / designWidth));
  useFrame((state) => {
    if (!grp.current) return;
    const t = state.clock.elapsedTime + phase;
    const p = parallax();
    // Buoyant bob + rock; a whisper of clamped parallax drift with scroll so
    // the cans stay big, high and readable the whole way through the section.
    grp.current.position.set(
      position[0] * xFactor - p * 0.25,
      position[1] + Math.sin(t * 0.95) * 0.08 + Math.sin(t * 0.4) * 0.03,
      position[2],
    );
    grp.current.rotation.set(
      Math.sin(t * 0.55 + 1) * 0.08, // pitch
      CAN_FRONT_Y + Math.sin(t * 0.4) * 0.4, // face camera, gentle yaw
      Math.sin(t * 0.7) * 0.12, // roll
    );
  });
  return (
    <group ref={grp} position={position}>
      <FloatingCan
        flavor={flavor}
        floatIntensity={0.35}
        rotationIntensity={0.04}
        scale={scale}
      >
        <pointLight intensity={9} decay={0.85} color={rim} />
      </FloatingCan>
    </group>
  );
}

/** The first crew drifting on the swell — raised high so every label reads. */
function Fleet() {
  const narrow = useThree((s) => s.viewport.width) < 2.7;
  const cans: Drift[] = narrow
    ? [
        { flavor: "luffy", position: [0.4, -0.68, 0.9], scale: 0.42, phase: 0, rim: "#8C0A13" },
        { flavor: "zoro", position: [-0.52, -0.82, 0.3], scale: 0.3, phase: 1.6, rim: "#14471E" },
        { flavor: "chopper", position: [0.02, -0.98, 1.55], scale: 0.26, phase: 3.1, rim: "#7C2650" },
      ]
    : [
        { flavor: "luffy", position: [1.35, -0.7, 1.05], scale: 0.48, phase: 0, rim: "#8C0A13" },
        { flavor: "zoro", position: [-1.75, -0.85, 0.2], scale: 0.38, phase: 1.2, rim: "#14471E" },
        { flavor: "usopp", position: [-1.0, -0.78, 1.4], scale: 0.4, phase: 4.1, rim: "#574318" },
        { flavor: "nami", position: [2.15, -0.88, -0.7], scale: 0.34, phase: 2.4, rim: "#8A4500" },
        { flavor: "sanji", position: [-2.4, -0.95, -1.15], scale: 0.34, phase: 5.2, rim: "#122B47" },
        { flavor: "chopper", position: [0.55, -0.92, 1.7], scale: 0.34, phase: 3.3, rim: "#7C2650" },
      ];
  return (
    <>
      {cans.map((c, i) => (
        <FloatingDrink key={i} {...c} designWidth={narrow ? 1.5 : 4.8} />
      ))}
    </>
  );
}

export default function Scene() {
  const sectionRef = useRef<Element | null>(null);

  useEffect(() => {
    sectionRef.current = document.querySelector(".the-sunny");
  }, []);

  useFrame(() => {
    const el = sectionRef.current;
    if (el && typeof window !== "undefined") {
      const r = el.getBoundingClientRect();
      const center = r.top + r.height / 2;
      scroll.value = (window.innerHeight / 2 - center) / window.innerHeight;
    }
  });

  return (
    <>
      {/* Golden haze that melts the far sea into the sky — pushed further out
          (and slightly less orange) so the vivid anime blue stays dominant. */}
      <fog attach="fog" args={["#c3926b", 11, 48]} />

      <Ocean />
      <SkyWeather />
      <Ship />
      <Fleet />

      {/* Bluer sea-bounce light so the hulls and cans pick up the azure. */}
      <hemisphereLight args={["#ffe4c0", "#0b4f8a", 0.85]} />
      <ambientLight intensity={0.4} color="#ffe9cf" />
      <directionalLight intensity={2.4} color="#ffdca6" position={[7, 3, -9]} />
      {/* Cool counter-light — the "chill" side of New World weather. */}
      <directionalLight intensity={0.7} color="#8fd0ff" position={[-6, 2.5, 6]} />

      {/* Warm HDRI env map so the metal cans + ship stay glossy. */}
      <Environment
        files={asset("/hdr/field.hdr")}
        environmentIntensity={0.85}
      />
    </>
  );
}
