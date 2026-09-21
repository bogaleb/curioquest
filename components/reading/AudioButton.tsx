'use client';
import { useEffect, useRef, useState } from 'react';
import { Volume2, Users } from 'lucide-react';
import { audioSettings, duckMusic } from '@/lib/audio';
import { deliver, readySet, type SpokenKind } from '@/lib/audio-policy';

/**
 * The one control in the product that makes a sound a child listens to (§WP-07).
 *
 * It used to take a `text` and an optional `src`, prefer the file, and fall back to
 * `speechSynthesis` for everything else. That fallback is the fault WP-07 exists to fix:
 * a synthesiser cannot say an isolated consonant — it adds a schwa, so /m/ becomes
 * "muh" — and "muh-a-tuh" never blends into "mat". Falling back to it for a phoneme
 * taught a child the exact habit the blending activities then have to undo.
 *
 * So the decision moved out of here and into `lib/audio-policy.ts`, which this component
 * obeys. Three outcomes: play the recording, speak the prose, or — for a phoneme with no
 * recording — say nothing and show the mouth cue so a grown-up can make the sound.
 *
 * Ducking and the narration-off path are unchanged, and the third outcome is the reason
 * `kind` is a required prop rather than an optional one: a caller has to say what it is
 * asking to be said, because that is what decides whether a synthesiser may answer.
 */
export function AudioButton({
  text,
  kind = 'line',
  audioKey,
  src,
  ready,
  label = 'Listen',
  slow = false,
  cue,
  example,
}: {
  text: string;
  /** What this is. A `phoneme` is never synthesised — see `lib/audio-policy.ts`. */
  kind?: SpokenKind;
  /** What a recording would be filed under, when that differs from the text. */
  audioKey?: string;
  /** A resolved recording URL, when the server already has one. */
  src?: string;
  /** Asset ids that have recordings, for deciding before one is resolved. */
  ready?: string[];
  label?: string;
  slow?: boolean;
  /** How a grown-up makes the sound, shown when there is no recording. */
  cue?: string;
  example?: string | null;
}) {
  const sound = useRef<HTMLAudioElement | null>(null);
  const [status, setStatus] = useState('');
  const [modelling, setModelling] = useState(false);

  useEffect(() => () => {
    sound.current?.pause();
    duckMusic(false, 'voice');
    window.speechSynthesis?.cancel();
  }, []);

  // A resolved `src` is proof a recording exists, whatever the ready set says.
  const plan = src
    ? ({ via: 'clip', assetId: '', text } as const)
    : deliver({ kind, text, key: audioKey, available: readySet(ready ?? []), cue, example });

  async function play() {
    sound.current?.pause();
    window.speechSynthesis?.cancel();
    const settings = audioSettings();
    if (!settings.narration) {
      setStatus('Voice is off. Read together, or ask your grown-up to turn it on.');
      return;
    }
    setStatus('');

    if (plan.via === 'model') {
      // Nothing is played. This is the rule working, not a failure, so it reads as an
      // invitation rather than an error.
      setModelling(true);
      return;
    }

    try {
      if (plan.via === 'clip' && src) {
        duckMusic(true, 'voice');
        sound.current = new Audio(src);
        sound.current.volume = settings.voiceVolume;
        sound.current.playbackRate = slow ? 0.8 : 1;
        sound.current.onended = () => duckMusic(false, 'voice');
        sound.current.onerror = () => {
          duckMusic(false, 'voice');
          setStatus('That recording would not play. Read this with your grown-up.');
        };
        await sound.current.play();
        return;
      }
      if ('speechSynthesis' in window) {
        const speech = new SpeechSynthesisUtterance(plan.text);
        speech.lang = 'en-US';
        speech.rate = slow ? 0.65 : 0.85;
        speech.volume = settings.voiceVolume;
        duckMusic(true, 'voice');
        speech.onend = () => duckMusic(false, 'voice');
        speech.onerror = () => {
          duckMusic(false, 'voice');
          setStatus('Let’s read together. This device could not play the voice.');
        };
        window.speechSynthesis.speak(speech);
        return;
      }
      setStatus('Let’s read together. This device has no spoken voice.');
    } catch {
      duckMusic(false, 'voice');
      setStatus('Audio is unavailable. Read this with your grown-up.');
    }
  }

  return (
    <span className="reading-audio">
      <button type="button" className="secondary" onClick={play}>
        {plan.via === 'model' ? <Users size={21}/> : <Volume2 size={21}/>}
        {plan.via === 'model' ? 'Say it together' : label}
      </button>
      {status && <small role="status">{status}</small>}
      {modelling && plan.via === 'model' && (
        // The teaching move that replaces a wrong sound. A grown-up can make the sound
        // correctly from this; a synthesiser could not.
        <span className="sound-model" role="status">
          <strong>{plan.phoneme}</strong>
          {plan.example && <em>like the beginning of {plan.example}</em>}
          <small>{plan.cue}</small>
        </span>
      )}
    </span>
  );
}
