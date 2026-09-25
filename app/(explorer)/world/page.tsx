"use client";
import { useRouter } from "next/navigation";
import { WorldMap } from "@/components/experience/WorldMap";
import { useExplorer } from "@/components/app/explorer-context";
import { destinationHref } from "@/lib/navigation";

export default function MyWorldPage() {
  const router = useRouter();
  const { profile, setProfiles, setExperienceMode } = useExplorer();
  if (!profile) return null;
  return (
    <WorldMap
      key={profile.id}
      profileId={profile.id}
      name={profile.name}
      paused={profile.preferences.paused}
      onNavigate={(view) => router.push(destinationHref(view))}
      onAdventure={() => { setExperienceMode("daily"); router.push("/today"); }}
      onStars={(stars) => setProfiles((ps) => ps.map((x) => (x.id === profile.id ? { ...x, stars } : x)))}
    />
  );
}
