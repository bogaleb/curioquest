import test from "node:test";
import assert from "node:assert/strict";
import { loadTs } from "./load-typescript.mjs";

const { coachScript } = loadTs("lib/reading/coach");
const { defaultReadingCatalog: readingCatalog } = loadTs("lib/reading/content");

const skill = readingCatalog.skills.find((s) => s.letter === "m");
const word = readingCatalog.words.find((w) => w.id === "mat");
const kinds = ["letter-catch", "blend-train", "sound-boxes", "story"];

test("every reading step has a complete grown-up script", () => {
  for (const kind of kinds) for (const teaching of [true, false]) {
    const script = coachScript({ id: "a", kind, skillId: skill.id, target: kind === "letter-catch" ? "m" : "mat", choices: [], reason: "new", taught: teaching }, { skill, word, teaching });
    for (const part of ["show", "together", "alone", "stuck"]) assert.ok(script[part].trim().length > 10, `${kind}.${part}`);
  }
});

test("the teaching script names the sound, not the letter name, and the blend script uses the word's own sounds", () => {
  const teach = coachScript({ id: "a", kind: "letter-catch", skillId: skill.id, target: "m", choices: [], reason: "new", taught: true }, { skill, teaching: true });
  assert.match(teach.show, new RegExp(skill.phoneme.replace(/[/]/g, "\/")));
  assert.match(teach.show, /not the letter name/);
  const blend = coachScript({ id: "b", kind: "blend-train", skillId: "blend_cvc", target: "mat", choices: [], reason: "practice", taught: false }, { word, teaching: false });
  assert.match(blend.show, /mat/);
  for (const phoneme of word.phonemes) assert.ok(blend.show.includes(phoneme));
});
