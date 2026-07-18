import type { Metadata } from "next";
import localFont from "next/font/local";
import { Cinzel, Cormorant_Garamond } from "next/font/google";

import "./app.css";
import Header from "@/components/Header";
import ViewCanvas from "@/components/ViewCanvas";
import Footer from "@/components/Footer";
import SiteThunder from "@/components/SiteThunder";
import SmoothScroll from "@/components/SmoothScroll";

const alpino = localFont({
  src: "../../public/fonts/Alpino-Variable.woff2",
  display: "swap",
  weight: "100 900",
  variable: "--font-alpino",
});

// Display serif — carries the "premium adventure" tone (headings, big type).
const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["500", "700", "900"],
  display: "swap",
  variable: "--font-display",
});

// Editorial italic — used for kickers / taglines with the pirate cadence.
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["italic"],
  display: "swap",
  variable: "--font-pirate",
});

const SITE_URL = "https://thomasdlynn.dev/showcase/one-piece/";
const OG_IMAGE = "https://thomasdlynn.dev/showcase/one-piece/images/og-cover.jpg";
const DESCRIPTION =
  "Fourteen devil-fruit-grade sodas inspired by the Straw Hats and the Grand Line's greatest pirates — an interactive 3D One Piece soda showcase. Spin the cans, board the Thousand Sunny. Real fruit, no curse.";

export const metadata: Metadata = {
  metadataBase: new URL("https://thomasdlynn.dev"),
  title: {
    default: "Grand Line Fizz — Drink Like the Pirate King",
    template: "%s · Grand Line Fizz",
  },
  description: DESCRIPTION,
  applicationName: "Grand Line Fizz",
  keywords: [
    "One Piece",
    "Grand Line Fizz",
    "One Piece soda",
    "Straw Hat crew",
    "Monkey D. Luffy",
    "Thousand Sunny",
    "3D web experience",
    "React Three Fiber",
    "Three.js",
    "WebGL showcase",
    "anime drink concept",
    "Thomas D. Lynn",
  ],
  authors: [{ name: "Thomas D. Lynn", url: "https://thomasdlynn.dev" }],
  creator: "Thomas D. Lynn",
  publisher: "Thomas D. Lynn",
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    siteName: "Grand Line Fizz",
    title: "Grand Line Fizz — Drink Like the Pirate King",
    description:
      "Fourteen One Piece character sodas in an interactive 3D showcase — spin the cans, board the Thousand Sunny.",
    url: SITE_URL,
    locale: "en_US",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Grand Line Fizz — a One Piece soda showcase",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Grand Line Fizz — Drink Like the Pirate King",
    description:
      "Fourteen One Piece character sodas in an interactive 3D showcase — spin the cans, board the Thousand Sunny.",
    images: [OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${alpino.variable} ${cinzel.variable} ${cormorant.variable}`}
    >
      <body className="overflow-x-hidden bg-[#0B0E14] font-sans text-[#ECE4D3] antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "CreativeWork",
              name: "Grand Line Fizz",
              headline: "Grand Line Fizz — Drink Like the Pirate King",
              description: DESCRIPTION,
              url: SITE_URL,
              image: OG_IMAGE,
              genre: "Interactive 3D web showcase",
              keywords:
                "One Piece, soda, 3D, WebGL, Three.js, Thousand Sunny, Straw Hat crew",
              author: {
                "@type": "Person",
                name: "Thomas D. Lynn",
                url: "https://thomasdlynn.dev",
              },
            }),
          }}
        />

        <SmoothScroll />
        <main>
          {children}
          <ViewCanvas />
        </main>
        <SiteThunder />

        {/* ── Showcase chrome (portfolio hosting on thomasdlynn.dev) ──────────
            Plain <a> with a site-absolute href so Next's basePath does not
            rewrite it — this links to the gallery at the site root. */}
        <a
          href="/showcase/"
          aria-label="Return to the showcase gallery"
          style={{
            position: "fixed",
            top: 16,
            left: 16,
            zIndex: 70,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "9px 15px",
            borderRadius: 12,
            fontFamily: "var(--font-display), system-ui, sans-serif",
            fontWeight: 600,
            fontSize: 13,
            letterSpacing: "0.02em",
            textDecoration: "none",
            color: "#fff",
            background: "rgba(10,10,14,.55)",
            border: "1px solid rgba(201,162,39,.4)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            boxShadow: "0 6px 22px rgba(0,0,0,.35)",
          }}
        >
          <span aria-hidden="true">⚓</span>
          <span>Return to Port</span>
        </a>

        {/*
          One Piece 3D base model by Meghamittal0920
          (https://github.com/Meghamittal0920/One-Piece-3D-Website), Apache-2.0.
          The on-screen credit was removed at the site owner's request; the full
          attribution ships in the LICENSE and NOTICE files served alongside
          this build, which satisfies Apache-2.0 §4.
        */}
      </body>
    </html>
  );
}
