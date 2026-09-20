"use client";
import { ReadingAdventure } from "@/components/reading/ReadingAdventure";
import { useExplorer } from "@/components/app/explorer-context";

export default function Page() {
  const { profile, setProfiles } = useExplorer();
  if (!profile) return null;
  return <ReadingAdventure key={profile.id} profileId={profile.id} name={profile.name} paused={profile.preferences.paused} offline={profile.controls.offline} onStars={(stars)=>setProfiles((ps)=>ps.map((x)=>x.id===profile.id?{...x,stars}:x))}/>;
}
