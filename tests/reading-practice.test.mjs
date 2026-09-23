import test from "node:test";
import assert from "node:assert/strict";
import { loadTs } from "./load-typescript.mjs";

const { huntPictures, huntRounds } = loadTs("lib/reading/sound-hunt");
const { defaultReadingCatalog: catalog } = loadTs("lib/reading/content");
const { characterByKey } = loadTs("lib/studio/writing");

test("every letter in the reading sequence has hunt pictures and a lowercase formation", () => {
  for (const letter of catalog.settings.sequence) {
    assert.ok(huntPictures[letter]?.length >= 2, `pictures for ${letter}`);
    for (const picture of huntPictures[letter]) assert.equal(picture.word[0], letter, `${picture.word} starts with ${letter}`);
    assert.ok(characterByKey("lowercase", letter)?.strokes.length, `strokes for ${letter}`);
  }
});

test("a hunt round has one right picture, three distinct choices, and never a same-sound distractor", () => {
  for (const letter of catalog.settings.sequence) for (let seed = 0; seed < 6; seed++) {
    for (const round of huntRounds(letter, seed)) {
      const words = round.choices.map((c) => c.word);
      assert.equal(new Set(words).size, 3, `${letter}/${seed}: ${words}`);
      assert.equal(words.filter((w) => w === round.answer).length, 1);
      const starts = words.filter((w) => w !== round.answer).map((w) => w[0]);
      assert.ok(!starts.includes(letter), `${letter}: distractor starts with the target`);
      if (letter === "c") assert.ok(!starts.includes("k"));
      if (letter === "k") assert.ok(!starts.includes("c"));
    }
  }
});

test("the hunt never answers with the example word the question already says", () => {
  for (const skill of catalog.skills.filter((s) => s.letter)) for (let seed = 0; seed < 4; seed++)
    for (const round of huntRounds(skill.letter, seed, 2, skill.example)) assert.notEqual(round.answer, skill.example?.toLowerCase(), skill.letter);
});
