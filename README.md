# Thomas D. Lynn — Backbenchers Studio

A portfolio of games, commerce, culture, and creative tools, at **[thomasdlynn.dev](https://thomasdlynn.dev)**.

The landing page combines a restrained One Piece identity with a professional portfolio: switchable original ship/wanted artwork, a shared pirate/sans/monospace type system, six cinematic browser experiments, a five-site personal website collection, 27 searchable project stories, visual technology tiles, and a captain’s logbook CV with PDF/text downloads. It retains the End Game Union story, Madric A’s Hledan tribute, and original creator credits.

## Preview

The public site is static. No framework install is required:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Open [localhost:4173](http://localhost:4173).

## Edit content

- `data/projects.json` — reviewed project stories, role, features, technologies, links, preview image, and credits.
- `templates/home.html` — homepage sections and copy.
- `templates/resume.html` — shared résumé content for the page, popup, plain text, and PDF.
- `css/midnight-studio.css` / `js/tactile-voyage.js` — dimmed surfaces, illustrated toolkit cards, shared button feedback, and reversible disclosures.
- `css/logbook-refinement.css` / `css/resume-logbook.css` / `js/resume-logbook.js` — simplified homepage and immersive CV.
- `scripts/build_resume_pdf.py` — one-page PDF generation (ReportLab and BeautifulSoup required).
- `scripts/build_portfolio.py` — static HTML generation for the homepage, showcase gallery, case studies, résumé, and sitemap.
- `css/captains-log.css` / `css/pirate-voyage.css` / `js/captains-log.js` — portfolio layout, pirate themes, and interactions.
- `docs/PROJECT_RESEARCH.md` — research sources, attribution, availability, and content limits.

After editing data or templates:

```sh
python3 scripts/build_portfolio.py
# After changing résumé content, use a Python with reportlab and beautifulsoup4:
python3 scripts/build_resume_pdf.py
python3 scripts/verify_portfolio.py
```

Commit the generated `index.html`, `projects/*/index.html`, `resume/index.html`, `resume/thomas-d-lynn-resume.pdf`, `resume/thomas-d-lynn-resume.txt`, `resume/pdf-source.sha256`, `showcase/index.html`, and `sitemap.xml` together with their source files. GitHub Pages serves them directly; it does not run the generator.

Project thumbnails show complete screenshots in browser frames. Click a thumbnail to open the accessible design viewer, fit the full screenshot or inspect its details, then visit the case study or website. Without JavaScript, thumbnail links open the original image.

The homepage retains all projects in HTML for no-JavaScript access. JavaScript adds category filters, multi-word search, URL state, an expandable collection, night-ocean/day-logbook themes, a Gear 5 color accent, card/list layouts, a showcase selector with thumbnails, arrow controls, keyboard navigation and touch swiping, a scrollable personal website collection, technology-to-project search (with marked documentation links when no matching project is listed), motion preferences, and mobile navigation. Motion respects the operating system’s reduced-motion setting. No analytics, autoplay audio, or live third-party embeds are added.

## Browser verification

The browser test requires Playwright and Chrome. Optionally provide axe-core for accessibility checks:

```sh
# With a preview already running:
PLAYWRIGHT_MODULE=/path/to/playwright \
AXE_SOURCE=/path/to/axe-core/axe.min.js \
node scripts/test_portfolio.cjs
```

Tests cover all six categories, search/reset, URL state, keyboard behavior, mobile navigation, saved preferences, showcase tabs/source links, no-JS access, reduced motion, case-study routes, and both themes/layouts at widths from 320 to 2560 pixels. `scripts/test_showcases.cjs` separately smoke-tests all six scene launches and selected desktop/touch interactions. `verify_portfolio.py` checks local links/assets/anchors and SOM BI’s publication boundaries.

Technology marks are served locally from Devicon; the pinned revision, license, and attribution are in `images/tech/README.md` and `images/tech/LICENSE-DEVICON.txt`. Other technology symbols and the six toolkit mascots are original SVG illustrations.

## Existing experiences

The showcase gallery shares the portfolio design. The existing blog and six individual showcase experiences retain their own styles and scripts. `_src/` is the separate Next.js/React Three Fiber source for Grand Line Fizz; see [_src/README.md](_src/README.md) for its build process.

GitHub Pages publishes the root of `main` to `thomasdlynn.dev`. EXTANT is a separate GitHub Pages project (`uit-ayeaye/extant-band`) and is linked without importing or replacing it.

Preserve `CNAME`, `.nojekyll`, and all original showcase license/notice files. Hledan’s original map is credited to **Madric A**; the adapted Naruto, Jujutsu Kaisen, and Grand Line Fizz showcases preserve their **Meghamittal0920** credits.

SOM BI is described as an internal academic project. Its live service, university data, staff identifiers, and private screenshots must not be added to the public portfolio.

The first six projects form the default selection. Full personal-site and capability collections expand with native disclosures. CV links open an accessible modal, with `/resume/` as their no-JavaScript fallback. See `docs/DESIGN_REVIEW.md` for design rationale and generated-art provenance.

### Visual asset maintenance

`python3 scripts/build_portfolio.py` also reapplies the isolated voyage menu to the six standalone scene entry pages and both blog articles. Run it again after rebuilding any scene so its generated HTML retains the shared navigation. The original scene credits and engines are preserved.

SOM BI’s three previews are interface recreations using sample data. To regenerate: run `python3 scripts/build_som_previews.py`, then `node scripts/render_som_previews.cjs` (requires `sharp`), followed by the portfolio build. Keep the sample-data labeling in every export.
