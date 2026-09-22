import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
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

/**
 * Separate every reduced-motion block from everything else.
 *
 * The obvious version of this slices the file at the *last* occurrence of the media
 * query, and it worked right up until the activity screen appended a second one. Then
 * the check silently started asking "are the scene's loops mentioned inside the
 * activity's little block", which they are not, and reported the wrong thing.
 *
 * There can be any number of these blocks and they can appear anywhere, so the braces
 * are actually matched rather than guessed at.
 */
function splitReducedMotion(css) {
  const marker = "@media (prefers-reduced-motion: reduce)";
  const blocks = [];
  let rest = "";
  let cursor = 0;
  for (;;) {
    const start = css.indexOf(marker, cursor);
    if (start === -1) {
      rest += css.slice(cursor);
      break;
    }
    rest += css.slice(cursor, start);
    const open = css.indexOf("{", start);
    let depth = 0;
    let index = open;
    for (; index < css.length; index += 1) {
      if (css[index] === "{") depth += 1;
      else if (css[index] === "}") {
        depth -= 1;
        if (depth === 0) break;
      }
    }
    blocks.push(css.slice(open + 1, index));
    cursor = index + 1;
  }
  return { blocks, rest };
}

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
  const { blocks, rest } = splitReducedMotion(css);
  assert.ok(blocks.length, "app/kid.css has no reduced-motion block");
  const reduced = blocks.join("\n");
  const before = rest;

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
  const reduced = splitReducedMotion(kidCss.replace(/\/\*[\s\S]*?\*\//g, "")).blocks.join("\n");
  assert.match(reduced, /animation:\s*none/, "no loop is actually switched off");
  assert.ok(
    !/--kid-dur-ambient[\w-]*:\s*1ms/.test(reduced),
    "an ambient duration was collapsed to 1ms, which turns a slow drift into a strobe",
  );
});

// ---------------------------------------------------------------------------
// The title sequence (WP-11)
// ---------------------------------------------------------------------------

test("the opening film draws no controls over itself", () => {
  const intro = readFileSync(join(root, "components/auth/app-intro.tsx"), "utf8");
  const css = readFileSync(join(root, "app/kid.css"), "utf8");
  // A title card with a Skip in the corner is an advertisement, and one with a Turn on
  // sound is an apology. It opens itself, plays, and hands over.
  for (const gone of ["app-intro-skip", "app-intro-sound", "app-intro-controls"]) {
    assert.ok(!intro.includes(gone), `the intro still renders ${gone}`);
    assert.ok(!css.includes(gone), `app/kid.css still styles ${gone}`);
  }
  assert.ok(!/<button/.test(intro), "the intro renders a button");
});

test("the opening film leaves on its own, and cannot strand anyone", () => {
  const intro = readFileSync(join(root, "components/auth/app-intro.tsx"), "utf8");
  // It ends by itself, which is what makes having no visible control acceptable.
  assert.match(intro, /onEnded=\{finish\}/, "the film does not end itself");
  // Escape stays, because it is the keyboard route out of anything modal and it costs
  // the screen nothing to keep.
  assert.match(intro, /useDialogFocus\(open, finish\)/, "Escape does not leave the film");
  // A broken file must not leave a black rectangle over the form, and a slow network
  // must not hold a parent on a poster frame.
  assert.match(intro, /onError=\{finish\}/, "a broken video would block the sign-in screen");
  assert.match(intro, /setTimeout\(finish, START_MS\)/, "there is no start watchdog");
  assert.match(intro, /onPlaying=/, "the watchdog is never resized to the film");
});

test("the opening film takes sound without asking for it", () => {
  const intro = readFileSync(join(root, "components/auth/app-intro.tsx"), "utf8");
  // Browsers block audio until the viewer has interacted with the site, so some first
  // visits are silent however this is written. What it must not do is put a button on
  // screen about it: it tries unmuted, falls back to muted, and takes the first touch
  // or key press anywhere as permission.
  assert.match(
    intro,
    /element\.muted = false;\s*\n\s*element\.play\(\)\.catch/,
    "it does not try for sound first",
  );
  assert.match(intro, /element\.muted = true;/, "it has no muted fallback");
  assert.match(intro, /const unmute = \(\) => \{/, "a refused unmute is never retried");
  assert.match(intro, /addEventListener\("pointerdown", unmute, \{ once: true \}\)/);
});

test("the opening film is skipped entirely for reduced motion, and shown once a session", () => {
  const intro = readFileSync(join(root, "components/auth/app-intro.tsx"), "utf8");
  assert.match(intro, /const open = !reduced && !seen && !dismissed;/,
    "the open condition is not derived from the preference and the session");
  // Both reads are behavioural rather than visual — CSS cannot decline to play a video
  // or cancel a timer — so they have to be in JavaScript.
  assert.match(intro, /usePrefersReducedMotion\(\)/);
  assert.match(intro, /sessionStorage/);
});

test("the opening film only greets someone who is signing in", () => {
  // Not on sign-up, not on password reset, and never inside the app: a signed-in family
  // goes straight to the map, and a ten second film in front of a child who came to
  // learn is the regression §0 of the blueprint is named after.
  const form = readFileSync(join(root, "components/auth/auth-form.tsx"), "utf8");
  assert.match(form, /\{mode === 'sign-in' && <AppIntro \/>\}/);
  const shell = readFileSync(join(root, "components/shell/KidShell.tsx"), "utf8");
  assert.ok(!/AppIntro/.test(shell), "the child shell must never mount the intro");
});

test("shipped media stays small enough to be worth shipping", () => {
  // Both clips arrived as 5 MB and 13 MB. Re-encoding is a step someone has to remember,
  // so the budget is the thing that remembers it.
  const dir = join(root, "public/media");
  let files;
  try {
    files = readdirSync(dir);
  } catch {
    return; // nothing shipped yet
  }
  for (const name of files) {
    const bytes = statSync(join(dir, name)).size;
    assert.ok(bytes <= 2_500_000,
      `public/media/${name} is ${(bytes / 1048576).toFixed(2)} MB — re-encode it before shipping`);
  }
});
