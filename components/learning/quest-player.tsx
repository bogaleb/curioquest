"use client";
import { ArrowRight, Lightbulb, Maximize2, Minimize2 } from "lucide-react";
import { ActivityEngineView } from "./activity-engine";
import { TeachingMoveView } from "./teaching-move";
import { StoryPage } from "./arcade-engines";
import { campaignChapters } from "@/lib/campaign";
import { gameById } from "@/lib/arcade";
import { readAloud } from "@/lib/speech";
import { resolveBand } from "@/lib/learning-bands";
import { missionRank, missionStars, readArc, roundPosition } from "@/lib/game-loop";
import { useImmersive } from "@/hooks/use-immersive";
import { useEffect, useState } from "react";
import { celebrate } from "@/lib/audio";
import { Celebration } from "@/components/kid/art/Celebration";
import { CastFigure } from "@/components/kid/art/cast";
import { Scene, ScenePlane } from "@/components/kid/art/Scene";
import { FarHills, GroundBand, SkyWash } from "@/components/kid/art/backdrops";
import { DoorMark, Placeholder } from "@/components/kid/Placeholder";
import { ProgressTrail } from "@/components/kid/ProgressTrail";
import { SpeechBubble } from "@/components/kid/SpeechBubble";
import { KidSurfaceProvider } from "@/components/kid/surface";
import { worldForSubject } from "@/lib/kid-worlds";
import type { PublicExplorer, QuestFeedback } from "@/lib/explorer-view";
import type { PublicQuestion } from "@/lib/activity-types";
import { GameControls } from "./game-controls";
import { gameDesign } from "@/lib/game-design";

export function activityNarration(question: PublicQuestion) {
  const story = question.passage ? `${question.passage.title}. ${question.passage.text}. ` : "";
  return (
    story +
    question.prompt +
    (question.audioLabel ? `. The word is ${question.audioLabel}.` : "") +
    (question.options.length ? `. Your choices are: ${question.options.join(", ")}` : "")
  );
}

/**
 * The activity: the screen every session is actually spent on.
 *
 * It was the least designed thing in the product. Until this change it was styled by
 * `.activity` in `app/globals.css` — one minified line, raw hex colours, 12 and 13px
 * labels, an ALL-CAPS category kicker, and a grey slab behind the letter a child was
 * trying to read. Everything around it had been through a design pass; the screen at the
 * centre had not.
 *
 * ## What this changes
 *
 * The work now happens inside the world it belongs to. The scene behind is the same five
 * planes as the map, dimmed and pushed back, so answering a reading question happens in
 * the grove rather than on a white page — and the hue tells a pre-reader where they are
 * before they can read where they are.
 *
 * The prompt moved into Nova's speech bubble, and she is on screen saying it. It used to
 * be an `<h1>` above a "Read it to me" button, which is a document; a character asking you
 * something is a lesson.
 *
 * Three things were removed from the child's view rather than restyled, because they were
 * written for an adult (§C5):
 *
 *   - the ALL-CAPS world kicker;
 *   - `We are practising: <skill name>` — "skill" is system vocabulary, and a child who is
 *     about to try something does not need to be told what it is called;
 *   - the round counter and the star pill. Progress is the trail; stars demote to a minor
 *     currency and leave every child surface but the chest (§D9).
 *
 * All of it still exists for the grown-ups, on the parent weekly, which is where a sentence
 * about what a child is practising is actually useful.
 *
 * ## What this deliberately does not change
 *
 * The sixteen engines under `ActivityEngineView` are the strongest existing work in the
 * repo and they keep their mechanics exactly. They are restyled from the outside — the
 * answer buttons become physical objects that give under a press — and not rewritten.
 *
 * Nothing about scoring, evidence, the recommender or `learning_event` recording is touched
 * by this file. It moves pixels.
 */
export function QuestPlayer({
  profile, current, feedback, selected, busy, error,
  onBack, onAnswer, onHint, onNext, onReflect, onFeeling, onFinish, onRestart,
}: {
  profile: PublicExplorer; current: PublicQuestion | null; feedback: QuestFeedback;
  selected: string; busy: boolean; error: string;
  onBack: () => void; onAnswer: (value: string) => void; onHint: () => Promise<unknown>;
  onNext: () => void; onReflect: (strategy: string) => void; onFeeling: (value: string) => void;
  onFinish: () => void; onRestart: () => void;
}) {
  const session = profile.session;
  const band = resolveBand(profile.band);
  const delivery = band.delivery;
  // The player is already a fixed overlay; this additionally hands the activity the
  // whole display where the browser allows it, hiding tabs and the address bar.
  const { ref: stageRef, active: full, toggle: toggleFull } = useImmersive();
  useEffect(() => {
    if (feedback?.correct) celebrate(session?.index === session?.total);
  }, [feedback?.correct, session?.index, session?.total]);

  // Nova offers help after a band-sized pause. She never takes the hint for the child:
  // an unrequested hint would understate how independently they are working.
  const questionId = current?.id;
  const answered = !!feedback?.correct;
  // Recording *which* question stalled means moving on clears the offer by itself,
  // with no reset write on every question change.
  const [stalledOn, setStalledOn] = useState<string | null>(null);
  useEffect(() => {
    if (!questionId || answered || !delivery.hintAfterSeconds) return;
    const timer = setTimeout(() => setStalledOn(questionId), delivery.hintAfterSeconds * 1000);
    return () => clearTimeout(timer);
  }, [questionId, answered, delivery.hintAfterSeconds]);
  const stalled = !answered && !!questionId && stalledOn === questionId;

  if (!session) return null;

  const game = gameById(session.gameId);
  const chapter = session.chapter !== undefined ? campaignChapters[session.chapter] : undefined;
  const position = Math.min(session.index + (feedback?.correct ? 0 : 1), session.total);
  const place = game ? roundPosition(position - 1, session.total, band) : null;
  const arc = game ? readArc(session.arc) : null;
  const rank = arc ? missionRank(arc, session.total) : null;
  const title =
    game?.title ??
    (session.discovery ? "Meet Nova" : session.teamId ? "Garden Rescue Team" : chapter?.title ?? "Your trail");
  const world = worldForSubject(current?.subject ?? session.subject);
  // Nova reacts to what just happened. She never performs disappointment: a wrong answer
  // makes her lean in and explain, which is the move that actually follows.
  const novaState = feedback?.correct ? "celebrate" : feedback?.message ? "explain" : stalled ? "encourage" : "idle";

  return (
    <KidSurfaceProvider value={{ band: profile.band, narration: profile.controls.audio.narration, world }}>
      <div
        ref={stageRef}
        className={`kid-activity ${game ? `game-player game-${game.id}` : ""}`}
        data-kid-world={world}
        data-band={profile.band}
        data-fullscreen={full}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* The world, behind the work. Dimmed by `.kid-activity-veil` rather than drawn
            pale, so the scene keeps its own colours and the contrast of everything in
            front of it is a single known quantity instead of thirteen guesses. */}
        <Scene world={world} band={profile.band} className="kid-activity-scene" label="">
          <ScenePlane plane="sky"><SkyWash /></ScenePlane>
          <ScenePlane plane="far"><FarHills /></ScenePlane>
          <ScenePlane plane="mid"><GroundBand /></ScenePlane>
        </Scene>
        <div className="kid-activity-veil" aria-hidden="true" />

        <div className="kid-activity-frame">
          <header className="kid-activity-top">
            {/* One drawn door out, top-start, far from where the answering hand rests. */}
            <button
              type="button"
              className="kid-activity-door"
              disabled={busy}
              aria-label={game ? "Back to the games" : "Save and take a break"}
              onClick={onBack}
            >
              <DoorMark />
            </button>
            <ProgressTrail total={session.total} done={session.index} label="Your trail" />
            <button
              type="button"
              className="kid-activity-full"
              aria-pressed={full}
              aria-label={full ? "Leave full screen" : "Play in full screen"}
              onClick={toggleFull}
            >
              {full ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
          </header>

          {error && (
            <div className="error" role="alert">
              {error}
              <button disabled={busy} onClick={onBack}>Return to my adventure</button>
            </div>
          )}

          {current ? (
            <>
              <div className="kid-activity-stage">
                {game && <div className="game-mission-label">{game.missions[session.gameLevel ?? 0]}</div>}
                {game && (
                  <GameControls
                    design={gameDesign(game.id)}
                    title={game.title}
                    delivery={delivery}
                    busy={busy}
                    onRestart={onRestart}
                    onExit={onBack}
                  />
                )}
                {current.passage && <StoryPage passage={current.passage} />}

                {/* The question, asked by someone. */}
                <div className="kid-activity-ask">
                  <span className="kid-activity-nova">
                    <CastFigure who="nova" state={novaState} />
                  </span>
                  <SpeechBubble
                    line={{ who: "nova", text: current.prompt }}
                    tail="start"
                    onReplay={() => readAloud(activityNarration(current))}
                  />
                </div>

                <ActivityEngineView
                  key={session.id + current.id}
                  question={current}
                  busy={busy}
                  correct={!!feedback?.correct}
                  selected={selected}
                  onAnswer={onAnswer}
                  onHint={onHint}
                />
              </div>

              {/* The reach zone: what just happened, and the one thing to do next. */}
              <div className="kid-activity-reach">
                <div
                  className={`kid-activity-said ${feedback?.correct ? "positive" : ""} ${feedback?.assisted ? "assisted" : ""}`}
                  aria-live="polite"
                >
                  <p className="kid-activity-said-line">
                    {feedback?.message || feedback?.hint || "Take your time. You can try, think, and try again."}
                  </p>
                  {feedback?.hint && feedback.message && <p className="kid-activity-said-line">{feedback.hint}</p>}
                  <TeachingMoveView feedback={feedback} />
                </div>

                {feedback?.correct && place?.roundEnd && (
                  <div className="round-break-note">
                    {place.rounds - place.round === 1 ? "One more round to go." : `${place.rounds - place.round} rounds to go.`}
                  </div>
                )}

                {feedback?.correct && (
                  <div className="reflection-prompt">
                    <p>What helped you?</p>
                    {[["counted", "I counted"], ["clue", "I found a clue"], ["pattern", "I saw a pattern"], ["tried", "I tried another way"]].map(
                      ([strategy, label]) => (
                        <button
                          key={strategy}
                          disabled={busy}
                          aria-pressed={profile.reflections.some(
                            (r) => r.sessionId === session.id && r.questionId === current.id && r.strategy === strategy,
                          )}
                          onClick={() => onReflect(strategy)}
                        >
                          {label}
                        </button>
                      ),
                    )}
                  </div>
                )}

                <div className="kid-activity-actions">
                  {feedback?.correct ? (
                    <button className="primary" disabled={busy} onClick={onNext}>
                      {session.index === session.total ? "Finish my trail" : "Next one"}
                      <ArrowRight size={20} />
                    </button>
                  ) : (
                    <button
                      className={stalled ? "secondary nova-offer" : "text-button"}
                      disabled={busy}
                      onClick={onHint}
                    >
                      <Lightbulb size={19} />
                      {stalled ? "Nova can help with this one" : "Give me a hint"}
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* Finished. One choreographed sequence, four beats, then silence — and the
               reward is a drawn object rather than a trophy glyph and a star count. */
            <div className="kid-activity-done">
              <Celebration
                object={<Placeholder label={game ? "Your mission badge" : "Something you found"} />}
                name={`Well done, ${profile.name}!`}
                who="nova"
              />
              <p className="kid-activity-done-line">
                {game
                  ? game.missions[session.gameLevel ?? 0]
                  : chapter?.ending ?? "You thought, tried, and kept going."}
              </p>
              {chapter && <p className="chapter-unlock">You found: {chapter.unlock}</p>}
              {rank && arc && (
                <div className="mission-rank">
                  <strong>{rank.label}</strong>
                  <span>{rank.note}</span>
                </div>
              )}
              <span className="kid-activity-stars">
                +{arc ? missionStars(arc, session.total) : session.total * 2} stars
              </span>

              <div className="quest-feelings">
                <p>How did that feel?</p>
                {[["easy", "Easy"], ["right", "Just right"], ["tricky", "Tricky"]].map(([value, label]) => (
                  <button
                    key={value}
                    disabled={busy}
                    aria-pressed={profile.adventure.feelings.some((f) => f.sessionId === session.id && f.value === value)}
                    onClick={() => onFeeling(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <button className="primary" disabled={busy} onClick={onFinish}>
                {game ? "Back to the games" : session.teamId ? "Back to our team" : chapter ? "Visit my garden" : "Back to the map"}
                <ArrowRight size={19} />
              </button>
            </div>
          )}
        </div>
      </div>
    </KidSurfaceProvider>
  );
}
