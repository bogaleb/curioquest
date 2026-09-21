/**
 * What may be spoken, by what, and what happens when there is no recording (§WP-07).
 *
 * The blueprint's goal is one sentence — *stop teaching phonics with a synthesiser* —
 * and its acceptance is absolute: **no phoneme is ever produced by `speechSynthesis`.**
 *
 * That is not a preference. A speech synthesiser cannot say an isolated consonant. Ask
 * one for /m/ and it says "muh"; ask for /t/ and it says "tuh". The added schwa is the
 * single most common reason a child cannot blend — they have been taught three sounds
 * that do not join, and "muh-a-tuh" never becomes "mat". The product's own parent notes
 * already admit this. Until now they admitted it and synthesised anyway.
 *
 * So this module decides delivery, and the rule it enforces is that a missing recording
 * degrades to *teaching*, never to a worse sound:
 *
 *   clip      an authored recording exists — play it;
 *   speak     a word or a sentence, which a synthesiser says acceptably — speak it;
 *   model     a phoneme with no recording — say nothing, and show the mouth cue so a
 *             grown-up can make the sound. Silence that leads somewhere beats a wrong
 *             sound delivered confidently.
 *
 * Nothing here touches the narration-off path: when narration is off, no branch below
 * produces audio at all, which the acceptance also requires.
 */

/** What a line *is*, which decides what may produce it. */
export type SpokenKind =
  /** An isolated speech sound. Never synthesised, under any circumstances. */
  | "phoneme"
  /** A single word. A synthesiser says these acceptably. */
  | "word"
  /** A sentence of ordinary prose: an instruction, a question, a story. */
  | "line";

export type Delivery =
  | { via: "clip"; assetId: string; text: string }
  | { via: "speak"; text: string }
  | { via: "model"; cue: string; example: string | null; phoneme: string };

/**
 * Phoneme notation, as the catalogue writes it: `/m/`, `/sh/`, `/ă/`.
 *
 * Used to classify content, to catch prose that has slipped a phoneme inside it — which
 * a synthesiser reads aloud as "slash em slash" — and, exported, by
 * `scripts/check-audio.mjs`, so the guard and the policy cannot disagree about what a
 * phoneme is. They already did once, which is the story below.
 *
 * This was a hand-written list of IPA characters, and it silently missed every short
 * vowel the catalogue actually uses — `/ă/`, `/ĭ/`, `/ŏ/`, `/ĕ/`, `/ŭ/` are written with
 * a breve, which was not in the list. Five of the nineteen phase-one sounds were
 * invisible to this module and to the guard built on it, which is exactly the failure
 * both exist to prevent. A Unicode property escape cannot be incomplete in that way.
 *
 * Bounded to four characters so an ordinary path like `/lib/` is not mistaken for a
 * sound; digits are excluded, so `1/2` is not either.
 */
export const PHONEME_NOTATION = /\/[\p{L}\p{M}ːˈ]{1,4}\//u;

export function isPhonemeNotation(text: string): boolean {
  return PHONEME_NOTATION.test(text.trim());
}

/** True when a line of prose has a phoneme embedded in it. */
export function containsPhoneme(text: string): boolean {
  return PHONEME_NOTATION.test(text);
}

/**
 * The asset id for a recording, addressed by what it is and the locale it is in.
 *
 * Addressing by id and locale rather than by a file path is what lets the same activity
 * serve a different voice per language without the activity knowing (§WP-07.2). The
 * shape is stable and greppable, which matters because a recording session is an
 * offline job somebody runs against a list.
 */
export function audioAssetId(kind: SpokenKind, key: string, locale = "en"): string {
  const slug = key.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${kind}.${slug}.${locale}`;
}

/**
 * Decide how one thing gets said.
 *
 * `available` is the set of asset ids that actually have a recording behind them. It is
 * passed in rather than looked up so this stays pure and testable, and so the caller
 * can preload exactly what it is about to need.
 */
export function deliver(input: {
  kind: SpokenKind;
  /** The phoneme, word, or prose. For a phoneme this is the notation, e.g. `/m/`. */
  text: string;
  /** The key a recording is filed under. Defaults to the text. */
  key?: string;
  locale?: string;
  available?: ReadySet;
  /** How a grown-up makes the sound, for the `model` path. */
  cue?: string;
  /** A word the sound starts, for the `model` path. */
  example?: string | null;
}): Delivery {
  const locale = input.locale ?? "en";
  const assetId = audioAssetId(input.kind, input.key ?? input.text, locale);
  if (input.available?.has(assetId)) return { via: "clip", assetId, text: input.text };

  if (input.kind === "phoneme") {
    // The rule. No recording means no sound — a synthesiser would teach the schwa the
    // whole program exists to avoid.
    return {
      via: "model",
      cue: input.cue ?? "Say this sound together with a grown-up.",
      example: input.example ?? null,
      phoneme: input.text,
    };
  }

  // Prose that has a phoneme inside it would be read as "slash em slash". Speak the
  // part a synthesiser can say and leave the sound to the mouth cue.
  if (containsPhoneme(input.text)) {
    const spoken = withoutPhonemes(input.text);
    return spoken
      ? { via: "speak", text: spoken }
      : { via: "model", cue: input.cue ?? "Say this sound together with a grown-up.", example: input.example ?? null, phoneme: input.text };
  }

  return { via: "speak", text: input.text };
}

/**
 * Strip phoneme notation out of a line, leaving prose a synthesiser can read.
 *
 * Deliberately removes rather than rewrites. Turning `/m/` into "mmm" would be this
 * module inventing a pronunciation, which is the thing it exists to stop.
 */
export function withoutPhonemes(text: string): string {
  return text
    .replace(new RegExp(PHONEME_NOTATION.source, "giu"), " ")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.,!?])/g, "$1")
    .trim();
}

/** The asset ids that have a recording behind them. */
export type ReadySet = { has(assetId: string): boolean };

export function readySet(assetIds: Iterable<string>): ReadySet {
  const set = new Set(assetIds);
  return { has: (id) => set.has(id) };
}

/**
 * How much of the phase-one sound set is actually recorded.
 *
 * The recordings are an offline job, so the honest thing is to make the gap countable
 * rather than to discover it one missing clip at a time. `RELEASE_STATUS.md` can carry
 * this number, and the studio can show it.
 */
export function audioCoverage(
  required: { kind: SpokenKind; key: string }[],
  available: ReadySet,
  locale = "en",
) {
  const rows = required.map((item) => ({
    ...item,
    assetId: audioAssetId(item.kind, item.key, locale),
  }));
  const missing = rows.filter((row) => !available.has(row.assetId));
  const phonemes = rows.filter((row) => row.kind === "phoneme");
  const phonemesMissing = phonemes.filter((row) => !available.has(row.assetId));
  return {
    total: rows.length,
    recorded: rows.length - missing.length,
    missing: missing.map((row) => row.assetId),
    /** The number that matters: an unrecorded phoneme is one children cannot hear. */
    phonemeTotal: phonemes.length,
    phonemeRecorded: phonemes.length - phonemesMissing.length,
    complete: missing.length === 0,
  };
}
