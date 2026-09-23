import { one, t2, t3 } from "../tier";
import type { LabTopic } from "../types";

/**
 * Matter, forces and energy: the shelves where a prediction can be tested in front of
 * the child's eyes within two seconds.
 *
 * These topics carry the weight of the lab because they are the ones where the model can
 * be honest. A tank really can show a cork rising and a stone falling; a ramp really can
 * show the same car stopping sooner on a rough surface. Where the on-screen model would
 * have to lie — anything involving heat, chemistry, or scale — the station stays a
 * classification or a comparison, and the real thing moves to `offscreen`, with a
 * grown-up in the loop.
 *
 * Two authoring rules run through every station here:
 *
 * **The surprise is the lesson.** Aluminium foil is shiny, metal, and not attracted to a
 * magnet. A steel spoon sinks and a steel ship floats. Those pairs are why the stations
 * come in twos — the second one exists to break the rule a child just invented from the
 * first, which is the moment the actual idea has to arrive.
 *
 * **No hint names its outcome.** A hint offers a way of looking ("think about how heavy
 * it felt for its size"), never the answer wearing a question mark.
 */

export const physicalTopics: LabTopic[] = [
  /* ====================================================================== floating */
  {
    id: "floating",
    strand: "matter",
    title: "Floating and sinking",
    childTitle: t3("On top or down low", "The floating pond", "Floating and density"),
    bigQuestion: t3(
      "What stays on top of the water?",
      "Why do some things float and others sink?",
      "What decides whether something floats: how big it is, or how heavy it is for its size?",
    ),
    art: "cork",
    stations: [
      {
        id: "floating.first-look",
        skillId: "SCI.PK.PHYS.SINK_FLOAT_01",
        tiers: ["explorer", "investigator", "scientist"],
        minutes: 4,
        phase: "guided",
        title: t3("Into the water", "Cork and stone", "Two objects, one tank"),
        activity: {
          kind: "predict",
          model: "tank",
          question: t3(
            "Where will it go?",
            "What will happen when it goes in the water?",
            "Predict what this object will do when it is placed gently in the water.",
          ),
          outcomes: [
            { id: "float", label: t3("Stays on top", "It floats", "It floats") },
            {
              id: "sink",
              label: t3("Goes down", "It sinks", "It sinks"),
              errorKind: "wrong-attribute",
              response: "You looked at how big it is. Size turns out not to be the thing that decides.",
            },
          ],
          setups: [
            {
              id: "cork",
              name: one("Cork"),
              art: "cork",
              clues: [
                {
                  id: "hold",
                  label: t3("Hold it", "Pick it up", "Feel its weight"),
                  detail: t3(
                    "It feels light in your hand.",
                    "It is big, but it feels very light for its size.",
                    "Large volume, very little mass. It feels almost empty.",
                  ),
                },
                {
                  id: "squeeze",
                  label: t3("Squeeze it", "Squeeze it", "Look at the surface"),
                  detail: t3(
                    "It squashes a little, then springs back.",
                    "It is springy, and full of tiny air pockets you can just see.",
                    "Thousands of sealed air cells run all the way through it.",
                  ),
                },
                {
                  id: "water",
                  label: t3("Look at the water", "Look at the water", "Check the depth"),
                  detail: t3(
                    "The water is deep.",
                    "The tank is deep enough for it to go right under, if it would.",
                    "Depth is not a limiting factor here, so it cannot explain the result.",
                  ),
                },
              ],
              outcome: "float",
              motion: "rise",
              observation: t3(
                "The cork stayed on top. Part of it is under the water and part is above.",
                "The cork floated, with some of it under the surface and some above.",
                "The cork floated, settling with roughly a quarter of its volume submerged.",
              ),
            },
            {
              id: "stone",
              name: one("Stone"),
              art: "stone",
              clues: [
                {
                  id: "hold",
                  label: t3("Hold it", "Pick it up", "Feel its weight"),
                  detail: t3(
                    "It is small, but it feels heavy.",
                    "It is smaller than the cork, but it feels much heavier.",
                    "Small volume, large mass — the opposite arrangement to the cork.",
                  ),
                },
                {
                  id: "inside",
                  label: t3("Look at it", "Look closely", "Look for air"),
                  detail: t3(
                    "It is hard all the way through.",
                    "It is solid all the way through. No air pockets anywhere.",
                    "No pores, no trapped air, nothing hollow inside it.",
                  ),
                },
                {
                  id: "remember",
                  label: t3("Think about the cork", "Remember the cork", "Compare with the cork"),
                  detail: t3(
                    "The big cork stayed on top.",
                    "The cork was bigger than this stone, and it floated.",
                    "The cork was larger and floated. So size alone cannot be the rule.",
                  ),
                },
              ],
              outcome: "sink",
              motion: "fall",
              observation: t3(
                "The stone went straight down to the bottom.",
                "The stone sank, even though it is smaller than the cork.",
                "The stone sank immediately, despite having the smaller volume of the two.",
              ),
            },
          ],
        },
        explain: t3(
          "Heavy-for-its-size things go down. Light-for-its-size things stay on top.",
          "Floating is not about being big or small. It is about being heavy or light for your size. The cork is light for its size, so it floats; the stone is heavy for its size, so it sinks.",
          "What matters is density — mass compared with volume. An object less dense than water floats; one denser than water sinks. The stone beat the cork on density while losing to it on size, which is why size predicted nothing.",
        ),
        notebook: t3(
          "Which one stayed on top?",
          "Tell your notebook why the small stone sank and the big cork did not.",
          "Write a rule for floating that works for both objects. Then name one thing your rule cannot yet explain.",
        ),
        vocabulary: [
          {
            word: "Density",
            meaning: t3(
              "How heavy something is for its size.",
              "How heavy something is for its size.",
              "Mass divided by volume: how much stuff is packed into the space something takes up.",
            ),
          },
        ],
        offscreen:
          "With a grown-up, float a cork and a metal spoon in a bowl of water at the sink. Predict each one out loud before it goes in. Keep water away from devices.",
      },
      {
        id: "floating.steel-surprise",
        skillId: "SCI.PK.PHYS.SINK_FLOAT_01",
        tiers: ["investigator", "scientist"],
        minutes: 4,
        phase: "independent",
        title: t2("The spoon and the boat", "Shape against density"),
        activity: {
          kind: "predict",
          model: "tank",
          question: t2(
            "Both of these are steel. What will each one do?",
            "Both objects are steel. Predict the behaviour of each.",
          ),
          outcomes: [
            { id: "float", label: t2("It floats", "It floats") },
            {
              id: "sink",
              label: t2("It sinks", "It sinks"),
              errorKind: "wrong-attribute",
              response: "You went by the material. That worked for the spoon — but the boat has something else going on.",
            },
          ],
          setups: [
            {
              id: "spoon",
              name: one("Steel spoon"),
              art: "spoon",
              clues: [
                {
                  id: "material",
                  label: t2("What is it made of?", "Identify the material"),
                  detail: t2("Solid steel, all the way through.", "Solid steel throughout, with no enclosed space."),
                },
                {
                  id: "weight",
                  label: t2("Feel it", "Compare mass and volume"),
                  detail: t2("Heavy for something so small.", "High mass for a small volume."),
                },
                {
                  id: "shape",
                  label: t2("Look at the shape", "Look at the shape"),
                  detail: t2("The bowl of the spoon is tiny and shallow.", "The hollow is too small to hold much air."),
                },
              ],
              outcome: "sink",
              motion: "fall",
              observation: t2(
                "The spoon sank, the way the stone did.",
                "The spoon sank. Steel is about eight times denser than water.",
              ),
            },
            {
              id: "boat",
              name: t2("Steel boat", "Steel hull"),
              art: "boat",
              clues: [
                {
                  id: "material",
                  label: t2("What is it made of?", "Identify the material"),
                  detail: t2("The very same steel as the spoon.", "The same steel, with the same density."),
                },
                {
                  id: "inside",
                  label: t2("Look inside", "Look inside the hull"),
                  detail: t2("It is hollow. It is mostly air in there.", "A large enclosed volume of air sits inside the steel shell."),
                },
                {
                  id: "together",
                  label: t2("Weigh the whole thing", "Weigh steel and air together"),
                  detail: t2("Steel and all that air together feel light for how big it is.", "Steel plus trapped air gives the whole object a low average density."),
                },
              ],
              outcome: "float",
              motion: "rise",
              observation: t2(
                "The boat floated, even though it is made of the same steel that sank.",
                "The hull floated. The material did not change; the average density did.",
              ),
            },
          ],
        },
        explain: t2(
          "Shape can change the answer. A steel spoon is just steel, so it sinks. A steel boat is steel wrapped around a lot of air, and steel-and-air together are light for their size. That is how a ship as heavy as a mountain stays on top of the sea.",
          "Density is a property of the whole object, not of the material alone. Shaping steel into a hull encloses a large volume of air, dropping the average density of hull-plus-air below that of water. The steel is unchanged; what changed is how much water the object has to push aside for its weight.",
        ),
        notebook: t2(
          "Draw the spoon and the boat. Show where the air is.",
          "Explain to someone who has not seen this how the same material can do two different things.",
        ),
        vocabulary: [
          {
            word: "Average density",
            meaning: t2(
              "How heavy the whole thing is for its size, counting any air inside it.",
              "The density of an object taken as a whole, including any enclosed air.",
            ),
          },
        ],
        offscreen:
          "With a grown-up, press a ball of kitchen foil into the water, then flatten the same foil into a boat shape and try again. Same foil, two results.",
      },
      {
        id: "floating.fair-test",
        skillId: "SCI.G1.SCI.FAIRTEST_01",
        tiers: ["scientist"],
        minutes: 3,
        phase: "transfer",
        title: one("Change one thing"),
        activity: {
          kind: "fair-test",
          model: "tank",
          question: one(
            "You want to find out whether a bigger object floats better. What is the one thing you should change?",
          ),
          variables: [
            {
              id: "size",
              label: one("The size of the object"),
              art: "cork",
              keep: one("This is the thing your question is about, so this is what changes."),
            },
            {
              id: "material",
              label: one("What the object is made of"),
              art: "stone",
              keep: one("Keep the material the same, or you will not know which change caused the result."),
            },
            {
              id: "water",
              label: one("How much water is in the tank"),
              art: "water",
              keep: one("Keep the water the same. A different depth is a second change you did not mean to make."),
            },
            {
              id: "drop",
              label: one("How hard you push it in"),
              art: "hand",
              keep: one("Keep the entry gentle every time. A hard push can make anything go under briefly."),
            },
          ],
          change: "size",
          because: one(
            "Every other thing has to be held still. If you change the size and the material at once and the result changes, you have no way of knowing which change did it.",
          ),
        },
        explain: one(
          "A fair test changes one thing and holds everything else still. That one thing is the variable you are asking about; everything you hold still is a control. It is not a rule about tidiness — it is the only way a result can be traced back to a cause.",
        ),
        notebook: one(
          "Write your test as a sentence: I will change ___, I will keep ___ the same, and I will measure ___.",
        ),
        offscreen:
          "With a grown-up, test three objects of the same material but different sizes in a bowl of water. Does size predict anything on its own?",
      },
    ],
  },

  /* ======================================================================== states */
  {
    id: "states",
    strand: "matter",
    title: "Solids, liquids and changes of state",
    childTitle: t3("Hard, runny, or gone", "Solid, liquid, gas", "States of matter"),
    bigQuestion: t3(
      "What happens to water when it gets warm or cold?",
      "How does the same water turn into ice, and then into nothing you can see?",
      "If water changes state, where does the matter go?",
    ),
    art: "ice",
    stations: [
      {
        id: "states.sort",
        skillId: "SCI.G1.PHYS.MATTER_01",
        tiers: ["explorer", "investigator", "scientist"],
        minutes: 3,
        phase: "guided",
        title: t3("Runny or hard", "Solid or liquid?", "Classify by state"),
        activity: {
          kind: "sort",
          model: "bench",
          question: t3(
            "Put each one where it belongs.",
            "Sort each one by whether it is a solid or a liquid.",
            "Sort by state. Use the shape test: does it keep its own shape, or take the shape of its container?",
          ),
          bins: [
            { id: "solid", label: t3("Keeps its shape", "Solid", "Solid"), art: "brick" },
            { id: "liquid", label: t3("Runs and pours", "Liquid", "Liquid"), art: "water" },
          ],
          items: [
            { id: "milk", label: one("Milk"), art: "milk", bin: "liquid" },
            { id: "brick", label: one("Brick"), art: "brick", bin: "solid" },
            { id: "honey", label: one("Honey"), art: "honey", bin: "liquid", errorKind: "wrong-attribute" },
            { id: "coin", label: one("Coin"), art: "coin", bin: "solid" },
            { id: "ice", label: t3("An ice cube", "An ice cube", "Ice"), art: "ice", bin: "solid", errorKind: "wrong-attribute" },
            { id: "sand", label: t3("Sand", "Sand", "Dry sand"), art: "sand", bin: "solid", errorKind: "wrong-attribute" },
          ],
        },
        explain: t3(
          "A liquid runs into whatever cup you put it in. A solid keeps its own shape wherever you put it.",
          "A liquid takes the shape of its container; a solid keeps its own shape. Honey is slow, but pour it into a round jar and it still goes round. Sand pours, but look at one grain: every grain keeps its own shape, so sand is a lot of tiny solids.",
          "The test is shape, not behaviour. A liquid has no fixed shape and takes its container's. Sand pours like a liquid, but each grain is a solid with a fixed shape — a granular solid, not a liquid. Ice is water in the solid state, which is why it is the one liquid on this bench that stopped behaving like one.",
        ),
        notebook: t3(
          "Which ones would spill if you tipped the cup?",
          "Sand poured, but you put it with the solids. Say why.",
          "Sand and honey both pour. Explain, using shape, why only one of them is a liquid.",
        ),
        offscreen:
          "With a grown-up, pour water, then rice, between two differently shaped containers. Watch what each one does with the shape it is given.",
      },
      {
        id: "states.change",
        skillId: "SCI.G1.PHYS.MATTER_01",
        tiers: ["explorer", "investigator", "scientist"],
        minutes: 4,
        phase: "independent",
        title: t3("The warm plate", "Water changes", "Changes of state"),
        activity: {
          kind: "predict",
          model: "warmth",
          question: t3(
            "What will happen here?",
            "What change do you predict in this situation?",
            "Predict the change of state, and say which direction the energy is moving.",
          ),
          outcomes: [
            { id: "melt", label: t3("It turns runny", "It melts", "It melts") },
            { id: "freeze", label: t3("It turns hard", "It freezes", "It freezes") },
            {
              id: "vanish",
              label: t3("It goes away", "It evaporates", "It evaporates"),
              errorKind: "not-yet-taught",
              response: "Not quite here — but you are right that water can leave without anyone taking it. That is the next one.",
            },
          ],
          setups: [
            {
              id: "warm-ice",
              name: t3("Ice on a warm plate", "Ice in a warm room", "Ice cube, room at 20°C"),
              art: "ice",
              clues: [
                { id: "touch", label: t3("Touch the plate", "Feel the plate", "Check the surroundings"), detail: t3("The plate is warm.", "The plate and the room are both warm.", "The surroundings are well above the melting point of water.") },
                { id: "look", label: t3("Look at the ice", "Look at the ice", "Look at the surface"), detail: t3("It is already shiny and wet.", "It is glistening. A little puddle has started.", "A thin liquid film has already formed at the surface.") },
                { id: "weigh", label: t3("Hold it", "Weigh it", "Weigh it, then weigh the puddle"), detail: t3("It feels cold and solid.", "Last time, the puddle weighed the same as the cube.", "Mass is conserved: the puddle's mass equals the cube's.") },
              ],
              outcome: "melt",
              motion: "grow",
              observation: t3(
                "The hard ice turned into runny water. It is still water.",
                "The solid ice took in warmth and became liquid water. Same water, new form.",
                "The ice melted. Energy moved from the warm surroundings into the ice, breaking the fixed arrangement of its particles without changing what they are.",
              ),
            },
            {
              id: "cold-water",
              name: t3("Water in the freezer", "Water in a freezer", "Liquid water at −18°C"),
              art: "water",
              clues: [
                { id: "cold", label: t3("Feel the air", "Feel the freezer", "Check the temperature"), detail: t3("It is very, very cold in there.", "It is far colder in there than the room.", "Well below 0°C, the freezing point of water.") },
                { id: "still", label: t3("Watch the water", "Watch the surface", "Watch the surface"), detail: t3("The edges are going cloudy.", "The edges are clouding and going still first.", "Crystallisation is beginning at the edges, where heat leaves fastest.") },
                { id: "level", label: t3("Look at the line", "Look at the level", "Mark the level"), detail: t3("The water comes up to the line.", "The water is exactly at the line drawn on the cup.", "Note the level now. Ice takes up slightly more room than the water it came from.") },
              ],
              outcome: "freeze",
              motion: "still",
              observation: t3(
                "The runny water turned hard. Now it is ice.",
                "The liquid water lost its warmth and became solid ice — and it ended up slightly above the line.",
                "The water froze, and the level rose: water is one of the few substances that expands as it solidifies.",
              ),
            },
            {
              id: "puddle",
              name: t3("A puddle in the sun", "A puddle on a warm day", "A shallow puddle, warm and still"),
              art: "water",
              clues: [
                { id: "dry", label: t3("Touch the path", "Touch the path", "Check the surroundings"), detail: t3("All round the puddle is warm and dry.", "The path around it is warm and completely dry.", "Warm, dry, and moving air — all three speed the change.") },
                { id: "drain", label: t3("Look for a hole", "Look for a drain", "Rule out drainage"), detail: t3("There is nowhere for it to run away to.", "No drain and no slope. It cannot run anywhere.", "The surface is level and sealed, so runoff and soaking in are both ruled out.") },
                { id: "before", label: t3("Think about yesterday", "Remember yesterday", "Recall the previous trial"), detail: t3("Yesterday's puddle went away too.", "There was a puddle here yesterday, and by teatime it had gone.", "The same thing happened yesterday under similar conditions — a repeatable result.") },
              ],
              outcome: "vanish",
              motion: "rise",
              observation: t3(
                "The puddle got smaller and smaller, and nobody took it.",
                "The puddle shrank. The water became water vapour in the air, which we cannot see.",
                "The puddle evaporated. Faster-moving molecules escaped the surface into the air as vapour — no boiling required, and no water was destroyed.",
              ),
            },
          ],
        },
        explain: t3(
          "Water can be hard ice, runny water, or water you cannot see in the air. It is always still water.",
          "Water changes state — solid, liquid, gas — when it gains or loses warmth. What it never does is stop being water. That is why a melted ice cube weighs the same as the cube did.",
          "A change of state is a physical change: the particles rearrange, but the substance is unchanged and the mass is conserved. Melting and evaporating take energy in; freezing and condensing give it out. Evaporation happens at any temperature, wherever a molecule at the surface has enough energy to leave.",
        ),
        notebook: t3(
          "Tell a grown-up where you have seen ice turn runny.",
          "Draw the same water three times: as ice, as water, and in the air.",
          "A puddle disappears and nobody takes it. Say where the water actually went, and how you could catch some of it to prove it.",
        ),
        vocabulary: [
          {
            word: "Evaporation",
            meaning: t3(
              "Water going into the air where you cannot see it.",
              "Liquid water turning into invisible water vapour in the air.",
              "Molecules leaving a liquid's surface into the gas phase, at any temperature below boiling.",
            ),
          },
        ],
        offscreen:
          "With a grown-up, put a saucer of water somewhere safe and mark the level with tape. Check it once a day for three days. Never use hot water or heating equipment.",
      },
      {
        id: "states.water-cycle",
        skillId: "SCI.G1.EARTH.WATERCYCLE_01",
        tiers: ["investigator", "scientist"],
        minutes: 3,
        phase: "independent",
        title: t2("Where rain comes from", "The water cycle"),
        activity: {
          kind: "sequence",
          model: "sky",
          cyclical: true,
          question: t2(
            "Put the journey of one drop of water in order.",
            "Order one water molecule's journey through the cycle.",
          ),
          stages: [
            { id: "sea", label: t2("Water sits in the sea", "Liquid water in the ocean"), art: "ocean" },
            { id: "up", label: t2("The sun warms it and it rises as invisible vapour", "Evaporation: energy from the Sun lifts it as vapour"), art: "steam" },
            { id: "cloud", label: t2("High up it cools and becomes tiny drops in a cloud", "Condensation: cooling forms droplets around particles, making cloud"), art: "cloud" },
            { id: "rain", label: t2("The drops join, get heavy, and fall as rain", "Precipitation: droplets coalesce until gravity wins"), art: "raindrop" },
            { id: "back", label: t2("The rain runs downhill, back to the sea", "Collection: runoff and groundwater return it to the ocean"), art: "water" },
          ],
        },
        explain: t2(
          "The water in today's rain is not new. It has been round this loop over and over — sea, sky, cloud, rain, river, sea. Nothing is added and nothing is thrown away.",
          "The cycle is closed: Earth's water is neither created nor destroyed, only moved and changed in state. The Sun supplies the energy for evaporation and gravity does the returning. The same molecules have been round this loop for billions of years.",
        ),
        notebook: t2(
          "Draw the loop with arrows. Mark the place the Sun does its work.",
          "Explain why the water cycle needs both the Sun and gravity, and what would stop if either were missing.",
        ),
        offscreen:
          "With a grown-up, breathe onto a cold window and watch the cloud appear and fade. That is condensation and evaporation, in three seconds.",
      },
    ],
  },

  /* ====================================================================== push-pull */
  {
    id: "push-pull",
    strand: "forces",
    title: "Forces and motion",
    childTitle: t3("Pushes and pulls", "The ramp workshop", "Forces, friction and motion"),
    bigQuestion: t3(
      "What makes things go, and what makes them stop?",
      "Why does the same car go further on some floors than others?",
      "What is actually slowing a rolling object down?",
    ),
    art: "wheel",
    stations: [
      {
        id: "push-pull.sort",
        skillId: "SCI.G1.PHYS.FORCE_01",
        tiers: ["explorer", "investigator", "scientist"],
        minutes: 3,
        phase: "discover",
        title: t3("Away or towards", "Push or pull?", "Direction of force"),
        activity: {
          kind: "sort",
          model: "bench",
          question: t3(
            "Does it go away from you, or come to you?",
            "Sort each action by whether it is a push or a pull.",
            "Sort by the direction of the force relative to the person applying it.",
          ),
          bins: [
            { id: "push", label: t3("Goes away", "Push", "Push: away from you"), art: "hand" },
            { id: "pull", label: t3("Comes to you", "Pull", "Pull: towards you"), art: "lever" },
          ],
          items: [
            { id: "door", label: t3("Shutting a door", "Closing a door away from you", "Closing a door away from you"), art: "wood", bin: "push" },
            { id: "sledge", label: t3("A rope on a sledge", "Towing a sledge on a rope", "Towing a sledge on a taut rope"), art: "lever", bin: "pull" },
            { id: "swing", label: t3("Starting a swing behind you", "Starting a swing from behind", "Starting a swing from behind"), art: "ball", bin: "push" },
            { id: "drawer", label: t3("Opening a drawer", "Opening a drawer", "Opening a drawer"), art: "wood", bin: "pull" },
            { id: "magnetpull", label: t3("A magnet grabbing a clip", "A magnet drawing a clip in", "A magnet drawing a clip in"), art: "magnet", bin: "pull" },
            { id: "kick", label: t3("Kicking a ball", "Kicking a ball", "Kicking a ball"), art: "ball", bin: "push" },
          ],
        },
        explain: t3(
          "A push sends something away from you. A pull brings it to you. Both of them are ways of making something move.",
          "A push moves something away and a pull brings it towards you. That is why nobody ever pushes with a piece of string — a rope can only go tight, so a rope can only pull.",
          "A force is a push or a pull, and it has a direction as well as a size. A flexible connector such as rope or chain can transmit tension but not compression, which is exactly why it can pull and cannot push.",
        ),
        notebook: t3(
          "Show a grown-up one push and one pull with your hands.",
          "Find three pulls in the room you are in. Are any of them made with string?",
          "Explain why a rope can pull but not push, using the words tension and compression.",
        ),
        offscreen:
          "With a grown-up, name a push and a pull in every room you walk through today. Doors and drawers are a good place to start.",
      },
      {
        id: "push-pull.ramp",
        skillId: "SCI.G1.PHYS.FORCE_01",
        tiers: ["explorer", "investigator", "scientist"],
        minutes: 5,
        phase: "independent",
        title: t3("The rolling car", "The ramp workshop", "Friction on the ramp"),
        activity: {
          kind: "predict",
          model: "ramp",
          question: t3(
            "How far will the car go?",
            "The same car, from the same place. What will this change do?",
            "One variable has changed. Predict its effect on the distance travelled.",
          ),
          outcomes: [
            { id: "far", label: t3("A long way", "It rolls farther", "It travels farther") },
            { id: "short", label: t3("Not far", "It stops sooner", "It stops sooner") },
            {
              id: "still",
              label: t3("It stays still", "It does not move at all", "It does not move at all"),
              errorKind: "wrong-attribute",
              response: "Something has to stop it moving completely. A surface only slows it down.",
            },
          ],
          setups: [
            {
              id: "smooth",
              name: t3("A smooth floor", "A smooth wooden floor", "Polished floor at the base"),
              art: "wheel",
              clues: [
                { id: "feel", label: t3("Feel the floor", "Feel the floor", "Feel the surface"), detail: t3("It is smooth and slippy.", "Your hand slides across it easily.", "Very little resistance when a hand is dragged across it.") },
                { id: "fair", label: t3("Same car", "Keep it fair", "Check the controls"), detail: t3("It is the same car as before.", "Same car, same ramp, same starting place.", "Car, ramp angle and release point are all unchanged.") },
                { id: "wheels", label: t3("Look at the wheels", "Look at the wheels", "Look at the wheels"), detail: t3("The wheels spin round easily.", "The wheels spin freely and keep spinning.", "Low rolling resistance; the wheels continue turning after release.") },
              ],
              outcome: "far",
              motion: "travel",
              observation: t3(
                "The car went a long way across the smooth floor.",
                "The car rolled a long way before it slowed to a stop.",
                "The car travelled the full length of the bench before stopping.",
              ),
            },
            {
              id: "rug",
              name: t3("A fluffy rug", "A rough rug at the bottom", "Rough rug at the base"),
              art: "wheel",
              clues: [
                { id: "feel", label: t3("Feel the rug", "Feel the rug", "Feel the surface"), detail: t3("It is rough and fluffy.", "Rough and fluffy. Your hand drags when you push it along.", "High resistance when a hand is dragged across it.") },
                { id: "fair", label: t3("Same car", "Keep it fair", "Check the controls"), detail: t3("Same car, same ramp.", "Only the surface has changed. Everything else is the same.", "Surface is the only variable that has changed.") },
                { id: "wheels", label: t3("Look at the wheels", "Watch the wheels", "Watch the wheels"), detail: t3("The fluff gets in the wheels.", "The fluff catches the wheels and makes them drag.", "Fibres interfere with the wheels, raising rolling resistance sharply.") },
              ],
              outcome: "short",
              motion: "stop",
              observation: t3(
                "The car stopped quickly on the fluffy rug.",
                "The car stopped much sooner on the rug than on the smooth floor.",
                "The car decelerated rapidly on contact with the rug and stopped within a short distance.",
              ),
            },
            {
              id: "steeper",
              name: t3("A steeper ramp", "A steeper ramp, smooth floor", "Steeper ramp, same smooth floor"),
              art: "wheel",
              clues: [
                { id: "angle", label: t3("Look at the ramp", "Look at the slope", "Measure the slope"), detail: t3("The ramp is much higher at the top.", "The ramp is raised higher, so the slope is steeper.", "A greater angle means a larger component of gravity acts along the slope.") },
                { id: "floor", label: t3("Feel the floor", "Feel the floor", "Check the surface"), detail: t3("Still the smooth floor.", "The smooth floor is back. No rug this time.", "Surface returned to the smooth control condition.") },
                { id: "speed", label: t3("Watch the start", "Watch the start", "Watch the release"), detail: t3("It comes down fast.", "It reaches the bottom of the ramp much faster.", "It arrives at the base with noticeably greater speed.") },
              ],
              outcome: "far",
              motion: "travel",
              observation: t3(
                "The car went even further this time.",
                "The car left the ramp faster and rolled even farther than before.",
                "Greater speed at the base produced a greater distance before friction brought it to rest.",
              ),
            },
          ],
        },
        explain: t3(
          "Rough things slow a car down. Smooth things let it keep going.",
          "Rubbing between two surfaces is called friction, and friction slows things down. A rough rug makes a lot of it; a smooth floor makes very little. A steeper ramp does not remove friction — it just gives the car more speed to spend before friction uses it up.",
          "Friction is a contact force opposing relative motion between surfaces. It converts the car's kinetic energy into heat, which is why the car stops rather than rolling for ever. The steeper ramp changed the starting energy, not the friction; on a frictionless floor the car would simply never stop, which is what makes space so strange.",
        ),
        notebook: t3(
          "Which floor let the car go furthest?",
          "You changed two different things across these three runs. Name both, and say which one made the bigger difference.",
          "The car stops. Its energy has not vanished — say where it went, and how you could detect it.",
        ),
        vocabulary: [
          {
            word: "Friction",
            meaning: t3(
              "The rubbing that slows things down.",
              "The rubbing force between two surfaces that slows movement.",
              "A contact force opposing relative motion, transferring kinetic energy into heat.",
            ),
          },
        ],
        offscreen:
          "With a grown-up, make a ramp from a book and a piece of card. Roll the same toy car onto a bare floor, then onto a towel. Keep the path away from stairs and people.",
      },
    ],
  },

  /* ======================================================================= magnets */
  {
    id: "magnets",
    strand: "forces",
    title: "Magnets",
    childTitle: t3("The sticky stone", "The magnet detective", "Magnetism and materials"),
    bigQuestion: t3(
      "What jumps to the magnet?",
      "Why does a magnet pick some things up and not others?",
      "What exactly is a magnet picky about?",
    ),
    art: "magnet",
    stations: [
      {
        id: "magnets.detective",
        skillId: "SCI.G1.PHYS.MAGNET_01",
        tiers: ["explorer", "investigator", "scientist"],
        minutes: 5,
        phase: "guided",
        title: t3("Jump or stay", "Will it jump?", "Predicting magnetic attraction"),
        activity: {
          kind: "predict",
          model: "magnet",
          question: t3(
            "Will it jump to the magnet?",
            "Will the magnet attract this?",
            "Predict whether an ordinary magnet will attract this object.",
          ),
          outcomes: [
            { id: "attract", label: t3("It jumps", "The magnet attracts it", "Attracted") },
            {
              id: "ignore",
              label: t3("It stays", "The magnet does not attract it", "Not attracted"),
              errorKind: "wrong-attribute",
              response: "Shiny and metal were good things to notice. They turn out not to be the thing that decides.",
            },
          ],
          setups: [
            {
              id: "clip",
              name: t3("A paper clip", "Steel paper clip", "Steel paper clip"),
              art: "clip",
              clues: [
                { id: "made", label: t3("What is it?", "What is it made of?", "Identify the material"), detail: t3("It is made of metal.", "Steel. And steel is mostly iron.", "Steel: an alloy that is mostly iron.") },
                { id: "coat", label: t3("Look at the outside", "Check the coating", "Check the coating"), detail: t3("It is smooth and shiny.", "A thin plastic coating, with the steel right underneath.", "A thin non-magnetic coating over a ferromagnetic core.") },
                { id: "other", label: t3("Try another one", "Test a second clip", "Test a second clip"), detail: t3("The other one jumped straight over.", "A second steel clip jumped to the magnet immediately.", "The result repeats, so it is a property of the material rather than of one object.") },
              ],
              outcome: "attract",
              motion: "travel",
              observation: t3(
                "The clip jumped across to the magnet.",
                "The clip was attracted, straight through its plastic coating.",
                "Attracted. The coating is irrelevant; the magnetic force acts on the iron beneath it.",
              ),
            },
            {
              id: "foil",
              name: t3("Shiny foil", "Aluminium foil", "Aluminium foil"),
              art: "foil",
              clues: [
                { id: "made", label: t3("What is it?", "What is it made of?", "Identify the material"), detail: t3("It is shiny like the clip.", "Aluminium. It is a metal, and it is shiny like the clip was.", "Aluminium: a metal, but not a ferromagnetic one.") },
                { id: "iron", label: t3("Is it the same?", "Is there any iron in it?", "Check for iron"), detail: t3("It is a different kind of metal.", "No iron at all. Aluminium is its own metal.", "No iron, nickel or cobalt present.") },
                { id: "wood", label: t3("Try the wood", "Try a wooden block", "Compare with a non-metal"), detail: t3("The magnet did nothing to the wood.", "The magnet ignored the wooden block completely.", "Wood, a non-metal, shows no attraction — as expected.") },
              ],
              outcome: "ignore",
              motion: "still",
              observation: t3(
                "The shiny foil did not move at all.",
                "Nothing happened. Shiny and metal were not enough.",
                "No attraction. Being metallic is not sufficient; the specific element matters.",
              ),
            },
            {
              id: "nail",
              name: t3("An iron nail", "An iron nail, under a paper cup", "Iron nail behind a paper barrier"),
              art: "nail",
              clues: [
                { id: "made", label: t3("What is it?", "What is it made of?", "Identify the material"), detail: t3("It is hard and grey.", "Iron — the very thing the clip had inside it.", "Iron: strongly ferromagnetic.") },
                { id: "hidden", label: t3("Where is it?", "Where is it?", "Note the barrier"), detail: t3("It is hiding under a paper cup.", "It is underneath a paper cup, out of sight.", "A paper barrier sits between the magnet and the nail.") },
                { id: "touch", label: t3("Can the magnet touch it?", "Can the magnet reach it?", "Can the force cross the gap?"), detail: t3("The magnet cannot touch it through the cup.", "They never touch. The paper is in the way.", "No contact is possible; any effect must act at a distance.") },
              ],
              outcome: "attract",
              motion: "travel",
              observation: t3(
                "The nail moved, even under the cup!",
                "The nail slid across, even though the magnet never touched it.",
                "Attracted through the paper. The magnetic field passes through non-magnetic materials unchanged.",
              ),
            },
          ],
        },
        explain: t3(
          "Magnets like iron. Things with iron in them jump over. Other things stay put, even shiny ones.",
          "An everyday magnet pulls on iron, and steel is mostly iron. Aluminium is shiny and metal and has no iron, so nothing happens. And a magnet does not need to touch a thing to pull it — the pull goes straight through paper.",
          "Ferromagnetic materials — iron, nickel, cobalt and alloys containing them — respond strongly to a magnetic field. Other metals do not, which is why 'metal' is the wrong category. The force is carried by a field rather than by contact, so it acts through any non-magnetic material in the way.",
        ),
        notebook: t3(
          "Which things jumped? Say what they had in common.",
          "The foil was shiny and metal and did nothing. Write the better rule.",
          "A magnet works through paper. Say what that tells you about how the force is carried.",
        ),
        vocabulary: [
          {
            word: "Magnetic field",
            meaning: t3(
              "The invisible reach of a magnet.",
              "The invisible region around a magnet where its pull can be felt.",
              "The region of space in which a magnet exerts force, carried without contact.",
            ),
          },
        ],
        offscreen:
          "Ask a grown-up to hold a large fridge magnet and test a steel spoon and a wooden spoon. Never play with small loose magnets — swallowing two is dangerous.",
      },
      {
        id: "magnets.sort",
        skillId: "SCI.G1.PHYS.MAGNET_01",
        tiers: ["investigator", "scientist"],
        minutes: 3,
        phase: "transfer",
        title: t2("Sort the bench", "Sort by magnetic response"),
        activity: {
          kind: "sort",
          model: "bench",
          question: t2(
            "Sort everything on the bench by what the magnet will do.",
            "Sort by predicted magnetic response, using material rather than appearance.",
          ),
          bins: [
            { id: "yes", label: t2("The magnet pulls it", "Attracted"), art: "magnet" },
            { id: "no", label: t2("The magnet ignores it", "Not attracted"), art: "blank" },
          ],
          items: [
            { id: "nail", label: t2("Iron nail", "Iron nail"), art: "nail", bin: "yes" },
            { id: "coin", label: t2("Aluminium coin", "Aluminium coin"), art: "coin", bin: "no", errorKind: "wrong-attribute" },
            { id: "clip", label: t2("Steel paper clip", "Steel paper clip"), art: "clip", bin: "yes" },
            { id: "plastic", label: t2("Plastic cap", "Plastic cap"), art: "plastic", bin: "no" },
            { id: "foil", label: t2("Aluminium foil", "Aluminium foil"), art: "foil", bin: "no", errorKind: "wrong-attribute" },
            { id: "wood", label: t2("Wooden block", "Wooden block"), art: "wood", bin: "no" },
          ],
        },
        explain: t2(
          "Two of these are shiny metal and the magnet ignores both. The question was never 'is it metal' — it was 'has it got iron in it'.",
          "Only the iron-bearing items respond. Both aluminium objects are metallic and both are unaffected, which is the cleanest evidence that the useful category is ferromagnetic material rather than metal.",
        ),
        notebook: t2(
          "Write the rule a magnet actually follows, in one sentence.",
          "Design a one-step test that would tell you whether an unknown grey object contains iron.",
        ),
        offscreen:
          "With a grown-up, walk around the kitchen with a fridge magnet and predict before each test. Tins are a good surprise.",
      },
    ],
  },

  /* ========================================================================= light */
  {
    id: "light",
    strand: "energy",
    title: "Light and shadow",
    childTitle: t3("Light and dark", "The light window", "Light, materials and shadow"),
    bigQuestion: t3(
      "What can you see through?",
      "What happens when light meets different materials?",
      "Where does a shadow come from, and what decides its size?",
    ),
    art: "lamp",
    stations: [
      {
        id: "light.through",
        skillId: "SCI.G1.PHYS.LIGHT_01",
        tiers: ["explorer", "investigator", "scientist"],
        minutes: 4,
        phase: "guided",
        title: t3("Can you see through?", "Through, blurry, or blocked", "Transmission of light"),
        activity: {
          kind: "predict",
          model: "beam",
          question: t3(
            "Will the light get through?",
            "What will the torch do when it shines at this?",
            "Predict how much light this material transmits.",
          ),
          outcomes: [
            { id: "clear", label: t3("It goes through", "Light goes through clearly", "Transmits clearly") },
            { id: "some", label: t3("A bit gets through", "Some light, but blurry", "Transmits, but scatters") },
            { id: "none", label: t3("It is stopped", "The light is blocked", "Blocked completely") },
          ],
          setups: [
            {
              id: "glass",
              name: t3("A window", "Clear glass", "Clear glass"),
              art: "glass",
              clues: [
                { id: "see", label: t3("Look through it", "Look through it", "Look through it"), detail: t3("You can see everything on the other side.", "You can read a word held behind it.", "An image is transmitted with almost no distortion.") },
                { id: "edge", label: t3("Look at the edge", "Look at the edge", "Look at the edge"), detail: t3("It is thin and smooth.", "It is thin, smooth, and the same material front to back.", "Uniform, non-scattering, and optically smooth on both faces.") },
                { id: "shade", label: t3("Look at the floor", "Look at the floor behind it", "Look for a shadow"), detail: t3("There is hardly any dark patch.", "Hardly any shadow at all behind it.", "No appreciable shadow — very little light is being stopped.") },
              ],
              outcome: "clear",
              motion: "shine",
              observation: t3(
                "The light went straight through the window.",
                "The light passed through, and you could still see through it clearly.",
                "Light was transmitted with minimal scattering. The material is transparent.",
              ),
            },
            {
              id: "paper",
              name: t3("Thin paper", "Tracing paper", "Tracing paper"),
              art: "paper",
              clues: [
                { id: "see", label: t3("Look through it", "Look through it", "Look through it"), detail: t3("You can see a shape, but not what it is.", "You can see something is behind it, but not what.", "A shape is visible but no detail — the image is degraded.") },
                { id: "hold", label: t3("Hold it up", "Hold it to the light", "Hold it to the light"), detail: t3("It glows a little.", "The whole sheet glows softly.", "The whole sheet glows: light is entering and being scattered in all directions.") },
                { id: "shade", label: t3("Look at the floor", "Look at the floor", "Look at the shadow"), detail: t3("There is a pale grey patch.", "A pale, soft-edged grey patch.", "A soft, partial shadow with no sharp edge.") },
              ],
              outcome: "some",
              motion: "shine",
              observation: t3(
                "Some light came through, but you could not see properly.",
                "Light got through, but scattered — so the view was blurry.",
                "Light was transmitted and scattered. The material is translucent.",
              ),
            },
            {
              id: "card",
              name: t3("Thick card", "Thick cardboard", "Thick cardboard"),
              art: "card",
              clues: [
                { id: "see", label: t3("Look through it", "Look through it", "Look through it"), detail: t3("You cannot see anything.", "Nothing at all comes through.", "No image and no glow: transmission is effectively zero.") },
                { id: "thick", label: t3("Feel it", "Feel the thickness", "Note the thickness"), detail: t3("It is thick and stiff.", "Thick, stiff, and packed solid.", "Dense fibre packed thickly enough to absorb and scatter all incident light.") },
                { id: "shade", label: t3("Look at the floor", "Look at the floor", "Look at the shadow"), detail: t3("There is a big dark shape.", "A dark shadow with a sharp edge.", "A sharp-edged shadow the shape of the card.") },
              ],
              outcome: "none",
              motion: "block",
              observation: t3(
                "The light stopped, and there was a dark shape behind.",
                "No light got through, and a sharp shadow appeared behind it.",
                "All light was blocked. The material is opaque, and the sharp shadow shows the light travelled in straight lines to get there.",
              ),
            },
          ],
        },
        explain: t3(
          "You can see through some things and not others. When light gets stopped, there is a dark shape behind.",
          "Transparent things let light through clearly, translucent things scatter it so the view goes blurry, and opaque things stop it. A shadow is simply the place an opaque thing stopped the light reaching.",
          "A shadow is evidence that light travels in straight lines: the shadow is the same shape as the object because light cannot bend around it. Transparent, translucent and opaque describe how much light a material transmits and how much it scatters on the way through.",
        ),
        notebook: t3(
          "Find something in your room you can see through.",
          "Why is a shadow the same shape as the thing that made it?",
          "Explain how a sharp-edged shadow is evidence about the path light takes.",
        ),
        vocabulary: [
          {
            word: "Opaque",
            meaning: t3("Light cannot get through it at all.", "A material that stops light completely.", "A material that transmits no light, absorbing or reflecting all of it."),
          },
          {
            word: "Translucent",
            meaning: t3("Light gets through, but you cannot see properly.", "A material that lets light through but scatters it.", "A material that transmits light while scattering it, destroying the image."),
          },
        ],
        offscreen:
          "With a grown-up, shine a small torch through paper, then card, then a glass of water. Never shine a light into anyone's eyes, and never look at the Sun.",
      },
      {
        id: "light.shadow-size",
        skillId: "SCI.G1.PHYS.LIGHT_01",
        tiers: ["investigator", "scientist"],
        minutes: 3,
        phase: "transfer",
        title: t2("Growing the shadow", "What changes a shadow's size"),
        activity: {
          kind: "fair-test",
          model: "beam",
          question: t2(
            "You want to find out what makes a shadow bigger. What is the one thing to change?",
            "Design a test for what determines shadow size. Which single variable should change?",
          ),
          variables: [
            { id: "distance", label: t2("How close the object is to the lamp", "Object-to-lamp distance"), art: "lamp", keep: t2("This is what you are asking about, so this is what changes.", "This is the independent variable.") },
            { id: "object", label: t2("Which object you use", "The object itself"), art: "ball", keep: t2("Keep the same object. A bigger object would make a bigger shadow all on its own.", "Hold the object constant; its own size would otherwise confound the result.") },
            { id: "brightness", label: t2("How bright the lamp is", "Lamp brightness"), art: "sun", keep: t2("Keep the brightness the same. A dimmer lamp changes how dark the shadow is, not how big.", "Hold brightness constant so intensity is not mistaken for size.") },
            { id: "wall", label: t2("Where the wall is", "Screen position"), art: "card", keep: t2("Keep the wall where it is, or you are changing two things at once.", "Hold the screen distance constant; it also affects size.") },
          ],
          change: "distance",
          because: t2(
            "If you move the object closer and swap it for a bigger one at the same time, and the shadow grows, you learn nothing at all: either change could have done it.",
            "Two simultaneous changes make the result uninterpretable. Only a single manipulated variable, with all else controlled, licenses a causal claim.",
          ),
        },
        explain: t2(
          "Move the object closer to the lamp and its shadow grows, because it blocks more of the spreading light. To know that is really the cause, everything else has to stay exactly where it was.",
          "Light from a small source spreads out, so an object nearer the source intercepts a wider cone of it and casts a larger shadow. Establishing that requires a controlled test: one manipulated variable, all other variables held constant, and a measured outcome.",
        ),
        notebook: t2(
          "Write your test: I will change ___ and keep ___ the same.",
          "State your hypothesis, your independent variable, your controls, and what you would measure.",
        ),
        offscreen:
          "With a grown-up and a torch in a dim room, make a hand shadow on the wall and walk slowly towards the torch. Watch what your shadow does.",
      },
    ],
  },

  /* ========================================================================= sound */
  {
    id: "sound",
    strand: "energy",
    title: "Sound",
    childTitle: t3("Loud and quiet", "Sound is a shake", "Sound as a travelling vibration"),
    bigQuestion: t3(
      "What is a sound?",
      "What is actually happening when something makes a noise?",
      "How does a vibration get from a drum to your ear?",
    ),
    art: "drum",
    stations: [
      {
        id: "sound.vibration",
        skillId: "SCI.G1.PHYS.SOUND_01",
        tiers: ["explorer", "investigator", "scientist"],
        minutes: 4,
        phase: "guided",
        title: t3("The jumping grains", "Making the grains jump", "Vibration and amplitude"),
        activity: {
          kind: "predict",
          model: "drum",
          question: t3(
            "What will the little grains do?",
            "There are grains of rice on the drum skin. What will they do?",
            "Grains of rice rest on the drum skin. Predict their behaviour.",
          ),
          outcomes: [
            { id: "jump", label: t3("They jump", "They jump about", "They jump") },
            { id: "still", label: t3("They stay still", "They stay still", "They remain at rest") },
            {
              id: "slide",
              label: t3("They slide off the side", "They slide off the edge", "They slide off the edge"),
              errorKind: "wrong-attribute",
              response: "That would need something tipping the drum. Listen for what the skin itself is doing.",
            },
          ],
          setups: [
            {
              id: "soft",
              name: t3("A gentle tap", "A gentle tap", "A gentle strike"),
              art: "hand",
              clues: [
                { id: "hear", label: t3("Listen", "Listen", "Listen"), detail: t3("A small quiet sound.", "A quiet sound, and it fades fast.", "Low amplitude, short duration.") },
                { id: "touch", label: t3("Touch the skin", "Touch the skin", "Touch the skin"), detail: t3("It tickles your finger a tiny bit.", "You can just feel it buzzing under your finger.", "A faint, rapid movement is detectable by touch.") },
                { id: "look", label: t3("Look closely", "Watch the skin", "Watch the skin"), detail: t3("It is shaking, only a little.", "It is moving up and down very fast, but not very far.", "High frequency, small displacement.") },
              ],
              outcome: "jump",
              motion: "shake",
              observation: t3(
                "The grains hopped a little bit.",
                "The grains hopped, but only a small hop.",
                "The grains were displaced slightly: small amplitude produces a small hop.",
              ),
            },
            {
              id: "hard",
              name: t3("A big bang", "A firm hit", "A firm strike"),
              art: "hand",
              clues: [
                { id: "hear", label: t3("Listen", "Listen", "Listen"), detail: t3("A big loud sound!", "A much louder sound, and it lasts longer.", "Much greater amplitude, and it rings for longer.") },
                { id: "touch", label: t3("Touch the skin", "Touch the skin", "Touch the skin"), detail: t3("It buzzes your finger a lot.", "It buzzes strongly under your finger.", "A strong vibration, easily felt.") },
                { id: "look", label: t3("Look closely", "Watch the skin", "Watch the skin"), detail: t3("It is shaking a lot.", "It is moving up and down much further each time.", "Same frequency, much larger displacement.") },
              ],
              outcome: "jump",
              motion: "shake",
              observation: t3(
                "The grains jumped high into the air.",
                "The grains jumped much higher. Louder sound, bigger jump.",
                "Displacement scaled with amplitude: the louder sound moved the grains further.",
              ),
            },
            {
              id: "held",
              name: t3("Holding the skin", "A hand flat on the skin", "The skin damped by a hand"),
              art: "hand",
              clues: [
                { id: "hand", label: t3("Look at the hand", "Look at the hand", "Note the damping"), detail: t3("A hand is resting flat on the drum.", "A hand is pressed flat across the skin.", "A hand is in contact with the membrane across its width.") },
                { id: "hit", label: t3("Hit it", "Strike it", "Strike it"), detail: t3("Someone taps it just as hard as before.", "The same firm hit as last time.", "Identical strike force to the previous trial.") },
                { id: "hear", label: t3("Listen", "Listen", "Listen"), detail: t3("It goes thud. Almost no sound.", "A dull thud, and no ringing at all.", "The sound is immediately damped: almost no sustained vibration.") },
              ],
              outcome: "still",
              motion: "still",
              observation: t3(
                "The grains hardly moved, and there was almost no sound.",
                "Barely any movement and barely any sound — the hand stopped the shaking.",
                "The hand damped the membrane. With the vibration suppressed, both the movement and the sound stopped.",
              ),
            },
          ],
        },
        explain: t3(
          "Sound is a shake. When something shakes, you hear it. When the shaking stops, the sound stops.",
          "Sound is made by things vibrating. The harder the hit, the further the skin moves and the louder it sounds. Stop the vibration and you stop the sound — which is exactly what the hand did.",
          "Sound is a vibration travelling through a medium as a pressure wave. Amplitude determines loudness; frequency determines pitch. Damping removes the vibration's energy, so the wave never forms — evidence that the vibration is not merely a side effect of sound, but is the sound.",
        ),
        notebook: t3(
          "Put your fingers on your throat and hum. What can you feel?",
          "Say what the hand did, and why it made the sound stop.",
          "Explain, using amplitude, why a firmer hit made the grains jump higher.",
        ),
        vocabulary: [
          {
            word: "Vibration",
            meaning: t3("A fast shake, too fast to see properly.", "A fast back-and-forth movement, too fast to see clearly.", "Rapid periodic motion about a rest position."),
          },
          {
            word: "Amplitude",
            meaning: t3("How big the shake is.", "How far something moves as it shakes. Bigger means louder.", "The maximum displacement from rest; it determines loudness."),
          },
        ],
        offscreen:
          "With a grown-up, stretch cling film over a bowl, sprinkle a few grains of rice on it, and bang a saucepan lid nearby. The rice will dance without anything touching it.",
      },
    ],
  },

  /* ====================================================================== machines */
  {
    id: "machines",
    strand: "forces",
    title: "Simple machines",
    childTitle: t3("Helping hands", "Machines that help", "Simple machines"),
    bigQuestion: t3(
      "What helps you move something heavy?",
      "How can a machine with no motor make a job easier?",
      "What does a simple machine actually change about a job?",
    ),
    art: "lever",
    stations: [
      {
        id: "machines.sort",
        skillId: "SCI.G1.PHYS.MACHINE_01",
        tiers: ["investigator", "scientist"],
        minutes: 4,
        phase: "guided",
        title: t2("Which helper?", "Match the machine to the job"),
        activity: {
          kind: "sort",
          model: "bench",
          question: t2(
            "Sort each helper by the job it does.",
            "Sort each simple machine by the kind of job it makes easier.",
          ),
          bins: [
            { id: "lift", label: t2("Lifts something heavy", "Lifts a load"), art: "lever" },
            { id: "move", label: t2("Moves something along", "Moves a load along"), art: "wheel" },
            { id: "split", label: t2("Splits or grips", "Splits or grips"), art: "wedge" },
          ],
          items: [
            { id: "lever", label: t2("A crowbar under a rock", "Lever"), art: "lever", bin: "lift" },
            { id: "pulley", label: t2("A rope over a wheel on a flagpole", "Pulley"), art: "pulley", bin: "lift" },
            { id: "wheel", label: t2("Wheels under a heavy box", "Wheel and axle"), art: "wheel", bin: "move" },
            { id: "ramp", label: t2("A plank up to a doorstep", "Inclined plane"), art: "ramp-art", bin: "move", errorKind: "wrong-attribute" },
            { id: "wedge", label: t2("An axe head in a log", "Wedge"), art: "wedge", bin: "split" },
            { id: "scissors", label: t2("Scissor blades", "Scissor blades"), art: "wedge", bin: "split" },
          ],
        },
        explain: t2(
          "None of these have a motor. They do not make the job smaller — they spread it out. A ramp means you push for longer but not as hard, and a lever means your hand travels a long way so the rock only has to travel a little.",
          "A simple machine does not reduce the work done; it changes the trade between force and distance. A ramp lets you apply a smaller force over a greater distance; a lever trades a long effort movement for a short, forceful one. Work in equals work out, minus whatever friction takes.",
        ),
        notebook: t2(
          "Find a lever in your kitchen. A door handle counts.",
          "Explain why a ramp does not reduce the work done, and say where the saving actually is.",
        ),
        offscreen:
          "With a grown-up, open a tin of paint with a spoon handle, or look at how a wheelbarrow lifts. Find the point everything turns around.",
      },
    ],
  },
];
