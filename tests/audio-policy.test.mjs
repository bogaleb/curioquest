import test from "node:test";
import assert from "node:assert/strict";
import { loadTs } from "./load-typescript.mjs";
import { checkAudio } from "../scripts/check-audio.mjs";

const {
  deliver, readySet, audioAssetId, isPhonemeNotation, containsPhoneme,
  withoutPhonemes, audioCoverage,
} = loadTs("lib/audio-policy");
const { readingSkills } = loadTs("lib/reading/content");

/**
 * WP-07's acceptance, as tests: **no phoneme is ever produced by `speechSynthesis`.**
 *
 * The rule is not a style preference. A synthesiser cannot say an isolated consonant —
 * it adds a schwa, so /m/ becomes "muh" — and "muh-a-tuh" never blends into "mat". Every
 * test below is really one question asked from a different angle: can a phoneme reach a
 * voice by this route?
 */

test("a phoneme with a recording plays the recording", () => {
  const available = readySet([audioAssetId("phoneme", "sound_m")]);
  const plan = deliver({ kind: "phoneme", text: "/m/", key: "sound_m", available });
  assert.equal(plan.via, "clip");
  assert.equal(plan.assetId, "phoneme.sound-m.en");
});

test("a phoneme with no recording is modelled, never spoken", () => {
  const plan = deliver({
    kind: "phoneme", text: "/m/", key: "sound_m",
    cue: "Close your lips and hum gently.", example: "moon",
  });
  assert.equal(plan.via, "model", "a missing recording must never fall through to a voice");
  assert.equal(plan.phoneme, "/m/");
  assert.equal(plan.example, "moon");
  assert.match(plan.cue, /Close your lips/);
});

test("no route through deliver() sends a phoneme to a synthesiser", () => {
  // Every phoneme in the programme, with and without a recording, in both directions.
  const phonemes = readingSkills.filter((skill) => skill.phoneme).map((skill) => skill);
  assert.ok(phonemes.length >= 19, "the phase-one set should be present");
  for (const skill of phonemes) {
    for (const available of [readySet([]), readySet(["something.else.en"])]) {
      const plan = deliver({
        kind: "phoneme", text: skill.phoneme, key: skill.id,
        cue: skill.cue, example: skill.example, available,
      });
      assert.notEqual(plan.via, "speak", `${skill.id} (${skill.phoneme}) reached a synthesiser`);
    }
  }
});

test("a word is spoken, because a synthesiser says those acceptably", () => {
  const plan = deliver({ kind: "word", text: "moon" });
  assert.equal(plan.via, "speak");
  assert.equal(plan.text, "moon");
});

test("a word with a recording prefers the recording", () => {
  const available = readySet([audioAssetId("word", "moon")]);
  const plan = deliver({ kind: "word", text: "moon", available });
  assert.equal(plan.via, "clip");
});

test("prose carrying a phoneme is spoken without it, not with it read out", () => {
  // Left alone, a synthesiser reads "/m/" as "slash em slash".
  const plan = deliver({ kind: "line", text: "Find something that begins with /m/ today." });
  assert.equal(plan.via, "speak");
  assert.ok(!containsPhoneme(plan.text), "the notation must not survive into the spoken line");
  assert.equal(plan.text, "Find something that begins with today.");
});

test("prose that is nothing but a phoneme is modelled rather than emptied", () => {
  const plan = deliver({ kind: "line", text: "/m/", cue: "Lips together." });
  assert.equal(plan.via, "model");
});

test("stripping notation removes it rather than inventing a pronunciation", () => {
  // Rewriting /m/ to "mmm" would be this module deciding how a sound is said, which is
  // the whole thing it exists to prevent.
  assert.equal(withoutPhonemes("the /m/ sound"), "the sound");
  assert.equal(withoutPhonemes("no notation here"), "no notation here");
  // The gap a removed phoneme leaves is closed up, so a synthesiser does not pause in
  // front of a comma that now has nothing before it.
  assert.equal(withoutPhonemes("say /sh/ , then /ee/ ."), "say, then.");
});

test("notation is recognised across the shapes the catalogue uses", () => {
  for (const shape of ["/m/", "/sh/", "/ee/", "/th/"]) {
    assert.ok(isPhonemeNotation(shape), `${shape} should read as a phoneme`);
  }
  for (const other of ["moon", "and/or", "1/2", ""]) {
    assert.ok(!isPhonemeNotation(other), `${other} should not read as a phoneme`);
  }
});

test("the short vowels are recognised, breve and all", () => {
  // The original pattern listed IPA characters by hand and missed every one of these,
  // so five of the nineteen phase-one sounds could have reached a synthesiser with the
  // guard reporting all clear. Pinned here because the catalogue writes them this way.
  for (const vowel of ["/ă/", "/ĭ/", "/ŏ/", "/ĕ/", "/ŭ/"]) {
    assert.ok(isPhonemeNotation(vowel), `${vowel} must read as a phoneme`);
  }
  // And the real records, rather than a copy of them.
  const vowels = readingSkills.filter((skill) => ["a", "e", "i", "o", "u"].includes(skill.letter));
  assert.equal(vowels.length, 5);
  for (const skill of vowels) {
    assert.ok(isPhonemeNotation(skill.phoneme), `${skill.id} writes ${skill.phoneme}, unrecognised`);
    assert.equal(deliver({ kind: "phoneme", text: skill.phoneme, key: skill.id }).via, "model");
  }
});

test("asset ids are stable, addressable and locale-aware", () => {
  assert.equal(audioAssetId("phoneme", "sound_m"), "phoneme.sound-m.en");
  assert.equal(audioAssetId("word", "moon", "es"), "word.moon.es");
  // The same sound in two languages is two recordings, not one file with a flag.
  assert.notEqual(audioAssetId("phoneme", "sound_m", "en"), audioAssetId("phoneme", "sound_m", "es"));
});

test("coverage counts the gap the recording session still has to close", () => {
  const required = readingSkills
    .filter((skill) => skill.phoneme)
    .map((skill) => ({ kind: "phoneme", key: skill.id }));
  const none = audioCoverage(required, readySet([]));
  assert.equal(none.recorded, 0);
  assert.equal(none.phonemeTotal, required.length);
  assert.equal(none.complete, false);

  const all = audioCoverage(required, readySet(required.map((r) => audioAssetId(r.kind, r.key))));
  assert.equal(all.recorded, required.length);
  assert.equal(all.complete, true);
  assert.deepEqual(all.missing, []);
});

test("the guard over the codebase passes, and is what keeps this true", () => {
  // The tests above prove the policy is right. This proves nothing bypasses it: a new
  // component that grows its own `SpeechSynthesisUtterance` fails here.
  assert.deepEqual(checkAudio(), []);
});
