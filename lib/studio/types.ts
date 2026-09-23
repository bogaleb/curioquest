import type { LabTier } from "@/lib/science/types";

/**
 * The Making Place content model.
 *
 * Three rooms — colouring, drawing, writing — built the way the Wonder Lab is built:
 * the content is data, the drawing lives in the child layer, and age is authored rather
 * than computed.
 *
 * What was here before was one canvas and a list of twenty-six colouring pages drawn as
 * imperative `ctx` calls inside a 90-line function. It worked, and three things were
 * wrong with it. The colouring pages were *outlines only*, so "colouring in" meant
 * scribbling with a brush and hoping — the one thing a colouring book has to do, fill a
 * shape neatly, it could not do. The stamps and the room doors were emoji, which is
 * somebody else's artwork on a child's screen (§A). And every child got the same nine
 * colours, the same seven tools and the same sentence, whether they were three or nine.
 *
 * ## The shape grammar
 *
 * A colouring page is not a drawing. It is a list of **pieces**: named parts, each one a
 * shape from a closed catalogue, placed on a 200×200 field. That buys the thing a canvas
 * outline cannot give — every piece is a region a child can tap and fill, with its own
 * name to read out and its own suggested colour to ignore. It also means a new page is a
 * record in `lib/studio/pages.ts` rather than forty lines of canvas calls, and that the
 * same catalogue supplies the drawing room's stamps.
 *
 * ## Tiers
 *
 * The lab's three voices, reused deliberately (`LabTier`). A child who is a `scientist`
 * in the lab is not a different person in the studio, and two parallel tier systems would
 * drift apart the first time one of them was edited.
 */

export type StudioTier = LabTier;

/** Copy that exists once per tier. */
export type ByTier<T> = Record<StudioTier, T>;

/* ==========================================================================
   THE SHAPE CATALOGUE
   ==========================================================================

   Every shape has one drawing in `components/kid/studio/shapes.tsx`, defined in a
   0–100 unit box and placed by the piece. Keeping it a closed union is what makes the
   "every page is drawable" test possible, and it stops the pages drifting ahead of the
   drawing: a new shape is a new picture, on purpose.
   ========================================================================== */

export type PieceShape =
  /* bodies and blobs */
  | "circle" | "oval" | "blob" | "egg" | "pear" | "teardrop"
  /* geometry */
  | "square" | "rounded" | "triangle" | "diamond" | "arch" | "stripe" | "crescent"
  /* growing things */
  | "petal" | "leaf" | "stem" | "trunk" | "bush" | "grass"
  /* creature parts */
  | "ear" | "earRound" | "eye" | "pupil" | "beak" | "nose" | "mouth" | "wing" | "fin"
  | "tail" | "tailCurl" | "paw" | "horn" | "spot" | "shell" | "spike" | "whisker"
  /* built things */
  | "roof" | "window" | "door" | "wheel" | "flag" | "chimney" | "sail" | "cloudPuff"
  /* sky and water */
  | "star" | "heart" | "sun" | "ray" | "wave" | "bubble" | "flame" | "snowCrystal";

/** Where a piece sits, in a 200×200 field. Percentages of the field, not pixels. */
export type Piece = {
  id: string;
  shape: PieceShape;
  /** Centre of the piece. */
  x: number;
  y: number;
  /** Width and height, in field units. */
  w: number;
  h: number;
  /** Degrees, clockwise. Omit for none. */
  rot?: number;
  /** Mirrored horizontally — so an ear, a wing or a fin is drawn once. */
  flip?: boolean;
  /**
   * The colour this piece starts as, before the child touches it. A named tone from
   * `lib/studio/palette.ts`, or `paper` for an uncoloured region.
   *
   * These are suggestions in the weakest sense: a page opens with them as a pale tint so
   * the picture reads as a picture rather than as a wireframe, and the first tap replaces
   * one outright. A colouring book that scores a child on staying near the suggestion is
   * not a colouring book.
   */
  tone: string;
  /** What this part is, in child words. Read aloud, and the accessible name of the region. */
  name: string;
  /**
   * True for a part that is drawn on top and never filled — an eye's pupil, a whisker, a
   * mouth. Tapping one fills the piece underneath it instead, which is what a child
   * expects when they aim at a face and hit an eyebrow.
   */
  detail?: boolean;
};

export type ColouringPage = {
  id: string;
  /** Parent-facing, and the default artwork name. */
  title: string;
  /** Child-facing, per tier. */
  childTitle: ByTier<string>;
  /** The shelf it sits on. */
  theme: PageTheme;
  /** Which children this page is offered to. A page for nobody is a bug. */
  tiers: StudioTier[];
  /** Roughly how many pieces there are to fill; drives the "how big is this" mark. */
  pieces: Piece[];
  /** One line Nova says when the page opens. Never an instruction. */
  invitation: ByTier<string>;
};

export type PageTheme =
  | "animals"
  | "nature"
  | "ocean"
  | "space"
  | "machines"
  | "home"
  | "weather"
  | "celebration";

export const pageThemes: PageTheme[] = [
  "animals", "nature", "ocean", "space", "machines", "home", "weather", "celebration",
];

/* ==========================================================================
   COLOUR
   ========================================================================== */

/**
 * A colour a child can choose, with a name they can say.
 *
 * Names matter more than they look like they do. "Sunflower" and "moss" are things in
 * the world; `#f3b843` is a token, and a four-year-old asking a grown-up for "the one
 * that looks like the sea" is doing vocabulary work that a hex swatch cannot support.
 */
export type StudioColour = {
  id: string;
  /** Child-facing. One or two words. */
  name: string;
  /** The CSS custom property in `app/tokens.css` this resolves to. Never a raw hex. */
  token: string;
  /** Which family it belongs to, for the palette's layout. */
  family: ColourFamily;
};

export type ColourFamily = "warm" | "cool" | "green" | "earth" | "bright" | "quiet";

/* ==========================================================================
   WRITING
   ==========================================================================

   The part of the studio that actually teaches something, and the part the old one had
   least of: a dotted capital letter and a sentence saying letter styles can differ.

   A stroke is the unit. Letters are made of ordered strokes, each with a starting point,
   a direction and a spoken cue — "down, and around like a ball" — because that cue is
   what a handwriting programme actually teaches and what a grown-up repeats. The child
   traces it and the tracing is *checked*: did they start in the right place, did they go
   the right way, did they stay near the line. All three are answerable from the points a
   pointer already produces.
   ========================================================================== */

/** A point in the letter's own 100×100 box. */
export type StrokePoint = [number, number];

export type FormationStroke = {
  /** Ordered points, start first. The child must begin near the first one. */
  points: StrokePoint[];
  /** What a grown-up says while the child writes it. The heart of the teaching. */
  cue: string;
};

export type WritingCharacter = {
  /** The character itself: "a", "A", "7", or a stroke name like "zigzag". */
  key: string;
  /** What to call it out loud. "Little a", "Big A", "seven", "a zigzag". */
  spoken: string;
  strokes: FormationStroke[];
  /** A word that starts with it, for the letter rooms. Omitted for strokes and digits. */
  example?: string;
};

export type WritingGroup = {
  id: string;
  /** Child-facing name of this set. */
  title: ByTier<string>;
  /** Why these are together — spoken by Nova when the set opens. */
  note: ByTier<string>;
  /** Which children are offered it. */
  tiers: StudioTier[];
  /** The skill an attempt here is evidence for. Must exist in `lib/skill-graph.ts`. */
  skillId: string;
  characters: WritingCharacter[];
};

/**
 * Writing past single letters: a word to build from its sounds, or a sentence to finish.
 *
 * Deliberately not free-typing with a blank page. A blank page is the hardest writing
 * task there is, and offering it to a five-year-old as the only option is how a writing
 * room ends up unused.
 */
export type WritingTask = {
  id: string;
  kind: "word" | "sentence";
  tiers: StudioTier[];
  skillId: string;
  /** What the child is asked to write. */
  prompt: ByTier<string>;
  /** For a word: the word. For a sentence: the opening the child finishes. */
  seed: string;
  /** A drawn thing to put beside it, from the shape catalogue. */
  art: PieceShape;
};

/* ==========================================================================
   DRAWING
   ========================================================================== */

/** What a child draws with. The set offered narrows for the youngest band. */
export type StudioTool =
  | "pencil"
  | "crayon"
  | "marker"
  | "brush"
  | "fill"
  | "stamp"
  | "eraser";

export const studioTools: StudioTool[] = [
  "pencil", "crayon", "marker", "brush", "fill", "stamp", "eraser",
];

/** An invitation to draw something. Never a task with a right answer. */
export type DrawingPrompt = {
  id: string;
  tiers: StudioTier[];
  /** One line, child-facing. */
  text: ByTier<string>;
  /** A drawn thing to show beside it. */
  art: PieceShape;
};

/* ==========================================================================
   WHAT THE BROWSER SEES
   ========================================================================== */

/** A colouring page resolved for one child. */
export type PublicPage = {
  id: string;
  title: string;
  childTitle: string;
  theme: PageTheme;
  invitation: string;
  pieces: Piece[];
};

/** What a child has coloured, saved as part of the artwork. */
export type PageFills = Record<string, string>;
