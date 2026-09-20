import {audioSettings,duckMusic} from './audio';

export type SpeechHandle = { cancel: () => void };
type SpeakOptions = {
  /** Fires when the voice actually begins, so a mouth starts moving in sync. */
  onStart?: () => void;
  /** Fires on natural end, cancellation, and error, so a mouth always stops. */
  onEnd?: () => void;
  /** Slower for younger bands. Defaults to the established 0.85. */
  rate?: number;
  /** Higher for a character with a lighter voice. */
  pitch?: number;
};

/**
 * Speaks a line and reports when it starts and stops.
 *
 * Word-boundary events are not reliable across browsers, so callers animate a mouth
 * on a timer between `onStart` and `onEnd` rather than trying to lip-sync to visemes.
 * Every exit path calls `onEnd`, including cancellation and synthesis failure, so a
 * character can never be left stuck mid-sentence.
 */
export function speak(text: string, options: SpeakOptions = {}): SpeechHandle {
  const settings = audioSettings();
  const finish = () => {
    duckMusic(false, 'voice');
    options.onEnd?.();
  };
  if (!settings.narration || typeof window === 'undefined' || !('speechSynthesis' in window)) {
    // Narration is off or unavailable. The caller still gets its lifecycle so the
    // bubble and the character behave identically with or without a voice.
    options.onStart?.();
    const timer = setTimeout(finish, Math.min(6000, 400 + text.length * 55));
    return { cancel: () => { clearTimeout(timer); finish(); } };
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = options.rate ?? 0.85;
  if (options.pitch !== undefined) utterance.pitch = options.pitch;
  utterance.volume = settings.voiceVolume;
  utterance.onstart = () => { duckMusic(true, 'voice'); options.onStart?.(); };
  utterance.onend = finish;
  utterance.onerror = finish;
  window.speechSynthesis.speak(utterance);
  return {
    cancel: () => {
      window.speechSynthesis.cancel();
      finish();
    },
  };
}

/** The long-standing fire-and-forget helper, now expressed through `speak`. */
export function readAloud(text: string) {
  speak(text);
}

/**
 * Stop whatever is being read aloud.
 *
 * `speak` hands back a handle for callers that track one utterance, but several places
 * need to silence narration without holding one: closing an instructions panel,
 * pausing a game, leaving a screen mid-sentence. `duckMusic` is released through the
 * same path so music does not stay quiet after the voice has gone.
 */
export function stopReading() {
  duckMusic(false, 'voice');
  if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
}
