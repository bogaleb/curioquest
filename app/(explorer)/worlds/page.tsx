"use client";
import { useEffect } from "react";
import { stopReading } from "@/lib/speech";
import { useRouter } from "next/navigation";
import { ArrowRight, Compass, Flag, Leaf, Lightbulb, Sparkles, Star, Volume2, Check } from "lucide-react";
import { StoryTrail } from "@/components/learning/garden-adventure";
import { useExplorer } from "@/components/app/explorer-context";
import { subjectRegistry } from "@/lib/subjects";
import { readAloud as speak } from "@/lib/speech";
import { BookOpen, Shapes, Mountain, FlaskConical, Globe, Heart } from "lucide-react";
import type { SkillSubject } from "@/lib/skill-graph";

const worldIcons: Record<string, typeof BookOpen> = {
  reading: BookOpen, math: Shapes, logic: Mountain,
  science: FlaskConical, world: Globe, wellbeing: Heart,
};
type World = { id: SkillSubject; name: string; skill: string; icon: typeof BookOpen; line: string };
const worlds: World[] = subjectRegistry.map((subject) => ({
  id: subject.id, name: subject.world, skill: subject.label,
  icon: worldIcons[subject.id], line: subject.older,
}));

const worldPrompts: Record<SkillSubject, string[]> = {
  reading: ["Hear a sound", "Build a word", "Find meaning"],
  math: ["Count a group", "Compare amounts", "Try a number puzzle"],
  logic: ["Spot a pattern", "Sort and match", "Plan your next move"],
  science: ["Make a prediction", "Notice a change", "Explain your idea"],
  world: ["Explore a place", "Meet a helper", "Make a connection"],
  wellbeing: ["Name a feeling", "Practice kindness", "Try a calming moment"],
};

export default function WorldsPage() {
  const router = useRouter();
  useEffect(() => () => stopReading(), []);
  const { profile, busy, start, action, openQuest } = useExplorer();
  if (!profile) return null;
  const today = profile.history.filter(
    (entry) => entry.date.slice(0, 10) === new Date().toISOString().slice(0, 10),
  ).length;
  const startCampaign = async () => { if (!busy) openQuest(await action({ action: "campaign-start" })); };

  return (
            <><div className="page-heading"><div><div className="eyebrow">FOLLOW YOUR CURIOSITY</div><h1>A world of possibilities.</h1><p>Pick a path. Make a discovery. Grow at your own pace.</p></div><div className="level-pill"><Sparkles size={19}/><span>Level {Math.floor(profile.completed / 3) + 1}<small>{profile.completed < 3 ? 'Curious Explorer' : 'Brave Explorer'}</small></span></div></div>
            <StoryTrail progress={profile.adventure} busy={busy || profile.preferences.paused} onStart={startCampaign} onGarden={() => router.push("/build")}/>
            <div className="content-grid"><div><div className="section-heading"><h2>Your learning worlds</h2></div><div className="worlds-grid">{worlds.map(w => <button key={w.id} disabled={busy || profile.preferences.paused} className="world-card" data-world={w.id} onClick={() => start(w.id)}><div className="world-top"><span className="world-symbol"><w.icon size={35} strokeWidth={1.6}/></span><span className="world-tag">{subjectRegistry.find(subject=>subject.id===w.id)?.eyebrow}</span></div><h3>{w.name}</h3><p>{w.line}</p><div className="learning-world-prompts">{worldPrompts[w.id].map(prompt => <span key={prompt}>{prompt}</span>)}</div><div className="world-progress"><span>Trail {profile.skills[w.id].level} of 3</span><ArrowRight size={18}/></div><div className="progress-track"><span style={{ width: `${profile.skills[w.id].seen ? Math.min(100, profile.skills[w.id].seen / 15 * 100) : 0}%` }}/></div></button>)}</div>
            <section className="journey"><div className="section-heading"><h2>Your explorer journey</h2><span>{profile.completed} quests complete</span></div><div className="journey-path">{[{ label: 'Get curious', n: 0, icon: Compass }, { label: 'Keep exploring', n: 3, icon: Leaf }, { label: 'Think bigger', n: 6, icon: Lightbulb }, { label: 'Shine bright', n: 9, icon: Star }].map((s, i) => <div className={`journey-stop ${profile.completed >= s.n ? 'reached' : ''}`} key={s.label}><span><s.icon size={23}/></span><strong>{s.label}</strong><small>{i === 0 ? 'Your journey begins' : `${s.n} quests`}</small></div>)}</div></section>
            <div className="future-worlds"><strong>Take your ideas somewhere new.</strong><p>Try a hands-on challenge in Build Yard, or explore the places in your world.</p><div className="world-hero-actions"><button className="secondary" onClick={() => router.push("/build")}>Visit Build Yard <ArrowRight size={18}/></button><button className="secondary" onClick={() => router.push("/world")}>Explore my world <ArrowRight size={18}/></button></div></div></div>
            <aside className="right-column"><section className="today-card"><div className="section-heading"><h3>A little progress</h3><span className="sun-icon">☀</span></div><p>Small steps add up.</p><div className="daily-progress"><span className="ring"><Check size={24}/></span><div><strong>{today > 0 ? 'You explored today!' : 'A fresh start'}</strong><span>{today > 0 ? `${today} quest${today === 1 ? '' : 's'} completed` : 'Your first discovery awaits'}</span></div></div><div className="today-footer"><span><Star size={17}/>{profile.stars} stars earned</span><span><Flag size={17}/>{profile.completed} quests</span></div></section><section className="nova-card"><div className="nova-card-title"><span>🦊</span><div><strong>A note from Nova</strong><small>YOUR FRIENDLY GUIDE</small></div></div><p>“You don’t have to know the answer yet. Let’s figure it out together!”</p><button className="text-button" onClick={() => speak('You don’t have to know the answer yet. Let’s figure it out together!')}><Volume2 size={17}/> Listen to Nova</button></section><div className="gentle-note"><Leaf size={17}/><span>No rush. No races.<br />Just your kind of adventure.</span></div></aside></div></>
  );
}
