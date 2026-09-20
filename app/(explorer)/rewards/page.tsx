"use client";
import { useRouter } from "next/navigation";
import { TreasureChest } from "@/components/learning/treasure-chest";
import { useExplorer } from "@/components/app/explorer-context";
import { destinationHref } from "@/lib/navigation";

export default function RewardsPage() {
  const router = useRouter();
  const { profile } = useExplorer();
  if (!profile) return null;
  return <TreasureChest profile={profile} onNavigate={(view) => router.push(destinationHref(view))} />;
}
