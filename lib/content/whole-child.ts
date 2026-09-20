import type { ActivityType, ContextTag, Question } from "@/lib/curriculum";
import type { GradeBand, LearningPhase, SkillSubject } from "@/lib/skill-graph";

/**
 * Science, Our World, and Feelings & Friendship activities.
 *
 * Authored as data rather than components so the same set can be re-pointed at the
 * Supabase curriculum tables later without touching any screen.
 *
 * Each entry names the skill it provides evidence for, the level inside that skill's
 * progression (1 gentle, 2 growing, 3 stretch), and an explanation written to be read
 * aloud to a child who got it wrong — never a scold, always the reasoning.
 */

type Entry = {
  grade: GradeBand;
  subject: SkillSubject;
  level: number;
  skillId: string;
  type?: ActivityType;
  phase?: LearningPhase;
  prompt: string;
  answer: string;
  wrong: [string, string] | [string, string, string];
  hint: string;
  explanation: string;
  visual?: string;
  tags?: ContextTag[];
};

const entries: Entry[] = [
  // ======================================================================
  // SCIENCE — Pre-K: notice, name, sort, predict
  // ======================================================================
  {
    grade: "prek", subject: "science", level: 1, skillId: "SCI.PK.LIFE.NEEDS_01",
    prompt: "What does a puppy need every day?", answer: "Food and water",
    wrong: ["A hat", "A bicycle"], visual: "🐶", tags: ["animals", "nature"], phase: "guided",
    hint: "Think about what you need every day too.",
    explanation: "Living things need food and water to grow. A puppy does too.",
  },
  {
    grade: "prek", subject: "science", level: 1, skillId: "SCI.PK.LIFE.NEEDS_01",
    prompt: "What helps a plant grow?", answer: "Sunlight and water",
    wrong: ["Shoes", "A blanket"], visual: "🌱", tags: ["nature"], phase: "guided",
    hint: "Look at where plants grow best. Is it dark or sunny?",
    explanation: "Plants drink water and use sunlight to make their food.",
  },
  {
    grade: "prek", subject: "science", level: 1, skillId: "SCI.PK.SENSE.FIVE_01",
    prompt: "Which body part do you use to hear?", answer: "Ears",
    wrong: ["Nose", "Hands"], visual: "👂", tags: ["nature"], phase: "guided",
    hint: "Cover this part and sounds get quiet.",
    explanation: "Ears collect sounds so your brain can listen.",
  },
  {
    grade: "prek", subject: "science", level: 1, skillId: "SCI.PK.SENSE.FIVE_01",
    prompt: "Which sense tells you a flower smells sweet?", answer: "Smelling",
    wrong: ["Hearing", "Tasting"], visual: "🌸", tags: ["nature"],
    hint: "Which part of your face do you use near a flower?",
    explanation: "Your nose smells. That is the sense of smell.",
  },
  {
    grade: "prek", subject: "science", level: 2, skillId: "SCI.PK.LIFE.HABITAT_01",
    prompt: "Where does a fish live?", answer: "In the water",
    wrong: ["In a tree", "Under a bed"], visual: "🐟", tags: ["animals", "nature"],
    hint: "A fish uses gills to breathe. Where would that work?",
    explanation: "Fish live in water. Their gills take oxygen from it.",
  },
  {
    grade: "prek", subject: "science", level: 2, skillId: "SCI.PK.LIFE.HABITAT_01",
    prompt: "Where would you find a bird's nest?", answer: "In a tree",
    wrong: ["In the ocean", "In a fridge"], visual: "🐦", tags: ["animals", "nature"],
    hint: "Birds build somewhere high and safe.",
    explanation: "Many birds build nests in trees, high and away from danger.",
  },
  {
    grade: "prek", subject: "science", level: 2, skillId: "SCI.PK.EARTH.WEATHER_01",
    prompt: "It is raining. What would help you stay dry?", answer: "An umbrella",
    wrong: ["Sunglasses", "A fan"], visual: "🌧️", tags: ["nature"],
    hint: "What do people carry over their heads in the rain?",
    explanation: "An umbrella keeps the rain off you.",
  },
  {
    grade: "prek", subject: "science", level: 2, skillId: "SCI.PK.EARTH.WEATHER_01",
    prompt: "You see snow outside. What is the weather like?", answer: "Cold",
    wrong: ["Very hot", "Windy and warm"], visual: "❄️", tags: ["nature"],
    hint: "Snow only happens at one kind of temperature.",
    explanation: "Snow forms when it is cold enough for water to freeze.",
  },
  {
    grade: "prek", subject: "science", level: 3, skillId: "SCI.PK.PHYS.SINK_FLOAT_01",
    prompt: "You drop a heavy rock in water. What happens?", answer: "It sinks",
    wrong: ["It floats", "It flies"], visual: "🪨", tags: ["nature", "puzzles"], phase: "transfer",
    hint: "Think about a rock you have dropped in a puddle.",
    explanation: "A rock is dense for its size, so it sinks.",
  },
  {
    grade: "prek", subject: "science", level: 3, skillId: "SCI.PK.PHYS.SINK_FLOAT_01",
    prompt: "Which one will float on water?", answer: "A leaf",
    wrong: ["A metal spoon", "A brick"], visual: "🍃", tags: ["nature", "puzzles"], phase: "transfer",
    hint: "Which is lightest for its size?",
    explanation: "A leaf is light and wide, so the water holds it up.",
  },

  // ---- SCIENCE — Grade 1: sequence, classify, explain ----
  {
    grade: "grade1", subject: "science", level: 1, skillId: "SCI.G1.PHYS.FORCE_01",
    prompt: "You open a drawer by bringing it toward you. Is that a push or a pull?",
    answer: "A pull", wrong: ["A push", "Neither"], visual: "🗄️", tags: ["building"], phase: "guided",
    hint: "Which way does the drawer move — toward you or away?",
    explanation: "Moving something toward you is a pull.",
  },
  {
    grade: "grade1", subject: "science", level: 1, skillId: "SCI.G1.PHYS.FORCE_01",
    prompt: "A child kicks a ball. What makes the ball move?",
    answer: "A push from the foot", wrong: ["A pull from the grass", "Nothing at all"],
    visual: "⚽", tags: ["building", "puzzles"],
    hint: "The foot touches the ball and sends it away.",
    explanation: "A kick pushes the ball, and the push makes it move.",
  },
  {
    grade: "grade1", subject: "science", level: 2, skillId: "SCI.G1.PHYS.MATTER_01",
    prompt: "Which of these is a liquid?", answer: "Milk",
    wrong: ["A wooden block", "A rock"], visual: "🥛", tags: ["nature"],
    hint: "A liquid takes the shape of its container.",
    explanation: "Milk pours and takes the shape of its cup, so it is a liquid.",
  },
  {
    grade: "grade1", subject: "science", level: 2, skillId: "SCI.G1.PHYS.MATTER_01",
    prompt: "You leave an ice cube in a warm room. What happens?",
    answer: "It melts into water", wrong: ["It turns into a rock", "It gets bigger and harder"],
    visual: "🧊", tags: ["nature", "puzzles"],
    hint: "Ice is water that has frozen. What undoes freezing?",
    explanation: "Warmth melts ice, turning the solid back into liquid water.",
  },
  {
    grade: "grade1", subject: "science", level: 2, skillId: "SCI.G1.EARTH.SEASONS_01",
    prompt: "Leaves turn orange and fall from the trees. Which season is it?",
    answer: "Autumn", wrong: ["Summer", "Spring"], visual: "🍂", tags: ["nature"],
    hint: "This season comes after summer and before winter.",
    explanation: "In autumn many trees drop their leaves before winter.",
  },
  {
    grade: "grade1", subject: "science", level: 2, skillId: "SCI.G1.EARTH.SPACE_01",
    prompt: "What do we see in the sky during the day?", answer: "The sun",
    wrong: ["Only stars", "Only the moon"], visual: "☀️", tags: ["space", "nature"],
    hint: "What makes the sky bright and warm?",
    explanation: "The sun lights our sky during the day. That is what makes it daytime.",
  },
  {
    grade: "grade1", subject: "science", level: 3, skillId: "SCI.G1.LIFE.LIFECYCLE_01",
    prompt: "A caterpillar makes a chrysalis. What does it become next?",
    answer: "A butterfly", wrong: ["An egg", "A bird"], visual: "🐛", tags: ["animals", "nature"], phase: "transfer",
    hint: "Think about the order: egg, caterpillar, chrysalis, then what?",
    explanation: "Inside the chrysalis the caterpillar changes into a butterfly.",
  },
  {
    grade: "grade1", subject: "science", level: 3, skillId: "SCI.G1.LIFE.LIFECYCLE_01",
    prompt: "What comes first in a sunflower's life?", answer: "A seed",
    wrong: ["A flower", "A tall stem"], visual: "🌻", tags: ["nature"], phase: "transfer",
    hint: "Think about what a gardener puts into the soil.",
    explanation: "Every sunflower starts as a seed, then sprouts, grows, and blooms.",
  },
  {
    grade: "grade1", subject: "science", level: 3, skillId: "SCI.G1.EARTH.SPACE_01",
    prompt: "Why does it get dark at night?",
    answer: "Our side of Earth turns away from the sun",
    wrong: ["The sun stops shining", "Clouds cover the whole sky"],
    visual: "🌙", tags: ["space"], phase: "transfer",
    hint: "The Earth spins all the way around once each day.",
    explanation: "Earth spins. When your side turns away from the sun, it is night.",
  },

  // ======================================================================
  // OUR WORLD — Pre-K
  // ======================================================================
  {
    grade: "prek", subject: "world", level: 1, skillId: "WORLD.PK.COMM.HELPERS_01",
    prompt: "Who helps you when you are sick?", answer: "A doctor",
    wrong: ["A pilot", "A farmer"], visual: "🩺", tags: ["stories"], phase: "guided",
    hint: "This helper works in a clinic or hospital.",
    explanation: "Doctors help people feel better when they are unwell.",
  },
  {
    grade: "prek", subject: "world", level: 1, skillId: "WORLD.PK.COMM.HELPERS_01",
    prompt: "Who brings letters and parcels to your home?", answer: "A postal worker",
    wrong: ["A chef", "A dentist"], visual: "📮", tags: ["stories"], phase: "guided",
    hint: "This helper carries a bag full of mail.",
    explanation: "Postal workers deliver letters and parcels to every home.",
  },
  {
    grade: "prek", subject: "world", level: 1, skillId: "WORLD.PK.PLACE.HOME_01",
    prompt: "Where do you go to borrow a book?", answer: "The library",
    wrong: ["The swimming pool", "The bus stop"], visual: "📚", tags: ["stories"],
    hint: "This place is full of shelves and quiet reading.",
    explanation: "A library lends books to everyone in the community.",
  },
  {
    grade: "prek", subject: "world", level: 2, skillId: "WORLD.PK.TRANS.VEHICLES_01",
    prompt: "Which one travels on water?", answer: "A boat",
    wrong: ["A bus", "A bicycle"], visual: "⛵", tags: ["building"],
    hint: "Think about which one you would find on a lake.",
    explanation: "Boats travel on water. Buses and bicycles travel on land.",
  },
  {
    grade: "prek", subject: "world", level: 2, skillId: "WORLD.PK.TRANS.VEHICLES_01",
    prompt: "Which one travels in the air?", answer: "An aeroplane",
    wrong: ["A train", "A boat"], visual: "✈️", tags: ["space", "building"],
    hint: "Which one has wings?",
    explanation: "Aeroplanes fly through the air using their wings.",
  },
  {
    grade: "prek", subject: "world", level: 3, skillId: "WORLD.PK.PLACE.HOME_01",
    prompt: "You want to buy apples and bread. Where do you go?",
    answer: "A shop", wrong: ["A library", "A playground"], visual: "🛒", tags: ["stories"], phase: "transfer",
    hint: "Where do families buy their food?",
    explanation: "Shops sell food and other things families need.",
  },

  // ---- OUR WORLD — Grade 1 ----
  {
    grade: "grade1", subject: "world", level: 1, skillId: "WORLD.G1.INVENT.TOOLS_01",
    prompt: "You need to cut paper. Which tool helps?", answer: "Scissors",
    wrong: ["A spoon", "A pillow"], visual: "✂️", tags: ["building"], phase: "guided",
    hint: "Which tool has two sharp blades that meet?",
    explanation: "Scissors are made for cutting paper and cloth.",
  },
  {
    grade: "grade1", subject: "world", level: 2, skillId: "WORLD.G1.GEO.LAND_WATER_01",
    prompt: "On a map, blue usually shows what?", answer: "Water",
    wrong: ["Mountains", "Roads"], visual: "🗺️", tags: ["nature", "puzzles"],
    hint: "Think about the colour of the sea in a picture.",
    explanation: "Map makers use blue for rivers, lakes, and oceans.",
  },
  {
    grade: "grade1", subject: "world", level: 2, skillId: "WORLD.G1.GEO.LAND_WATER_01",
    prompt: "Which is a very large area of salty water?", answer: "An ocean",
    wrong: ["A hill", "A forest"], visual: "🌊", tags: ["nature"],
    hint: "It is far bigger than a lake, and you cannot drink it.",
    explanation: "Oceans are the largest bodies of salty water on Earth.",
  },
  {
    grade: "grade1", subject: "world", level: 2, skillId: "WORLD.G1.INVENT.TOOLS_01",
    prompt: "A builder needs to join two pieces of wood. Which tool helps most?",
    answer: "A hammer and nails", wrong: ["A paintbrush", "A watering can"],
    visual: "🔨", tags: ["building"],
    hint: "Which tool drives something into the wood?",
    explanation: "A hammer drives nails through wood to hold pieces together.",
  },
  {
    grade: "grade1", subject: "world", level: 3, skillId: "WORLD.G1.TIME.THEN_NOW_01",
    prompt: "Long ago people wrote letters to send news. What do many people use now?",
    answer: "Phones and messages", wrong: ["Smoke from a chimney", "Nothing at all"],
    visual: "📱", tags: ["stories"], phase: "transfer",
    hint: "Think about how your family tells a faraway relative something quickly.",
    explanation: "Letters still exist, but phones and messages now carry news in seconds.",
  },
  {
    grade: "grade1", subject: "world", level: 3, skillId: "WORLD.G1.TIME.THEN_NOW_01",
    prompt: "Before cars, how did most people travel a long way over land?",
    answer: "By horse or on foot", wrong: ["By aeroplane", "By lift"],
    visual: "🐴", tags: ["stories", "building"], phase: "transfer",
    hint: "Cars and planes were invented quite recently.",
    explanation: "For most of history people walked or rode animals to travel.",
  },

  // ======================================================================
  // FEELINGS & FRIENDSHIP — Pre-K
  // ======================================================================
  {
    grade: "prek", subject: "wellbeing", level: 1, skillId: "WELL.PK.EMOTION.NAME_01",
    prompt: "Ana is smiling and laughing. How does Ana feel?", answer: "Happy",
    wrong: ["Angry", "Sleepy"], visual: "😊", tags: ["stories"], phase: "guided",
    hint: "Look at the mouth in the picture. Is it up or down?",
    explanation: "A smile and a laugh usually mean someone feels happy.",
  },
  {
    grade: "prek", subject: "wellbeing", level: 1, skillId: "WELL.PK.EMOTION.NAME_01",
    prompt: "Sam dropped his ice cream and is crying. How does Sam feel?",
    answer: "Sad", wrong: ["Excited", "Proud"], visual: "😢", tags: ["stories"], phase: "guided",
    hint: "How would you feel if you lost your treat?",
    explanation: "Losing something we like often makes us feel sad. That is okay.",
  },
  {
    grade: "prek", subject: "wellbeing", level: 1, skillId: "WELL.PK.HABIT.CARE_01",
    prompt: "What should you do before you eat?", answer: "Wash your hands",
    wrong: ["Jump on the sofa", "Turn off the lights"], visual: "🧼", tags: ["stories"], phase: "guided",
    hint: "It keeps germs off your food.",
    explanation: "Washing hands removes germs so they do not get into your food.",
  },
  {
    grade: "prek", subject: "wellbeing", level: 2, skillId: "WELL.PK.HABIT.CARE_01",
    prompt: "Your body feels tired at the end of the day. What helps most?",
    answer: "A good night's sleep", wrong: ["More running", "A loud room"],
    visual: "😴", tags: ["stories"],
    hint: "What do you do every night in your bed?",
    explanation: "Sleep is when your body rests and grows. It is how you get energy back.",
  },
  {
    grade: "prek", subject: "wellbeing", level: 2, skillId: "WELL.PK.SOCIAL.SHARE_01",
    prompt: "You have two apples and your friend has none. What is a kind thing to do?",
    answer: "Offer your friend one", wrong: ["Eat both quickly", "Hide them away"],
    visual: "🍎", tags: ["stories"],
    hint: "How would you feel if you had none?",
    explanation: "Sharing means both of you get some. It helps friendships grow.",
  },
  {
    grade: "prek", subject: "wellbeing", level: 3, skillId: "WELL.PK.SOCIAL.SHARE_01",
    prompt: "Two children both want the same swing. What could they do?",
    answer: "Take turns", wrong: ["Both pull on it", "Walk away upset"],
    visual: "🛝", tags: ["stories"], phase: "transfer",
    hint: "Is there a way for both of them to get a go?",
    explanation: "Taking turns means everyone gets a chance. Nobody has to miss out.",
  },

  // ---- FEELINGS & FRIENDSHIP — Grade 1 ----
  {
    grade: "grade1", subject: "wellbeing", level: 1, skillId: "WELL.G1.EMPATHY.PERSPECTIVE_01",
    prompt: "Priya's drawing was torn by accident. How might Priya feel?",
    answer: "Upset", wrong: ["Delighted", "Bored"], visual: "🎨", tags: ["stories"], phase: "guided",
    hint: "Imagine you had worked hard on something and it tore.",
    explanation: "When work we care about is damaged, we usually feel upset.",
  },
  {
    grade: "grade1", subject: "wellbeing", level: 2, skillId: "WELL.G1.EMPATHY.PERSPECTIVE_01",
    prompt: "A new child is standing alone at playtime. What is a kind thing to do?",
    answer: "Invite them to play", wrong: ["Point and laugh", "Ignore them"],
    visual: "🙋", tags: ["stories"],
    hint: "Think how it feels to be somewhere new.",
    explanation: "An invitation helps someone new feel welcome and included.",
  },
  {
    grade: "grade1", subject: "wellbeing", level: 2, skillId: "WELL.G1.REGULATE.CALM_01",
    prompt: "You feel very angry. Which of these helps you calm down?",
    answer: "Take slow deep breaths", wrong: ["Throw your toy", "Shout at someone"],
    visual: "🌬️", tags: ["stories"],
    hint: "Which choice helps you, and hurts nobody?",
    explanation: "Slow breathing settles your body so your thinking brain can help you.",
  },
  {
    grade: "grade1", subject: "wellbeing", level: 3, skillId: "WELL.G1.REGULATE.CALM_01",
    prompt: "A puzzle is very hard and you want to give up. What could you try first?",
    answer: "Take a short break, then try again",
    wrong: ["Break the puzzle", "Decide you are bad at puzzles"],
    visual: "🧩", tags: ["puzzles"], phase: "transfer",
    hint: "A hard puzzle does not mean you cannot do it. It means not yet.",
    explanation: "A break resets your attention. Hard things often work on the next try.",
  },
  {
    grade: "grade1", subject: "wellbeing", level: 3, skillId: "WELL.G1.CHOICE.RESPONSIBLE_01",
    prompt: "You accidentally knock over a friend's blocks. What is the responsible thing to do?",
    answer: "Say sorry and help rebuild", wrong: ["Pretend it was not you", "Blame someone else"],
    visual: "🧱", tags: ["building", "stories"], phase: "transfer",
    hint: "Accidents happen. What matters is what you do next.",
    explanation: "Owning a mistake and helping fix it is what being responsible means.",
  },
  {
    grade: "grade1", subject: "wellbeing", level: 3, skillId: "WELL.G1.CHOICE.RESPONSIBLE_01",
    prompt: "You find a coin in the playground. What is the fairest first step?",
    answer: "Ask a grown-up to help find the owner",
    wrong: ["Keep it secret", "Hide it for later"], visual: "🪙", tags: ["stories"], phase: "transfer",
    hint: "Someone may be looking for it right now.",
    explanation: "Trying to return what is not ours is fair to the person who lost it.",
  },
];

/**
 * Rotates the correct answer through the option list so its position is stable per
 * question but not always first — a child must read the choices, not learn a habit.
 */
function build(entry: Entry, index: number): Question {
  const options = [entry.answer, ...entry.wrong];
  const rotate = index % options.length;
  return {
    id: `${entry.grade}-${entry.subject}-${index}`,
    subject: entry.subject,
    grade: entry.grade,
    level: entry.level,
    skillId: entry.skillId,
    activityType: entry.type ?? "reasoning-choice",
    phase: entry.phase ?? "independent",
    estimatedMinutes: 2,
    contextTags: entry.tags ?? [],
    prompt: entry.prompt,
    visual: entry.visual,
    options: [...options.slice(rotate), ...options.slice(0, rotate)],
    answer: entry.answer,
    hint: entry.hint,
    explanation: entry.explanation,
  };
}

/** IDs are numbered per grade and subject, matching the legacy scheme. */
const counters = new Map<string, number>();
export const wholeChildActivities: Question[] = entries.map((entry) => {
  const key = `${entry.grade}-${entry.subject}`;
  const index = counters.get(key) ?? 0;
  counters.set(key, index + 1);
  return build(entry, index);
});
