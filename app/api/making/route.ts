import { withFamily } from "@/lib/backend/context";
import { readExplorer, saveExplorers } from "@/lib/backend/repository";
import { familyAuthorized } from "@/lib/parent-security";
import { requestJson, RequestBodyError } from "@/lib/request-json";
import { normalizeExplorer } from "@/lib/explorers";
import { scheduleMessage } from "@/lib/learning-controls";
import { CODE_CATALOGUE_VERSION } from "@/lib/catalogue-version";
import { eventForQuestion, latency, type LearningEvent } from "@/lib/learning-events";
import { recordAttempt } from "@/lib/mastery";
import { primaryContentBand } from "@/lib/learning-bands";
import { itemsFor } from "@/lib/workspace-store";
import {
  checkTrace,
  groupsForTier,
  promptFor,
  publicPages,
  tasksForTier,
  tierForBand,
  traceAdvice,
  writingGroupById,
} from "@/lib/studio/studio";
import { writingQuestion } from "@/lib/studio/studio-events";
import type { StrokePoint } from "@/lib/studio/types";

/**
 * The Making Place's server route.
 *
 * Two jobs, and the second is the reason it exists at all.
 *
 * **It resolves the studio to a child's age.** Which colouring pages they are offered,
 * which letters, which words and sentences, which invitation is on the door today. The
 * old studio shipped the same twenty-six pages and the same eight "challenges" to a
 * three-year-old and a nine-year-old.
 *
 * **It judges a traced letter, and records it.** Handwriting was the one part of the old
 * studio that was genuinely teaching something, and the product learned nothing from it:
 * a child could trace every capital in the alphabet and the parent report would not know.
 * A trace is checked here — started in the right place, went the right way, stayed near
 * the line — and every attempt writes a `learning_event` against a real writing skill
 * (§A), in the same transaction as the profile save.
 *
 * Saving artwork stays on `/api/workspace`, which already owns collection limits, the
 * parent export and deletion. Splitting that would have given families two places their
 * children's pictures could go.
 */

const reply = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store" } });

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
    const gallery = await itemsFor(profile.id, "art");

    return reply({
      tier,
      pages: publicPages(tier),
      // Titles and notes resolved here so the child layer never carries a tier lookup,
      // and so the three voices cannot drift between the server and the browser.
      writing: groupsForTier(tier).map((group) => ({
        id: group.id,
        title: group.title[tier],
        note: group.note[tier],
        characters: group.characters,
      })),
      tasks: tasksForTier(tier).map((task) => ({
        id: task.id,
        kind: task.kind,
        prompt: task.prompt[tier],
        seed: task.seed,
        art: task.art,
      })),
      invitation: (() => {
        const prompt = promptFor(tier, gallery.length);
        return { id: prompt.id, text: prompt.text[tier], art: prompt.art };
      })(),
      gallery,
    });
  } catch {
    return reply({ error: "The making place could not be opened. Please try again." }, 503);
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

    const input = await requestJson(request, 20000);
    if (input.action !== "trace") return reply({ error: "Choose a making action." }, 400);

    const row = await readExplorer(String(input.profile ?? ""));
    if (!row) return reply({ error: "Choose an explorer." }, 404);
    const profile = normalizeExplorer(JSON.parse(row.data));

    // The same pause and schedule rules every other child surface obeys.
    if (profile.preferences.paused || scheduleMessage(profile.controls)) {
      return reply(
        { error: scheduleMessage(profile.controls) ?? "A grown-up can start play again in Parent Corner." },
        403,
      );
    }

    const tier = tierForBand(profile.band);
    const group = writingGroupById.get(String(input.group ?? ""));
    if (!group || !group.tiers.includes(tier)) {
      return reply({ error: "That writing set is not open for this explorer." }, 404);
    }
    const character = group.characters.find((entry) => entry.key === String(input.character ?? ""));
    if (!character) return reply({ error: "Choose a letter to write." }, 404);

    const strokeIndex = Number(input.stroke);
    if (!Number.isInteger(strokeIndex) || strokeIndex < 0 || strokeIndex >= character.strokes.length) {
      return reply({ error: "Choose a stroke of this letter." }, 400);
    }
    const stroke = character.strokes[strokeIndex];

    const points = Array.isArray(input.points) ? input.points : [];
    // One point is allowed: the dot on an i is a tap rather than a stroke, and the
    // checker decides which kind of target it is looking at.
    if (points.length < 1 || points.length > 500) {
      return reply({ error: "Draw along the whole trail." }, 400);
    }
    const drawn: StrokePoint[] = [];
    for (const entry of points) {
      if (!Array.isArray(entry) || entry.length !== 2) return reply({ error: "That is not a trace." }, 400);
      const [x, y] = entry;
      if (typeof x !== "number" || typeof y !== "number" || !Number.isFinite(x) || !Number.isFinite(y)) {
        return reply({ error: "That is not a trace." }, 400);
      }
      drawn.push([x, y]);
    }

    const session = String(input.session ?? "");
    if (!/^[A-Za-z0-9-]{8,64}$/.test(session)) return reply({ error: "Open the writing desk first." }, 400);

    const result = checkTrace(stroke, drawn, tier);

    const question = writingQuestion(group, character, strokeIndex, primaryContentBand(profile.band));
    const event: LearningEvent = eventForQuestion({
      question,
      sessionId: session,
      correct: result.ok,
      // The trail, the green dot and the spoken cue are all on screen the whole time, so
      // a trace is never unaided in the way an answer is. `model` is the honest support
      // level: the child is copying a demonstration that is still in front of them.
      support: "model",
      response: result.fault ?? undefined,
      // A trace that went the wrong way is a formation fault, not a misconception; none
      // of the §C3 error kinds describe it, and inventing one to fill the column would
      // put nonsense into the item-health query.
      errorKind: null,
      latencyMs: latency(typeof input.startedAt === "number" ? input.startedAt : null),
      catalogueVersion: CODE_CATALOGUE_VERSION,
    });

    recordAttempt(profile.skillMastery, question, session, result.ok, false);

    const saved = await saveExplorers([{ profile, revision: row.revision }], false, null, [event]);
    if (!saved) {
      return reply({ error: "Your writing changed in another window. Refresh to keep your place." }, 409);
    }

    return reply({
      ok: result.ok,
      fault: result.fault,
      coverage: Math.round(result.coverage * 100) / 100,
      advice: traceAdvice(result, stroke),
      strokeIndex,
      /** True when that was the last stroke and it landed. */
      finished: result.ok && strokeIndex === character.strokes.length - 1,
    });
  } catch (error) {
    if (error instanceof RequestBodyError) return reply({ error: error.message }, error.status);
    console.error("Writing trace failed", error);
    return reply({ error: "Your writing could not be saved. Keep this page open and try again." }, 503);
  }
}

export const GET = withFamily(get);
export const POST = withFamily(post);
