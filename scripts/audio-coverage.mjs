/**
 * What still needs recording (blueprint §WP-07.1).
 *
 * Step 1 of WP-07 is "record or licence the phase-one phoneme set, the decodable word
 * list, Nova's scripted lines". That is an offline job somebody runs against a list, so
 * this prints the list — and, once clips start landing, what is left.
 *
 * Until a phoneme is recorded the product does not say it: `lib/audio-policy.ts` shows
 * the mouth cue instead, because a synthesiser adds a schwa and teaches the one habit
 * that stops a child blending. Every row below is a sound children currently cannot hear.
 *
 *   node scripts/audio-coverage.mjs
 */
import { loadTs } from "../tests/load-typescript.mjs";

const { audioAssetId, audioCoverage, readySet } = loadTs("lib/audio-policy");
const { readingSkills, readingWords } = loadTs("lib/reading/content");

const phonemes = readingSkills.filter((s) => s.phoneme).map((s) => ({ kind: "phoneme", key: s.id, label: s.phoneme, example: s.example }));
const words = (readingWords ?? []).map((w) => ({ kind: "word", key: w.word, label: w.word }));
const required = [...phonemes, ...words];

// No manifest yet: nothing is recorded. When clips exist this reads the published
// catalogue's asset list instead, which is what `content.assets` (WP-05) is for.
const available = readySet([]);
const coverage = audioCoverage(required.map(({ kind, key }) => ({ kind, key })), available);

console.log(`Audio coverage: ${coverage.recorded}/${coverage.total} recorded`);
console.log(`  phonemes: ${coverage.phonemeRecorded}/${coverage.phonemeTotal}`);
console.log(`  words:    ${coverage.recorded - coverage.phonemeRecorded}/${coverage.total - coverage.phonemeTotal}\n`);

if (coverage.missing.length) {
  console.log("To record, in priority order (phonemes first — these are silent today):\n");
  for (const item of required) {
    const id = audioAssetId(item.kind, item.key);
    if (!coverage.missing.includes(id)) continue;
    if (item.kind !== "phoneme") continue;
    console.log(`  ${id.padEnd(28)} ${String(item.label).padEnd(6)} as in "${item.example}"`);
  }
  const wordIds = required.filter((i) => i.kind === "word" && coverage.missing.includes(audioAssetId(i.kind, i.key)));
  if (wordIds.length) console.log(`\n  …and ${wordIds.length} words: ${wordIds.slice(0, 12).map((i) => i.label).join(", ")}${wordIds.length > 12 ? ", …" : ""}`);
}
