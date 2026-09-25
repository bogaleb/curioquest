"use client";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { GameZone } from "@/components/learning/game-zone";
import { useExplorer } from "@/components/app/explorer-context";

export default function GameZonePage() {
  const router = useRouter();
  const { profile, busy, action, openQuest, setExperienceMode } = useExplorer();
  if (!profile) return null;
  const resume = async (id: string) => { openQuest(await action({ action: "session-resume", session: id })); };
  return (
    <>
      <button
        className="space-invitation reading-invitation"
        disabled={busy || profile.preferences.paused}
        onClick={() => { setExperienceMode("game"); router.push("/today"); }}
      >
        <span aria-hidden="true">✦</span>
        <span>
          <small>NEW · SPACE COLLECTOR</small>
          <strong>Listen. Steer. Make a discovery.</strong>
          <span>A gentle word mission with touch and keyboard controls.</span>
        </span>
        <ArrowRight />
      </button>
      <GameZone
        key={profile.id}
        profile={profile}
        busy={busy || profile.preferences.paused}
        onStart={async (game, level) => { openQuest(await action({ action: "game-start", game, level })); }}
        onContinue={() => { if (profile.session) void resume(profile.session.id); }}
        onResume={resume}
        onFavorite={async (game, favorite) => { await action({ action: "favorite-game", game, favorite }); }}
      />
    </>
  );
}
