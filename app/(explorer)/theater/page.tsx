"use client";
import { useRouter } from "next/navigation";
import { Theater } from "@/components/experience/Theater";
import { useExplorer } from "@/components/app/explorer-context";

export default function TheaterPage() {
  const router = useRouter();
  const { profile, setExperienceMode } = useExplorer();
  if (!profile) return null;
  return (
    <Theater
      key={profile.id}
      profileId={profile.id}
      onPlay={() => { setExperienceMode("episode"); router.push("/today"); }}
    />
  );
}
