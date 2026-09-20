import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { fontVariables } from "./fonts";
import "./tokens.css";
import "./globals.css";
import "./learning.css";
import "./games.css";
import "./navigation.css";
import "./studio.css";
import "./stories.css";
import "./reading.css";
import "./polish.css";
import "./experience.css";
import "./wonder.css";
import "./cast.css";
import "./play.css";
import "./chest.css";
import "./motion.css";
import "./shell.css";
import "./immersive.css";
import "./auth.css";

/**
 * `viewport-fit=cover` is what makes env(safe-area-inset-*) resolve to real values on
 * notched iPhones and iPads; the shell relies on those insets for its padding.
 * Zoom is left enabled — disabling it fails accessibility for low-vision users.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#17694e",
};

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") || "localhost:5173";
  const protocol = /^(localhost|127\.0\.0\.1)(:|$)/.test(host) ? "http" : "https";
  const origin = new URL(`${protocol}://${host}`);
  return {
  metadataBase: origin,
  title: "CurioQuest · Your next adventure",
  description: "Play, discover, and grow with learning adventures for pre-K and Grade 1.",
  manifest: "/manifest.webmanifest",
  applicationName: "CurioQuest",
  appleWebApp: { capable: true, title: "CurioQuest", statusBarStyle: "default" },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "CurioQuest · Small steps. Big discoveries.",
    description: "Play, discover, and grow with learning adventures for pre-K and Grade 1.",
    type: "website",
    images: [{ url: new URL("/og.png", origin).href, width: 1536, height: 1024, alt: "Nova the fox explores CurioQuest’s forest and sunflower garden." }],
  },
  twitter: { card: "summary_large_image", title: "CurioQuest", images: [new URL("/og.png", origin).href] },
};
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={fontVariables}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
