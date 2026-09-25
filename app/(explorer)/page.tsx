"use client";
import { useRouter } from "next/navigation";
import { ChildMap } from "@/components/experience/ChildMap";
import { ParentQuests } from "@/components/learning/parent-quests";
import { DiscoveryInvitation } from "@/components/learning/discovery-invitation";
import { useExplorer } from "@/components/app/explorer-context";
import { destinationHref } from "@/lib/navigation";
import { readAloud } from "@/lib/speech";
import { useState } from "react";
import { DiscoveryHome } from "@/components/kid/discover/DiscoveryHome";

/**
 * Arrival.
 *
 * The discovery journal introduces six learning areas and resumes the existing daily
 * trail. The original spatial map remains available, including family profile switching.
 * Parent assignments and adaptive discovery invitations retain their existing behaviour.
 */
export default function ArrivalPage() {
  const [showMap, setShowMap] = useState(false);
  const router = useRouter();
  const {
    profile, profiles, busy, selectProfile, action, openQuest, setExperienceMode,
    assignmentVersion, setGateOpen,
  } = useExplorer();
  if (!profile) return null;

  const session = profile.session;
  const active = session && session.index < session.total ? session : null;
  const startTrail = async () => {
    if (active) {
      openQuest(await action({ action: "session-resume", session: active.id }));
      return;
    }
    setExperienceMode("daily");
    router.push("/today");
  };

  return (
    <>
      {showMap ? <><button type="button" className="discovery-back" onClick={() => setShowMap(false)}>← Back to discoveries</button><ChildMap
        key={profile.id}
        profile={profile}
        profiles={profiles}
        busy={busy}
        hasActiveTrail={Boolean(active)}
        onSelectProfile={selectProfile}
        onGrownUps={() => setGateOpen(true)}
        onGo={(id) => router.push(destinationHref(id))}
        onTrail={startTrail}
      /></> : <DiscoveryHome name={profile.name} band={profile.band} paused={profile.preferences.paused} busy={busy} hasActiveTrail={Boolean(active)} faith={profile.controls.faith} onTrail={() => void startTrail()} onMap={() => setShowMap(true)} onGrownUps={() => setGateOpen(true)}/>}
      <ParentQuests
        key={`${profile.id}:${assignmentVersion}`}
        profileId={profile.id}
        paused={profile.preferences.paused}
      />
      <DiscoveryInvitation
        profile={profile}
        busy={busy || profile.preferences.paused}
        onStart={async () => {
          openQuest(await action({ action: "discovery-start" }));
        }}
        onListen={readAloud}
      />
    </>
  );
}
