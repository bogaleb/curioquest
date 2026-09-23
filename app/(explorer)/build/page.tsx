"use client";
import { useMemo } from "react";
import { BuildYard, apiSource } from "@/components/kid/build/BuildYard";
import { useExplorer } from "@/components/app/explorer-context";

/**
 * The Build Yard: coding, maps, towers and shapes, built and then tested.
 *
 * A mount point and nothing else, like the Wonder Lab's. Band and narration come from
 * `KidShell` above it; the yard reads the child's tier from the server with its content.
 */
export default function BuildYardPage() {
  const { profile, setProfiles } = useExplorer();
  const source = useMemo(() => (profile ? apiSource(profile.id) : null), [profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!profile || !source) return null;
  return (
    <BuildYard
      key={profile.id}
      source={source}
      paused={profile.preferences.paused}
      onStars={(stars) => setProfiles((all) => all.map((p) => (p.id === profile.id ? { ...p, stars } : p)))}
    />
  );
}
