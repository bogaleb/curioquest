import { one, t2, t3 } from "../tier";
import type { LabTopic } from "../types";

/**
 * Living things.
 *
 * The temptation in this strand is to let it become a picture quiz — here is a frog, tap
 * the frog. Every station here is built to resist that, because naming an animal is not
 * biology and a child who can label a diagram has not yet learned anything about why the
 * parts are arranged that way.
 *
 * So the questions are all functional. Not "which one is the root" but "which part does
 * the drinking"; not "where does a frog live" but "which home supplies the three things
 * this animal cannot do without". A habitat is a set of needs being met, and once a child
 * has that idea they can place an animal they have never seen.
 *
 * The life-cycle stations are sequences rather than choices on purpose: getting the order
 * wrong is visible, and a child can fix it themselves without being told.
 */

export const lifeTopics: LabTopic[] = [
  /* ======================================================================== living */
  {
    id: "living",
    strand: "life",
    title: "Living and non-living",
    childTitle: t3("Alive or not alive", "Living things", "Living, once living, never alive"),
    bigQuestion: t3(
      "How can you tell if something is alive?",
      "What do all living things do that other things never do?",
      "What is the test for life, and where does it get difficult?",
    ),
    art: "beetle",
    stations: [
      {
        id: "living.sort",
        skillId: "SCI.PK.LIFE.LIVING_01",
        tiers: ["explorer", "investigator", "scientist"],
        minutes: 3,
        phase: "discover",
        title: t3("Alive or not", "Sort the living things", "Apply the test for life"),
        activity: {
          kind: "sort",
          model: "bench",
          question: t3(
            "Which ones are alive?",
            "Sort these into living things and things that were never alive.",
            "Sort by whether the thing is living. Use growth, feeding and reproduction as your test.",
          ),
          bins: [
            { id: "living", label: t3("Alive", "Living", "Living"), art: "sprout" },
            { id: "never", label: t3("Not alive", "Never alive", "Never alive"), art: "stone" },
          ],
          items: [
            { id: "cat", label: one("Cat"), art: "cat", bin: "living" },
            { id: "tree", label: t3("A tree", "An oak tree", "An oak tree"), art: "stem", bin: "living", errorKind: "wrong-attribute" },
            { id: "stone", label: one("Stone"), art: "stone", bin: "never" },
            { id: "spoon", label: one("Spoon"), art: "spoon", bin: "never" },
            { id: "beetle", label: one("Beetle"), art: "beetle", bin: "living" },
            { id: "cloud", label: t3("A cloud", "A cloud that moves and grows", "A cloud that moves and grows"), art: "cloud", bin: "never", errorKind: "wrong-attribute" },
          ],
        },
        explain: t3(
          "Living things eat or drink, they grow bigger, and they can have babies. A stone does none of those, even though it is real.",
          "Living things grow, need food and water, and can make more of themselves. A tree does all three, quietly. A cloud moves and gets bigger, which looks alive — but it never eats and it never has baby clouds.",
          "The test is not movement. A cloud moves and grows; a tree does neither quickly. Living things take in energy, grow from within, respond to their surroundings, and reproduce. Movement is the trap, because it is the one sign of life that non-living things imitate best.",
        ),
        notebook: t3(
          "Point at something alive in your room and tell a grown-up how you know.",
          "The cloud moves and gets bigger. Say why it still is not alive.",
          "Write the test you would use on something you had never seen before. Name one case your test would struggle with.",
        ),
        offscreen:
          "With a grown-up, find three living things outside without picking anything. Watch a beetle rather than touching it.",
      },
      {
        id: "living.needs",
        skillId: "SCI.PK.LIFE.NEEDS_01",
        tiers: ["explorer", "investigator", "scientist"],
        minutes: 3,
        phase: "guided",
        title: t3("What living things need", "What everything alive needs", "The requirements for life"),
        activity: {
          kind: "sort",
          model: "bench",
          question: t3(
            "Which ones does a living thing need?",
            "Sort these into things every living thing needs, and things that are nice but not needed.",
            "Sort into requirements for life and non-essentials.",
          ),
          bins: [
            { id: "need", label: t3("Needs it", "Needed to stay alive", "Required"), art: "heart" },
            { id: "not", label: t3("Does not need it", "Nice, but not needed", "Not required"), art: "blank" },
          ],
          items: [
            { id: "water", label: t3("Water", "Water", "Water"), art: "water", bin: "need" },
            { id: "food", label: t3("Food", "Food or a way of making it", "An energy source"), art: "seed", bin: "need" },
            { id: "air", label: t3("Air", "Air", "Gas exchange"), art: "steam", bin: "need" },
            { id: "toy", label: t3("A favourite toy", "A favourite toy", "A favourite toy"), art: "ball", bin: "not" },
            { id: "shelter", label: t3("Somewhere safe", "Somewhere safe to shelter", "Shelter from extremes"), art: "forest", bin: "need" },
            { id: "name", label: t3("A name", "A name", "A name"), art: "blank", bin: "not" },
          ],
        },
        explain: t3(
          "Everything alive needs food, water, air and somewhere safe. A toy is lovely, but a plant with no water will not last.",
          "Every living thing needs energy, water, air and shelter. Plants get their energy by making food from light instead of eating, but the need itself is the same. Names and toys matter to us; they are not what keeps anything alive.",
          "Living things require an energy source, water, gas exchange, and conditions within a survivable range. Plants and animals meet the energy requirement differently — photosynthesis against feeding — which is a difference of method, not of need.",
        ),
        notebook: t3(
          "Which ones would a plant need too?",
          "A plant does not eat. Say how it gets its energy instead.",
          "Explain why 'food' is the wrong word for what a plant needs, and what the better word is.",
        ),
        offscreen:
          "With a grown-up, look after a small plant on a windowsill for a week. Draw it on day one and on day seven.",
      },
    ],
  },

  /* ======================================================================== plants */
  {
    id: "plants",
    strand: "life",
    title: "Plants",
    childTitle: t3("Pip's growing garden", "How a plant works", "Plant structure and needs"),
    bigQuestion: t3(
      "What helps a little plant grow?",
      "What does each part of a plant actually do?",
      "How does a plant feed itself without eating anything?",
    ),
    art: "sprout",
    stations: [
      {
        id: "plants.parts",
        skillId: "SCI.PK.LIFE.PLANTPARTS_01",
        tiers: ["explorer", "investigator", "scientist"],
        minutes: 4,
        phase: "discover",
        title: t3("Parts of a plant", "Every part has a job", "Plant structure and function"),
        activity: {
          kind: "label",
          model: "pot",
          question: t3(
            "Find the part that does this job.",
            "Each part of this plant has a job. Find the one being described.",
            "Identify the structure that performs each function.",
          ),
          diagram: "plant",
          parts: [
            {
              id: "root",
              label: t3("Roots", "Roots", "Roots"),
              x: 50,
              y: 82,
              job: t3(
                "This part does the drinking, down in the soil.",
                "This part takes up water from the soil, and holds the plant steady in the wind.",
                "This part absorbs water and dissolved minerals, and anchors the plant against wind and its own weight.",
              ),
            },
            {
              id: "stem",
              label: t3("Stem", "Stem", "Stem"),
              x: 50,
              y: 66,
              job: t3(
                "This part holds the plant up tall.",
                "This part holds the plant up, and carries water from the bottom to the top.",
                "This part provides support, and contains the vessels that carry water up and sugars away.",
              ),
            },
            {
              id: "leaf",
              label: t3("Leaf", "Leaf", "Leaf"),
              x: 39,
              y: 45,
              job: t3(
                "This part catches the light, and makes the food.",
                "This part catches light and uses it to make the plant's food.",
                "This part carries out photosynthesis, using light energy to build sugars from carbon dioxide and water.",
              ),
            },
            {
              id: "flower",
              label: t3("Flower", "Flower", "Flower"),
              x: 50,
              y: 20,
              job: t3(
                "This is the bright part that makes new seeds.",
                "This part makes the seeds, so there can be new plants.",
                "This is the reproductive structure; pollination here leads to seed.",
              ),
            },
          ],
        },
        explain: t3(
          "A plant is a team. Roots drink, the stem holds it up, leaves catch the light, and the flower makes the seeds.",
          "Every part has a job, and the plant needs all of them. Roots drink and hold on, the stem carries the water upwards, the leaves make the food, and the flower makes the seeds that start the whole thing again.",
          "Structure follows function throughout. Roots are branched and fine because absorption depends on surface area; leaves are flat and wide for the same reason; the stem is rigid because the leaves are useless in shade. Each shape is an answer to the job it does.",
        ),
        notebook: t3(
          "Draw a plant with all four parts.",
          "Which part would a plant miss most on a very windy day? Say why.",
          "Leaves are flat and roots are branched, for the same underlying reason. Say what it is.",
        ),
        offscreen:
          "With a grown-up, gently pull up a weed and rinse the soil off the roots at an outside tap. Count how far the roots spread compared with the leaves.",
      },
      {
        id: "plants.needs",
        skillId: "SCI.PK.LIFE.NEEDS_01",
        tiers: ["explorer", "investigator", "scientist"],
        minutes: 5,
        phase: "independent",
        title: t3("Looking after a seedling", "What helps it grow?", "Testing a plant's requirements"),
        activity: {
          kind: "predict",
          model: "pot",
          question: t3(
            "What will happen to this little plant?",
            "This young plant gets two weeks like this. What do you predict?",
            "Predict the outcome of two weeks under these conditions.",
          ),
          outcomes: [
            { id: "grow", label: t3("It grows well", "It grows tall and strong", "It thrives") },
            { id: "weak", label: t3("It goes floppy", "It goes pale and weak", "It becomes pale and etiolated") },
          ],
          setups: [
            {
              id: "sun-water",
              name: t3("Light and water", "A sunny sill and regular water", "Adequate light and water"),
              art: "sun",
              clues: [
                { id: "light", label: t3("Look at the window", "Check the light", "Measure the light"), detail: t3("Lots of bright light comes in.", "Bright light for most of the day.", "Bright, indirect light for most of the daylight hours.") },
                { id: "soil", label: t3("Touch the soil", "Feel the soil", "Check the soil"), detail: t3("The soil is a bit damp.", "Damp, but not soaking wet.", "Moist but free-draining; the roots have both water and air.") },
                { id: "leaves", label: t3("Look at the leaves", "Look at the leaves", "Inspect the leaves"), detail: t3("They are open and green.", "Wide open, deep green, turned to the window.", "Wide, deep green and oriented towards the light source.") },
              ],
              outcome: "grow",
              motion: "grow",
              observation: t3(
                "The little plant grew taller and greener.",
                "The plant grew strongly, with dark green leaves turned towards the light.",
                "Strong growth with deep green, well-expanded leaves: both requirements were met.",
              ),
            },
            {
              id: "dark",
              name: t3("A dark cupboard", "Watered, but in a dark cupboard", "Watered, in complete darkness"),
              art: "darkness",
              clues: [
                { id: "light", label: t3("Look in the cupboard", "Check the light", "Measure the light"), detail: t3("It is dark in there.", "No light at all, once the door is closed.", "Effectively zero photosynthetically useful light.") },
                { id: "soil", label: t3("Touch the soil", "Feel the soil", "Check the soil"), detail: t3("The soil is still damp.", "Still watered. Nothing has been taken away but the light.", "Water and temperature unchanged; light is the only variable removed.") },
                { id: "food", label: t3("Who feeds it?", "Who feeds a plant?", "Consider the energy source"), detail: t3("Nobody feeds a plant.", "Nobody feeds a plant. Its green leaves make food using light.", "There is no external food supply; the plant's only energy source is light.") },
              ],
              outcome: "weak",
              motion: "wilt",
              observation: t3(
                "The plant went pale and floppy, even though it had water.",
                "Pale, stretched and weak. Water was not the thing it was missing.",
                "Pale, elongated growth — etiolation. The plant stretched towards a light source that was not there.",
              ),
            },
            {
              id: "no-water",
              name: t3("Sunny, but no water", "A sunny sill, no water", "Bright light, no water"),
              art: "soil",
              clues: [
                { id: "light", label: t3("Look at the window", "Check the light", "Check the light"), detail: t3("Lots of lovely light.", "Plenty of bright light all day.", "Light is not limiting here.") },
                { id: "soil", label: t3("Touch the soil", "Feel the soil", "Check the soil"), detail: t3("The soil is dry and dusty.", "Bone dry, and cracked away from the sides of the pot.", "Fully dry, with the soil shrunk away from the pot wall.") },
                { id: "stem", label: t3("Look at the stem", "Look at the stem", "Inspect the stem"), detail: t3("It is drooping over.", "Drooping, and the leaves have lost their stiffness.", "Loss of turgor: the cells have lost the water pressure that held them rigid.") },
              ],
              outcome: "weak",
              motion: "wilt",
              observation: t3(
                "The plant drooped right over without any water.",
                "The plant wilted. Light on its own was not enough either.",
                "The plant wilted. Light alone cannot compensate: water is both a raw material and the source of cell turgor.",
              ),
            },
          ],
        },
        explain: t3(
          "Plants need light AND water. Take away either one and the little plant cannot stay strong.",
          "Two different things went wrong for two different reasons. Without light, the leaves cannot make food, so the plant goes pale. Without water, the plant cannot stay stiff, so it flops. Neither one can be swapped for more of the other.",
          "Light and water are both required and neither substitutes for the other. Light supplies the energy for photosynthesis; water supplies a raw material for it and the turgor pressure that holds cells rigid. The dark plant etiolated — stretching in search of light — while the dry one wilted, which is a mechanical failure rather than an energy one.",
        ),
        notebook: t3(
          "Which plant would you like to look after? Say why.",
          "Two plants both looked ill, but for different reasons. Say what was wrong with each one.",
          "Design a test that would show which matters more over one week, light or water — and say why that is a harder question than it sounds.",
        ),
        vocabulary: [
          {
            word: "Photosynthesis",
            meaning: t3(
              "How green leaves make food out of light.",
              "How a plant uses light to make its own food in its leaves.",
              "The process by which light energy is used to build sugars from carbon dioxide and water, releasing oxygen.",
            ),
          },
        ],
        offscreen:
          "With a grown-up, grow two cress seedlings on damp cotton wool. Put one on a sunny sill and one in a cupboard. Water both. Look after a week.",
      },
    ],
  },

  /* =================================================================== life-cycles */
  {
    id: "lifecycles",
    strand: "life",
    title: "Life cycles",
    childTitle: t3("Growing up", "Life cycles", "Life cycles and metamorphosis"),
    bigQuestion: t3(
      "What was it before it was big?",
      "What order do living things grow in?",
      "Why is it a cycle rather than a line?",
    ),
    art: "butterfly",
    stations: [
      {
        id: "lifecycles.butterfly",
        skillId: "SCI.G1.LIFE.LIFECYCLE_01",
        tiers: ["explorer", "investigator", "scientist"],
        minutes: 3,
        phase: "guided",
        title: t3("The butterfly", "The butterfly's life", "Complete metamorphosis"),
        activity: {
          kind: "sequence",
          model: "bench",
          cyclical: true,
          question: t3(
            "Put these in order, from first to last.",
            "Put the butterfly's life in order, from first to last.",
            "Order the stages of complete metamorphosis.",
          ),
          stages: [
            { id: "egg", label: t3("A tiny egg on a leaf", "An egg on a leaf", "Egg, laid on a host plant"), art: "egg" },
            { id: "cat", label: t3("A hungry caterpillar", "A caterpillar, eating and eating", "Larva: feeding and growing"), art: "caterpillar" },
            { id: "chrys", label: t3("A still case, hanging up", "A chrysalis, hanging very still", "Pupa: the body is rebuilt inside"), art: "chrysalis" },
            { id: "fly", label: t3("A butterfly flying away", "A butterfly, flying", "Adult: reproduces and lays eggs"), art: "butterfly" },
          ],
        },
        explain: t3(
          "Egg, caterpillar, still case, butterfly. Then the butterfly lays an egg and it starts again.",
          "Egg, caterpillar, chrysalis, butterfly — and the butterfly lays eggs, so it goes round again. The still stage is not resting: inside the chrysalis, the caterpillar is being rebuilt into something with wings.",
          "Complete metamorphosis: egg, larva, pupa, adult. The larva's job is to eat and store energy; the pupa is where that stored energy pays for a near-total reconstruction of the body. The adult's job is reproduction, which is why the cycle closes rather than ending.",
        ),
        notebook: t3(
          "Which one eats the most?",
          "Why does the caterpillar eat so much before it goes still?",
          "Explain why the eating stage and the flying stage have completely different bodies, and what each body is for.",
        ),
        vocabulary: [
          {
            word: "Metamorphosis",
            meaning: t3("Changing into a completely different shape.", "A change into a completely different body shape.", "A developmental transformation of body form between life stages."),
          },
        ],
        offscreen:
          "With a grown-up, look for a caterpillar on a leaf outdoors. Watch without touching, and leave it exactly where it is.",
      },
      {
        id: "lifecycles.frog",
        skillId: "SCI.G1.LIFE.LIFECYCLE_01",
        tiers: ["investigator", "scientist"],
        minutes: 3,
        phase: "independent",
        title: t2("The frog", "From water-breather to air-breather"),
        activity: {
          kind: "sequence",
          model: "bench",
          cyclical: true,
          question: t2("Put the frog's life in order, from first to last.", "Order the stages, and notice where the breathing changes."),
          stages: [
            { id: "spawn", label: t2("Jelly eggs in the pond", "Spawn: shell-less eggs, laid in water"), art: "spawn" },
            { id: "tad", label: t2("A tadpole with a tail, breathing underwater", "Tadpole: gills, tail, fully aquatic"), art: "tadpole" },
            { id: "legs", label: t2("Back legs grow, and then front legs", "Legs develop; lungs begin to replace gills"), art: "froglet" },
            { id: "frog", label: t2("A young frog leaving the water", "Adult frog: lungs and skin, able to leave water"), art: "frog" },
          ],
        },
        explain: t2(
          "A frog starts its life able to live only in water and ends able to leave it. That is exactly why the eggs have to be laid in a pond in the first place — soft jelly eggs would dry out anywhere else.",
          "The frog changes breathing apparatus mid-life: gills to lungs. Its eggs have no shell, so they must stay in water or desiccate — which makes the pond a requirement of the life cycle rather than a preference of the adult.",
        ),
        notebook: t2(
          "Say why frogs cannot lay their eggs on dry land.",
          "Trace one requirement — water — through every stage, and say when it stops being essential.",
        ),
        offscreen:
          "With a grown-up, visit a pond in spring and look for spawn from the bank. Stay back from the edge, and never go near water alone.",
      },
      {
        id: "lifecycles.sunflower",
        skillId: "SCI.G1.LIFE.LIFECYCLE_01",
        tiers: ["explorer", "investigator", "scientist"],
        minutes: 3,
        phase: "independent",
        title: t3("The sunflower", "The sunflower's life", "A flowering plant's cycle"),
        activity: {
          kind: "sequence",
          model: "pot",
          cyclical: true,
          question: t3("Put these in order, from first to last.", "Put the sunflower's life in order.", "Order the stages, from seed to seed."),
          stages: [
            { id: "seed", label: t3("A seed in the soil", "A seed under the soil", "Seed: dormant, underground"), art: "seed" },
            { id: "shoot", label: t3("A little green shoot", "A shoot pushing up, roots going down", "Germination: root down, shoot up"), art: "sprout" },
            { id: "stem", label: t3("A tall stem with big leaves", "A tall stem and wide leaves", "Vegetative growth: leaf area built up"), art: "stem" },
            { id: "flower", label: t3("A big flower full of new seeds", "A flower, and then hundreds of new seeds", "Flowering, pollination, and new seed"), art: "flower" },
          ],
        },
        explain: t3(
          "A seed grows into a plant, and the plant makes more seeds. Round and round.",
          "Seed, shoot, stem, flower — and the flower makes seeds, so it starts again. That is why it is called a cycle and not a line.",
          "The plant spends its early life building leaf area, because flowering is expensive and has to be paid for by photosynthesis first. Only once there is enough leaf does it flower and set seed, closing the cycle.",
        ),
        notebook: t3(
          "Which part comes first, the roots or the flower?",
          "Why does the plant grow all those leaves before it makes a flower?",
          "Explain the ordering as an energy budget: what has to be earned before flowering can be afforded?",
        ),
        offscreen:
          "With a grown-up, plant a sunflower or bean seed in a pot by a window and measure it each week with a strip of paper.",
      },
    ],
  },

  /* ====================================================================== habitats */
  {
    id: "habitats",
    strand: "life",
    title: "Habitats and food chains",
    childTitle: t3("Where animals live", "Homes that fit", "Habitats, adaptation and food chains"),
    bigQuestion: t3(
      "Where does each animal live?",
      "What makes a place the right home for an animal?",
      "How does an animal's body fit the place it lives, and how does energy move through it?",
    ),
    art: "forest",
    stations: [
      {
        id: "habitats.sort",
        skillId: "SCI.PK.LIFE.HABITAT_01",
        tiers: ["explorer", "investigator", "scientist"],
        minutes: 4,
        phase: "guided",
        title: t3("Find each one a home", "The right home", "Match animal to habitat"),
        activity: {
          kind: "sort",
          model: "bench",
          question: t3(
            "Which home is right for each animal?",
            "Give each animal a home where it can find what it needs.",
            "Assign each animal to the habitat that supplies its food, water and shelter.",
          ),
          bins: [
            { id: "ocean", label: t3("The big sea", "Salty ocean", "Ocean"), art: "ocean" },
            { id: "forest", label: t3("The woods", "Forest", "Forest"), art: "forest" },
            { id: "desert", label: t3("The hot sandy place", "Hot desert", "Desert"), art: "desert" },
            { id: "pond", label: t3("A little pond", "Freshwater pond", "Freshwater pond"), art: "pond" },
          ],
          items: [
            { id: "whale", label: one("Whale"), art: "whale", bin: "ocean" },
            { id: "squirrel", label: one("Squirrel"), art: "squirrel", bin: "forest" },
            { id: "camel", label: one("Camel"), art: "camel", bin: "desert" },
            { id: "frog", label: t3("Frog", "Pond frog", "Pond frog"), art: "frog", bin: "pond", errorKind: "wrong-attribute" },
            { id: "owl", label: one("Owl"), art: "owl", bin: "forest" },
            { id: "octopus", label: one("Octopus"), art: "octopus", bin: "ocean" },
          ],
        },
        explain: t3(
          "Every animal lives where it can find food, water and somewhere safe. Move it somewhere else and it cannot find those things.",
          "A habitat is not scenery — it is the place that supplies an animal's food, water and shelter. The frog and the whale both live in water, but the frog needs fresh water for its soft eggs, so a salty ocean is the wrong water entirely.",
          "A habitat is defined by the resources and conditions it provides, not by its appearance. Both the whale and the frog are aquatic, yet they are not interchangeable: salinity, depth and breeding requirements each rule one of them out of the other's habitat.",
        ),
        notebook: t3(
          "Pick one animal. Say where it finds its dinner.",
          "The frog and the whale both live in water. Say why they cannot swap.",
          "Name a condition, other than temperature, that could make a habitat unsuitable for an otherwise well-matched animal.",
        ),
        offscreen:
          "With a grown-up, find a minibeast habitat outside — under a log, in a crack in a wall. Put anything you move back exactly as it was.",
      },
      {
        id: "habitats.pond",
        skillId: "SCI.PK.LIFE.HABITAT_01",
        tiers: ["explorer", "investigator", "scientist"],
        minutes: 4,
        phase: "independent",
        title: t3("Pond corners", "What a pond provides", "Reading a habitat"),
        activity: {
          kind: "label",
          model: "bench",
          question: t3(
            "Find the part of the pond that does this.",
            "Find the part of the pond that provides what is described.",
            "Identify the feature of the habitat supplying each resource.",
          ),
          diagram: "pond-habitat",
          parts: [
            {
              id: "reeds",
              label: t3("The tall reeds", "The reeds at the edge", "Marginal reeds"),
              x: 21,
              y: 40,
              job: t3(
                "Somewhere to hide from big hungry birds.",
                "Somewhere a frog can hide from herons and other hunters.",
                "Cover from predators, and a surface for insect larvae to climb out on.",
              ),
            },
            {
              id: "shallow",
              label: t3("The shallow warm edge", "The warm shallow edge", "The shallow margin"),
              x: 31,
              y: 60,
              job: t3(
                "A warm safe place for jelly eggs.",
                "Warm, still water where frogspawn can develop safely.",
                "Warmth here speeds development, and keeps spawn away from deep-water predators.",
              ),
            },
            {
              id: "surface",
              label: t3("The top of the water", "The water surface", "The air–water surface"),
              x: 58,
              y: 48,
              job: t3(
                "Where a frog pokes its nose out for air.",
                "Where an adult frog comes up to breathe with its lungs.",
                "The gas-exchange boundary: adults come up to breathe, and oxygen dissolves in here.",
              ),
            },
            {
              id: "bottom",
              label: t3("The muddy bottom", "The muddy bottom", "The benthic mud"),
              x: 76,
              y: 76,
              job: t3(
                "Somewhere to hide when it gets cold.",
                "Where a frog can bury itself and wait out the coldest weather.",
                "A thermal refuge that stays above freezing, allowing overwintering at a very low metabolic rate.",
              ),
            },
          ],
        },
        explain: t3(
          "One pond, lots of different corners, and each corner does a different job for the animals living there.",
          "A habitat is not one thing. A pond has a warm shallow edge, hiding places, a surface to breathe at, and a cold-weather refuge in the mud — a frog uses all four at different times of the year.",
          "Habitats have internal structure, and an animal usually depends on several zones rather than one. Remove any single zone — drain the shallows, clear the reeds — and the habitat can fail for a species even though most of it looks untouched.",
        ),
        notebook: t3(
          "Which corner would a frog hide in?",
          "If somebody cleared away all the reeds, what would the frog lose?",
          "Choose one zone to remove and trace the consequences through the frog's year.",
        ),
        offscreen:
          "With a grown-up, watch a pond or a puddle from a safe distance and count how many different creatures use different parts of it.",
      },
      {
        id: "habitats.foodchain",
        skillId: "SCI.G1.LIFE.FOODCHAIN_01",
        tiers: ["investigator", "scientist"],
        minutes: 3,
        phase: "independent",
        title: t2("Who eats who", "Energy through a food chain"),
        activity: {
          kind: "sequence",
          model: "bench",
          question: t2(
            "Put this food chain in order, starting with the one that makes its own food.",
            "Order the chain from producer to top consumer, following the energy.",
          ),
          stages: [
            { id: "leaf", label: t2("A leaf, making food from sunlight", "Producer: a leaf, fixing light energy"), art: "leaf" },
            { id: "cat", label: t2("A caterpillar eating the leaf", "Primary consumer: a caterpillar"), art: "caterpillar" },
            { id: "bird", label: t2("A small bird eating the caterpillar", "Secondary consumer: a small bird"), art: "bird" },
            { id: "owl", label: t2("An owl hunting the small bird", "Tertiary consumer: an owl"), art: "owl" },
          ],
        },
        explain: t2(
          "Every food chain starts with a plant, because a plant is the only one that can make food out of sunlight. Everything after that is eating something that ate something else — so all of it, in the end, is running on sunlight.",
          "Energy enters the chain only at the producer, where light is fixed into chemical energy. Each transfer upwards loses most of that energy as heat and movement, which is why food chains are short and why top predators are always rare.",
        ),
        notebook: t2(
          "What would happen to the owl if all the leaves disappeared?",
          "Explain why there are far fewer owls than caterpillars, using energy rather than hunting.",
        ),
        offscreen:
          "With a grown-up, find one leaf outside with a bite taken out of it. Something ate it. Wonder aloud about what.",
      },
      {
        id: "habitats.adaptation",
        skillId: "SCI.G1.LIFE.ADAPT_01",
        tiers: ["investigator", "scientist"],
        minutes: 4,
        phase: "transfer",
        title: t2("Bodies that fit", "Adaptation: form and habitat"),
        activity: {
          kind: "predict",
          model: "bench",
          question: t2(
            "Here is an animal you have never met. Where does it live?",
            "From its body alone, predict this animal's habitat.",
          ),
          outcomes: [
            { id: "water", label: t2("In the water", "Aquatic") },
            { id: "desert", label: t2("In a hot dry place", "Arid") },
            { id: "cold", label: t2("Somewhere very cold", "Polar") },
          ],
          setups: [
            {
              id: "webbed",
              name: t2("Webbed feet, oily coat", "Webbed feet, water-repellent coat"),
              art: "frog",
              clues: [
                { id: "feet", label: t2("Look at the feet", "Examine the feet"), detail: t2("Wide feet with skin between the toes, like paddles.", "Interdigital webbing: a large surface for pushing against water.") },
                { id: "coat", label: t2("Touch the coat", "Examine the coat"), detail: t2("Rain runs straight off it and never soaks in.", "An oily outer layer: droplets bead and run off rather than soaking in.") },
                { id: "eyes", label: t2("Look at the eyes", "Note the eye position"), detail: t2("The eyes are high up on its head.", "Eyes set high on the skull — useful when the body is submerged.") },
              ],
              outcome: "water",
              motion: "travel",
              observation: t2(
                "Everything about this animal is built for water: paddles for feet, a coat rain cannot soak, and eyes that can see while the rest is under.",
                "Every feature points the same way: propulsion, waterproofing and dorsally placed eyes are all adaptations to an aquatic life.",
              ),
            },
            {
              id: "thick",
              name: t2("Thick fur, small ears", "Thick pelt, reduced extremities"),
              art: "cat",
              clues: [
                { id: "fur", label: t2("Feel the fur", "Examine the pelt"), detail: t2("Very thick, with fluffy fur underneath.", "A dense insulating underlayer beneath longer guard hairs.") },
                { id: "ears", label: t2("Look at the ears", "Note the extremities"), detail: t2("Tiny ears, and a short tail.", "Small ears and a short tail: little surface area at the edges.") },
                { id: "feet", label: t2("Look at the feet", "Examine the feet"), detail: t2("Big wide feet, furry underneath.", "Broad, furred feet — weight spread over soft ground, and insulated from it.") },
                { id: "fat", label: t2("Feel underneath", "Note the body fat"), detail: t2("A thick layer of fat under the skin.", "A substantial subcutaneous fat layer.") },
              ],
              outcome: "cold",
              motion: "still",
              observation: t2(
                "Everything here is about keeping warmth in: thick fur, fat underneath, and small ears that cannot lose much heat.",
                "All four features reduce heat loss. Small extremities minimise surface area; fur and fat both insulate. This is a cold-climate body plan.",
              ),
            },
          ],
        },
        explain: t2(
          "You can read where an animal lives from its body, because a body that did not fit its home would not last. Webbed feet only help in water. Tiny ears only help in the cold.",
          "Adaptations are features that improve survival in a particular environment. They are readable because they are not arbitrary: each one solves a problem the habitat poses. Small extremities in cold climates reduce heat loss through surface area, which is why the same pattern turns up in unrelated Arctic species.",
        ),
        notebook: t2(
          "Draw an animal for a hot desert. Give it two features that would help.",
          "Explain why unrelated cold-climate animals keep evolving the same small ears.",
        ),
        vocabulary: [
          {
            word: "Adaptation",
            meaning: t2("A part of an animal's body that helps it live where it lives.", "A heritable feature that improves survival or reproduction in a particular environment."),
          },
        ],
        offscreen:
          "With a grown-up, look at a bird outside and work out from its beak alone what it probably eats. Thin and pointed, or short and strong?",
      },
    ],
  },
];
