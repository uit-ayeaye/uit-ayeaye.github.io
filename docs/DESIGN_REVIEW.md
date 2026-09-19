# Portfolio clarity and captain’s logbook

19 September 2026

## Findings and resulting design

The earlier homepage placed the interactive lab, personal portfolios, and long-form End Game section before the general project index. Repeated section introductions, card status labels, three capability summaries, and 33 technology links created several competing paths.

The homepage now leads with a shorter introduction and six selected projects: End Game Union, BurmaMart, Golden Gates GGT, AWAM, STRIKERS, and Myanmar Glyph Studio. All 27 remain in static HTML, with search/categories and an explicit expansion control. Card copy is shorter, with a conventional readable title face beneath the pirate section typography.

The interactive selector remains fully available. Creator credits, the five personal websites, and detailed technology tiles use native disclosures. The End Game feature and Hledan memorial retain their meaning and attribution with shorter copy. About and contact have clear CV actions. No existing case study or standalone showcase was removed.

## Logbook

The CV opens in a native dialog with aged chart paper, torn edges, an illustrated portrait, wax seal, dark nautical surround, and motion that respects system and saved preferences. The canonical `/resume/` page remains usable without JavaScript. The popup fetches that page once and reuses its article.

The popup supports Escape, click outside, focus containment, focus restoration, independent scrolling, and a load-error link to the full page. Direct PDF and text downloads do not depend on printing support. Print CSS removes artwork and uses a single-column Arial layout. The downloadable one-page PDF is generated from the same HTML content with ReportLab. It is intended for applications, while the screen version carries the One Piece-inspired identity.

Metadata includes canonical URLs, descriptions, Open Graph/Twitter previews, Person/ProfilePage/WebSite/CreativeWork/BreadcrumbList structured data where appropriate, a sitemap, and robots.txt. These are technical SEO provisions, not a promise of search ranking.

## Original chart asset

Built-in imagegen used; no CLI or API key. Project asset: `images/resume/captains-chart.jpg` (optimized from the generated PNG). HTML supplies all visible résumé text. The original generated PNG remains in the ImageGen output archive.

Final generation prompt:

> Use case: stylized-concept. Asset type: decorative background texture for a One Piece inspired captain's logbook résumé website, with actual HTML text added separately. Generate a portrait 1024x1536 antique sea-chart parchment sheet, perfectly flat overhead view, full bleed paper to all four image edges. Beautiful natural ivory and warm honey old paper, subtle fibrous texture, lightly weathered tea stains, faint fold creases, delicate hand-inked archipelago coastlines, tiny nautical compass roses and dotted sailing routes concentrated in the outer margins and corners. The central 75 percent must remain almost empty pale warm cream, very low contrast to support readable dark typography. Outer edges browned and distressed, slight rubbed ink, worn vintage pirate logbook feeling, artful manga adventure cartography inspired by One Piece, elegant and authentic, not cartoon UI. No people, no portraits, no words, no letters, no numbers, no typography, no skull logos, no UI, no text blocks, no photograph props, no desk, no perspective, no shadows outside paper. The paper fills the entire rectangular image; torn silhouette will be applied by website CSS. Quiet beautiful archival cartography, restrained rich details, no bright color.

## Visual follow-up

The hero now features original generated captain artwork with a warmer expression, a straw-hat gesture, a navy coat, and a transparent silhouette. The art switch supports captain, ship, and wanted-poster editions. The new wanted poster appears in About, and the captain illustration appears in the résumé, case-study signoffs, blog author portraits, and shared voyage menu. Both assets were made using the built-in imagegen tool, referenced from the previous portrait to retain identity, and converted to WebP with alpha preserved; the original generated PNG files remain in the image-generation archive.

Nautical chart rings, floating navigation tags, raised preview frames, parchment case sidebars, transparent technology icons, and ink-and-paper blog articles extend the logbook identity. All six standalone experiences and both blog pages share a small voyage menu with visual destination links. The menu avoids the existing high-layer creator-credit ribbons; those attributions remain unchanged. Scene engines were not modified in this follow-up.

The résumé uses fixed-pixel torn edges and a naturally proportioned repeating paper texture. Phone controls meet a 44px close-target size, text remains 14px, and the screen and clean application-PDF versions share the same content. The hero’s horizontal chart meridian was rebuilt as a width-based border to remove a small-screen overflow caused by a rotated vertical line.

New visual assets: `images/captain/thomas-captain.webp` and `images/captain/thomas-wanted.webp`. The wanted bounty and pirate identity are decorative fan fiction, not professional credentials.
