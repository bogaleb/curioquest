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
import { createItem, itemsFor } from "@/lib/workspace-store";
import { judgeLabAttempt, labStationById, publicLab, tierForBand } from "@/lib/science/lab";
import { labQuestion } from "@/lib/science/lab-events";
import type { LabTier } from "@/lib/science/types";

/**
 * The Wonder Lab's only server route.
 *
 * It exists because of one line in the blueprint: *answers, scoring and reward grants are
 * decided on the server; never ship the answer key to the browser* (§A). The lab it
 * replaces failed that plainly — every outcome for every object was in the bundle, so the
 * prediction step was a formality and any child who opened the network tab could finish
 * the whole lab without looking at anything.
 *
 * Three things happen here and nowhere else:
 *
 *   - content is resolved to the child's tier and stripped of its answers;
 *   - a response is judged, and the observation and explanation are released *after* the
 *     child has committed to a prediction;
 *   - the attempt is appended to `learning_events` in the same transaction as the profile
 *     save, so a lab session produces exactly the evidence a quest session does.
 *
 * Notebook entries are ordinary workspace items, so the existing collection limits,
 * parent export and deletion all keep working without a second storage path.
 */

const reply = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store" } });

/** The stations this child has already got right, for the shelf's progress marks. */
async function finishedStations(childId: string) {
  const rows = await readLearningEvents(childId);
  const done = new Set<string>();
  for (const row of rows) if (row.correct) done.add(row.item_id);
  return done;
}

type LabNote = { station: string; topic: string; tier: LabTier; text: string };

async function get(request: Request) {
  try {
    if (!(await familyAuthorized(request))) {
      return reply({ error: "Open your family workspace first." }, 403);
    }
    const id = new URL(request.url).searchParams.get("profile") ?? "";
    const row = await readExplorer(id);
    if (!row) return reply({ error: "Choose an explorer." }, 404);
    const profile = normalizeExplorer(JSON.parse(row.data));
    const tier = tierForBand(profile.band);
    const [done, notes] = await Promise.all([
      finishedStations(profile.id),
      itemsFor<LabNote>(profile.id, "observation"),
    ]);
    return reply({ tier, topics: publicLab(tier, done), notes });
  } catch {
    return reply({ error: "The lab could not be opened. Please try again." }, 503);
  }
}

async function post(request: Request) {
  try {
    if (!(await familyAuthorized(request))) {
      return reply({ error: "Open your family workspace first." }, 403);
    }
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) {
      return reply({ error: "Request not allowed." }, 403);
    }

    const input = await requestJson(request, 8000);
    const row = await readExplorer(String(input.profile ?? ""));
    if (!row) return reply({ error: "Choose an explorer." }, 404);
    const profile = normalizeExplorer(JSON.parse(row.data));

    // The same pause and schedule rules every other child surface obeys. A lab that
    // keeps running after a grown-up has stopped play is a hole in Parent Corner.
    const paused = profile.preferences.paused || scheduleMessage(profile.controls);
    if (paused) {
      return reply(
        { error: scheduleMessage(profile.controls) ?? "A grown-up can start play again in Parent Corner." },
        403,
      );
    }

    const found = labStationById(String(input.station ?? ""));
    if (!found) return reply({ error: "Choose a station in the lab." }, 404);
    const { topic, station } = found;
    const tier = tierForBand(profile.band);
    if (!station.tiers.includes(tier)) {
      return reply({ error: "That station is not part of this explorer's lab." }, 403);
    }

    if (input.action === "note") {
      const text = typeof input.text === "string" ? input.text.trim() : "";
      if (!text || text.length > 600) {
        return reply({ error: "Write up to 600 characters in your notebook." }, 400);
      }
      if ((await itemsFor(profile.id, "observation")).length >= 100) {
        return reply({ error: "Your notebook is full. A grown-up can export and tidy it in Parent Corner." }, 409);
      }
      const item = await createItem<LabNote>(profile.id, "observation", {
        station: station.id,
        topic: topic.id,
        tier,
        text,
      });
      return reply({ item }, 201);
    }

    if (input.action !== "attempt") return reply({ error: "Choose a lab action." }, 400);

    const session = String(input.session ?? "");
    if (!/^[A-Za-z0-9-]{8,64}$/.test(session)) return reply({ error: "Open the station first." }, 400);

    const judgement = judgeLabAttempt(station, tier, {
      step: Number(input.step),
      choice: typeof input.choice === "string" ? input.choice : undefined,
      item: typeof input.item === "string" ? input.item : undefined,
      order: Array.isArray(input.order) ? input.order.filter((value): value is string => typeof value === "string") : undefined,
    });
    if (!judgement) return reply({ error: "That is not an answer this station can take." }, 400);

    const question = labQuestion(station, tier, primaryContentBand(profile.band));
    const event: LearningEvent = eventForQuestion({
      question,
      sessionId: session,
      correct: judgement.correct,
      // The lab has no hint ladder and no adult prompt: the clues are part of the
      // activity, opened by the child, so every attempt here is independent evidence.
      // If a hint is ever added to a station, this is the line that has to change.
      support: "none",
      response: judgement.distractor ?? undefined,
      errorKind: judgement.errorKind,
      latencyMs: latency(typeof input.startedAt === "number" ? input.startedAt : null),
      // The lab's content lives in `lib/science/`, not in the published Supabase
      // catalogue, so its events are stamped with the code version rather than the
      // catalogue's. Item health (WP-06) then compares lab stations only against other
      // runs of the same authored station, which is the comparison that means something.
      catalogueVersion: CODE_CATALOGUE_VERSION,
    });

    // The mastery blob is a cache over the event stream (§D5), but it is the cache the
    // recommender and the older parent views still read, so the lab keeps it current
    // rather than leaving science permanently behind the rest of the record.
    recordAttempt(profile.skillMastery, question, session, judgement.correct, true);
    if (judgement.result.finished) profile.stars += 1;

    const saved = await saveExplorers([{ profile, revision: row.revision }], false, null, [event]);
    if (!saved) {
      return reply({ error: "Your lab changed in another window. Refresh to keep your place." }, 409);
    }

    return reply({ result: judgement.result, stars: profile.stars });
  } catch (error) {
    if (error instanceof RequestBodyError) return reply({ error: error.message }, error.status);
    console.error("Lab attempt failed", error);
    return reply({ error: "Your discovery could not be saved. Keep this page open and try again." }, 503);
  }
}

export const GET = withFamily(get);
export const POST = withFamily(post);
