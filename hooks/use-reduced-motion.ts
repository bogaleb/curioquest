"use client";

import { useSyncExternalStore } from "react";

/**
 * Whether the viewer has asked for less movement.
 *
 * Almost everything in this product honours the preference in CSS, which is the right
 * place for it: `app/tokens.css` collapses the transition durations and `app/kid.css`
 * switches the ambient loops off by name. This hook is for the handful of cases where the
 * *behaviour* changes rather than the animation — a `setTimeout` schedule that should not
 * run at all, or a video that should not start playing. A stylesheet cannot cancel either.
 *
 * `useSyncExternalStore` rather than an effect that sets state: `matchMedia` is exactly
 * the external store this hook is for, and it gives the answer on the first render instead
 * of one render late. The server snapshot is `false` — the markup React sends matches what
 * it would send for a browser that has expressed no preference — and a viewer who has
 * expressed one gets the still version immediately on hydration.
 */
const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
