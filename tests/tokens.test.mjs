import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

/**
 * The token layer, checked rather than trusted.
 *
 * C6 asks for contrast "WCAG AA against the actual painted background, verified, not
 * assumed". A palette that was eyeballed once and never checked again is exactly the
 * kind of thing that drifts, so the check lives here and runs on every push.
 */

const root = resolve(import.meta.dirname, "..");
const tokens = readFileSync(join(root, "app/tokens.css"), "utf8");

/** Every `--name: #hex;` declaration in tokens.css, resolved through var() aliases. */
function readTokens(css) {
  const direct = new Map();
  const alias = new Map();
  for (const [, name, value] of css.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    const trimmed = value.trim();
    const hex = /^#[0-9a-fA-F]{3,8}$/.test(trimmed) ? trimmed : null;
    if (hex) direct.set(name, hex);
    else {
      const ref = /^var\((--[\w-]+)\)$/.exec(trimmed);
      if (ref) alias.set(name, ref[1]);
    }
  }
  const resolve = (name, depth = 0) => {
    if (depth > 8) return null;
    if (direct.has(name)) return direct.get(name);
    if (alias.has(name)) return resolve(alias.get(name), depth + 1);
    return null;
  };
  return { direct, resolve };
}

const { direct } = readTokens(tokens);

function channel(value) {
  const srgb = value / 255;
  return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  const full = hex.length === 4
    ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
    : hex;
  const r = parseInt(full.slice(1, 3), 16);
  const g = parseInt(full.slice(3, 5), 16);
  const b = parseInt(full.slice(5, 7), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(foreground, background) {
  const a = luminance(foreground);
  const b = luminance(background);
  const [light, dark] = a > b ? [a, b] : [b, a];
  return (light + 0.05) / (dark + 0.05);
}

const families = ["sky", "sun", "leaf", "coral", "grape", "berry"];

test("every child palette family defines a full ramp", () => {
  for (const family of families) {
    for (const step of [50, 100, 200, 300, 400, 500, 600]) {
      assert.ok(direct.has(`--kid-${family}-${step}`), `--kid-${family}-${step} is missing`);
    }
    assert.ok(direct.has(`--kid-${family}-ink`), `--kid-${family}-ink is missing`);
  }
});

test("each family's ink meets WCAG AA body contrast on its own light fills", () => {
  // 4.5:1 is the AA threshold for body text. These are the pairings the child
  // components actually paint: ink on the 50/100/200 fills of the same hue.
  for (const family of families) {
    const ink = direct.get(`--kid-${family}-ink`);
    for (const step of [50, 100, 200]) {
      const fill = direct.get(`--kid-${family}-${step}`);
      const ratio = contrast(ink, fill);
      assert.ok(ratio >= 4.5,
        `--kid-${family}-ink on --kid-${family}-${step} is ${ratio.toFixed(2)}:1, below AA 4.5:1`);
    }
  }
});

test("the child ink colours meet AA on both child surfaces", () => {
  for (const surface of ["--kid-surface", "--kid-surface-sunk"]) {
    const fill = direct.get(surface);
    assert.ok(fill, `${surface} is missing`);
    for (const name of ["--kid-ink", "--kid-ink-soft"]) {
      const ratio = contrast(direct.get(name), fill);
      assert.ok(ratio >= 4.5, `${name} on ${surface} is ${ratio.toFixed(2)}:1, below AA 4.5:1`);
    }
  }
});

test("white text on a saturated fill is only used where it actually passes", () => {
  // The 400/500/600 steps are the ones a filled button or a world marker uses with
  // white type. Anything that fails here must not be used that way, so the test
  // states which steps are safe rather than assuming the darkest three are.
  const white = "#ffffff";
  for (const family of families) {
    for (const step of [500, 600]) {
      const fill = direct.get(`--kid-${family}-${step}`);
      const ratio = contrast(white, fill);
      assert.ok(ratio >= 4.5,
        `white on --kid-${family}-${step} is ${ratio.toFixed(2)}:1, below AA 4.5:1`);
    }
  }
});

test("the placeholder grey is visible against the surface it sits on", () => {
  // A missing illustration has to read as missing. A placeholder that blends into the
  // background hides the gap, which is the opposite of the point.
  const ratio = contrast(direct.get("--kid-placeholder-line"), direct.get("--kid-surface"));
  assert.ok(ratio >= 3, `placeholder outline is ${ratio.toFixed(2)}:1, too faint to notice`);
});

test("world hues resolve to a real colour for every named world", () => {
  const worlds = [...tokens.matchAll(/\[data-kid-world="([\w-]+)"\]/g)].map((match) => match[1]);
  assert.ok(worlds.length >= 6, `expected several worlds, found ${worlds.length}`);
  for (const world of new Set(worlds)) {
    const block = new RegExp(`\\[data-kid-world="${world}"\\][^{]*\\{([^}]*)\\}`).exec(tokens);
    assert.ok(block, `${world} has no token block`);
    const { resolve: resolveInBlock } = readTokens(`:root{${block[1]}}`);
    for (const role of ["50", "100", "200", "300", "400", "500", "600", "ink"]) {
      const value = resolveInBlock(`--kid-world-${role}`);
      assert.ok(value === null || /^#/.test(value), `--kid-world-${role} unresolved for ${world}`);
    }
  }
});

// ---------------------------------------------------------------------------
// The type floor
// ---------------------------------------------------------------------------

test("no band drops child text below the accessibility floor", () => {
  // 20px for ages 4-5 and 18px for 6-7. globals.css currently hard-codes 12px labels
  // and an appended override at 6px; the child layer may not inherit that habit.
  const blocks = [...tokens.matchAll(/\[data-band="([\w-]+)"\][^{]*\{([^}]*)\}/g)];
  assert.ok(blocks.length >= 4, "expected per-band token blocks");
  for (const [, band, body] of blocks) {
    const min = /--kid-text-min:\s*(\d+)px/.exec(body);
    if (!min) continue;
    const floor = ["grade2", "grade3"].includes(band) ? 18 : 20;
    assert.ok(Number(min[1]) >= floor,
      `${band} sets --kid-text-min to ${min[1]}px, below the ${floor}px floor`);
  }
});

test("no band drops a touch target below the accessibility floor", () => {
  const blocks = [...tokens.matchAll(/\[data-band="([\w-]+)"\][^{]*\{([^}]*)\}/g)];
  for (const [, band, body] of blocks) {
    const touch = /--kid-touch:\s*(\d+)px/.exec(body);
    if (!touch) continue;
    const floor = ["grade2", "grade3"].includes(band) ? 56 : 64;
    assert.ok(Number(touch[1]) >= floor,
      `${band} sets --kid-touch to ${touch[1]}px, below the ${floor}px floor`);
  }
});

test("reduced motion collapses every child duration", () => {
  const reduced = tokens.slice(tokens.lastIndexOf("prefers-reduced-motion"));
  for (const name of ["--kid-dur-tap", "--kid-dur-travel", "--kid-dur-celebrate"]) {
    assert.ok(new RegExp(`${name}:\\s*1ms`).test(reduced),
      `${name} is not collapsed under prefers-reduced-motion`);
  }
});

// The child layer's own hygiene — no raw hex, no px type, no emoji, no icon library — is
// checked by `scripts/check-tokens.mjs` and `scripts/check-child-surfaces.mjs`, and run from
// `tests/kid-layer.test.mjs`. Keeping it in one place stops the two drifting apart.

// ---------------------------------------------------------------------------
// The scene palette (WP-11)
// ---------------------------------------------------------------------------

/** The scene ramp, by family, as WP-11 §2.1 defines it. */
const SCENE_TOKENS = [
  "--scene-sky-high", "--scene-sky-low", "--scene-haze",
  "--scene-sun", "--scene-sun-core", "--scene-cloud", "--scene-cloud-shade",
  "--scene-canopy-far", "--scene-canopy-mid", "--scene-canopy-near", "--scene-canopy-deep",
  "--scene-ground", "--scene-ground-deep", "--scene-ground-shade",
  "--scene-path", "--scene-path-line",
  "--scene-bark", "--scene-bark-deep",
  "--scene-stone", "--scene-stone-deep",
  "--scene-timber", "--scene-timber-deep",
  "--scene-roof", "--scene-roof-deep",
  "--scene-water", "--scene-water-deep", "--scene-water-glint",
  "--scene-bloom-a", "--scene-bloom-b", "--scene-bloom-c",
];

test("the scene palette defines every material a landscape is built from", () => {
  for (const name of SCENE_TOKENS) {
    assert.ok(direct.has(name), `${name} is missing — a scene plane has nothing to paint with`);
  }
});

test("the scene palette is separate from the world hues", () => {
  // A world recolours its landmarks, never the ground, the sky or the trees. If a
  // --scene-* token resolved through --kid-world-*, walking into Story Harbour would
  // turn the tree trunks violet and the grove would stop being a place.
  for (const [, name, value] of tokens.matchAll(/(--scene-[\w-]+)\s*:\s*([^;]+);/g)) {
    assert.ok(
      !/var\(--kid-world/.test(value),
      `${name} resolves through a world hue — the ground may not change colour per world`,
    );
  }
});

test("planes that get painted on top of each other stay distinguishable", () => {
  // WCAG asks 3:1 of non-text. These are the pairings the scene grammar actually
  // stacks: a canopy against the sky behind it, a path against the ground it crosses,
  // a trunk against the leaves above it. Anything below 3:1 is a plane dissolving
  // into the one behind it, which is how a landscape flattens back into a diagram.
  const pairs = [
    ["--scene-canopy-far", "--scene-sky-low"],
    ["--scene-canopy-mid", "--scene-canopy-far"],
    ["--scene-canopy-near", "--scene-sky-low"],
    ["--scene-canopy-deep", "--scene-canopy-near"],
    ["--scene-path", "--scene-ground"],
    ["--scene-path-line", "--scene-path"],
    ["--scene-bark", "--scene-canopy-near"],
    ["--scene-bark-deep", "--scene-bark"],
    ["--scene-ground-deep", "--scene-ground"],
    ["--scene-water-deep", "--scene-water"],
    ["--scene-stone-deep", "--scene-stone"],
    ["--scene-timber-deep", "--scene-timber"],
    ["--scene-roof-deep", "--scene-roof"],
  ];
  for (const [front, back] of pairs) {
    const ratio = contrast(direct.get(front), direct.get(back));
    assert.ok(ratio >= 1.18,
      `${front} on ${back} is ${ratio.toFixed(2)}:1 — the two planes read as one surface`);
  }
});

test("the sky reads as a gradient rather than a flat fill", () => {
  const ratio = contrast(direct.get("--scene-sky-high"), direct.get("--scene-sky-low"));
  assert.ok(ratio >= 1.15, `the sky's two stops are ${ratio.toFixed(2)}:1 apart — that is one colour`);
});

test("a contact shadow exists, because a landmark has to sit on the ground", () => {
  // The single biggest reason the pre-WP-11 map read as a diagram: every marker
  // floated. These are rgba rather than hex, so they are read from the raw text.
  for (const name of ["--scene-contact", "--scene-contact-soft"]) {
    assert.match(tokens, new RegExp(`${name}:\\s*rgba\\(`), `${name} is missing`);
  }
});

test("ambient motion is slow enough to read as life rather than as a demand", () => {
  // WP-11 §4: anything under about four seconds reads as a thing demanding attention.
  for (const name of ["--kid-dur-ambient", "--kid-dur-ambient-slow"]) {
    const value = new RegExp(`${name}:\\s*([\\d.]+)s`).exec(tokens);
    assert.ok(value, `${name} is missing or not expressed in seconds`);
    assert.ok(Number(value[1]) >= 4,
      `${name} is ${value[1]}s — under 4s an ambient loop competes with the work`);
  }
});

test("reduced motion flattens the parallax rig instead of speeding it up", () => {
  // The three --kid-dur-* tokens collapse to 1ms, which is right for a transition and
  // wrong for a loop: a 24s drift at 1ms is a strobe. So the loops are stopped in
  // kid.css with `animation: none`, and what collapses here is the parallax multiplier.
  const reduced = tokens.slice(tokens.lastIndexOf("prefers-reduced-motion"));
  assert.match(reduced, /--scene-parallax:\s*0/,
    "--scene-parallax does not resolve to 0 under prefers-reduced-motion");
  const ambientDurations = /--kid-dur-ambient[\w-]*:\s*1ms/.test(reduced);
  assert.ok(!ambientDurations,
    "an ambient loop duration was collapsed to 1ms, which turns a slow drift into a strobe");
});
