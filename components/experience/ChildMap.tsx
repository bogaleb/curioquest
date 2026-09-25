"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BuddyArt } from "@/components/kid/BuddyArt";
import { PlaceArt } from "@/components/kid/PlaceArt";
import { PlaceMarker } from "@/components/kid/PlaceMarker";
import { SpeechBubble } from "@/components/kid/SpeechBubble";
import { KidSurfaceProvider } from "@/components/kid/surface";
import { Scene, ScenePlane } from "@/components/kid/art/Scene";
import {
  Bloom,
  Bush,
  FarCanopy,
  FarHills,
  ForeLeaves,
  GrassTuft,
  GroundBand,
  Rock,
  SkyWash,
  Tree,
} from "@/components/kid/art/backdrops";
import { TouchableCast } from "@/components/kid/art/touchable-cast";
import type { PublicExplorer } from "@/lib/explorer-view";
import { mapPlaces, destinationFor } from "@/lib/navigation";
import { audioSettings } from "@/lib/audio";
import { readAloud, stopReading } from "@/lib/speech";

/**
 * Arrival: the map that replaced the dashboard, now drawn as a place.
 *
 * The behaviour here is WP-03's and is deliberately untouched. The trail is still the
 * biggest thing on the screen and still one touch. Every landmark still sits at the fixed
 * coordinate `lib/navigation.ts` gives it, and nothing reorders by recency, progress or
 * recommendation — position is how a child remembers where things are. Touching a place
 * still says its name before committing, and the second touch still enters.
 *
 * What changed is everything underneath that. The map used to be two flat colour bands, a
 * CSS-ellipse sun and an arc for a ridge, with eleven destinations drawn as eleven
 * identical white circles. It is now a valley across the five depth planes of WP-11 §2.2:
 *
 *   sky     gradient, sun, drifting cloud
 *   far     hills, a distant treeline, and the six places that are further away
 *   mid     the ground, and the five near landmarks plus the trail
 *   near    planting the child's eye passes over on the way down to the trail
 *   fore    leaves at the very edge, which is what says the child is standing somewhere
 *   actors  Curio, above the scene and never inside it
 *
 * Two consequences worth naming, because both were bugs waiting in the old layout.
 *
 * **Curio is on the actors plane, inside the picture.** She used to be exiled to a strip
 * below the map so her speech bubble could never land on top of a landmark. The actors
 * plane neither parallaxes nor crops, so she can stand in the scene and still never be
 * covered by a tree — and the greeting is now spoken by someone who is *there*.
 *
 * **Parallax is driven from the scroll container, not from React state.** The map is
 * wider than a phone and is panned rather than reflowed; as it pans, the hills move less
 * than the grass. Re-rendering a dozen landmark buttons on every scroll event to move some
 * hills is not a trade worth making, so the scroll handler writes one custom property and
 * the stylesheet does the rest. `--scene-parallax` resolving to 0 under reduced motion
 * switches the whole thing off without this code knowing.
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
  const scroller = useRef<HTMLDivElement>(null);
  const paused = profile.preferences.paused;
  const places = mapPlaces({ faith: profile.controls.faith });
  const trail = destinationFor("adventure")!;
  const near = places.filter((place) => place.place.size === "large");
  const far = places.filter((place) => place.place.size === "small");

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

  // Parallax. One property, written at most once per frame, read by every plane.
  useEffect(() => {
    const element = scroller.current;
    if (!element) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const travel = element.scrollWidth - element.clientWidth;
      // -1 at the far left of the valley, 1 at the far right, 0 when there is nowhere
      // to pan — a desktop showing the whole map at once is not a scene that moves.
      const pan = travel > 0 ? (element.scrollLeft / travel) * 2 - 1 : 0;
      element.style.setProperty("--scene-pan", String(pan));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    element.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      element.removeEventListener("scroll", onScroll);
    };
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
        <div className="kid-map-scroll" ref={scroller}>
          <Scene world="grove" band={profile.band} className="kid-map" label="Your map">
            <ScenePlane plane="sky">
              <SkyWash />
            </ScenePlane>

            {/* The horizon, and the places that are further away. The six secondary
                destinations live here rather than in a rail: visibly there, reachable,
                and not competing with the five a child uses constantly. */}
            <ScenePlane plane="far">
              <FarHills />
              <span className="kid-map-treeline"><FarCanopy /></span>
            </ScenePlane>
            <ScenePlane plane="far" presentational={false} className="kid-map-far-places">
              {far.map((destination) => (
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
            </ScenePlane>

            {/* The ground, and the five places a child reaches constantly. */}
            <ScenePlane plane="mid">
              <GroundBand />
              <span className="kid-map-tree" data-at="1"><Tree tone="mid" /></span>
              <span className="kid-map-tree" data-at="2"><Tree tone="mid" /></span>
            </ScenePlane>
            <ScenePlane plane="mid" presentational={false} className="kid-map-near-places">
              {/* The trail. Larger than everything else, lowest on the screen, and a
                  single touch: the one control a child may use without learning the
                  two-touch rule first. */}
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

              {near.map((destination) => (
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
            </ScenePlane>

            {/* Planting the eye passes over on the way down to the trail. */}
            <ScenePlane plane="near">
              <span className="kid-map-bush" data-at="1"><Bush /></span>
              <span className="kid-map-bush" data-at="2"><Bush /></span>
              <span className="kid-map-rock"><Rock /></span>
              <span className="kid-map-grass" data-at="1"><GrassTuft /></span>
              <span className="kid-map-grass" data-at="2"><GrassTuft /></span>
              <span className="kid-map-grass" data-at="3"><GrassTuft /></span>
              <span className="kid-map-bloom" data-at="1"><Bloom tone="a" /></span>
              <span className="kid-map-bloom" data-at="2"><Bloom tone="b" /></span>
              <span className="kid-map-bloom" data-at="3"><Bloom tone="c" /></span>
            </ScenePlane>

            <ScenePlane plane="fore">
              <ForeLeaves />
            </ScenePlane>

            {/* Curio, in the picture rather than exiled below it. Tappable: the
                first hello of the day. */}
            <ScenePlane plane="actors">
              <span className="kid-map-nova">
                <TouchableCast who="curio" state={open ? "point" : "idle"} facing="left" label="Say hello to Curio" />
              </span>
            </ScenePlane>
          </Scene>
        </div>

        {paused && (
          <p className="kid-map-rest" role="status">
            Time for a rest. Everything you made is safe.
          </p>
        )}

        {/* The arrival strip: what Curio is saying, the way through to the grown-ups, and
            who is playing. It stays out of the panned ground so a speech bubble can never
            end up under a landmark, and so both adult-facing controls sit in one place. */}
        <div className="kid-map-strip">
          <div className="kid-map-greeting">
            <SpeechBubble line={{ who: "curio", text: said || greeting }} tail="start" />
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
