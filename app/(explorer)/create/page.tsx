"use client";
import { CreativeStudio } from "@/components/learning/creative-studio";
import { useExplorer } from "@/components/app/explorer-context";

export default function CreativeStudioPage() {
  const { profile, setStudioDirty } = useExplorer();
  if (!profile) return null;
  return (
    <CreativeStudio
      key={profile.id}
      profileId={profile.id}
      name={profile.name}
      paused={profile.preferences.paused}
      onDirtyChange={setStudioDirty}
    />
  );
}
