import type { ContextTag, Question } from "@/lib/curriculum";
import type { GradeBand } from "@/lib/skill-graph";

/**
 * Science, investigated.
 *
 * Before this module, science was the thinnest subject in the product: nineteen
 * activities, all of them `reasoning-choice`, not one engine between them. Wave 07 is
 * explicit that science should "feel like investigation and discovery rather than a quiz
 * section", and names the cycle: observe, predict, test, compare, classify, explain.
 *
 * Three formats carry that here, and two of them already existed:
 *
 *  - **Investigation** (new). The child opens every clue before the outcomes unlock,
 *    so observing is a step they take rather than a word in the instructions.
 *  - **Sorting**, for classifying — living and non-living, solid and liquid, materials
 *    by how light passes through them. Classification is a science skill, not a
 *    warm-up, and it is the one children can defend with evidence earliest.
 *  - **Ordering**, for life cycles and sequences, where getting the order wrong is
 *    visible rather than merely marked.
 *
 * Every hint gives a way of looking, never the outcome. Explanations are written to
 * survive a curious follow-up question: a child told "ice melts because it is warm"
 * learns less than one told the water is still water, it has only changed state.
 *
 * Safety: nothing here asks a child to handle heat, unknown substances, small magnets or
 * anything they could swallow. The off-screen extensions live in the Discovery Lab,
 * where they are worded with a grown-up in the loop.
 */

const activities: Question[] = [];
const counters = new Map<string, number>();

function add(
  grade: GradeBand,
  level: number,
  skillId: string,
  activityType: Question["activityType"],
  prompt: string,
  answer: string,
  engine: Question["engine"],
  hint: string,
  explanation: string,
  tags: ContextTag[] = [],
  phase: Question["phase"] = "independent",
) {
  const key = `${grade}-science`;
  const index = counters.get(key) ?? 0;
  counters.set(key, index + 1);
  activities.push({
    id: `lab-${key}-${index}`,
    grade,
    subject: "science",
    level,
    skillId,
    activityType,
    phase,
    estimatedMinutes: 3,
    contextTags: tags,
    prompt,
    answer,
    options: [],
    hint,
    explanation,
    engine,
  });
}

/* ------------------------------------------------------------- investigations */

type Investigation = {
  grade: GradeBand;
  level: number;
  skillId: string;
  prompt: string;
  scene: string;
  clues: [string, string][];
  outcomes: [string, string, string][];
  answer: string;
  hint: string;
  explanation: string;
  tags: ContextTag[];
};

const investigations: Investigation[] = [
  {
    grade: "prek", level: 1, skillId: "SCI.PK.PHYS.SINK_FLOAT_01",
    prompt: "Pip is about to put this cork gently into the water. What do you predict?",
    scene: "🟤💧",
    clues: [
      ["Pick it up", "The cork feels very light for its size."],
      ["Squeeze it", "It is springy, and full of tiny air pockets you can just see."],
      ["Look at the water", "The bowl is deep enough for the cork to go right under, if it would."],
    ],
    outcomes: [["float", "It will float", "🛟"], ["sink", "It will sink", "⬇️"]],
    answer: "float",
    hint: "Think about how heavy it felt for its size, and about all those tiny air pockets.",
    explanation: "The cork floats. It is light for its size — less dense than water — partly because of the air trapped inside it.",
    tags: ["nature"],
  },
  {
    grade: "prek", level: 2, skillId: "SCI.PK.PHYS.SINK_FLOAT_01",
    prompt: "Now the small stone is going into the same water. What do you predict?",
    scene: "🪨💧",
    clues: [
      ["Pick it up", "The stone is small, but it feels heavy in your hand."],
      ["Look closely", "It is solid all the way through. No air pockets anywhere."],
      ["Remember the cork", "The cork was bigger than this stone, and it floated."],
    ],
    outcomes: [["float", "It will float", "🛟"], ["sink", "It will sink", "⬇️"]],
    answer: "sink",
    hint: "Size is not what decided it last time. Think about heavy-for-its-size instead.",
    explanation: "The stone sinks. It is heavy for its size — denser than water — and being smaller than the cork made no difference at all.",
    tags: ["nature"],
  },
  {
    grade: "prek", level: 2, skillId: "SCI.PK.EARTH.WEATHER_01",
    prompt: "Nova looks out of the window before going outside. What weather do you predict?",
    scene: "🪟🚩",
    clues: [
      ["Look at the flag", "The flag is stretched out straight and snapping about."],
      ["Look at the trees", "The branches are bending all one way, then springing back."],
      ["Look at the sky", "The sky is bright. No dark clouds, and nothing is falling."],
    ],
    outcomes: [["windy", "Windy", "💨"], ["rainy", "Rainy", "🌧️"], ["snowy", "Snowy", "🌨️"]],
    answer: "windy",
    hint: "You cannot see air. You can see what it does to things that are light enough to move.",
    explanation: "Windy. Air is invisible, so we read the wind from what it moves — a flag, branches, a hat. The bright sky told us it was not rain or snow.",
    tags: ["nature"],
  },
  {
    grade: "prek", level: 3, skillId: "SCI.PK.LIFE.HABITAT_01",
    prompt: "This animal needs a home. Where do you predict it lives?",
    scene: "🐸",
    clues: [
      ["Look at its feet", "The back feet are wide and webbed, like little paddles."],
      ["Look at its skin", "The skin is damp and smooth. It dries out quickly in the sun."],
      ["Ask about its babies", "Its eggs are soft jelly with no shell, so they must stay wet."],
    ],
    outcomes: [["pond", "A freshwater pond", "🪷"], ["desert", "A hot dry desert", "🏜️"], ["ocean", "The salty ocean", "🌊"]],
    answer: "pond",
    hint: "Every clue points at the same thing this animal cannot do without.",
    explanation: "A freshwater pond. Webbed feet for swimming, damp skin that must not dry out, and shell-less eggs that need water — a habitat has to supply what an animal needs.",
    tags: ["animals", "nature"],
  },
  {
    grade: "grade1", level: 1, skillId: "SCI.G1.PHYS.MAGNET_01",
    prompt: "Pip holds a magnet near this paper clip. What do you predict?",
    scene: "🧲📎",
    clues: [
      ["What is it made of?", "The clip is steel. Steel is mostly iron."],
      ["Test another clip", "A second steel clip jumped to the magnet straight away."],
      ["Check the coating", "It has a thin plastic coating, but the steel is right underneath."],
    ],
    outcomes: [["attract", "The magnet will attract it", "🧲"], ["ignore", "The magnet will not attract it", "🚫"]],
    answer: "attract",
    hint: "Magnets are picky about materials, not about shape or colour. What is this one made of?",
    explanation: "It is attracted. Magnets attract iron, and steel is mostly iron. A thin plastic coating does not stop it.",
    tags: ["building", "puzzles"],
  },
  {
    grade: "grade1", level: 2, skillId: "SCI.G1.PHYS.MAGNET_01",
    prompt: "Now the magnet goes near a piece of aluminium foil. What do you predict?",
    scene: "🧲◻️",
    clues: [
      ["What is it made of?", "Aluminium. It is a metal, and it is shiny like the clip was."],
      ["Is there any iron?", "No iron in it at all. Aluminium is its own metal."],
      ["Try a wooden block", "Wood is not a metal, and the magnet ignored it completely."],
    ],
    outcomes: [["attract", "The magnet will attract it", "🧲"], ["ignore", "The magnet will not attract it", "🚫"]],
    answer: "ignore",
    hint: "The clue that mattered last time was not shiny, and was not metal. It was more specific than that.",
    explanation: "Not attracted. This is the useful surprise: shiny and metal are not enough. An everyday magnet pulls on iron, and aluminium has none.",
    tags: ["building", "puzzles"],
  },
  {
    grade: "grade1", level: 2, skillId: "SCI.G1.PHYS.FORCE_01",
    prompt: "The same toy car is sent down the ramp, but a rug has been put at the bottom. What do you predict?",
    scene: "🏎️🟫",
    clues: [
      ["Feel the rug", "Rough and fluffy. Your hand drags when you push it along."],
      ["Feel the floor", "The bare floor is smooth. Your hand slides easily."],
      ["Keep it fair", "Same car, same ramp, same starting place. Only the surface changed."],
    ],
    outcomes: [["sooner", "It will stop sooner", "🛑"], ["farther", "It will roll farther", "➡️"], ["same", "It will go exactly as far", "🟰"]],
    answer: "sooner",
    hint: "Think about what your hand felt on each surface, and what that would do to a rolling wheel.",
    explanation: "It stops sooner. The rough rug means more friction, and friction is a force that slows things down. Changing only one thing is what made this a fair test.",
    tags: ["building"],
  },
  {
    grade: "grade1", level: 3, skillId: "SCI.G1.EARTH.SPACE_01",
    prompt: "It is dark outside the window and the Moon is up. What do you predict is happening to the Sun?",
    scene: "🌙🪟",
    clues: [
      ["Look at the Moon", "The Moon is bright, but it gives no warmth at all."],
      ["Think about morning", "Every morning the Sun comes back on the same side of the sky."],
      ["Spin a globe", "Turn the globe once and your country goes from light into shadow."],
    ],
    outcomes: [
      ["turned", "Our side of Earth has turned away from the Sun", "🌍"],
      ["gone", "The Sun has gone out for the night", "🕯️"],
      ["moved", "The Sun has moved to a different sky", "🚀"],
    ],
    answer: "turned",
    hint: "The globe clue is the one that explains why morning always comes back.",
    explanation: "Earth has turned. The Sun has not gone anywhere — our side of the planet has spun into its own shadow, which is why night ends without anyone relighting it.",
    tags: ["space"],
  },
  {
    grade: "prek", level: 2, skillId: "SCI.PK.LIFE.NEEDS_01",
    prompt: "This healthy green plant is going into a closed dark cupboard for two weeks. What do you predict?",
    scene: "🪴🚪",
    clues: [
      ["Look at the leaves", "Green, wide and open — turned towards wherever the light is."],
      ["Ask what plants eat", "Nobody feeds a plant. Green leaves make food using light."],
      ["Check the cupboard", "It will still be watered. There is simply no light in there at all."],
    ],
    outcomes: [["weak", "It will grow pale and weak", "🥀"], ["fine", "It will be perfectly fine", "🌿"], ["faster", "It will grow faster", "⬆️"]],
    answer: "weak",
    hint: "Water was not the thing being taken away. What else do those leaves need every day?",
    explanation: "It grows pale and weak. Water alone is not enough — green leaves need light to make their own food, so the cupboard removes the one thing water cannot replace.",
    tags: ["nature"],
  },
  {
    grade: "prek", level: 3, skillId: "SCI.PK.EARTH.WEATHER_01",
    prompt: "A puddle sits on the path on a warm sunny day. What do you predict by evening?",
    scene: "💧☀️",
    clues: [
      ["Touch the path", "The path around the puddle is warm and completely dry."],
      ["Check yesterday", "There was a puddle here yesterday too, and by teatime it had gone."],
      ["Look for a drain", "No drain, no slope. The water has nowhere to run away to."],
    ],
    outcomes: [["smaller", "The puddle will get smaller", "🔽"], ["bigger", "The puddle will get bigger", "🔼"], ["same", "It will stay exactly the same", "🟰"]],
    answer: "smaller",
    hint: "It cannot run away anywhere. So where could water go that you would not be able to see?",
    explanation: "It gets smaller. The water becomes invisible water vapour in the air — that is evaporation, and it happens quietly in the warmth without anything boiling.",
    tags: ["nature"],
  },
  {
    grade: "grade1", level: 1, skillId: "SCI.G1.PHYS.MATTER_01",
    prompt: "An ice cube is put on a plate in a warm room. What do you predict happens to how much water there is?",
    scene: "🧊🍽️",
    clues: [
      ["Feel the room", "The room is warm. The ice is already glistening and wet."],
      ["Weigh it", "The ice cube weighs the same as the puddle it left last time."],
      ["Taste test", "The melted puddle was still plain water. Nothing else got in."],
    ],
    outcomes: [
      ["same", "The same water, in a new shape", "💧"],
      ["less", "Less water than before", "🔽"],
      ["new", "It turns into a different substance", "✨"],
    ],
    answer: "same",
    hint: "Two clues are about what stayed the same. Only the shape is really changing.",
    explanation: "The same water. Melting changes a solid into a liquid, but the water itself is unchanged — same stuff, same amount, different state.",
    tags: ["building"],
  },
  {
    grade: "grade1", level: 3, skillId: "SCI.G1.PHYS.FORCE_01",
    prompt: "Nova has a rope tied to a sledge and is moving backwards, rope taut. What kind of force is she using?",
    scene: "🛷🧶",
    clues: [
      ["Watch the rope", "The rope is stretched tight between Nova and the sledge."],
      ["Watch her feet", "She is stepping backwards, away from the sledge."],
      ["Watch the sledge", "The sledge follows her, moving towards her the whole time."],
    ],
    outcomes: [["pull", "A pull", "🪢"], ["push", "A push", "🤲"], ["neither", "No force at all", "🚫"]],
    answer: "pull",
    hint: "Is the sledge moving away from her, or coming towards her?",
    explanation: "A pull. A pull brings something towards you and a push sends it away — a taut rope can only ever pull, which is why nobody pushes with string.",
    tags: ["building"],
  },
];

investigations.forEach((item) => {
  add(
    item.grade, item.level, item.skillId, "investigation",
    item.prompt, item.answer,
    {
      kind: "investigation",
      scene: item.scene,
      clues: item.clues.map(([label, detail], i) => ({ id: `c${i}`, label, detail })),
      outcomes: item.outcomes.map(([id, label, emoji]) => ({ id, label, emoji })),
    },
    item.hint, item.explanation, item.tags,
    item.level === 1 ? "guided" : "independent",
  );
});

/* --------------------------------------------------------------- classifying */

type SortSet = {
  grade: GradeBand;
  level: number;
  skillId: string;
  prompt: string;
  bins: [string, string, string][];
  items: [string, string, string, string][];
  hint: string;
  explanation: string;
  tags: ContextTag[];
};

const sorts: SortSet[] = [
  {
    grade: "prek", level: 1, skillId: "SCI.PK.LIFE.LIVING_01",
    prompt: "Sort these into living things and things that were never alive.",
    bins: [["living", "Living", "🌱"], ["never", "Never alive", "🪨"]],
    items: [
      ["cat", "Cat", "🐈", "living"], ["oak", "Oak tree", "🌳", "living"],
      ["stone", "Stone", "🪨", "never"], ["spoon", "Spoon", "🥄", "never"],
      ["beetle", "Beetle", "🐞", "living"], ["cup", "Cup", "🥤", "never"],
    ],
    hint: "Ask of each one: does it need food or water, does it grow, could it have babies?",
    explanation: "Living things grow, need food and water, and can make more of themselves. A stone does none of those, however real and solid it is.",
    tags: ["nature", "animals"],
  },
  {
    grade: "prek", level: 2, skillId: "SCI.PK.SENSE.FIVE_01",
    prompt: "Which sense would notice each of these best? Sort them.",
    bins: [["eyes", "Eyes", "👀"], ["ears", "Ears", "👂"], ["hands", "Hands", "✋"]],
    items: [
      ["rainbow", "A rainbow", "🌈", "eyes"], ["thunder", "Thunder", "⛈️", "ears"],
      ["fur", "Soft fur", "🧶", "hands"], ["bell", "A ringing bell", "🔔", "ears"],
      ["ice", "A cold ice cube", "🧊", "hands"], ["star", "A tiny far star", "⭐", "eyes"],
    ],
    hint: "Picture yourself in the room with each one. Which part of you notices it first?",
    explanation: "Eyes use light, ears catch sounds travelling through the air, and skin feels texture and temperature. Often more than one sense helps at once.",
    tags: ["nature"],
  },
  {
    grade: "grade1", level: 1, skillId: "SCI.G1.PHYS.MATTER_01",
    prompt: "Sort each one by whether it is a solid or a liquid.",
    bins: [["solid", "Solid", "🧱"], ["liquid", "Liquid", "💧"]],
    items: [
      ["milk", "Milk", "🥛", "liquid"], ["brick", "Brick", "🧱", "solid"],
      ["juice", "Juice", "🧃", "liquid"], ["key", "Key", "🔑", "solid"],
      ["honey", "Honey", "🍯", "liquid"], ["book", "Book", "📕", "solid"],
    ],
    hint: "Imagine pouring each one into a differently shaped jar. Which ones would change shape to fit?",
    explanation: "A liquid takes the shape of its container; a solid keeps its own shape. Honey is slow, but pour it into a round jar and it still becomes round.",
    tags: ["building"],
  },
  {
    grade: "grade1", level: 2, skillId: "SCI.G1.PHYS.LIGHT_01",
    prompt: "A torch shines at each material. Sort them by how much light gets through.",
    bins: [["clear", "See through it", "🪟"], ["blurry", "Light but blurry", "📃"], ["blocked", "Blocks the light", "📦"]],
    items: [
      ["window", "Glass window", "🪟", "clear"], ["tracing", "Tracing paper", "📃", "blurry"],
      ["card", "Thick cardboard", "📦", "blocked"], ["water", "A glass of clear water", "🥛", "clear"],
      ["door", "Wooden door", "🚪", "blocked"], ["curtain", "Thin curtain", "🪟", "blurry"],
    ],
    hint: "Think about whether you could read a word held behind each one.",
    explanation: "Transparent materials let light through clearly, translucent ones let it through scattered, and opaque ones stop it — which is exactly when you get a shadow.",
    tags: ["building", "puzzles"],
  },
  {
    grade: "grade1", level: 3, skillId: "SCI.G1.EARTH.SEASONS_01",
    prompt: "Sort each change by the season it belongs to.",
    bins: [["spring", "Spring", "🌷"], ["autumn", "Autumn", "🍂"], ["winter", "Winter", "❄️"]],
    items: [
      ["buds", "Buds opening on bare branches", "🌷", "spring"],
      ["leaves", "Leaves turning gold and falling", "🍂", "autumn"],
      ["frost", "Frost on the window in the morning", "❄️", "winter"],
      ["chicks", "Eggs hatching in a nest", "🐣", "spring"],
      ["acorns", "Squirrels burying acorns", "🌰", "autumn"],
      ["bare", "Bare branches and the shortest days", "🌑", "winter"],
    ],
    hint: "Two of these are about getting ready for cold, and two are about things starting again.",
    explanation: "Seasons come around in order, and living things follow them: growing and hatching in spring, storing and shedding in autumn, waiting out the cold in winter.",
    tags: ["nature", "animals"],
  },
  {
    // Wave 07 names "build a habitat" as a format. Sorting creatures into the place that
    // supplies what they need is that, and it makes the point a picture cannot: a
    // habitat is a set of needs being met, not a backdrop.
    grade: "prek", level: 3, skillId: "SCI.PK.LIFE.HABITAT_01",
    prompt: "Give each animal a home where it can find what it needs.",
    bins: [["ocean", "Salty ocean", "🌊"], ["forest", "Forest", "🌳"], ["desert", "Hot desert", "🏜️"]],
    items: [
      ["whale", "Whale", "🐳", "ocean"], ["squirrel", "Squirrel", "🐿️", "forest"],
      ["camel", "Camel", "🐪", "desert"], ["octopus", "Octopus", "🐙", "ocean"],
      ["owl", "Owl", "🦉", "forest"], ["lizard", "Desert lizard", "🦎", "desert"],
    ],
    hint: "For each animal ask the same three questions: where is its food, its water, and somewhere safe to shelter?",
    explanation: "A habitat is not just scenery — it is the place that supplies an animal's food, water and shelter. Move the whale to the forest and none of the three are there.",
    tags: ["animals", "nature"],
  },
  {
    grade: "grade1", level: 2, skillId: "SCI.G1.EARTH.SPACE_01",
    prompt: "Sort what you would see in the sky by when you would see it.",
    bins: [["day", "Daytime", "☀️"], ["night", "Night-time", "🌙"]],
    items: [
      ["sun", "The Sun, high and bright", "☀️", "day"],
      ["stars", "Thousands of stars", "✨", "night"],
      ["blue", "A blue sky", "🟦", "day"],
      ["fullmoon", "The Moon at its brightest", "🌕", "night"],
      ["shadows", "Short sharp shadows on the ground", "🌳", "day"],
      ["dark", "Darkness you need a lamp to see in", "🔦", "night"],
    ],
    hint: "The stars are always there. Think about what has to be missing before you can see them.",
    explanation: "Day and night come from Earth turning, not from things switching on and off. The stars never leave — daylight is simply too bright for us to pick them out.",
    tags: ["space"],
  },
];

sorts.forEach((set) => {
  const solution = Object.fromEntries(set.items.map(([id, , , bin]) => [id, bin]));
  add(
    set.grade, set.level, set.skillId, "sorting",
    set.prompt, JSON.stringify(solution),
    {
      kind: "sorting",
      items: set.items.map(([id, label, emoji]) => ({ id, label, emoji })),
      bins: set.bins.map(([id, label, emoji]) => ({ id, label, emoji })),
      solution,
    },
    set.hint, set.explanation, set.tags,
    set.level === 1 ? "guided" : "independent",
  );
});

/* ------------------------------------------------------------ life cycles */

type CycleSet = {
  grade: GradeBand;
  level: number;
  skillId: string;
  prompt: string;
  stages: [string, string][];
  hint: string;
  explanation: string;
  tags: ContextTag[];
};

const cycles: CycleSet[] = [
  {
    grade: "grade1", level: 1, skillId: "SCI.G1.LIFE.LIFECYCLE_01",
    prompt: "Put the butterfly's life in order, from first to last.",
    stages: [["Egg on a leaf", "🥚"], ["Caterpillar eating", "🐛"], ["Chrysalis hanging still", "🛡️"], ["Butterfly flying", "🦋"]],
    hint: "Start with the smallest and stillest. The eating comes before the changing.",
    explanation: "Egg, caterpillar, chrysalis, butterfly. The caterpillar eats to store what it needs for the change ahead — the still stage is not resting, it is rebuilding.",
    tags: ["animals", "nature"],
  },
  {
    grade: "grade1", level: 2, skillId: "SCI.G1.LIFE.LIFECYCLE_01",
    prompt: "Put the sunflower's life in order, from first to last.",
    stages: [["Seed in the soil", "🌰"], ["First shoot and roots", "🌱"], ["Tall stem and leaves", "🪴"], ["Flower full of new seeds", "🌻"]],
    hint: "What has to be underground before anything can appear above it?",
    explanation: "Seed, shoot, stem, flower — and the flower makes seeds, so the cycle begins again. That is why it is called a cycle and not a line.",
    tags: ["nature"],
  },
  {
    grade: "grade1", level: 3, skillId: "SCI.G1.LIFE.LIFECYCLE_01",
    prompt: "Put the frog's life in order, from first to last.",
    stages: [["Jelly eggs in the pond", "🫧"], ["Tadpole with a tail", "🐟"], ["Back legs growing", "🦵"], ["Young frog leaving the water", "🐸"]],
    hint: "Think about when it can breathe underwater, and when it needs to reach the air.",
    explanation: "Eggs, tadpole, legs, frog. It starts life able to live only in water and ends able to leave it — which is why the eggs had to be laid in a pond.",
    tags: ["animals", "nature"],
  },
];

cycles.forEach((set) => {
  // Authored in the correct order; the engine shuffles what the child sees.
  const items = set.stages.map(([label, emoji], i) => ({ id: `s${i}`, label, emoji }));
  const solution = items.map((item) => item.id);
  const shown = [...items.slice(2), ...items.slice(0, 2)];
  add(
    set.grade, set.level, set.skillId, "ordering",
    set.prompt, JSON.stringify(solution),
    { kind: "ordering", items: shown, solution },
    set.hint, set.explanation, set.tags,
    set.level === 1 ? "guided" : "independent",
  );
});

export const scienceInvestigationActivities = activities;
