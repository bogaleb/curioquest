"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { speak, type SpeechHandle } from "@/lib/speech";
import type { NovaState } from "@/lib/experience/types";
import { NovaCharacter } from "./NovaCharacter";
import { PipCharacter } from "./PipCharacter";

export type CastMember = "nova" | "pip";

/**
 * Drives a character's talking state and speech bubble together.
 *
 * The mouth animates between speech start and end rather than trying to match
 * phonemes: word-boundary events are unreliable across browsers, and a mouth that
 * moves confidently for the right duration reads as talking far better than one that
 * stutters on missing events.
 *
 * The bubble text is always rendered, so a child with narration off, a muted device,
 * or a screen reader gets exactly the same words.
 */
export function useSpeakingCast() {
  const [line, setLine] = useState<{ who: CastMember; text: string } | null>(null);
  const [talking, setTalking] = useState(false);
  const [state, setState] = useState<NovaState>("idle");
  const handle = useRef<SpeechHandle | null>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = null;
  }, []);

  useEffect(
    () => () => {
      handle.current?.cancel();
      clearTimers();
    },
    [clearTimers],
  );

  const say = useCallback(
    (who: CastMember, text: string, mood: NovaState = "explain") => {
      handle.current?.cancel();
      clearTimers();
      setLine({ who, text });
      setState(mood);
      handle.current = speak(text, {
        // Pip is a small robot, so a brighter, slightly quicker voice.
        pitch: who === "pip" ? 1.35 : 1,
        rate: who === "pip" ? 0.95 : 0.85,
        onStart: () => setTalking(true),
        onEnd: () => {
          setTalking(false);
          // The bubble outlives the voice for a beat so a child can finish reading it.
          resetTimer.current = setTimeout(() => {
            setLine(null);
            setState("idle");
          }, 2600);
        },
      });
    },
    [clearTimers],
  );

  const hush = useCallback(() => {
    handle.current?.cancel();
    clearTimers();
    setTalking(false);
    setLine(null);
    setState("idle");
  }, [clearTimers]);

  /** A reaction with no words — used for a quick celebrate or nod. */
  const react = useCallback(
    (mood: NovaState) => {
      clearTimers();
      setState(mood);
      resetTimer.current = setTimeout(() => setState("idle"), mood === "dance" ? 3200 : 1800);
    },
    [clearTimers],
  );

  return { line, talking, state, say, hush, react };
}

export function Cast({
  who,
  state,
  talking,
  size = "normal",
}: {
  who: CastMember;
  state: NovaState;
  talking: boolean;
  size?: "small" | "normal" | "large";
}) {
  return (
    <span className="cq-cast" data-talking={talking || undefined}>
      {who === "pip" ? (
        <PipCharacter state={state} size={size} talking={talking} />
      ) : (
        <NovaCharacter state={state} size={size} talking={talking} />
      )}
    </span>
  );
}

/**
 * The words a character is saying.
 *
 * The bubble itself now comes from the child component layer (`components/kid/`), which is
 * token-driven, band-aware and sized for a four-year-old's finger. This re-export keeps the
 * existing call sites working while the old `.cq-bubble` rules leave `app/cast.css`.
 */
export { SpeechBubble } from "@/components/kid/SpeechBubble";
