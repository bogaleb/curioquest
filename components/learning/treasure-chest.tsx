"use client";

import { useMemo } from "react";
import { AwardMark, TreasureChestArt } from "@/components/kid/art/awards";
import {
  categoryLabels,
  categoryOrder,
  evaluateAchievements,
  type AchievementState,
} from "@/lib/achievements";
import type { PublicExplorer } from "@/lib/explorer-view";

function AchievementCard({ state }: { state: AchievementState }) {
  const { achievement, earned, progress, fraction } = state;
  return (
    <article
      className={`cq-trophy${earned ? " is-earned" : ""}`}
      data-tier={achievement.tier}
      aria-label={`${achievement.name}. ${earned ? "Earned." : `${progress} of ${achievement.target}.`}`}
    >
      <span className="cq-trophy-badge" aria-hidden="true">
        <AwardMark icon={achievement.icon} />
      </span>
      <h3>{achievement.name}</h3>
      <p>{earned ? achievement.earnedText : achievement.questText}</p>
      {!earned && (
        <div className="cq-trophy-progress">
          <div className="progress-track">
            <span style={{ width: `${Math.round(fraction * 100)}%` }} />
          </div>
          <small>
            {progress} of {achievement.target}
          </small>
        </div>
      )}
    </article>
  );
}

/**
 * The Treasure Chest.
 *
 * Shows what a child has earned and, for everything still locked, exactly what the
 * next step is. Locked achievements describe a path ("Finish five quests") rather than
 * a shortfall, and nothing here is earned by simply showing up.
 */
export function TreasureChest({
  profile,
  onNavigate,
}: {
  profile: PublicExplorer;
  onNavigate: (view: string) => void;
}) {
  const states = useMemo(() => evaluateAchievements(profile), [profile]);
  const earned = states.filter((state) => state.earned);
  const nextUp = states
    .filter((state) => !state.earned && state.progress > 0)
    .sort((left, right) => right.fraction - left.fraction)
    .slice(0, 2);

  return (
    <div className="cq-chest">
      {/*
        The chest, open, with its own light coming out of it.

        It replaces a kicker, a heading and a sentence — three lines of text telling a
        child what this place is, which is the job a picture does better and faster. The
        two stat tiles go with them: a Lucide star beside a number and a Lucide trophy
        beside "3/17" is a dashboard, and this is the one surface where stars are still
        allowed to appear at all (§D9).
      */}
      <header className="cq-chest-head">
        <span className="kid-chest-mark"><TreasureChestArt /></span>
        <div>
          <h1>Your treasure chest</h1>
          <p className="lead">
            {earned.length ? `${earned.length} of ${states.length} found.` : "Nothing in here yet."}
            {" "}
            {profile.stars} stars.
          </p>
        </div>
      </header>

      {nextUp.length > 0 && (
        <section className="cq-chest-next" aria-label="Almost earned">
          <h2>Almost there</h2>
          <div className="cq-chest-next-grid">
            {nextUp.map((state) => (
              <AchievementCard key={state.achievement.id} state={state} />
            ))}
          </div>
        </section>
      )}

      {categoryOrder.map((category) => {
        const group = states.filter((state) => state.achievement.category === category);
        if (!group.length) return null;
        const got = group.filter((state) => state.earned).length;
        return (
          <section key={category} className="cq-chest-group" aria-labelledby={`chest-${category}`}>
            <div className="cq-chest-group-head">
              <div>
                <h2 id={`chest-${category}`}>{categoryLabels[category].title}</h2>
                <p>{categoryLabels[category].blurb}</p>
              </div>
              <span className="cq-chest-count">
                {got} of {group.length}
              </span>
            </div>
            <div className="cq-trophy-grid">
              {group.map((state) => (
                <AchievementCard key={state.achievement.id} state={state} />
              ))}
            </div>
          </section>
        );
      })}

      <button className="primary cq-chest-back" onClick={() => onNavigate("adventure")}>
        Back to my adventure
      </button>
    </div>
  );
}
