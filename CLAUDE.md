@AGENTS.md

# CurioQuest

CurioQuest is an existing children's learning platform built with Next.js/React, Supabase, GitHub, and Vercel.

## Product Goal

Transform CurioQuest from its current basic/prototype state into a polished, age-adaptive, science-informed, commercial-grade learning product.

The long-term product specification is located at:

`docs/product/COMMERCIAL-UPGRADE.md`

Do not read the entire specification on every task unless necessary. Read the specific implementation wave relevant to the current task.

## Core Rules

- Preserve working features unless replacing them with something demonstrably better.
- Do not rebuild the application from scratch.
- Do not weaken Supabase Row Level Security or authentication.
- Never expose service-role credentials.
- Use version-controlled Supabase migrations.
- Maintain responsive behavior across phone, tablet/iPad, laptop, Chromebook, and desktop.
- Treat iPad as a primary child-learning device.
- Child content and experiences must adapt meaningfully by age/grade.
- Avoid generic quiz-only learning experiences.
- Educational activities should use appropriate learning-science principles.
- Prefer reusable engines and data-driven content over hard-coded activities.
- Maintain accessibility and reduced-motion support.
- Protect parent-only areas.
- Minimize unnecessary child data collection.
- Preserve production stability.
- Do not copy proprietary designs, artwork, characters, audio, or copyrighted content from competitors.

## Learning Science Principles

Use these principles where appropriate:

- active learning
- retrieval practice
- spaced practice
- cumulative review
- interleaving
- mastery learning
- scaffolding
- worked examples
- gradual release of responsibility
- manageable cognitive load
- meaningful immediate feedback
- dual coding
- prior-knowledge activation
- metacognition
- productive struggle
- transfer of learning

Do not merely mention these principles. Implement them in the learning experience.

## Age Bands

At minimum support:

- Ages 3–4: Early Preschool
- Ages 4–5: Pre-K
- Ages 5–6: Kindergarten
- Ages 6–7: Grade 1
- Ages 7–8: Grade 2
- Ages 8–9: Grade 3

Age/grade must change content, instructions, interaction style, complexity, scaffolding, visuals, reading expectations, activity duration, and difficulty.

## Development Workflow

Before substantial work:

1. Inspect the existing implementation.
2. Run `git status`.
3. Read only the relevant wave specification.
4. Understand existing components before creating replacements.
5. Identify affected Supabase data/RLS/migrations when relevant.

After substantial work:

1. Run type checking if configured.
2. Run lint if configured.
3. Run tests.
4. Run `npm run build`.
5. Fix failures.
6. Test representative responsive viewports.
7. Verify Supabase behavior where relevant.
8. Verify no RLS/security regression.
9. Summarize changes.
10. Stop at the end of the assigned wave unless explicitly told to continue.

## Product Quality Standard

Every major implementation should improve some combination of:

- educational quality
- age adaptation
- content depth
- child engagement
- usability
- responsiveness
- accessibility
- performance
- parent usefulness
- commercial polish

A feature that merely "works" is not automatically complete.

## Implementation Specifications

Detailed specifications live under:

`docs/product/`

When assigned a specific wave, read the relevant wave file rather than loading all product documentation unnecessarily.
