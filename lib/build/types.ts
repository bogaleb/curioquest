import type { ByTier, LabTier } from "@/lib/science/types";

/**
 * The Build Yard.
 *
 * Four workshops where a child learns by making something and then testing it. Every
 * level is a construction — a program, a map, a tower, a shape — and every construction
 * is checked by a rule rather than compared to an answer, because there is almost never
 * only one right way to build a bridge or draw an island.
 *
 *   robot    Robot Garage     computing: sequences, debugging, loops
 *   map      Map Maker        geography: land and water, directions, grid references, routes
 *   tower    Tower & Bridge   science and engineering: balance, supports, bridges
 *   shapes   Shape Workshop   maths: patterns, counting, shapes, symmetry, fractions, area
 *
 * All four sit on the same grid, so one set of cells, one piece of art per tile and one
 * checker per rule cover the whole yard.
 */

export type BuildWorkshopId = "robot" | "map" | "tower" | "shapes";
export const buildWorkshopIds: BuildWorkshopId[] = ["robot", "map", "tower", "shapes"];

/** A grid cell, `[column, row]`, zero-based, row 0 at the top. */
export type Cell = [number, number];
export const cellKey = ([c, r]: Cell) => `${c},${r}`;

/** Every level carries the same teaching frame: the idea first, then the job, then help. */
type LevelBase = {
  id: string;
  tiers: LabTier[];
  /** Evidence goes here. Must be an active skill in `lib/skill-graph.ts`. */
  skillId: string;
  title: string;
  /** What to build. Spoken by the guide when the level opens. */
  goal: ByTier<string>;
  /** The idea behind it, shown before building: prior knowledge, or a worked example. */
  idea: ByTier<string>;
  /** Offered after a miss, never before. */
  hint: ByTier<string>;
  /** Said once it works: the explanation, and where else the idea turns up. */
  success: ByTier<string>;
  cols: number;
  rows: number;
};

/* ---------------------------------------------------------------- robot -- */

export type Heading = "N" | "E" | "S" | "W";
export type RobotCommand = "up" | "down" | "left" | "right" | "forward" | "turn-left" | "turn-right";
/** One card in the program. `times` above 1 is a loop ("repeat 3 times"). */
export type RobotStep = { cmd: RobotCommand; times: number };

export type RobotLevel = LevelBase & {
  workshop: "robot";
  /** `arrows` moves in screen directions; `turns` drives like a real robot: forward and turn. */
  mode: "arrows" | "turns";
  start: Cell;
  heading: Heading;
  /** Where the robot must stop. */
  flag: Cell;
  rocks: Cell[];
  gems: Cell[];
  /** The most cards the program may hold. Tight on loop levels, so a loop is the way through. */
  maxSteps: number;
  /** Whether the repeat control is offered. */
  loops: boolean;
  /** A debugging level: the program starts written, with a mistake in it. */
  starter?: RobotStep[];
};

/* ------------------------------------------------------------------ map -- */

export type MapTile =
  | "water" | "land" | "tree" | "house" | "school" | "mountain"
  | "road" | "bridge" | "treasure" | "park" | "shop";

/** Tiles that are ground rather than water, for island and lake rules. */
export const landTiles: MapTile[] = ["land", "tree", "house", "school", "mountain", "road", "treasure", "park", "shop"];

export type Direction = "N" | "S" | "E" | "W";

export type MapRule =
  /** One piece of land, water all the way round, not touching the edge. */
  | { kind: "island"; minSize: number }
  /** One pool of water, land all the way round. */
  | { kind: "lake"; minSize: number }
  /** Water from the left edge to the right edge. */
  | { kind: "river" }
  /** Exactly one `tile`, somewhere on the `dir` side of the `of` tile, in the same column or row. */
  | { kind: "place"; tile: MapTile; dir: Direction; of: MapTile }
  /** Exactly one `tile`, touching the `of` tile. */
  | { kind: "beside"; tile: MapTile; of: MapTile }
  /** Exactly one `tile`, at a grid reference like "C3". */
  | { kind: "at"; tile: MapTile; ref: string }
  /** A road (with bridges over water) joining `from` to `to`. */
  | { kind: "route"; from: MapTile; to: MapTile }
  /** Exactly `n` of a tile. */
  | { kind: "count"; tile: MapTile; n: number }
  | { kind: "all"; rules: MapRule[] };

export type MapLevel = LevelBase & {
  workshop: "map";
  /** What an empty cell is. */
  ground: "water" | "land";
  /** Tiles already on the map. These cannot be changed. */
  fixed: Record<string, MapTile>;
  palette: MapTile[];
  /** Letters along the top and numbers down the side. */
  labels: boolean;
  compass: boolean;
  rule: MapRule;
};

/* ---------------------------------------------------------------- tower -- */

/** A block, sitting with its left edge at column `x`, `y` levels above the ground. */
export type Block = { x: number; y: number; w: number };

export type TowerRule =
  /** Everything stands, and the top of it is at least `min` blocks up. */
  | { kind: "height"; min: number }
  /** Everything stands, and something crosses every gap column. */
  | { kind: "bridge" }
  /** Everything stands, and a block reaches `reach` columns out over the gap from the left bank. */
  | { kind: "overhang"; reach: number }
  /** Nothing to build: predict whether the tower that is already there will stand. */
  | { kind: "predict" };

export type TowerLevel = LevelBase & {
  workshop: "tower";
  /** Columns with no ground under them: the river. */
  gaps: number[];
  /** The block widths on offer. */
  widths: number[];
  /** How many blocks may be used. */
  maxBlocks: number;
  /** Blocks already placed. On a `predict` level this is the whole tower. */
  fixed: Block[];
  rule: TowerRule;
};

/* --------------------------------------------------------------- shapes -- */

export type ShapeColour = "red" | "blue" | "yellow" | "green";

export type ShapeRule =
  /** At least one of every colour listed, exactly this many of each. */
  | { kind: "count"; counts: Partial<Record<ShapeColour, number>> }
  /** The coloured cells make one solid rectangle with this many squares. */
  | { kind: "rectangle"; area: number; square?: boolean }
  /** The right half mirrors the left half across the line after column `axis - 1`. */
  | { kind: "mirror"; axis: number }
  /** Colour exactly `num/den` of the outlined shape. */
  | { kind: "fraction"; num: number; den: number }
  /** One solid shape with this area and perimeter. */
  | { kind: "area-perimeter"; area: number; perimeter: number }
  /** Carry on the pattern along row `row` to the end. */
  | { kind: "pattern"; row: number; unit: ShapeColour[] };

export type ShapesLevel = LevelBase & {
  workshop: "shapes";
  colours: ShapeColour[];
  fixed: Record<string, ShapeColour>;
  /** Cells the child may colour. Absent means every cell. */
  outline?: Cell[];
  rule: ShapeRule;
};

export type BuildLevel = RobotLevel | MapLevel | TowerLevel | ShapesLevel;

/* ---------------------------------------------------------- submissions -- */

/** What the browser sends: the thing the child built, never a claim that it worked. */
export type BuildSubmission =
  | { workshop: "robot"; program: RobotStep[] }
  | { workshop: "map"; tiles: Record<string, MapTile> }
  | { workshop: "tower"; blocks: Block[]; prediction?: "stand" | "fall" }
  | { workshop: "shapes"; cells: Record<string, ShapeColour> };

/** Why something did not work, in words a child can act on. */
export type BuildVerdict = { correct: boolean; message: string; errorKind?: string };

export type BuildWorkshop = {
  id: BuildWorkshopId;
  name: string;
  subject: string;
  blurb: ByTier<string>;
};
