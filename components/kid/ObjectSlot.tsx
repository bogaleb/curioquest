"use client";

import type { ReactNode } from "react";

/**
 * A place where a reward object lives, and a visible gap where one is missing.
 *
 * This is the unit the treehouse is built from (§D9, WP-09): progress a child can see is a
 * shelf that fills up, not a number that rises. An empty slot is dashed and therefore
 * reads as an invitation; a filled one is solid and quiet, because the space is no longer
 * asking for anything.
 *
 * Placing is two taps, never a drag: choose the object, then choose the slot. Drag-and-drop
 * on a tablet held in two hands fails often enough at four years old that it cannot be the
 * only way to do something. `ready` is how a slot says "the thing you picked can go here".
 */
export function ObjectSlot({
  name,
  art,
  caption,
  ready = false,
  disabled,
  onPress,
}: {
  /** What lives here, or what could. Always the accessible name — never only a picture. */
  name: string;
  /** The drawn object. Absent means empty, and empty is drawn as a visible gap. */
  art?: ReactNode;
  /** A word under the slot — "shelf", "desk". Shown to everyone. */
  caption?: string;
  /** True when an object is in hand and this slot will accept it. */
  ready?: boolean;
  disabled?: boolean;
  onPress?: () => void;
}) {
  const filled = Boolean(art);
  // An empty slot is drawn as an empty slot: dashed outline and nothing inside. Putting a
  // placeholder here would make "nothing is here yet" and "something is here but undrawn"
  // look the same, which is exactly the confusion the placeholder exists to prevent.
  const body = (
    <>
      <span className="kid-slot-object">{art}</span>
      {caption ? <span className="kid-slot-caption">{caption}</span> : null}
    </>
  );

  if (!onPress) {
    return (
      <div className="kid-slot" data-filled={filled || undefined} role="img" aria-label={name}>
        {body}
      </div>
    );
  }

  return (
    <button
      type="button"
      className="kid-slot"
      data-filled={filled || undefined}
      data-pressable="true"
      data-ready={ready || undefined}
      disabled={disabled}
      aria-label={name}
      onClick={onPress}
    >
      {body}
    </button>
  );
}
