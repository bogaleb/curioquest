/**
 * The phoneme guard (blueprint §WP-07).
 *
 * The acceptance for WP-07 is absolute: **no phoneme is ever produced by
 * `speechSynthesis`.** A synthesiser cannot say an isolated consonant — it adds a
 * schwa, so /m/ becomes "muh" — and "muh-a-tuh" never blends into "mat". Teaching that
 * is worse than teaching nothing, because the blending activities then have to undo it.
 *
 * A rule like that survives exactly as long as somebody remembers it. This turns it into
 * something that fails a build:
 *
 *   1. no phoneme notation (`/m/`, `/sh/`) may reach a speech API;
 *   2. `new SpeechSynthesisUtterance` may only be constructed in the files allowed to
 *      own that decision, so a new component cannot quietly grow its own voice path;
 *   3. every `AudioButton` that carries a phoneme must declare `kind="phoneme"`, since
 *      that is the prop the policy branches on.
 *
 *   node scripts/check-audio.mjs
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { loadTs } from "../tests/load-typescript.mjs";

const root = resolve(import.meta.dirname, "..");

/**
 * The only places allowed to construct an utterance.
 *
 * `audio-policy.ts` decides *whether*; `AudioButton.tsx` is the one control that speaks
 * to a child; `speech.ts` is the shared primitive; `audio.ts` says one celebration line.
 * Anything else growing a voice path is what this rule is for.
 */
const SPEECH_OWNERS = new Set([
  "lib/speech.ts",
  "lib/audio.ts",
  "components/reading/AudioButton.tsx",
]);

/*
 * The one definition of what a phoneme looks like, taken from the policy it guards.
 *
 * This file used to carry its own copy, and the two drifted: both listed IPA characters
 * by hand and both missed the breve vowels the catalogue actually uses, so `/ă/`, `/ĭ/`,
 * `/ŏ/`, `/ĕ/` and `/ŭ/` — five of the nineteen phase-one sounds — could have reached a
 * synthesiser with the guard reporting all clear. A guard with its own copy of the rule
 * is a guard that eventually checks something else.
 */
const { PHONEME_NOTATION: PHONEME } = loadTs("lib/audio-policy");

function listFiles(dir) {
  let entries;
  try { entries = readdirSync(join(root, dir), { withFileTypes: true }); } catch { return []; }
  const files = [];
  for (const entry of entries) {
    const path = `${dir}/${entry.name}`;
    if (entry.name === "node_modules" || entry.name === ".next") continue;
    if (entry.isDirectory()) files.push(...listFiles(path));
    else if (/\.(ts|tsx)$/.test(entry.name)) files.push(path);
  }
  return files;
}

function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

/** 1-based line number of a character offset. */
function lineOf(source, index) {
  return source.slice(0, index).split("\n").length;
}

/**
 * The argument text of each matching call, balanced across nested parentheses.
 *
 * Tested against the arguments rather than the line, because several components here
 * are written as one enormous line: a line-level test flags prose that merely shares a
 * line with an unrelated `readAloud`, and a guard that cries wolf is a guard somebody
 * switches off. Crude but sufficient — it only has to isolate one call, not parse
 * TypeScript.
 */
function callArguments(source, pattern) {
  const out = [];
  for (const match of source.matchAll(pattern)) {
    const open = match.index + match[0].length - 1;
    let depth = 0;
    for (let i = open; i < source.length; i += 1) {
      if (source[i] === "(") depth += 1;
      else if (source[i] === ")") {
        depth -= 1;
        if (depth === 0) { out.push({ start: open, text: source.slice(open + 1, i) }); break; }
      }
    }
  }
  return out;
}

/** The opening tag of each `<Name ...>` element. */
function elements(source, name) {
  const out = [];
  for (const match of source.matchAll(new RegExp(`<${name}\\b`, "g"))) {
    const end = source.indexOf(">", match.index);
    if (end > -1) out.push({ start: match.index, text: source.slice(match.index, end) });
  }
  return out;
}

export function checkAudio() {
  const problems = [];
  const files = [...listFiles("lib"), ...listFiles("components"), ...listFiles("app")];

  for (const file of files) {
    const raw = readFileSync(join(root, file), "utf8");
    const code = stripComments(raw);

    // ---- 2. only the owners may construct a voice ---------------------------
    if (/new SpeechSynthesisUtterance/.test(code) && !SPEECH_OWNERS.has(file)) {
      problems.push(
        `${file}: constructs a SpeechSynthesisUtterance. Speaking goes through ` +
        "components/reading/AudioButton.tsx or lib/speech.ts, which obey lib/audio-policy.ts.",
      );
    }

    // ---- 1. no phoneme may reach a voice ------------------------------------
    for (const call of callArguments(code, /\b(?:readAloud|speak)\s*\(/g)) {
      if (PHONEME.test(call.text)) {
        problems.push(
          `${file}:${lineOf(code, call.start)}: a phoneme is being sent to a speech API. ` +
          'A synthesiser adds a schwa to an isolated sound (/m/ becomes "muh"), which is ' +
          'what §WP-07 forbids. Use <AudioButton kind="phoneme"> so it plays a recording ' +
          "or shows the mouth cue.",
        );
      }
    }

    // ---- 3. carrying a phoneme must be declared ------------------------------
    //
    // Only when the element's own props reach for one — `text={skill.phoneme}` or
    // literal notation. Matching the bare word caught the `phoneme-boxes` class name.
    for (const tag of elements(code, "AudioButton")) {
      // `phonemes` too: an element reaching into that array is reaching for one sound.
      const carries = /\.phonemes?\b/.test(tag.text) || PHONEME.test(tag.text);
      if (carries && !/kind=["']phoneme["']/.test(tag.text)) {
        problems.push(
          `${file}:${lineOf(code, tag.start)}: an AudioButton carries a phoneme without ` +
          'kind="phoneme", so the policy cannot tell it apart from prose and a ' +
          "synthesiser would answer.",
        );
      }
    }
  }

  return problems;
}

if (import.meta.filename === process.argv[1]) {
  const problems = checkAudio();
  if (problems.length) {
    console.log(`${problems.length} audio problem${problems.length === 1 ? "" : "s"}:`);
    for (const problem of problems) console.log(" -", problem);
    process.exitCode = 1;
  } else {
    console.log("No phoneme can reach a speech synthesiser.");
  }
}
