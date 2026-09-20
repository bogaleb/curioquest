import type { MetadataRoute } from "next";

/**
 * Install manifest.
 *
 * Deliberately no service worker yet. A parent can install CurioQuest to a home
 * screen on iPad, Android, Chromebook, or Windows and get the standalone, chrome-free
 * window children should have — but every request still goes to the network, so there
 * is no stale-content or half-synced-progress failure mode to debug. Offline content
 * packs come once the content model is stable.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CurioQuest · Small steps. Big discoveries.",
    short_name: "CurioQuest",
    description:
      "Play, discover, and grow with learning adventures for ages 3 to 9.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#f8f9f4",
    theme_color: "#17694e",
    categories: ["education", "kids"],
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/og.png",
        sizes: "1536x1024",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
