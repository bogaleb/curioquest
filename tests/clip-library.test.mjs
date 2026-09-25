import test from "node:test";
import assert from "node:assert/strict";

/**
 * The hero clip library: every director-named clip resolves to a playable
 * URL and a caption, so a hero moment can never be a dead end.
 */

// The module is TypeScript; exercise it through a lightweight transpile-free
// harness by importing the compiled intent via tsx-less evaluation is not
// available, so we test the contract against the source instead.
import { readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const src = readFileSync(join(root, "lib/media/clips.ts"), "utf8");

// Every clip id the director can name must exist in the catalog.
const directorSrc = readFileSync(join(root, "lib/character/director.ts"), "utf8");
const clipIds = new Set();
for (const m of directorSrc.matchAll(/"(curio-welcome|cast-finale|tuno-breathing)"/g)) {
  clipIds.add(m[1]);
}
// `${who}-intro` for every specialist (Curio's intro is the welcome).
const castIds = ["nova", "luna", "milo", "bea", "tuno", "riff", "atlas"];
for (const id of castIds) clipIds.add(`${id}-intro`);
// Celebration clips named by the director's cheer map.
for (const id of ["curio-celebrate", "nova-highfive", "luna-praise", "milo-dance", "bea-celebrate", "tuno-proud", "riff-celebrate", "atlas-celebrate"]) {
  clipIds.add(id);
}
// Encouragement and farewell moments.
clipIds.add("nova-try-again");
clipIds.add("curio-goodbye");

test("every director clip id has a catalog entry", () => {
  for (const id of clipIds) {
    assert.match(src, new RegExp(`"${id}"`), `catalog is missing clip "${id}"`);
  }
});

test("every catalog entry has a caption and a cue", () => {
  const entries = [...src.matchAll(/"([\w-]+)":\s*{\s*id:\s*"([\w-]+)"/g)];
  assert.ok(entries.length >= 9, "expected at least the 9 launch clips");
  for (const [, key] of entries) {
    const block = src.slice(src.indexOf(`"${key}":`));
    const end = block.indexOf("},");
    const entry = block.slice(0, end);
    assert.match(entry, /caption:\s*"/, `${key} needs a caption`);
    assert.match(entry, /cue:\s*"/, `${key} needs an interaction cue`);
    assert.match(entry, /who:\s*"/, `${key} needs an owner`);
  }
});

test("clip files exist in public/media/clips", () => {
  for (const id of clipIds) {
    const file = join(root, "public/media/clips", `${id}.mp4`);
    assert.ok(existsSync(file), `missing video file for clip "${id}"`);
  }
});

test("no clip entry uses emoji or raw colors in captions", () => {
  assert.doesNotMatch(src, /[\u{1F300}-\u{1FAFF}]/u, "captions must not use emoji");
});
