import test from "node:test";
import assert from "node:assert/strict";
import { loadTs } from "./load-typescript.mjs";

const studio = loadTs("lib/studio/studio");
const {
  colouringPages, fillablePieces, pagesForTier, publicPage, publicPages,
  paletteFor, colourById, studioColours,
  promptsForTier, promptFor,
  writingGroups, groupsForTier, tasksForTier, allWritingCharacters, writingLines,
  checkTrace, traceAdvice, toolsFor, sizesFor, tierForBand, pageComplete, pageProgress,
} = studio;
const { labTiers } = loadTs("lib/science/types");
const { skillById } = loadTs("lib/skill-graph");
const { writingQuestion } = loadTs("lib/studio/studio-events");
const { isValidEvent, eventForQuestion } = loadTs("lib/learning-events");
const { artSchema } = loadTs("lib/workspace-content");
const { STAMP_SHAPES } = loadTs("lib/studio/canvas");

/**
 * The shape catalogue lives in the child layer, which the TypeScript loader here cannot
 * execute (it is a `.tsx` with JSX in it). The drawings are typed
 * `Record<PieceShape, string>`, so TypeScript already guarantees every shape has one;
 * what is checked here is the other direction — that the pages and the stamps only name
 * shapes the type union allows, which is what the compiler cannot see through a string.
 */
const SHAPES = new Set([
  "circle", "oval", "blob", "egg", "pear", "teardrop",
  "square", "rounded", "triangle", "diamond", "arch", "stripe", "crescent",
  "petal", "leaf", "stem", "trunk", "bush", "grass",
  "ear", "earRound", "eye", "pupil", "beak", "nose", "mouth", "wing", "fin",
  "tail", "tailCurl", "paw", "horn", "spot", "shell", "spike", "whisker",
  "roof", "window", "door", "wheel", "flag", "chimney", "sail", "cloudPuff",
  "star", "heart", "sun", "ray", "wave", "bubble", "flame", "snowCrystal",
]);

/* ------------------------------------------------------------- the colouring book */

test("every page is built from shapes that exist and colours that exist", () => {
  for (const page of colouringPages) {
    for (const piece of page.pieces) {
      assert.ok(SHAPES.has(piece.shape), `${page.id}/${piece.id} names unknown shape "${piece.shape}"`);
      assert.ok(colourById.has(piece.tone), `${page.id}/${piece.id} names unknown colour "${piece.tone}"`);
    }
  }
});

test("every part of every page has a name a child could be asked for", () => {
  for (const page of colouringPages) {
    for (const piece of page.pieces) {
      assert.ok(piece.name.length > 2, `${page.id}/${piece.id} has no name`);
      // The name is read aloud and is the region's accessible name, so it has to be a
      // thing rather than an index. "shape 4" is the failure this catches.
      assert.ok(!/^\s*(shape|piece|part)\s*\d/i.test(piece.name), `${page.id}/${piece.id} is named by number`);
    }
  }
});

test("every page sits inside its field and has something to colour", () => {
  for (const page of colouringPages) {
    assert.ok(fillablePieces(page).length >= 4, `${page.id} has too little to colour`);
    for (const piece of page.pieces) {
      assert.ok(piece.x >= 0 && piece.x <= 200, `${page.id}/${piece.id} is off the page horizontally`);
      assert.ok(piece.y >= 0 && piece.y <= 220, `${page.id}/${piece.id} is off the page vertically`);
      assert.ok(piece.w > 0 && piece.h > 0, `${page.id}/${piece.id} has no size`);
    }
  }
});

test("the book is a book, not a handful of pages", () => {
  assert.ok(colouringPages.length >= 20, `only ${colouringPages.length} pages`);
  const themes = new Set(colouringPages.map((page) => page.theme));
  assert.ok(themes.size >= 6, `only ${themes.size} kinds of picture`);
  for (const tier of labTiers) {
    assert.ok(pagesForTier(tier).length >= 18, `${tier} is offered only ${pagesForTier(tier).length} pages`);
  }
});

test("a page knows when it is finished, and counts only what can be coloured", () => {
  const page = colouringPages[0];
  const regions = fillablePieces(page);
  assert.equal(pageComplete(page, {}), false);
  assert.deepEqual(pageProgress(page, {}), { done: 0, total: regions.length });

  const fills = Object.fromEntries(regions.map((piece) => [piece.id, "tomato"]));
  assert.equal(pageComplete(page, fills), true);
  // A detail line is not a region, so colouring one must not count towards the total.
  const detail = page.pieces.find((piece) => piece.detail);
  if (detail) {
    assert.equal(pageProgress(page, { ...fills, [detail.id]: "sky" }).total, regions.length);
  }
});

/* -------------------------------------------------------------------- the colours */

test("no colour is a raw value, and every one has a name", () => {
  for (const colour of studioColours) {
    assert.ok(colour.token.startsWith("--"), `${colour.id} is not a token`);
    assert.ok(!/#[0-9a-f]{3,8}/i.test(colour.token), `${colour.id} carries a raw colour`);
    assert.ok(colour.name.length > 2, `${colour.id} has no name`);
  }
});

test("the paint box grows with age, and paper is always in it", () => {
  const explorer = paletteFor("explorer");
  const investigator = paletteFor("investigator");
  const scientist = paletteFor("scientist");
  assert.ok(explorer.length >= 8 && explorer.length < investigator.length);
  assert.ok(investigator.length < scientist.length);
  for (const tier of labTiers) {
    assert.ok(paletteFor(tier).some((colour) => colour.id === "paper"), `${tier} cannot undo a fill`);
  }
});

test("the tools and sizes narrow for the youngest hands", () => {
  assert.ok(toolsFor("explorer").length < toolsFor("scientist").length);
  for (const tier of labTiers) {
    // The paint pot is what makes a colouring page work. It is never the tool that is
    // dropped to make a younger child's toolbar shorter.
    assert.ok(toolsFor(tier).includes("fill"), `${tier} has no paint pot`);
    assert.ok(toolsFor(tier).includes("eraser"), `${tier} cannot undo a mark`);
    assert.ok(sizesFor(tier).length >= 2);
  }
});

/* -------------------------------------------------------------------- the writing */

test("every writing set files its evidence under a real, active skill", () => {
  for (const group of writingGroups) {
    const skill = skillById.get(group.skillId);
    assert.ok(skill, `${group.id} names unknown skill ${group.skillId}`);
    assert.equal(skill.subject, "reading");
    assert.ok(skill.active, `${group.id} points at an inactive skill`);
  }
});

test("the desk teaches lowercase, capitals and numerals, and starts with strokes", () => {
  const ids = writingGroups.map((group) => group.id);
  assert.deepEqual(ids[0], "warmups", "warm-ups come first, before any letter");
  for (const wanted of ["lowercase", "capitals", "numerals"]) {
    assert.ok(ids.includes(wanted), `no ${wanted} in the writing desk`);
  }
  const lowercase = writingGroups.find((group) => group.id === "lowercase");
  assert.equal(lowercase.characters.length, 26, "the lowercase alphabet is incomplete");
  const capitals = writingGroups.find((group) => group.id === "capitals");
  assert.equal(capitals.characters.length, 26, "the capital alphabet is incomplete");
  assert.equal(writingGroups.find((group) => group.id === "numerals").characters.length, 10);
});

test("lowercase is taught by movement, not by alphabet", () => {
  const keys = writingGroups.find((group) => group.id === "lowercase").characters.map((entry) => entry.key);
  assert.notDeepEqual(keys, [...keys].sort(), "the lowercase set is in alphabetical order");
  // The round family shares one hand movement, so c has to come before the letters
  // built out of it. That ordering is the whole reason the set is not alphabetical.
  for (const later of ["a", "d", "g", "q"]) {
    assert.ok(keys.indexOf("c") < keys.indexOf(later), `c is taught after ${later}`);
  }
});

test("every stroke has a spoken cue and stays on the page", () => {
  for (const character of allWritingCharacters) {
    assert.ok(character.spoken.length > 1, `${character.key} has nothing to say`);
    for (const [index, stroke] of character.strokes.entries()) {
      assert.ok(stroke.cue.length > 8, `${character.key} stroke ${index} has no cue`);
      assert.ok(stroke.points.length >= 2, `${character.key} stroke ${index} is a single point`);
      for (const [x, y] of stroke.points) {
        assert.ok(x >= -2 && x <= 102, `${character.key} stroke ${index} runs off the side`);
        assert.ok(y >= 0 && y <= 102, `${character.key} stroke ${index} runs off the page`);
      }
    }
  }
});

test("tall letters are tall and hanging letters hang", () => {
  const { ascender, midline, baseline, descender } = writingLines;
  const lowercase = writingGroups.find((group) => group.id === "lowercase");
  const top = (key) =>
    Math.min(...lowercase.characters.find((entry) => entry.key === key).strokes.flatMap((s) => s.points.map((p) => p[1])));
  const bottom = (key) =>
    Math.max(...lowercase.characters.find((entry) => entry.key === key).strokes.flatMap((s) => s.points.map((p) => p[1])));

  // Height is most of what makes handwriting legible, and it is the thing a dotted
  // letter floating in empty space cannot teach.
  for (const tall of ["b", "d", "h", "k", "l"]) {
    assert.ok(top(tall) <= ascender + 2, `${tall} does not reach the top line`);
  }
  for (const small of ["a", "c", "e", "o", "n"]) {
    assert.ok(top(small) >= midline - 4, `${small} is drawn too tall`);
    assert.ok(bottom(small) <= baseline + 3, `${small} hangs below the line`);
  }
  for (const hanging of ["g", "j", "p", "q", "y"]) {
    assert.ok(bottom(hanging) > baseline + 2, `${hanging} does not hang below the line`);
    assert.ok(bottom(hanging) <= descender + 2, `${hanging} hangs too far`);
  }
});

/* ------------------------------------------------------------------- the checking */

test("tracing the stroke exactly passes at every age", () => {
  for (const character of allWritingCharacters) {
    for (const [index, stroke] of character.strokes.entries()) {
      for (const tier of labTiers) {
        const result = checkTrace(stroke, stroke.points, tier);
        assert.equal(result.ok, true, `${character.key}/${index} fails its own stroke for ${tier}`);
        assert.equal(result.fault, null);
      }
    }
  }
});

test("starting in the wrong place is caught, and named", () => {
  const down = writingGroups[0].characters.find((entry) => entry.key === "down").strokes[0];
  // The same line, traced from the bottom up: identical on paper, wrong to write.
  const backwards = [...down.points].reverse();
  const result = checkTrace(down, backwards, "investigator");
  assert.equal(result.ok, false);
  assert.equal(result.fault, "start", "a letter written upside down is not a start fault");
  assert.match(traceAdvice(result, down), /green dot/);
});

test("going the wrong way is caught even when the shape is right", () => {
  const circle = writingGroups[0].characters.find((entry) => entry.key === "circle").strokes[0];
  const reversed = [...circle.points].reverse();
  // A circle starts and ends in the same place, so the start check cannot catch this
  // one. Direction is the only thing that tells the two apart.
  const result = checkTrace(circle, reversed, "investigator");
  assert.equal(result.ok, false);
  assert.equal(result.fault, "direction");
  assert.match(traceAdvice(result, circle), /other way/);
});

test("stopping half way is caught as a gap rather than passed", () => {
  const down = writingGroups[0].characters.find((entry) => entry.key === "down").strokes[0];
  const half = down.points.slice(0, Math.floor(down.points.length / 2));
  const result = checkTrace(down, half, "scientist");
  assert.equal(result.ok, false);
  assert.equal(result.fault, "gap");
  assert.ok(result.coverage > 0 && result.coverage < 1);
});

test("the dot on an i is a tap, not a drag", () => {
  const lowercase = writingGroups.find((group) => group.id === "lowercase");
  const dot = lowercase.characters.find((entry) => entry.key === "i").strokes[1];
  // One touch, in the right place. Asking a child to drag across a two-unit target
  // would be teaching the wrong movement.
  assert.equal(checkTrace(dot, [dot.points[0]], "explorer").ok, true);
  assert.equal(checkTrace(dot, [[10, 90]], "explorer").ok, false);
  assert.match(traceAdvice(checkTrace(dot, [[10, 90]], "explorer"), dot), /dot/);
});

test("a scribble is never accepted, and a dot is not a trace", () => {
  const down = writingGroups[0].characters.find((entry) => entry.key === "down").strokes[0];
  const scribble = Array.from({ length: 40 }, (_, index) => [20 + (index % 5) * 3, 20 + ((index * 7) % 11)]);
  assert.equal(checkTrace(down, scribble, "explorer").ok, false);
  assert.equal(checkTrace(down, [[50, 10]], "explorer").fault, "short");
});

test("the youngest hand is forgiven more than the oldest", () => {
  const down = writingGroups[0].characters.find((entry) => entry.key === "down").strokes[0];
  // The same wobbly line: acceptable at three, not at eight.
  const wobbly = down.points.map(([x, y], index) => [x + (index % 2 ? 15 : -15), y]);
  assert.equal(checkTrace(down, wobbly, "explorer").ok, true);
  assert.equal(checkTrace(down, wobbly, "scientist").ok, false);
});

/* ---------------------------------------------------------------- words, prompts */

test("every word and sentence task points at a real writing skill", () => {
  for (const tier of labTiers) {
    const tasks = tasksForTier(tier);
    assert.ok(tasks.length >= 4, `${tier} is offered only ${tasks.length} writing tasks`);
    for (const task of tasks) {
      const skill = skillById.get(task.skillId);
      assert.ok(skill && skill.active, `${task.id} names an unusable skill`);
      assert.ok(task.prompt[tier].length > 6, `${task.id} has no prompt for ${tier}`);
      assert.ok(SHAPES.has(task.art), `${task.id} names unknown art "${task.art}"`);
    }
  }
});

test("an invitation is offered at every age and does not re-roll under a child", () => {
  for (const tier of labTiers) {
    assert.ok(promptsForTier(tier).length >= 6, `${tier} has too few invitations`);
    for (const prompt of promptsForTier(tier)) {
      assert.ok(SHAPES.has(prompt.art), `${prompt.id} names unknown art "${prompt.art}"`);
      assert.ok(prompt.text[tier].length > 10, `${prompt.id} says nothing to a ${tier}`);
    }
    // Deterministic from the gallery count, so a prompt a child walked away from is the
    // same one when they come back.
    assert.equal(promptFor(tier, 3).id, promptFor(tier, 3).id);
    assert.equal(promptFor(tier, 3).id, promptFor(tier, 3 + promptsForTier(tier).length).id);
  }
});

/* --------------------------------------------------------------------- the record */

test("age changes what the studio hands a child", () => {
  const explorer = publicPages("explorer");
  const scientist = publicPages("scientist");
  assert.ok(scientist.length >= explorer.length);
  assert.ok(groupsForTier("explorer").length >= 3);

  // The same page, said three ways. A tier that repeats itself is a tier nobody wrote.
  const page = colouringPages.find((entry) => entry.tiers.length === 3);
  const said = labTiers.map((tier) => publicPage(page, tier).invitation);
  assert.equal(new Set(said).size, 3, `${page.id} says the same thing to every age`);
});

test("every traced stroke produces an event the database will accept", () => {
  for (const group of writingGroups) {
    for (const character of group.characters) {
      for (const [index] of character.strokes.entries()) {
        const question = writingQuestion(group, character, index, "prek");
        const event = eventForQuestion({
          question,
          sessionId: "studio-session",
          correct: true,
          support: "model",
          catalogueVersion: "code-1",
        });
        assert.ok(isValidEvent(event), `${character.key}/${index} produces an event the database would reject`);
        assert.equal(event.verb, "build", "forming a letter is production, not choosing");
        assert.equal(event.skillId, group.skillId);
        assert.equal(question.answer, "", "the writing shim carries an answer key");
      }
    }
  }
});

test("an item id is per stroke, so a half-formed letter is visible", () => {
  const lowercase = writingGroups.find((group) => group.id === "lowercase");
  const b = lowercase.characters.find((entry) => entry.key === "b");
  const first = writingQuestion(lowercase, b, 0, "prek").id;
  const second = writingQuestion(lowercase, b, 1, "prek").id;
  assert.notEqual(first, second, "both strokes of b are recorded under one id");
});

/* ------------------------------------------------------------------- the artwork */

test("a saved piece of work is valid whichever room it came from", () => {
  const page = colouringPages[0];
  const coloured = artSchema.safeParse({
    title: page.title,
    mode: "coloring",
    template: page.id,
    page: page.id,
    fills: Object.fromEntries(fillablePieces(page).map((piece) => [piece.id, "tomato"])),
    marks: [],
  });
  assert.equal(coloured.success, true, coloured.error?.issues?.[0]?.message);

  const drawn = artSchema.safeParse({
    title: "My picture",
    mode: "drawing",
    marks: [{ tool: "crayon", color: "sunflower", size: 14, points: [[10, 10], [20, 20]] }],
  });
  assert.equal(drawn.success, true, drawn.error?.issues?.[0]?.message);

  // Work saved before the rebuild holds a hex. Those pictures are a family's own and
  // must keep loading rather than being quietly repainted to the nearest named colour.
  const legacy = artSchema.safeParse({
    title: "An older picture",
    mode: "drawing",
    marks: [{ tool: "pencil", color: "#253d52", size: 8, points: [[1, 1]] }],
  });
  assert.equal(legacy.success, true);

  // A stamp is a shape now, not an emoji.
  const stamped = artSchema.safeParse({
    title: "Stars",
    mode: "drawing",
    marks: [{ tool: "stamp", color: "sunflower", size: 14, points: [[5, 5]], stamp: "snowCrystal" }],
  });
  assert.equal(stamped.success, true);
});

test("every stamp a drawing can use is a shape that exists", () => {
  for (const shape of STAMP_SHAPES) {
    assert.ok(SHAPES.has(shape), `the ${shape} stamp has no drawing`);
  }
});

test("a band maps to the voice the studio writes for", () => {
  assert.equal(tierForBand("prek"), "explorer");
  assert.equal(tierForBand("grade1"), "investigator");
  assert.equal(tierForBand("grade3"), "scientist");
});
