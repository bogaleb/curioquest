# Wave 15 — Content Scale, Admin Preparation, and Long-Term Curriculum Operations

## Goal

Ensure CurioQuest can grow from a working product into a large learning platform without hard-coding thousands of activities.

## Content Scale

The system should support thousands of structured activities without loading everything at once.

Use data-driven schemas.

Recommended hierarchy:

Subject
→ Domain
→ Skill
→ Unit
→ Lesson
→ Activity
→ Interaction

## Metadata

Support:

- age range
- grade
- subject
- domain
- skill
- difficulty
- prerequisites
- learning objective
- estimated duration
- interaction type
- media requirements
- publication status

## Content Quality

Do not generate filler merely to increase counts.

Prefer:

- varied examples
- multiple contexts
- progression
- review
- transfer
- age-appropriate challenge
- multiple interaction styles

## Admin Preparation

Architect for a future secure admin/content system capable of:

- creating subjects
- creating skills
- creating units
- creating lessons
- creating activities
- adding questions/interactions
- uploading media
- assigning ages/grades
- assigning prerequisites
- publishing/unpublishing content
- creating collections

Do not expose admin capabilities to normal parent or child accounts.

## Supabase

Use secure roles/policies and migrations.

Do not use the service-role key in client-side code.

## Content Seeding

Create maintainable seed/import tooling for development and controlled content rollout.

Avoid enormous manual SQL scripts when structured import tooling is more maintainable.

## Quality Review

Prepare content fields/workflows for future editorial review and validation.

## Completion Criteria

- content architecture can scale
- admin capability is safely planned/partially implemented as appropriate
- content can be added without editing React components
- production build passes
