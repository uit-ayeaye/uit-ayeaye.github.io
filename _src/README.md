# Grand Line Fizz — source

Next.js (static-export) source for the interactive One Piece soda showcase
served at **`/showcase/one-piece/`** on thomasdlynn.dev.
(Next.js + GSAP + React Three Fiber + Lenis. No CMS — all copy is hardcoded.)

> This `_src/` folder is the **editable source**. The **live site** is the
> pre-built static export at `../showcase/one-piece/` in this same repo —
> GitHub Pages serves that folder as-is; it does **not** build this source.

## Develop

```bash
cd _src
npm install
npm run dev          # http://localhost:3000
```

## Build & deploy to the live site

From `_src/`:

```bash
# 1. static export, with the basePath the page is hosted under
NEXT_PUBLIC_BASE_PATH=/showcase/one-piece npm run build

# 2. sync the export over the deployed folder, KEEPING the license files
rsync -a --delete --exclude LICENSE --exclude NOTICE out/ ../showcase/one-piece/

# 3. commit + push from the repo root  ->  live in ~30s
cd .. && git add -A && git commit -m "one-piece: <what changed>" && git push origin main
```

Keep **`.nojekyll`** at the repo root (so `_next/` isn't Jekyll-stripped) and
keep `../showcase/one-piece/LICENSE` + `NOTICE`.

## Where things live

| Path | What |
|---|---|
| `src/app/page.tsx` | section order — Hero → Marquee → SkyDive → Carousel → TheSunny → FlavorGrid |
| `src/app/layout.tsx` | metadata / SEO / Open Graph / JSON-LD / page chrome |
| `src/data/drinks.ts` | the 14 cans (name, tagline, color, bounty) |
| `src/slices/*` | page sections — `TheSunny/` is the 3D ocean scene, `Carousel/` is "Choose Your Nakama" |
| `src/components/*` | `FloatingCan`, `SodaCan`, `ViewCanvas`, `SmoothScroll` (Lenis), … |
| `public/` | `labels/` · `models/sunny.glb` · `hdr/` · `images/` · `textures/` · `fonts/` |

## Attribution

One Piece 3D base model by **Meghamittal0920**
(github.com/Meghamittal0920/One-Piece-3D-Website), Apache-2.0 — see
`../showcase/one-piece/LICENSE` and `NOTICE`. Keep those when deploying.
