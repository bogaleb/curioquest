import test from "node:test";
import assert from "node:assert/strict";
import { loadTs } from "./load-typescript.mjs";

const { questions } = loadTs("lib/curriculum");
const { arcadeGames, arcadeQuestionIds } = loadTs("lib/arcade");
const { learningBands, resolveBand } = loadTs("lib/learning-bands");
const {
  engineLoad, rampWeight, rampOrder, roundLength, roundSizes, roundPosition,
  readArc, answerQuality, pointsFor, scoreAnswer, missionStars, missionRank, EMPTY_ARC,
} = loadTs("lib/game-loop");

const CONTENT_BANDS = ["prek", "grade1"];
const missionQuestions = (grade, gameId, level) =>
  arcadeQuestionIds(grade, gameId, level).map((id) => questions.find((q) => q.id === id));

/* ---------------------------------------------------------------- the ramp */

test("every mission's questions exist and can be weighted", () => {
  // rampOrder runs against the real catalogue in the route, so a missing id would be a
  // crash in a child's face rather than a test failure.
  for (const grade of CONTENT_BANDS) {
    for (const game of arcadeGames) {
      for (let level = 0; level < 3; level++) {
        const mission = missionQuestions(grade, game.id, level);
        assert.equal(mission.length, 4, `${grade}/${game.id}/${level}`);
        for (const question of mission) {
          assert.ok(question, `${grade}/${game.id}/${level} has a missing question`);
          assert.ok(Number.isFinite(rampWeight(question)), `${question.id} has no weight`);
        }
      }
    }
  }
});

test("the ramp never drops, duplicates or invents a question", () => {
  for (const grade of CONTENT_BANDS) {
    for (const game of arcadeGames) {
      for (let level = 0; level < 3; level++) {
        const mission = missionQuestions(grade, game.id, level);
        const ordered = rampOrder(mission);
        assert.deepEqual(
          ordered.map((q) => q.id).slice().sort(),
          mission.map((q) => q.id).slice().sort(),
          `${grade}/${game.id}/${level}`,
        );
      }
    }
  }
});

test("a mission never opens with its hardest question", () => {
  // The point of the ramp. A mission that starts at its peak teaches a child that this
  // game is not for them, before they have had a chance to find out otherwise.
  for (const grade of CONTENT_BANDS) {
    for (const game of arcadeGames) {
      for (let level = 0; level < 3; level++) {
        const ordered = rampOrder(missionQuestions(grade, game.id, level));
        const weights = ordered.map(rampWeight);
        assert.deepEqual(weights, weights.slice().sort((a, b) => a - b), `${grade}/${game.id}/${level}`);
      }
    }
  }
});

test("equal weights keep their authored order rather than being shuffled", () => {
  const same = [
    { id: "a", skillId: "nope", options: ["1", "2"] },
    { id: "b", skillId: "nope", options: ["1", "2"] },
    { id: "c", skillId: "nope", options: ["1", "2"] },
  ];
  assert.deepEqual(rampOrder(same).map((q) => q.id), ["a", "b", "c"]);
});

test("at least one real mission is actually reordered", () => {
  // Guards against the ramp being a no-op dressed as a feature. If the catalogue ever
  // flattens so completely that nothing reorders, that is worth knowing.
  let reordered = 0;
  for (const grade of CONTENT_BANDS) {
    for (const game of arcadeGames) {
      for (let level = 0; level < 3; level++) {
        const mission = missionQuestions(grade, game.id, level);
        const ordered = rampOrder(mission);
        if (ordered.some((q, i) => q.id !== mission[i].id)) reordered += 1;
      }
    }
  }
  assert.ok(reordered > 0, "the ramp reorders no mission at all");
});

test("engine load reads the thing that actually makes an engine hard", () => {
  assert.ok(
    engineLoad({ kind: "route", size: 4, start: 0, goal: 15, rocks: [5, 6], maxMoves: 6 }) >
      engineLoad({ kind: "route", size: 4, start: 0, goal: 5, rocks: [], maxMoves: 2 }),
    "a longer route through more rocks should weigh more",
  );
  assert.ok(
    engineLoad({ kind: "memory", sequence: ["a", "b", "c"], choices: [] }) >
      engineLoad({ kind: "memory", sequence: ["a", "b"], choices: [] }),
    "a longer sequence should weigh more",
  );
  assert.equal(engineLoad(undefined, ["a", "b", "c"]), 3, "choice questions fall back to their options");
  assert.equal(engineLoad(undefined), 0);
});

/* --------------------------------------------------------------- the rounds */

test("younger bands get shorter rounds than older ones", () => {
  // Wave 09's age adaptation, as a monotonic property rather than a table to keep in sync.
  const lengths = learningBands.map((band) => roundLength(band));
  for (let i = 1; i < lengths.length; i++) {
    assert.ok(lengths[i] >= lengths[i - 1], `band ${learningBands[i].id} has a shorter round than a younger band`);
  }
  assert.ok(lengths[lengths.length - 1] > lengths[0], "the oldest band should sustain a longer round than the youngest");
});

test("rounds always account for every question, and never leave a straggler", () => {
  for (const band of learningBands) {
    for (let total = 1; total <= 12; total++) {
      const sizes = roundSizes(total, band);
      assert.equal(sizes.reduce((a, b) => a + b, 0), total, `${band.id}/${total} loses questions`);
      assert.ok(sizes.every((size) => size >= 1), `${band.id}/${total} has an empty round`);
      assert.ok(
        Math.max(...sizes) - Math.min(...sizes) <= 1,
        `${band.id}/${total} is lopsided: ${sizes.join("+")}`,
      );
      assert.ok(
        Math.max(...sizes) <= roundLength(band),
        `${band.id}/${total} exceeds the band's round length`,
      );
    }
  }
});

test("a four-question mission breaks in half for the youngest and runs straight for the oldest", () => {
  assert.deepEqual(roundSizes(4, resolveBand("early-preschool")), [2, 2]);
  assert.deepEqual(roundSizes(4, resolveBand("grade3")), [4]);
});

test("roundSizes survives a session with no questions", () => {
  assert.deepEqual(roundSizes(0, resolveBand("prek")), []);
});

test("the round position walks every question exactly once, in order", () => {
  for (const band of learningBands) {
    const total = 4;
    const sizes = roundSizes(total, band);
    const seen = [];
    for (let index = 0; index < total; index++) {
      const place = roundPosition(index, total, band);
      assert.equal(place.rounds, sizes.length, `${band.id} disagrees about how many rounds there are`);
      assert.equal(place.steps, sizes[place.round - 1], `${band.id} disagrees about round ${place.round}'s length`);
      seen.push(`${place.round}.${place.step}`);
    }
    const expected = sizes.flatMap((size, round) =>
      Array.from({ length: size }, (_, step) => `${round + 1}.${step + 1}`));
    assert.deepEqual(seen, expected, band.id);
  }
});

test("a round break is announced at the end of every round but the last", () => {
  // Announcing one after the final question would promise a breather that never comes.
  for (const band of learningBands) {
    const total = 4;
    const breaks = Array.from({ length: total }, (_, i) => roundPosition(i, total, band).roundEnd);
    assert.equal(breaks[total - 1], false, `${band.id} announces a break after the last question`);
    assert.equal(
      breaks.filter(Boolean).length,
      roundSizes(total, band).length - 1,
      `${band.id} announces the wrong number of breaks`,
    );
  }
});

/* ------------------------------------------------------------- the scoring */

test("solving it alone and first time is worth the most; persistence still scores", () => {
  assert.equal(answerQuality(0, 0), "clean");
  assert.equal(answerQuality(0, 2), "supported");
  assert.equal(answerQuality(3, 0), "persevered");
  assert.equal(answerQuality(3, 3), "persevered");
  assert.ok(pointsFor("clean") > pointsFor("supported"));
  assert.ok(pointsFor("supported") > pointsFor("persevered"));
  assert.ok(pointsFor("persevered") > 0, "a child who got there in the end scored nothing");
});

test("a streak counts clean answers in a row and survives being beaten", () => {
  let arc = EMPTY_ARC;
  for (let i = 0; i < 3; i++) arc = scoreAnswer(arc, 0, 0);
  assert.equal(arc.streak, 3);
  arc = scoreAnswer(arc, 1, 0); // a wrong answer somewhere in there
  assert.equal(arc.streak, 0, "the streak should end");
  assert.equal(arc.bestStreak, 3, "but the mission should remember it happened");
  assert.equal(arc.clean, 3);
});

test("help ends a streak without erasing the work behind it", () => {
  let arc = scoreAnswer(scoreAnswer(EMPTY_ARC, 0, 0), 0, 0);
  arc = scoreAnswer(arc, 0, 2);
  assert.equal(arc.streak, 0);
  assert.equal(arc.bestStreak, 2);
  assert.equal(arc.points, 3 + 3 + 2);
});

test("no mission can now pay fewer stars than it did before the loop existed", () => {
  // The flat award was total * 2. The arc is allowed to add and never to subtract; a
  // hard-won mission paying less than it used to is the wrong lesson for this product.
  for (let total = 1; total <= 8; total++) {
    let worst = EMPTY_ARC;
    for (let i = 0; i < total; i++) worst = scoreAnswer(worst, 4, 3);
    assert.equal(missionStars(worst, total), total * 2, `total ${total}`);

    let best = EMPTY_ARC;
    for (let i = 0; i < total; i++) best = scoreAnswer(best, 0, 0);
    assert.ok(missionStars(best, total) > missionStars(worst, total), `total ${total} rewards nothing`);
  }
});

test("a flawless run is worth meaningfully more, and an empty session is worth nothing", () => {
  let best = EMPTY_ARC;
  for (let i = 0; i < 4; i++) best = scoreAnswer(best, 0, 0);
  assert.equal(missionStars(best, 4), 8 + 4 + 2);
  assert.equal(missionStars(EMPTY_ARC, 0), 0);
});

test("the rank never tells a child they did badly", () => {
  const ranks = [
    missionRank(EMPTY_ARC, 4),
    missionRank(scoreAnswer(EMPTY_ARC, 2, 1), 4),
    missionRank({ points: 9, clean: 3, streak: 3, bestStreak: 3 }, 4),
    missionRank({ points: 12, clean: 4, streak: 4, bestStreak: 4 }, 4),
  ];
  for (const rank of ranks) {
    assert.ok(rank.label.length > 0 && rank.note.length > 0);
    assert.ok(
      !/fail|wrong|bad|poor|slow|try harder/i.test(`${rank.label} ${rank.note}`),
      `a rank reads as a verdict: ${rank.label} — ${rank.note}`,
    );
  }
  assert.equal(ranks[3].label, "Perfect run");
  assert.notEqual(ranks[0].label, ranks[3].label, "finishing and a perfect run should not read the same");
});

/* ------------------------------------------------------ stored arcs are data */

test("a stored arc is sanitised rather than trusted", () => {
  // Sessions come back from the database, so this is the same posture as normalizeArcade.
  assert.deepEqual(readArc(undefined), EMPTY_ARC);
  assert.deepEqual(readArc(null), EMPTY_ARC);
  assert.deepEqual(readArc("cheat"), EMPTY_ARC);
  assert.deepEqual(readArc([3, 3, 3, 3]), EMPTY_ARC);
  assert.deepEqual(readArc({ points: -5, clean: 1.7, streak: "2", bestStreak: null }), {
    points: 0, clean: 1, streak: 2, bestStreak: 2,
  });
  assert.deepEqual(readArc({ points: 9, clean: 3, streak: 3, bestStreak: 1 }).bestStreak, 3,
    "a best streak below the live streak is incoherent and should be corrected upward");
});

test("a mission parked before the loop existed resumes as a fresh arc, not a crash", () => {
  const legacy = { id: "x", index: 2, misses: 0 };
  assert.deepEqual(readArc(legacy.arc), EMPTY_ARC);
  assert.equal(missionStars(readArc(legacy.arc), 4), 8, "and still pays the old flat award");
});
