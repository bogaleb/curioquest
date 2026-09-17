import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CurioQuest · Your next adventure",
  description: "Play, discover, and grow with learning adventures for pre-K and Grade 1.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

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
