"use client";

import { useEffect, useState } from "react";
import { BookOpen, Check, Pause, Play, RotateCcw, Volume2, X } from "lucide-react";
import type { GameDesign } from "@/lib/game-design";
import { difficultyDots } from "@/lib/game-design";
import type { DeliveryProfile } from "@/lib/learning-bands";
import { readAloud, stopReading } from "@/lib/speech";
import { quietAudio, unlockAudio } from "@/lib/audio";

/**
 * The controls Wave 09 asks every game to have, and which none of them had.
 *
 * Three of them, because three is what a child will actually find: how to play, take a
 * break, start over. Exit and full screen already live in the player header, and sound
 * is a profile-level comfort setting rather than something a child should renegotiate
 * mid-mission.
 *
 * None of these is destructive on its own. Starting over confirms first, and says what
 * it will and will not affect, because a child who has answered three of four
 * discoveries deserves to know which is which.
 */

/** Read the goal and steps in one pass, so narration is not a stream of fragments. */
function narration(design: GameDesign, title: string) {
  return `How to play ${title}. ${design.goal} ${design.howToPlay.join(" ")}`;
}

export function GameControls({
  design,
  title,
  delivery,
  busy,
  onRestart,
  onExit,
}: {
  design: GameDesign;
  title: string;
  delivery: DeliveryProfile;
  busy: boolean;
  onRestart: () => void;
  onExit: () => void;
}) {
  const [panel, setPanel] = useState<"none" | "how" | "paused" | "restart">("none");

  return (
    <>
      <div className="game-controls" role="group" aria-label="Game controls">
        <button type="button" className="game-control" onClick={() => setPanel("how")}>
          <BookOpen size={18} />How to play
        </button>
        <button type="button" className="game-control" onClick={() => setPanel("paused")}>
          <Pause size={18} />Take a break
        </button>
        <button type="button" className="game-control" disabled={busy} onClick={() => setPanel("restart")}>
          <RotateCcw size={18} />Start over
        </button>
      </div>

      {panel === "how" && (
        <HowToPlay design={design} title={title} delivery={delivery} onClose={() => setPanel("none")} />
      )}
      {panel === "paused" && <BreakScreen onResume={() => setPanel("none")} onExit={onExit} />}
      {panel === "restart" && (
        <ConfirmRestart
          busy={busy}
          onCancel={() => setPanel("none")}
          onConfirm={() => {
            setPanel("none");
            onRestart();
          }}
        />
      )}
    </>
  );
}

/**
 * Instructions, on demand and repeatable.
 *
 * Wave 09 lists "replay instructions" separately from "instructions" for a reason: a
 * child who missed them the first time has no way back to them in most children's
 * software, and asking a grown-up is the only route. This can be opened at any point in
 * a mission without losing the current discovery.
 */
function HowToPlay({
  design,
  title,
  delivery,
  onClose,
}: {
  design: GameDesign;
  title: string;
  delivery: DeliveryProfile;
  onClose: () => void;
}) {
  // A child who cannot read the steps is read them without having to ask. Bands that
  // read independently are not interrupted by unexpected speech.
  useEffect(() => {
    if (delivery.autoNarrate) readAloud(narration(design, title));
    return () => stopReading();
  }, [delivery.autoNarrate, design, title]);

  return (
    <div className="game-sheet" role="dialog" aria-modal="true" aria-labelledby="how-to-play-title">
      <section className="game-sheet-card">
        <button className="close" aria-label="Close" onClick={onClose}><X /></button>
        
        <h2 id="how-to-play-title">{title}</h2>
        <p className="game-goal">{design.goal}</p>
        <ol className="how-to-play">
          {design.howToPlay.map((step, index) => (
            <li key={step}><span aria-hidden="true">{index + 1}</span>{step}</li>
          ))}
        </ol>
        <div className="game-sheet-actions">
          <button className="secondary" onClick={() => readAloud(narration(design, title))}>
            <Volume2 size={18} />Read it to me
          </button>
          <button className="primary" onClick={onClose}><Check size={18} />Got it</button>
        </div>
      </section>
    </div>
  );
}

/**
 * A break.
 *
 * The screen is covered on purpose. A paused game that still shows the question invites
 * a child to keep working at it, and a child who asked for a break has already told us
 * they want to stop. Sound stops with it; nothing is lost, because the session is saved
 * on the server after every answer rather than held in this component.
 */
function BreakScreen({ onResume, onExit }: { onResume: () => void; onExit: () => void }) {
  useEffect(() => {
    quietAudio();
    stopReading();
  }, []);

  return (
    <div className="game-break" role="dialog" aria-modal="true" aria-labelledby="break-title">
      <section>
        <span aria-hidden="true">🌿</span>
        <h2 id="break-title">Taking a break</h2>
        <p>Your discoveries are saved. Stretch, get a drink, and come back whenever you like.</p>
        <div className="game-sheet-actions">
          <button
            className="primary"
            onClick={() => {
              void unlockAudio();
              onResume();
            }}
          >
            <Play size={18} />Keep playing
          </button>
          <button className="secondary" onClick={onExit}>Finish for now</button>
        </div>
      </section>
    </div>
  );
}

/**
 * Starting over is the one control here that throws work away, so it says exactly what
 * it throws away. `window.confirm` was deliberately not used: it is unreadable to a
 * pre-reader and the product has been moving away from it.
 */
function ConfirmRestart({
  busy,
  onCancel,
  onConfirm,
}: {
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="game-sheet" role="dialog" aria-modal="true" aria-labelledby="restart-title">
      <section className="game-sheet-card">
        
        <h2 id="restart-title">Play this mission again from the start?</h2>
        <p>
          You will go back to the first discovery. The stars you have already earned stay
          yours, and so does everything you have practised.
        </p>
        <div className="game-sheet-actions">
          <button className="secondary" onClick={onCancel}>Keep going</button>
          <button className="primary" disabled={busy} onClick={onConfirm}>
            <RotateCcw size={18} />Start over
          </button>
        </div>
      </section>
    </div>
  );
}

/** Difficulty as dots a child can count, with the reading of it kept for screen readers. */
export function DifficultyDots({ difficulty, label }: { difficulty: number; label: string }) {
  const filled = difficultyDots(difficulty);
  return (
    <span className="difficulty-dots" title={label}>
      <span className="cq-sr-only">Difficulty: {label}</span>
      {[1, 2, 3].map((dot) => (
        <span key={dot} aria-hidden="true" className={dot <= filled ? "on" : ""} />
      ))}
    </span>
  );
}
