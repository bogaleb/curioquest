"use client";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useExplorer } from "@/components/app/explorer-context";
import { DiscoveryLibrary } from "@/components/kid/discover/DiscoveryLibrary";
import { discoverySource } from "@/lib/discover/client";
import { discoveryDomains } from "@/lib/discover/domains";

export default function DiscoverPage() {
  const { profile } = useExplorer();
  const params = useSearchParams();
  const profileId = profile?.id;
  const source = useMemo(() => profileId ? discoverySource(profileId) : null, [profileId]);
  const domain = discoveryDomains.find((item) => item.id === params.get("domain"))?.id ?? "all";
  if (!profile || !source) return null;
  return <DiscoveryLibrary key={`${profile.id}:${profile.band}:${domain}`} source={source} paused={profile.preferences.paused} narration={profile.controls.audio.narration} initialDomain={domain}/>;
}
