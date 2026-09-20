import test from "node:test";
import assert from "node:assert/strict";
import { loadTs } from "./load-typescript.mjs";

const {
  verbForActivity, verbForReadingActivity, supportFrom, latency,
  eventForQuestion, isValidEvent, validEvents, learningVerbs,
} = loadTs("lib/learning-events");
const { projectMastery, masteryFromEvents, missingEvidence } = loadTs("lib/mastery-projection");
const { recordAttempt } = loadTs("lib/mastery");
const { errorKindFor, errorKindForReading } = loadTs("lib/distractor-reasons");
const { scoresAgainstMastery, teachingMove, errorKinds } = loadTs("lib/error-kinds");
const { questions } = loadTs("lib/curriculum");
const { skillById } = loadTs("lib/skill-graph");

const DAY = 24 * 60 * 60 * 1000;
const at = (offsetMs) => new Date(Date.UTC(2026, 0, 1) + offsetMs).toISOString();

function event(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    sessionId: "session-1",
    occurredAt: at(0),
    skillId: "LIT.PK.PA.INITIAL_01",
    itemId: "item-1",
    verb: "choose",
    phase: "guided",
    correct: true,
    support: "none",
    catalogueVersion: "code-1",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// The vocabulary
// ---------------------------------------------------------------------------

test("every activity type in the bank maps to a verb the database will accept", () => {
  const allowed = new Set(learningVerbs);
  const seen = new Set(questions.map((question) => question.activityType));
  assert.ok(seen.size > 10, "expected the bank to exercise many activity types");
  for (const activityType of seen) {
    const verb = verbForActivity(activityType);
    assert.ok(allowed.has(verb), `${activityType} produced an unknown verb ${verb}`);
  }
});

test("the specialist engines are not all filed as choosing", () => {
  // The whole content argument rests on this distinction being real. If every engine
  // mapped to `choose`, the stream could not tell producing from recognising and the
  // "no more than a quarter multiple choice" target would be unmeasurable.
  const verbs = new Set(questions.map((question) => verbForActivity(question.activityType)));
  assert.ok(verbs.size >= 4, `expected several verbs in the bank, saw ${[...verbs].join(", ")}`);
  assert.ok(verbs.has("build"));
  assert.ok(verbs.has("sort"));
  assert.ok(verbs.has("sequence"));
});

test("reading engines carry their own verbs", () => {
  assert.equal(verbForReadingActivity("sound-boxes"), "build");
  assert.equal(verbForReadingActivity("blend-train"), "sequence");
  assert.equal(verbForReadingActivity("letter-catch"), "choose");
  assert.equal(verbForReadingActivity("story"), "choose");
});

test("support level reflects the scaffolding ladder, not just whether a hint was asked for", () => {
  assert.equal(supportFrom({}), "none");
  assert.equal(supportFrom({ hinted: true }), "hint");
  assert.equal(supportFrom({ hintLevel: 1 }), "hint");
  assert.equal(supportFrom({ hintLevel: 2 }), "scaffold");
  assert.equal(supportFrom({ hintLevel: 3 }), "model");
  assert.equal(supportFrom({ hintLevel: 0, adult: true }), "adult");
});

test("latency is clamped to what the column accepts", () => {
  assert.equal(latency(null), null);
  assert.equal(latency(undefined), null);
  assert.equal(latency(1000, 500), 0, "a clock skew must not produce a negative latency");
  assert.equal(latency(0, 99_999_999), 3_600_000);
  assert.equal(latency(1000, 3500), 2500);
});

// ---------------------------------------------------------------------------
// Validation: one bad row must not roll back a child's session
// ---------------------------------------------------------------------------

test("an event the database would reject is dropped before it gets there", () => {
  assert.ok(isValidEvent(event()));
  assert.ok(!isValidEvent(event({ verb: "guess-the-answer" })));
  assert.ok(!isValidEvent(event({ phase: "later" })));
  assert.ok(!isValidEvent(event({ support: "a-bit" })));
  assert.ok(!isValidEvent(event({ correct: "yes" })));
  assert.ok(!isValidEvent(event({ sessionId: "" })));
  assert.ok(!isValidEvent(event({ skillId: "x".repeat(200) })));
  assert.ok(!isValidEvent(event({ catalogueVersion: "" })));
  assert.ok(!isValidEvent(null));
});

test("validEvents keeps the good rows and drops only the bad one", () => {
  const batch = [event(), event({ verb: "nonsense" }), event()];
  assert.equal(validEvents(batch).length, 2);
});

test("a correct answer never carries a distractor or an error kind", () => {
  const question = questions.find((item) => item.activityType === "sound-choice");
  const built = eventForQuestion({
    question, sessionId: "s", correct: true, support: "none",
    response: "something", errorKind: "guess", catalogueVersion: "code-1",
  });
  assert.equal(built.distractor, null);
  assert.equal(built.errorKind, null);
});

// ---------------------------------------------------------------------------
// The evidence rule (§C2)
// ---------------------------------------------------------------------------

test("a skill is not mastered on correct answers alone, however many", () => {
  // Ten correct taps in one sitting, in one kind of activity. The old model would call
  // this a high score. The evidence rule calls it practice, which is what it is.
  const events = Array.from({ length: 10 }, (_, index) =>
    event({ itemId: `item-${index}`, occurredAt: at(index * 60_000) }));
  const projected = projectMastery(events);
  const record = projected["LIT.PK.PA.INITIAL_01"];
  assert.equal(record.state, "practising");
  assert.ok(record.evidence.independence.met, "ten unsupported successes clear independence");
  assert.ok(!record.evidence.representation.met, "one verb is not two");
  assert.ok(!record.evidence.spacing.met, "one sitting is not a later day");
});

test("all three kinds of evidence together, and only then, make mastery", () => {
  const events = [
    event({ itemId: "a", verb: "choose", occurredAt: at(0) }),
    event({ itemId: "b", verb: "build", occurredAt: at(60_000) }),
    event({ itemId: "c", verb: "build", occurredAt: at(DAY + 60_000) }),
    event({ itemId: "d", verb: "choose", occurredAt: at(DAY + 120_000) }),
  ];
  const record = projectMastery(events)["LIT.PK.PA.INITIAL_01"];
  assert.ok(record.evidence.representation.met, "two verbs");
  assert.ok(record.evidence.spacing.met, "a correct answer a day later");
  assert.ok(record.evidence.independence.met, "two consecutive unsupported");
  assert.equal(record.state, "mastered");
});

test("independence must be consecutive, so a hint resets the run", () => {
  const events = [
    event({ itemId: "a", occurredAt: at(0) }),
    event({ itemId: "b", occurredAt: at(1000), support: "hint" }),
    event({ itemId: "c", verb: "build", occurredAt: at(DAY + 1000) }),
  ];
  const record = projectMastery(events)["LIT.PK.PA.INITIAL_01"];
  assert.equal(record.evidence.independence.consecutive, 1);
  assert.ok(!record.evidence.independence.met);
  assert.equal(record.state, "practising");
});

test("spacing needs a full day, not merely a later timestamp", () => {
  const almost = [
    event({ itemId: "a", verb: "choose", occurredAt: at(0) }),
    event({ itemId: "b", verb: "build", occurredAt: at(DAY - 1000) }),
  ];
  assert.ok(!projectMastery(almost)["LIT.PK.PA.INITIAL_01"].evidence.spacing.met);
  const enough = [
    event({ itemId: "a", verb: "choose", occurredAt: at(0) }),
    event({ itemId: "b", verb: "build", occurredAt: at(DAY) }),
  ];
  assert.ok(projectMastery(enough)["LIT.PK.PA.INITIAL_01"].evidence.spacing.met);
});

test("events arriving out of order are folded in the order they happened", () => {
  // cq_events returns newest first, and an offline replay arrives in whatever order the
  // queue drained. Folding in arrival order would miscount the independence run.
  const ordered = [
    event({ itemId: "a", occurredAt: at(0) }),
    event({ itemId: "b", occurredAt: at(1000), support: "hint" }),
    event({ itemId: "c", occurredAt: at(2000) }),
  ];
  const forwards = projectMastery(ordered)["LIT.PK.PA.INITIAL_01"];
  const backwards = projectMastery([...ordered].reverse())["LIT.PK.PA.INITIAL_01"];
  assert.deepEqual(backwards, forwards);
  assert.equal(forwards.evidence.independence.consecutive, 1);
});

test("a prerequisite gap and an obvious guess never lower a score", () => {
  const base = [event({ itemId: "a", occurredAt: at(0) })];
  const scored = projectMastery(base)["LIT.PK.PA.INITIAL_01"].score;
  for (const errorKind of ["not-yet-taught", "guess"]) {
    const withWrong = projectMastery([
      ...base,
      event({ itemId: "b", occurredAt: at(1000), correct: false, errorKind }),
    ])["LIT.PK.PA.INITIAL_01"];
    assert.equal(withWrong.score, scored, `${errorKind} changed the score`);
    assert.equal(withWrong.attemptCount, 2, `${errorKind} must still be recorded`);
  }
});

test("an ordinary misconception does lower the score", () => {
  const base = [event({ itemId: "a", occurredAt: at(0) })];
  const scored = projectMastery(base)["LIT.PK.PA.INITIAL_01"].score;
  const withWrong = projectMastery([
    ...base,
    event({ itemId: "b", occurredAt: at(1000), correct: false, errorKind: "confusable-sound" }),
  ])["LIT.PK.PA.INITIAL_01"];
  assert.ok(withWrong.score < scored);
});

test("missing evidence is reported in plain words a parent could read", () => {
  const record = projectMastery([event()])["LIT.PK.PA.INITIAL_01"];
  const missing = missingEvidence(record);
  assert.ok(missing.length > 0);
  for (const sentence of missing) {
    assert.ok(!/mastery|skill id|confidence|percentile/i.test(sentence), sentence);
  }
  assert.deepEqual(missingEvidence(undefined), ["has not tried this yet"]);
});

test("events for a skill outside the graph are ignored rather than crashing", () => {
  const projected = projectMastery([event({ skillId: "NOT.A.REAL.SKILL" })]);
  assert.deepEqual(Object.keys(projected), []);
});

// ---------------------------------------------------------------------------
// WP-01 acceptance: the projection reproduces the blob for a seeded child
// ---------------------------------------------------------------------------

test("the projection reproduces the mastery blob for a seeded child", () => {
  // The whole point of WP-01 is that this move is faithful: the numbers come from a
  // different place and are otherwise the same. If this drifts, the blob and the
  // projection are telling a parent two different stories about one child.
  const skillId = "LIT.PK.PA.INITIAL_01";
  const bank = questions.filter((question) => question.skillId === skillId).slice(0, 4);
  assert.ok(bank.length >= 3, "expected several authored items for the seeded skill");

  const script = [
    { correct: true, independent: true, offset: 0 },
    { correct: false, independent: false, offset: 60_000 },
    { correct: true, independent: false, offset: 120_000 },
    { correct: true, independent: true, offset: DAY + 60_000 },
  ];

  const blob = {};
  for (const [index, step] of script.entries()) {
    const question = bank[index % bank.length];
    recordAttempt(blob, question, "session-1", step.correct, step.independent, new Date(at(step.offset)));
  }

  const projected = masteryFromEvents(script.map((step, index) => {
    const question = bank[index % bank.length];
    return {
      sessionId: "session-1",
      occurredAt: at(step.offset),
      skillId,
      itemId: question.id,
      verb: verbForActivity(question.activityType),
      correct: step.correct,
      support: step.independent ? "none" : "hint",
      activityKind: question.engine?.kind ?? "visual-choice",
      contextTags: question.contextTags,
    };
  }));

  const a = blob[skillId];
  const b = projected[skillId];
  assert.ok(a && b);
  for (const field of ["attemptCount", "correctCount", "independentCorrect", "consecutiveIndependent",
                       "retainedReviews", "lastPracticedAt", "nextReviewAt"]) {
    assert.deepEqual(b[field], a[field], `${field} drifted from the blob`);
  }
  assert.ok(Math.abs(b.score - a.score) < 0.05, `score drifted: blob ${a.score}, projection ${b.score}`);
  assert.ok(Math.abs(b.confidence - a.confidence) < 0.05,
    `confidence drifted: blob ${a.confidence}, projection ${b.confidence}`);
  assert.deepEqual([...b.questionIds].sort(), [...a.questionIds].sort());
  assert.deepEqual([...b.activityTypes].sort(), [...a.activityTypes].sort());
  assert.deepEqual([...b.contexts].sort(), [...a.contexts].sort());
});

// ---------------------------------------------------------------------------
// Error kinds (§C3)
// ---------------------------------------------------------------------------

test("b and d read as a shape confusion, m and n as a sound confusion", () => {
  const visual = errorKindFor({
    question: { answer: "d", options: ["d", "b"], activityType: "visual-choice" },
    response: "b",
  });
  assert.equal(visual, "confusable-visual");

  const heard = errorKindFor({
    question: { answer: "m", options: ["m", "n"], activityType: "sound-choice" },
    response: "n",
  });
  assert.equal(heard, "confusable-sound");
});

test("the letter's name where its sound was wanted is its own mistake", () => {
  const kind = errorKindFor({
    question: { answer: "m", options: ["m", "em"], activityType: "sound-choice" },
    response: "em",
  });
  assert.equal(kind, "letter-name-for-sound");
  assert.equal(teachingMove(kind), "sound-not-name");
});

test("a counting slip is told apart from not being able to count", () => {
  assert.equal(errorKindFor({
    question: { answer: "6", options: ["6", "5"], activityType: "number-choice" },
    response: "5",
  }), "off-by-one");
  assert.equal(errorKindFor({
    question: { answer: "6", options: ["6", "2"], activityType: "number-choice" },
    response: "2",
  }), null, "two away is not a slip and must not be excused as one");
});

test("right pieces in the wrong order is a sequencing mistake", () => {
  const kind = errorKindFor({
    question: {
      answer: JSON.stringify(["a", "b", "c"]), options: [], activityType: "ordering",
      engine: { kind: "ordering", items: [{ id: "a" }, { id: "b" }, { id: "c" }], solution: ["a", "b", "c"] },
    },
    response: JSON.stringify(["c", "b", "a"]),
  });
  assert.equal(kind, "sequence-reversed");
  assert.equal(teachingMove(kind), "reorder");
});

test("a prerequisite gap outranks any shape-based inference", () => {
  const kind = errorKindFor({
    question: { answer: "d", options: ["d", "b"], activityType: "visual-choice" },
    response: "b",
    prerequisiteMissing: true,
  });
  assert.equal(kind, "not-yet-taught");
  assert.ok(!scoresAgainstMastery(kind), "a gap we created must never count against a child");
});

test("an author's reason always beats the inference", () => {
  const kind = errorKindFor({
    question: { answer: "d", options: ["d", "b"], activityType: "visual-choice" },
    response: "b",
    authored: [{ value: "b", errorKind: "confusable-sound" }],
  });
  assert.equal(kind, "confusable-sound");
});

test("a fast tap is a guess only when nothing more specific explains it", () => {
  assert.equal(errorKindFor({
    question: { answer: "cat", options: ["cat", "zebra"], activityType: "visual-choice" },
    response: "zebra", latencyMs: 200,
  }), "guess");
  // Speed must not hide a real misconception, which is the one thing worth knowing.
  assert.equal(errorKindFor({
    question: { answer: "d", options: ["d", "b"], activityType: "visual-choice" },
    response: "b", latencyMs: 200,
  }), "confusable-visual");
});

test("every error kind has a teaching move, and only guesses and gaps go unscored", () => {
  for (const kind of errorKinds) {
    assert.ok(teachingMove(kind), `${kind} has no teaching move`);
  }
  assert.ok(!scoresAgainstMastery("guess"));
  assert.ok(!scoresAgainstMastery("not-yet-taught"));
  assert.ok(scoresAgainstMastery("confusable-visual"));
  assert.ok(scoresAgainstMastery(null), "an unclassified wrong answer still counts");
});

test("the reading taxonomy maps onto the shared vocabulary without inventing labels", () => {
  assert.equal(errorKindForReading({
    errorType: "letter_sound_confusion", kind: "letter-catch", target: "d", response: "b",
  }), "confusable-visual");
  assert.equal(errorKindForReading({
    errorType: "vowel_confusion", kind: "blend-train", target: "mat", response: "mut",
  }), "confusable-sound");
  assert.equal(errorKindForReading({
    errorType: "sound_sequence_confusion", kind: "sound-boxes", target: "tap", response: "pat",
  }), "sequence-reversed");
  // No honest equivalent exists for these, so none is invented.
  assert.equal(errorKindForReading({
    errorType: "story_detail_confusion", kind: "story", target: "a", response: "b",
  }), null);
  assert.equal(errorKindForReading({
    errorType: null, kind: "story", target: "a", response: "a",
  }), null);
});

test("every skill the bank references exists in the graph", () => {
  // The event stream keys on skill_id. A typo here would silently drop evidence,
  // because the projection ignores skills it cannot find.
  for (const question of questions) {
    assert.ok(skillById.has(question.skillId), `${question.id} references unknown ${question.skillId}`);
  }
});
