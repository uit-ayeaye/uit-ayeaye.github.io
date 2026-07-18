/** @type {import('next').NextConfig} */

// Static export for GitHub Pages sub-path hosting.
//   NEXT_PUBLIC_BASE_PATH=/showcase/one-piece npm run build  →  out/
// basePath prefixes framework URLs (_next, next/font, next/link); raw asset
// strings are prefixed in-app via src/lib/asset.ts (same env var).
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig = {
  output: "export",
  ...(basePath ? { basePath } : {}),
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
