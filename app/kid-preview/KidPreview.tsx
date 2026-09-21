"use client";

import { useState } from "react";
import {
  KidButton,
  KidCard,
  ObjectSlot,
  Placeholder,
  ProgressTrail,
  SceneLayer,
  SpeechBubble,
  type KidWorld,
} from "@/components/kid";
import { learningBands, type LearningBandId } from "@/lib/learning-bands";
import { ChildMap } from "@/components/experience/ChildMap";
import { sampleExplorer } from "./sample";
import { TeachingMoveView } from "@/components/learning/teaching-move";

/**
 * Every primitive, in one scene, with the two switches that break child screens most often:
 * the band (which moves every touch target and type size) and narration (which decides
 * whether a "say it again" control is worth showing).
 *
 * The chrome around the scene is deliberately plain. It is a development tool for adults, so
 * it uses ordinary controls and ordinary labels — nothing here is an example of child copy.
 */
export function KidPreview({
  band,
  world,
  screen,
}: {
  band: LearningBandId;
  world: KidWorld;
  /** "parts" shows every primitive, "map" the arrival screen, "moves" the WP-04 panels. */
  screen: "parts" | "map" | "moves";
}) {
  const [narration, setNarration] = useState(true);
  const [chosen, setChosen] = useState<string | null>(null);
  const [placed, setPlaced] = useState(false);

  if (screen === "map") {
    // The real arrival screen, with a made-up child. Rendered on its own so the map can be
    // measured at each viewport without a signed-in family.
    const child = sampleExplorer(band);
    const sibling = { ...sampleExplorer(band, "Sam"), id: "preview-sibling", avatar: "owl" as const };
    return (
      <ChildMap
        profile={child}
        profiles={[child, sibling]}
        busy={false}
        hasActiveTrail={false}
        onSelectProfile={() => {}}
        onGo={() => {}}
        onTrail={() => {}}
        onGrownUps={() => {}}
      />
    );
  }

  if (screen === "moves") {
    // Every teaching move at once, which is the only way to see that they really are
    // different things to do rather than differently worded versions of one thing.
    const cases = [
      { label: "confusable-visual", feedback: { move: "compare", compare: { chosen: "w", answer: "m" }, message: "These two look alike. Look again." } },
      { label: "confusable-sound", feedback: { move: "relisten", listen: "m", message: "Those sounds are close. Listen again." } },
      { label: "letter-name-for-sound", feedback: { move: "sound-not-name", listen: "m", message: "That is its name. We want its sound." } },
      { label: "off-by-one", feedback: { move: "recount", count: 7, message: "So close — one out. Count it again." } },
      { label: "guess", feedback: { move: "settle", pause: true, message: "No rush. Take a good look first." } },
      { label: "not-yet-taught", feedback: { move: "step-back", steppedBack: true, message: "This one is new. Let's try something first." } },
    ];
    return (
      <main className="kid-shell" data-band={band} data-kid-world={world} style={{ padding: 16 }}>
        {cases.map((item) => (
          <section key={item.label} style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 16 }}>{item.label}</h2>
            <p>{item.feedback.message}</p>
            <TeachingMoveView feedback={{ correct: false, ...item.feedback } as never} />
          </section>
        ))}
      </main>
    );
  }

  return (
    <main style={{ padding: 16 }}>
      <nav aria-label="Preview settings" style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        {learningBands.map((option) => (
          <a
            key={option.id}
            href={`/kid-preview?band=${option.id}&world=${world}&screen=${screen}`}
            aria-current={option.id === band ? "page" : undefined}
            style={{ textDecoration: option.id === band ? "underline" : "none" }}
          >
            {option.label}
          </a>
        ))}
        <label>
          <input type="checkbox" checked={narration} onChange={(event) => setNarration(event.target.checked)} />{" "}
          narration
        </label>
      </nav>

      <SceneLayer
        world={world}
        band={band}
        narration={narration}
        inset
        labelledBy="preview-heading"
        exit={<KidButton label="Back" tone="quiet" art={<Placeholder />} showLabel={false} onPress={() => {}} />}
        actions={
          <>
            <KidButton
              label="Let's go"
              tone="sun"
              size="primary"
              art={<Placeholder />}
              onPress={() => setPlaced((was) => !was)}
            />
            <KidButton label="Say it again" tone="quiet" onPress={() => {}} />
          </>
        }
      >
        <h1 id="preview-heading" className="kid-sr-only">
          Child component layer preview
        </h1>

        <ProgressTrail total={6} done={2} />

        <SpeechBubble line={{ who: "nova", text: "Find the sound at the start." }} onReplay={() => {}} />

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
          {["m", "s", "a"].map((letter) => (
            <KidButton
              key={letter}
              label={letter}
              shape="tile"
              pressed={chosen === letter}
              state={chosen === letter ? (letter === "m" ? "right" : "not-yet") : "idle"}
              onPress={() => setChosen(letter)}
            />
          ))}
        </div>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
          <KidCard title="Reading Grove" caption="Where the sounds live" onPress={() => {}} />
          <KidCard title="Number City" onPress={() => {}} pressed />
          <KidCard title="Just a card" />
        </div>

        <div style={{ display: "flex", gap: 16 }}>
          <ObjectSlot
            name={placed ? "A smooth stone on the shelf" : "An empty shelf"}
            caption="shelf"
            art={placed ? <Placeholder /> : undefined}
            ready={!placed}
            onPress={() => setPlaced((was) => !was)}
          />
          <ObjectSlot name="An empty desk" caption="desk" />
        </div>
      </SceneLayer>
    </main>
  );
}
