"use client";
import { useState } from "react";
import { Check, Plus, Users } from "lucide-react";
import { ComfortSettings } from "@/components/learning/comfort-settings";
import { ParentBuilder } from "@/components/learning/parent-builder";
import { ParentControls } from "@/components/learning/parent-controls";
import { ParentEvidence } from "@/components/learning/parent-evidence";
import { ParentExperience } from "@/components/experience/ParentExperience";
import { ParentReadingProgress } from "@/components/reading/ParentReadingProgress";
import { ParentReports } from "@/components/learning/parent-reports";
import { CreativeStudio } from "@/components/learning/creative-studio";
import { useExplorer } from "@/components/app/explorer-context";
import { AVATARS, INTERESTS, avatarEmoji } from "@/lib/explorers";
import { learningBands, primaryContentBand, resolveBand } from "@/lib/learning-bands";
import { subjectRegistry, worldName } from "@/lib/subjects";
import { activityCount } from "@/lib/curriculum";
import { arcadeGames } from "@/lib/arcade";
import { BookOpen, Shapes, Mountain, FlaskConical, Globe, Heart } from "lucide-react";

const worldIcons: Record<string, typeof BookOpen> = {
  reading: BookOpen, math: Shapes, logic: Mountain,
  science: FlaskConical, world: Globe, wellbeing: Heart,
};
const worlds = subjectRegistry.map((subject) => ({
  id: subject.id, name: subject.world, icon: worldIcons[subject.id],
}));

/**
 * Parent Corner.
 *
 * The route exists, but renders nothing until the gate has been passed in this
 * session — a route being reachable is not the same as it being open, and this one
 * must never be link-shareable.
 */
export default function ParentPage() {
  const {
    profile, profiles, busy, action, parentOpen,
    setAddingProfile, selectProfile, setError, setStudioDirty, bumpAssignments, setProfiles,
  } = useExplorer();
  const [saved, setSaved] = useState(false);
  if (!profile) return null;
  if (!parentOpen) {
    return (
      <section className="panel">
        <h1>Parent corner is locked</h1>
        <p>Open it with your parent PIN from the menu to see settings and progress.</p>
      </section>
    );
  }
  return (
    <>
      <div className="parent-expansion"><header><span className="eyebrow">YOUR FAMILY’S CONTROL CENTER</span><h1>Guide their next discovery.</h1><p>Manage learning, make a personal quest, and keep their creations.</p></header><ParentReports key={profile.id + ':reports'} profile={profile}/><ParentExperience key={profile.id + ':experience'} profileId={profile.id} onStars={stars=>setProfiles(ps=>ps.map(x=>x.id===profile.id?{...x,stars}:x))}/><ParentReadingProgress key={profile.id + ':reading'} profileId={profile.id} name={profile.name}/><ParentControls key={profile.id + ':controls'} profile={profile} busy={busy} onAction={action}/><details className="panel"><summary>Parent Activity Builder & assignments</summary><ParentBuilder key={profile.id} profile={profile} onAssigned={bumpAssignments}/></details><details className="panel"><summary>Artwork portfolio</summary><CreativeStudio key={profile.id + ':parent'} profileId={profile.id} name={profile.name} paused={false} parent onDirtyChange={setStudioDirty}/></details></div>
      <ComfortSettings key={profile.id} preferences={profile.preferences} busy={busy} onSave={async preferences=>!!(await action({action:'preferences',...preferences}))}/>
      <><div className="eyebrow">SUPPORT THEIR NEXT SMALL STEP</div><h1>Parent corner</h1><p className="lead">A clear view of {profile.name}’s practice, without pressure.</p><ParentEvidence profile={profile} busy={busy} onConfirm={async () => !!(await action({ action: 'offline-confirm' }))}/><div className="parent-grid"><section className="panel profile-panel"><div className="panel-title"><div><h2>Explorer profile</h2><p>Personalize the adventure without collecting sensitive details.</p></div><span className="profile-avatar">{avatarEmoji(profile.avatar)}</span></div><form key={profile.id} onSubmit={async (e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); const d = await action({ action: 'profile', name: fd.get('name'), band: fd.get('band'), grade: primaryContentBand(resolveBand(fd.get('band')).id), avatar: fd.get('avatar'), dailyGoal: Number(fd.get('dailyGoal')), interests: fd.getAll('interests') }); if (d)
            setSaved(true); }}><div className="form-two"><label>Explorer name<input name="name" defaultValue={profile.name} required maxLength={24}/></label><label>Learning band<select name="band" defaultValue={profile.band}>{learningBands.map(b=><option key={b.id} value={b.id}>{b.label} · {b.ageLabel}</option>)}</select></label></div><fieldset><legend>Choose a quest buddy</legend><div className="avatar-options">{AVATARS.map(a => <label key={a.id} title={a.label}><input type="radio" name="avatar" value={a.id} defaultChecked={profile.avatar === a.id}/><span aria-hidden="true">{a.emoji}</span><small>{a.label.split(' ')[1]}</small></label>)}</div></fieldset><fieldset><legend>Favorite things <small>Choose up to 3</small></legend><div className="interest-options">{INTERESTS.map(i => <label key={i.id}><input type="checkbox" name="interests" value={i.id} defaultChecked={profile.interests?.includes(i.id)}/><span>{i.emoji} {i.label}</span></label>)}</div></fieldset><label>Daily adventure length<select name="dailyGoal" defaultValue={profile.dailyGoal || 10}><option value="8">About 8 minutes</option><option value="10">About 10 minutes</option><option value="15">About 15 minutes</option><option value="20">About 20 minutes</option></select></label><p className="form-note">Changing bands adjusts the starting trails, the reading load, and how much is read aloud. Skill evidence, earned stars, and quest history stay.</p><button className="primary" disabled={busy}>Save profile <Check size={17}/></button>{saved && <p role="status" className="success">Profile saved.</p>}</form></section><section className="panel family-panel"><div className="panel-title"><div><h2>Your explorers</h2><p>{profiles.length} of 4 family profiles</p></div><Users size={25}/></div><div className="family-list">{profiles.map(item => <button key={item.id} disabled={busy} className={item.id === profile.id ? 'active' : ''} onClick={() => selectProfile(item.id)}><span className="avatar">{avatarEmoji(item.avatar)}</span><span><strong>{item.name}</strong><small>{resolveBand(item.band).label} · {item.completed} quests</small></span>{item.id === profile.id && <Check size={18}/>}</button>)}</div><button className="secondary" disabled={profiles.length >= 4} onClick={() => { setError(""); setAddingProfile(true); }}><Plus size={18}/> Add an explorer</button>{profiles.length >= 4 && <p className="form-note">This edition supports up to four explorer profiles.</p>}</section><section className="panel"><h2>Learning snapshot</h2>{worlds.map(w => { const s = profile.skills[w.id]; return <div key={w.id} className="skill-row"><w.icon size={21}/><div><strong>{w.name}</strong><small>{s.seen} activities practiced · Trail {s.level}</small></div><b>{s.seen ? Math.round(s.first / s.seen * 100) + '%' : '—'}</b></div>; })}<p className="form-note">Percentages show correct answers on the first try without hints. These are practice signals, not mastery scores or an assessment.</p></section><section className="panel"><h2>Recent adventures</h2>{profile.history.length ? profile.history.slice(0, 6).map((h, i) => <div className="history-row" key={i}><span><strong>{worldName(h.subject)}</strong><small>{new Date(h.date).toLocaleDateString()}</small></span><span>{h.first}/{h.total || 5} independently</span></div>) : <p>Your child’s completed quests will appear here.</p>}</section><section className="panel"><h2>Make room for wonder</h2><p>After a short quest, ask: “What did you discover?” Try counting toys together or finding a word that starts with today’s sound.</p><h3>About this first edition</h3><p>{activityCount} activity configurations across six learning worlds, including {arcadeGames.length} Game Zone collections and the Missing Seeds story. Nova uses written hints and your browser’s read-aloud voice. There is no open-ended AI chat, advertising, or leaderboard.</p><p className="form-note">This is your private family workspace. Parent changes require an expiring parent PIN session. Your parent account can access only your family&apos;s explorers and learning records.</p></section></div></>
    </>
  );
}
