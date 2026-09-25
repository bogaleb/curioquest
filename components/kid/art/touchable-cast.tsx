'use client';
import { useCallback, useEffect, useRef, useState } from "react";
import { CastFigure } from "@/components/kid/art/cast";
import { voiceFor } from "@/components/characters/SpeakingCharacter";
import { speak } from "@/lib/speech";
import type { CastState } from "@/lib/experience/types";
import type { CastId } from "@/lib/character/director";

/**
 * TouchableCast — the character is alive under the child's finger.
 *
 * Tapping a character makes them wave and say something in their own voice:
 * a greeting, a nudge, a bit of themselves. Lines rotate so repeats feel
 * fresh, and nobody ever says anything unkind — the tap is a hello, not a test.
 */

const LINES: Record<CastId, string[]> = {
  curio: [
    "Ready for an adventure?",
    "You're doing great. I can tell.",
    "Every explorer starts with one small step.",
  ],
  nova: [
    "Come on, let's go!",
    "I tried this one too. We can do it together.",
    "You're my favorite fellow explorer.",
  ],
  luna: [
    "Let's sound it out together.",
    "Reading is magic, and you're the magician.",
    "One more page? I thought you'd never ask.",
  ],
  milo: [
    "Let's count it out! One, two, three!",
    "Great thinking, great thinking!",
    "Hmm… what if we try it another way?",
  ],
  bea: [
    "Look what I found! Isn't it amazing?",
    "Nature is full of surprises.",
    "Buzz buzz! Let's take a closer look.",
  ],
  tuno: [
    "Slow and steady. There's no hurry.",
    "Take a deep breath with me. In… and out.",
    "You're doing just fine, exactly as you are.",
  ],
  riff: [
    "Feel the rhythm! Clap it with me!",
    "Music makes everything more fun.",
    "La la la! Sing it with me!",
  ],
  atlas: [
    "Where shall we go today?",
    "The world is so big and wonderful.",
    "I remember everything. Ask me anything!",
  ],
};

export function TouchableCast({
  who,
  state = "idle",
  label,
}: {
  who: CastId;
  state?: CastState;
  label?: string;
}) {
  const [greeting, setGreeting] = useState<CastState>(state);
  const [bubble, setBubble] = useState<string | null>(null);
  const lineIndex = useRef(0);
  const bubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const greetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
      if (greetTimer.current) clearTimeout(greetTimer.current);
    },
    [],
  );

  const greet = useCallback(() => {
    const lines = LINES[who];
    const text = lines[lineIndex.current % lines.length];
    lineIndex.current += 1;
    const voice = voiceFor(who);
    setGreeting("wave");
    setBubble(text);
    speak(text, { pitch: voice.pitch, rate: voice.rate });
    if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    if (greetTimer.current) clearTimeout(greetTimer.current);
    bubbleTimer.current = setTimeout(() => setBubble(null), 3600);
    greetTimer.current = setTimeout(() => setGreeting(state), 2200);
  }, [who, state]);

  return (
    <span className="touchable-cast">
      <button
        type="button"
        className="touchable-cast-hit"
        onClick={greet}
        aria-label={label ?? `Say hello to ${who}`}
      >
        <CastFigure who={who} state={greeting} talking={bubble !== null} />
      </button>
      {bubble && (
        <span className="touchable-cast-bubble" role="status">
          {bubble}
        </span>
      )}
    </span>
  );
}
