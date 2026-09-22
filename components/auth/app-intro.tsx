"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useDialogFocus } from "@/hooks/use-dialog-focus";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * The title sequence: ten seconds, with sound, before the sign-in screen.
 *
 * Nothing is drawn over it. No skip button, no sound button, no progress bar — it opens by
 * itself, plays, and hands over to the sign-in screen when it is done. That is the whole
 * behaviour, and the absence of controls is the point: a title card with a "Skip" in the
 * corner is an advertisement, and one with a "Turn on sound" is an apology.
 *
 * ## Sound, and the thing browsers will not let us do
 *
 * A page cannot start audio on its own. Chrome, Safari and Firefox block it until the
 * viewer has interacted with the site, which is a rule a native app does not have — so
 * some first visits will be silent however this is written.
 *
 * What it does instead of asking: play unmuted, fall back to muted if refused, and then
 * unmute on the first touch or key press, whatever and wherever it is. That is invisible,
 * costs the viewer nothing, and means the sound arrives the moment the browser will allow
 * it. An installed app, or any later visit, plays with sound from the first frame.
 *
 * ## Leaving
 *
 * It leaves on its own at the end. Escape also works — invisible, no chrome, and the
 * keyboard route out of anything modal. And it is on a watchdog: if the file has not
 * started within six seconds, or has not finished within its own length plus a margin, it
 * gives up and shows the sign-in screen. A title sequence is never worth a viewer waiting
 * on a network.
 *
 * ## Once
 *
 * Remembered for the browser session, so it is a welcome rather than a toll. Never shown
 * to anyone who has asked for less movement, and never shown inside the app: a signed-in
 * family goes straight to the map.
 */
const SEEN = "curioquest:intro-seen";
/** Matches `--kid-dur-travel`, so the fade out and the stylesheet agree. */
const FADE_MS = 520;
/** How long to wait for the film to start before giving up on it entirely. */
const START_MS = 6000;
/** Slack on top of the film's own length, in case `ended` never arrives. */
const OVERRUN_MS = 1500;

function alreadySeen() {
  try {
    return sessionStorage.getItem(SEEN) === "1";
  } catch {
    // Private windows and blocked site data both throw here. An intro that plays twice
    // is a much smaller problem than a crash on the sign-in page.
    return false;
  }
}

function remember() {
  try {
    sessionStorage.setItem(SEEN, "1");
  } catch {
    /* nothing to do: see above */
  }
}

/**
 * Whether this session has already had its title sequence.
 *
 * Read through `useSyncExternalStore` rather than set from an effect, so the answer is
 * there on the first client render instead of one render late — and so the *server*
 * answers "yes, seen", which means the HTML never contains a full-screen overlay that a
 * viewer with JavaScript disabled could not dismiss.
 */
const noChanges = () => () => {};

export function AppIntro() {
  const reduced = usePrefersReducedMotion();
  const seen = useSyncExternalStore(noChanges, alreadySeen, () => true);
  const [dismissed, setDismissed] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const fade = useRef<ReturnType<typeof setTimeout> | null>(null);
  const watchdog = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derived rather than stored, so nothing has to be set from an effect on the way in.
  const open = !reduced && !seen && !dismissed;

  const finish = useCallback(() => {
    if (fade.current) return;
    if (watchdog.current) clearTimeout(watchdog.current);
    setLeaving(true);
    // `remember()` deliberately waits for the fade to finish. `seen` is read from
    // `sessionStorage` on every render, so writing it here would flip the derived `open`
    // to false on the very next render and tear the overlay out of the DOM instantly —
    // the transition would never run. Found by watching it rather than by reading it.
    fade.current = setTimeout(() => {
      remember();
      setDismissed(true);
    }, FADE_MS);
  }, []);

  useEffect(
    () => () => {
      if (fade.current) clearTimeout(fade.current);
      if (watchdog.current) clearTimeout(watchdog.current);
    },
    [],
  );

  // Sound if the browser allows it, silence if not — and never a question about it.
  useEffect(() => {
    const element = video.current;
    if (!open || !element) return;
    element.muted = false;
    element.play().catch(() => {
      element.muted = true;
      element.play().catch(() => finish());
    });
  }, [open, finish]);

  // The first touch or key press anywhere turns the sound on, if it was refused. It does
  // not dismiss: the viewer did not ask to leave, and a title card that vanishes on a
  // stray tap is worse than one that plays for ten seconds.
  useEffect(() => {
    if (!open) return;
    const unmute = () => {
      const element = video.current;
      if (!element?.muted) return;
      element.muted = false;
      void element.play().catch(() => {});
    };
    window.addEventListener("pointerdown", unmute, { once: true });
    window.addEventListener("keydown", unmute, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unmute);
      window.removeEventListener("keydown", unmute);
    };
  }, [open]);

  // Nothing here is worth waiting on a slow network for.
  useEffect(() => {
    if (!open) return;
    watchdog.current = setTimeout(finish, START_MS);
    return () => {
      if (watchdog.current) clearTimeout(watchdog.current);
    };
  }, [open, finish]);

  // Escape is the one way out a viewer can reach, and it costs the screen nothing.
  useDialogFocus(open, finish);

  if (!open) return null;

  return (
    <div
      className="app-intro"
      data-leaving={leaving || undefined}
      role="dialog"
      aria-modal="true"
      aria-label="CurioQuest opening film"
    >
      <video
        ref={video}
        className="app-intro-film"
        src="/media/curioquest-intro.mp4"
        poster="/media/curioquest-intro.jpg"
        playsInline
        preload="auto"
        onPlaying={() => {
          // It started, so the start watchdog is replaced by one sized to the film.
          if (watchdog.current) clearTimeout(watchdog.current);
          const element = video.current;
          const left = element ? (element.duration - element.currentTime) * 1000 : 0;
          watchdog.current = setTimeout(finish, Math.max(0, left) + OVERRUN_MS);
        }}
        onEnded={finish}
        onError={finish}
      />
    </div>
  );
}
