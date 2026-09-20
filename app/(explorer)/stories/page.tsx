"use client";
import { StoryWorld } from "@/components/learning/story-world";
import { useExplorer } from "@/components/app/explorer-context";

export default function Page() {
  const { profile } = useExplorer();
  if (!profile) return null;
  
  return (
    <StoryWorld
      key={profile.id}
      profileId={profile.id}
      faith={false}
      paused={profile.preferences.paused}
    />
  );
}
