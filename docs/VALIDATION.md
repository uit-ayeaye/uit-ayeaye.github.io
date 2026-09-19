# Validation — 19 September 2026

## Portfolio and generated pages

- Static verification passed for 29 pages: homepage, 25 project stories, résumé, showcase gallery, and the changed Jujutsu Kaisen page. Local routes/assets/anchors, heading IDs, image alt attributes, attribution, and SOM BI publication boundaries are checked.
- JavaScript syntax checks and `git diff --check` passed.
- Playwright with installed Chrome passed the portfolio interaction suite: six category filters, multi-word search, reset/empty state, URL persistence, all-project expansion, keyboard search, mobile navigation/Escape, and navigation without resetting filters.
- Night/day themes, Gear 5 color accent, motion pause, and card/list layout persist. All six showcase tabs work with click, arrows, Home, and End; previous/next controls and a CDP-dispatched touch swipe advance the active experience. Each scene includes launch and source links. Ship/wanted artwork switching and the memory disclosure pass. The five-site personal collection supports button and keyboard scrolling; all 33 technology tiles render, their SVG assets decode, and Next.js filters to matching projects. Every project-search tile has a match in the project data; three marked tiles open official documentation instead of an empty result.
- Both themes and both project layouts passed overflow checks at 320, 375, 390, 650, 768, 1024, 1440, and 2560 pixels, including 650×375 landscape. All 25 case studies passed 320px and 390px checks.
- All 25 projects and navigation remain accessible without JavaScript. OS reduced motion takes precedence over decorative animation. Print mode uses black text on white and hides navigation.
- axe-core WCAG 2 A/AA and 2.1 AA: zero violations in ten sampled states (desktop complete collection, both themes × both layouts, mobile home, SOM BI, résumé, and both gallery themes). Automated sampling is not a full accessibility certification.
- Visually reviewed desktop/mobile ocean and day themes, the simplified hero, cinematic showcase selector, five-site personal portfolio collection, technology icons, and the redesigned gallery. Screenshots are saved locally under the ignored `output/qa/` directory.

## Preserved interactive worlds

`scripts/test_showcases.cjs` uses Chrome with software WebGL for repeatable launch checks, at 1280×800 desktop and 390×844 emulated touch.

- Hledan: canvas, night weather, Walk, return to Orbit, reset.
- Elbaf: canvas, Performance option, Begin the Descent.
- Onigashima: canvas, Take the Helm.
- Grand Line Fizz: canvases and Next Drink.
- Naruto and Jujutsu Kaisen: scene canvases, scroll timeline, return link.

All twelve scene checks passed without uncaught JavaScript errors or HTTP resource failures. The gallery additionally checks nine GitHub source links, mobile menu/Escape, and five layout widths. The gallery now uses the shared portfolio header and theme controls, with six visual entries and preserved source links. The earlier JJK title-image fix remains in place.

These are browser launch and interaction smoke checks, not full game playthroughs, performance benchmarks, or testing on physical iOS/Android devices. The portfolio does not preload the 3D engines. Live validation additionally found an optional-model availability check requesting the bare `models/` directory; an empty filename now resolves to unavailable without a network request in both mirrored Onigashima bundles. This is a small guard in the deployed bundles, not a scene redesign.

## Publishing

GitHub Pages serves the root of `main` on `thomasdlynn.dev`. Run the same suites with `PORTFOLIO_URL=https://thomasdlynn.dev` after a successful Pages build to verify deployment. EXTANT is served from its separate GitHub Pages repository; it is not replaced by the portfolio deployment. SOM BI remains a public description only, with no internal deployment or university data published.
