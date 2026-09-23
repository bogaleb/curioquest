import {
  cellKey,
  landTiles,
  type Block,
  type BuildLevel,
  type BuildSubmission,
  type BuildVerdict,
  type Cell,
  type Heading,
  type MapLevel,
  type MapRule,
  type MapTile,
  type RobotLevel,
  type RobotStep,
  type ShapeColour,
  type ShapesLevel,
  type TowerLevel,
} from "./types";

/**
 * The Build Yard's rules: pure functions, no React and no storage.
 *
 * The browser runs the same simulations to *animate* a robot driving or a tower falling,
 * but only the server's run of `judgeBuild` decides whether a level is done and writes
 * the evidence. A child's construction goes up; a verdict comes back.
 */

const inside = (level: { cols: number; rows: number }, [c, r]: Cell) =>
  c >= 0 && r >= 0 && c < level.cols && r < level.rows;
const same = (a: Cell, b: Cell) => a[0] === b[0] && a[1] === b[1];
const parseKey = (key: string): Cell => key.split(",").map(Number) as Cell;
const neighbours = ([c, r]: Cell): Cell[] => [[c, r - 1], [c + 1, r], [c, r + 1], [c - 1, r]];

/** "C3" → column 2, row 2. */
export function gridRef(ref: string): Cell {
  return [ref.toUpperCase().charCodeAt(0) - 65, Number(ref.slice(1)) - 1];
}
export function refFor([c, r]: Cell) {
  return `${String.fromCharCode(65 + c)}${r + 1}`;
}

/* =========================================================================
   ROBOT
   ========================================================================= */

const step: Record<Heading, Cell> = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
const arrowHeading: Record<string, Heading> = { up: "N", right: "E", down: "S", left: "W" };
const turnLeft: Record<Heading, Heading> = { N: "W", W: "S", S: "E", E: "N" };
const turnRight: Record<Heading, Heading> = { N: "E", E: "S", S: "W", W: "N" };

export type RobotFrame = { at: Cell; heading: Heading; step: number; gems: string[] };
export type RobotOutcome = "goal" | "rock" | "edge" | "short" | "past" | "gems";
export type RobotRun = { frames: RobotFrame[]; outcome: RobotOutcome; failedStep: number | null };

/** The commands a mode accepts. */
export function robotCommands(level: RobotLevel) {
  return level.mode === "arrows"
    ? (["up", "down", "left", "right"] as const)
    : (["forward", "turn-left", "turn-right"] as const);
}

/** Drive the program. Every frame is one move or turn, tagged with the card it came from. */
export function runRobot(level: RobotLevel, program: RobotStep[]): RobotRun {
  let at: Cell = [...level.start];
  let heading = level.heading;
  const gems: string[] = [];
  let visitedGoal = false;
  const frames: RobotFrame[] = [{ at, heading, step: -1, gems: [] }];
  let moves = 0;
  for (let index = 0; index < program.length; index += 1) {
    const card = program[index];
    for (let time = 0; time < card.times; time += 1) {
      if ((moves += 1) > 80) return { frames, outcome: "short", failedStep: index };
      let move = true;
      if (card.cmd === "turn-left") { heading = turnLeft[heading]; move = false; }
      else if (card.cmd === "turn-right") { heading = turnRight[heading]; move = false; }
      else if (card.cmd !== "forward") heading = arrowHeading[card.cmd];
      if (move) {
        const next: Cell = [at[0] + step[heading][0], at[1] + step[heading][1]];
        if (!inside(level, next)) return { frames, outcome: "edge", failedStep: index };
        if (level.rocks.some((rock) => same(rock, next))) return { frames, outcome: "rock", failedStep: index };
        at = next;
        const gem = level.gems.find((g) => same(g, at));
        if (gem && !gems.includes(cellKey(gem))) gems.push(cellKey(gem));
        if (same(at, level.flag)) visitedGoal = true;
      }
      frames.push({ at, heading, step: index, gems: [...gems] });
    }
  }
  if (!same(at, level.flag)) return { frames, outcome: visitedGoal ? "past" : "short", failedStep: null };
  if (gems.length < level.gems.length) return { frames, outcome: "gems", failedStep: null };
  return { frames, outcome: "goal", failedStep: null };
}

export function robotMessage(run: RobotRun): string {
  const card = run.failedStep === null ? "" : ` on card ${run.failedStep + 1}`;
  switch (run.outcome) {
    case "goal": return "The robot made it!";
    case "rock": return `Bump! The robot hit a rock${card}. Change that card and try again.`;
    case "edge": return `The robot nearly drove off the map${card}. Which way should it go instead?`;
    case "past": return "The robot went past the flag. Take a card away so it stops on the flag.";
    case "gems": return "The robot reached the flag, but it missed a gem. Plan a path through every gem.";
    default: return "The robot stopped before the flag. It needs more cards to get there.";
  }
}

function validProgram(level: RobotLevel, program: unknown): program is RobotStep[] {
  if (!Array.isArray(program) || !program.length || program.length > level.maxSteps) return false;
  const allowed: readonly string[] = robotCommands(level);
  const most = level.loops ? 9 : 1;
  return program.every(
    (card) =>
      card && typeof card === "object" &&
      allowed.includes((card as RobotStep).cmd) &&
      Number.isInteger((card as RobotStep).times) &&
      (card as RobotStep).times >= 1 && (card as RobotStep).times <= most,
  );
}

/* =========================================================================
   MAP
   ========================================================================= */

export type MapGrid = MapTile[][];

/** What sits at a cell before the child touches it. */
export function mapBase(level: MapLevel, key: string): MapTile {
  return level.fixed[key] ?? level.ground;
}

/** The whole map, rows of tiles, from the fixed tiles and the child's. */
export function mapGrid(level: MapLevel, tiles: Record<string, MapTile>): MapGrid {
  return Array.from({ length: level.rows }, (_, r) =>
    Array.from({ length: level.cols }, (_, c) => {
      const key = `${c},${r}`;
      // A bridge is the one thing that may go on water already on the map.
      if (level.fixed[key] === "water" && tiles[key] === "bridge") return "bridge";
      return level.fixed[key] ?? tiles[key] ?? level.ground;
    }),
  );
}

/**
 * Can this tile go here, on the map as it is now? Returns a reason when it cannot.
 *
 * The one physical rule is the teaching point of the river levels: things built on land
 * sink in water, and a bridge is the thing you build over water instead.
 */
export function mapPlacement(level: MapLevel, current: MapTile, key: string, tile: MapTile): string | null {
  if (level.fixed[key] && !(level.fixed[key] === "water" && tile === "bridge")) {
    return level.fixed[key] === "water" ? mapPlacement({ ...level, fixed: {} }, "water", key, tile) : "That was already on the map. Build around it.";
  }
  if (tile === "bridge" && current !== "water" && current !== "bridge") return "Bridges go over water.";
  if (current === "water" && tile !== "water" && tile !== "land" && tile !== "bridge") {
    return tile === "road" ? "A road would sink in the water. Try a bridge!" : "That would sink! It needs land under it.";
  }
  return null;
}

const isLand = (tile: MapTile) => landTiles.includes(tile);

function groups(grid: MapGrid, match: (tile: MapTile) => boolean): Cell[][] {
  const seen = new Set<string>();
  const found: Cell[][] = [];
  grid.forEach((row, r) =>
    row.forEach((tile, c) => {
      if (!match(tile) || seen.has(`${c},${r}`)) return;
      const group: Cell[] = [];
      const queue: Cell[] = [[c, r]];
      seen.add(`${c},${r}`);
      while (queue.length) {
        const cell = queue.shift()!;
        group.push(cell);
        for (const next of neighbours(cell)) {
          const k = cellKey(next);
          if (!seen.has(k) && grid[next[1]]?.[next[0]] !== undefined && match(grid[next[1]][next[0]])) {
            seen.add(k);
            queue.push(next);
          }
        }
      }
      found.push(group);
    }),
  );
  return found;
}

const onEdge = (grid: MapGrid, [c, r]: Cell) => c === 0 || r === 0 || r === grid.length - 1 || c === grid[0].length - 1;
const cellsOf = (grid: MapGrid, tile: MapTile): Cell[] =>
  grid.flatMap((row, r) => row.flatMap((t, c) => (t === tile ? [[c, r] as Cell] : [])));

const dirWords = { N: "north", S: "south", E: "east", W: "west" } as const;

export function checkMap(grid: MapGrid, rule: MapRule): BuildVerdict {
  const ok = (message: string): BuildVerdict => ({ correct: true, message });
  const no = (message: string, errorKind: string): BuildVerdict => ({ correct: false, message, errorKind });
  switch (rule.kind) {
    case "island": {
      const land = groups(grid, isLand);
      if (!land.length) return no("Add some land to the sea.", "empty");
      if (land.length > 1) return no(`You have made ${land.length} pieces of land. An island here is one piece.`, "split");
      if (land[0].some((cell) => onEdge(grid, cell))) return no("Your land touches the edge of the map. An island needs water all the way round.", "touches-edge");
      if (land[0].length < rule.minSize) return no(`Make your island a little bigger: at least ${rule.minSize} squares.`, "too-small");
      return ok("That is an island: land with water all the way round.");
    }
    case "lake": {
      const lakes = groups(grid, (tile) => tile === "water").filter((group) => !group.some((cell) => onEdge(grid, cell)));
      if (!lakes.length) {
        return cellsOf(grid, "water").length
          ? no("Your water reaches the edge of the map. A lake needs land all the way round.", "touches-edge")
          : no("Add some water for your lake.", "empty");
      }
      if (!lakes.some((lake) => lake.length >= rule.minSize)) return no(`Make your lake at least ${rule.minSize} squares.`, "too-small");
      return ok("That is a lake: water with land all the way round.");
    }
    case "river": {
      const wet = (tile: MapTile) => tile === "water" || tile === "bridge";
      const reaches = groups(grid, wet).some(
        (group) => group.some(([c]) => c === 0) && group.some(([c]) => c === grid[0].length - 1),
      );
      return reaches ? ok("Your river flows all the way across the land.") : no("A river flows all the way across. Join the water from one side to the other.", "not-joined");
    }
    case "place":
    case "beside":
    case "at": {
      const placed = cellsOf(grid, rule.tile);
      if (!placed.length) return no(`Put the ${rule.tile} on the map.`, "missing");
      if (placed.length > 1) return no(`There are ${placed.length} of those. Keep just one ${rule.tile}.`, "too-many");
      const [c, r] = placed[0];
      if (rule.kind === "at") {
        const [tc, tr] = gridRef(rule.ref);
        if (c === tc && r === tr) return ok(`Yes: ${rule.ref} means column ${rule.ref[0]}, row ${rule.ref.slice(1)}.`);
        if (c === tc) return no(`Right column! Now find row ${rule.ref.slice(1)}.`, "wrong-row");
        if (r === tr) return no(`Right row! Now find column ${rule.ref[0]}.`, "wrong-column");
        return no(`That is ${refFor([c, r])}. Find the letter along the top first, then the number down the side.`, "wrong-cell");
      }
      const anchors = cellsOf(grid, rule.of);
      if (rule.kind === "beside") {
        return anchors.some((a) => neighbours(a).some((n) => same(n, [c, r])))
          ? ok(`The ${rule.tile} is right next to the ${rule.of}.`)
          : no(`Move the ${rule.tile} so it touches the ${rule.of}.`, "not-beside");
      }
      const good = anchors.some(([ac, ar]) =>
        rule.dir === "N" ? c === ac && r < ar : rule.dir === "S" ? c === ac && r > ar : rule.dir === "E" ? r === ar && c > ac : r === ar && c < ac,
      );
      if (good) return ok(`The ${rule.tile} is ${dirWords[rule.dir]} of the ${rule.of}.`);
      const opposite = { N: "S", S: "N", E: "W", W: "E" } as const;
      const flipped = anchors.some(([ac, ar]) => {
        const d = opposite[rule.dir];
        return d === "N" ? c === ac && r < ar : d === "S" ? c === ac && r > ar : d === "E" ? r === ar && c > ac : r === ar && c < ac;
      });
      return flipped
        ? no(`That is ${dirWords[opposite[rule.dir]]} of the ${rule.of}. Look at the compass: which way is ${dirWords[rule.dir]}?`, "opposite-direction")
        : no(`Put the ${rule.tile} in a straight line ${dirWords[rule.dir]} of the ${rule.of}. Check the compass.`, "off-line");
    }
    case "route": {
      const starts = cellsOf(grid, rule.from);
      const ends = cellsOf(grid, rule.to);
      const path = (tile: MapTile) => tile === "road" || tile === "bridge";
      const seen = new Set<string>();
      const queue: Cell[] = starts.flatMap((s) => neighbours(s)).filter((n) => grid[n[1]]?.[n[0]] && path(grid[n[1]][n[0]]));
      queue.forEach((cell) => seen.add(cellKey(cell)));
      while (queue.length) {
        const cell = queue.shift()!;
        if (ends.some((end) => neighbours(end).some((n) => same(n, cell)))) return ok(`The road joins the ${rule.from} to the ${rule.to}.`);
        for (const next of neighbours(cell)) {
          const tile = grid[next[1]]?.[next[0]];
          if (tile && path(tile) && !seen.has(cellKey(next))) { seen.add(cellKey(next)); queue.push(next); }
        }
      }
      return no(`The road does not reach the ${rule.to} yet. Road squares must touch side to side, not corner to corner.`, "gap-in-route");
    }
    case "count": {
      const n = cellsOf(grid, rule.tile).length;
      return n === rule.n ? ok(`Exactly ${rule.n}.`) : no(`You need exactly ${rule.n} ${rule.tile}${rule.n === 1 ? "" : "s"}. You have ${n}.`, n > rule.n ? "too-many" : "too-few");
    }
    case "all": {
      for (const part of rule.rules) {
        const verdict = checkMap(grid, part);
        if (!verdict.correct) return verdict;
      }
      return ok("Your map does everything it needs to.");
    }
  }
}

/* =========================================================================
   TOWER
   ========================================================================= */

const overlap = (a: Block, b: Block) => Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);

/** Where a new block lands if dropped with its left edge at `x`: the top of whatever is under it. */
export function dropHeight(blocks: Block[], x: number, w: number): number {
  return blocks.reduce((top, b) => (overlap(b, { x, y: 0, w }) > 0 ? Math.max(top, b.y + 1) : top), 0);
}

/**
 * Which blocks fall.
 *
 * Children's statics, but honest: a block stands when the centre of mass of it and of
 * everything balanced only on it sits over what holds it up — ground on either bank, or
 * the blocks directly beneath. A block resting on two supports (a bridge deck) is carried
 * by both, so it counts against neither. Anything resting on a falling block falls too.
 */
export function towerFalls(level: Pick<TowerLevel, "gaps">, blocks: Block[]): Set<number> {
  const below = blocks.map((b) =>
    b.y === 0 ? [] : blocks.map((s, i) => (s.y === b.y - 1 && overlap(s, b) > 0 ? i : -1)).filter((i) => i >= 0),
  );
  const support = blocks.map((b, i) => {
    if (b.y === 0) {
      const ground = Array.from({ length: b.w }, (_, k) => b.x + k).filter((col) => !level.gaps.includes(col));
      return ground.length ? [Math.min(...ground), Math.max(...ground) + 1] : null;
    }
    const spans = below[i].map((s) => [Math.max(b.x, blocks[s].x), Math.min(b.x + b.w, blocks[s].x + blocks[s].w)]);
    return spans.length ? [Math.min(...spans.map((s) => s[0])), Math.max(...spans.map((s) => s[1]))] : null;
  });
  // Blocks that rest on exactly this one, transitively: their weight is this block's to carry.
  const load = (i: number, seen = new Set<number>()): { mass: number; moment: number } => {
    seen.add(i);
    const b = blocks[i];
    let mass = b.w, moment = b.w * (b.x + b.w / 2);
    blocks.forEach((_, j) => {
      if (!seen.has(j) && below[j].length === 1 && below[j][0] === i) {
        const part = load(j, seen);
        mass += part.mass; moment += part.moment;
      }
    });
    return { mass, moment };
  };
  const falls = new Set<number>();
  const order = blocks.map((_, i) => i).sort((a, b) => blocks[a].y - blocks[b].y);
  for (const i of order) {
    const span = support[i];
    if (!span || below[i].some((s) => falls.has(s))) { falls.add(i); continue; }
    const { mass, moment } = load(i);
    const centre = moment / mass;
    if (centre < span[0] - 1e-9 || centre > span[1] + 1e-9) falls.add(i);
  }
  return falls;
}

function validTower(level: TowerLevel, blocks: unknown): blocks is Block[] {
  if (!Array.isArray(blocks) || blocks.length > level.fixed.length + level.maxBlocks) return false;
  const typed = blocks as Block[];
  if (!typed.every((b) => b && Number.isInteger(b.x) && Number.isInteger(b.y) && Number.isInteger(b.w) && b.x >= 0 && b.y >= 0 && b.x + b.w <= level.cols && b.y < level.rows)) return false;
  // The fixed blocks come first and are unchanged; every block rests on something.
  if (!level.fixed.every((f, i) => typed[i] && typed[i].x === f.x && typed[i].y === f.y && typed[i].w === f.w)) return false;
  if (!typed.slice(level.fixed.length).every((b) => level.widths.includes(b.w))) return false;
  const filled = new Set<string>();
  for (const b of typed) for (let k = 0; k < b.w; k += 1) {
    const key = `${b.x + k},${b.y}`;
    if (filled.has(key)) return false;
    filled.add(key);
  }
  return typed.every((b) => b.y === 0 || typed.some((s) => s.y === b.y - 1 && overlap(s, b) > 0));
}

export function checkTower(level: TowerLevel, blocks: Block[], prediction?: "stand" | "fall"): BuildVerdict {
  const falls = towerFalls(level, blocks);
  if (level.rule.kind === "predict") {
    const stands = falls.size === 0;
    if (!prediction) return { correct: false, message: "Choose first: will it stand or fall?", errorKind: "no-prediction" };
    const right = (prediction === "stand") === stands;
    return right
      ? { correct: true, message: stands ? "You were right: it stands, because its weight is over what holds it up." : "You were right: it falls, because too much weight hangs past its support." }
      : { correct: false, message: stands ? "It stands after all! Its weight is still over the block holding it." : "It falls! Too much weight hangs out past the block underneath.", errorKind: stands ? "predicted-fall" : "predicted-stand" };
  }
  if (!blocks.length) return { correct: false, message: "Add some blocks first.", errorKind: "empty" };
  if (falls.size) return { correct: false, message: "Some blocks fell. Weight needs something underneath it. Try a wider base, or put the heavy part over the middle.", errorKind: "unstable" };
  const rule = level.rule;
  if (rule.kind === "height") {
    const top = Math.max(...blocks.map((b) => b.y + 1));
    return top >= rule.min
      ? { correct: true, message: `A tower ${top} blocks tall, and it stands!` }
      : { correct: false, message: `It stands! Now make it ${rule.min} blocks tall. It is ${top} now.`, errorKind: "too-short" };
  }
  const covers = (col: number) => blocks.some((b) => b.x <= col && col < b.x + b.w);
  if (rule.kind === "bridge") {
    // Covering the water is not enough: a block hanging off one bank covers it too. A
    // bridge is one connected structure that reaches land on both sides.
    const left = Math.min(...level.gaps) - 1, right = Math.max(...level.gaps) + 1;
    const joined = (a: Block, b: Block) => Math.abs(a.y - b.y) === 1 && overlap(a, b) > 0;
    const seen = new Set<number>();
    const spans = blocks.map((_, start) => {
      if (seen.has(start)) return null;
      const group = [start];
      seen.add(start);
      for (let k = 0; k < group.length; k += 1) {
        blocks.forEach((other, j) => {
          if (!seen.has(j) && joined(blocks[group[k]], other)) { seen.add(j); group.push(j); }
        });
      }
      return [Math.min(...group.map((i) => blocks[i].x)), Math.max(...group.map((i) => blocks[i].x + blocks[i].w - 1))];
    });
    const across = spans.some((span) => span && span[0] <= left && span[1] >= right);
    if (across) return { correct: true, message: "Your bridge crosses the river, and it holds!" };
    return level.gaps.every(covers)
      ? { correct: false, message: "It covers the water, but it only touches one side. A bridge needs land at both ends.", errorKind: "one-bank" }
      : { correct: false, message: "The bridge does not reach all the way across the water yet.", errorKind: "not-across" };
  }
  const target = Math.min(...level.gaps) + rule.reach - 1;
  return covers(target)
    ? { correct: true, message: "It reaches out over the water and stays up. The weight behind balances the part hanging out." }
    : { correct: false, message: `Reach further: ${rule.reach} squares out over the water.`, errorKind: "too-short" };
}

/* =========================================================================
   SHAPES
   ========================================================================= */

export function shapeCells(level: ShapesLevel, cells: Record<string, ShapeColour>): Record<string, ShapeColour> {
  return { ...cells, ...level.fixed };
}

function perimeter(cells: Cell[]) {
  const set = new Set(cells.map(cellKey));
  return cells.reduce((sum, cell) => sum + neighbours(cell).filter((n) => !set.has(cellKey(n))).length, 0);
}

export function checkShapes(level: ShapesLevel, filled: Record<string, ShapeColour>): BuildVerdict {
  const ok = (message: string): BuildVerdict => ({ correct: true, message });
  const no = (message: string, errorKind: string): BuildVerdict => ({ correct: false, message, errorKind });
  const cells = Object.keys(filled).map(parseKey);
  const rule = level.rule;
  switch (rule.kind) {
    case "count": {
      for (const [colour, n] of Object.entries(rule.counts)) {
        const have = Object.values(filled).filter((c) => c === colour).length;
        if (have !== n) return no(`You need ${n} ${colour}. You have ${have}. Count them with your finger.`, have > n! ? "too-many" : "too-few");
      }
      if (Object.values(filled).some((c) => !(c in rule.counts))) return no("Use only the colours in the job.", "extra-colour");
      return ok("Counted exactly right!");
    }
    case "rectangle":
    case "area-perimeter": {
      if (!cells.length) return no("Colour some squares first.", "empty");
      const area = rule.area;
      if (rule.kind === "area-perimeter" && groups(asGrid(level, filled), (t) => t !== "water").length !== 1) {
        return no("Make one shape, with every square touching another side to side.", "split");
      }
      if (cells.length !== area) return no(`Your shape has ${cells.length} squares. It needs ${area}.`, cells.length > area ? "too-many" : "too-few");
      if (rule.kind === "area-perimeter") {
        const p = perimeter(cells);
        return p === rule.perimeter
          ? ok(`Area ${area} squares, perimeter ${p} edges. Both right!`)
          : no(`The area is right. The perimeter is ${p}, not ${rule.perimeter}. Count the edges all the way round. ${p < rule.perimeter ? "A longer, thinner shape has more edge." : "A more squashed-together shape has less edge."}`, "wrong-perimeter");
      }
      const cs = cells.map(([c]) => c), rs = cells.map(([, r]) => r);
      const w = Math.max(...cs) - Math.min(...cs) + 1, h = Math.max(...rs) - Math.min(...rs) + 1;
      if (w * h !== area) return no("All the squares are there, but it is not a rectangle yet. Fill it in so every row is the same length.", "not-rectangle");
      if (rule.square && w !== h) return no("That is a rectangle! A square has all four sides the same length.", "not-square");
      return ok(rule.square ? `A square: ${w} by ${h}.` : `A rectangle ${w} squares wide and ${h} tall: ${h} rows of ${w} makes ${area}.`);
    }
    case "mirror": {
      let any = false;
      for (let r = 0; r < level.rows; r += 1) for (let c = 0; c < rule.axis; c += 1) {
        const left = filled[`${c},${r}`], right = filled[`${2 * rule.axis - 1 - c},${r}`];
        if (right) any = true;
        if (left !== right) return no(`Row ${r + 1} does not match yet. Each square on the right should be the same distance from the fold line as its partner.`, "not-mirrored");
      }
      return any ? ok("Perfectly symmetrical: fold it along the line and the two halves match.") : no("Colour the right side to match the left.", "empty");
    }
    case "fraction": {
      const outline = level.outline ?? [];
      const need = (outline.length * rule.num) / rule.den;
      const have = outline.filter((cell) => filled[cellKey(cell)]).length;
      if (have === need) return ok(`${have} out of ${outline.length} squares: that is ${rule.num}/${rule.den}.`);
      return no(`The shape has ${outline.length} squares. ${rule.num}/${rule.den} of ${outline.length} is ${need}. You coloured ${have}.`, have > need ? "too-many" : "too-few");
    }
    case "pattern": {
      for (let c = 0; c < level.cols; c += 1) {
        const want = rule.unit[c % rule.unit.length], have = filled[`${c},${rule.row}`];
        if (have !== want) return no(have ? `Square ${c + 1} breaks the pattern. Say the colours out loud from the start.` : "Keep going to the end of the row.", have ? "wrong-colour" : "unfinished");
      }
      return ok("The pattern repeats all the way along!");
    }
  }
}

/** The shape cells as a map grid, so the shared grouping helper can find connected pieces. */
function asGrid(level: ShapesLevel, filled: Record<string, ShapeColour>): MapGrid {
  return Array.from({ length: level.rows }, (_, r) => Array.from({ length: level.cols }, (_, c) => (filled[`${c},${r}`] ? "land" : "water")));
}

/* =========================================================================
   JUDGING
   ========================================================================= */

/**
 * Judge a submission against a level. Returns null when the submission is not a shape
 * this level can take, so the route can answer 400 rather than record nonsense.
 */
export function judgeBuild(level: BuildLevel, submission: BuildSubmission): BuildVerdict | null {
  if (submission.workshop !== level.workshop) return null;
  if (level.workshop === "robot" && submission.workshop === "robot") {
    if (!validProgram(level, submission.program)) return null;
    const run = runRobot(level, submission.program);
    return { correct: run.outcome === "goal", message: robotMessage(run), errorKind: run.outcome === "goal" ? undefined : run.outcome };
  }
  if (level.workshop === "map" && submission.workshop === "map") {
    const tiles = submission.tiles;
    if (!tiles || typeof tiles !== "object") return null;
    for (const [key, tile] of Object.entries(tiles)) {
      if (!/^\d+,\d+$/.test(key) || !inside(level, parseKey(key)) || !level.palette.includes(tile) && tile !== level.ground) return null;
      if (level.fixed[key] && !(level.fixed[key] === "water" && tile === "bridge")) return null;
      const base = mapBase(level, key);
      if (tile === "bridge" && base !== "water") return null;
      if (base === "water" && !level.palette.includes("land") && !["water", "bridge"].includes(tile)) return null;
    }
    return checkMap(mapGrid(level, tiles), level.rule);
  }
  if (level.workshop === "tower" && submission.workshop === "tower") {
    if (!validTower(level, submission.blocks)) return null;
    const prediction = submission.prediction === "stand" || submission.prediction === "fall" ? submission.prediction : undefined;
    return checkTower(level, submission.blocks, prediction);
  }
  if (level.workshop === "shapes" && submission.workshop === "shapes") {
    const cells = submission.cells;
    if (!cells || typeof cells !== "object") return null;
    const allowed = level.outline ? new Set(level.outline.map(cellKey)) : null;
    for (const [key, colour] of Object.entries(cells)) {
      if (!/^\d+,\d+$/.test(key) || !inside(level, parseKey(key)) || !level.colours.includes(colour)) return null;
      if (allowed && !allowed.has(key) && !level.fixed[key]) return null;
    }
    return checkShapes(level, shapeCells(level, cells));
  }
  return null;
}
