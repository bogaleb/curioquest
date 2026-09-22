import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

/**
 * The art and motion layer (WP-11).
 *
 * `kid-layer.test.mjs` guards the primitives a child screen is built from. This guards the
 * world they stand in: the depth planes, the scenery, the cast and the celebration.
 *
 * The test that matters most here is the last one. Everything else can be caught by
 * looking at the screen; a loop that nobody remembered to stop under
 * `prefers-reduced-motion` cannot, because the person reviewing it almost certainly does
 * not have the preference switched on.
 */

const root = resolve(import.meta.dirname, "..");
const kidCss = readFileSync(join(root, "app/kid.css"), "utf8");
const art = (name) => readFileSync(join(root, `components/kid/art/${name}`), "utf8");

test("the scene grammar names five planes and an actors layer", () => {
  const scene = art("Scene.tsx");
  // The order is the paint order and the meaning. A sixth plane is a design decision,
  // not a refactor, so it should fail here and be argued about.
  assert.match(scene, /SCENE_PLANES\s*=\s*\["sky",\s*"far",\s*"mid",\s*"near",\s*"fore",\s*"actors"\]/);
  for (const plane of ["sky", "far", "mid", "near", "fore", "actors"]) {
    assert.match(kidCss, new RegExp(`\\[data-plane="${plane}"\\]`), `${plane} has no depth in app/kid.css`);
  }
});

test("the actors plane never parallaxes and never crops", () => {
  // Nova has to be able to stand anywhere without a leaf across her face, and a speech
  // bubble must never end up behind a tree.
  const block = /\.kid-plane\[data-plane="actors"\]\s*\{([^}]*)\}/.exec(kidCss);
  assert.ok(block, "the actors plane has no rule");
  assert.match(block[1], /--scene-depth:\s*0/, "the actors plane parallaxes");
  assert.match(block[1], /overflow:\s*visible/, "the actors plane crops its characters");
});

test("the cast is four characters and they all share one rig", () => {
  const cast = art("cast.tsx");
  for (const who of ["nova", "pip", "wren", "bramble"]) {
    assert.match(cast, new RegExp(`${who}:`), `${who} is missing from the cast`);
  }
  // The shared hooks. A fifth character that uses these needs no new CSS, which is the
  // whole point of having a contract rather than four bespoke drawings.
  for (const part of ["cast-breathe", "cast-blink", "cast-mouth", "cast-limb"]) {
    assert.ok(cast.includes(part), `the rig is missing ${part}`);
    assert.ok(kidCss.includes(`.${part}`), `${part} is never animated in app/kid.css`);
  }
});

test("no character performs disappointment at a child", () => {
  // WP-11 §2.3. Wren gets things wrong first so that being wrong looks survivable, and
  // Bramble is an obstacle rather than a judgement. A sad or cross face in this file is a
  // product decision that should be argued for, not one that arrives in a drawing.
  const cast = art("cast.tsx");
  const code = cast.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  for (const mood of ["sad", "cross", "angry", "frown", "scowl", "disappointed"]) {
    assert.ok(!new RegExp(`\\b${mood}\\b`, "i").test(code), `the cast has a "${mood}" state`);
  }
});

test("the celebration ends, and its last beat is rest", () => {
  const celebration = art("Celebration.tsx");
  assert.match(celebration, /CELEBRATION_BEATS\s*=\s*\["land",\s*"grant",\s*"perform",\s*"rest"\]/);
  // The reverted Aurora pass got this right and it is worth keeping: a child who got it
  // right is about to move on, and something still moving behind the next question
  // competes with it.
  const celebrateRules = [...kidCss.matchAll(/\.kid-celebrate[^{]*\{([^}]*)\}/g)];
  for (const [, body] of celebrateRules) {
    assert.ok(!/infinite/.test(body), "the celebration loops — it has to stop");
  }
});

test("the scene palette is never reached for outside tokens.css", () => {
  // Same rule the child layer already lives under, extended to the new ramp: a raw hex in
  // a drawing is a colour nobody can re-measure for contrast.
  const files = readdirSync(join(root, "components/kid/art"), { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => `components/kid/art/${entry.name}`);
  assert.ok(files.length >= 4, `expected the art layer, found ${files.length} files`);
  for (const file of files) {
    const code = readFileSync(join(root, file), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");
    assert.ok(!/#[0-9a-fA-F]{3,8}\b/.test(code), `${file} contains a raw colour`);
  }
});

// ---------------------------------------------------------------------------
// The one that cannot be caught by looking
// ---------------------------------------------------------------------------

test("every ambient loop is stopped under prefers-reduced-motion", () => {
  // Comments are stripped first: a rule preceded by an explanatory comment would
  // otherwise arrive here with the whole comment glued to the front of its selector,
  // and every selector in this file has one.
  const css = kidCss.replace(/\/\*[\s\S]*?\*\//g, "");
  const marker = "@media (prefers-reduced-motion: reduce)";
  const index = css.lastIndexOf(marker);
  assert.ok(index > -1, "app/kid.css has no reduced-motion block");
  const before = css.slice(0, index);
  const reduced = css.slice(index);

  // Every rule that starts an endless animation, and the selector that owns it.
  const looping = [];
  for (const match of before.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    const selector = match[1].trim();
    const body = match[2];
    if (!/animation[^;]*infinite/.test(body)) continue;
    if (selector.startsWith("@") || selector.startsWith("%") || /^\d/.test(selector)) continue;
    looping.push(selector);
  }

  assert.ok(looping.length >= 8, `expected the ambient loops, found ${looping.length}`);

  for (const selector of looping) {
    // A selector may be listed in the reduced block on its own or as one of a comma list,
    // so the check is textual containment of each individual selector.
    const parts = selector.split(",").map((part) => part.trim()).filter(Boolean);
    const covered = parts.every((part) => reduced.includes(part));
    assert.ok(
      covered,
      `"${selector}" loops forever but is not stopped under prefers-reduced-motion — ` +
        "add it to the block at the bottom of app/kid.css",
    );
  }
});

test("reduced motion stops loops rather than speeding them up", () => {
  // A 24-second cloud drift compressed to 1ms is a strobe. The transition tokens collapse;
  // the ambient ones must not, and the loops are switched off instead.
  const index = kidCss.lastIndexOf("@media (prefers-reduced-motion: reduce)");
  const reduced = kidCss.slice(index);
  assert.match(reduced, /animation:\s*none/, "no loop is actually switched off");
  assert.ok(
    !/--kid-dur-ambient[\w-]*:\s*1ms/.test(reduced),
    "an ambient duration was collapsed to 1ms, which turns a slow drift into a strobe",
  );
});
