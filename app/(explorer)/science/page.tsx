"use client";
import { WonderLab } from "@/components/kid/lab/WonderLab";
import { useExplorer } from "@/components/app/explorer-context";

/**
 * The Wonder Lab.
 *
 * The route is a mount point and nothing else. Band, world and narration are resolved by
 * `KidShell` above it and read from context by the lab itself, so this file has no
 * opinion about how the lab looks to a four-year-old versus an eight-year-old — which is
 * the point of `KidSurfaceProvider` and the reason it is not threaded through as props.
 *
 * `key` on the profile id: switching explorer restarts the lab rather than leaving one
 * child's half-finished station on another child's screen.
 */
export default function Page() {
  const { profile } = useExplorer();
  if (!profile) return null;
  return <WonderLab key={profile.id} profileId={profile.id} paused={profile.preferences.paused} />;
}
