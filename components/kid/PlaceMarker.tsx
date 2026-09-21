"use client";

import { useEffect, useRef } from "react";
import { PlaceArt } from "./PlaceArt";
import { useKidSurface } from "./surface";
import type { KidWorld } from "@/lib/kid-worlds";

/**
 * A place on the map, and the two-touch rule that makes a menu usable by a non-reader.
 *
 * The first touch says the name out loud and holds the place open. The second touch goes
 * there. That is how a pre-reader learns what a picture means: a wrong first touch costs a
 * word rather than a screen, and a child who does not yet know where anything is can walk
 * the map with their finger and be told.
 *
 * It is the same two presses on a keyboard, and the name is written under the picture as
 * well as spoken, so a child with the sound off, or a screen reader, gets everything a
 * hearing child gets (§C6). Nothing here depends on hover.
 *
 * Position is fixed by the navigation data and never reordered (§WP-03). The coordinates
 * arrive as CSS custom properties because they belong to the place, not to the stylesheet.
 */
export function PlaceMarker({
  id,
  childName,
  label,
  world,
  x,
  y,
  size = "large",
  selected,
  disabled,
  onSelect,
  onEnter,
}: {
  id: string;
  /** What Nova says on the first touch. */
  childName: string;
  /** The written word under the picture. A label, never the control itself. */
  label: string;
  world: KidWorld;
  x: number;
  y: number;
  size?: "large" | "small";
  /** True once this place has been touched and is waiting for the second touch. */
  selected: boolean;
  disabled?: boolean;
  onSelect: (id: string, spoken: string) => void;
  onEnter: (id: string) => void;
}) {
  const { narration } = useKidSurface();
  const button = useRef<HTMLButtonElement>(null);

  // A place that is open keeps the keyboard with it, so the second press lands here.
  useEffect(() => {
    if (selected && document.activeElement !== button.current) button.current?.focus();
  }, [selected]);

  return (
    <button
      ref={button}
      type="button"
      className="kid-place"
      data-kid-world={world}
      data-size={size}
      data-open={selected || undefined}
      disabled={disabled}
      aria-pressed={selected}
      style={{ "--kid-place-x": `${x}%`, "--kid-place-y": `${y}%` } as React.CSSProperties}
      onClick={() => (selected ? onEnter(id) : onSelect(id, childName))}
    >
      <span className="kid-place-mark">
        <PlaceArt id={id} />
      </span>
      <span className="kid-place-label">{label}</span>
      {/* The second-touch prompt. Spoken when the voice is on, always written, and only
          rendered for the open place so there is never more than one instruction. */}
      {selected ? (
        <span className="kid-place-again">{narration ? "Touch again to go" : "Touch again"}</span>
      ) : null}
    </button>
  );
}
