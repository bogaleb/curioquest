import test from "node:test";
import assert from "node:assert/strict";
import { loadTs } from "./load-typescript.mjs";

const { questions } = loadTs("lib/curriculum");
const { arcadeGames, arcadeQuestionIds } = loadTs("lib/arcade");
const { skillById } = loadTs("lib/skill-graph");
const { learningBands } = loadTs("lib/learning-bands");
const { gameDesigns, gameFit, fitLabel, difficultyLabel, difficultyDots } = loadTs("lib/game-design");

const BANDS = ["prek", "grade1"];

/** Recompute from the curriculum what lib/game-design.ts restates as literals. */
function actual(gameId, contentBand) {
  const skills = new Set();
  const difficulties = [];
  for (let level = 0; level < 3; level++) {
    for (const id of arcadeQuestionIds(contentBand, gameId, level)) {
      const question = questions.find((q) => q.id === id);
      if (!question) continue;
      skills.add(question.skillId);
      const skill = skillById.get(question.skillId);
      if (skill) difficulties.push(skill.difficulty);
    }
  }
  const mean = difficulties.reduce((sum, n) => sum + n, 0) / difficulties.length;
  return { skillIds: [...skills].sort(), difficulty: Math.round(mean * 100) / 100 };
}

test("every game in the Game Zone has a design entry", () => {
  for (const game of arcadeGames) {
    assert.ok(gameDesigns[game.id], `${game.id} is playable but has no design entry`);
  }
  // And nothing is described that a child cannot actually reach.
  const playable = new Set(arcadeGames.map((game) => game.id));
  for (const id of Object.keys(gameDesigns)) {
    assert.ok(playable.has(id), `${id} has a design entry but is not in the Game Zone`);
  }
});

test("declared skills match the skills each game actually serves", () => {
  for (const game of arcadeGames) {
    for (const band of BANDS) {
      assert.deepEqual(
        gameDesigns[game.id].skillIds[band],
        actual(game.id, band).skillIds,
        `${game.id}/${band}: lib/game-design.ts claims skills the questions do not practise`,
      );
    }
  }
});

test("declared difficulty matches the skills each game actually serves", () => {
  for (const game of arcadeGames) {
    for (const band of BANDS) {
      assert.equal(
        gameDesigns[game.id].difficulty[band],
        actual(game.id, band).difficulty,
        `${game.id}/${band}: stated difficulty has drifted from the curriculum`,
      );
    }
  }
});

test("every declared skill exists in the skill graph", () => {
  for (const [id, design] of Object.entries(gameDesigns)) {
    for (const band of BANDS) {
      for (const skillId of design.skillIds[band]) {
        assert.ok(skillById.get(skillId), `${id} names unknown skill ${skillId}`);
      }
    }
  }
});

test("instructions describe a real interaction and can be read aloud", () => {
  for (const [id, design] of Object.entries(gameDesigns)) {
    assert.ok(design.howToPlay.length >= 3, `${id} needs at least three steps`);
    assert.ok(design.objective.length > 30, `${id} objective is too thin to be checkable`);
    assert.ok(design.goal.length > 10, `${id} has no child-facing goal`);
    for (const step of design.howToPlay) {
      // A step a pre-reader has to sit through is a step they stop listening to.
      assert.ok(step.split(" ").length <= 18, `${id} step is too long to narrate: "${step}"`);
      assert.match(step, /[.?!]$/, `${id} step should be a sentence: "${step}"`);
    }
  }
});

test("no band is shown a playground where nothing fits", () => {
  // The fit signal is only useful if it varies. A band for which every game reads
  // "a big stretch" would be telling a child they do not belong here.
  for (const band of learningBands) {
    const contentBand = band.contentBands[0];
    const fits = arcadeGames.map((game) =>
      gameFit(gameDesigns[game.id].difficulty[contentBand], band),
    );
    assert.ok(
      fits.some((fit) => fit !== "stretch"),
      `${band.id} finds every game a stretch`,
    );
  }
});

test("fit and difficulty wording is defined for every value", () => {
  for (const fit of ["practice", "just-right", "stretch"]) {
    const { label, note } = fitLabel(fit);
    assert.ok(label && note, `${fit} has no wording`);
  }
  for (const difficulty of [1, 1.5, 1.6, 2.2, 2.3, 3]) {
    assert.ok(difficultyLabel(difficulty));
    const dots = difficultyDots(difficulty);
    assert.ok(dots >= 1 && dots <= 3, `${difficulty} produced ${dots} dots`);
  }
});
