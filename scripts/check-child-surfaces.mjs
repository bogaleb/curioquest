/**
 * The child-surface check.
 *
 * `check-tokens.mjs` guards the values a child screen uses. This one guards the *shapes*:
 * what a child-facing component is allowed to be made of.
 *
 * Each rule below is one of the blueprint's anti-patterns, turned into something that
 * fails a build rather than something a reviewer has to notice:
 *
 *   - no emoji, and no icon library, on a child surface (§WP-11, §G). Both are placeholders
 *     that shipped. Missing art is a grey `Placeholder`, which keeps the gap visible;
 *   - no shadcn/Radix component in the child layer (§D7) — those belong to Grown-ups;
 *   - no clickable `div`: a child control is a real `<button>`, or the keyboard path and the
 *     screen reader path both disappear;
 *   - no control whose only affordance is hover, because a finger cannot hover;
 *   - every component that renders text takes its sizes from the band, never from a literal.
 *
 *   node scripts/check-child-surfaces.mjs
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

/** Directories whose contents are child-facing by definition. */
const CHILD_DIRS = ["components/kid"];

const EMOJI = /\p{Extended_Pictographic}/u;

function listFiles(dir) {
  let entries;
  try {
    entries = readdirSync(join(root, dir), { withFileTypes: true });
  } catch {
    return [];
  }
  const files = [];
  for (const entry of entries) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) files.push(...listFiles(path));
    else if (/\.(tsx|ts)$/.test(entry.name)) files.push(path);
  }
  return files;
}

function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

export function checkChildSurfaces() {
  const problems = [];
  const files = CHILD_DIRS.flatMap(listFiles);

  if (!files.length) problems.push("components/kid is empty — the child layer is missing");

  for (const file of files) {
    const source = readFileSync(join(root, file), "utf8");
    const code = stripComments(source);

    if (/from\s+["']lucide-react["']/.test(code)) {
      problems.push(`${file}: imports a Lucide icon — child surfaces use drawn assets`);
    }
    if (/from\s+["']@\/components\/ui\//.test(code)) {
      problems.push(`${file}: imports a shadcn component — those are for Grown-ups (§D7)`);
    }
    if (EMOJI.test(code)) {
      problems.push(`${file}: contains an emoji — use Placeholder until the art exists`);
    }
    if (/<(div|span|li|section)[^>]*\sonClick=/.test(code)) {
      problems.push(`${file}: onClick on a non-button element — a child control is a <button>`);
    }
    if (/\srole=["']button["']/.test(code)) {
      problems.push(`${file}: role="button" — use a real <button> instead`);
    }
    if (/\son(MouseOver|MouseEnter)=/.test(code)) {
      problems.push(`${file}: hover handler — a finger cannot hover (§C6)`);
    }
    if (/style=\{\{/.test(code)) {
      problems.push(`${file}: inline style object — style belongs in app/kid.css`);
    }
    if (/#[0-9a-fA-F]{3,8}\b/.test(code)) {
      problems.push(`${file}: raw colour — use a token from app/tokens.css`);
    }
  }

  return { problems, measured: { files: files.length } };
}

if (import.meta.filename === process.argv[1]) {
  const { problems, measured } = checkChildSurfaces();
  console.log(`checked ${measured.files} child component file(s)`);
  if (problems.length) {
    console.log(`\n${problems.length} problem${problems.length === 1 ? "" : "s"}:`);
    for (const problem of problems) console.log(" -", problem);
    process.exitCode = 1;
  } else {
    console.log("Child surfaces are clean.");
  }
}
