import type { SkillSubject } from "./skill-graph";

export type ActivityEngine =
  | { kind: "counting"; objects: string[]; max: number }
  | { kind: "sorting"; items: { id: string; label: string; emoji: string }[]; bins: { id: string; label: string; emoji: string }[]; solution?: Record<string, string> }
  | { kind: "memory"; sequence: string[]; choices: string[] }
  | { kind: "word-builder"; letters: string[]; length: number }
  | { kind: "pattern"; sequence: string[] }
  | { kind: "ten-frame"; size: number; emoji: string }
  | { kind: "route"; size: number; start: number; goal: number; rocks: number[]; maxMoves: number }
  | { kind: "matching"; items: { id: string; label: string }[]; targets: { id: string; label: string }[]; solution?: Record<string, string> }
  | { kind: "ordering"; items: { id: string; label: string; emoji: string }[]; solution?: string[] }
  /**
   * Pop every bubble that fits a rule. Multi-select rather than single choice, so a
   * child has to judge each candidate instead of comparing three answers.
   */
  | { kind: "bubble-pop"; rule: string; bubbles: { id: string; label: string }[]; solution?: string[] }
  /**
   * A balance scale that tilts to whichever side holds more. Comparison made physical:
   * the child predicts, then watches the scale settle.
   */
  | { kind: "balance"; left: { emoji: string; count: number }; right: { emoji: string; count: number }; question: "more" | "fewer" }
  /**
   * Join stars in order to reveal a constellation. Sequencing with a payoff a child
   * can see: the picture only appears if the order is right.
   */
  | { kind: "constellation"; name: string; stars: { id: string; label: string; x: number; y: number }[]; solution?: string[] }
  /**
   * A number line the child hops along. Wave 06 names number lines specifically, and
   * names the hint that goes with them: "what does the number line show?"
   *
   * The child is not told how many hops to make. They start at `start` and move until
   * they think they have arrived, which means overshooting and coming back is part of
   * the activity rather than a failure of it. Counting on stops being a fact to recall
   * and becomes a distance to travel.
   */
  | { kind: "number-line"; min: number; max: number; start: number; tickEvery: number }
  /**
   * Part–part–whole. One of the three cells is `null` and the child fills it.
   *
   * Which cell is missing changes the thinking entirely: a missing whole is addition, a
   * missing part is subtraction, and they are the same picture. That is the point of
   * teaching them as one model rather than two operations.
   *
   * Correctness is computed from the completed bond, not compared to an authored
   * string, so the model itself decides — the same self-validating property the balance
   * scale has.
   */
  | { kind: "number-bond"; whole: number | null; parts: [number | null, number | null]; emoji: string }
  /**
   * Tens rods and ones cubes. The child builds a target number.
   *
   * The constraint is the lesson: no more than nine ones are allowed on the mat, so
   * fourteen cannot be made from fourteen cubes. A child who tries discovers why ten
   * ones become one ten, which is the whole of place value and is not learnable from a
   * question with four buttons under it.
   */
  | { kind: "place-value"; target: number; maxTens: number }
  /**
   * Rows and columns of objects. Repeated addition made visible, and the foundation
   * multiplication is later built on.
   *
   * The total updates as the array grows, so a child building four rows of three sees
   * the count climb 3, 6, 9, 12 and meets skip counting without being taught it as a
   * rule to memorise.
   */
  | { kind: "array-builder"; rows: number; columns: number; emoji: string; maxRows: number; maxColumns: number };

export type PublicQuestion = {
  id: string; subject: SkillSubject; grade: "prek" | "grade1";
  skillId: string; prompt: string; visual?: string; options: string[];
  engine?: ActivityEngine; hint: string;
  passage?: { title: string; text: string; emoji: string };
  audioLabel?: string;
};
