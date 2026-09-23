import test from "node:test";
import assert from "node:assert/strict";
import { loadTs } from "./load-typescript.mjs";

const { buildLevels, buildWorkshops, levelsFor } = loadTs("lib/build/levels");
const { judgeBuild, runRobot, towerFalls, dropHeight, gridRef } = loadTs("lib/build/engine");
const { skillGraph } = loadTs("lib/skill-graph");

const R = (cmd, times = 1) => ({ cmd, times });
const tiles = (entries) => Object.fromEntries(entries.map(([c, r, t]) => [`${c},${r}`, t]));
const colours = (entries) => Object.fromEntries(entries.map(([c, r, t]) => [`${c},${r}`, t]));
const row = (r, from, to, t) => Array.from({ length: to - from + 1 }, (_, i) => [from + i, r, t]);
const block = (x, y, w) => ({ x, y, w });

/** A working build for every level. A level with no solution here fails the first test. */
const solutions = {
  "robot-roll-home": { workshop: "robot", program: [R("right"), R("right"), R("right")] },
  "robot-round-rock": { workshop: "robot", program: [R("down"), R("right"), R("right"), R("up")] },
  "robot-gem": { workshop: "robot", program: [R("up"), R("up"), R("right"), R("right")] },
  "robot-maze": { workshop: "robot", program: [R("right"), R("right"), R("up"), R("up"), R("up"), R("up"), R("right"), R("right")] },
  "robot-fix-it": { workshop: "robot", program: [R("right"), R("up"), R("right"), R("right"), R("down"), R("right")] },
  "robot-gem-run": { workshop: "robot", program: [R("right"), R("right"), R("down"), R("down"), R("right"), R("right")] },
  "robot-drive": { workshop: "robot", program: [R("forward", 3), R("turn-left"), R("forward", 3)] },
  "robot-staircase": { workshop: "robot", program: [R("forward", 2), R("turn-right"), R("forward", 2), R("turn-left"), R("forward", 2), R("turn-right"), R("forward", 2)] },
  "robot-debug-turns": { workshop: "robot", program: [R("forward", 3), R("turn-right"), R("forward", 3)] },

  "map-island": { workshop: "map", tiles: tiles([...row(2, 2, 3, "land"), [2, 1, "tree"]]) },
  "map-lake": { workshop: "map", tiles: tiles(row(2, 2, 3, "water")) },
  "map-beside": { workshop: "map", tiles: tiles([[3, 1, "house"]]) },
  "map-road-school": { workshop: "map", tiles: tiles([[1, 1, "road"], ...row(2, 1, 4, "road")]) },
  "map-north": { workshop: "map", tiles: tiles([[2, 1, "tree"]]) },
  "map-east-west": { workshop: "map", tiles: tiles([[4, 1, "park"], [0, 1, "shop"]]) },
  "map-river-bridge": { workshop: "map", tiles: tiles([[1, 2, "road"], [2, 2, "road"], [3, 2, "bridge"], [4, 2, "road"], [5, 2, "road"]]) },
  "map-treasure": { workshop: "map", tiles: tiles([[3, 2, "treasure"]]) },
  "map-river": { workshop: "map", tiles: tiles(row(2, 0, 6, "water")) },
  "map-island-lake": { workshop: "map", tiles: tiles([...row(1, 1, 5, "land"), ...row(2, 1, 5, "land"), ...row(3, 1, 5, "land"), ...row(4, 1, 5, "land"), [3, 2, "water"]]) },
  "map-town-plan": { workshop: "map", tiles: tiles([[1, 1, "school"], [1, 3, "park"]]) },

  "tower-three": { workshop: "tower", blocks: [block(2, 0, 1), block(2, 1, 1), block(2, 2, 1)] },
  "tower-predict-wide": { workshop: "tower", blocks: null, prediction: "stand" },
  "tower-predict-overhang": { workshop: "tower", blocks: null, prediction: "fall" },
  "tower-stream": { workshop: "tower", blocks: [block(2, 0, 3)] },
  "tower-five": { workshop: "tower", blocks: [0, 1, 2, 3, 4].map((y) => block(3, y, 1)) },
  "tower-predict-balance": { workshop: "tower", blocks: null, prediction: "stand" },
  "tower-wide-river": { workshop: "tower", blocks: [block(1, 0, 2), block(4, 0, 2), block(2, 1, 3)] },
  "tower-reach": { workshop: "tower", blocks: [block(1, 0, 3), block(2, 1, 3)] },
  "tower-predict-counterweight": { workshop: "tower", blocks: null, prediction: "fall" },

  "shapes-ab-pattern": { workshop: "shapes", cells: colours([[2, 0, "red"], [3, 0, "blue"], [4, 0, "red"], [5, 0, "blue"]]) },
  "shapes-count": { workshop: "shapes", cells: colours([[0, 0, "red"], [1, 0, "red"], [2, 0, "red"], [0, 1, "blue"], [1, 1, "blue"]]) },
  "shapes-square": { workshop: "shapes", cells: colours([[1, 1, "yellow"], [2, 1, "yellow"], [1, 2, "yellow"], [2, 2, "yellow"]]) },
  "shapes-rectangle-6": { workshop: "shapes", cells: colours([...row(1, 1, 3, "green"), ...row(2, 1, 3, "green")]) },
  "shapes-butterfly": { workshop: "shapes", cells: colours([[3, 0, "blue"], [4, 1, "blue"], [3, 1, "yellow"], [5, 2, "blue"], [3, 2, "blue"], [3, 3, "yellow"]]) },
  "shapes-half": { workshop: "shapes", cells: colours(row(1, 1, 4, "red")) },
  "shapes-abb": { workshop: "shapes", cells: colours([3, 4, 5, 6, 7, 8].map((c) => [c, 0, c % 3 === 0 ? "yellow" : "green"])) },
  "shapes-quarter": { workshop: "shapes", cells: colours(row(1, 1, 3, "blue")) },
  "shapes-area-perimeter": { workshop: "shapes", cells: colours([1, 2, 3].flatMap((r) => row(r, 1, 4, "green"))) },
  "shapes-same-area": { workshop: "shapes", cells: colours(row(2, 1, 6, "yellow")) },
  "shapes-mirror-big": { workshop: "shapes", cells: colours([[4, 0, "red"], [5, 1, "blue"], [4, 1, "yellow"], [6, 2, "blue"], [5, 2, "blue"], [4, 2, "blue"], [4, 3, "red"], [5, 4, "red"], [7, 2, "yellow"]]) },
};

const submission = (level) => {
  const s = solutions[level.id];
  if (s?.workshop === "tower" && s.blocks === null) return { ...s, blocks: level.fixed };
  if (s?.workshop === "tower") return { ...s, blocks: [...level.fixed, ...s.blocks] };
  return s;
};

test("every level has a working solution that the server's judge accepts", () => {
  for (const level of buildLevels) {
    const s = submission(level);
    assert.ok(s, `${level.id} has no solution in the test`);
    const verdict = judgeBuild(level, s);
    assert.ok(verdict, `${level.id}: solution rejected as malformed`);
    assert.equal(verdict.correct, true, `${level.id}: ${verdict.message}`);
  }
});

test("an empty or wrong build is not accepted", () => {
  for (const level of buildLevels) {
    const empty =
      level.workshop === "robot" ? { workshop: "robot", program: [R(level.mode === "arrows" ? "left" : "turn-left")] }
      : level.workshop === "map" ? { workshop: "map", tiles: {} }
      : level.workshop === "tower" ? { workshop: "tower", blocks: level.fixed, prediction: level.rule.kind === "predict" ? (solutions[level.id].prediction === "stand" ? "fall" : "stand") : undefined }
      : { workshop: "shapes", cells: {} };
    const verdict = judgeBuild(level, empty);
    assert.ok(verdict, `${level.id}: empty build treated as malformed`);
    assert.equal(verdict.correct, false, `${level.id} accepts doing nothing`);
    assert.ok(verdict.message.length > 10);
  }
});

test("debug levels start with a program that fails, and every level's evidence has a real active skill", () => {
  const skills = new Map(skillGraph.map((s) => [s.id, s]));
  for (const level of buildLevels) {
    const skill = skills.get(level.skillId);
    assert.ok(skill?.active, `${level.id} → ${level.skillId}`);
    if (level.workshop === "robot" && level.starter) {
      assert.notEqual(runRobot(level, level.starter).outcome, "goal", `${level.id} starter already works`);
      assert.ok(level.starter.length <= level.maxSteps);
    }
    for (const part of ["goal", "idea", "hint", "success"]) for (const tier of level.tiers) assert.ok(level[part][tier]?.length > 5, `${level.id}.${part}.${tier}`);
  }
});

test("every workshop has levels for every age tier", () => {
  for (const workshop of buildWorkshops) for (const tier of ["explorer", "investigator", "scientist"]) {
    assert.ok(levelsFor(workshop.id, tier).length >= 2, `${workshop.id} has too few ${tier} levels`);
  }
});

test("tower physics: a centred stack stands, an overhang past its support falls, a deck on two piers stands", () => {
  assert.equal(towerFalls({ gaps: [] }, [block(2, 0, 1), block(2, 1, 1)]).size, 0);
  assert.equal(towerFalls({ gaps: [] }, [block(2, 0, 1), block(2, 1, 3)]).size, 2, "the whole stack topples");
  assert.equal(towerFalls({ gaps: [3] }, [block(1, 0, 1), block(4, 0, 1), block(1, 1, 4)]).size, 0);
  assert.equal(towerFalls({ gaps: [2, 3, 4] }, [block(2, 0, 3)]).size, 1, "a block with no ground under it falls");
  assert.equal(dropHeight([block(1, 0, 3)], 2, 1), 1);
  assert.deepEqual(gridRef("C3"), [2, 2]);
});

test("the judge refuses malformed builds instead of recording them", () => {
  const robot = buildLevels.find((l) => l.id === "robot-drive");
  assert.equal(judgeBuild(robot, { workshop: "robot", program: [R("up")] }), null, "arrows in a turns level");
  assert.equal(judgeBuild(robot, { workshop: "map", tiles: {} }), null, "wrong workshop");
  const river = buildLevels.find((l) => l.id === "map-river-bridge");
  assert.equal(judgeBuild(river, { workshop: "map", tiles: { "3,2": "road" } }), null, "a road on the water");
  const stream = buildLevels.find((l) => l.id === "tower-stream");
  const halfway = judgeBuild(stream, { workshop: "tower", blocks: [block(3, 0, 2)] });
  assert.equal(halfway.correct, false, "a block hanging off one bank is not a bridge");
  assert.equal(halfway.errorKind, "one-bank");
  const tower = buildLevels.find((l) => l.id === "tower-three");
  assert.equal(judgeBuild(tower, { workshop: "tower", blocks: [block(2, 3, 1)] }), null, "a floating block");
});
