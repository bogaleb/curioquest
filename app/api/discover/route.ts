import { withFamily } from "@/lib/backend/context";
import { readExplorer, readLearningEvents, saveExplorers } from "@/lib/backend/repository";
import { familyAuthorized } from "@/lib/parent-security";
import { normalizeExplorer } from "@/lib/explorers";
import { requestJson, RequestBodyError } from "@/lib/request-json";
import { scheduleMessage } from "@/lib/learning-controls";
import { eventForQuestion, latency } from "@/lib/learning-events";
import { recordAttempt } from "@/lib/mastery";
import { CODE_CATALOGUE_VERSION } from "@/lib/catalogue-version";
import { discoveryItemId, discoveryQuestion, judgeDiscovery, publicDiscoveries } from "@/lib/discover/engine";

const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
const uuid = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export const GET = withFamily(async (request) => {
  if (!(await familyAuthorized(request))) return reply({ error: "Open your family workspace first." }, 403);
  const row = await readExplorer(new URL(request.url).searchParams.get("profile") ?? "");
  if (!row) return reply({ error: "Choose an explorer first." }, 404);
  const profile = normalizeExplorer(JSON.parse(row.data));
  const history = await readLearningEvents(profile.id);
  const practiced = new Map<string, string>();
  for (const event of history) {
    if (event.correct && event.item_id.startsWith("discovery:") && !practiced.has(event.item_id)) practiced.set(event.item_id, event.occurred_at);
  }
  return reply({ band: profile.band, lessons: publicDiscoveries(profile.band, practiced) });
});

export const POST = withFamily(async (request) => {
  try {
    if (!(await familyAuthorized(request))) return reply({ error: "Open your family workspace first." }, 403);
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) return reply({ error: "Request not allowed." }, 403);
    const input = await requestJson(request, 8000);
    if (!uuid(input.attempt) || !uuid(input.session) || typeof input.lesson !== "string") return reply({ error: "Open a discovery and try again." }, 400);
    const row = await readExplorer(String(input.profile ?? ""));
    if (!row) return reply({ error: "Choose an explorer first." }, 404);
    const profile = normalizeExplorer(JSON.parse(row.data));
    const scheduled = scheduleMessage(profile.controls);
    if (profile.preferences.paused || scheduled) return reply({ error: scheduled ?? "A grown-up has paused play for now." }, 403);
    const result = judgeDiscovery(input.lesson, profile.band, input.response);
    if (!result) return reply({ error: "Finish your answer, then try again." }, 400);
    const history = await readLearningEvents(profile.id);
    const previous = history.find((event) => event.id === input.attempt);
    // Retry after a lost response returns the original verdict without adding evidence.
    if (previous) {
      if (previous.item_id !== discoveryItemId(input.lesson, profile.band) || previous.session_id !== input.session || previous.correct !== result.correct) return reply({ error: "That attempt has already been used. Please try a new answer." }, 409);
      return reply({ ...result, practicedAt: previous.correct ? previous.occurred_at : null });
    }
    const question = discoveryQuestion(input.lesson, profile.band);
    const event = eventForQuestion({
      id: input.attempt, question, sessionId: input.session, correct: result.correct,
      // The explanation was available just before this activity. This is guided
      // practice, even if the child did not ask for another hint. Never award mastery.
      support: "model", response: (input.response as number[]).join(","),
      latencyMs: latency(typeof input.startedAt === "number" ? input.startedAt : null), catalogueVersion: CODE_CATALOGUE_VERSION,
    });
    recordAttempt(profile.skillMastery, question, input.session, result.correct, false);
    const saved = await saveExplorers([{ profile, revision: row.revision }], false, null, [event]);
    if (!saved) return reply({ error: "Another activity just saved. Your answer is still here; try checking it again." }, 409);
    return reply({ ...result, practicedAt: result.correct ? event.occurredAt : null });
  } catch (error) {
    if (error instanceof RequestBodyError) return reply({ error: error.message }, error.status);
    return reply({ error: "We could not save your practice. Keep your answer here and try again." }, 503);
  }
});
