'use client';
import Image from 'next/image';
import {ArrowRight,Play,Gamepad2,BookOpen,Palette,Blocks,Globe,Volume2,Star,Sparkles,Compass,Mountain,Shapes,Leaf,Check,RotateCcw,FlaskConical,Heart} from 'lucide-react';
import type {PublicExplorer} from '@/lib/explorer-view';
import type {SkillSubject} from '@/lib/skill-graph';
import {homeWorlds,learningHome,offscreenInvitation} from '@/lib/learning-home';
import {NovaCharacter,useNova} from '@/components/characters/NovaCharacter';
import {useExperience,ExperienceError} from './use-experience';

const worldIcons:Record<string,typeof BookOpen>={reading:BookOpen,math:Shapes,logic:Mountain,science:FlaskConical,world:Globe,wellbeing:Heart};
const destinations=[
 {id:'theater',name:'Story Theater',caption:'Watch, listen, join in',icon:Play},
 {id:'games',name:'Game Meadow',caption:'Play with a purpose',icon:Gamepad2},
 {id:'reading',name:'Reading Adventure',caption:'From sounds to stories',icon:BookOpen},
 {id:'studio',name:'Creative Studio',caption:'Make something yours',icon:Palette},
 {id:'garden',name:'Build Lab',caption:'Imagine. Build. Try again.',icon:Blocks},
 {id:'myworld',name:'My Treehouse',caption:'A home for your discoveries',icon:Globe},
];
export function ChildWorldHome({profile,onNavigate,onDaily,onClassic,onStart,onResume,busy}: {
 profile:PublicExplorer;onNavigate:(view:string)=>void;onDaily:()=>void;onClassic:()=>void;
 onStart:(subject:SkillSubject)=>void;onResume:(id:string)=>void;busy:boolean;
}) {
 const nova=useNova('idle');
 const {data,error,refresh}=useExperience(profile.id);
 const {active,practiced,gradeLabel}=learningHome(profile);
 const invitation=offscreenInvitation(profile.grade);
 const paused=profile.preferences.paused,disabled=paused||busy;
 const continuing=!!data?.run&&!data.run.completedAt;
 const introduction=`Hello ${profile.name}! Choose a little adventure. We can listen, count, and solve puzzles together. Take your time. You can always ask for help.`;
 return <div className={`wonder-home ${profile.grade==='prek'?'wonder-junior':''}`}>
  <section className="wonder-hero" aria-labelledby="wonder-title">
   <div className="wonder-hero-copy">
    <span className="wonder-kicker"><Sparkles size={15}/> SMALL STEPS. BIG DISCOVERIES.</span>
    <span className="wonder-grade">{gradeLabel}</span>
    <h1 id="wonder-title">Hello, {profile.name}.<br/><em>Let’s find your wonder.</em></h1>
    <p>A forest of words. A city of numbers.<br/>A whole world of “I can do it!”</p>
    <div className="wonder-hero-actions">
     <button className="primary" disabled={disabled} onClick={()=>active?onResume(active.id):onClassic()}><Compass size={21}/>{active?'Continue my quest':'Start my daily quest'}<ArrowRight size={19}/></button>
     <button className="wonder-listen" onClick={()=>nova.speak(introduction)} aria-label="Listen to Nova’s welcome"><Volume2 size={21}/><span>Listen</span></button>
    </div>
    <small>No rush. Little steps count.</small>
   </div>
   <div className="wonder-landscape"><Image src="/quest-island.webp" alt="A floating island with a forest, a golden number city, and purple mountains" fill sizes="(max-width: 700px) 100vw, 55vw" priority/><span className="wonder-map-label"><Compass size={16}/> Your world of discovery</span></div>
   <span className="wonder-orbit orbit-one" aria-hidden="true"><Star size={22}/></span><span className="wonder-orbit orbit-two" aria-hidden="true"><Sparkles size={18}/></span>
  </section>

  <div className="wonder-keepsakes" aria-label="Your saved progress">
   <span><Star size={20}/><strong>{profile.stars}</strong> stars collected</span>
   <span><Compass size={20}/><strong>{profile.completed}</strong> quests completed</span>
   <span className="wonder-keepsake-note"><Leaf size={18}/> Every try helps you grow</span>
  </div>
  {active&&<section className="wonder-resume" aria-label="Saved quest"><div><span className="wonder-kicker">RIGHT WHERE YOU LEFT OFF</span><h2>Your next discovery is waiting</h2><p>{active.index} of {active.total} activities completed. Your place is saved.</p></div><button className="secondary" disabled={disabled} onClick={()=>onResume(active.id)}><RotateCcw size={18}/>Pick up my quest</button></section>}

  <section aria-labelledby="wonder-worlds-title">
   <div className="wonder-section-heading"><div><span className="wonder-kicker">THREE PATHS TO GROW</span><h2 id="wonder-worlds-title">What will you discover?</h2></div><span>Choose a skill adventure</span></div>
   <div className="wonder-worlds">{homeWorlds.map(world=>{const Icon=worldIcons[world.id];return <button className={`wonder-world world-${world.id}`} key={world.id} disabled={disabled} onClick={()=>onStart(world.id)}>
    <span className="wonder-world-scene" aria-hidden="true"><span className="wonder-world-sun"/><Icon size={52} strokeWidth={1.5}/><span className="wonder-world-mark">{world.id==='reading'?'a b c':world.id==='math'?'1 2 3':'? + !'}</span></span>
    <span className="wonder-world-copy"><small>{world.short}</small><strong>{world.title}</strong><span>{profile.grade==='prek'?world.prek:world.grade1}</span><span className="wonder-world-footer">{practiced[world.id]?`${practiced[world.id]} skills practised`:'A new path to explore'}<ArrowRight size={20}/></span></span>
   </button>;})}</div>
  </section>

  <section className="wonder-feature" aria-labelledby="wonder-story-title">
   <div className="wonder-feature-art" aria-hidden="true"><span className="wonder-feature-halo"/><NovaCharacter state={nova.state} size="normal"/><span className="wonder-story-stamp"><BookOpen size={25}/> STORY + PLAY</span></div>
   <div className="wonder-feature-copy"><span className="wonder-kicker">AN ADVENTURE WITH NOVA</span><h2 id="wonder-story-title">A missing map.<br/>A marvellous discovery.</h2><p>Listen for sounds, build a word, and read a little story. Bring a treasure back to your treehouse.</p><div className="wonder-story-skills"><span><Check size={15}/>Hear sounds</span><span><Check size={15}/>Blend a word</span><span><Check size={15}/>Read together</span></div>
    <ExperienceError error={error} refresh={refresh} busy={busy}/>
    <button className="primary" onClick={onDaily} disabled={disabled||!data}>{!data?(error?'Adventure unavailable':'Finding your saved place...'):continuing?'Continue the story':'Explore with Nova'}<ArrowRight size={19}/></button><small>Take a break whenever you need.</small>
   </div>
  </section>

  <section aria-labelledby="wonder-play-title"><div className="wonder-section-heading"><div><span className="wonder-kicker">LET CURIOSITY LEAD</span><h2 id="wonder-play-title">A little more to explore</h2></div></div><div className="wonder-play-grid">{destinations.map(({id,name,caption,icon:Icon})=><button key={id} className={`wonder-destination destination-${id}`} onClick={()=>onNavigate(id)}><span><Icon size={27}/></span><strong>{name}</strong><small>{caption}</small><ArrowRight className="destination-arrow" size={17}/></button>)}</div></section>

  <section className="wonder-offscreen" aria-labelledby="wonder-offscreen-title"><span className="wonder-leaf"><Leaf size={32}/></span><div><span className="wonder-kicker">TAKE YOUR WONDER OUTSIDE THE SCREEN</span><h2 id="wonder-offscreen-title">{invitation.title}</h2><p>{invitation.text}</p><small>{invitation.skill}</small></div><button className="wonder-listen" aria-label="Listen to the real-world activity" onClick={()=>nova.speak(invitation.text)}><Volume2 size={23}/></button></section>
 </div>;
}
