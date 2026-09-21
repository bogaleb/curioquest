"use client";

import type { ReactNode } from "react";
import { Placeholder } from "./Placeholder";
import { useCopyWarning } from "./surface";

/**
 * A place, a choice, or a thing to look at.
 *
 * The blueprint's navigation rule is built into the shape: picture first, and the word
 * underneath is a label rather than the control (§C5). So `art` is always rendered — with
 * a grey placeholder when there is no drawing yet — and the title sits under it.
 *
 * A pressable card is a `<button>`, not a `<div>` with a click handler, and it presses
 * like `KidButton` does. A card that is only being looked at is a plain container and is
 * never focusable, because a focus stop that does nothing is a trap for a child driving
 * by keyboard or switch.
 *
 * This is the child-surface counterpart to the shadcn `Card` used on Grown-ups (§D7).
 * They are deliberately different components; do not reach across.
 */
export function KidCard({
  title,
  caption,
  art,
  onPress,
  pressed,
  disabled,
  children,
}: {
  /** The label under the picture. Shown, and used as the accessible name when pressable. */
  title: string;
  /** One short line. Omit it rather than filling it — every word costs reading budget. */
  caption?: string;
  art?: ReactNode;
  onPress?: () => void;
  pressed?: boolean;
  disabled?: boolean;
  children?: ReactNode;
}) {
  useCopyWarning(`KidCard("${title.slice(0, 24)}")`, caption ? `${title} ${caption}` : title);

  const body = (
    <>
      <span className="kid-card-art">{art ?? <Placeholder />}</span>
      <span className="kid-card-title">{title}</span>
      {caption ? <span className="kid-card-caption">{caption}</span> : null}
      {children}
    </>
  );

  if (!onPress) {
    return <div className="kid-card">{body}</div>;
  }

  return (
    <button
      type="button"
      className="kid-card"
      data-pressable="true"
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onPress}
    >
      {body}
    </button>
  );
}
