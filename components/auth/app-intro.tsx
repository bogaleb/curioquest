"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useDialogFocus } from "@/hooks/use-dialog-focus";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * The title sequence: ten seconds, with sound, before the sign-in screen.
 *
 * The same idea as the intro on ABCmouse and every other children's app that opens with
 * its world rather than with a form. It plays once, it can be left at any moment, and the
 * sign-in fades up underneath it.
 *
 * ## Sound, and the thing browsers will not let us do
 *
 * A page cannot start audio on its own. Chrome, Safari and Firefox all block it until the
 * viewer has interacted with the site, which is a rule a native app does not have — so an
 * intro that simply assumes sound would be silent for most people and broken for the rest.
 *
 * So it asks, and then degrades: play unmuted first, and if the browser refuses, start
 * muted and offer a single obvious control to turn the sound on. Either way the film
 * plays. Nobody ever sees a dead frame waiting for permission.
 *
 * ## Once
 *
 * A ten-second title sequence on every navigation would be a toll rather than a welcome,
 * so it is remembered for the browser session. Closing the tab and coming back plays it
 * again, which is what "opening the app" means.
 *
 * ## Leaving
 *
 * Three ways out, because this sits between a parent and their password: the film ending,
 * the Skip button — focused the moment it appears — and Escape. It also removes itself if
 * the file does not load, since a sign-in screen nobody can reach is worse than no intro.
 *
 * Never shown to anyone who has asked for less movement, and never shown to a child: this
 * is the signed-out entrance, and a signed-in family goes straight to the map.
 */
const SEEN = "curioquest:intro-seen";
/** Matches `--kid-dur-travel`, so the fade out and the stylesheet agree. */
const FADE_MS = 520;

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
 *
 * It never changes during a session except when this component dismisses itself, and that
 * path re-renders through its own state, so the subscription has nothing to listen to.
 */
const noChanges = () => () => {};

export function AppIntro() {
  const reduced = usePrefersReducedMotion();
  const seen = useSyncExternalStore(noChanges, alreadySeen, () => true);
  const [dismissed, setDismissed] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [muted, setMuted] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derived rather than stored, so nothing has to be set from an effect on the way in.
  const open = !reduced && !seen && !dismissed;

  const finish = useCallback(() => {
    if (timer.current) return;
    setLeaving(true);
    // `remember()` deliberately waits for the fade to finish. `seen` is read from
    // `sessionStorage` on every render, so writing it here would flip the derived `open`
    // to false on the very next render and tear the overlay out of the DOM instantly —
    // the transition would never run. Found by watching it rather than by reading it.
    timer.current = setTimeout(() => {
      remember();
      setDismissed(true);
    }, FADE_MS);
  }, []);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  // Sound if the browser allows it, silence with a way back if not.
  useEffect(() => {
    const element = video.current;
    if (!open || !element) return;
    element.muted = false;
    element.play().catch(() => {
      element.muted = true;
      setMuted(true);
      element.play().catch(() => finish());
    });
  }, [open, finish]);

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
        onEnded={finish}
        onError={finish}
      />

      <div className="app-intro-controls">
        {muted && (
          <button
            type="button"
            className="app-intro-sound"
            onClick={() => {
              const element = video.current;
              if (!element) return;
              element.muted = false;
              setMuted(false);
              void element.play().catch(() => {});
            }}
          >
            Turn on sound
          </button>
        )}
        <button type="button" className="app-intro-skip" onClick={finish}>
          Skip
        </button>
      </div>
    </div>
  );
}
