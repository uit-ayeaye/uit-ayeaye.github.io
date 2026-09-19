# Validation — 19 September 2026

## Portfolio and generated pages

- Static verification passed for 29 pages: homepage, 25 project stories, résumé, showcase gallery, and the changed Jujutsu Kaisen page. Local routes/assets/anchors, heading IDs, image alt attributes, attribution, and SOM BI publication boundaries are checked.
- JavaScript syntax checks and `git diff --check` passed.
- Playwright with installed Chrome passed the portfolio interaction suite: six category filters, multi-word search, reset/empty state, URL persistence, all-project expansion, keyboard search, mobile navigation/Escape, and navigation without resetting filters.
- Night/day themes, Gear 5 color accent, motion pause, and card/list layout persist. All six showcase tabs work with click, arrows, Home, and End; previous/next controls and a CDP-dispatched touch swipe advance the active experience. Each scene includes launch and source links. Ship/wanted artwork switching and the memory disclosure pass. The five-site personal collection supports button and keyboard scrolling; all 33 technology tiles render, their SVG assets decode, and Next.js filters to matching projects. Every project-search tile has a match in the project data; three marked tiles open official documentation instead of an empty result.
- Both themes and both project layouts passed overflow checks at 320, 375, 390, 650, 768, 1024, 1440, and 2560 pixels, including 650×375 landscape. All 25 case studies passed 320px and 390px checks.
- All 25 projects and navigation remain accessible without JavaScript. OS reduced motion takes precedence over decorative animation. Print mode uses black text on white and hides navigation.
- axe-core WCAG 2 A/AA and 2.1 AA: zero violations in twelve sampled states (desktop complete collection, both themes × both layouts, mobile home, SOM BI, résumé, both gallery themes, and desktop/mobile screenshot viewers). Automated sampling is not a full accessibility certification.
- Visually reviewed desktop/mobile ocean and day themes, the simplified hero, cinematic showcase selector, five-site personal portfolio collection, technology icons, and the redesigned gallery. Screenshots are saved locally under the ignored `output/qa/` directory.

## Screenshot previews and pirate / tech refinement

- Browser-framed thumbnails use the full screenshot with no project-number badge obscuring the website navigation. The personal-site collection shares the expandable viewer.
- Native dialog checks pass for image loading, fit/detail mode, contained horizontal scrolling on mobile, Escape, close button, focus restoration, and background scroll unlock.
- Pirata One display type, DM Sans text, and IBM Plex Mono labels are shared across the portfolio, gallery, project stories, résumé screen, and journal. The journal was checked at 390px for overflow.
- Buttons, scene changes, ship artwork, and pointer tilt add restrained spring motion; motion pause and system reduced motion disable decorative animation and tilt. No 3D engine is embedded in the project thumbnails.

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

## Clarity and CV revision — 19 September 2026

- Static build and verifier: 31 pages checked, including all 27 project routes, assets, anchors, preserved credits, and private-project boundaries.
- HTTP smoke check: homepage, résumé, gallery, all 27 case studies, PDF/text downloads, and robots.txt returned 200; generated JSON-LD parsed successfully.
- CUA browser checks: all six category filters; Golden Gates shipping search; STRIKERS search; empty state/reset; six default projects; expansion to 27; personal-collection disclosure and scrolling; toolkit disclosure and Next.js search; Golden Gates screenshot viewer; all six world selectors.
- Layout: 28 combinations across seven widths (320, 390, 650, 768, 1024, 1440, 2560), both themes, and both card/list displays, without page overflow. CV dialog separately checked at all seven widths. Final PDF controls checked again at 320px.
- Keyboard: modal focus containment through 20 Tab presses, Escape, search-shortcut isolation, focus return, mobile navigation, and return to the menu button when its original CV link is hidden. Fixed the focus-cycle and hidden-mobile-opener issues found during this check.
- Progressive enhancement: all 27 projects visible with JavaScript disabled and CV links still pointing to `/resume/`. Reduced-motion emulation disables ship and modal animation.
- Print-media CSS: background page and modal toolbar hidden; portrait/artwork removed; standard Arial résumé text. The embedded browser does not implement automated print-to-PDF, so browser pagination was not certified. The direct PDF download is generated separately from the same content.
- Direct PDF: one A4 page, visually rendered and reviewed with Poppler; extracted with pypdf to confirm contact details, all six selected projects, and reading order. Template checksum prevents publishing an out-of-date PDF after résumé edits.
- JavaScript syntax checks and `git diff --check` passed. No browser console errors/warnings observed. The legacy standalone Playwright/axe suite was updated for the new count/disclosures but not run in this session; checks above used the connected browser.
- These initial clarity checks preceded the visual follow-up and publication below.

## Visual follow-up checks — 19 September 2026

- Local HTTP smoke checks passed for 41 routes/downloads, including all case studies, six scenes, both blog languages, résumé PDF/text, and robots.txt. The generated-page asset/anchor/credit verifier passed for 31 pages.
- Browser inspection covered the new hero and art selector, wanted poster, desktop logbook popup, SOM BI previews, and blog voyage menu. Transparent icon backgrounds were confirmed in computed CSS.
- Every one of the 27 case-study pages was checked at 390px without document overflow. Résumé popup checks at 320, 390, 650, 768, 1024, 1440, and 2560px passed: contained scrolling, visible close controls, and 14px body text.
- Found and fixed two issues during QA: a rotated chart meridian exceeding narrow viewports, and existing scene credits intercepting the Naruto/JJK voyage menu. Pointer opening, Escape dismissal, and retained credits were then verified.
- The six scene smoke checks covered Hledan night/walk/orbit, Elbaf Performance/start, Onigashima Take the Helm, Grand Line Fizz Next Drink, and Naruto/JJK rendering and voyage navigation. These are launch/interaction checks, not complete playthroughs or physical-device certification.
- CV focus remained in the dialog through 20 Tab presses, Escape restored the opener, and reduced-motion emulation disabled the captain float. With JavaScript disabled, all 27 projects and the full-page résumé link remained available.
- Rebuilt application PDF: one A4 page, selectable text, reviewed after Poppler rendering. It deliberately omits decoration and the illustration for straightforward application parsing. No ATS-vendor score or search-ranking guarantee is claimed.
- After the chart fix, all 28 homepage combinations passed (seven widths × two themes × two layouts). The standalone résumé, gallery, and both blog languages also passed at 320, 768, and 1440px. Detailed local browser results are in ignored `output/qa/visual-upgrade-checks.json`.
- First live deployment (`4c812ff`) built successfully. A returning-browser check exposed a cached pre-logbook `/resume/` document. Added content hashes to generated CSS/JS URLs and a content-versioned résumé fetch; the standalone voyage shell is also versioned. The updated popup passed locally before the follow-up publication.
