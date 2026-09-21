/**
 * What "mastered" means, in one place (blueprint §C2).
 *
 * Three things have to be true at once, and a score is none of them:
 *
 *   1. **Representation** — correct in at least two different verbs. Tapping the right
 *      picture twice is one kind of knowing; saying it and building it is another.
 *   2. **Spacing** — at least one correct attempt a day or more after the first. A skill
 *      right twice in one sitting has been held for minutes, not learned.
 *   3. **Independence** — at least two *consecutive* correct attempts with no support
 *      standing, so one unaided success after a run of hints does not clear the bar.
 *
 * Anything short of all three is `practising`, and a parent is told "practising" — never
 * "mastered". The rule lives here rather than in `mastery.ts` or `mastery-projection.ts`
 * because both of those answer the same question from different data, and two copies of
 * this rule would drift apart within a release. Everything that claims a child knows
 * something calls one of these functions.
 */

export const EVIDENCE_THRESHOLDS = {
  /** Different verbs a child has been correct in. */
  representations: 2,
  /** Hours between the first correct attempt and the spaced one. */
  spacingHours: 24,
  /** Consecutive correct attempts with `support = "none"`. */
  independence: 2,
} as const;

export type EvidenceCounts = {
  /** How many distinct verbs the child has been correct in. */
  representations: number;
  /** True once a correct attempt has landed a day or more after the first correct one. */
  spaced: boolean;
  /** The current run of correct, unsupported attempts. */
  consecutiveIndependent: number;
};

export type MasteryState = "untouched" | "practising" | "mastered";

export function meetsRepresentation(counts: EvidenceCounts) {
  return counts.representations >= EVIDENCE_THRESHOLDS.representations;
}

export function meetsSpacing(counts: EvidenceCounts) {
  return counts.spaced;
}

export function meetsIndependence(counts: EvidenceCounts) {
  return counts.consecutiveIndependent >= EVIDENCE_THRESHOLDS.independence;
}

/** All three, or it is practice. */
export function meetsEvidenceRule(counts: EvidenceCounts) {
  return meetsRepresentation(counts) && meetsSpacing(counts) && meetsIndependence(counts);
}

export function masteryState(counts: EvidenceCounts, attempted: boolean): MasteryState {
  if (!attempted) return "untouched";
  return meetsEvidenceRule(counts) ? "mastered" : "practising";
}

/**
 * Which legs of the rule are still missing, named for a person rather than for the code.
 *
 * The parent weekly (WP-10) is forbidden from showing a percentage without a sentence
 * explaining it; these are those sentences. They describe what the child has yet to show,
 * never what they failed to do.
 */
export function evidenceGaps(counts: EvidenceCounts): string[] {
  const gaps: string[] = [];
  if (!meetsRepresentation(counts)) gaps.push("has shown this one way so far");
  if (!meetsSpacing(counts)) gaps.push("has not come back to it on a later day yet");
  if (!meetsIndependence(counts)) gaps.push("is still using help some of the time");
  return gaps;
}
