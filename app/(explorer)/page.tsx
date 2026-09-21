"use client";
import { useRouter } from "next/navigation";
import { ChildMap } from "@/components/experience/ChildMap";
import { ParentQuests } from "@/components/learning/parent-quests";
import { DiscoveryInvitation } from "@/components/learning/discovery-invitation";
import { useExplorer } from "@/components/app/explorer-context";
import { destinationHref } from "@/lib/navigation";
import { readAloud } from "@/lib/speech";

/**
 * Arrival.
 *
 * The map fills the first screen: one big trail to carry on with, and every other place
 * drawn around it at a fixed position (WP-03). The two sections below it are the parts of
 * the old home screen that still carry something a child would miss — a quest a grown-up
 * wrote, and an invitation into a new discovery strand — and both render nothing at all when
 * they are empty. They are below the fold on purpose: reaching learning must not require
 * scrolling past anything, and WP-08 folds both into the episode.
 */
export default function ArrivalPage() {
  const router = useRouter();
  const {
    profile, profiles, busy, selectProfile, action, openQuest, setExperienceMode,
    assignmentVersion, setGateOpen,
  } = useExplorer();
  if (!profile) return null;

  const session = profile.session;
  const active = session && session.index < session.total ? session : null;

  return (
    <>
      <ChildMap
        key={profile.id}
        profile={profile}
        profiles={profiles}
        busy={busy}
        hasActiveTrail={Boolean(active)}
        onSelectProfile={selectProfile}
        onGrownUps={() => setGateOpen(true)}
        onGo={(id) => router.push(destinationHref(id))}
        onTrail={async () => {
          if (active) {
            openQuest(await action({ action: "session-resume", session: active.id }));
            return;
          }
          setExperienceMode("daily");
          router.push("/today");
        }}
      />
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
