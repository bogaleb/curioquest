"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BuddyArt } from "@/components/kid/BuddyArt";
import { PlaceArt } from "@/components/kid/PlaceArt";
import { PlaceMarker } from "@/components/kid/PlaceMarker";
import { SpeechBubble } from "@/components/kid/SpeechBubble";
import { KidSurfaceProvider } from "@/components/kid/surface";
import type { PublicExplorer } from "@/lib/explorer-view";
import { mapPlaces, destinationFor } from "@/lib/navigation";
import { audioSettings } from "@/lib/audio";
import { readAloud, stopReading } from "@/lib/speech";

/**
 * Arrival: the map that replaced the dashboard.
 *
 * The old home screen asked a four-year-old to read eleven headings, a grade label, a star
 * count and two marketing lines before anything happened. This asks them to touch a picture.
 *
 * Three rules from the blueprint are visible in the markup:
 *
 *   - **The trail is the biggest thing on the screen** and it is the thing to do: one touch
 *     resumes whatever is unfinished, or starts today's adventure. A child who wants to learn
 *     never has to find anything.
 *   - **Every place is a drawn picture with a fixed position** (§WP-03). The word underneath
 *     is a label; touching the word is touching the picture, and neither is the only clue.
 *   - **Two touches to enter**: the first says the name aloud, the second goes. That is how a
 *     non-reader learns a menu, and it makes a wrong touch cost a word rather than a screen.
 *
 * Nothing on this screen reorders itself. Not by recency, not by recommendation, not by
 * progress — position is how a child remembers where things are.
 */
export function ChildMap({
  profile,
  profiles,
  busy,
  onSelectProfile,
  onGo,
  onTrail,
  onGrownUps,
  hasActiveTrail,
}: {
  profile: PublicExplorer;
  profiles: PublicExplorer[];
  busy: boolean;
  onSelectProfile: (id: string) => void;
  /** Enter a destination by id. */
  onGo: (id: string) => void;
  /** The one thing to do: resume the unfinished run, or begin today's. */
  onTrail: () => void;
  /** Opens the parent gate. The only adult control on any child screen. */
  onGrownUps: () => void;
  hasActiveTrail: boolean;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const [said, setSaid] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trailhead = useRef<HTMLButtonElement>(null);
  const paused = profile.preferences.paused;
  const places = mapPlaces({ faith: profile.controls.faith });
  const trail = destinationFor("adventure")!;

  // An open place closes itself after a few seconds. A child who wandered off mid-touch
  // should not come back to a screen that will jump somewhere on the next tap.
  useEffect(() => {
    if (!open) return;
    const handle = setTimeout(() => setOpen(null), 6000);
    return () => clearTimeout(handle);
  }, [open]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      stopReading();
    },
    [],
  );

  // The map is a place with a size, not a layout that reflows: the landmarks keep their
  // positions on a phone and the picture is panned instead. So arrival centres the trail,
  // and a child on a small screen still starts on the thing they came to do.
  useEffect(() => {
    trailhead.current?.scrollIntoView({ block: "center", inline: "center", behavior: "instant" });
  }, []);

  const select = useCallback((id: string, spoken: string) => {
    setOpen(id);
    setSaid(spoken);
    // The name is spoken and written. With narration off the written line is all there is,
    // which is why it is never only spoken.
    if (audioSettings().narration) readAloud(spoken);
  }, []);

  const greeting = hasActiveTrail
    ? `Welcome back, ${profile.name}. Your trail is waiting.`
    : `Hello ${profile.name}! Touch the trail to begin.`;

  return (
    <KidSurfaceProvider
      value={{ band: profile.band, narration: profile.controls.audio.narration, world: "grove" }}
    >
      <div className="kid-map-frame" data-kid-world="grove" data-band={profile.band}>
        {/* The ground is bigger than a phone and is panned, not reflowed. Nova and the
            buddies sit outside it, in a strip that stays put — so a landmark and a speech
            bubble can never end up on top of each other, whatever the screen. */}
        <div className="kid-map-scroll">
        <section className="kid-map" aria-label="Your map">
        <div className="kid-map-sky" aria-hidden="true">
          <span className="kid-map-sun" />
          <span className="kid-map-ridge" />
        </div>

        {/* The trail. Larger than everything else, lowest on the screen, and a single touch:
            the one control a child may use without learning the two-touch rule first. */}
        <button
          ref={trailhead}
          type="button"
          className="kid-trailhead"
          data-kid-world={trail.place.world}
          disabled={busy || paused}
          aria-label={hasActiveTrail ? "Carry on with your trail" : "Start today's trail"}
          onClick={onTrail}
        >
          <span className="kid-place-mark">
            <PlaceArt id="adventure" />
          </span>
          <span className="kid-place-label">{hasActiveTrail ? "Carry on" : "My trail"}</span>
        </button>

        {places.map((destination) => (
          <PlaceMarker
            key={destination.id}
            id={destination.id}
            childName={destination.place.childName}
            label={destination.place.childName}
            world={destination.place.world}
            x={destination.place.x}
            y={destination.place.y}
            size={destination.place.size}
            selected={open === destination.id}
            disabled={busy || paused}
            onSelect={select}
            onEnter={(id) => {
              stopReading();
              onGo(id);
            }}
          />
        ))}

        {paused && (
          <p className="kid-map-rest" role="status">
            Time for a rest. Everything you made is safe.
          </p>
        )}
        </section>
        </div>

        {/* The arrival strip: Nova on one side, who is playing on the other. Both belong
            to arriving rather than to the map, and keeping them out of the ground is what
            stops a speech bubble ever sitting on top of a landmark. */}
        <div className="kid-map-strip">
          <div className="kid-map-greeting">
            <SpeechBubble line={{ who: "nova", text: said || greeting }} tail="start" />
          </div>

          <div className="kid-map-adults">
            {/* The way through to Parent Corner. Deliberately small, deliberately
                word-only, and deliberately the one thing here written for an adult: a
                picture would invite the child it is not meant for. The PIN gate behind
                it is what actually protects the grown-up side. */}
            <button type="button" className="kid-grownups" onClick={onGrownUps}>
              Grown-ups
            </button>
          </div>

          {profiles.length > 1 && (
            <div className="kid-map-who">
              {profiles.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="kid-who"
                  aria-pressed={item.id === profile.id}
                  aria-label={item.name}
                  disabled={busy}
                  onClick={() => onSelectProfile(item.id)}
                >
                  <BuddyArt id={item.avatar} />
                  <span className="kid-who-name">{item.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </KidSurfaceProvider>
  );
}
