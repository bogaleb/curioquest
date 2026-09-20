import type { Question } from "./curriculum";
import { traceRoute, routeDirections } from "./route-engine";

// All scoring stays on the server. An engine only submits a response.
export function evaluateResponse(question: Question, response: unknown): { valid: boolean; correct: boolean } {
  if (typeof response !== "string" || response.length > 1500) return { valid: false, correct: false };
  const engine = question.engine;
  if (!engine || engine.kind === "pattern") {
    return { valid: question.options.includes(response), correct: response === question.answer };
  }
  if (engine.kind === "counting" || engine.kind === "ten-frame") {
    const valid = /^\d{1,2}$/.test(response) && Number(response) <= (engine.kind === "counting" ? engine.max : engine.size);
    return { valid, correct: valid && response === question.answer };
  }
  if (engine.kind === "word-builder") {
    const letters = [...engine.letters];
    const valid = response.length === engine.length && [...response].every(letter => {
      const index = letters.indexOf(letter);
      if (index < 0) return false;
      letters.splice(index, 1); return true;
    });
    return { valid, correct: valid && response === question.answer };
  }
  if (engine.kind === "investigation") {
    // The prediction is the answer. Whether the child examined the clues first is
    // enforced in the engine, not here: the server cannot tell looking from waiting,
    // and a rule that punished a fast reader would teach the wrong lesson anyway.
    const valid = engine.outcomes.some((outcome) => outcome.id === response);
    return { valid, correct: valid && response === question.answer };
  }
  if (engine.kind === "number-line") {
    // Where the child's marker ended up. Anywhere on the line is a legal move — the
    // point of an open number line is that overshooting and walking back is allowed.
    const value = Number(response);
    const valid = /^-?\d{1,3}$/.test(response) && Number.isInteger(value) && value >= engine.min && value <= engine.max;
    return { valid, correct: valid && response === question.answer };
  }
  if (engine.kind === "number-bond") {
    // The completed bond decides, not an authored string: a bond is correct exactly
    // when its parts make its whole. The authored answer is only used for the hint.
    const value = Number(response);
    if (!/^\d{1,3}$/.test(response) || !Number.isInteger(value)) return { valid: false, correct: false };
    const [left, right] = engine.parts;
    const filled = engine.whole === null ? { whole: value, left, right }
      : left === null ? { whole: engine.whole, left: value, right }
      : { whole: engine.whole, left, right: value };
    if (filled.left === null || filled.right === null) return { valid: false, correct: false };
    return { valid: true, correct: filled.left + filled.right === filled.whole };
  }
  if (engine.kind === "place-value") {
    // "tens,ones". Ten or more loose ones is the one thing the mat will not accept:
    // discovering why is the lesson, so it is scored as wrong rather than rejected.
    const match = /^(\d{1,2}),(\d{1,2})$/.exec(response);
    if (!match) return { valid: false, correct: false };
    const tens = Number(match[1]), ones = Number(match[2]);
    if (tens > engine.maxTens || ones > 20) return { valid: false, correct: false };
    return { valid: true, correct: ones <= 9 && tens * 10 + ones === engine.target };
  }
  if (engine.kind === "array-builder") {
    // "rows,columns". The array has to be the shape that was asked for; a child who
    // builds twelve as 2 by 6 has built twelve, but not three rows of four.
    const match = /^(\d{1,2}),(\d{1,2})$/.exec(response);
    if (!match) return { valid: false, correct: false };
    const rows = Number(match[1]), columns = Number(match[2]);
    if (rows > engine.maxRows || columns > engine.maxColumns) return { valid: false, correct: false };
    return { valid: true, correct: rows === engine.rows && columns === engine.columns };
  }
  if (engine.kind === "balance") {
    // The scale itself decides; the authored answer only names the expected side.
    const heavier = engine.left.count === engine.right.count ? "equal" : engine.left.count > engine.right.count ? "left" : "right";
    const expected = engine.question === "more" ? heavier : heavier === "equal" ? "equal" : heavier === "left" ? "right" : "left";
    const valid = ["left", "right", "equal"].includes(response);
    return { valid, correct: valid && response === expected };
  }
  try {
    const parsed: unknown = JSON.parse(response);
    if (engine.kind === "bubble-pop") {
      const ids = engine.bubbles.map((bubble) => bubble.id);
      const valid = Array.isArray(parsed) && new Set(parsed).size === parsed.length && parsed.every((id) => ids.includes(id as string));
      if (!valid) return { valid: false, correct: false };
      const chosen = [...(parsed as string[])].sort();
      const solution = [...(engine.solution ?? [])].sort();
      return { valid, correct: JSON.stringify(chosen) === JSON.stringify(solution) };
    }
    if (engine.kind === "constellation") {
      const valid = Array.isArray(parsed) && parsed.length === engine.stars.length
        && new Set(parsed).size === parsed.length
        && parsed.every((id) => engine.stars.some((star) => star.id === id));
      return { valid, correct: valid && JSON.stringify(parsed) === JSON.stringify(engine.solution) };
    }
    if (engine.kind === "route") {
      const valid = Array.isArray(parsed) && parsed.length > 0 && parsed.length <= engine.maxMoves && parsed.every(move=>routeDirections.some(d=>d.id===move));
      return {valid,correct:valid&&traceRoute(engine,parsed as string[]).arrived};
    }
    if (engine.kind === "ordering") {
      const valid = Array.isArray(parsed) && parsed.length===engine.items.length && new Set(parsed).size===parsed.length && parsed.every(id=>engine.items.some(item=>item.id===id));
      return {valid,correct:valid&&JSON.stringify(parsed)===JSON.stringify(engine.solution)};
    }
    if (engine.kind === "memory") {
      const valid = Array.isArray(parsed) && parsed.length === engine.sequence.length && parsed.every(item => engine.choices.includes(item));
      return { valid, correct: valid && JSON.stringify(parsed) === JSON.stringify(engine.sequence) };
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return { valid: false, correct: false };
    const assignments = parsed as Record<string, unknown>;
    if (engine.kind === "matching") {
      const valid = Object.keys(assignments).length===engine.items.length && new Set(Object.values(assignments)).size===engine.items.length && engine.items.every(item=>engine.targets.some(t=>t.id===assignments[item.id]));
      return {valid,correct:valid&&engine.items.every(item=>assignments[item.id]===engine.solution?.[item.id])};
    }
    const valid = Object.keys(assignments).length === engine.items.length && engine.items.every(item => engine.bins.some(bin => bin.id === assignments[item.id]));
    return { valid, correct: valid && engine.items.every(item => assignments[item.id] === engine.solution?.[item.id]) };
  } catch { return { valid: false, correct: false }; }
}
