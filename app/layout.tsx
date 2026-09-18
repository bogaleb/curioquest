import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import "./learning.css";
import "./games.css";
import "./navigation.css";
import "./studio.css";
import "./stories.css";
import "./polish.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") || "localhost:5173";
  const protocol = /^(localhost|127\.0\.0\.1)(:|$)/.test(host) ? "http" : "https";
  const origin = new URL(`${protocol}://${host}`);
  return {
  metadataBase: origin,
  title: "CurioQuest · Your next adventure",
  description: "Play, discover, and grow with learning adventures for pre-K and Grade 1.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
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
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
