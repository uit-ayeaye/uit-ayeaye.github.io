# Character lobby, complete logbook, and search metadata

September 20, 2026.

## Design findings and changes

The old artwork tabs changed images but did not communicate a playable selection. The hero now has a game-style stage, previous/next controls, a character dossier, selection counter, keyboard commands, and horizontal dragging. Vertical touch scrolling and pinch zoom remain native. Ambient motion and immersion default on; saved immersion choices and operating-system reduced motion take precedence. Idle motion stops outside the viewport and while the page is hidden.

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
- Both PDFs rendered to images for visual review. The illustrated edition has eight pages; the plain edition has six. Page breaks keep the ledger heading with its opening entry.

These checks use a desktop browser with responsive viewport sizes, not measurements from physical iOS/Android hardware. Existing independent WebGL scene engines are preserved; this pass updates their metadata and shared navigation assets.

## Maintenance

Run `scripts/build_portfolio.py`, then `scripts/build_resume_pdf.py` with ReportLab and BeautifulSoup available, then `scripts/verify_portfolio.py`. Commit source and generated output together. `css/portfolio.css` is generated from the ordered source stylesheets and must not be edited directly. Font licenses live in `images/fonts/`; cover provenance and the exact prompt live in `images/social/README.md`.

## Reading-comfort follow-up

The user requested clearer résumé text after reviewing the handwritten edition. Body paragraphs and skill lists now use DM Sans at 18px on desktop and 17px on phones, with 1.78 line height, dark ink, and no text shadow. The page is bounded to 840px with generous internal margins. Capability labels occupy their own line with subtle row separators. A translucent cream wash quiets the parchment creases beneath the text. Blackletter headings, the captain portrait, seal, torn edges, handwritten alias, and signature retain the creative identity. The illustrated PDF now uses clear sans-serif body type over a matching cream reading surface; the plain PDF remains available. Both page and popup were checked at phone and desktop sizes, including 320px without horizontal overflow.

## Shared scroll and map surfaces

The CV and project dialogs open with a short envelope/scroll reveal, parchment toolbars, and wax-seal close controls. Toolkit, collection, memory, source-credit, and project-context disclosures unroll a torn-paper insert with interruptible height animation. Mobile navigation and the voyage charts on all six worlds and both articles share the paper treatment. Dark ink and a quiet cream reading area preserve contrast; tool icons retain dark frames. OS reduced motion and the current page’s pause control suppress these new effects. Motion defaults on at every page load, including when an older saved pause preference exists.

Verified open/Escape behavior on all eight standalone voyage menus, the article mobile menu, six toolkit disclosures, nested project context and next-project reset, the CV dialog at 320px, and desktop presentation. Native world engines retain their own controls and visual identity.

## Layout and header follow-up

Removed a 390px breakpoint that made list mode identical to cards. The mobile manifest now uses 68–84px thumbnails beside readable text; grid mode retains full-width covers. Desktop keeps three-column cards versus horizontal list rows. Switching gives a short fade, with reduced motion respected. The Chart control opens the shared parchment navigation at every viewport width, with Escape, outside-click, and link dismissal. Checked at 320px, 390px, and 1440px; six toolkit panels and all icons passed again without overflow or console errors. Pausing then reloading correctly starts the next visit with motion on.

## Vintage parchment restoration

Restored the richer amber, stains, folds, and darkened edges of the original paper at the user’s request. A light amber wash replaces the near-opaque cream layer, while the readable body fonts and spacing remain. Shared dropdowns, toolkit inserts, project logs, voyage charts, and article surfaces use the same weathered stock and more irregular tears. CV/project dialog chrome returns to a dark nautical frame with brass text and wax-seal close controls. The illustrated PDF carries the matching texture on all eight pages; the plain PDF remains unchanged. Verified mobile CV, project popup, chart, and toolkit, 320px navigation overflow, desktop résumé, and all eight PDF pages visually.

## Accurate text selection and paper links

Paper text now uses native selection with a dark-ink highlight, explicit text/link cursors, stable click targets, and 44px résumé contact targets. Selecting link text does not navigate or open a project modal. Paper anchors disable native link dragging; the personal collection’s mouse-drag rail excludes its copy, while image dragging still scrolls the rail. Removed the spring transform on project paper and the 3D movement from dialog reveals; the scroll clipping and vintage texture remain. The shared behavior and styles also cover article paper, case-study copy, sidebars, and navigation charts.

Browser checks selected exact phrases and project names, confirmed no accidental modal, verified that the next normal click opens the project, and selected Nyan Production without moving the collection (scrollLeft remained 1). Dragging its imagery then moved the rail to 571 without opening a project. Mobile CV at 320px had no overflow and all three contact links measured 44px high. No console errors were observed.

Both PDFs now embed the body font and Unicode mapping (ReportLab’s bundled Bitstream Vera) and preserve 37 actual link annotations for contacts and project references. All canonical résumé section text was verified in extraction. The illustrated PDF remains eight pages; plain remains six. Skill rows stay together, with revised illustrated body spacing to avoid a stranded line. The native PDF viewer’s selection handles and Ask for change overlay are controlled by the viewer, not the website.
