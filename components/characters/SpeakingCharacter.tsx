"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { speak, type SpeechHandle } from "@/lib/speech";
import type { CastState } from "@/lib/experience/types";
import type { CastId } from "@/lib/character/director";
import { CastFigure } from "@/components/kid/art/cast";
import { PipCharacter } from "./PipCharacter";

export type CastMember = CastId | "pip";

/**
 * One voice per character. Pitch and rate are the only levers — the words and
 * the warmth stay the same, so a child always knows who is talking without
 * the personality changing between lines.
 */
const VOICE: Record<CastMember, { pitch: number; rate: number }> = {
  curio: { pitch: 1.0, rate: 0.85 }, // the warm guide
  nova: { pitch: 1.15, rate: 0.95 }, // the young peer
  luna: { pitch: 0.95, rate: 0.8 }, // gentle, unhurried
  milo: { pitch: 1.25, rate: 0.9 }, // bright young robot
  bea: { pitch: 1.3, rate: 1.0 }, // buzzy and cheerful
  tuno: { pitch: 0.85, rate: 0.7 }, // slow and calm, on purpose
  riff: { pitch: 1.2, rate: 1.0 }, // musical bounce
  atlas: { pitch: 0.8, rate: 0.8 }, // deep and kind
  pip: { pitch: 1.35, rate: 0.95 }, // the small legacy robot
};

/**
 * The voice profile for a cast member, so any component can speak as them.
 */
export function voiceFor(who: CastMember): { pitch: number; rate: number } {
  return VOICE[who];
}

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
  const [state, setState] = useState<CastState>("idle");
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
    (who: CastMember, text: string, mood: CastState = "explain") => {
      handle.current?.cancel();
      clearTimers();
      setLine({ who, text });
      setState(mood);
      const voice = VOICE[who];
      handle.current = speak(text, {
        pitch: voice.pitch,
        rate: voice.rate,
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
    (mood: CastState) => {
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
  state: CastState;
  talking: boolean;
  size?: "small" | "normal" | "large";
}) {
  return (
    <span className="cq-cast" data-talking={talking || undefined}>
      {who === "pip" ? (
        <PipCharacter state={state} size={size} talking={talking} />
      ) : (
        <CastFigure who={who} state={state} talking={talking} scale={size} />
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
