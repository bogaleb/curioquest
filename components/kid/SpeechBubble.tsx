"use client";

import { SpeakerMark } from "./Placeholder";
import { useCopyWarning, useKidSurface } from "./surface";

export type KidSpeaker = "nova" | "pip";

/**
 * What a character is saying — written down, always.
 *
 * Audio is the primary channel for a pre-reader and text is the redundant one (§C5), so
 * the words are rendered whether or not the voice is on, whether or not the device has a
 * speaker, and whether or not `speechSynthesis` exists. A child with narration off gets
 * the same sentence a child with narration on hears.
 *
 * The slot is a live region that stays mounted. Announcing a line only works if the region
 * was already in the accessibility tree when the text arrived, so the empty wrapper is
 * rendered even when nobody is speaking.
 *
 * "Say that again" appears only when the voice is on, because with narration off it would
 * be a control that does nothing — and the words it would repeat are already on screen.
 */
export function SpeechBubble({
  line,
  onReplay,
  tail = "start",
}: {
  line: { who: KidSpeaker; text: string } | null;
  onReplay?: () => void;
  /** Which side the tail points from — towards whoever is speaking. */
  tail?: "start" | "end" | "none";
}) {
  const { narration } = useKidSurface();
  useCopyWarning("SpeechBubble", line?.text);

  return (
    <div className="kid-bubble-slot" aria-live="polite" aria-atomic="true">
      {line ? (
        <p className="kid-bubble" data-who={line.who} data-tail={tail}>
          <span className="kid-bubble-text">{line.text}</span>
          {onReplay && narration ? (
            <button
              type="button"
              className="kid-bubble-replay"
              onClick={onReplay}
              aria-label="Say that again"
            >
              <SpeakerMark />
            </button>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
