/**
 * The marks in the Treasure Chest (WP-11 §3.5).
 *
 * Seventeen achievements were drawn with seventeen Lucide icons — a compass, a brain, a
 * globe, a speech bubble — each a 1.7px grey stroke in a white card. They read as a
 * settings screen, which is what the chest read as.
 *
 * These are six drawn marks, and the seventeen achievements map onto them by what the
 * achievement is *about* rather than one-to-one. That is a deliberate trade. Seventeen
 * distinct drawings at this size would be seventeen things to tell apart in a grid, and
 * every card already carries its own name and its own sentence; what the picture has to do
 * is say "this is a thing you earned" and give the grid some variety. A one-to-one set is
 * worth commissioning when there is an illustrator; six good ones beat seventeen thin ones.
 *
 * Earned and unearned are the same drawing. The chest dims and de-saturates the unearned
 * ones in CSS rather than swapping in a padlock, because a padlock says "withheld" and
 * these are simply not collected yet.
 */
type ArtProps = { className?: string };

const base = {
  viewBox: "0 0 80 80",
  "aria-hidden": true as const,
  focusable: "false" as const,
};

/** A ribboned medal. The everyday award. */
function MedalMark({ className }: ArtProps) {
  return (
    <svg {...base} className={className}>
      <path className="kid-award-ribbon" d="M26 6h12l-4 26h-14zM54 6H42l4 26h14z" />
      <circle className="kid-award-face" cx="40" cy="50" r="24" />
      <circle className="kid-award-rim" cx="40" cy="50" r="24" />
      <path className="kid-award-mark" d="M40 38l4 9 10 1-7 7 2 10-9-5-9 5 2-10-7-7 10-1z" />
    </svg>
  );
}

/** A wreath of leaves. Growth, practice, coming back. */
function WreathMark({ className }: ArtProps) {
  return (
    <svg {...base} className={className}>
      <path className="kid-award-leaf" d="M40 72c-16-4-26-17-26-32 0-8 3-15 8-20 4 8 4 18 2 26 4-8 10-14 16-16-2 10-2 22 0 42z" />
      <path className="kid-award-leaf" d="M40 72c16-4 26-17 26-32 0-8-3-15-8-20-4 8-4 18-2 26-4-8-10-14-16-16 2 10 2 22 0 42z" />
      <circle className="kid-award-face" cx="40" cy="34" r="13" />
      <circle className="kid-award-rim" cx="40" cy="34" r="13" />
    </svg>
  );
}

/** A key. Something opened. */
function KeyMark({ className }: ArtProps) {
  return (
    <svg {...base} className={className}>
      <circle className="kid-award-face" cx="28" cy="28" r="17" />
      <circle className="kid-award-rim" cx="28" cy="28" r="17" />
      <circle className="kid-award-hole" cx="28" cy="28" r="7" />
      <path className="kid-award-shaft" d="M38 40 66 68M54 56l8 8M48 50l8 8" />
    </svg>
  );
}

/** A gem. The rare one. */
function GemMark({ className }: ArtProps) {
  return (
    <svg {...base} className={className}>
      <path className="kid-award-face" d="M20 20h40l14 18-34 38L6 38z" />
      <path className="kid-award-facet" d="M20 20 34 38 40 76 6 38zM60 20 46 38l-6 38 34-38z" />
      <path className="kid-award-rim" d="M20 20h40l14 18-34 38L6 38z" />
      <path className="kid-award-shine" d="M26 26h10l-4 10z" />
    </svg>
  );
}

/** A feather. Something said, written or told. */
function FeatherMark({ className }: ArtProps) {
  return (
    <svg {...base} className={className}>
      <path className="kid-award-face" d="M58 8c8 16 4 36-10 48-8 7-18 10-26 10 0-10 3-22 10-31C42 24 50 14 58 8z" />
      <path className="kid-award-rim" d="M58 8c8 16 4 36-10 48-8 7-18 10-26 10 0-10 3-22 10-31C42 24 50 14 58 8z" />
      <path className="kid-award-shaft" d="M58 8 16 68" />
    </svg>
  );
}

/** A little flag on a summit. A journey finished. */
function SummitMark({ className }: ArtProps) {
  return (
    <svg {...base} className={className}>
      <path className="kid-award-hill" d="M4 70c10-24 22-38 36-38s26 14 36 38z" />
      <path className="kid-award-shaft" d="M40 34V8" />
      <path className="kid-award-face" d="M42 10h24l-7 8 7 8H42z" />
      <path className="kid-award-rim" d="M42 10h24l-7 8 7 8H42z" />
    </svg>
  );
}

/**
 * Which mark an achievement gets.
 *
 * Keyed by the icon names `lib/achievements.ts` already uses, so the content does not
 * have to change and an achievement added later falls back to the medal rather than to
 * nothing.
 */
const MARKS: Record<string, (props: ArtProps) => React.ReactElement> = {
  compass: SummitMark,
  map: SummitMark,
  footprints: SummitMark,
  mountain: SummitMark,
  flag: SummitMark,
  globe: SummitMark,

  sparkles: GemMark,
  star: GemMark,

  award: MedalMark,
  trophy: MedalMark,

  brain: WreathMark,
  rotate: WreathMark,
  heart: WreathMark,

  lightbulb: KeyMark,

  message: FeatherMark,
  palette: FeatherMark,
  book: FeatherMark,
};

export function AwardMark({ icon, className = "kid-award-art" }: { icon: string; className?: string }) {
  const Mark = MARKS[icon] ?? MedalMark;
  return <Mark className={className} />;
}

/**
 * The chest itself, open, with its lid tipped back.
 *
 * It sits at the head of the screen and is the one thing that says what this place is —
 * the heading used to do that job with an ALL-CAPS kicker and a sentence.
 */
export function TreasureChestArt() {
  return (
    <svg className="kid-chest-art" viewBox="0 0 260 180" aria-hidden="true" focusable="false">
      <ellipse className="kid-chest-rest" cx="130" cy="168" rx="104" ry="12" />

      {/* The lid, hinged at the back and tipped open. Drawn first so the box in front
          of it reads as nearer, which is what makes the chest look open rather than
          like a box with a hat on. */}
      <g transform="rotate(-16 40 70)">
        <path className="kid-chest-lid" d="M40 70a90 40 0 0 1 180 0z" />
        <path className="kid-chest-lid-deep" d="M130 30a90 40 0 0 1 90 40h-90z" />
        <path className="kid-chest-band" d="M120 32h20v38h-20z" />
      </g>

      {/* Light coming out of it: what says there is something inside without
          having to draw anything specific. */}
      <path className="kid-chest-glow" d="M40 86h180l-30-26H70z" />

      {/* The box. */}
      <rect className="kid-chest-body" x="34" y="84" width="192" height="76" rx="10" />
      <path className="kid-chest-body-deep" d="M176 84h40a10 10 0 0 1 10 10v56a10 10 0 0 1-10 10h-40z" />
      <path className="kid-chest-band" d="M118 84h24v76h-24z" />
      <circle className="kid-chest-lock" cx="130" cy="118" r="10" />
      <path className="kid-chest-line" d="M34 134h192" />
    </svg>
  );
}
