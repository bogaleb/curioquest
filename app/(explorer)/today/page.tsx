"use client";
import { useRouter } from "next/navigation";
import { DailyAdventure } from "@/components/experience/DailyAdventure";
import { useExplorer } from "@/components/app/explorer-context";

export default function TodayPage() {
  const router = useRouter();
  const { profile, setProfiles, experienceMode } = useExplorer();
  if (!profile) return null;
  return (
    <DailyAdventure
      key={profile.id + experienceMode}
      profileId={profile.id}
      mode={experienceMode}
      onExit={() => router.push("/")}
      onReading={() => router.push("/read")}
      onWorld={() => router.push("/world")}
      onStars={(stars) => setProfiles((ps) => ps.map((x) => (x.id === profile.id ? { ...x, stars } : x)))}
    />
  );
}
