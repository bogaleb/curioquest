/**
 * Facts about the curriculum that user interface code may state, without importing the
 * curriculum itself.
 *
 * This module exists for one reason. `lib/curriculum.ts` holds every question *and its
 * answer*. A client component that imports anything from it — even a single number —
 * pulls the whole module into that route's JavaScript bundle, where any child with the
 * developer tools open can read the answer to every activity. That is exactly what
 * happened: `app/(explorer)/parent/page.tsx` imported `activityCount` to print one
 * sentence, and shipped 462 answers to the browser to do it.
 *
 * So values that UI needs are restated here as literals, and `tests/curriculum-facts.test.mjs`
 * asserts each one still matches the real curriculum. A stale number fails the test
 * suite; an imported number fails a child's learning.
 *
 * Do not import `@/lib/curriculum` from a client component. `scripts/check-bundle.mjs`
 * checks the built output for answer-key material and will fail the check if you do.
 */

/** Total authored activity configurations. Verified against `questions.length`. */
export const activityCount = 501;
