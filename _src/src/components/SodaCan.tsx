"use client";

import { useGLTF, useTexture } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

import { asset } from "@/lib/asset";

useGLTF.preload(asset("/Soda-can.gltf"));

// One Piece character can labels — WebP art, 1086 x 583 px (wraps the can).
// Paths go through asset() so they resolve under the static-export basePath.
const flavorTextures = {
  luffy: asset("/labels/luffy.webp"),
  zoro: asset("/labels/zoro.webp"),
  nami: asset("/labels/nami.webp"),
  sanji: asset("/labels/sanji.webp"),
  chopper: asset("/labels/chopper.webp"),
  ace: asset("/labels/ace.webp"),
  usopp: asset("/labels/usopp.webp"),
  robin: asset("/labels/robin.webp"),
  franky: asset("/labels/franky.webp"),
  brook: asset("/labels/brook.webp"),
  jinbe: asset("/labels/jinbe.webp"),
  sabo: asset("/labels/sabo.webp"),
  law: asset("/labels/law.webp"),
  shanks: asset("/labels/shanks.webp"),
};

// Warm the label cache as soon as the bundle loads, so flavor swaps and the
// Full View modal never pop in with an untextured can.
useTexture.preload(Object.values(flavorTextures));

// ─── Front-facing adjustment ────────────────────────────────────────────
// The label image wraps the full 360° of the can. This value slides that
// wrap left/right so you can choose exactly which part of the image faces
// the camera by default (the carousel, hero, etc. all use this rotation).
//
// Range 0–1 (it wraps around, so 1 === 0). If your character's face is on
// the side or back of the can, nudge this number — try 0, 0.25, 0.5, 0.75
// and refresh, then fine-tune from there until the face is dead center.
const LABEL_FRONT_OFFSET = 0.5;

const metalMaterial = new THREE.MeshStandardMaterial({
  roughness: 0.3,
  metalness: 1,
  color: "#bbbbbb",
});

export type SodaCanProps = {
  flavor?: keyof typeof flavorTextures;
  scale?: number;
};

export function SodaCan({
  flavor = "luffy",
  scale = 2,
  ...props
}: SodaCanProps) {
  const { nodes } = useGLTF(asset("/Soda-can.gltf"));
  const maxAnisotropy = useThree((s) =>
    s.gl.capabilities.getMaxAnisotropy(),
  );

  const labels = useTexture(flavorTextures);

  Object.values(labels).forEach((texture) => {
    // One-time texture setup (guarded so we never re-upload every frame):
    // sRGB keeps the label art as saturated as the source webp files, and
    // anisotropic filtering keeps the print crisp at glancing angles.
    if (texture.colorSpace !== THREE.SRGBColorSpace) {
      texture.colorSpace = THREE.SRGBColorSpace;
      // Fixes upside down labels
      texture.flipY = false;
      // Lets us rotate the label around the can via offset (below)
      texture.wrapS = THREE.RepeatWrapping;
      texture.anisotropy = Math.min(8, maxAnisotropy || 1);
      texture.needsUpdate = true;
    }
    texture.offset.x = LABEL_FRONT_OFFSET;
  });

  const label = labels[flavor];

  return (
    <group {...props} dispose={null} scale={scale} rotation={[0, -Math.PI, 0]}>
      <mesh
        castShadow
        receiveShadow
        geometry={(nodes.cylinder as THREE.Mesh).geometry}
        material={metalMaterial}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={(nodes.cylinder_1 as THREE.Mesh).geometry}
      >
        <meshStandardMaterial roughness={0.15} metalness={0.7} map={label} />
      </mesh>
      <mesh
        castShadow
        receiveShadow
        geometry={(nodes.Tab as THREE.Mesh).geometry}
        material={metalMaterial}
      />
    </group>
  );
}
