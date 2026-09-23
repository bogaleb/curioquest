"use client";

import { useState } from "react";
import { KidSurfaceProvider } from "@/components/kid";
import { GrownUpCoach } from "@/components/reading/GrownUpCoach";
import { LetterTrace } from "@/components/reading/LetterTrace";
import { SoundHunt } from "@/components/reading/SoundHunt";
import { SoundWarmup } from "@/components/reading/SoundWarmup";
import { DecodableReader } from "@/components/reading/DecodableReader";
import { defaultReadingCatalog as catalog } from "@/lib/reading/content";
import type { LearningBandId } from "@/lib/learning-bands";

/**
 * The co-play reading steps, in development only: warm-up, sound hunt, letter writing,
 * the grown-up's script and the shared reader. The real ones sit inside a reading
 * session, which needs a signed-in family; these take no data and write nothing.
 */
export function ReadingPreview({ band }: { band: LearningBandId }) {
  const [letter, setLetter] = useState(catalog.settings.sequence[0]);
  const skill = catalog.skills.find((s) => s.letter === letter)!;
  const story = catalog.stories[2];
  const [page, setPage] = useState(0);
  return (
    <KidSurfaceProvider value={{ band, narration: true, world: "grove" }}>
      <main className="reading-adventure kid-activity" data-kid-world="grove" data-band={band} style={{ padding: 16, display: "grid", gap: 32 }}>
        <label>Letter{" "}
          <select value={letter} onChange={(e) => setLetter(e.target.value as typeof letter)}>
            {catalog.settings.sequence.map((l) => <option key={l}>{l}</option>)}
          </select>
        </label>
        <section><SoundWarmup skills={catalog.skills.filter((s) => s.letter).slice(0, 4)} onDone={() => {}} /></section>
        <section><SoundHunt key={letter} skill={skill} seed={0} onDone={() => {}} /></section>
        <section><LetterTrace key={letter} letter={letter} band={band} onDone={() => {}} /></section>
        <section>
          <GrownUpCoach band={band} teaching activity={{ id: "a", kind: "letter-catch", skillId: skill.id, target: letter, choices: [], reason: "new", taught: true }} skill={skill} />
        </section>
        <section className="kid-activity-stage">
          <DecodableReader story={story} page={page} words={catalog.words} busy={false} onPage={() => setPage((p) => p + 1)} onAnswer={() => setPage(0)} onHelp={() => {}} />
        </section>
      </main>
    </KidSurfaceProvider>
  );
}
