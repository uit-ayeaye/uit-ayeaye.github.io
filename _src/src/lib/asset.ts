// ─── Static-export asset helper ────────────────────────────────────────────
// This app is statically exported and hosted under a sub-path (basePath) on
// GitHub Pages — see next.config.mjs. Next's `basePath` automatically prefixes
// framework-managed URLs (_next/*, next/font, next/image, next/link), but it
// does NOT touch raw asset strings we hand to fetch/loaders or drop into CSS:
//
//   • drei loaders  — useGLTF("/x.gltf"), useTexture(...), <Environment files>
//   • plain <img src> and inline `background-image` url()s
//
// Every such raw path must be wrapped in asset() so it resolves under the
// deploy base path. Build with NEXT_PUBLIC_BASE_PATH=/showcase/one-piece; the
// value is inlined at build time so client and server produce identical URLs
// (important — drei caches loaders by their exact URL string).
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Prefix an absolute public path (e.g. "/labels/luffy.webp") with basePath. */
export function asset(path: string): string {
  if (!path.startsWith("/")) return path; // leave relative / remote URLs alone
  return `${BASE}${path}`;
}
