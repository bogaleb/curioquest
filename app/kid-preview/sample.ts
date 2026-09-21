import { newExplorer } from "@/lib/explorers";
import type { PublicExplorer } from "@/lib/explorer-view";
import type { LearningBandId } from "@/lib/learning-bands";

/**
 * A made-up child, for the development preview only.
 *
 * The map is the one child screen that cannot be looked at without a signed-in family and a
 * profile, which makes it the one child screen nobody looks at often enough. This gives it a
 * plausible explorer so the layout, the touch targets and the two-touch rule can be checked
 * at every viewport without creating an account in anyone's Supabase project.
 *
 * It is built with `newExplorer`, the same constructor the real code uses, so a field added
 * to a profile shows up here as a type error rather than as a preview that silently drifts
 * from the thing it is previewing.
 *
 * Not a test fixture and not seed data: nothing imports it outside `/kid-preview`, which is
 * a 404 in production.
 */
export function sampleExplorer(band: LearningBandId, name = "Robin"): PublicExplorer {
  const profile = newExplorer("preview", name, "prek", "fox", ["animals"], 10, band);
  return { ...profile, stars: 12, session: null, savedSessions: [] };
}
