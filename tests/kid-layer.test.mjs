import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { loadTs } from "./load-typescript.mjs";
import { checkTokens } from "../scripts/check-tokens.mjs";
import { checkChildSurfaces } from "../scripts/check-child-surfaces.mjs";

const root = resolve(import.meta.dirname, "..");
const { wordBudget, countWords, overBudget, systemWordsIn } = loadTs("lib/kid-copy");
const { learningBands } = loadTs("lib/learning-bands");

/**
 * The child component layer (WP-02).
 *
 * The two `check-*` scripts are the enforcement; this file is what makes them run on every
 * push, and it adds the checks that need to understand the code rather than only read it.
 */

test("the child layer uses tokens and nothing else", () => {
  const { problems, measured } = checkTokens();
  assert.deepEqual(problems, []);
  // The ratchets have to be measuring something, or a passing check means nothing.
  assert.ok(measured.legacyBytes > 100_000, "the legacy stylesheets were not found");
});

test("no child surface reaches for an emoji, an icon library or a clickable div", () => {
  const { problems, measured } = checkChildSurfaces();
  assert.deepEqual(problems, []);
  assert.ok(measured.files >= 6, `expected the six primitives, found ${measured.files} files`);
});

test("every primitive the blueprint names exists", () => {
  // WP-02 lists these by name. A missing one means a screen has nothing to be built from.
  const files = readdirSync(join(root, "components/kid"));
  for (const name of ["KidButton", "KidCard", "SceneLayer", "SpeechBubble", "ProgressTrail", "ObjectSlot"]) {
    assert.ok(files.includes(`${name}.tsx`), `components/kid/${name}.tsx is missing`);
  }
});

test("every interactive primitive renders a real button with an accessible name", () => {
  for (const name of ["KidButton", "KidCard", "ObjectSlot", "SpeechBubble"]) {
    const source = readFileSync(join(root, `components/kid/${name}.tsx`), "utf8");
    assert.match(source, /<button/, `${name} must press a real <button>`);
    assert.match(source, /type="button"/, `${name} must not submit a form by accident`);
    // Either the label is rendered, or it is given to assistive technology explicitly.
    assert.match(source, /aria-label|aria-pressed|kid-card-title|kid-bubble-text/, name);
  }
});

test("the child layer takes its target and type sizes from the band, never from a literal", () => {
  const css = readFileSync(join(root, "app/kid.css"), "utf8");
  // Every control that a finger touches sizes itself from --kid-touch*, which the band sets.
  for (const selector of [".kid-button", ".kid-slot", ".kid-bubble-replay"]) {
    const block = new RegExp(`\\${selector}\\s*\\{([^}]*)\\}`).exec(css);
    assert.ok(block, `${selector} has no rule`);
    assert.match(block[1], /--kid-touch/, `${selector} does not use a touch token`);
  }
});

// ---------------------------------------------------------------------------
// Copy rules (§C5)
// ---------------------------------------------------------------------------

test("the on-screen word budget never exceeds the blueprint's ceiling", () => {
  for (const band of learningBands) {
    const budget = wordBudget(band.id);
    const ceiling = band.ageMin <= 5 ? 12 : 25;
    assert.ok(budget <= ceiling, `${band.id} allows ${budget} words, over the ceiling of ${ceiling}`);
    assert.ok(budget > 0, `${band.id} allows no words at all`);
  }
});

test("the youngest band is given the least to read", () => {
  const youngest = wordBudget("early-preschool");
  const oldest = wordBudget("grade1");
  assert.ok(youngest < oldest, "an older reader should be allowed more text, not less");
  assert.equal(youngest, 8, "early preschool follows its delivery profile");
});

test("counting words is not fooled by punctuation or spacing", () => {
  assert.equal(countWords("  Find   the  /m/ sound! "), 4);
  assert.equal(countWords(""), 0);
  assert.equal(countWords("\n\t"), 0);
});

test("a line over the band's budget is caught", () => {
  const short = "Tap the m.";
  const long = "Tap the letter that makes the sound at the beginning of the word mouse today.";
  assert.equal(overBudget(short, "prek"), false);
  assert.equal(overBudget(long, "prek"), true);
  // The same sentence is acceptable further up the range: the rule is about the reader.
  assert.equal(overBudget(long, "grade1"), false);
});

test("system vocabulary is caught wherever it appears in child copy", () => {
  assert.deepEqual(systemWordsIn("Nice work! Your next activity is ready."), ["activity"]);
  assert.deepEqual(systemWordsIn("Let's find the /m/ sound."), []);
  // Substrings of longer words are not matches: "levelling" is not "level".
  assert.deepEqual(systemWordsIn("The snail is travelling."), []);
});
