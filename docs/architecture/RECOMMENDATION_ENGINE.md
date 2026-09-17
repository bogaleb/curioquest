# Daily Quest Recommendation Engine V1

The deterministic recommender is implemented in `lib/recommendation.ts`. It follows the blueprint's V1 principle: explainable rules before machine learning.

## Quest assembly

A Daily Quest begins with literacy, mathematics, and logic/executive-function coverage. Extra slots go to the learner's weaker domains. Subject-world quests stay within the selected world.

The learner's parent-selected daily duration currently maps to:

- about 8 minutes: 4 discoveries;
- about 10 minutes: 5 discoveries;
- about 15 minutes: 7 discoveries (14 estimated minutes);
- about 20 minutes: 10 discoveries.

Each activity has an estimated duration. The selected plan and its rationale are saved with the session.

## Ranking signals

Candidate activities receive transparent positive or negative weights for:

- review being due;
- low mastery that needs support;
- an unseen activity or skill;
- proximity to the learner's current trail level;
- matching a saved learner interest;
- prerequisite readiness;
- recent engine repetition;
- duplicate skills inside one quest.

The engine uses deterministic tie-breaking so the same learner state produces a stable plan while completed quests naturally rotate content.

## Evidence and spaced review

Each child-skill record stores mastery and confidence separately, along with attempts, correctness, independent success, hints, repeated independent success, activity formats, contexts, sessions, last practice, and next review date.

The first answer to a question supplies evidence; retries do not add observations. Correct independent work contributes more evidence than work after support. Review begins the next day, then advances through 3, 7, 14, and 30 days only on successful independent recall when a review is due. Same-day repetitions cannot postpone that review.

The optional Meet Nova welcome samples two activities in each subject. The second stays at level 1 after support, or moves to level 2 after independent success. Results seed a new learner's trail but never overwrite established trails or award mastery. This is a small starting-point heuristic, not a comprehensive placement assessment.

The model is deliberately heuristic and must not be described as a validated assessment. Its weights should be tuned only after reviewed learner evidence is available.
