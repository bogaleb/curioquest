import { tierForBand } from "@/lib/science/tier";
import { colouringPages, fillablePieces, pageById, pagesForTier } from "./pages";
import { paletteFor, familiesFor, surpriseColour, colourById, studioColours } from "./palette";
import { drawingPrompts, promptFor, promptsForTier } from "./prompts";
import {
  allWritingCharacters,
  characterByKey,
  groupsForTier,
  tasksForTier,
  writingGroups,
  writingGroupById,
  writingLines,
  writingTasks,
} from "./writing";
import type {
  ColouringPage,
  FormationStroke,
  PublicPage,
  StrokePoint,
  StudioTier,
  StudioTool,
} from "./types";

export {
  colouringPages, fillablePieces, pageById, pagesForTier,
  paletteFor, familiesFor, surpriseColour, colourById, studioColours,
  drawingPrompts, promptFor, promptsForTier,
  allWritingCharacters, characterByKey, groupsForTier, tasksForTier,
  writingGroups, writingGroupById, writingLines, writingTasks,
  tierForBand,
};

/**
 * The Making Place engine.
 *
 * Pure functions over authored content, so the whole studio is testable without a
 * browser, a canvas or a database. Two jobs that matter:
 *
 *   1. decide what a child of a given age is handed — which pages, which colours, which
 *      tools, which letters;
 *   2. decide whether a traced letter was actually traced.
 *
 * The second is the one that makes the writing desk a teaching surface rather than a
 * drawing surface with a letter printed underneath it.
 */

/* ==========================================================================
   WHAT EACH AGE IS HANDED
   ========================================================================== */

/**
 * The tools offered.
 *
 * A three-year-old gets four: something to draw with, something to fill with, stamps and
 * an eraser. Seven tools on a toolbar is seven decisions before a mark is made, and the
 * difference between a marker and a crayon is not one a three-year-old is asking to make.
 *
 * `fill` is in every set, deliberately. It is the tool that makes a colouring page work
 * and the one the old studio buried at the end of a row of seven.
 */
export function toolsFor(tier: StudioTier): StudioTool[] {
  if (tier === "explorer") return ["crayon", "fill", "stamp", "eraser"];
  if (tier === "investigator") return ["pencil", "crayon", "marker", "fill", "stamp", "eraser"];
  return ["pencil", "crayon", "marker", "brush", "fill", "stamp", "eraser"];
}

/** Brush sizes offered, in canvas units. Three named sizes, never a slider. */
export function sizesFor(tier: StudioTier): { id: string; label: string; size: number }[] {
  if (tier === "explorer") {
    return [
      { id: "fat", label: "Fat", size: 26 },
      { id: "big", label: "Big", size: 14 },
    ];
  }
  return [
    { id: "fat", label: "Fat", size: 26 },
    { id: "big", label: "Big", size: 14 },
    { id: "thin", label: "Thin", size: 6 },
  ];
}

/** The page, resolved to one child's tier and stripped to what a component renders. */
export function publicPage(page: ColouringPage, tier: StudioTier): PublicPage {
  return {
    id: page.id,
    title: page.title,
    childTitle: page.childTitle[tier],
    theme: page.theme,
    invitation: page.invitation[tier],
    pieces: page.pieces,
  };
}

/** Every page this child is offered, resolved. */
export function publicPages(tier: StudioTier): PublicPage[] {
  return pagesForTier(tier).map((page) => publicPage(page, tier));
}

/** True once every fillable region of a page has been given a colour. */
export function pageComplete(page: ColouringPage, fills: Record<string, string>): boolean {
  return fillablePieces(page).every((piece) => Boolean(fills[piece.id]));
}

/** How far through a page a child is, as a count rather than a percentage. */
export function pageProgress(page: ColouringPage, fills: Record<string, string>) {
  const regions = fillablePieces(page);
  return { done: regions.filter((piece) => fills[piece.id]).length, total: regions.length };
}

/* ==========================================================================
   DID THEY TRACE IT?
   ==========================================================================

   Three questions, and deliberately only three:

     - did they **start** in the right place? Starting a letter at the bottom is the
       single most common formation fault and the one that never fixes itself later;
     - did they go the right **way**? A `b` drawn bottom-up looks identical on paper and
       is a different letter to write;
     - did they stay **near the line**? Not *on* it — near it. Neatness is not the point
       and a checker that demands it teaches a child that their hand is wrong.

   Everything else a handwriting app might measure — pressure, speed, letter spacing,
   consistency — is either unavailable from a pointer or is not a thing to tell a
   five-year-old about.
   ========================================================================== */

export type TraceResult = {
  ok: boolean;
  /** Why it did not pass. Null when it did. Drives what the child is told next. */
  fault: "start" | "direction" | "gap" | "short" | null;
  /** 0–1. Used for the drawn progress mark, never shown as a percentage. */
  coverage: number;
};

/** How forgiving the check is, per tier. A three-year-old's hand is not an eight-year-old's. */
function tolerances(tier: StudioTier) {
  if (tier === "explorer") return { start: 30, near: 22, coverage: 0.62 };
  if (tier === "investigator") return { start: 24, near: 17, coverage: 0.72 };
  return { start: 18, near: 13, coverage: 0.8 };
}

const distance = (a: StrokePoint, b: StrokePoint) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/** How far a stroke travels end to end, following it. */
function strokeLength(points: readonly StrokePoint[]) {
  let total = 0;
  for (let index = 1; index < points.length; index += 1) total += distance(points[index - 1], points[index]);
  return total;
}

/**
 * Compare what the child drew against the stroke they were shown.
 *
 * `drawn` is in the same 100×100 box as the target, so the caller converts once and this
 * stays free of pixels, canvases and devices.
 */
export function checkTrace(
  stroke: FormationStroke,
  drawn: StrokePoint[],
  tier: StudioTier,
): TraceResult {
  const limit = tolerances(tier);
  const target = stroke.points;
  if (!drawn.length) return { ok: false, fault: "short", coverage: 0 };

  // A dot — the one on an i or a j — is a tap, not a stroke. Asking a child to drag
  // across two units of it would be asking for the wrong movement, and the direction
  // and coverage checks below mean nothing on a target with no length.
  if (strokeLength(target) < 6) {
    const near = drawn.some((mark) => distance(mark, target[0]) <= limit.start);
    return near ? { ok: true, fault: null, coverage: 1 } : { ok: false, fault: "start", coverage: 0 };
  }

  if (drawn.length < 3) return { ok: false, fault: "short", coverage: 0 };

  // 1. Started in the right place. Checked against the *first* target point only: a
  //    child who begins at the end of the stroke has drawn the letter backwards even if
  //    the finished shape is identical.
  if (distance(drawn[0], target[0]) > limit.start) {
    return { ok: false, fault: "start", coverage: 0 };
  }

  // 2. Covered the line. For each target point, was the pointer ever near it?
  const nearest = target.map((point) => Math.min(...drawn.map((mark) => distance(point, mark))));
  const covered = nearest.filter((gap) => gap <= limit.near).length;
  const coverage = covered / target.length;

  // 3. Travelled the right way. Each drawn point is matched to its closest point on the
  //    target; if the child moved along the stroke, those indices mostly go up.
  let forward = 0;
  let previous = 0;
  for (const mark of drawn) {
    let best = 0;
    let bestGap = Infinity;
    target.forEach((point, index) => {
      const gap = distance(point, mark);
      if (gap < bestGap) {
        bestGap = gap;
        best = index;
      }
    });
    if (best >= previous) forward += 1;
    previous = best;
  }
  const forwardRatio = forward / drawn.length;

  if (forwardRatio < 0.6) return { ok: false, fault: "direction", coverage };
  if (coverage < limit.coverage) return { ok: false, fault: "gap", coverage };
  return { ok: true, fault: null, coverage };
}

/** What the child is told, chosen by the fault rather than by a score. */
export function traceAdvice(result: TraceResult, stroke: FormationStroke): string {
  if (result.ok) return "That is the way to make it.";
  if (strokeLength(stroke.points) < 6) return "Give it a dot, right on the green spot.";
  switch (result.fault) {
    case "start":
      return "Start on the green dot. That is where this stroke begins.";
    case "direction":
      return `You went the other way. ${stroke.cue}`;
    case "gap":
      return "Nearly. Try to stay on the grey trail the whole way.";
    default:
      return "Have another go, all the way along the trail.";
  }
}

/* ==========================================================================
   SELF-CHECK
   ========================================================================== */

function validateStudio() {
  const pageIds = new Set<string>();
  for (const page of colouringPages) {
    if (pageIds.has(page.id)) throw new Error(`Duplicate colouring page "${page.id}".`);
    pageIds.add(page.id);
    if (!page.tiers.length) throw new Error(`Colouring page "${page.id}" is for nobody.`);
    const pieceIds = new Set<string>();
    for (const piece of page.pieces) {
      if (pieceIds.has(piece.id)) throw new Error(`Page "${page.id}" repeats piece id "${piece.id}".`);
      pieceIds.add(piece.id);
      if (!colourById.has(piece.tone)) {
        throw new Error(`Page "${page.id}" piece "${piece.id}" uses unknown tone "${piece.tone}".`);
      }
    }
    if (!fillablePieces(page).length) throw new Error(`Page "${page.id}" has nothing to colour.`);
  }

  const characterKeys = new Set<string>();
  for (const group of writingGroups) {
    for (const character of group.characters) {
      const composite = `${group.id}:${character.key}`;
      if (characterKeys.has(composite)) throw new Error(`Duplicate writing character "${composite}".`);
      characterKeys.add(composite);
      if (!character.strokes.length) throw new Error(`"${composite}" has no strokes.`);
      for (const stroke of character.strokes) {
        if (stroke.points.length < 2) throw new Error(`"${composite}" has a stroke with one point.`);
        if (!stroke.cue) throw new Error(`"${composite}" has a stroke with no cue.`);
      }
    }
  }
}

validateStudio();
