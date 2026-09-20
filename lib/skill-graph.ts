export type SkillSubject =
  | "reading"
  | "math"
  | "logic"
  | "science"
  | "world"
  | "wellbeing";
export type GradeBand = "prek" | "grade1";
export type LearningPhase = "discover" | "guided" | "independent" | "transfer";

export type SkillNode = {
  id: string;
  subject: SkillSubject;
  strand: string;
  name: string;
  description: string;
  gradeBands: GradeBand[];
  difficulty: number;
  prerequisites: string[];
  evidenceTarget: number;
  active: boolean;
};

const skill = (
  id: string,
  subject: SkillSubject,
  strand: string,
  name: string,
  description: string,
  gradeBands: GradeBand[],
  difficulty: number,
  prerequisites: string[] = [],
  evidenceTarget = 5,
  active = false,
): SkillNode => ({
  id,
  subject,
  strand,
  name,
  description,
  gradeBands,
  difficulty,
  prerequisites,
  evidenceTarget,
  active,
});

export const skillGraph: SkillNode[] = [
  skill("LIT.PK.COMP.RECALL_01", "reading", "listening-comprehension", "Remember a story detail", "Recall a stated detail from a short story heard aloud.", ["prek", "grade1"], 1.5, ["LIT.PK.ORAL.WORD_01"], 6, true),
  skill("MATH.G1.GEO.ATTRIBUTES_01", "math", "geometry", "Describe shape attributes", "Match familiar flat shapes to their side and corner properties.", ["grade1"], 2.2, ["MATH.PK.GEO.SHAPE_01"], 6, true),
  skill("LOGIC.PK.PLAN.ROUTE_01", "logic", "planning", "Plan a short route", "Arrange moves to reach a destination without obstacles.", ["prek", "grade1"], 1.5, [], 6, true),
  skill("LOGIC.G1.PLAN.ROUTE_01", "logic", "planning", "Plan around obstacles", "Sequence and revise a route within a move limit.", ["grade1"], 2.5, ["LOGIC.PK.PLAN.ROUTE_01"], 6, true),
  // Pre-K literacy foundations
skill("LIT.PK.ORAL.WORD_01", "reading", "oral-language", "Understand familiar words", "Connect common spoken words with familiar objects and actions.", ["prek", "grade1"], 1, [], 5, true),
  skill("LIT.PK.PA.RHYME_01", "reading", "phonological-awareness", "Recognize rhyming words", "Identify two spoken words that share an ending sound.", ["prek", "grade1"], 1.1, ["LIT.PK.ORAL.WORD_01"], 5, true),
  skill("LIT.PK.PA.SYLLABLE_01", "reading", "phonological-awareness", "Clap word parts", "Notice and count syllables in familiar spoken words.", ["prek", "grade1"], 1.2, ["LIT.PK.ORAL.WORD_01"]),
  skill("LIT.PK.PA.INITIAL_01", "reading", "phonemic-awareness", "Hear beginning sounds", "Identify the first sound in a familiar spoken word.", ["prek", "grade1"], 1.4, ["LIT.PK.PA.RHYME_01"], 6, true),
  skill("LIT.PK.PA.BLEND_01", "reading", "phonemic-awareness", "Blend two sound parts", "Combine an onset and rime to make a spoken word.", ["prek", "grade1"], 1.7, ["LIT.PK.PA.INITIAL_01"]),
  skill("LIT.PK.ALPH.NAME_01", "reading", "alphabet-knowledge", "Name common letters", "Recognize and name frequently encountered uppercase letters.", ["prek", "grade1"], 1.2, [], 5, true),
  skill("LIT.PK.ALPH.CASE_01", "reading", "alphabet-knowledge", "Match letter partners", "Match uppercase letters with their lowercase forms.", ["prek", "grade1"], 1.6, ["LIT.PK.ALPH.NAME_01"], 6, true),
  skill("LIT.PK.PRINT.DIRECTION_01", "reading", "print-concepts", "Follow print direction", "Track words from left to right during shared reading.", ["prek", "grade1"], 1.3),

  // Grade 1 literacy progression
  skill("LIT.G1.PH.CVC_01", "reading", "decoding", "Blend CVC words", "Blend three phonemes to read regular consonant-vowel-consonant words.", ["grade1"], 2, ["LIT.PK.PA.BLEND_01", "LIT.PK.ALPH.CASE_01"], 6, true),
  skill("LIT.G1.PH.DIGRAPH_01", "reading", "phonics", "Read common digraphs", "Read words containing sh, ch, and th.", ["grade1"], 2.4, ["LIT.G1.PH.CVC_01"], 6, true),
  skill("LIT.G1.PH.LONG_VOWEL_01", "reading", "phonics", "Read silent-e words", "Use final-e patterns to read common long-vowel words.", ["grade1"], 2.7, ["LIT.G1.PH.CVC_01"], 6, true),
  skill("LIT.G1.COMP.RECALL_01", "reading", "reading-comprehension", "Recall a story detail", "Answer a question using an explicitly stated story detail.", ["grade1"], 2.3, ["LIT.G1.PH.CVC_01"], 5, true),
  skill("LIT.G1.COMP.SEQUENCE_01", "reading", "reading-comprehension", "Sequence story events", "Identify what happened first, next, or last in a short text.", ["grade1"], 2.6, ["LIT.G1.COMP.RECALL_01"], 5, true),
  skill("LIT.G1.COMP.INFER_01", "reading", "reading-comprehension", "Make a simple inference", "Combine a text clue with background knowledge to infer an unstated idea.", ["grade1"], 3, ["LIT.G1.COMP.RECALL_01"], 6, true),
  skill("LIT.G1.COMP.CAUSE_01", "reading", "reading-comprehension", "Explain cause and effect", "Identify why an event happened in a short text.", ["grade1"], 2.8, ["LIT.G1.COMP.RECALL_01"], 5, true),
  skill("LIT.G1.COMP.TRAIT_01", "reading", "reading-comprehension", "Infer a character trait", "Use an action as evidence for a simple character trait.", ["grade1"], 3.1, ["LIT.G1.COMP.INFER_01"], 5, true),

  // Pre-K mathematics foundations
  skill("MATH.PK.NUM.RECITE_01", "math", "counting", "Say numbers in order", "Recite the stable number sequence through ten.", ["prek", "grade1"], 1, [], 5, true),
  skill("MATH.PK.NUM.ONE_TO_ONE_01", "math", "counting", "Count each object once", "Coordinate one count word with each object.", ["prek", "grade1"], 1.2, ["MATH.PK.NUM.RECITE_01"]),
  skill("MATH.PK.NUM.CARDINAL_01", "math", "cardinality", "Count a set to six", "Count up to six objects and tell how many are in the set.", ["prek", "grade1"], 1.4, ["MATH.PK.NUM.ONE_TO_ONE_01"], 6, true),
  skill("MATH.PK.NUM.NUMERAL_01", "math", "number-recognition", "Connect numerals to quantities", "Match written numerals with small quantities.", ["prek", "grade1"], 1.5, ["MATH.PK.NUM.CARDINAL_01"]),
  skill("MATH.PK.COMP.MORE_01", "math", "comparison", "Compare two quantities", "Decide which of two small quantities is greater.", ["prek", "grade1"], 1.8, ["MATH.PK.NUM.CARDINAL_01"], 6, true),
  skill("MATH.PK.COMP.EQUAL_01", "math", "comparison", "Recognize equal groups", "Decide whether two small groups contain the same quantity.", ["prek", "grade1"], 1.9, ["MATH.PK.NUM.CARDINAL_01"], 5, true),
  skill("MATH.PK.COMP.ADD_ONE_01", "math", "operations", "Add one to a group", "Find the new total when one object joins a small group.", ["prek", "grade1"], 2.1, ["MATH.PK.COMP.MORE_01"], 6, true),
  skill("MATH.PK.GEO.SHAPE_01", "math", "geometry", "Name basic shapes", "Recognize circles, squares, rectangles, and triangles.", ["prek", "grade1"], 1.3, [], 5, true),
  skill("MATH.PK.SPATIAL.POSITION_01", "math", "spatial-reasoning", "Use position words", "Understand above, below, beside, and between.", ["prek", "grade1"], 1.5),

  // Grade 1 mathematics progression
  skill("MATH.G1.ADD.CONCEPT_01", "math", "operations", "Model joining", "Represent addition as joining two quantities.", ["grade1"], 2, ["MATH.PK.COMP.ADD_ONE_01"]),
  skill("MATH.G1.ADD.WITHIN10_01", "math", "operations", "Add within 10", "Solve addition facts with totals no greater than ten.", ["grade1"], 2.4, ["MATH.G1.ADD.CONCEPT_01"], 8, true),
  skill("MATH.G1.SUB.CONCEPT_01", "math", "operations", "Model taking away", "Represent subtraction by removing objects from a group.", ["grade1"], 2.2, ["MATH.PK.NUM.CARDINAL_01"]),
  skill("MATH.G1.SUB.WITHIN10_01", "math", "operations", "Subtract within 10", "Solve take-away problems within ten.", ["grade1"], 2.7, ["MATH.G1.SUB.CONCEPT_01"], 8, true),
  skill("MATH.G1.PLACE.TENS_ONES_01", "math", "place-value", "Build teen numbers", "Interpret teen numbers as one ten and some ones.", ["grade1"], 2.9, ["MATH.PK.NUM.NUMERAL_01"], 8, true),
  skill("MATH.G1.ADD.WITHIN20_01", "math", "operations", "Add within 20", "Use counting-on or make-ten strategies to add within twenty.", ["grade1"], 3.3, ["MATH.G1.ADD.WITHIN10_01", "MATH.G1.PLACE.TENS_ONES_01"], 8, true),
  skill("MATH.G1.SUB.WITHIN20_01", "math", "operations", "Subtract within 20", "Use counting-back or related facts to subtract within twenty.", ["grade1"], 3.5, ["MATH.G1.SUB.WITHIN10_01", "MATH.G1.PLACE.TENS_ONES_01"], 8, true),
  skill("MATH.G1.MEASURE.COMPARE_01", "math", "measurement", "Compare lengths", "Compare object lengths using direct comparison or equal units.", ["grade1"], 2.6, ["MATH.PK.SPATIAL.POSITION_01"]),

  // Pre-K logic and executive function
  skill("LOGIC.PK.MATCH.SAME_01", "logic", "matching", "Match identical objects", "Notice when two objects share the same visible attributes.", ["prek", "grade1"], 1),
  skill("LOGIC.PK.SORT.ATTRIBUTE_01", "logic", "classification", "Sort by one attribute", "Group objects by color, shape, size, or kind.", ["prek", "grade1"], 1.3, ["LOGIC.PK.MATCH.SAME_01"], 5, true),
  skill("LOGIC.PK.PATTERN.AB_01", "logic", "pattern-recognition", "Continue an AB pattern", "Identify the repeating unit in a two-item alternating pattern.", ["prek", "grade1"], 1.4, ["LOGIC.PK.MATCH.SAME_01"], 5, true),
  skill("LOGIC.PK.PATTERN.AAB_01", "logic", "pattern-recognition", "Continue an AAB pattern", "Continue a repeating pattern containing two of one item and one of another.", ["prek", "grade1"], 1.8, ["LOGIC.PK.PATTERN.AB_01"], 5, true),
  skill("LOGIC.PK.PATTERN.ABB_01", "logic", "pattern-recognition", "Continue an ABB pattern", "Continue a repeating pattern containing one of one item and two of another.", ["prek", "grade1"], 2, ["LOGIC.PK.PATTERN.AAB_01"], 5, true),
  skill("LOGIC.PK.SEQUENCE.ROUTINE_01", "logic", "sequencing", "Order familiar routines", "Put familiar daily actions in a sensible order.", ["prek", "grade1"], 1.7, ["LOGIC.PK.SORT.ATTRIBUTE_01"], 5, true),
  skill("LOGIC.PK.MEMORY.TWO_01", "logic", "working-memory", "Remember two items", "Hold and recall a two-item sequence.", ["prek", "grade1"], 1.5, [], 5, true),

  // Grade 1 logic, reasoning, and executive function
  skill("LOGIC.G1.MEMORY.THREE_01", "logic", "working-memory", "Remember three items in order", "Recall a sequence of three familiar items after it is hidden.", ["grade1"], 2.3, ["LOGIC.PK.MEMORY.TWO_01"], 6, true),
  skill("LOGIC.G1.PATTERN.NUMBER_01", "logic", "pattern-recognition", "Continue +2 number patterns", "Infer and apply a constant increase of two.", ["grade1"], 2.4, ["LOGIC.PK.PATTERN.AB_01", "MATH.PK.NUM.RECITE_01"], 6, true),
  skill("LOGIC.G1.SPATIAL.DISTANCE_01", "logic", "spatial-reasoning", "Track distance changes", "Reason about how moving toward a destination changes remaining distance.", ["grade1"], 2.7, ["MATH.G1.SUB.CONCEPT_01"], 6, true),
  skill("LOGIC.G1.SEQUENCE.ROUTINE_01", "logic", "sequencing", "Complete a routine sequence", "Select the action that logically follows a familiar sequence.", ["grade1"], 2.4, ["LOGIC.PK.SEQUENCE.ROUTINE_01"], 5, true),
  skill("LOGIC.G1.CLASSIFY.RULE_01", "logic", "classification", "Apply a category rule", "Select an item that satisfies a stated category rule.", ["grade1"], 2.5, ["LOGIC.PK.SORT.ATTRIBUTE_01"], 5, true),
  skill("LOGIC.G1.DEDUCE.IFTHEN_01", "logic", "deduction", "Use an if-then clue", "Apply a stated rule to reach a necessary conclusion.", ["grade1"], 3, ["LOGIC.G1.CLASSIFY.RULE_01"], 5, true),
  skill("LOGIC.G1.ENGINEER.STABILITY_01", "logic", "engineering-reasoning", "Plan a stable structure", "Choose a structural feature that improves stability.", ["grade1"], 2.8, ["MATH.PK.GEO.SHAPE_01"], 5, true),
  skill("LOGIC.G1.ORDER.TRANSITIVE_01", "logic", "deduction", "Reason about relative order", "Combine two ordering clues to identify first or last.", ["grade1"], 3.1, ["LOGIC.G1.SEQUENCE.ROUTINE_01"], 5, true),
  skill("LOGIC.G1.ELIMINATE.CLUE_01", "logic", "deduction", "Eliminate using a clue", "Rule out an impossible choice and identify what remains.", ["grade1"], 3, ["LOGIC.G1.CLASSIFY.RULE_01"], 5, true),

  // Science: observe, sort, predict, explain
  skill("SCI.PK.LIFE.NEEDS_01", "science", "life-science", "Know what living things need", "Recognize that animals and plants need food, water, and air.", ["prek", "grade1"], 1.2, [], 5, true),
  skill("SCI.PK.LIFE.HABITAT_01", "science", "life-science", "Match animals to homes", "Connect a familiar animal with the place it lives.", ["prek", "grade1"], 1.4, ["SCI.PK.LIFE.NEEDS_01"], 5, true),
  skill("SCI.PK.EARTH.WEATHER_01", "science", "earth-science", "Describe the weather", "Name common weather and what it means for the day.", ["prek", "grade1"], 1.3, [], 5, true),
  skill("SCI.PK.PHYS.SINK_FLOAT_01", "science", "physical-science", "Predict sink or float", "Make and check a prediction about whether an object floats.", ["prek", "grade1"], 1.6, [], 5, true),
  skill("SCI.PK.SENSE.FIVE_01", "science", "human-body", "Use the five senses", "Match a sense to the body part that does the sensing.", ["prek", "grade1"], 1.3, [], 5, true),
  skill("SCI.G1.LIFE.LIFECYCLE_01", "science", "life-science", "Order a life cycle", "Sequence the stages of a familiar plant or animal life cycle.", ["grade1"], 2.5, ["SCI.PK.LIFE.NEEDS_01"], 6, true),
  skill("SCI.G1.PHYS.MATTER_01", "science", "physical-science", "Sort solids and liquids", "Classify familiar materials as solid or liquid.", ["grade1"], 2.3, ["SCI.PK.PHYS.SINK_FLOAT_01"], 6, true),
  skill("SCI.G1.PHYS.FORCE_01", "science", "physical-science", "Explain push and pull", "Identify whether a force is a push or a pull.", ["grade1"], 2.4, [], 5, true),
  skill("SCI.G1.EARTH.SPACE_01", "science", "earth-science", "Describe day and night", "Explain what the sun and moon tell us about time of day.", ["grade1"], 2.6, ["SCI.PK.EARTH.WEATHER_01"], 5, true),
  skill("SCI.G1.EARTH.SEASONS_01", "science", "earth-science", "Recognize the seasons", "Link a season to the changes it brings.", ["grade1"], 2.4, ["SCI.PK.EARTH.WEATHER_01"], 5, true),

  // Our world: community, geography, time, invention
  skill("WORLD.PK.COMM.HELPERS_01", "world", "community", "Know community helpers", "Match a helper in the community with the work they do.", ["prek", "grade1"], 1.2, [], 5, true),
  skill("WORLD.PK.TRANS.VEHICLES_01", "world", "transportation", "Sort how we travel", "Group vehicles by where they travel: land, water, or air.", ["prek", "grade1"], 1.4, [], 5, true),
  skill("WORLD.PK.PLACE.HOME_01", "world", "geography", "Name places we go", "Recognize familiar places and what happens there.", ["prek", "grade1"], 1.3, [], 5, true),
  skill("WORLD.G1.GEO.LAND_WATER_01", "world", "geography", "Tell land from water", "Identify land and water features on a simple map.", ["grade1"], 2.3, ["WORLD.PK.PLACE.HOME_01"], 5, true),
  skill("WORLD.G1.TIME.THEN_NOW_01", "world", "history", "Compare then and now", "Notice how an everyday object has changed over time.", ["grade1"], 2.5, [], 5, true),
  skill("WORLD.G1.INVENT.TOOLS_01", "world", "invention", "Match tools to jobs", "Choose the tool that solves a stated problem.", ["grade1"], 2.4, ["WORLD.PK.COMM.HELPERS_01"], 5, true),

  // Feelings and friendship: naming, perspective, choices
  skill("WELL.PK.EMOTION.NAME_01", "wellbeing", "emotions", "Name a feeling", "Match a face or situation to the feeling it shows.", ["prek", "grade1"], 1.2, [], 5, true),
  skill("WELL.PK.HABIT.CARE_01", "wellbeing", "healthy-habits", "Choose healthy habits", "Recognize everyday routines that keep a body well.", ["prek", "grade1"], 1.3, [], 5, true),
  skill("WELL.PK.SOCIAL.SHARE_01", "wellbeing", "cooperation", "Take turns and share", "Choose a cooperative response in a simple play situation.", ["prek", "grade1"], 1.5, ["WELL.PK.EMOTION.NAME_01"], 5, true),
  skill("WELL.G1.EMPATHY.PERSPECTIVE_01", "wellbeing", "empathy", "Imagine how someone feels", "Infer another person's feeling from what happened to them.", ["grade1"], 2.5, ["WELL.PK.EMOTION.NAME_01"], 5, true),
  skill("WELL.G1.REGULATE.CALM_01", "wellbeing", "self-regulation", "Find a way to calm down", "Choose a helpful strategy for a big feeling.", ["grade1"], 2.6, ["WELL.PK.EMOTION.NAME_01"], 5, true),
  skill("WELL.G1.CHOICE.RESPONSIBLE_01", "wellbeing", "decision-making", "Make a responsible choice", "Select the considerate option in an everyday dilemma.", ["grade1"], 2.7, ["WELL.PK.SOCIAL.SHARE_01"], 5, true),
];

export const skillById = new Map(skillGraph.map((node) => [node.id, node]));

export function skillsForGrade(grade: GradeBand, subject?: SkillSubject) {
  return skillGraph.filter(
    (node) => node.gradeBands.includes(grade) && (!subject || node.subject === subject),
  );
}

export function activeSkillsForGrade(grade: GradeBand, subject?: SkillSubject) {
  return skillsForGrade(grade, subject).filter((node) => node.active);
}

export function prerequisiteDepth(skillId: string, visited = new Set<string>()): number {
  if (visited.has(skillId)) throw new Error(`Cycle in skill prerequisites at ${skillId}.`);
  visited.add(skillId);
  const node = skillById.get(skillId);
  if (!node?.prerequisites.length) return 0;
  return 1 + Math.max(...node.prerequisites.map((id) => prerequisiteDepth(id, new Set(visited))));
}

function validateGraph() {
  if (skillById.size !== skillGraph.length) throw new Error("Skill graph contains duplicate IDs.");
  for (const node of skillGraph) {
    for (const prerequisite of node.prerequisites) {
      if (!skillById.has(prerequisite)) {
        throw new Error(`Missing prerequisite ${prerequisite} for ${node.id}.`);
      }
      if (prerequisite === node.id) throw new Error(`Skill ${node.id} cannot require itself.`);
    }
    prerequisiteDepth(node.id);
  }
}

validateGraph();
