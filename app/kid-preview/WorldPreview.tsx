"use client";

import { useRouter } from "next/navigation";
import { destinationHref } from "@/lib/navigation";
import { useState } from "react";
import { WorldHub } from "@/components/experience/WorldMap";
import { mediaAssets, worldItems } from "@/lib/experience/content";
import type { ExperienceView } from "@/lib/experience/types";
import type { LearningBandId } from "@/lib/learning-bands";

function previewExperience(): ExperienceView {
  return {
    state: {
      runs: {},
      favoriteMedia: ["missing-map"],
      watched: ["missing-map"],
      gameCompletions: 1,
      offlineRequestedAt: null,
      offlineConfirmedAt: null,
      events: [],
    },
    revision: 1,
    media: mediaAssets,
    items: worldItems,
    inventory: [
      { item_id: "explorer-map", earned_at: "preview" },
      { item_id: "moon-lamp", earned_at: "preview" },
      { item_id: "nova-storybook", earned_at: "preview" },
      { item_id: "star-globe", earned_at: "preview" },
    ],
    placements: [
      { slot: "wall", item_id: "explorer-map" },
      { slot: "shelf", item_id: "moon-lamp" },
    ],
    run: null,
    step: null,
    warmup: null,
    letter: null,
    cue: null,
    word: null,
    activity: null,
    collector: null,
    story: null,
    stars: 18,
  };
}

export function WorldPreview({ band }: { band: LearningBandId }) {
  const router = useRouter();
  const [data, setData] = useState(() => previewExperience());

  return (
    <main className="preview-page" data-band={band} data-kid-world="treehouse">
      <WorldHub
        name="Robin"
        data={data}
        busy={false}
        error=""
        refresh={() => setData(previewExperience())}
        act={async (action, extra = {}) => {
          if (action !== "place") return data;
          const slot = String(extra.slot || "");
          const item = typeof extra.item === "string" ? extra.item : null;
          const placements = data.placements.filter((entry) => entry.slot !== slot);
          const next = {
            ...data,
            placements: item ? [...placements, { slot, item_id: item }] : placements,
            revision: data.revision + 1,
          };
          setData(next);
          return next;
        }}
        onAdventure={() => router.push("/today")}
        onNavigate={(id) => router.push(destinationHref(id))}
        onStars={() => {}}
      />
    </main>
  );
}
