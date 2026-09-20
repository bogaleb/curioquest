# Wave 04 — Age Adaptation, Skill Taxonomy, Mastery, and Recommendations

## Goal

Build the intelligence layer that makes CurioQuest meaningfully different for each child.

## 1. Skill Taxonomy

Create a scalable structure for:

Subject
→ Domain
→ Skill
→ Level / progression

At minimum establish initial taxonomies for:

- Reading
- Math
- Science
- Logic
- Creativity/general-development areas as appropriate

## 2. Activity Metadata

Activities should be able to declare:

- age range
- grade
- skill
- difficulty
- prerequisites
- learning objective
- estimated duration
- interaction type

## 3. Attempt Tracking

Capture useful signals such as:

- child
- activity
- skill
- timestamp
- correct/incorrect where relevant
- score
- attempts
- hints
- response time where useful
- completion
- difficulty

Avoid invasive tracking.

## 4. Mastery Model

Implement a maintainable initial model.

Possible states:

- new
- learning
- practicing
- proficient
- mastered
- review

The algorithm may start simple but must be understandable and testable.

## 5. Adaptation

If repeated struggle is detected:

- lower difficulty
- provide more scaffolding
- surface prerequisite practice
- add worked examples
- increase guided practice

If repeated success is detected:

- increase difficulty
- reduce unnecessary hints
- add transfer challenges

## 6. Spaced Review

Schedule previously learned skills for review.

Do not treat one successful attempt as permanent mastery.

## 7. Recommendations

Create recommendation logic for:

- next skill
- review skill
- challenge activity
- unfinished work
- balanced subject exposure

## 8. Age-Specific Interaction

Age should affect:

- instruction length
- audio dependence
- number of choices
- reading expectation
- task length
- feedback complexity
- difficulty
- scaffolding

## Supabase

Use migrations where schema changes are required.

Maintain RLS.

Generate/update TypeScript database types.

## Completion Criteria

- skill metadata exists
- attempt tracking is real
- mastery/recommendation logic works
- same profile with different age/grade settings produces meaningfully different experience
- production build passes
