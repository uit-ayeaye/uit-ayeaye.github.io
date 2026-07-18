"use client";

import { useEffect, useMemo, useRef } from "react";
import { Environment, useGLTF, useTexture } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Water } from "three/examples/jsm/objects/Water.js";

import FloatingCan from "@/components/FloatingCan";
import type { DrinkKey } from "@/data/drinks";
import { asset } from "@/lib/asset";

useGLTF.preload(asset("/models/sunny.glb"));

const SUN_DIRECTION = new THREE.Vector3(0.35, 0.18, -0.5).normalize();
// Resting angle that turns the character label toward the camera.
const CAN_FRONT_Y = -Math.PI * 1.62;

// Module-level scroll progress (~ -0.5 above → 0 centred → +0.5 below). Kept
// out of React context on purpose so the drei <Environment> is never wrapped
// in a provider (which broke its internal portal). <Scene/> updates it.
const scroll = { value: 0 };

/** Reflective, animated ocean (three.js Water). */
function Ocean() {
  const normals = useTexture(asset("/textures/waternormals.jpg"));
  const water = useMemo(() => {
    normals.wrapS = normals.wrapT = THREE.RepeatWrapping;
    const geom = new THREE.PlaneGeometry(2400, 2400);
    const w = new Water(geom, {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: normals,
      sunDirection: SUN_DIRECTION.clone(),
      sunColor: 0xffe1b0,
      waterColor: 0x184e6b,
      distortionScale: 2.6,
      fog: true,
    });
    w.rotation.x = -Math.PI / 2;
    w.position.y = -1.35;
    (w.material as THREE.ShaderMaterial).uniforms.size.value = 2.6;
    return w;
  }, [normals]);
  useFrame((_, delta) => {
    (water.material as THREE.ShaderMaterial).uniforms.time.value += delta * 0.6;
  });
  return <primitive object={water} />;
}

/** The Thousand Sunny, riding the swell with organic buoyancy + scroll parallax. */
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
    const p = scroll.value;
    // Two-wave bob so the heave feels like water, not a metronome.
    const heave = Math.sin(t * 0.7) * 0.09 + Math.sin(t * 0.31 + 1.7) * 0.04;
    grp.current.position.set(baseX + p * 0.5, baseY + heave - p * 0.45, baseZ);
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
function FloatingDrink({ flavor, position, scale, phase, rim }: Drift) {
  const grp = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!grp.current) return;
    const t = state.clock.elapsedTime + phase;
    const p = scroll.value;
    // Buoyant bob + rock; parallax drift with scroll.
    grp.current.position.set(
      position[0] - p * 0.5,
      position[1] + Math.sin(t * 0.95) * 0.09 + Math.sin(t * 0.4) * 0.03,
      position[2],
    );
    grp.current.rotation.set(
      Math.sin(t * 0.55 + 1) * 0.09, // pitch
      CAN_FRONT_Y + Math.sin(t * 0.4) * 0.5, // face camera, gentle yaw
      Math.sin(t * 0.7) * 0.14, // roll
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

/** The featured Gum-Gum can up front + a little fleet drifting on the swell. */
function Fleet() {
  const narrow = useThree((s) => s.viewport.width) < 2.7;
  const cans: Drift[] = narrow
    ? [
        { flavor: "luffy", position: [0.4, -1.0, 0.7], scale: 0.4, phase: 0, rim: "#8C0A13" },
        { flavor: "zoro", position: [-0.62, -1.15, 0.15], scale: 0.28, phase: 1.6, rim: "#14471E" },
      ]
    : [
        { flavor: "luffy", position: [1.5, -0.95, 0.9], scale: 0.42, phase: 0, rim: "#8C0A13" },
        { flavor: "zoro", position: [-2.25, -1.12, -0.2], scale: 0.34, phase: 1.2, rim: "#14471E" },
        { flavor: "nami", position: [2.5, -1.15, -1.2], scale: 0.3, phase: 2.4, rim: "#8A4500" },
        { flavor: "chopper", position: [-1.05, -1.2, 1.55], scale: 0.32, phase: 3.3, rim: "#7C2650" },
      ];
  return (
    <>
      {cans.map((c, i) => (
        <FloatingDrink key={i} {...c} />
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
      {/* Golden haze that melts the far sea into the sky at the horizon. */}
      <fog attach="fog" args={["#c58a5b", 8, 32]} />

      <Ocean />
      <Ship />
      <Fleet />

      <hemisphereLight args={["#ffe4c0", "#123a52", 0.8]} />
      <ambientLight intensity={0.4} color="#ffe9cf" />
      <directionalLight intensity={2.4} color="#ffdca6" position={[7, 3, -9]} />

      {/* Warm HDRI env map so the metal cans + ship stay glossy. */}
      <Environment
        files={asset("/hdr/field.hdr")}
        environmentIntensity={0.85}
      />
    </>
  );
}
