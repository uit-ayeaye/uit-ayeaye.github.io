# Mobile lobby and toolkit refinement — 2026-09-21

The character lobby now contains its layout and paint, with zero-minimum grid columns and clipped artwork bounds. Touch swipes have bounded illustration-only feedback, scheduled once per animation frame. Vertical gestures retain native page scrolling. Rotating orbit decoration and the fixed grain overlay are disabled for coarse pointers. Character changes wait for image decoding and discard stale requests; alternate images warm after load during idle time, except on data-saving or slow connections.

The captain uses 480px/800px WebP variants (60,476 / 121,586 bytes, versus 269,690 bytes for the original). The ship uses a 61,316-byte WebP, and the wanted paper and portrait use 49,154 / 91,546-byte variants. Original artwork remains available. These are resized/re-encoded derivatives, not new artwork.

Toolkit disclosures retain native details/summary semantics and animate only opacity. They no longer receive the shared parchment wrapper or animate height. Dark panels, aligned emblems, three-column tool grids (two on the narrowest phones), and category accents provide a consistent surface in both themes. Shared controls batch computed-style reads before class writes to avoid repeated layout work at startup.

Inline preview videos remain still on touch devices. A visitor can explicitly play a video inside its project viewer; reduced motion and data-saving limits still apply. Desktop previews retain visibility-based playback limits.

Validation: `scripts/test_mobile_lobby.cjs` drives real Chromium touch events, checks overflow during each drag, confirms native vertical scrolling, opens all six toolkit panels at 320/390/768/1440px in both themes, checks for height animations, and verifies inline mobile video remains paused. The general portfolio suite and static route verifier provide broader coverage. Browser emulation is not a physical-device frame-rate guarantee.
