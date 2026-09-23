import { one, t2, t3 } from "@/lib/science/tier";
import type { LabTier } from "@/lib/science/types";
import type { BuildLevel, BuildWorkshop, BuildWorkshopId, Cell, MapTile, ShapeColour } from "./types";

/**
 * Everything a child can build in the yard.
 *
 * Each workshop climbs through the three tiers, and inside a tier the levels are ordered:
 * the first one can be done by copying the idea card, the last one asks for the idea to be
 * used somewhere new (transfer). Debugging and prediction levels are mixed in on purpose —
 * finding the mistake in someone else's program, and saying what will happen before
 * testing it, are both stronger learning than building from nothing every time.
 */

const E: LabTier[] = ["explorer"];
const EI: LabTier[] = ["explorer", "investigator"];
const I: LabTier[] = ["investigator"];
const IS: LabTier[] = ["investigator", "scientist"];
const S: LabTier[] = ["scientist"];

export const buildWorkshops: BuildWorkshop[] = [
  {
    id: "robot", name: "Robot Garage", subject: "Coding",
    blurb: t3("Tell the robot where to go, one step at a time.", "Program a robot. Find the bugs and fix them.", "Write programs with turns and loops, and debug them."),
  },
  {
    id: "map", name: "Map Maker", subject: "Geography",
    blurb: t3("Make islands, lakes and roads.", "Build maps and use north, south, east and west.", "Use grid references, compass directions and routes."),
  },
  {
    id: "tower", name: "Tower & Bridge Lab", subject: "Science",
    blurb: t3("Build towers. Will they stand or fall?", "Build towers and bridges that stay up.", "Balance, supports and counterweights: engineer it."),
  },
  {
    id: "shapes", name: "Shape Workshop", subject: "Maths",
    blurb: t3("Colours, patterns, counting and shapes.", "Rectangles, mirror pictures and halves.", "Fractions, symmetry, area and perimeter."),
  },
];

const fixedTiles = (entries: [Cell, MapTile][]) => Object.fromEntries(entries.map(([[c, r], t]) => [`${c},${r}`, t]));
const fixedColours = (entries: [Cell, ShapeColour][]) => Object.fromEntries(entries.map(([[c, r], t]) => [`${c},${r}`, t]));
const rect = (c0: number, r0: number, w: number, h: number): Cell[] =>
  Array.from({ length: w * h }, (_, i) => [c0 + (i % w), r0 + Math.floor(i / w)] as Cell);

/* =========================================================================
   ROBOT GARAGE — computing
   ========================================================================= */

const robot: BuildLevel[] = [
  {
    id: "robot-roll-home", workshop: "robot", tiers: E, skillId: "LOGIC.PK.CODE.SEQUENCE_01",
    title: "Roll home", cols: 5, rows: 3, mode: "arrows", start: [0, 1], heading: "E", flag: [3, 1], rocks: [], gems: [], maxSteps: 5, loops: false,
    goal: one("Get the robot to the flag."),
    idea: t2("A robot only does what you tell it. One arrow card moves it one square.", "Programs are instructions in order."),
    hint: t2("Count the squares to the flag. Use that many arrow cards.", "Count the squares between the robot and the flag."),
    success: t2("You gave the robot a program: steps in order. That is coding!", "A program is a list of steps, done in order."),
  },
  {
    id: "robot-round-rock", workshop: "robot", tiers: E, skillId: "LOGIC.PK.CODE.SEQUENCE_01",
    title: "Round the rock", cols: 4, rows: 3, mode: "arrows", start: [0, 0], heading: "E", flag: [2, 0], rocks: [[1, 0]], gems: [], maxSteps: 6, loops: false,
    goal: one("A rock is in the way! Go round it to the flag."),
    idea: t2("If something is in the way, go down, across, then back up.", "Plan the path first, then write the steps."),
    hint: t2("Try down first. Then right, right. Then up.", "Go down, across twice, then up."),
    success: t2("You planned a way round. Planning first is what coders do.", "Planning the route before writing steps is called an algorithm."),
  },
  {
    id: "robot-gem", workshop: "robot", tiers: EI, skillId: "LOGIC.PK.CODE.SEQUENCE_01",
    title: "Grab the gem", cols: 4, rows: 4, mode: "arrows", start: [0, 3], heading: "N", flag: [2, 1], rocks: [], gems: [[0, 1]], maxSteps: 6, loops: false,
    goal: one("Pick up the gem on the way to the flag."),
    idea: t2("Go to the gem first, then to the flag.", "Break the trip into two parts: to the gem, then to the flag."),
    hint: t2("Up, up to the gem. Then right, right.", "Up twice to the gem, then right twice."),
    success: t2("Two parts, one program. Great planning!", "Splitting a big job into parts is called decomposition."),
  },
  {
    id: "robot-maze", workshop: "robot", tiers: IS, skillId: "LOGIC.PK.CODE.SEQUENCE_01",
    title: "Rock maze", cols: 5, rows: 5, mode: "arrows", start: [0, 4], heading: "E", flag: [4, 0], rocks: [[1, 3], [1, 2], [3, 1], [3, 2], [0, 1]], gems: [], maxSteps: 10, loops: false,
    goal: one("Find a way through the rocks to the flag."),
    idea: t2("Trace the path with your finger first. Then turn it into cards.", "Test the path in your head before you run it."),
    hint: t2("Go right twice, then up and up, then right to the flag.", "Right twice, up four times, right twice."),
    success: t2("Tracing first, then coding: that is how programs get made.", "You designed the algorithm, then coded it."),
  },
  {
    id: "robot-fix-it", workshop: "robot", tiers: IS, skillId: "LOGIC.G1.CODE.DEBUG_01",
    title: "Fix the robot", cols: 5, rows: 3, mode: "arrows", start: [0, 2], heading: "E", flag: [4, 2], rocks: [[2, 2]], gems: [], maxSteps: 6, loops: false,
    starter: [{ cmd: "right", times: 1 }, { cmd: "up", times: 1 }, { cmd: "right", times: 1 }, { cmd: "right", times: 1 }, { cmd: "up", times: 1 }, { cmd: "right", times: 1 }],
    goal: t2("Someone wrote this program, but it has a bug. Run it, find the wrong card and fix it.", "This program has one bug. Run it, find the card that goes wrong, and change only that card."),
    idea: t2("A bug is a mistake in a program. Watch where the robot goes wrong.", "Debugging: run it, watch it, find the first step that goes wrong."),
    hint: t2("Card 5 goes up. Should it go down?", "Look at card 5. Which way does the robot need to go there?"),
    success: t2("You debugged it! Finding the bug is a real coder skill.", "Debugging means finding the first step that goes wrong, and fixing just that."),
  },
  {
    id: "robot-gem-run", workshop: "robot", tiers: I, skillId: "LOGIC.PK.CODE.SEQUENCE_01",
    title: "Gem run", cols: 5, rows: 3, mode: "arrows", start: [0, 0], heading: "E", flag: [4, 2], rocks: [[3, 0], [1, 2]], gems: [[2, 0], [2, 2]], maxSteps: 8, loops: false,
    goal: one("Collect both gems, then stop on the flag."),
    idea: one("Plan: which gem first? Then which way to the next one?"),
    hint: one("Right, right to the first gem. Down, down to the second. Then right, right."),
    success: one("Every gem and the flag, in one program."),
  },
  {
    id: "robot-drive", workshop: "robot", tiers: S, skillId: "LOGIC.G1.CODE.LOOP_01",
    title: "Drive and turn", cols: 5, rows: 4, mode: "turns", start: [0, 3], heading: "E", flag: [3, 0], rocks: [], gems: [], maxSteps: 3, loops: true,
    goal: one("This robot drives forward and turns. You only have 3 cards: use repeat!"),
    idea: one("Forward moves the way the robot faces. Turn left and turn right spin it on the spot. Tap a card's × to repeat it."),
    hint: one("Forward × 3, turn left, forward × 3."),
    success: one("A repeat is a loop: one card that runs many times. Loops make programs short."),
  },
  {
    id: "robot-staircase", workshop: "robot", tiers: S, skillId: "LOGIC.G1.CODE.LOOP_01",
    title: "The staircase", cols: 5, rows: 5, mode: "turns", start: [0, 4], heading: "N", flag: [4, 0], rocks: [[0, 1], [3, 2], [1, 3], [4, 3]], gems: [], maxSteps: 7, loops: true,
    goal: one("Climb the staircase to the flag. The robot starts facing up."),
    idea: one("Turn left and turn right are the robot's left and right, not yours. Imagine sitting in it."),
    hint: one("Forward × 2, turn right, forward × 2, turn left, forward × 2, turn right, forward × 2."),
    success: one("Turns relative to the robot are how real robots and turtles are programmed."),
  },
  {
    id: "robot-debug-turns", workshop: "robot", tiers: S, skillId: "LOGIC.G1.CODE.DEBUG_01",
    title: "Wrong turn", cols: 4, rows: 4, mode: "turns", start: [0, 0], heading: "E", flag: [3, 3], rocks: [], gems: [[3, 0]], maxSteps: 3, loops: true,
    starter: [{ cmd: "forward", times: 3 }, { cmd: "turn-left", times: 1 }, { cmd: "forward", times: 3 }],
    goal: one("This program drives off the map. Find the bug and fix it."),
    idea: one("Run it and watch: the first thing that goes wrong is where the bug is."),
    hint: one("After the gem, the robot needs to face down the map. Is that its left or its right?"),
    success: one("One card changed, bug fixed. Small fixes, tested each time, is how debugging works."),
  },
];

/* =========================================================================
   MAP MAKER — geography
   ========================================================================= */

const map: BuildLevel[] = [
  {
    id: "map-island", workshop: "map", tiers: EI, skillId: "WORLD.PK.MAP.LANDWATER_01",
    title: "Make an island", cols: 6, rows: 5, ground: "water", fixed: {}, palette: ["land", "tree", "house"], labels: false, compass: false,
    rule: { kind: "island", minSize: 3 },
    goal: t2("The sea is empty. Make an island!", "Build an island of at least 3 squares."),
    idea: t2("An island is land with water all the way round it.", "An island is land completely surrounded by water. Blue means water on a map."),
    hint: t2("Keep your land away from the edges, so water can go all round.", "Your land must not touch the edge of the map, and it must be one piece."),
    success: t2("You made an island! Some people live on islands.", "Islands: Great Britain, Hawaii and Madagascar are all land with sea all round."),
  },
  {
    id: "map-lake", workshop: "map", tiers: EI, skillId: "WORLD.PK.MAP.LANDWATER_01",
    title: "Make a lake", cols: 6, rows: 5, ground: "land", fixed: fixedTiles([[[0, 0], "tree"], [[5, 4], "house"]]), palette: ["water", "tree"], labels: false, compass: false,
    rule: { kind: "lake", minSize: 2 },
    goal: t2("Now it is all land. Make a lake!", "Build a lake of at least 2 squares."),
    idea: t2("A lake is water with land all the way round. It is the opposite of an island!", "A lake is water surrounded by land: the opposite of an island."),
    hint: t2("Put water in the middle, away from the edges.", "Keep the water away from the edge of the map."),
    success: t2("A lake! Ducks and fish live in lakes.", "Island and lake are opposites. Can you think of a lake near you?"),
  },
  {
    id: "map-beside", workshop: "map", tiers: E, skillId: "WORLD.PK.MAP.LANDWATER_01",
    title: "House by the tree", cols: 5, rows: 4, ground: "land", fixed: fixedTiles([[[2, 1], "tree"], [[4, 3], "water"], [[0, 3], "water"]]), palette: ["house"], labels: false, compass: false,
    rule: { kind: "beside", tile: "house", of: "tree" },
    goal: one("Put a house next to the tree."),
    idea: one("Next to means touching, side by side."),
    hint: one("Put the house right beside the tree: above, below, or to one side."),
    success: one("The house is next to the tree. Maps show where things are."),
  },
  {
    id: "map-road-school", workshop: "map", tiers: EI, skillId: "WORLD.G1.MAP.ROUTE_01",
    title: "Road to school", cols: 6, rows: 4, ground: "land", fixed: fixedTiles([[[0, 1], "house"], [[5, 2], "school"], [[2, 1], "tree"], [[3, 3], "tree"], [[3, 0], "water"]]), palette: ["road"], labels: false, compass: false,
    rule: { kind: "route", from: "house", to: "school" },
    goal: t2("Build a road from the house to the school.", "Build a road that joins the house to the school."),
    idea: t2("Road squares must touch side by side, like a line of train cars.", "A route is a way from one place to another. Roads join side to side, not corner to corner."),
    hint: t2("Start next to the house. Add road squares one by one to the school.", "Start beside the house and join road squares until you reach the school."),
    success: t2("Now the children can walk to school on your road!", "You planned a route. Maps help people plan how to get somewhere."),
  },
  {
    id: "map-north", workshop: "map", tiers: IS, skillId: "WORLD.G1.MAP.DIRECTION_01",
    title: "Which way is north?", cols: 5, rows: 5, ground: "land", fixed: fixedTiles([[[2, 3], "house"], [[0, 0], "water"], [[4, 4], "water"]]), palette: ["tree"], labels: false, compass: true,
    rule: { kind: "place", tile: "tree", dir: "N", of: "house" },
    goal: t2("Plant one tree north of the house.", "Plant exactly one tree north of the house."),
    idea: t2("Look at the compass. N means north. North is at the top of the map.", "The compass shows N, E, S and W. On most maps, north is at the top."),
    hint: t2("North is up. Put the tree above the house.", "North means towards the top, in the same column as the house."),
    success: t2("North is up on this map. You used the compass!", "North, south, east and west are called the cardinal directions."),
  },
  {
    id: "map-east-west", workshop: "map", tiers: IS, skillId: "WORLD.G1.MAP.DIRECTION_01",
    title: "East and west", cols: 6, rows: 4, ground: "land", fixed: fixedTiles([[[2, 1], "school"], [[5, 3], "water"]]), palette: ["park", "shop"], labels: false, compass: true,
    rule: { kind: "all", rules: [{ kind: "place", tile: "park", dir: "E", of: "school" }, { kind: "place", tile: "shop", dir: "W", of: "school" }] },
    goal: one("Put a park east of the school, and a shop west of it."),
    idea: t2("E is east, to the right. W is west, to the left. \"We\" spells W, E: west is on the left!", "East is to the right and west to the left. Remember: \"W–E\" spells \"we\"."),
    hint: one("The park goes to the right of the school, in the same row. The shop goes to the left."),
    success: one("East and west, used correctly. The sun rises in the east and sets in the west!"),
  },
  {
    id: "map-river-bridge", workshop: "map", tiers: IS, skillId: "WORLD.G1.MAP.ROUTE_01",
    title: "Across the river", cols: 7, rows: 5, ground: "land",
    fixed: fixedTiles([[[3, 0], "water"], [[3, 1], "water"], [[3, 2], "water"], [[3, 3], "water"], [[3, 4], "water"], [[0, 2], "house"], [[6, 2], "school"], [[1, 0], "tree"], [[5, 4], "tree"]]),
    palette: ["road", "bridge"], labels: false, compass: true,
    rule: { kind: "route", from: "house", to: "school" },
    goal: t2("A river is in the way! Build a road to school that crosses the river.", "Build a route from the house to the school. You will need to cross the river."),
    idea: t2("Roads sink in water. A bridge goes over water.", "Roads are built on land. Bridges carry a road over water."),
    hint: t2("Build road up to the river, then a bridge on the water, then road again.", "Road to the riverbank, a bridge over the water, then road to the school."),
    success: t2("Bridges let people cross rivers. Hooray!", "Towns are often built where rivers can be crossed: that is why so many have bridges."),
  },
  {
    id: "map-treasure", workshop: "map", tiers: IS, skillId: "WORLD.G1.MAP.GRID_01",
    title: "X marks the spot", cols: 6, rows: 5, ground: "land", fixed: fixedTiles([[[0, 4], "water"], [[1, 4], "water"], [[5, 0], "mountain"], [[4, 0], "mountain"], [[1, 1], "tree"]]), palette: ["treasure"], labels: true, compass: false,
    rule: { kind: "at", tile: "treasure", ref: "D3" },
    goal: t2("Bury the treasure at D3.", "Bury the treasure at grid reference D3."),
    idea: t2("Find D along the top. Then go down to 3. Where they meet is D3.", "A grid reference: letter along the top first, then number down the side. Along the corridor, then up (or down) the stairs."),
    hint: one("Put a finger on D at the top and slide down to row 3."),
    success: t2("You found D3! Pirates and explorers use grids like this.", "Grid references let anyone find the same spot on a map."),
  },
  {
    id: "map-river", workshop: "map", tiers: S, skillId: "WORLD.PK.MAP.LANDWATER_01",
    title: "Make a river", cols: 7, rows: 5, ground: "land", fixed: fixedTiles([[[1, 0], "mountain"], [[2, 0], "mountain"], [[5, 4], "house"]]), palette: ["water"], labels: false, compass: false,
    rule: { kind: "river" },
    goal: one("Make a river that flows from the left edge of the map to the right edge."),
    idea: one("A river is a long line of moving water. It starts high up, often in mountains, and flows to the sea."),
    hint: one("Water squares must join side by side all the way across."),
    success: one("Rivers carve valleys, carry water to towns and flow into the sea."),
  },
  {
    id: "map-island-lake", workshop: "map", tiers: S, skillId: "WORLD.PK.MAP.LANDWATER_01",
    title: "A lake on an island", cols: 7, rows: 6, ground: "water", fixed: {}, palette: ["land", "water", "tree"], labels: false, compass: false,
    rule: { kind: "all", rules: [{ kind: "island", minSize: 8 }, { kind: "lake", minSize: 1 }] },
    goal: one("Build an island with a lake in the middle of it."),
    idea: one("An island is land surrounded by water. A lake is water surrounded by land. Can one be inside the other?"),
    hint: one("Make a ring of land, then leave water in the middle of the ring."),
    success: one("An island with a lake on it. There are even lakes on islands in lakes!"),
  },
  {
    id: "map-town-plan", workshop: "map", tiers: S, skillId: "WORLD.G1.MAP.GRID_01",
    title: "Plan the town", cols: 6, rows: 5, ground: "land", fixed: fixedTiles([[[5, 4], "water"], [[4, 4], "water"], [[0, 0], "mountain"]]), palette: ["school", "park"], labels: true, compass: true,
    rule: { kind: "all", rules: [{ kind: "at", tile: "school", ref: "B2" }, { kind: "place", tile: "park", dir: "S", of: "school" }] },
    goal: one("Put the school at B2. Then put the park south of the school."),
    idea: one("Use both tools: the grid reference finds a square, and the compass gives a direction from it."),
    hint: one("B along the top, 2 down the side. South is towards the bottom of the map."),
    success: one("Grid references and compass directions together are how real maps are read."),
  },
];

/* =========================================================================
   TOWER & BRIDGE LAB — science and engineering
   ========================================================================= */

const tower: BuildLevel[] = [
  {
    id: "tower-three", workshop: "tower", tiers: E, skillId: "SCI.PK.PHYS.BALANCE_01",
    title: "Three high", cols: 6, rows: 5, gaps: [], widths: [1, 2], maxBlocks: 6, fixed: [],
    rule: { kind: "height", min: 3 },
    goal: one("Build a tower 3 blocks tall that stands up."),
    idea: one("Put each block right on top of the one below."),
    hint: one("Tap the same place three times to stack blocks."),
    success: one("It stands! The blocks hold each other up."),
  },
  {
    id: "tower-predict-wide", workshop: "tower", tiers: EI, skillId: "SCI.PK.PHYS.BALANCE_01",
    title: "Big bottom", cols: 6, rows: 5, gaps: [], widths: [], maxBlocks: 0,
    fixed: [{ x: 1, y: 0, w: 3 }, { x: 1, y: 1, w: 2 }, { x: 2, y: 2, w: 1 }],
    rule: { kind: "predict" },
    goal: one("Look at this tower. Will it stand or fall?"),
    idea: t2("Big at the bottom, small at the top.", "Look at where each block's weight sits."),
    hint: one("Is each block sitting on the one below it?"),
    success: t2("A wide bottom makes a tower steady. Pyramids are built like this!", "A wide base keeps the weight over the ground. That is why pyramids are so steady."),
  },
  {
    id: "tower-predict-overhang", workshop: "tower", tiers: EI, skillId: "SCI.PK.PHYS.BALANCE_01",
    title: "Hanging out", cols: 6, rows: 5, gaps: [], widths: [], maxBlocks: 0,
    fixed: [{ x: 2, y: 0, w: 1 }, { x: 2, y: 1, w: 3 }],
    rule: { kind: "predict" },
    goal: one("A long block sits on a thin one. Will it stand or fall?"),
    idea: t2("Look at the long block. Is its middle over the thin block?", "Find the middle of the top block. Is the middle over its support?"),
    hint: one("Most of the long block hangs out to one side."),
    success: t2("It fell: most of it hung out to the side, with nothing underneath.", "The block's middle was past its support, so it tipped over."),
  },
  {
    id: "tower-stream", workshop: "tower", tiers: IS, skillId: "SCI.G1.PHYS.STRUCTURE_01",
    title: "Bridge the stream", cols: 7, rows: 4, gaps: [3], widths: [1, 2, 3], maxBlocks: 4, fixed: [],
    rule: { kind: "bridge" },
    goal: t2("Build a bridge over the stream.", "Build a bridge that crosses the stream and stays up."),
    idea: t2("A bridge needs to rest on land at both ends.", "A beam bridge rests on the banks at both ends."),
    hint: t2("Use a long block. Put it so it sits on land on both sides.", "Place a 3-long block so one end is on each bank."),
    success: t2("A beam bridge! Held up at both ends.", "That is a beam bridge: the simplest kind, held up at both ends."),
  },
  {
    id: "tower-five", workshop: "tower", tiers: IS, skillId: "SCI.PK.PHYS.BALANCE_01",
    title: "Tall and steady", cols: 7, rows: 7, gaps: [], widths: [1, 2, 3], maxBlocks: 6, fixed: [],
    rule: { kind: "height", min: 5 },
    goal: one("Build a tower 5 blocks tall, with only 6 blocks."),
    idea: one("Big blocks at the bottom make a steady base."),
    hint: one("Stack the blocks straight up, each one centred on the one below."),
    success: one("Tall and steady: the weight goes straight down to the ground."),
  },
  {
    id: "tower-predict-balance", workshop: "tower", tiers: IS, skillId: "SCI.PK.PHYS.BALANCE_01",
    title: "Balancing act", cols: 6, rows: 5, gaps: [], widths: [], maxBlocks: 0,
    fixed: [{ x: 2, y: 0, w: 1 }, { x: 2, y: 1, w: 1 }, { x: 1, y: 2, w: 3 }],
    rule: { kind: "predict" },
    goal: one("A long block balances on a thin tower. Will it stand or fall?"),
    idea: one("Where is the middle of the long block?"),
    hint: one("The long block's middle is right over the thin tower."),
    success: one("It stands! Its middle, its centre of balance, is right over its support."),
  },
  {
    id: "tower-wide-river", workshop: "tower", tiers: S, skillId: "SCI.G1.PHYS.STRUCTURE_01",
    title: "The wide river", cols: 7, rows: 5, gaps: [2, 3, 4], widths: [1, 2, 3], maxBlocks: 6, fixed: [],
    rule: { kind: "bridge" },
    goal: one("This river is too wide for one block. Build a bridge that crosses it."),
    idea: one("Build out a little from each bank first. Then lay a beam across the gap that is left."),
    hint: one("A 2-long block on each bank, half over the water. Then a 3-long block across the top."),
    success: one("You built out from both banks, then joined them: like a real cantilever bridge."),
  },
  {
    id: "tower-reach", workshop: "tower", tiers: S, skillId: "SCI.G1.PHYS.STRUCTURE_01",
    title: "Reach over the water", cols: 7, rows: 5, gaps: [3, 4, 5, 6], widths: [1, 2, 3], maxBlocks: 5, fixed: [],
    rule: { kind: "overhang", reach: 2 },
    goal: one("There is no other bank! Build out 2 squares over the water without falling in."),
    idea: one("Each block may hang out a little past the one below, as long as the weight above stays balanced over land."),
    hint: one("A 3-long block on the bank, then a 3-long block on top that sticks out one more square."),
    success: one("An overhang that holds. The part over the land balances the part over the water."),
  },
  {
    id: "tower-predict-counterweight", workshop: "tower", tiers: S, skillId: "SCI.G1.PHYS.STRUCTURE_01",
    title: "Too much at the end", cols: 7, rows: 5, gaps: [4, 5, 6], widths: [], maxBlocks: 0,
    fixed: [{ x: 2, y: 0, w: 3 }, { x: 4, y: 1, w: 2 }],
    rule: { kind: "predict" },
    goal: one("A block hangs over the water, and another block sits on its far end. Stand or fall?"),
    idea: one("Work out where all the weight is, together. Is it over land?"),
    hint: one("The bottom block is 2 squares on land and 1 over water. Now add the heavy block right at the end."),
    success: one("Adding weight to the far end moved the centre of mass past the bank, so it tipped. Engineers call the fix a counterweight."),
  },
];

/* =========================================================================
   SHAPE WORKSHOP — maths
   ========================================================================= */

const shapes: BuildLevel[] = [
  {
    id: "shapes-ab-pattern", workshop: "shapes", tiers: E, skillId: "MATH.PK.GEO.COMPOSE_01",
    title: "Red, blue, red, blue", cols: 6, rows: 1, colours: ["red", "blue"], fixed: fixedColours([[[0, 0], "red"], [[1, 0], "blue"]]),
    rule: { kind: "pattern", row: 0, unit: ["red", "blue"] },
    goal: one("Carry on the pattern to the end."),
    idea: one("Say it out loud: red, blue, red, blue… What comes next?"),
    hint: one("After blue comes red again."),
    success: one("A repeating pattern! Red, blue, again and again."),
  },
  {
    id: "shapes-count", workshop: "shapes", tiers: E, skillId: "MATH.PK.GEO.COMPOSE_01",
    title: "Three and two", cols: 5, rows: 2, colours: ["red", "blue"], fixed: {},
    rule: { kind: "count", counts: { red: 3, blue: 2 } },
    goal: one("Colour 3 red squares and 2 blue squares."),
    idea: one("Touch each square as you count: one, two, three."),
    hint: one("Count the red ones. Then count the blue ones."),
    success: one("3 red and 2 blue. That makes 5 altogether!"),
  },
  {
    id: "shapes-square", workshop: "shapes", tiers: EI, skillId: "MATH.PK.GEO.COMPOSE_01",
    title: "Make a square", cols: 5, rows: 4, colours: ["yellow"], fixed: {},
    rule: { kind: "rectangle", area: 4, square: true },
    goal: t2("Use 4 squares to make one big square.", "Make a square from exactly 4 small squares."),
    idea: t2("A square has 4 sides, all the same length.", "A square has four equal sides and four square corners."),
    hint: one("2 on the top row, and 2 right underneath them."),
    success: t2("Four little squares make one big square!", "2 × 2 = 4. Four small squares make a square twice as wide."),
  },
  {
    id: "shapes-rectangle-6", workshop: "shapes", tiers: IS, skillId: "MATH.PK.GEO.COMPOSE_01",
    title: "Rectangle of six", cols: 6, rows: 4, colours: ["green"], fixed: {},
    rule: { kind: "rectangle", area: 6 },
    goal: one("Make a rectangle out of exactly 6 squares."),
    idea: t2("A rectangle has 4 sides and 4 square corners. Every row is the same length.", "A rectangle is rows of equal length. Rows × squares in a row = how many squares."),
    hint: one("Try 2 rows of 3. Or one long row of 6!"),
    success: t2("A rectangle of 6! Is there another way to make one?", "2 × 3, 3 × 2 and 1 × 6 all make 6. These are arrays."),
  },
  {
    id: "shapes-butterfly", workshop: "shapes", tiers: IS, skillId: "MATH.G1.GEO.SYMMETRY_01",
    title: "Butterfly wings", cols: 6, rows: 4, colours: ["blue", "yellow"],
    fixed: fixedColours([[[2, 0], "blue"], [[1, 1], "blue"], [[2, 1], "yellow"], [[0, 2], "blue"], [[2, 2], "blue"], [[2, 3], "yellow"]]),
    outline: rect(3, 0, 3, 4),
    rule: { kind: "mirror", axis: 3 },
    goal: t2("Finish the butterfly so both wings match.", "Complete the picture so it is symmetrical across the fold line."),
    idea: t2("Like a mirror: a square next to the line on one side is next to the line on the other.", "Line symmetry: each square has a partner the same distance from the fold, on the other side."),
    hint: one("Start next to the fold line and work outwards, one row at a time."),
    success: t2("Both wings match! Butterflies are symmetrical.", "Symmetrical: fold it along the line and the halves fit exactly. Leaves and faces are nearly symmetrical too."),
  },
  {
    id: "shapes-half", workshop: "shapes", tiers: IS, skillId: "MATH.G1.GEO.FRACTION_01",
    title: "Colour half", cols: 6, rows: 4, colours: ["red"], fixed: {}, outline: rect(1, 1, 4, 2),
    rule: { kind: "fraction", num: 1, den: 2 },
    goal: t2("Colour half of the shape.", "Colour exactly one half of the outlined shape."),
    idea: t2("Half means 2 equal parts. Colour one of them.", "A half is one of 2 equal parts. Count the squares, then split them into 2 equal groups."),
    hint: one("The shape has 8 squares. Half of 8 is 4."),
    success: t2("Half is coloured and half is not. Equal parts!", "4 out of 8 is one half: 4/8 = 1/2."),
  },
  {
    id: "shapes-abb", workshop: "shapes", tiers: I, skillId: "MATH.PK.GEO.COMPOSE_01",
    title: "Yellow, green, green", cols: 9, rows: 1, colours: ["yellow", "green"], fixed: fixedColours([[[0, 0], "yellow"], [[1, 0], "green"], [[2, 0], "green"]]),
    rule: { kind: "pattern", row: 0, unit: ["yellow", "green", "green"] },
    goal: one("Carry on this pattern to the end."),
    idea: one("Find the part that repeats. Here it is 3 squares long."),
    hint: one("Yellow, green, green… then yellow again."),
    success: one("An A-B-B pattern. The repeating part is called the unit."),
  },
  {
    id: "shapes-quarter", workshop: "shapes", tiers: S, skillId: "MATH.G1.GEO.FRACTION_01",
    title: "One quarter", cols: 6, rows: 5, colours: ["blue"], fixed: {}, outline: rect(1, 1, 4, 3),
    rule: { kind: "fraction", num: 1, den: 4 },
    goal: one("Colour exactly one quarter of the outlined shape."),
    idea: one("A quarter is one of 4 equal parts. Find how many squares are in each part."),
    hint: one("12 squares shared into 4 equal parts is 3 in each part."),
    success: one("3 out of 12 is a quarter: 3/12 = 1/4. Four quarters make a whole."),
  },
  {
    id: "shapes-area-perimeter", workshop: "shapes", tiers: S, skillId: "MATH.G1.MEASURE.AREA_01",
    title: "Area 12, perimeter 14", cols: 8, rows: 6, colours: ["green"], fixed: {},
    rule: { kind: "area-perimeter", area: 12, perimeter: 14 },
    goal: one("Build a shape with an area of 12 squares and a perimeter of 14 edges."),
    idea: one("Area counts the squares inside. Perimeter counts the edges all the way round the outside."),
    hint: one("Try a rectangle 3 squares by 4 squares, and count round its edge."),
    success: one("Area 12, perimeter 14. A 2 × 6 rectangle also has area 12, but its perimeter is 16!"),
  },
  {
    id: "shapes-same-area", workshop: "shapes", tiers: S, skillId: "MATH.G1.MEASURE.AREA_01",
    title: "Stretch it out", cols: 8, rows: 5, colours: ["yellow"], fixed: {},
    rule: { kind: "area-perimeter", area: 6, perimeter: 14 },
    goal: one("Build a shape with area 6 and perimeter 14."),
    idea: one("Same area, different shapes: a stretched-out shape has a longer edge than a squashed-together one."),
    hint: one("What if all 6 squares were in one long line?"),
    success: one("The same 6 squares can have a perimeter of 10, 12 or 14. Shape changes the edge, not the area."),
  },
  {
    id: "shapes-mirror-big", workshop: "shapes", tiers: S, skillId: "MATH.G1.GEO.SYMMETRY_01",
    title: "Mirror robot", cols: 8, rows: 5, colours: ["red", "blue", "yellow"],
    fixed: fixedColours([[[3, 0], "red"], [[2, 1], "blue"], [[3, 1], "yellow"], [[1, 2], "blue"], [[2, 2], "blue"], [[3, 2], "blue"], [[3, 3], "red"], [[2, 4], "red"], [[0, 2], "yellow"]]),
    outline: rect(4, 0, 4, 5),
    rule: { kind: "mirror", axis: 4 },
    goal: one("Mirror the robot's left half to make its right half."),
    idea: one("Each coloured square has a partner: the same row, the same distance from the fold line, the same colour."),
    hint: one("The square touching the fold on the left touches it on the right too. The square 4 away on the left is 4 away on the right."),
    success: one("A symmetrical robot. Designers use symmetry because it looks balanced."),
  },
];

export const buildLevels: BuildLevel[] = [...robot, ...map, ...tower, ...shapes];
export const buildLevelById = new Map(buildLevels.map((level) => [level.id, level]));

export function levelsFor(workshop: BuildWorkshopId, tier: LabTier) {
  return buildLevels.filter((level) => level.workshop === workshop && level.tiers.includes(tier));
}
