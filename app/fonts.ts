import { Fredoka, Nunito, Andika } from "next/font/google";

/**
 * Typography.
 *
 * All three faces are downloaded at build time and served from our own origin, so a
 * child's browser never makes a request to a font CDN. That matters here for privacy,
 * not only for speed.
 */

/** Display face: headings, numbers, celebration. Rounded, confident, friendly. */
export const display = Fredoka({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

/** Body and UI. Rounded terminals and a wide weight range keep it legible when small. */
export const body = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-body",
  display: "swap",
});

/**
 * Text a child is decoding.
 *
 * Andika is a literacy face: single-storey `a` and `g`, unambiguous `I`/`l`/`1`, and
 * clearly distinct `b`/`d`/`p`/`q`. A child being taught to form a single-storey `a`
 * should not be asked to read a double-storey one, so this is used for phonics,
 * decodable readers, letter work, and handwriting guides — never for chrome.
 */
export const reading = Andika({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-reading",
  display: "swap",
});

export const fontVariables = `${display.variable} ${body.variable} ${reading.variable}`;
