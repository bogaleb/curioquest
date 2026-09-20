"use client";
import { ScienceLab } from "@/components/learning/science-lab";
import { useExplorer } from "@/components/app/explorer-context";

export default function Page() {
  const { profile } = useExplorer();
  if (!profile) return null;
  return <ScienceLab key={profile.id} profileId={profile.id} paused={profile.preferences.paused} offline={profile.controls.offline}/>;
}
