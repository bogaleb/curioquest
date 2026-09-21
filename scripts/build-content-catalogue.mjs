/**
 * Migrate the bundled catalogue into `content.*`, as a version-controlled migration.
 *
 *   node scripts/build-content-catalogue.mjs
 *
 * Reads `lib/skill-graph.ts` and `lib/curriculum.ts` — the two files WP-05 turns into
 * loaders — and writes `supabase/migrations/20260920000500_content_seed.sql`.
 *
 * Why a generator rather than a hand-written migration: the bank is 523 items produced
 * by loops over word lists. Hand-copying them into SQL would be a transcription
 * exercise with a transcription error rate, and the next content change would have to be
 * made twice. Generating means the migration can be regenerated and diffed, which is
 * also how it gets reviewed.
 *
 * Three decisions worth stating, because each one is a judgement rather than a mapping:
 *
 * 1. **Existing items are seeded `published`, not `draft`.** §C4's gate says only
 *    published content is served, and these items are what children are being served
 *    today. Marking the whole bank draft on the way in would empty the product on
 *    migration day, which is not a stricter reading of the rule — it is an outage.
 *
 * 2. **Distractor reasons are seeded from the inference where it has one, and left null
 *    where it does not.** WP-04 allowed a mechanical first pass and built one; it has an
 *    opinion about 82 of the 428 wrong answers here. Writing `guess` over the other 346
 *    would be a lie the product then acts on, because `guess` never counts against a
 *    mastery score — mislabelling would quietly stop recording real misconceptions. Null
 *    falls through to the runtime inference exactly as today, and both backlogs (no
 *    reason written, a machine-written reason) stay countable in the studio.
 *
 * 3. **One lesson per (skill, difficulty rung).** The bundled bank has no lesson layer
 *    at all — §C4 introduces it. Inventing plausible lesson groupings would be fiction;
 *    grouping by the rung the bank already encodes is the honest reading of what is
 *    there, and it gives an author real rows to split, rename and write models for.
 *
 * 4. **An item's bands are the bands that can actually hold it.** This is the one place
 *    the migration disagrees with the running app. Today a three-year-old and a
 *    six-year-old both draw on the "prek" pool, and 151 of its 256 prompts are longer
 *    than the eight words §C5 allows on an early-preschool screen. Writing
 *    `bands: [early-preschool, ...]` on those rows would record a claim the content does
 *    not support. So each item declares the bands whose word budget it fits, and the
 *    four prompts that no band in their pool can hold are seeded `draft` — which is the
 *    copy rule doing its job on migration day rather than a year later.
 *
 *    What a child is served does not change: the recommender still selects by the
 *    legacy grade pool, as WP-05 requires. `bands` is the authored truth the publish
 *    validator checks, and the gap between the two is now visible instead of implied.
 */
import { writeFileSync } from "node:fs";
import { loadTs } from "../tests/load-typescript.mjs";

const { skillGraph } = loadTs("lib/skill-graph");
const { questions } = loadTs("lib/curriculum");
const { errorKindFor } = loadTs("lib/distractor-reasons");
const { verbForActivity } = loadTs("lib/learning-events");
const { learningBands } = loadTs("lib/learning-bands");
const { validateCatalogue, describeProblem } = loadTs("lib/catalogue/model");

const OUT = process.argv.includes("--out")
  ? process.argv[process.argv.indexOf("--out") + 1]
  : "supabase/migrations/20260920000500_content_seed.sql";

const q = (value) => (value === null || value === undefined ? "null" : "'" + String(value).replaceAll("'", "''") + "'");
const json = (value) => q(JSON.stringify(value ?? null)) + "::jsonb";
const arr = (values) =>
  values.length ? "array[" + values.map(q).join(",") + "]::text[]" : "'{}'::text[]";

/** The bands that draw on this legacy pool first (`primaryContentBand`). */
const poolFor = (grade) =>
  learningBands.filter((band) => band.contentBands[0] === grade);

const countWords = (text) => String(text ?? "").trim().split(/\s+/).filter(Boolean).length;

/**
 * The bands an item can honestly be offered to.
 *
 * Its pool, narrowed to the bands whose on-screen word budget the prompt fits (§C5).
 * Returns an empty list where nothing in the pool can hold it, which the caller treats
 * as a reason to hold the item back rather than as a reason to widen the rule.
 */
const bandsForItem = (question) =>
  poolFor(question.grade)
    .filter((band) => countWords(question.prompt) <= band.delivery.maxPromptWords)
    .map((band) => band.id);

/** The most generous band in the pool: where a too-long prompt is parked for rewriting. */
const widestBand = (grade) =>
  poolFor(grade).reduce((widest, band) =>
    band.delivery.maxPromptWords > widest.delivery.maxPromptWords ? band : widest).id;

/**
 * What a child would call this skill.
 *
 * The graph only has an adult name. Rather than invent a voice for 78 skills in a
 * generator — which is authoring, and belongs to a person in the studio — this lowercases
 * the adult name and drops the trailing classification. It reads as a placeholder because
 * it is one, and the studio shows which skills still carry it.
 */
const childName = (skill) =>
  skill.name.replace(/^[A-Z]/, (letter) => letter.toLowerCase()).replace(/\s*\(.*\)$/, "");

const lessonId = (skillId, level) => `${skillId}.L${level}`;

// ---------------------------------------------------------------------------

const lines = [];
const say = (line) => lines.push(line);

/**
 * The catalogue document, assembled alongside the SQL.
 *
 * Emitting a migration and then hoping it publishes is how a content pipeline breaks on
 * a Friday. The same rows are handed to `validateCatalogue` before anything is written,
 * so a seed that could not be published is never produced in the first place — the
 * generator and `cq_content_write('publish')` apply one rulebook, not two.
 */
const document = { version: 1, label: "migrated from the bundle", skills: [], lessons: [], items: [], assets: [], episodes: [] };

say("-- WP-05: the bundled catalogue, migrated into `content.*`.");
say("--");
say("-- Generated by `node scripts/build-content-catalogue.mjs`. Do not hand-edit: change");
say("-- the generator, or make the change in the studio, which is the point of the package.");
say("--");
say(`-- ${skillGraph.length} skills, ${questions.length} items. Existing content is seeded`);
say("-- `published` because it is what children are being served today; seeding it `draft`");
say("-- would empty the product on migration day. Distractor reasons come from the WP-04");
say("-- inference and are flagged `reviewed = false`, which is the studio's work queue.");
say("begin;");
say("");

// --- skills ---------------------------------------------------------------

say("-- Skills (§C4 `Skill`). `child_name` is a mechanical placeholder for every row here;");
say("-- naming a skill in Nova's voice is authoring, and the studio flags the ones still");
say("-- carrying the generated form.");
for (const skill of skillGraph) {
  const bands = [...new Set(skill.gradeBands.flatMap((grade) => poolFor(grade).map((band) => band.id)))];
  document.skills.push({
    id: skill.id, subject: skill.subject, strand: skill.strand, name: skill.name,
    childName: childName(skill), description: skill.description,
    prerequisites: skill.prerequisites, bands, evidenceTarget: skill.evidenceTarget,
    active: skill.active,
  });
  say(
    "insert into content.skills(id,subject,strand,name,child_name,description,prerequisites,bands,evidence_target,active) values(" +
      [
        q(skill.id),
        q(skill.subject),
        q(skill.strand),
        q(skill.name),
        q(childName(skill)),
        q(skill.description),
        arr(skill.prerequisites),
        arr(bands),
        String(skill.evidenceTarget),
        String(skill.active),
      ].join(",") +
      ") on conflict(id) do update set subject=excluded.subject,strand=excluded.strand," +
      "name=excluded.name,description=excluded.description,prerequisites=excluded.prerequisites," +
      "bands=excluded.bands,evidence_target=excluded.evidence_target,active=excluded.active;",
  );
}
say("");

// --- lessons --------------------------------------------------------------

const lessons = new Map();
for (const question of questions) {
  const id = lessonId(question.skillId, question.level);
  if (lessons.has(id)) continue;
  const skill = skillGraph.find((node) => node.id === question.skillId);
  if (!skill) continue;
  lessons.set(id, {
    id,
    skillId: question.skillId,
    title: `${skill.name} — step ${question.level}`,
    childTitle: childName(skill),
    position: question.level,
    // A lesson is published exactly when its skill is live, because its items already
    // are. An unpublished lesson holding published items fails validation, which is the
    // rule doing its job rather than a special case to be worked around here.
    reviewStatus: skill.active ? "published" : "draft",
  });
}

say("-- Lessons (§C4 `Lesson`). The bundled bank has no lesson layer; these are the");
say("-- difficulty rungs it already encodes, made into rows an author can split and name.");
say("-- `model` is null everywhere: nobody has written the worked example yet, and a");
say("-- generated one would be a placeholder pretending to be teaching.");
for (const lesson of lessons.values()) {
  if (lesson.reviewStatus === "published") document.lessons.push({ ...lesson, model: null });
  say(
    "insert into content.lessons(id,skill_id,title,child_title,model,position,review_status) values(" +
      [
        q(lesson.id),
        q(lesson.skillId),
        q(lesson.title),
        q(lesson.childTitle),
        "null",
        String(lesson.position),
        q(lesson.reviewStatus),
      ].join(",") +
      ") on conflict(id) do update set title=excluded.title,child_title=excluded.child_title," +
      "position=excluded.position,review_status=excluded.review_status;",
  );
}
say("");

// --- items ----------------------------------------------------------------

let reasoned = 0;
let unreasoned = 0;
const verbs = new Map();
const reach = new Map();
/** Items whose prompt is longer than every band in their pool allows (§C5). */
const held = [];

say("-- Items (§C4 `Item`), with their wrong answers and the reason each one is wrong.");
for (const question of questions) {
  const skill = skillGraph.find((node) => node.id === question.skillId);
  if (!skill) continue;
  const id = lessonId(question.skillId, question.level);
  if (!lessons.has(id)) continue;

  const verb = verbForActivity(question.activityType);
  verbs.set(verb, (verbs.get(verb) ?? 0) + 1);

  const fits = bandsForItem(question);
  const heldBack = fits.length === 0;
  if (heldBack) held.push([question.id, countWords(question.prompt)]);
  const bands = heldBack ? [widestBand(question.grade)] : fits;
  for (const band of bands) reach.set(band, (reach.get(band) ?? 0) + (heldBack ? 0 : 1));

  const delivery = {
    activityType: question.activityType,
    contextTags: question.contextTags ?? [],
    estimatedMinutes: question.estimatedMinutes ?? 2,
    grade: question.grade,
    level: question.level,
    subject: question.subject,
    options: question.options ?? [],
  };
  if (question.engine) delivery.engine = question.engine;
  if (question.visual) delivery.visual = question.visual;
  if (question.passage) delivery.passage = question.passage;
  if (question.audioLabel) delivery.audioLabel = question.audioLabel;
  if (question.campaignOnly) delivery.campaignOnly = true;

  const reviewStatus = skill.active && !heldBack ? "published" : "draft";
  // The WP-04 inference, run once here rather than on every wrong answer forever. Where
  // it has no opinion the row is still written with a null reason: the wrong answer
  // exists and is countable, and nobody has yet said why a child picks it.
  const wrongAnswers = (question.options ?? [])
    .filter((option) => option !== question.answer)
    .map((value, index) => {
      const errorKind = errorKindFor({ question, response: value }) ?? null;
      if (errorKind) reasoned += 1;
      else unreasoned += 1;
      return { value, errorKind, reviewed: false, position: index };
    });
  if (reviewStatus === "published") {
    document.items.push({
      id: question.id,
      lessonId: id,
      skillId: question.skillId,
      verb,
      phase: question.phase ?? "independent",
      bands,
      prompt: { en: question.prompt },
      hint: { en: question.hint ?? "" },
      explanation: { en: question.explanation ?? "" },
      answer: question.answer,
      distractors: wrongAnswers.map(({ value, errorKind, reviewed }) => ({ value, errorKind, reviewed })),
      assets: [],
      delivery,
      reviewStatus,
    });
  }

  say(
    "insert into content.items(id,lesson_id,skill_id,verb,phase,bands,prompt,hint,explanation,answer,assets,delivery,review_status,source) values(" +
      [
        q(question.id),
        q(id),
        q(question.skillId),
        q(verb),
        q(question.phase ?? "independent"),
        arr(bands),
        json({ en: question.prompt }),
        json({ en: question.hint ?? "" }),
        json({ en: question.explanation ?? "" }),
        q(question.answer),
        "'[]'::jsonb",
        json(delivery),
        // Published because it is live today, unless no band in its pool can hold the
        // prompt — see note 4 in the header.
        q(reviewStatus),
        q("generated"),
      ].join(",") +
      ") on conflict(id) do update set lesson_id=excluded.lesson_id,skill_id=excluded.skill_id," +
      "verb=excluded.verb,phase=excluded.phase,bands=excluded.bands,prompt=excluded.prompt," +
      "hint=excluded.hint,explanation=excluded.explanation,answer=excluded.answer," +
      "delivery=excluded.delivery,review_status=excluded.review_status;",
  );

  for (const { value, errorKind: kind, position: index } of wrongAnswers) {
    say(
      "insert into content.item_distractors(item_id,value,error_kind,reviewed,position) values(" +
        [q(question.id), q(value), kind ? q(kind) : "null", "false", String(index)].join(",") +
        ") on conflict(item_id,value) do update set error_kind=excluded.error_kind,position=excluded.position;",
    );
  }
}
say("");

// --- first published version ---------------------------------------------

say("-- The first published version, assembled from what was just seeded.");
say("--");
say("-- Publishing here rather than leaving it to a person means the app switches to the");
say("-- database catalogue the moment this migration runs, instead of silently falling back");
say("-- to the bundle until someone notices and presses a button.");
say("do $$ declare document jsonb; v integer; begin");
say("  document := content.cq_snapshot(true);");
say("  if jsonb_array_length(document->'items') = 0 then");
say("    raise exception 'Seed produced no published items';");
say("  end if;");
say("  v := nextval(pg_get_serial_sequence('content.catalogue_versions','version'));");
say("  document := jsonb_set(document, '{version}', to_jsonb(v));");
say("  document := jsonb_set(document, '{label}', to_jsonb('migrated from the bundle'::text));");
say("  update content.catalogue_versions set is_current = false where is_current;");
say("  insert into content.catalogue_versions(version,label,snapshot,item_count,skill_count,lesson_count,notes,is_current)");
say("  overriding system value");
say("  values (v, 'migrated from the bundle', document, jsonb_array_length(document->'items'),");
say("    jsonb_array_length(document->'skills'), jsonb_array_length(document->'lessons'),");
say("    'Seeded from lib/curriculum.ts and lib/skill-graph.ts by scripts/build-content-catalogue.mjs.', true);");
say("end $$;");
say("");
say("update private.backend_metadata set version = '202609200005';");
say("commit;");
say("");

// The gate. What this migration would publish has to survive the same validator the
// studio's publish button runs, so a seed that could not be published is never written
// in the first place: one rulebook, applied in both places.
const problems = validateCatalogue(document);
const errors = problems.filter((problem) => problem.severity === "error");
if (errors.length) {
  console.error(`Refusing to write ${OUT}: the seeded catalogue would fail publish validation.`);
  for (const problem of errors.slice(0, 25)) console.error("  " + describeProblem(problem));
  if (errors.length > 25) console.error(`  ...and ${errors.length - 25} more`);
  process.exit(1);
}

writeFileSync(OUT, lines.join("\n"));

for (const [id, length] of held) {
  console.warn(`  held back: ${id} (${length} words, longer than any band in its pool allows)`);
}

const verbSummary = [...verbs.entries()]
  .sort((a, b) => b[1] - a[1])
  .map(([verb, count]) => `${verb} ${count}`)
  .join(", ");
const warnings = problems.filter((problem) => problem.severity === "warning");
console.log(`Wrote ${OUT}`);
console.log(`  publish validation: 0 errors, ${warnings.length} warnings`);
console.log(`  ${skillGraph.length} skills, ${lessons.size} lessons, ${questions.length} items`);
console.log(`  ${reasoned} distractor reasons inferred, ${unreasoned} left for a person to write`);
console.log(`  verbs: ${verbSummary}`);
const choose = verbs.get("choose") ?? 0;
console.log(
  `  ${Math.round((choose / questions.length) * 100)}% of the migrated bank is tap-one-of-three; §C1 wants that under 25%.`,
);
console.log(
  "  reach: " +
    learningBands
      .map((band) => `${band.id} ${reach.get(band.id) ?? 0}`)
      .join(", "),
);
