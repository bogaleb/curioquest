import type { FormationStroke, StrokePoint, StudioTier, WritingCharacter, WritingGroup, WritingTask } from "./types";

/**
 * The writing desk's curriculum.
 *
 * What it replaces was a dotted capital letter and a disclaimer. Capitals only, no cues,
 * no lowercase, no words, no sentences, and no way for the product to know whether a
 * child had traced the letter or scribbled over it.
 *
 * ## The four lines
 *
 * Every character is authored in a 100×100 box against the four lines a writing book
 * actually prints:
 *
 *   ascender  y = 10   the top of a tall letter — b, d, h, k, l, t, and every capital
 *   midline   y = 42   the top of a small round letter — a, c, e, o
 *   baseline  y = 82   where letters sit
 *   descender y = 98   how far g, j, p, q and y hang below
 *
 * Getting those four right is most of what makes handwriting legible, and it is the part
 * a dotted outline with no lines around it cannot teach.
 *
 * ## Cues
 *
 * Every stroke carries the sentence a grown-up says while the child writes it — "round
 * like a ball, then straight down". That is not decoration: it is the thing handwriting
 * programmes actually teach, it is what an adult repeats at the table, and it is what a
 * child says under their breath a year later. A dotted line with no cue teaches copying;
 * a cue teaches formation.
 *
 * ## What this is not
 *
 * Not a handwriting *test*, and not a prescribed national script. Letter shapes differ
 * between countries and between schools, and a child taught a different `a` is not wrong.
 * The checker in `lib/studio/studio.ts` asks three things — did you start in the right
 * place, did you go the right way, did you stay near the line — and nothing else. It
 * never scores neatness.
 */

const ASCENDER = 10;
const MIDLINE = 42;
const BASELINE = 82;
const DESCENDER = 98;

export const writingLines = { ascender: ASCENDER, midline: MIDLINE, baseline: BASELINE, descender: DESCENDER };

/** Points along an ellipse, so a bowl is a curve rather than a polygon. */
function arc(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  from: number,
  to: number,
  steps = 22,
): StrokePoint[] {
  return Array.from({ length: steps + 1 }, (_, index) => {
    const angle = from + ((to - from) * index) / steps;
    return [round(cx + Math.cos(angle) * rx), round(cy + Math.sin(angle) * ry)] as StrokePoint;
  });
}

const round = (value: number) => Math.round(value * 10) / 10;

/** A stroke, from its points and the sentence that goes with it. */
const s = (points: StrokePoint[], cue: string): FormationStroke => ({ points, cue });

/** A straight run, sampled so the checker has points to compare against. */
function line(from: StrokePoint, to: StrokePoint, steps = 10): StrokePoint[] {
  return Array.from({ length: steps + 1 }, (_, index) => [
    round(from[0] + ((to[0] - from[0]) * index) / steps),
    round(from[1] + ((to[1] - from[1]) * index) / steps),
  ] as StrokePoint);
}

/* ==========================================================================
   WARM-UPS — the strokes every letter is made of
   ==========================================================================

   These come first for a reason. A child who cannot yet pull a straight line down or
   close a circle is not failing at letters; they have been handed letters too early.
   Every shape here turns up inside a letter later, and the cues match.
   ========================================================================== */

const warmups: WritingCharacter[] = [
  {
    key: "down",
    spoken: "a straight line down",
    strokes: [s(line([50, ASCENDER], [50, BASELINE]), "Start at the top. Pull straight down.")],
  },
  {
    key: "across",
    spoken: "a line across",
    strokes: [s(line([14, 46], [86, 46]), "Start on the left. Slide all the way across.")],
  },
  {
    key: "circle",
    spoken: "a circle",
    strokes: [s(arc(50, 50, 34, 34, 0, -2 * Math.PI, 28), "Start at the side. Go round like a ball, all the way home.")],
  },
  {
    key: "curve",
    spoken: "a curve",
    strokes: [s(arc(50, 40, 34, 30, Math.PI, 0, 20), "Start low, swing up and over, then back down.")],
  },
  {
    key: "zigzag",
    spoken: "a zigzag",
    strokes: [
      s(
        [[12, 24], [32, 74], [52, 24], [72, 74], [90, 24]].flatMap((point, index, all) =>
          index ? line(all[index - 1] as StrokePoint, point as StrokePoint, 6) : [point as StrokePoint],
        ),
        "Down, up, down, up. Sharp corners.",
      ),
    ],
  },
  {
    key: "wave",
    spoken: "a wave",
    strokes: [
      s(
        [
          ...arc(28, 50, 18, 16, Math.PI, 0, 12),
          ...arc(64, 50, 18, 16, Math.PI, 2 * Math.PI, 12),
        ],
        "Over the hill, then under the bridge.",
      ),
    ],
  },
  {
    key: "loop",
    spoken: "loops",
    strokes: [
      s(
        [
          ...arc(30, 50, 16, 24, Math.PI / 2, -Math.PI, 14),
          ...arc(62, 50, 16, 24, Math.PI, -Math.PI * 1.5, 14),
        ],
        "Round and up, round and up. Keep them the same size.",
      ),
    ],
  },
  {
    key: "cross",
    spoken: "a cross",
    strokes: [
      s(line([50, 16], [50, 84]), "Straight down the middle."),
      s(line([18, 50], [82, 50]), "Now across, right through the middle."),
    ],
  },
];

/* ==========================================================================
   LOWERCASE — the letters a child actually reads
   ==========================================================================

   Lowercase first, and lowercase in a *teaching* order rather than alphabetical: the
   letters that share a movement are together, because the whole point of learning `c`
   before `a`, `d`, `g`, `o` and `q` is that all five are the same round movement with
   something added.

   Alphabetical order is what a chart is for. It is a terrible order to learn in.
   ========================================================================== */

/** The round family: everything starts at two o'clock and goes back over the top. */
const bowl = (cx: number) => arc(cx, 62, 20, 20, -0.5, -0.5 - 2 * Math.PI, 26);

const lowercase: WritingCharacter[] = [
  { key: "c", spoken: "little c", example: "cat",
    strokes: [s(arc(52, 62, 20, 20, -0.6, -0.6 - 1.5 * Math.PI, 20), "Start under the line. Go back, round, and stop.")] },
  { key: "o", spoken: "little o", example: "otter",
    strokes: [s(bowl(50), "Back, round, and all the way home.")] },
  { key: "a", spoken: "little a", example: "apple",
    strokes: [s(bowl(48), "Back, round, and home."), s(line([68, MIDLINE], [68, BASELINE]), "Then straight down beside it.")] },
  { key: "d", spoken: "little d", example: "dog",
    strokes: [s(bowl(48), "Back, round, and home."), s(line([68, ASCENDER], [68, BASELINE]), "Up tall, then straight down.")] },
  { key: "g", spoken: "little g", example: "goat",
    strokes: [s(bowl(48), "Back, round, and home."), s([...line([68, MIDLINE], [68, 88], 8), ...arc(56, 88, 12, 10, 0, Math.PI / 2, 8)], "Down past the line, then a little hook back.")] },
  { key: "q", spoken: "little q", example: "queen",
    strokes: [s(bowl(48), "Back, round, and home."), s([...line([68, MIDLINE], [68, 90], 8), ...arc(76, 90, 8, 8, Math.PI, Math.PI / 2, 6)], "Down past the line, then a flick out the other way.")] },
  { key: "e", spoken: "little e", example: "egg",
    strokes: [s([...line([32, 62], [68, 62], 6), ...arc(50, 62, 18, 18, 0, -1.7 * Math.PI, 20)], "Across first, then back and round.")] },
  { key: "s", spoken: "little s", example: "sun",
    strokes: [s([...arc(56, 52, 14, 10, 0, -Math.PI, 10), ...arc(44, 72, 14, 10, 0, Math.PI, 10)], "Curve back, then curve the other way. Like a little snake.")] },

  { key: "i", spoken: "little i", example: "igloo",
    strokes: [s(line([50, MIDLINE], [50, BASELINE]), "Straight down."), s([[50, 28], [50, 30]], "Then a dot on top.")] },
  { key: "l", spoken: "little l", example: "leaf",
    strokes: [s(line([50, ASCENDER], [50, BASELINE]), "All the way from the top, straight down.")] },
  { key: "t", spoken: "little t", example: "tree",
    strokes: [s(line([52, 20], [52, BASELINE]), "Tall, but not all the way up. Straight down."), s(line([34, MIDLINE], [70, MIDLINE], 6), "Then a line across at the middle.")] },
  { key: "u", spoken: "little u", example: "umbrella",
    strokes: [s([...line([32, MIDLINE], [32, 70], 6), ...arc(50, 70, 18, 12, Math.PI, 2 * Math.PI, 10), ...line([68, 70], [68, MIDLINE], 4)], "Down, round the bottom, and back up."), s(line([68, MIDLINE], [68, BASELINE], 6), "Then straight down again.")] },
  { key: "y", spoken: "little y", example: "yellow",
    strokes: [s([...line([32, MIDLINE], [32, 70], 6), ...arc(50, 70, 18, 12, Math.PI, 2 * Math.PI, 10)], "Down and round, like a u."), s([...line([68, MIDLINE], [68, 88], 8), ...arc(56, 88, 12, 10, 0, Math.PI / 2, 8)], "Then down past the line with a tail.")] },
  { key: "j", spoken: "little j", example: "jug",
    strokes: [s([...line([56, MIDLINE], [56, 88], 8), ...arc(44, 88, 12, 10, 0, Math.PI / 2, 8)], "Down past the line, then hook back."), s([[56, 28], [56, 30]], "Then a dot on top.")] },

  { key: "r", spoken: "little r", example: "rabbit",
    strokes: [s(line([36, MIDLINE], [36, BASELINE]), "Straight down."), s(arc(52, 54, 16, 12, Math.PI, -0.2, 10), "Back up, and over a tiny shoulder.")] },
  { key: "n", spoken: "little n", example: "nest",
    strokes: [s(line([34, MIDLINE], [34, BASELINE]), "Straight down."), s([...line([34, 60], [34, 54], 3), ...arc(50, 56, 16, 14, Math.PI, 0, 12), ...line([66, 56], [66, BASELINE], 6)], "Back up, over the bridge, and down.")] },
  { key: "m", spoken: "little m", example: "moon",
    strokes: [s(line([26, MIDLINE], [26, BASELINE]), "Straight down."), s([...line([26, 58], [26, 52], 3), ...arc(38, 54, 12, 12, Math.PI, 0, 10), ...line([50, 54], [50, BASELINE], 6)], "Back up and over the first bridge."), s([...line([50, 58], [50, 52], 3), ...arc(62, 54, 12, 12, Math.PI, 0, 10), ...line([74, 54], [74, BASELINE], 6)], "Back up and over the second bridge.")] },
  { key: "h", spoken: "little h", example: "hat",
    strokes: [s(line([34, ASCENDER], [34, BASELINE]), "All the way from the top, straight down."), s([...line([34, 60], [34, 54], 3), ...arc(50, 56, 16, 14, Math.PI, 0, 12), ...line([66, 56], [66, BASELINE], 6)], "Back up, over the bridge, and down.")] },
  { key: "b", spoken: "little b", example: "bird",
    strokes: [s(line([34, ASCENDER], [34, BASELINE]), "All the way from the top, straight down."), s(arc(52, 64, 18, 18, Math.PI, -Math.PI, 18), "Back up a little, then round the tummy to the bottom.")] },
  { key: "p", spoken: "little p", example: "pig",
    strokes: [s(line([34, MIDLINE], [34, DESCENDER]), "Down, and keep going past the line."), s(arc(52, 60, 18, 18, Math.PI, -Math.PI, 18), "Back up, then round the tummy.")] },
  { key: "k", spoken: "little k", example: "kite",
    strokes: [s(line([34, ASCENDER], [34, BASELINE]), "All the way from the top, straight down."), s(line([66, 50], [36, 64], 6), "In from the side to the middle."), s(line([40, 62], [68, BASELINE], 6), "Then kick back out to the bottom.")] },

  { key: "v", spoken: "little v", example: "van",
    strokes: [s([...line([32, MIDLINE], [50, BASELINE], 6), ...line([50, BASELINE], [68, MIDLINE], 6)], "Down to a point, then back up.")] },
  { key: "w", spoken: "little w", example: "worm",
    strokes: [s([...line([24, MIDLINE], [38, BASELINE], 5), ...line([38, BASELINE], [50, 54], 5), ...line([50, 54], [62, BASELINE], 5), ...line([62, BASELINE], [76, MIDLINE], 5)], "Down, up, down, up. Two little v's together.")] },
  { key: "x", spoken: "little x", example: "fox",
    strokes: [s(line([32, MIDLINE], [68, BASELINE]), "Down this way."), s(line([68, MIDLINE], [32, BASELINE]), "Then down the other way, crossing over.")] },
  { key: "z", spoken: "little z", example: "zip",
    strokes: [s([...line([32, MIDLINE], [68, MIDLINE], 5), ...line([68, MIDLINE], [32, BASELINE], 6), ...line([32, BASELINE], [68, BASELINE], 5)], "Across, back down the slope, and across again.")] },

  { key: "f", spoken: "little f", example: "fish",
    strokes: [s([...arc(52, 26, 14, 12, 0, -Math.PI, 10), ...line([38, 26], [38, BASELINE], 8)], "Curve over the top, then straight down."), s(line([24, MIDLINE], [56, MIDLINE], 6), "Then a line across the middle.")] },
];

/* ==========================================================================
   CAPITALS
   ==========================================================================

   All the same height — top line to baseline — which is the single most useful thing to
   know about them and the thing a child gets wrong first. Grouped by movement again:
   the straight ones, then the ones with a curve, then the diagonals.
   ========================================================================== */

const T = ASCENDER;
const B = BASELINE;
const capitals: WritingCharacter[] = [
  { key: "L", spoken: "big L", example: "Lion", strokes: [s([...line([32, T], [32, B], 10), ...line([32, B], [70, B], 6)], "Straight down, then across the bottom.")] },
  { key: "T", spoken: "big T", example: "Tree", strokes: [s(line([26, T], [74, T], 8), "Across the top."), s(line([50, T], [50, B], 10), "Then straight down the middle.")] },
  { key: "I", spoken: "big I", example: "Ice", strokes: [s(line([50, T], [50, B], 10), "Straight down.")] },
  { key: "E", spoken: "big E", example: "Egg", strokes: [s([...line([32, T], [32, B], 10), ...line([32, B], [70, B], 6)], "Down, then across the bottom."), s(line([32, T], [70, T], 6), "Across the top."), s(line([32, 46], [64, 46], 5), "And a shorter one in the middle.")] },
  { key: "F", spoken: "big F", example: "Fox", strokes: [s(line([32, T], [32, B], 10), "Straight down."), s(line([32, T], [70, T], 6), "Across the top."), s(line([32, 46], [64, 46], 5), "And a shorter one in the middle.")] },
  { key: "H", spoken: "big H", example: "House", strokes: [s(line([30, T], [30, B], 10), "Down on this side."), s(line([70, T], [70, B], 10), "Down on that side."), s(line([30, 46], [70, 46], 6), "Then join them in the middle.")] },
  { key: "D", spoken: "big D", example: "Dog", strokes: [s(line([32, T], [32, B], 10), "Straight down."), s(arc(32, 46, 38, 36, -Math.PI / 2, Math.PI / 2, 16), "Back to the top, then a big curve down to the bottom.")] },
  { key: "P", spoken: "big P", example: "Pig", strokes: [s(line([32, T], [32, B], 10), "Straight down."), s(arc(32, 30, 32, 20, -Math.PI / 2, Math.PI / 2, 14), "Back to the top, then round and in.")] },
  { key: "B", spoken: "big B", example: "Bear", strokes: [s(line([32, T], [32, B], 10), "Straight down."), s(arc(32, 28, 30, 18, -Math.PI / 2, Math.PI / 2, 12), "Back to the top, round the first tummy."), s(arc(32, 64, 34, 18, -Math.PI / 2, Math.PI / 2, 12), "Then round the second, bigger tummy.")] },
  { key: "R", spoken: "big R", example: "Rain", strokes: [s(line([32, T], [32, B], 10), "Straight down."), s(arc(32, 30, 32, 20, -Math.PI / 2, Math.PI / 2, 14), "Back to the top, round and in."), s(line([36, 50], [72, B], 7), "Then a leg kicking out.")] },
  { key: "C", spoken: "big C", example: "Cat", strokes: [s(arc(52, 46, 30, 36, -0.6, -0.6 - 1.5 * Math.PI, 20), "Start near the top. Go back, round, and stop.")] },
  { key: "G", spoken: "big G", example: "Goat", strokes: [s(arc(52, 46, 30, 36, -0.6, -0.6 - 1.5 * Math.PI, 20), "Back, round, and stop."), s([...line([82, 46], [56, 46], 5), ...line([56, 46], [56, 58], 3)], "Then straight in, and a little hook down.")] },
  { key: "O", spoken: "big O", example: "Owl", strokes: [s(arc(50, 46, 32, 36, -0.5, -0.5 - 2 * Math.PI, 28), "Back, round, and all the way home.")] },
  { key: "Q", spoken: "big Q", example: "Queen", strokes: [s(arc(50, 42, 30, 32, -0.5, -0.5 - 2 * Math.PI, 26), "Back, round, and home."), s(line([58, 64], [84, 90], 6), "Then a tail out of the bottom.")] },
  { key: "S", spoken: "big S", example: "Sun", strokes: [s([...arc(58, 30, 22, 18, 0, -Math.PI, 12), ...arc(42, 62, 22, 20, 0, Math.PI, 12)], "Curve back, then curve the other way.")] },
  { key: "U", spoken: "big U", example: "Umbrella", strokes: [s([...line([30, T], [30, 60], 7), ...arc(50, 60, 20, 22, Math.PI, 2 * Math.PI, 12), ...line([70, 60], [70, T], 7)], "Down, round the bottom, and all the way back up.")] },
  { key: "J", spoken: "big J", example: "Jug", strokes: [s([...line([64, T], [64, 62], 8), ...arc(46, 62, 18, 20, 0, Math.PI, 10)], "Down, then hook round at the bottom.")] },
  { key: "M", spoken: "big M", example: "Moon", strokes: [s([...line([24, B], [24, T], 8), ...line([24, T], [50, 54], 6), ...line([50, 54], [76, T], 6), ...line([76, T], [76, B], 8)], "Up, down into the valley, up again, and down.")] },
  { key: "N", spoken: "big N", example: "Nest", strokes: [s([...line([30, B], [30, T], 8), ...line([30, T], [70, B], 8), ...line([70, B], [70, T], 8)], "Up, down the slope, and up again.")] },
  { key: "A", spoken: "big A", example: "Apple", strokes: [s(line([26, B], [50, T], 8), "Up the first side."), s(line([50, T], [74, B], 8), "Down the other side."), s(line([34, 58], [66, 58], 5), "Then a belt across the middle.")] },
  { key: "V", spoken: "big V", example: "Van", strokes: [s([...line([28, T], [50, B], 8), ...line([50, B], [72, T], 8)], "Down to a point, then straight back up.")] },
  { key: "W", spoken: "big W", example: "Whale", strokes: [s([...line([20, T], [34, B], 6), ...line([34, B], [50, 42], 6), ...line([50, 42], [66, B], 6), ...line([66, B], [80, T], 6)], "Down, up, down, up.")] },
  { key: "X", spoken: "big X", example: "Fox", strokes: [s(line([30, T], [70, B], 10), "Down this way."), s(line([70, T], [30, B], 10), "Then down the other way, crossing over.")] },
  { key: "Y", spoken: "big Y", example: "Yellow", strokes: [s(line([28, T], [50, 50], 6), "In from this side."), s(line([72, T], [50, 50], 6), "In from that side, to meet it."), s(line([50, 50], [50, B], 6), "Then straight down to the bottom.")] },
  { key: "Z", spoken: "big Z", example: "Zebra", strokes: [s([...line([28, T], [72, T], 6), ...line([72, T], [28, B], 8), ...line([28, B], [72, B], 6)], "Across, back down the slope, and across again.")] },
  { key: "K", spoken: "big K", example: "Kite", strokes: [s(line([32, T], [32, B], 10), "Straight down."), s(line([72, T], [34, 50], 7), "In from the top corner."), s(line([38, 48], [74, B], 7), "Then kick back out to the bottom.")] },
];

/* ==========================================================================
   NUMERALS
   ========================================================================== */

const numerals: WritingCharacter[] = [
  { key: "1", spoken: "one", strokes: [s([...line([36, 24], [52, T], 4), ...line([52, T], [52, B], 9)], "A little flick up, then straight down.")] },
  { key: "2", spoken: "two", strokes: [s([...arc(50, 30, 20, 18, Math.PI, 0.3, 14), ...line([62, 44], [28, B], 8), ...line([28, B], [72, B], 6)], "Round the top, down the slope, then across the bottom.")] },
  { key: "3", spoken: "three", strokes: [s([...arc(50, 28, 20, 17, Math.PI, 1.2, 12), ...arc(48, 62, 22, 19, -1.9, 1.5, 14)], "Round the top, then round the bottom. Two bumps.")] },
  { key: "4", spoken: "four", strokes: [s([...line([64, T], [26, 58], 8), ...line([26, 58], [76, 58], 7)], "Down the slope, then across."), s(line([64, T], [64, B], 9), "Then straight down through it.")] },
  { key: "5", spoken: "five", strokes: [s(line([70, T], [32, T], 6), "Across the top."), s(line([32, T], [32, 44], 5), "Down the side."), s(arc(48, 62, 22, 20, -Math.PI, 1.3, 16), "Then a big tummy round to the bottom.")] },
  { key: "6", spoken: "six", strokes: [s([...arc(50, 60, 22, 22, -1.6, -Math.PI, 12), ...arc(50, 60, 22, 22, Math.PI, -Math.PI - 2 * Math.PI, 18)], "Curve down from the top, then round the little ball.")] },
  { key: "7", spoken: "seven", strokes: [s([...line([28, T], [72, T], 6), ...line([72, T], [40, B], 9)], "Across the top, then slide down the slope.")] },
  { key: "8", spoken: "eight", strokes: [s([...arc(50, 28, 18, 17, -0.5, -0.5 - 2 * Math.PI, 18), ...arc(50, 62, 22, 19, -Math.PI / 2, -Math.PI / 2 - 2 * Math.PI, 18)], "A little ball on top, a bigger ball below.")] },
  { key: "9", spoken: "nine", strokes: [s([...arc(52, 32, 20, 20, -0.5, -0.5 - 2 * Math.PI, 20), ...line([72, 32], [72, B], 8)], "Round the ball at the top, then straight down.")] },
  { key: "0", spoken: "zero", strokes: [s(arc(50, 46, 24, 36, -0.5, -0.5 - 2 * Math.PI, 28), "Back, round, and all the way home. Tall and thin.")] },
];

/* ==========================================================================
   THE GROUPS A CHILD SEES
   ========================================================================== */

const ALL: StudioTier[] = ["explorer", "investigator", "scientist"];
const OLDER: StudioTier[] = ["investigator", "scientist"];

export const writingGroups: WritingGroup[] = [
  {
    id: "warmups",
    title: { explorer: "Wiggles and lines", investigator: "Warm-ups", scientist: "Stroke practice" },
    note: {
      explorer: "Big arm, small line. Let's move.",
      investigator: "Every letter is made of these. Warm your hand up first.",
      scientist: "These eight movements build every letter there is. Get them even and the letters follow.",
    },
    tiers: ALL,
    skillId: "LIT.PK.WRITE.STROKE_01",
    characters: warmups,
  },
  {
    id: "lowercase",
    title: { explorer: "Little letters", investigator: "Little letters", scientist: "Lowercase" },
    note: {
      explorer: "These are the ones in books. Start with c.",
      investigator: "These are the letters you read most. The round ones are all the same movement.",
      scientist: "Grouped by movement rather than alphabet: c, o, a, d, g and q are one hand shape with different endings.",
    },
    tiers: ALL,
    skillId: "LIT.PK.WRITE.LETTER_01",
    characters: lowercase,
  },
  {
    id: "capitals",
    title: { explorer: "Big letters", investigator: "Big letters", scientist: "Capitals" },
    note: {
      explorer: "Big letters all start at the top.",
      investigator: "Every capital is the same height, top line to bottom line.",
      scientist: "Capitals are uniform height and mostly straight. They came first historically, which is why they are simpler.",
    },
    tiers: ALL,
    skillId: "LIT.PK.WRITE.LETTER_01",
    characters: capitals,
  },
  {
    id: "numerals",
    title: { explorer: "Numbers", investigator: "Numbers", scientist: "Numerals" },
    note: {
      explorer: "Let's write the numbers.",
      investigator: "Numbers sit between the top line and the bottom line, like capitals.",
      scientist: "Numerals are the same height as capitals. The common slip is starting 5 and 2 at the wrong end.",
    },
    tiers: ALL,
    skillId: "LIT.PK.WRITE.LETTER_01",
    characters: numerals,
  },
];

export const writingGroupById = new Map(writingGroups.map((group) => [group.id, group]));

export function groupsForTier(tier: StudioTier): WritingGroup[] {
  return writingGroups.filter((group) => group.tiers.includes(tier));
}

/** Every character in the desk, for the tests and for the character lookup. */
export const allWritingCharacters: WritingCharacter[] = writingGroups.flatMap((group) => group.characters);

/* ==========================================================================
   WORDS AND SENTENCES
   ==========================================================================

   The step after letters, and the step the old studio skipped entirely: it went from
   tracing a capital to a blank canvas with a text box on it.

   Words are decodable — every one can be sounded out from letters the reading slice has
   already taught — so writing practice and reading practice reinforce each other instead
   of running as two unrelated tracks. Sentences are openings to finish rather than blank
   pages, because a blank page is the hardest writing task there is.
   ========================================================================== */

const word = (id: string, seed: string, art: WritingTask["art"], tiers: StudioTier[], prompt: WritingTask["prompt"]): WritingTask => ({
  id, kind: "word", tiers, skillId: "LIT.G1.WRITE.WORD_01", seed, art, prompt,
});

const sentence = (id: string, seed: string, art: WritingTask["art"], tiers: StudioTier[], prompt: WritingTask["prompt"]): WritingTask => ({
  id, kind: "sentence", tiers, skillId: "LIT.G1.WRITE.SENTENCE_01", seed, art, prompt,
});

export const writingTasks: WritingTask[] = [
  word("w-cat", "cat", "ear", ALL, {
    explorer: "Write: cat",
    investigator: "Say each sound, then write: c-a-t",
    scientist: "Three sounds, three letters. Write: cat",
  }),
  word("w-sun", "sun", "sun", ALL, {
    explorer: "Write: sun",
    investigator: "Say each sound, then write: s-u-n",
    scientist: "Three sounds, three letters. Write: sun",
  }),
  word("w-dog", "dog", "paw", ALL, {
    explorer: "Write: dog",
    investigator: "Say each sound, then write: d-o-g",
    scientist: "Watch the g: it hangs below the line. Write: dog",
  }),
  word("w-fish", "fish", "fin", OLDER, {
    explorer: "Write: fish",
    investigator: "Four letters, three sounds — sh is one sound. Write: fish",
    scientist: "The sh digraph is two letters making one sound. Write: fish",
  }),
  word("w-tree", "tree", "leaf", OLDER, {
    explorer: "Write: tree",
    investigator: "Two e's together say a long ee. Write: tree",
    scientist: "The ee vowel team. Write: tree",
  }),
  word("w-moon", "moon", "crescent", OLDER, {
    explorer: "Write: moon",
    investigator: "Two o's together say oo. Write: moon",
    scientist: "The oo vowel team. Write: moon",
  }),

  sentence("s-like", "I like ", "heart", ALL, {
    explorer: "Finish it: I like …",
    investigator: "Finish the sentence. Start with a capital and end with a full stop.",
    scientist: "Finish the sentence, with a capital at the start and a full stop at the end.",
  }),
  sentence("s-see", "I can see a ", "eye", ALL, {
    explorer: "Finish it: I can see a …",
    investigator: "Finish the sentence, then read it back to someone.",
    scientist: "Finish the sentence, then read it back and check the full stop is there.",
  }),
  sentence("s-once", "One day, a little ", "star", OLDER, {
    explorer: "Finish it: One day, a little …",
    investigator: "This is the start of a story. Write what happens next.",
    scientist: "A story opening. Write the next sentence, and make something change in it.",
  }),
  sentence("s-because", "I made this because ", "flame", OLDER, {
    explorer: "Finish it: I made this because …",
    investigator: "Tell someone why you made your picture.",
    scientist: "Explain your choice. 'Because' sentences are the hardest kind to write and the most useful.",
  }),
];

export function tasksForTier(tier: StudioTier): WritingTask[] {
  return writingTasks.filter((task) => task.tiers.includes(tier));
}

export function characterByKey(groupId: string, key: string): WritingCharacter | undefined {
  return writingGroupById.get(groupId)?.characters.find((entry) => entry.key === key);
}
