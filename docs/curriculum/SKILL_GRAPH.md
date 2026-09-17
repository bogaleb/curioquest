# CurioQuest MVP Skill Graph

`PRODUCT_BLUEPRINT.md` remains the product source of truth. The executable graph lives in `lib/skill-graph.ts`.

## Current scope

- 49 measurable Pre-K and Grade 1 skills.
- 34 active skills currently backed by one or more playable activities.
- Literacy: oral language, phonological/phonemic awareness, alphabet knowledge, decoding, phonics, and comprehension.
- Mathematics: counting, cardinality, comparison, early operations, place value, geometry, spatial reasoning, and measurement.
- Logic and executive function: matching, classification, patterns, sequencing, working memory, deduction, spatial reasoning, and engineering stability.

Every node has:

- a stable CurioQuest ID;
- subject and strand;
- learner-facing skill name and measurable description;
- recommended grade bands;
- relative difficulty;
- prerequisite IDs;
- an evidence target;
- an active-content flag.

Grade bands guide recommendations but do not define a permanent access lock. Prerequisites form the instructional path used by the recommendation engine.

## Content contract

Every playable question must reference an existing active skill and declare:

- activity engine type;
- learning phase;
- estimated time;
- optional learner-interest contexts;
- hint and explanatory feedback.

The application validates this contract during module loading and the automated curriculum tests. Type checking alone does not execute this validator. It rejects duplicate question IDs, missing or inactive skill references, subject mismatches, and invalid choice configurations. Structured engines use their own server response validation.

## Growth path

The current graph establishes the schema and first prerequisite chains. Expansion should add reviewed skills in coherent strands, then add varied activity evidence for those skills. A skill should not become active until at least one production-quality activity configuration exists for it.

Near-term curriculum targets:

1. Expand toward the blueprint's 180–200 unique MVP micro-skills, with reviewed content for both tracks. A declared node without playable content is not a delivered skill.
2. Add science and executive-function activity content without turning the child home into a subject menu.
3. Add standards mappings as metadata, not as child-facing labels.
4. Require evidence from multiple activity types before high-confidence mastery.
