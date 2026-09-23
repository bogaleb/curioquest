import { withFamily } from "@/lib/backend/context";
import { readExplorer, readLearningEvents, saveExplorers } from "@/lib/backend/repository";
import { familyAuthorized } from "@/lib/parent-security";
import { requestJson, RequestBodyError } from "@/lib/request-json";
import { normalizeExplorer } from "@/lib/explorers";
import { scheduleMessage } from "@/lib/learning-controls";
import { CODE_CATALOGUE_VERSION } from "@/lib/catalogue-version";
import { eventForQuestion, latency, type LearningEvent } from "@/lib/learning-events";
import { recordAttempt } from "@/lib/mastery";
import { primaryContentBand } from "@/lib/learning-bands";
import { say, tierForBand } from "@/lib/science/tier";
import { buildLevelById } from "@/lib/build/levels";
import { judgeBuild, towerFalls } from "@/lib/build/engine";
import { buildErrorKind, buildQuestion } from "@/lib/build/build-events";
import { buildLevelIds, publicYard } from "@/lib/build/public";
import type { BuildSubmission } from "@/lib/build/types";

/**
 * The Build Yard's only server route. Same contract as the Wonder Lab's (`/api/lab`):
 *
 *   - content is resolved to the child's tier;
 *   - a construction is judged here, not in the browser, and the explanation is released
 *     only after it works (or, on a prediction level, only after the child commits);
 *   - every attempt is appended to `learning_events` in the same save as the profile.
 */

const reply = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store" } });

async function finishedLevels(childId: string) {
  const rows = await readLearningEvents(childId);
  const done = new Set<string>();
  for (const row of rows) if (row.correct && buildLevelIds.has(row.item_id)) done.add(row.item_id);
  return done;
}

async function get(request: Request) {
  try {
    if (!(await familyAuthorized(request))) return reply({ error: "Open your family workspace first." }, 403);
    const id = new URL(request.url).searchParams.get("profile") ?? "";
    const row = await readExplorer(id);
    if (!row) return reply({ error: "Choose an explorer." }, 404);
    const profile = normalizeExplorer(JSON.parse(row.data));
    const tier = tierForBand(profile.band);
    return reply({ tier, workshops: publicYard(tier, await finishedLevels(profile.id)) });
  } catch {
    return reply({ error: "The Build Yard could not be opened. Please try again." }, 503);
  }
}

async function post(request: Request) {
  try {
    if (!(await familyAuthorized(request))) return reply({ error: "Open your family workspace first." }, 403);
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) return reply({ error: "Request not allowed." }, 403);

    const input = await requestJson(request, 16000);
    const row = await readExplorer(String(input.profile ?? ""));
    if (!row) return reply({ error: "Choose an explorer." }, 404);
    const profile = normalizeExplorer(JSON.parse(row.data));

    const paused = profile.preferences.paused || scheduleMessage(profile.controls);
    if (paused) {
      return reply({ error: scheduleMessage(profile.controls) ?? "A grown-up can start play again in Parent Corner." }, 403);
    }

    if (input.action !== "attempt") return reply({ error: "Choose a Build Yard action." }, 400);
    const level = buildLevelById.get(String(input.level ?? ""));
    if (!level) return reply({ error: "Choose something to build." }, 404);
    const tier = tierForBand(profile.band);
    if (!level.tiers.includes(tier)) return reply({ error: "That build is not part of this explorer's yard." }, 403);

    const session = String(input.session ?? "");
    if (!/^[A-Za-z0-9-]{8,64}$/.test(session)) return reply({ error: "Open the workshop first." }, 400);

    const submission = input.build as BuildSubmission;
    const verdict = submission && typeof submission === "object" ? judgeBuild(level, submission) : null;
    if (!verdict) return reply({ error: "That is not something this workshop can build." }, 400);

    const already = (await finishedLevels(profile.id)).has(level.id);
    const question = buildQuestion(level, tier, primaryContentBand(profile.band));
    const event: LearningEvent = eventForQuestion({
      question,
      sessionId: session,
      correct: verdict.correct,
      // The hint is offered after a miss and opened by the child. A correct build made
      // after reading it is supported, not independent, and is recorded as such.
      support: input.hinted === true ? "hint" : "none",
      response: verdict.errorKind,
      errorKind: buildErrorKind(verdict.errorKind),
      latencyMs: latency(typeof input.startedAt === "number" ? input.startedAt : null),
      catalogueVersion: CODE_CATALOGUE_VERSION,
    });
    recordAttempt(profile.skillMastery, question, session, verdict.correct, input.hinted !== true);
    if (verdict.correct && !already) profile.stars += 1;

    const saved = await saveExplorers([{ profile, revision: row.revision }], false, null, [event]);
    if (!saved) return reply({ error: "The Build Yard changed in another window. Refresh to keep your place." }, 409);

    const falls = submission.workshop === "tower" && level.workshop === "tower" ? [...towerFalls(level, submission.blocks)] : undefined;
    return reply({
      correct: verdict.correct,
      message: verdict.message,
      // A prediction is answered once: right or wrong, the child has now seen the result and
      // is owed the reason. Everywhere else the explanation is the reward for making it work.
      success: verdict.correct || (level.workshop === "tower" && level.rule.kind === "predict") ? say(level.success, tier) : undefined,
      falls,
      firstTime: verdict.correct && !already,
      stars: profile.stars,
    });
  } catch (error) {
    if (error instanceof RequestBodyError) return reply({ error: error.message }, error.status);
    console.error("Build attempt failed", error);
    return reply({ error: "Your build could not be saved. Keep this page open and try again." }, 503);
  }
}

export const GET = withFamily(get);
export const POST = withFamily(post);
