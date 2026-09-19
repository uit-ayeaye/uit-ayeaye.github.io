# Thomas D. Lynn — Backbenchers Studio

A captain’s log of games, commerce, culture, and creative tools, at **[thomasdlynn.dev](https://thomasdlynn.dev)**.

The landing page brings back the original One Piece wanted poster, Backbenchers ship, Gear 5 artwork, and cyber Jolly Roger alongside a featured End Game Union story, 25 searchable project entries, a tribute to Madric A’s Hledan map, engineering capabilities, and a printable project-based résumé.

## Preview

The public site is static. No framework install is required:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Open [localhost:4173](http://localhost:4173).

## Edit content

- `data/projects.json` — reviewed project stories, role, features, technologies, links, preview image, and credits.
- `templates/home.html` — homepage sections and copy.
- `scripts/build_portfolio.py` — static HTML generation for the homepage, case studies, résumé, and sitemap.
- `css/captains-log.css` / `css/pirate-voyage.css` / `js/captains-log.js` — portfolio layout, pirate themes, and interactions.
- `docs/PROJECT_RESEARCH.md` — research sources, attribution, availability, and content limits.

After editing data or templates:

```sh
python3 scripts/build_portfolio.py
python3 scripts/verify_portfolio.py
```

Commit the generated `index.html`, `projects/*/index.html`, `resume/index.html`, and `sitemap.xml` together with their source files. GitHub Pages serves them directly; it does not run the generator.

The homepage retains all projects in HTML for no-JavaScript access. JavaScript adds category filters, multi-word search, URL state, an expandable collection, night-ocean/day-logbook themes, Gear 5 atmosphere, poster/manifest layouts, a six-world showcase selector, motion preferences, and mobile navigation. Motion respects the operating system’s reduced-motion setting. No analytics, autoplay audio, or live third-party embeds are added.

## Browser verification

The browser test requires Playwright and Chrome. Optionally provide axe-core for accessibility checks:

```sh
# With a preview already running:
PLAYWRIGHT_MODULE=/path/to/playwright \
AXE_SOURCE=/path/to/axe-core/axe.min.js \
node scripts/test_portfolio.cjs
```

Tests cover all six categories, search/reset, URL state, keyboard behavior, mobile navigation, saved preferences, showcase tabs/source links, no-JS access, reduced motion, case-study routes, and both themes/layouts at widths from 320 to 2560 pixels. `scripts/test_showcases.cjs` separately smoke-tests all six scene launches and selected desktop/touch interactions. `verify_portfolio.py` checks local links/assets/anchors and SOM BI’s publication boundaries.

## Existing experiences

The existing blog and six showcase routes retain their own styles and scripts. `_src/` is the separate Next.js/React Three Fiber source for Grand Line Fizz; see [_src/README.md](_src/README.md) for its build process.

GitHub Pages publishes the root of `main` to `thomasdlynn.dev`. EXTANT is a separate GitHub Pages project (`uit-ayeaye/extant-band`) and is linked without importing or replacing it.

Preserve `CNAME`, `.nojekyll`, and all original showcase license/notice files. Hledan’s original map is credited to **Madric A**; the adapted Naruto, Jujutsu Kaisen, and Grand Line Fizz showcases preserve their **Meghamittal0920** credits.

SOM BI is described as an internal academic project. Its live service, university data, staff identifiers, and private screenshots must not be added to the public portfolio.
