import { t2, t3 } from "../tier";
import type { LabTopic } from "../types";

/**
 * Earth and space.
 *
 * This is the strand where a child's own explanation is usually already there and usually
 * wrong — the Sun goes out at night, winter happens because the Sun moves away, a cloud is
 * made of smoke. None of those are silly; every one of them is a reasonable reading of the
 * available evidence, which is exactly why they are so hard to shift.
 *
 * So the stations here are built around a clue the child's own idea cannot survive. The
 * globe that turns, the puddle with nowhere to drain, the acorn the squirrel buried. The
 * point is never to say "no" — it is to hand over one observation that does not fit, and
 * let the idea move on its own.
 */

export const earthTopics: LabTopic[] = [
  /* ======================================================================= weather */
  {
    id: "weather",
    strand: "earth",
    title: "Weather",
    childTitle: t3("Looking out of the window", "The weather watcher", "Reading the weather"),
    bigQuestion: t3(
      "What is the weather doing today?",
      "How can you tell what the weather is without going outside?",
      "What are you actually observing when you say it is windy?",
    ),
    art: "cloud",
    stations: [
      {
        id: "weather.window",
        skillId: "SCI.PK.EARTH.WEATHER_01",
        tiers: ["explorer", "investigator", "scientist"],
        minutes: 4,
        phase: "guided",
        title: t3("What is it doing outside?", "Clues at the window", "Inferring weather from evidence"),
        activity: {
          kind: "predict",
          model: "sky",
          question: t3(
            "What is the weather doing?",
            "From the window, what weather do you predict is out there?",
            "From these observations alone, infer the weather.",
          ),
          outcomes: [
            { id: "windy", label: t3("Windy", "Windy", "Windy") },
            { id: "rainy", label: t3("Rainy", "Rainy", "Raining") },
            { id: "snowy", label: t3("Snowy", "Snowy", "Snowing") },
            { id: "sunny", label: t3("Sunny", "Sunny", "Clear and sunny") },
          ],
          setups: [
            {
              id: "flag",
              name: t3("The flag outside", "A flag and some branches", "Flag and vegetation, bright sky"),
              art: "windflag",
              clues: [
                { id: "flag", label: t3("Look at the flag", "Look at the flag", "Observe the flag"), detail: t3("It is stretched out straight.", "Stretched out straight and snapping about.", "Fully extended and snapping — a strong, sustained horizontal force.") },
                { id: "trees", label: t3("Look at the trees", "Look at the branches", "Observe the branches"), detail: t3("The branches are waving.", "Bending all one way, then springing back.", "Deflected consistently in one direction, with elastic recovery.") },
                { id: "sky", label: t3("Look at the sky", "Look at the sky", "Observe the sky"), detail: t3("The sky is bright.", "Bright sky. No dark clouds, and nothing is falling.", "High cloud base, no precipitation, good visibility.") },
              ],
              outcome: "windy",
              motion: "travel",
              observation: t3(
                "It is windy. You cannot see the wind, but you can see what it moves.",
                "Windy. Air is invisible, so we read the wind from the things light enough for it to move.",
                "Windy. Wind is not directly observable; it is inferred from its effect on objects of known mass and shape — which is exactly how a wind gauge works.",
              ),
            },
            {
              id: "drops",
              name: t3("Drops on the glass", "Drops running down the glass", "Liquid droplets on the pane"),
              art: "raindrop",
              clues: [
                { id: "glass", label: t3("Look at the window", "Look at the window", "Observe the pane"), detail: t3("Wet spots are running down.", "Drops are running down the outside.", "Liquid droplets, coalescing and running under gravity.") },
                { id: "ground", label: t3("Look at the path", "Look at the path", "Observe the ground"), detail: t3("The path is dark and shiny.", "Dark, shiny and dotted with rings.", "Uniformly wet, with impact rings still forming.") },
                { id: "cloud", label: t3("Look at the clouds", "Look at the clouds", "Observe the cloud"), detail: t3("The clouds are grey and low.", "Thick grey cloud, low and heavy.", "Thick, low cloud with a dark base: a deep layer of water droplets.") },
              ],
              outcome: "rainy",
              motion: "fall",
              observation: t3(
                "It is raining. The drops are water falling out of the clouds.",
                "Rainy. Rain is liquid water falling from clouds, which are made of drops too small to fall.",
                "Raining. Cloud droplets are too small to fall; rain occurs once they coalesce enough for gravity to overcome the updraught.",
              ),
            },
            {
              id: "flakes",
              name: t3("White bits floating down", "Flakes drifting down", "Crystalline precipitation"),
              art: "snowflake",
              clues: [
                { id: "shape", label: t3("Look at one", "Look at one closely", "Examine one closely"), detail: t3("It has tiny points, like a star.", "Six points, like a little star.", "Six-fold symmetry — an ice crystal, not a frozen drop.") },
                { id: "speed", label: t3("Watch it fall", "Watch it fall", "Note the fall speed"), detail: t3("It comes down very slowly.", "It drifts rather than falls.", "Very low terminal velocity: high surface area for very little mass.") },
                { id: "cold", label: t3("Touch the glass", "Touch the glass", "Check the temperature"), detail: t3("The window is cold.", "The glass is icy cold.", "Air temperature at or below freezing through the depth of the cloud.") },
              ],
              outcome: "snowy",
              motion: "fall",
              observation: t3(
                "It is snowing. Snow is made of tiny bits of ice.",
                "Snowy. Snowflakes are ice crystals — which is why they have points and why they drift instead of falling.",
                "Snowing. The six-fold symmetry comes from the structure of ice itself, and the low density gives the crystal a very slow fall.",
              ),
            },
          ],
        },
        explain: t3(
          "You can tell what the weather is doing by looking carefully. A flag tells you about wind. Drops tell you about rain.",
          "Weather is read from evidence. Air is invisible, so we watch what it moves; clouds are made of drops too small to fall, so rain only starts once those drops join up. And a day can be more than one thing at once — sunny and windy is a perfectly good answer.",
          "Nearly every weather observation is indirect. Wind is inferred from its effect on objects; cloud type is inferred from height and thickness; precipitation type is inferred from crystal structure and fall speed. Learning to read weather is learning to reason from evidence you cannot touch.",
        ),
        notebook: t3(
          "Look out of a window and tell a grown-up one thing you can see.",
          "Could today be sunny and windy at once? Say how you would know.",
          "You cannot see air. Describe two separate ways you could measure the wind anyway.",
        ),
        offscreen:
          "With a grown-up, keep a weather chart for a week from a safe window: cloud, wind clues, rain. Never go outside in dangerous weather.",
      },
      {
        id: "weather.seasons",
        skillId: "SCI.G1.EARTH.SEASONS_01",
        tiers: ["explorer", "investigator", "scientist"],
        minutes: 3,
        phase: "independent",
        title: t3("The four seasons", "Sort the seasons", "Seasonal change and its causes"),
        activity: {
          kind: "sort",
          model: "sky",
          question: t3(
            "Which season does each one belong to?",
            "Sort each change by the season it belongs to.",
            "Sort by season, and notice which changes are about preparing for cold.",
          ),
          bins: [
            { id: "spring", label: t3("Spring", "Spring", "Spring"), art: "flower" },
            { id: "autumn", label: t3("Autumn", "Autumn", "Autumn"), art: "leaf" },
            { id: "winter", label: t3("Winter", "Winter", "Winter"), art: "snowflake" },
          ],
          items: [
            { id: "buds", label: t3("Buds opening", "Buds opening on bare branches", "Bud burst on bare branches"), art: "sprout", bin: "spring" },
            { id: "leaves", label: t3("Gold leaves falling", "Leaves turning gold and falling", "Leaf fall after chlorophyll withdrawal"), art: "leaf", bin: "autumn" },
            { id: "frost", label: t3("Frost on the window", "Frost on the window in the morning", "Overnight frost on glass"), art: "snowflake", bin: "winter" },
            { id: "chicks", label: t3("Eggs hatching", "Eggs hatching in a nest", "Hatching, timed to peak insect abundance"), art: "egg", bin: "spring" },
            { id: "acorns", label: t3("Squirrels burying nuts", "Squirrels burying acorns", "Caching behaviour before scarcity"), art: "seed", bin: "autumn", errorKind: "wrong-attribute" },
            { id: "bare", label: t3("Bare branches, dark evenings", "Bare branches and the shortest days", "Minimum day length; bare canopy"), art: "stem", bin: "winter" },
          ],
        },
        explain: t3(
          "The year goes round: things start growing in spring, leaves fall in autumn, and winter is cold and dark. Then spring comes back.",
          "Seasons come round in order, and living things follow them. Two of these are about getting ready for cold before it arrives — the squirrel is not hungry when it buries an acorn, it is planning.",
          "Seasons are caused by the tilt of Earth's axis, not by distance from the Sun — that is the common and reasonable mistake. Organisms track them by day length rather than by temperature, which is why bud burst and caching happen on schedule even in an odd year.",
        ),
        notebook: t3(
          "What is your favourite season? Draw one thing that happens in it.",
          "The squirrel buries acorns in autumn, not in winter. Say why that is clever.",
          "Many people think winter happens because Earth is further from the Sun. Say what is wrong with that, using the southern hemisphere.",
        ),
        offscreen:
          "With a grown-up, photograph or draw the same tree once a month for a year. It is the slowest experiment in the lab and the best one.",
      },
    ],
  },

  /* ========================================================================= space */
  {
    id: "space",
    strand: "earth",
    title: "Day, night and space",
    childTitle: t3("Day and night", "Where does the Sun go?", "Earth, Sun and the solar system"),
    bigQuestion: t3(
      "Where does the Sun go at night?",
      "Why does it get dark every night and light again every morning?",
      "What is actually moving when the Sun appears to cross the sky?",
    ),
    art: "earth",
    stations: [
      {
        id: "space.day-night",
        skillId: "SCI.G1.EARTH.SPACE_01",
        tiers: ["explorer", "investigator", "scientist"],
        minutes: 5,
        phase: "guided",
        title: t3("When it goes dark", "Where the Sun went", "The cause of day and night"),
        activity: {
          kind: "predict",
          model: "sky",
          question: t3(
            "It is dark outside. What is happening to the Sun?",
            "It is dark and the Moon is up. What do you predict is happening to the Sun?",
            "Given these observations, what is the Sun actually doing?",
          ),
          outcomes: [
            { id: "turned", label: t3("Our part of Earth has turned away", "Our side of Earth has turned away from it", "Our side of Earth has turned away from it") },
            {
              id: "gone",
              label: t3("It has gone out", "The Sun has gone out for the night", "The Sun has stopped emitting"),
              errorKind: "not-yet-taught",
              response: "That is exactly what it looks like from here. Hold on to the globe clue — it is the one that does not fit.",
            },
            {
              id: "moved",
              label: t3("It moved somewhere else", "It moved away to a different sky", "It has translated elsewhere"),
              errorKind: "not-yet-taught",
              response: "Good thinking — something is definitely moving. The globe clue tells you which thing.",
            },
          ],
          setups: [
            {
              id: "night",
              name: t3("A dark window", "A dark window, Moon up", "Night, with the Moon visible"),
              art: "moon",
              clues: [
                { id: "moon", label: t3("Look at the Moon", "Look at the Moon", "Observe the Moon"), detail: t3("It is bright, but it is not warm.", "Bright, but it gives no warmth at all.", "Bright but not a heat source: it reflects rather than emits.") },
                { id: "morning", label: t3("Think about the morning", "Think about every morning", "Consider the regularity"), detail: t3("Every morning it gets light again.", "Every morning the Sun comes back on the same side of the sky.", "Sunrise occurs on the same bearing, on a period of almost exactly 24 hours.") },
                { id: "globe", label: t3("Turn the globe", "Spin the globe by the lamp", "Model it with a globe and a lamp"), detail: t3("Turn it once and your country goes dark.", "Turn the globe once and your country goes from light into shadow.", "One rotation carries any given point from the lit hemisphere into the unlit one and back.") },
                { id: "elsewhere", label: t3("Think about far away", "Think about the other side of the world", "Consider another longitude"), detail: t3("Somewhere else it is daytime right now.", "It is broad daylight somewhere else right now.", "It is midday at the antipodal longitude at this instant.") },
              ],
              outcome: "turned",
              motion: "travel",
              observation: t3(
                "The Sun did not go anywhere. We turned away from it.",
                "Earth turned. The Sun has not gone anywhere — our side of the planet has spun into its own shadow.",
                "Earth rotated. The Sun's apparent motion is an artefact of our own rotation; night is simply the shadowed hemisphere, which is why it is daytime elsewhere at the same moment.",
              ),
            },
          ],
        },
        explain: t3(
          "The Sun stays where it is. Earth turns round, like a ball, and when your bit turns away it goes dark.",
          "Earth spins once a day. When your part of it faces the Sun it is daytime; when it turns away it is night. Nobody switches the Sun off, which is why morning always comes back without anyone doing anything.",
          "Earth rotates once every 24 hours about its axis. What looks like the Sun crossing the sky is our own rotation carrying us past a fixed light source. The strongest evidence is not the globe model but the fact that it is day somewhere else at this instant — a Sun that had switched off could not manage that.",
        ),
        notebook: t3(
          "Spin round slowly with a lamp in the room. When does the light hit your face?",
          "Say what would have to be true for the Sun really to go out at night, and why you do not believe it.",
          "Explain how someone could prove Earth rotates using only a phone call to a friend far away.",
        ),
        offscreen:
          "With a grown-up, use a torch and an orange to model it. Mark your town with a sticker and turn the orange slowly.",
      },
      {
        id: "space.planets",
        skillId: "SCI.G1.EARTH.PLANETS_01",
        tiers: ["investigator", "scientist"],
        minutes: 3,
        phase: "independent",
        title: t2("What is up there?", "Sorting what is in the sky"),
        activity: {
          kind: "sort",
          model: "sky",
          question: t2(
            "Sort each one by what it really is.",
            "Sort each object by whether it produces its own light.",
          ),
          bins: [
            { id: "star", label: t2("Makes its own light", "Emits its own light"), art: "star" },
            { id: "reflect", label: t2("Shines because light hits it", "Shines by reflected light"), art: "moon" },
          ],
          items: [
            { id: "sun", label: t2("The Sun", "The Sun"), art: "sun", bin: "star" },
            { id: "moon", label: t2("The Moon", "The Moon"), art: "moon", bin: "reflect", errorKind: "wrong-attribute" },
            { id: "stars", label: t2("The stars at night", "Distant stars"), art: "star", bin: "star" },
            { id: "earth", label: t2("Earth, seen from space", "Earth, seen from space"), art: "earth", bin: "reflect" },
          ],
        },
        explain: t2(
          "The Sun is a star, and it is close. The other stars are just as bright, but so far away that they look tiny. The Moon makes no light at all — it is lit by the Sun, exactly like the ground outside your window.",
          "Stars are self-luminous; planets and moons are not. The Sun looks different from the other stars only because of distance. Recognising that the Moon shines by reflection is what makes its phases explicable rather than mysterious — you are seeing how much of the lit half happens to be facing you.",
        ),
        notebook: t2(
          "Why do the stars look so much smaller than the Sun?",
          "Use reflected light to explain why the Moon has phases.",
        ),
        offscreen:
          "With a grown-up on a clear night, look for the Moon and find which side of it is lit. Then work out where the Sun must be.",
      },
    ],
  },

  /* ========================================================================= rocks */
  {
    id: "rocks",
    strand: "earth",
    title: "Rocks and soil",
    childTitle: t3("Under our feet", "What the ground is made of", "Earth materials"),
    bigQuestion: t3(
      "What is the ground made of?",
      "Where does sand come from?",
      "How does a mountain turn into a beach?",
    ),
    art: "rock-rough",
    stations: [
      {
        id: "rocks.sort",
        skillId: "SCI.G1.EARTH.ROCKS_01",
        tiers: ["explorer", "investigator", "scientist"],
        minutes: 3,
        phase: "guided",
        title: t3("Rough or smooth", "Sort the rocks", "Classify by grain and wear"),
        activity: {
          kind: "sort",
          model: "bench",
          question: t3(
            "Sort them by how they feel.",
            "Sort these by whether they have been worn smooth by water.",
            "Sort by degree of mechanical weathering.",
          ),
          bins: [
            { id: "worn", label: t3("Smooth and round", "Worn smooth", "Rounded by transport"), art: "rock-round" },
            { id: "sharp", label: t3("Rough and pointy", "Still rough", "Angular, little transported"), art: "rock-rough" },
          ],
          items: [
            { id: "pebble", label: t3("A river pebble", "A pebble from a river", "A fluvial pebble"), art: "rock-round", bin: "worn" },
            { id: "chip", label: t3("A broken chip of rock", "A freshly broken chip", "A freshly fractured fragment"), art: "rock-rough", bin: "sharp" },
            { id: "sand", label: t3("A grain of sand", "A grain of sand", "A quartz sand grain"), art: "sand", bin: "worn", errorKind: "wrong-attribute" },
            { id: "crystal", label: t3("A sparkly crystal", "A crystal from inside a rock", "A crystal, grown in place"), art: "crystal", bin: "sharp" },
          ],
        },
        explain: t3(
          "Rocks in rivers and on beaches get rubbed smooth. Rocks that have just broken are still sharp.",
          "Water and wind rub rocks against each other, and over a very long time the corners wear off. A sand grain is a rock that has been rubbed down almost to nothing — which is why a beach is really a very slow pile of mountain.",
          "Rounding is a proxy for transport distance and time. Angular fragments have travelled little; well-rounded grains have been abraded through many collisions. Sand is the end point of that process, which is why sand composition tells you which rock it came from.",
        ),
        notebook: t3(
          "Find a smooth stone and a rough one. Which one has been in water?",
          "Say where sand comes from, in one sentence.",
          "Given two beaches with differently shaped grains, say what you could infer about each one's history.",
        ),
        offscreen:
          "With a grown-up, collect five stones from one place and sort them from roughest to smoothest. Wash your hands afterwards.",
      },
    ],
  },
];
