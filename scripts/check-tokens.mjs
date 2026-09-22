/**
 * The token discipline check.
 *
 * Two jobs. First, the child layer — `app/kid.css` and `components/kid/` — may not contain
 * a raw colour, a px font size or a forced override; every value comes from `app/tokens.css`,
 * which is the one place colour, type, spacing and motion are defined.
 *
 * Second, a ratchet. The eighteen legacy stylesheets shrink by attrition: a screen moves to
 * the child layer and its old rules are deleted. Ratchets make that irreversible — the
 * budgets below are the current measurements, and the check fails if either grows. When a
 * migration lowers them, lower the numbers in the same commit. They are not allowed to rise
 * without someone saying out loud why.
 *
 *   node scripts/check-tokens.mjs
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

/**
 * Budgets, measured on 2026-09-20 at the end of WP-03. Lower these, never raise them.
 *
 * `legacyCssBytes` counts every stylesheet in `app/` except the two files the rebuild is
 * moving towards: `tokens.css` (the definitions) and `kid.css` (the new layer). Those two
 * grow while the other sixteen shrink, and mixing them into one number would hide both
 * movements behind each other. It was 227,589B when WP-02 started, and 220,457B when
 * WP-03 started; the child map retired app/wonder.css entirely.
 *
 * WP-11 took it to 206,664B: the Reading Grove replaced the reading hero and its five
 * emoji stage cards, so `.reading-hero*` and `.reading-map*` left `app/reading.css`
 * — 2,418 bytes, 16 raw colours and 11 px font sizes with them.
 */
export const BUDGETS = {
  legacyCssBytes: 206_664,
  important: 25,
  /**
   * Raw colours and px font sizes still sitting in the sixteen legacy sheets. The blueprint
   * bans both in new CSS; in old CSS they are a debt with a number on it. A screen that moves
   * to the child layer takes its share of them with it.
   */
  legacyRawHex: 932,
  legacyFontPx: 509,
};

const HEX = /#[0-9a-fA-F]{3,8}\b/g;
const FONT_PX = /font-size:\s*[\d.]+px/g;
const IMPORTANT = /!important/g;

function stripCssComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

function stripJsComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

function listFiles(dir, test) {
  let entries;
  try {
    entries = readdirSync(join(root, dir), { withFileTypes: true });
  } catch {
    return [];
  }
  const files = [];
  for (const entry of entries) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) files.push(...listFiles(path, test));
    else if (test(entry.name)) files.push(path);
  }
  return files;
}

/** Returns a list of human-readable violations. Empty means the layer is clean. */
export function checkTokens() {
  const problems = [];

  // ---- the child layer keeps its own house clean --------------------------------
  const childFiles = [
    "app/kid.css",
    ...listFiles("components/kid", (name) => name.endsWith(".tsx") || name.endsWith(".ts")),
  ];
  for (const file of childFiles) {
    let source;
    try {
      source = readFileSync(join(root, file), "utf8");
    } catch {
      continue;
    }
    const code = file.endsWith(".css") ? stripCssComments(source) : stripJsComments(source);
    for (const hex of code.match(HEX) ?? []) {
      problems.push(`${file}: raw colour ${hex} — use a token from app/tokens.css`);
    }
    for (const size of code.match(FONT_PX) ?? []) {
      problems.push(`${file}: ${size} — use --kid-text-* so the band can set the floor`);
    }
    const forced = (code.match(IMPORTANT) ?? []).length;
    if (forced) {
      problems.push(`${file}: ${forced} forced override(s) — the child layer never needs one`);
    }
  }

  // ---- every --kid-* the layer uses is actually defined -------------------------
  // Design values come from tokens.css. A component may also declare a property of its
  // own for a value that belongs to the *data* rather than to the design — a place's
  // coordinates on the map, say — and those are declared in kid.css itself. Anything
  // referenced from neither is a typo.
  const tokens = readFileSync(join(root, "app/tokens.css"), "utf8");
  const kidCss = stripCssComments(readFileSync(join(root, "app/kid.css"), "utf8"));
  const defined = new Set([
    ...[...tokens.matchAll(/(--kid-[\w-]+)\s*:/g)].map((match) => match[1]),
    ...[...kidCss.matchAll(/(--kid-[\w-]+)\s*:/g)].map((match) => match[1]),
  ]);
  for (const [, name] of kidCss.matchAll(/var\((--kid-[\w-]+)/g)) {
    if (!defined.has(name)) problems.push(`app/kid.css: ${name} is defined nowhere`);
  }

  // ---- the ratchets --------------------------------------------------------------
  const sheets = readdirSync(join(root, "app")).filter((name) => name.endsWith(".css"));
  let legacyBytes = 0;
  let legacyHex = 0;
  let legacyFontPx = 0;
  let important = 0;
  for (const name of sheets) {
    const path = join(root, "app", name);
    // Normalised to LF, because that is what the repository stores: a Windows
    // checkout must not read as 8KB heavier than a Linux one.
    const css = readFileSync(path, "utf8").split("\r\n").join("\n");
    const code = stripCssComments(css);
    if (name !== "tokens.css" && name !== "kid.css") {
      legacyBytes += Buffer.byteLength(css);
      legacyHex += (code.match(HEX) ?? []).length;
      legacyFontPx += (code.match(FONT_PX) ?? []).length;
    }
    important += (code.match(IMPORTANT) ?? []).length;
  }
  if (legacyBytes > BUDGETS.legacyCssBytes) {
    problems.push(
      `legacy stylesheets are ${legacyBytes}B, over the ${BUDGETS.legacyCssBytes}B budget — ` +
        "the sixteen screen sheets may only shrink (WP-02, attrition)",
    );
  }
  if (important > BUDGETS.important) {
    problems.push(
      `${important} !important declarations, over the budget of ${BUDGETS.important} — ` +
        "this number may only go down",
    );
  }
  if (legacyHex > BUDGETS.legacyRawHex) {
    problems.push(
      `${legacyHex} raw colours in the legacy sheets, over the budget of ${BUDGETS.legacyRawHex} — ` +
        "new CSS uses tokens (blueprint §A)",
    );
  }
  if (legacyFontPx > BUDGETS.legacyFontPx) {
    problems.push(
      `${legacyFontPx} px font sizes in the legacy sheets, over the budget of ${BUDGETS.legacyFontPx} — ` +
        "type sizes come from the scale, and the child floor comes from the band",
    );
  }

  return { problems, measured: { legacyBytes, important, legacyHex, legacyFontPx } };
}

if (import.meta.filename === process.argv[1]) {
  const { problems, measured } = checkTokens();
  console.log(`legacy stylesheets: ${measured.legacyBytes}B (budget ${BUDGETS.legacyCssBytes}B)`);
  console.log(`!important: ${measured.important} (budget ${BUDGETS.important})`);
  console.log(`legacy raw colours: ${measured.legacyHex} (budget ${BUDGETS.legacyRawHex})`);
  console.log(`legacy px font sizes: ${measured.legacyFontPx} (budget ${BUDGETS.legacyFontPx})`);
  if (problems.length) {
    console.log(`\n${problems.length} problem${problems.length === 1 ? "" : "s"}:`);
    for (const problem of problems) console.log(" -", problem);
    process.exitCode = 1;
  } else {
    console.log("\nToken discipline holds.");
  }
}
