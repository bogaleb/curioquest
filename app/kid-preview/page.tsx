import { notFound } from "next/navigation";
import { isLearningBandId, DEFAULT_BAND, type LearningBandId } from "@/lib/learning-bands";
import type { KidWorld } from "@/components/kid";
import { KidPreview } from "./KidPreview";
import { BuildPreview } from "./BuildPreview";
import { LabPreview } from "./LabPreview";
import { ReadingPreview } from "./ReadingPreview";
import { ScenePreview } from "./ScenePreview";
import { StudioPreview } from "./StudioPreview";
import { WorldPreview } from "./WorldPreview";
import { CharacterPreview } from "./CharacterPreview";
import "./preview.css";
import { DiscoveryPreview } from "./DiscoveryPreview";
import { publicDiscoveries } from "@/lib/discover/engine";

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
 *   /kid-preview?band=prek&world=grove          the primitives
 *   /kid-preview?screen=map&band=prek            the arrival map
 *   /kid-preview?screen=moves&band=prek          every teaching move (WP-04)
 *   /kid-preview?screen=scene&band=prek          the scene grammar, cast and celebration (WP-11)
 *   /kid-preview?screen=lab&band=prek            every Wonder Lab station and apparatus
 *   /kid-preview?screen=studio&band=prek         every Making Place room, page and letter
 *   /kid-preview?screen=reading&band=prek        the co-play reading steps: warm-up, sound hunt, writing
 *   /kid-preview?screen=build&band=prek          the Build Yard, judged in the browser
 *   /kid-preview?screen=world&band=prek          the My World hub and treehouse
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
  if (params.screen === "discover" || params.screen === "home") return <DiscoveryPreview home={params.screen === "home"} data={{ band, lessons: publicDiscoveries(band) }}/>;
  if (params.screen === "scene") return <ScenePreview band={band} world={world} />;
  if (params.screen === "lab") return <LabPreview band={band} />;
  if (params.screen === "studio") return <StudioPreview band={band} />;
  if (params.screen === "reading") return <ReadingPreview band={band} />;
  if (params.screen === "build") return <BuildPreview band={band} />;
  if (params.screen === "world") return <WorldPreview band={band} />;
  if (params.screen === "characters") return <CharacterPreview />;
  const screen = params.screen === "map" ? "map" : params.screen === "moves" ? "moves" : "parts";
  return <KidPreview band={band} world={world} screen={screen} />;
}
