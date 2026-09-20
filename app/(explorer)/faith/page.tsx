"use client";
import { StoryWorld } from "@/components/learning/story-world";
import { useExplorer } from "@/components/app/explorer-context";

export default function Page() {
  const { profile } = useExplorer();
  if (!profile) return null;
  if (!profile.controls.faith) return <p>Choose another adventure from the menu.</p>;
  return (
    <StoryWorld
      key={profile.id}
      profileId={profile.id}
      faith={true}
      paused={profile.preferences.paused}
    />
  );
}
