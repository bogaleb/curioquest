"use client";
import { GardenLab } from "@/components/learning/garden-adventure";
import { useExplorer } from "@/components/app/explorer-context";

export default function BuildLabPage() {
  const { profile, busy, action } = useExplorer();
  if (!profile) return null;
  return (
    <GardenLab
      key={profile.id}
      progress={profile.adventure}
      offline={profile.controls.offline}
      busy={busy || profile.preferences.paused}
      onSave={async (garden) => !!(await action({ action: "save-garden", garden }))}
      onOffline={async () => !!(await action({ action: "offline-request" }))}
    />
  );
}
