"use client";

import type { ReactNode } from "react";
import { NotYetMark, RightMark } from "./Placeholder";
import { useCopyWarning } from "./surface";

export type KidButtonTone = "world" | "sun" | "quiet";
export type KidButtonState = "idle" | "right" | "not-yet";

/**
 * The one thing a child taps to act.
 *
 * Four properties are not negotiable, because each of them is a rule from §C6 that the
 * legacy `.primary` button breaks somewhere:
 *
 *   - it is always a real `<button>`, so the keyboard path exists without extra work;
 *   - it is never smaller than `--kid-touch`, which the band sets, not the caller;
 *   - `label` is always present as the accessible name, even when the face of the button
 *     is a picture — `showLabel={false}` hides the word, never the name;
 *   - the answer state is drawn as well as coloured, so "right" does not depend on being
 *     able to tell green from red.
 *
 * `onPress` rather than `onClick`: every child interaction here is a touch first, and
 * naming it that way keeps hover-only thinking out of the call sites.
 */
export function KidButton({
  label,
  showLabel = true,
  art,
  tone = "world",
  size = "standard",
  shape = "button",
  state = "idle",
  pressed,
  disabled,
  autoFocus,
  onPress,
}: {
  label: string;
  /** False only when `art` carries the meaning. The word still reaches a screen reader. */
  showLabel?: boolean;
  /** Drawn asset. A `Placeholder` is the honest stand-in until one is commissioned. */
  art?: ReactNode;
  tone?: KidButtonTone;
  size?: "standard" | "primary";
  /** `tile` is a square face for a letter, a number or a single drawn object. */
  shape?: "button" | "tile";
  state?: KidButtonState;
  /** Set for a toggle — a chosen answer, a selected object. Renders `aria-pressed`. */
  pressed?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  onPress: () => void;
}) {
  useCopyWarning(`KidButton("${label.slice(0, 24)}")`, showLabel ? label : undefined);

  if (process.env.NODE_ENV !== "production" && !showLabel && !art) {
    // A control with neither a word nor a picture cannot be understood by anyone.
    console.warn(`KidButton("${label}") hides its label and has no art.`);
  }

  return (
    <button
      type="button"
      className="kid-button"
      data-tone={tone}
      data-size={size}
      data-shape={shape}
      data-state={state === "idle" ? undefined : state}
      aria-pressed={pressed}
      aria-label={showLabel ? undefined : label}
      disabled={disabled}
      autoFocus={autoFocus}
      onClick={onPress}
    >
      {art ? <span className="kid-button-art">{art}</span> : null}
      {showLabel ? <span>{label}</span> : null}
      {state === "idle" ? null : (
        <span className="kid-button-mark">{state === "right" ? <RightMark /> : <NotYetMark />}</span>
      )}
    </button>
  );
}
