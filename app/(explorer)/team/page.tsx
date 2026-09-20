"use client";
import { useRouter } from "next/navigation";
import { TeamQuest } from "@/components/learning/team-quest";
import { useExplorer } from "@/components/app/explorer-context";

export default function TeamQuestPage() {
  const router = useRouter();
  const { profile, profiles, busy, action, openQuest, selectProfile } = useExplorer();
  if (!profile) return null;
  return (
    <TeamQuest
      key={profile.id}
      profiles={profiles}
      profile={profile}
      busy={busy || profile.preferences.paused}
      onStart={async (partner) => { await action({ action: "team-start", partner }); }}
      onContinue={async (id) => {
        const partner = profiles.find((item) => item.id === id);
        const saved = partner?.savedSessions?.find((item) => item.teamId === partner.team?.id);
        selectProfile(id);
        openQuest(await action(
          saved ? { action: "session-resume", session: saved.id } : { action: "start", subject: "daily" },
          id,
        ));
      }}
      onComplete={async () => { await action({ action: "team-complete" }); }}
      onGarden={() => router.push("/build")}
    />
  );
}
