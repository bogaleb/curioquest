"use client";
import { useRouter } from "next/navigation";
import { ChildWorldHome } from "@/components/experience/ChildWorldHome";
import { ParentQuests } from "@/components/learning/parent-quests";
import { DiscoveryInvitation } from "@/components/learning/discovery-invitation";
import { useExplorer } from "@/components/app/explorer-context";
import { destinationHref } from "@/lib/navigation";
import { readAloud } from "@/lib/speech";

export default function AdventurePage() {
  const router = useRouter();
  const { profile, busy, start, action, openQuest, setExperienceMode, assignmentVersion } = useExplorer();
  if (!profile) return null;
  return (
    <>
      <ChildWorldHome
        key={profile.id}
        profile={profile}
        busy={busy}
        onStart={start}
        onResume={async (id) => { openQuest(await action({ action: "session-resume", session: id })); }}
        onNavigate={(view) => router.push(destinationHref(view))}
        onDaily={() => { setExperienceMode("daily"); router.push("/today"); }}
        onClassic={() => start("daily")}
      />
      <ParentQuests key={`${profile.id}:${assignmentVersion}`} profileId={profile.id} paused={profile.preferences.paused} />
      <DiscoveryInvitation
        profile={profile}
        busy={busy || profile.preferences.paused}
        onStart={async () => { openQuest(await action({ action: "discovery-start" })); }}
        onListen={readAloud}
      />
    </>
  );
}
