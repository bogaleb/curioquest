import { notFound } from "next/navigation";
import { isLearningBandId, DEFAULT_BAND, type LearningBandId } from "@/lib/learning-bands";
import type { KidWorld } from "@/components/kid";
import { KidPreview } from "./KidPreview";

/**
 * The child component layer, on one page, in development only.
 *
 * It exists to be looked at: at iPad landscape and portrait, at phone portrait, at desktop,
 * with reduced motion on, with narration off, and driven by a keyboard rather than a finger.
 * That is the check WP-02 asks for, and it is far quicker here than reaching each primitive
 * through a real lesson.
 *
 * It is not a child surface and it never ships: in production this route is a 404. It carries
 * no child data, reads nothing from Supabase and needs no session.
 *
 *   /kid-preview?band=prek&world=grove
 */
const WORLDS: KidWorld[] = ["grove", "city", "harbor", "workshop", "treehouse", "lab"];

export default async function KidPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ band?: string; world?: string; screen?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const params = await searchParams;
  const band: LearningBandId = isLearningBandId(params.band) ? params.band : DEFAULT_BAND;
  const world = WORLDS.find((name) => name === params.world) ?? "grove";
  return <KidPreview band={band} world={world} screen={params.screen === "map" ? "map" : "parts"} />;
}
