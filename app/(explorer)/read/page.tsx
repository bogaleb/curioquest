"use client";
import { ReadingAdventure } from "@/components/reading/ReadingAdventure";
import { useExplorer } from "@/components/app/explorer-context";

export default function Page() {
  const { profile, setProfiles } = useExplorer();
  if (!profile) return null;
  // Band and narration are handed down so the grove sizes its type and its touch targets
  // for the child actually holding the tablet, rather than for the default one.
  return <ReadingAdventure key={profile.id} profileId={profile.id} name={profile.name} band={profile.band} narration={profile.controls.audio.narration} paused={profile.preferences.paused} offline={profile.controls.offline} onStars={(stars)=>setProfiles((ps)=>ps.map((x)=>x.id===profile.id?{...x,stars}:x))}/>;
}
