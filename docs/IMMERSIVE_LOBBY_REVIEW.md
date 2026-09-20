# Character lobby, complete logbook, and search metadata

September 20, 2026.

## Design findings and changes

The old artwork tabs changed images but did not communicate a playable selection. The hero now has a game-style stage, previous/next controls, a character dossier, selection counter, keyboard commands, and horizontal dragging. Vertical touch scrolling and pinch zoom remain native. Ambient motion and immersion default on; saved choices and operating-system reduced motion take precedence. Idle motion stops outside the viewport and while the page is hidden.

The toolkit combined native disclosure changes, spring effects, and staggered child animations. It now animates one bounded content region, supports reversal during rapid tapping, and cancels cleanly when motion is disabled. Mobile backdrop blurs and competing card-entry effects were removed. Existing illustrated mascots and local technology marks remain, with a contrast adjustment for the Astro icon.

The résumé now contains a personal introduction, six capability areas, six selected projects, the academic project, the remaining 26 project records, working principles, the Hledan tribute, and contact details. Claims come from the existing reviewed portfolio data. It adds chapter navigation, Kalam handwriting, ink highlights, torn edges, and a signature. The same source produces the web page, modal, text résumé, illustrated PDF, and plain PDF. The preferred profile is `github.com/Thiha-Lynn`; source-repository links and creator credits keep their original destinations.

The portfolio uses one generated stylesheet and locally hosted fonts with swap rendering. Small screens play at most one visible preview video, while desktops allow two. Modal, hidden-page, reduced-motion, and offscreen playback gates remain in place.

All 44 public URLs have canonical, description, complete Open Graph/Twitter image metadata, and valid structured data. The Myanmar article is included in the sitemap and has reciprocal language alternatives. A new illustrated social cover replaces the old wanted poster, with project-specific raster covers on individual case studies and worlds. Social networks can retain their own cached previews until they fetch the URL again.

## Verification

- Static route/asset/anchor checks on the 37 portfolio-generated pages; metadata checks on all 44 public routes, plus publication-boundary and creator-credit checks.
- JavaScript syntax checks for the five changed scripts; repeat metadata generation produced identical output.
- Browser layout checks on all 33 case studies at 390px and 1440px; no horizontal overflow. Homepage also checked at 320px; résumé and gallery checked at 390px.
- Character next/previous wraparound, keyboard Home, horizontal drag, single visible selection, caption clearance, default preferences, and persisted immersion toggle.
- Six toolkit disclosures, rapid reversal, all tool icons loaded, mobile menu, résumé popup/Escape, chapter scroll target, no duplicate IDs, and correct download/profile destinations.
- Day/night presentation, OS reduced-motion behavior, active disclosure cleanup, and no-JavaScript content/CV fallback. A cleanup callback error found during reduced-motion testing was fixed and retested; no new error appeared after the fix.
- Both PDFs rendered to images for visual review. The illustrated edition has seven pages; the plain edition has six. Page breaks keep the ledger heading with its opening entry.

These checks use a desktop browser with responsive viewport sizes, not measurements from physical iOS/Android hardware. Existing independent WebGL scene engines are preserved; this pass updates their metadata and shared navigation assets.

## Maintenance

Run `scripts/build_portfolio.py`, then `scripts/build_resume_pdf.py` with ReportLab and BeautifulSoup available, then `scripts/verify_portfolio.py`. Commit source and generated output together. `css/portfolio.css` is generated from the ordered source stylesheets and must not be edited directly. Font licenses live in `images/fonts/`; cover provenance and the exact prompt live in `images/social/README.md`.
