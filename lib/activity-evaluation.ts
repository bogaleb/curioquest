import type { Question } from "./curriculum";

// All scoring stays on the server. An engine only submits a response.
export function evaluateResponse(question: Question, response: unknown): { valid: boolean; correct: boolean } {
  if (typeof response !== "string" || response.length > 1500) return { valid: false, correct: false };
  const engine = question.engine;
  if (!engine || engine.kind === "pattern") {
    return { valid: question.options.includes(response), correct: response === question.answer };
  }
  if (engine.kind === "counting") {
    const valid = /^\d{1,2}$/.test(response) && Number(response) <= engine.max;
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
  try {
    const parsed: unknown = JSON.parse(response);
    if (engine.kind === "memory") {
      const valid = Array.isArray(parsed) && parsed.length === engine.sequence.length && parsed.every(item => engine.choices.includes(item));
      return { valid, correct: valid && JSON.stringify(parsed) === JSON.stringify(engine.sequence) };
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return { valid: false, correct: false };
    const assignments = parsed as Record<string, unknown>;
    const valid = Object.keys(assignments).length === engine.items.length && engine.items.every(item => engine.bins.some(bin => bin.id === assignments[item.id]));
    return { valid, correct: valid && engine.items.every(item => assignments[item.id] === engine.solution?.[item.id]) };
  } catch { return { valid: false, correct: false }; }
}
