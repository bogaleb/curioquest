"use client";

import { useMemo } from "react";
import {
  Award,
  BookOpen,
  Brain,
  Compass,
  Flag,
  Footprints,
  Globe,
  Heart,
  Lightbulb,
  Map as MapIcon,
  MessageCircle,
  Mountain,
  Palette,
  RotateCcw,
  Sparkles,
  Star,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import {
  categoryLabels,
  categoryOrder,
  evaluateAchievements,
  type AchievementState,
} from "@/lib/achievements";
import type { PublicExplorer } from "@/lib/explorer-view";

const icons: Record<string, LucideIcon> = {
  compass: Compass, map: MapIcon, footprints: Footprints, mountain: Mountain,
  sparkles: Sparkles, award: Award, trophy: Trophy, brain: Brain,
  rotate: RotateCcw, flag: Flag, heart: Heart, lightbulb: Lightbulb,
  globe: Globe, star: Star, message: MessageCircle, palette: Palette, book: BookOpen,
};

function AchievementCard({ state }: { state: AchievementState }) {
  const { achievement, earned, progress, fraction } = state;
  const Icon = icons[achievement.icon] ?? Star;
  return (
    <article
      className={`cq-trophy${earned ? " is-earned" : ""}`}
      data-tier={achievement.tier}
      aria-label={`${achievement.name}. ${earned ? "Earned." : `${progress} of ${achievement.target}.`}`}
    >
      <span className="cq-trophy-badge" aria-hidden="true">
        <Icon strokeWidth={1.7} />
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
      <header className="cq-chest-head">
        <div>
          <div className="eyebrow">Look how far you have come</div>
          <h1>Your treasure chest</h1>
          <p className="lead">Every discovery is something to be proud of.</p>
        </div>
        <div className="cq-chest-totals">
          <div className="cq-chest-stat">
            <Star size={28} fill="currentColor" aria-hidden="true" />
            <strong>{profile.stars}</strong>
            <small>stars</small>
          </div>
          <div className="cq-chest-stat">
            <Trophy size={28} aria-hidden="true" />
            <strong>
              {earned.length}
              <span className="cq-chest-of">/{states.length}</span>
            </strong>
            <small>awards</small>
          </div>
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
