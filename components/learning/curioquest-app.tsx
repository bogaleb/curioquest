'use client';
import {AccountActions} from '@/components/auth/account-actions';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useDialogFocus } from '@/hooks/use-dialog-focus';
import { QuestPlayer, activityNarration } from '@/components/learning/quest-player';
import { GameZone } from '@/components/learning/game-zone';
import { ParentGate } from '@/components/learning/parent-gate';
import { ComfortSettings } from '@/components/learning/comfort-settings';
import { StoryTrail, GardenLab } from '@/components/learning/garden-adventure';
import { TeamQuest } from '@/components/learning/team-quest';
import { ParentEvidence } from '@/components/learning/parent-evidence';
import { DiscoveryInvitation } from '@/components/learning/discovery-invitation';
import Link from 'next/link';
import {lazy,Suspense} from 'react';
import type {PublicExplorer,QuestFeedback} from '@/lib/explorer-view';
import type {PublicQuestion} from '@/lib/activity-types';
import {ParentBuilder} from '@/components/learning/parent-builder';
import {ParentControls} from '@/components/learning/parent-controls';
import {ChildWorldHome} from '@/components/experience/ChildWorldHome';
import {ParentExperience} from '@/components/experience/ParentExperience';
import type {RunMode} from '@/lib/experience/types';
import {ParentReadingProgress} from '@/components/reading/ParentReadingProgress';
import {ParentQuests} from '@/components/learning/parent-quests';
import {CelebrationLayer} from '@/components/learning/celebration-layer';
import {AppShell} from '@/components/shell/AppShell';
import {learningBands,primaryContentBand,resolveBand} from '@/lib/learning-bands';
import {subjectRegistry,worldName} from '@/lib/subjects';
import {isDestination} from '@/lib/navigation';
import type {SkillSubject} from '@/lib/skill-graph';
import {configureAudio,unlockAudio,quietAudio} from '@/lib/audio';
import {readAloud as speak} from '@/lib/speech';
const DailyAdventure=lazy(()=>import('@/components/experience/DailyAdventure').then(m=>({default:m.DailyAdventure})));
const Theater=lazy(()=>import('@/components/experience/Theater').then(m=>({default:m.Theater})));
const WorldMap=lazy(()=>import('@/components/experience/WorldMap').then(m=>({default:m.WorldMap})));
const ReadingAdventure=lazy(()=>import('@/components/reading/ReadingAdventure').then(m=>({default:m.ReadingAdventure})));
const CreativeStudio=lazy(()=>import('@/components/learning/creative-studio').then(m=>({default:m.CreativeStudio})));
const ScienceLab=lazy(()=>import('@/components/learning/science-lab').then(m=>({default:m.ScienceLab})));
const StoryWorld=lazy(()=>import('@/components/learning/story-world').then(m=>({default:m.StoryWorld})));
type QuestResponse={profile:PublicExplorer;profiles:PublicExplorer[];feedback:QuestFeedback;error?:string;deleted?:string};
import { Compass, Map, Star, BookOpen, Shapes, Mountain, FlaskConical, Globe, Heart, ArrowRight, Volume2, ChevronDown, Check, Flag, Lightbulb, X, ShieldCheck, Sparkles, Leaf, LoaderCircle, Trophy, Plus, Users } from 'lucide-react';
import { AVATARS, INTERESTS, avatarEmoji } from '@/lib/explorers';
const worldIcons:Record<string,typeof BookOpen>={reading:BookOpen,math:Shapes,logic:Mountain,science:FlaskConical,world:Globe,wellbeing:Heart};
type World={id:SkillSubject;name:string;skill:string;icon:typeof BookOpen;hue:string;line:string};
const worlds:World[] = subjectRegistry.map(subject=>({id:subject.id,name:subject.world,skill:subject.label,icon:worldIcons[subject.id],hue:subject.hue,line:subject.older}));
export default function HomePage() {
    const [profiles, setProfiles] = useState<PublicExplorer[]>([]), [pid, setPid] = useState(''), [view, setViewRaw] = useState('adventure'), [busy, setBusy] = useState(false), [error, setError] = useState(''), [play, setPlay] = useState(false), [current, setCurrent] = useState<PublicQuestion|null>(null), [feedback, setFeedback] = useState<QuestFeedback>(null), [selected, setSelected] = useState(''), [gate, setGate] = useState(false), [parentOpen, setParentOpen] = useState(false), [saved, setSaved] = useState(false), [adding, setAdding] = useState(false);
    const [studioDirty,setStudioDirty]=useState(false);
    const [loaded,setLoaded]=useState(false);
    const [experienceMode,setExperienceMode]=useState<RunMode>('daily');
    // The current screen lives in the URL as well as in state, so a view can be
    // linked, bookmarked, and reached with the browser's Back button. Parent Corner is
    // deliberately excluded: it sits behind a PIN and must not be link-shareable.
    const writeUrl=useCallback((next:string,replace=false)=>{
      const url=new URL(window.location.href);
      if(next==='adventure'||next==='parent')url.searchParams.delete('view');
      else url.searchParams.set('view',next);
      window.history[replace?'replaceState':'pushState']({view:next},'',url);
    },[]);
    const setView=useCallback((next:React.SetStateAction<string>)=>{
      if(studioDirty&&!window.confirm('Leave the studio without saving these changes?'))return;
      setStudioDirty(false);
      setViewRaw(current=>{const resolved=typeof next==='function'?next(current):next;if(resolved!==current)writeUrl(resolved);return resolved;});
      window.scrollTo({top:0,behavior:'instant'});
    },[studioDirty,writeUrl]);
    useEffect(()=>{
      const onPop=(event:PopStateEvent)=>{const target=(event.state as {view?:string}|null)?.view;setViewRaw(target&&isDestination(target)?target:'adventure');};
      window.addEventListener('popstate',onPop);
      return ()=>window.removeEventListener('popstate',onPop);
    },[]);
    const p = profiles.find(x => x.id === pid);
    const session = p?.session;
    const today = p?.history.filter((h) => h.date.slice(0, 10) === new Date().toISOString().slice(0, 10)).length || 0;
    const [assignmentVersion,setAssignmentVersion]=useState(0);
    const requestLock = useRef(false);
    async function load() { setError(''); try {
        const r = await fetch('/api/quest');
        const d: QuestResponse = await r.json();
        if (!r.ok)
            throw Error(d.error||'Please try again.');
        setProfiles(d.profiles);setLoaded(true);
        if (d.profiles.length && !d.profiles.some((profile) => profile.id === pid))
            setPid(d.profiles[0].id);
    }
    catch (e: unknown) {
        setError(e instanceof Error?e.message:'Please try again.');
    } }
    useEffect(() => { const controller=new AbortController();fetch('/api/quest',{signal:controller.signal}).then(async r=>{const d=await r.json() as QuestResponse;if(!r.ok)throw Error(d.error);setProfiles(d.profiles);setLoaded(true);const params=new URLSearchParams(window.location.search);const requested=params.get('view');if(requested&&requested!=='parent'&&isDestination(requested))setViewRaw(requested);setPid(id=>{const selected=params.get('child')??id;return d.profiles.some((profile:PublicExplorer)=>profile.id===selected)?selected:d.profiles[0]?.id??'';});}).catch(e=>{if(!controller.signal.aborted)setError(e.message);});return ()=>controller.abort(); }, []);
    const action=useCallback(async (body: Record<string,unknown>, explorerId = pid) => { if (requestLock.current)
        return null; requestLock.current = true; setBusy(true); setError(''); try {
        const r = await fetch('/api/quest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, profile: explorerId }) });
        const d: QuestResponse = await r.json();
        if (!r.ok)
            throw Error(d.error||'Please try again.');
        setProfiles(ps => d.deleted ? d.profiles : ps.map(a => (d.profiles || [d.profile]).find((b) => b.id === a.id) || a));
        if(d.deleted&&d.profiles[0])setPid(d.profiles[0].id);
        return d;
    }
    catch (e: unknown) {
        setError(e instanceof Error?e.message:'Please try again.');
        return null;
    }
    finally {
        requestLock.current = false;
        setBusy(false);
    } },[pid]);
    async function createProfile(form: HTMLFormElement) { if (requestLock.current)
        return false; requestLock.current = true; setBusy(true); setError(''); try {
        const fd = new FormData(form);
        const r = await fetch('/api/quest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create-profile', name: fd.get('name'), band: fd.get('band'), grade: primaryContentBand(resolveBand(fd.get('band')).id), avatar: fd.get('avatar'), dailyGoal: Number(fd.get('dailyGoal')), interests: fd.getAll('interests') }) });
        const d: QuestResponse = await r.json();
        if (!r.ok)
            throw Error(d.error||'Please try again.');
        setProfiles(ps => [...ps, d.profile]);
        setPid(d.profile.id);
        setAdding(false);
        setSaved(false);
        setView('adventure');
        return true;
    }
    catch (e: unknown) {
        setError(e instanceof Error?e.message:'Please try again.');
        return false;
    }
    finally {
        requestLock.current = false;
        setBusy(false);
    } }
    async function continueAs(id: string) {
        const explorer=profiles.find(profile=>profile.id===id);
        const savedTeam=explorer?.savedSessions?.find((saved)=>saved.teamId===explorer.team?.id);
        const d = await action(savedTeam ? {action:'session-resume',session:savedTeam.id} : { action: 'start', subject: 'daily' }, id); if (d) {
        setPid(id);
        setCurrent(d.profile.session!.question);
        setFeedback(null);
        setSelected('');
        setPlay(true);
    } }
    async function startCampaign() { if (busy || !p)
        return; const d = await action({ action: 'campaign-start' }); if (d) {
        setCurrent(d.profile.session!.question);
        setFeedback(null);
        setSelected('');
        setPlay(true);
    } }
    const start=useCallback(async (subject: string) => { if (busy || !p)
        return; const d = await action({ action: 'start', subject }); if (d) {
        setCurrent(d.profile.session!.question);
        setFeedback(null);
        setSelected('');
        setPlay(true);
        return true;
    } return false; },[busy,p,action]);
    async function answer(value: string) { if (!session || !current || busy || feedback?.correct)
        return; setSelected(value); const d = await action({ action: 'answer', session: session!.id, question: current!.id, answer: value }); if (d)
        setFeedback(d.feedback); }
    async function hint() { if(!session||!current)return null;const d = await action({ action: 'hint', session: session!.id, question: current!.id }); if (d)
        setFeedback(d.feedback); return d; }
    async function startDiscovery() { const d = await action({ action: 'discovery-start' }); if (d) {
        setCurrent(d.profile.session!.question);
        setFeedback(null);
        setSelected('');
        setPlay(true);
    } }
    async function startGame(game:string,level:number) {const d=await action({action:'game-start',game,level});if(d){setCurrent(d.profile.session!.question);setFeedback(null);setSelected('');setPlay(true);}}
    async function resumeSaved(id:string) {const d=await action({action:'session-resume',session:id});if(d){setCurrent(d.profile.session!.question);setFeedback(null);setSelected('');setPlay(true);}}
    const autoNarrate=(p?.preferences?.autoRead??false)||resolveBand(p?.band).delivery.autoNarrate;
    // Bands below reading age hear the activity without asking; older bands ask.
    useEffect(()=>{if(play&&current&&autoNarrate)speak(activityNarration(current));return ()=>window.speechSynthesis?.cancel();},[play,current,autoNarrate]);
    function next() { setFeedback(null); setSelected(''); setCurrent(session!.question); }
    useEffect(() => { const context = (document as Document & {modelContext?:{registerTool:(tool:Record<string,unknown>,options:{signal:AbortSignal})=>Promise<void>}}).modelContext; if (!context?.registerTool)
        return; const controller = new AbortController(); Promise.resolve(context.registerTool({ name: 'start_learning_quest', description: 'Open a personalized learning quest for the selected explorer.', inputSchema: { type: 'object', properties: { world: { type: 'string', enum: ['daily', 'reading', 'math', 'logic'] } }, required: ['world'], additionalProperties: false }, annotations: { readOnlyHint: false }, execute: async (input: {world:string}) => { if (!['daily', 'reading', 'math', 'logic'].includes(input.world))
            throw Error('Unknown world'); if (!p || busy)
            throw Error('Explorer not ready'); const opened = await start(input.world); if (!opened)
            throw Error('Quest could not be opened'); return { opened: true, world: input.world }; } }, { signal: controller.signal })).catch(() => { }); return () => controller.abort(); }, [pid, p, busy,start]);
    const closeDialog = useCallback(() => { if (requestLock.current)
        return; setPlay(false); setGate(false); setAdding(false); window.speechSynthesis?.cancel(); }, []);
    useDialogFocus(play || gate || adding, closeDialog);
    const parentUnlocked=useCallback(()=>{setParentOpen(true);setGate(false);if(!profiles.length)setAdding(true);setViewRaw('parent');requestAnimationFrame(()=>window.scrollTo({top:0,behavior:'instant'}));},[profiles.length]);
    const parent=()=>setGate(true);
    async function lockParent(){try{const r=await fetch('/api/parent',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'lock'})});if(!r.ok)throw Error('Parent Corner could not be locked. Please try again.');setParentOpen(false);setView('adventure');}catch(e){setError(e instanceof Error?e.message:'Please try again.');}}
    useEffect(()=>{if(!parentOpen)return;const timer=setTimeout(()=>{setParentOpen(false);setView(v=>v==='parent'?'adventure':v);},15*60*1000);return ()=>clearTimeout(timer);},[parentOpen,setView]);
    useEffect(()=>{if(p)configureAudio(p.preferences.paused?{...p.controls.audio,music:false,effects:false}:p.controls.audio);},[p]);
    useEffect(()=>{const unlock=()=>{void unlockAudio();};document.addEventListener('pointerdown',unlock);document.addEventListener('keydown',unlock);return()=>{document.removeEventListener('pointerdown',unlock);document.removeEventListener('keydown',unlock);quietAudio();};},[]);
    return <>
    <CelebrationLayer/>
    <AppShell view={view} onNavigate={setView} band={p?.band ?? 'prek'} faith={p?.controls.faith ?? false}
      stars={p?.stars ?? 0} inert={play || gate || adding} reducedMotion={p?.preferences?.reducedMotion}
      brand={<Link className="brand" href="/" aria-label="CurioQuest home"><span className="brand-icon"><Compass size={29}/></span><span>curio<span className="brand-q">quest</span><small>SMALL STEPS. BIG DISCOVERIES.</small></span></Link>}
      switcher={<div className="explorer-switch"><span className="avatar">{avatarEmoji(p?.avatar)}</span><label><span>YOUR EXPLORER</span><select aria-label="Choose explorer" disabled={busy} value={pid} onChange={e => { if(studioDirty&&!window.confirm('Leave without saving your artwork?'))return;setStudioDirty(false);setPid(e.target.value);if(view==='faith'&&!profiles.find(x=>x.id===e.target.value)?.controls.faith)setViewRaw('adventure'); setPlay(false); setSaved(false); }}>{profiles.length ? profiles.map(a => <option key={a.id} value={a.id}>{a.name} · {resolveBand(a.band).label}</option>) : <option>Loading…</option>}</select></label><ChevronDown size={16}/></div>}
      utility={<><div className="nova-note"><span className="fox">🦊</span><strong>A little curious?</strong><p>That’s where every great adventure begins.</p><span>— Nova, your quest guide</span></div><button className={view === 'parent' ? 'nav-item active' : 'nav-item'} onClick={parent}><ShieldCheck />Parent corner</button><Link className="nav-item" href="/account/children">Switch family explorer</Link><AccountActions/><small className="version">CurioQuest · First adventure edition</small></>}
      topbarActions={<><span className="star-pill"><Star size={17} fill="currentColor"/>{p?.stars || 0} stars</span><button className="icon-button" title="Read a welcome" aria-label="Read a welcome" onClick={() => speak(`Hello ${p?.name || 'explorer'}! Ready for a little adventure? Choose your daily quest or explore a world.`)}><Volume2 size={20}/></button><span className="avatar mini">{avatarEmoji(p?.avatar)}</span></>}
      footer={<><span className="footer-brand"><Compass size={15}/> A little curiosity goes a long way.</span><span>Learn. Think. Build. Explore.</span></>}>
    {error && <div className="error" role="alert">{error} <button onClick={load}>Try again</button></div>}
        {!p ? (loaded ? <section className="panel"><h1>Your family&apos;s first adventure</h1><p>Set up your Parent Corner PIN, then create an explorer. Children do not need email addresses.</p><button className="primary" onClick={parent}>Create your first explorer</button></section> : <div className="loading"><LoaderCircle className="spin"/> Opening your adventure…</div>) : <>
            {p.preferences.paused && view !== 'parent' && <section className="pause-card"><span>🌿</span><h2>A little time away from the screen</h2><p>Your adventures and discoveries are safely saved.<br/>A grown-up can resume play in Parent Corner.</p></section>}
            {view === 'adventure' && <><ChildWorldHome key={p.id} profile={p} busy={busy} onStart={start} onResume={resumeSaved} onNavigate={setView} onDaily={()=>{setExperienceMode('daily');setView('daily-adventure');}} onClassic={()=>start('daily')}/><ParentQuests key={p.id+assignmentVersion} profileId={p.id} paused={p.preferences.paused}/><DiscoveryInvitation profile={p} busy={busy||p.preferences.paused} onStart={startDiscovery} onListen={speak}/></>}
            {view === 'daily-adventure' && <Suspense fallback={<p>Nova is opening your adventure…</p>}><DailyAdventure key={p.id+experienceMode} profileId={p.id} mode={experienceMode} onExit={()=>setView('adventure')} onReading={()=>setView('reading')} onWorld={()=>setView('myworld')} onStars={stars=>setProfiles(ps=>ps.map(x=>x.id===p.id?{...x,stars}:x))}/></Suspense>}
            {view === 'theater' && <Suspense fallback={<p>Raising the curtain…</p>}><Theater key={p.id} profileId={p.id} onPlay={()=>{setExperienceMode('episode');setView('daily-adventure');}}/></Suspense>}
            {view === 'myworld' && <Suspense fallback={<p>Opening your world…</p>}><WorldMap onStars={stars=>setProfiles(ps=>ps.map(x=>x.id===p.id?{...x,stars}:x))} key={p.id} profileId={p.id} name={p.name} onNavigate={setView} onAdventure={()=>{setExperienceMode('daily');setView('daily-adventure');}}/></Suspense>}
            {view === 'worlds' && <><div className="page-heading"><div><div className="eyebrow">FOLLOW YOUR CURIOSITY</div><h1>A world of possibilities.</h1><p>Pick a path. Make a discovery. Grow at your own pace.</p></div><div className="level-pill"><Sparkles size={19}/><span>Level {Math.floor(p.completed / 3) + 1}<small>{p.completed < 3 ? 'Curious Explorer' : 'Brave Explorer'}</small></span></div></div>
            <StoryTrail progress={p.adventure} busy={busy || p.preferences.paused} onStart={startCampaign} onGarden={() => setView('garden')}/>
            <div className="content-grid"><div><div className="section-heading"><h2>{view === 'worlds' ? 'Your learning worlds' : 'Where will you go today?'}</h2></div><div className="worlds-grid">{worlds.map(w => <button key={w.id} disabled={busy || p.preferences.paused} className="world-card" data-world={w.id} onClick={() => start(w.id)}><div className="world-top"><span className="world-symbol"><w.icon size={35} strokeWidth={1.6}/></span><span className="world-tag">{subjectRegistry.find(subject=>subject.id===w.id)?.eyebrow}</span></div><h3>{w.name}</h3><p>{w.skill}</p><div className="world-progress"><span>Trail {p.skills[w.id].level} of 3</span><ArrowRight size={18}/></div><div className="progress-track"><span style={{ width: `${p.skills[w.id].seen ? Math.min(100, p.skills[w.id].seen / 15 * 100) : 0}%` }}/></div></button>)}</div>
            <section className="journey"><div className="section-heading"><h2>Your explorer journey</h2><span>{p.completed} quests complete</span></div><div className="journey-path">{[{ label: 'Get curious', n: 0, icon: Compass }, { label: 'Keep exploring', n: 3, icon: Leaf }, { label: 'Think bigger', n: 6, icon: Lightbulb }, { label: 'Shine bright', n: 9, icon: Star }].map((s, i) => <div className={`journey-stop ${p.completed >= s.n ? 'reached' : ''}`} key={s.label}><span><s.icon size={23}/></span><strong>{s.label}</strong><small>{i === 0 ? 'Your journey begins' : `${s.n} quests`}</small></div>)}</div></section>
            {view === 'worlds' && <div className="future-worlds"><strong>More worlds are on the horizon</strong><p>Design a garden in Build Lab, or follow Nova through the Missing Seeds story.</p></div>}</div>
            <aside className="right-column"><section className="today-card"><div className="section-heading"><h3>A little progress</h3><span className="sun-icon">☀</span></div><p>Small steps add up.</p><div className="daily-progress"><span className="ring"><Check size={24}/></span><div><strong>{today > 0 ? 'You explored today!' : 'A fresh start'}</strong><span>{today > 0 ? `${today} quest${today === 1 ? '' : 's'} completed` : 'Your first discovery awaits'}</span></div></div><div className="today-footer"><span><Star size={17}/>{p.stars} stars earned</span><span><Flag size={17}/>{p.completed} quests</span></div></section><section className="nova-card"><div className="nova-card-title"><span>🦊</span><div><strong>A note from Nova</strong><small>YOUR FRIENDLY GUIDE</small></div></div><p>“You don’t have to know the answer yet. Let’s figure it out together!”</p><button className="text-button" onClick={() => speak('You don’t have to know the answer yet. Let’s figure it out together!')}><Volume2 size={17}/> Listen to Nova</button></section><div className="gentle-note"><Leaf size={17}/><span>No rush. No races.<br />Just your kind of adventure.</span></div></aside></div></>}
        {view === 'games' && <button className="space-invitation reading-invitation" onClick={()=>{setExperienceMode('game');setView('daily-adventure');}}><span aria-hidden="true">✦</span><span><small>NEW · SPACE COLLECTOR</small><strong>Listen. Steer. Make a discovery.</strong><span>A gentle word mission with touch and keyboard controls.</span></span><ArrowRight/></button>}
        {view === 'games' && <GameZone key={p.id} profile={p} busy={busy || p.preferences.paused} onStart={startGame} onContinue={()=>resumeSaved(session!.id)} onResume={resumeSaved} onFavorite={async(game,favorite)=>{await action({action:'favorite-game',game,favorite});}}/>}
        {view === 'parent' && parentOpen && <div className="parent-lock-toolbar"><button className="secondary" onClick={lockParent}><ShieldCheck size={17}/>Lock Parent Corner</button></div>}
        {view === 'reading' && <Suspense fallback={<p>Opening your reading trail…</p>}><ReadingAdventure key={p.id} profileId={p.id} name={p.name} paused={p.preferences.paused} offline={p.controls.offline} onStars={stars=>setProfiles(ps=>ps.map(x=>x.id===p.id?{...x,stars}:x))}/></Suspense>}
        {view === 'science' && <Suspense fallback={<p>Opening Discovery Lab…</p>}><ScienceLab key={p.id} profileId={p.id} paused={p.preferences.paused} offline={p.controls.offline}/></Suspense>}
        {(view==='stories'||view==='faith')&&<Suspense fallback={<p>Opening the bookshelf…</p>}>{view==='faith'&&!p.controls.faith?<p>Choose another adventure from the menu.</p>:<StoryWorld key={p.id+view} profileId={p.id} faith={view==='faith'} paused={p.preferences.paused}/>}</Suspense>}
        {view === 'studio' && <Suspense fallback={<div className="loading">Opening Mira’s studio…</div>}><CreativeStudio key={p.id} profileId={p.id} name={p.name} paused={p.preferences.paused} onDirtyChange={setStudioDirty}/></Suspense>}
        {view === 'parent' && parentOpen && <div className="parent-expansion"><header><span className="eyebrow">YOUR FAMILY’S CONTROL CENTER</span><h1>Guide their next discovery.</h1><p>Manage learning, make a personal quest, and keep their creations.</p></header><ParentExperience key={p.id+':experience'} profileId={p.id} onStars={stars=>setProfiles(ps=>ps.map(x=>x.id===p.id?{...x,stars}:x))}/><ParentReadingProgress key={p.id+':reading'} profileId={p.id} name={p.name}/><ParentControls key={p.id+':controls'} profile={p} busy={busy} onAction={action}/><details className="panel"><summary>Parent Activity Builder & assignments</summary><ParentBuilder key={p.id} profile={p} onAssigned={()=>setAssignmentVersion(v=>v+1)}/></details><details className="panel"><summary>Artwork portfolio</summary><Suspense fallback={<p>Opening portfolio…</p>}><CreativeStudio key={p.id+':parent'} profileId={p.id} name={p.name} paused={false} parent onDirtyChange={setStudioDirty}/></Suspense></details></div>}
        {view === 'parent' && parentOpen && <ComfortSettings key={p.id} preferences={p.preferences} busy={busy} onSave={async preferences=>!!(await action({action:'preferences',...preferences}))}/>}
        {view === 'team' && <TeamQuest key={p.id} profiles={profiles} profile={p} busy={busy || p.preferences.paused} onStart={async (partner) => { await action({ action: 'team-start', partner }); }} onContinue={continueAs} onComplete={async () => { await action({ action: 'team-complete' }); }} onGarden={() => setView('garden')}/>}
        {view === 'garden' && <GardenLab key={p.id} progress={p.adventure} offline={p.controls.offline} busy={busy || p.preferences.paused} onSave={async (garden) => !!(await action({ action: 'save-garden', garden }))} onOffline={async () => !!(await action({ action: 'offline-request' }))}/>}
        {view === 'rewards' && <><div className="eyebrow">LOOK HOW FAR YOU’VE COME</div><h1>Your treasure chest</h1><p className="lead">Every discovery is something to be proud of.</p><div className="reward-total"><Star size={48} fill="#f4bd46"/><div><strong>{p.stars}</strong><span>stars collected</span></div></div><div className="badge-grid">{[{ name: 'First discovery', n: 1, icon: Compass }, { name: 'Trail finder', n: 3, icon: Map }, { name: 'Brave thinker', n: 6, icon: Lightbulb }, { name: 'Wonder seeker', n: 9, icon: Trophy }].map(b => <div key={b.name} className={`badge-card ${p.completed >= b.n ? 'earned' : ''}`}><b.icon size={48}/><h3>{b.name}</h3><p>{p.completed >= b.n ? 'You earned this!' : `${b.n} completed quests`}</p></div>)}</div><button className="primary" onClick={() => setView('adventure')}>Back to my adventure <ArrowRight size={18}/></button></>}
        {view === 'parent' && parentOpen && <><div className="eyebrow">SUPPORT THEIR NEXT SMALL STEP</div><h1>Parent corner</h1><p className="lead">A clear view of {p.name}’s practice, without pressure.</p><ParentEvidence profile={p} busy={busy} onConfirm={async () => !!(await action({ action: 'offline-confirm' }))}/><div className="parent-grid"><section className="panel profile-panel"><div className="panel-title"><div><h2>Explorer profile</h2><p>Personalize the adventure without collecting sensitive details.</p></div><span className="profile-avatar">{avatarEmoji(p.avatar)}</span></div><form key={p.id} onSubmit={async (e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); const d = await action({ action: 'profile', name: fd.get('name'), band: fd.get('band'), grade: primaryContentBand(resolveBand(fd.get('band')).id), avatar: fd.get('avatar'), dailyGoal: Number(fd.get('dailyGoal')), interests: fd.getAll('interests') }); if (d)
            setSaved(true); }}><div className="form-two"><label>Explorer name<input name="name" defaultValue={p.name} required maxLength={24}/></label><label>Learning band<select name="band" defaultValue={p.band}>{learningBands.map(b=><option key={b.id} value={b.id}>{b.label} · {b.ageLabel}</option>)}</select></label></div><fieldset><legend>Choose a quest buddy</legend><div className="avatar-options">{AVATARS.map(a => <label key={a.id} title={a.label}><input type="radio" name="avatar" value={a.id} defaultChecked={p.avatar === a.id}/><span aria-hidden="true">{a.emoji}</span><small>{a.label.split(' ')[1]}</small></label>)}</div></fieldset><fieldset><legend>Favorite things <small>Choose up to 3</small></legend><div className="interest-options">{INTERESTS.map(i => <label key={i.id}><input type="checkbox" name="interests" value={i.id} defaultChecked={p.interests?.includes(i.id)}/><span>{i.emoji} {i.label}</span></label>)}</div></fieldset><label>Daily adventure length<select name="dailyGoal" defaultValue={p.dailyGoal || 10}><option value="8">About 8 minutes</option><option value="10">About 10 minutes</option><option value="15">About 15 minutes</option><option value="20">About 20 minutes</option></select></label><p className="form-note">Changing bands adjusts the starting trails, the reading load, and how much is read aloud. Skill evidence, earned stars, and quest history stay.</p><button className="primary" disabled={busy}>Save profile <Check size={17}/></button>{saved && <p role="status" className="success">Profile saved.</p>}</form></section><section className="panel family-panel"><div className="panel-title"><div><h2>Your explorers</h2><p>{profiles.length} of 4 family profiles</p></div><Users size={25}/></div><div className="family-list">{profiles.map(profile => <button key={profile.id} disabled={busy} className={profile.id === p.id ? 'active' : ''} onClick={() => setPid(profile.id)}><span className="avatar">{avatarEmoji(profile.avatar)}</span><span><strong>{profile.name}</strong><small>{resolveBand(profile.band).label} · {profile.completed} quests</small></span>{profile.id === p.id && <Check size={18}/>}</button>)}</div><button className="secondary" disabled={profiles.length >= 4} onClick={() => { setError(''); setAdding(true); }}><Plus size={18}/> Add an explorer</button>{profiles.length >= 4 && <p className="form-note">This edition supports up to four explorer profiles.</p>}</section><section className="panel"><h2>Learning snapshot</h2>{worlds.map(w => { const s = p.skills[w.id]; return <div key={w.id} className="skill-row"><w.icon size={21}/><div><strong>{w.name}</strong><small>{s.seen} activities practiced · Trail {s.level}</small></div><b>{s.seen ? Math.round(s.first / s.seen * 100) + '%' : '—'}</b></div>; })}<p className="form-note">Percentages show correct answers on the first try without hints. These are practice signals, not mastery scores or an assessment.</p></section><section className="panel"><h2>Recent adventures</h2>{p.history.length ? p.history.slice(0, 6).map((h, i) => <div className="history-row" key={i}><span><strong>{worldName(h.subject)}</strong><small>{new Date(h.date).toLocaleDateString()}</small></span><span>{h.first}/{h.total || 5} independently</span></div>) : <p>Your child’s completed quests will appear here.</p>}</section><section className="panel"><h2>Make room for wonder</h2><p>After a short quest, ask: “What did you discover?” Try counting toys together or finding a word that starts with today’s sound.</p><h3>About this first edition</h3><p>324 activity configurations across two tracks, including eight Game Zone collections and the Missing Seeds story. Nova uses written hints and your browser’s read-aloud voice. There is no open-ended AI chat, advertising, or leaderboard.</p><p className="form-note">This is your private family workspace. Parent changes require an expiring parent PIN session. Your parent account can access only your family&apos;s explorers and learning records.</p></section></div></>}
        </>}
    </AppShell>
    {adding && <div className="overlay profile-overlay"><section className="gate panel add-profile" role="dialog" aria-modal="true" aria-labelledby="add-explorer-title"><button className="close" aria-label="Close" onClick={() => { setAdding(false); setError(''); }}><X /></button><div className="add-profile-heading"><span className="add-profile-icon"><Sparkles size={28}/></span><div><div className="eyebrow">A NEW ADVENTURE BEGINS</div><h2 id="add-explorer-title">Create an explorer</h2><p>Just enough detail to make learning feel like theirs.</p></div></div>{error && <div className="error" role="alert">{error}</div>}<form onSubmit={async (e) => { e.preventDefault(); await createProfile(e.currentTarget); }}><div className="form-two"><label>Explorer name<input name="name" autoFocus required maxLength={24} placeholder="What should Nova call them?"/></label><label>Learning band<select name="band" defaultValue="prek">{learningBands.map(b=><option key={b.id} value={b.id}>{b.label} · {b.ageLabel}</option>)}</select></label></div><fieldset><legend>Choose a quest buddy</legend><div className="avatar-options">{AVATARS.map((a, index) => <label key={a.id} title={a.label}><input type="radio" name="avatar" value={a.id} defaultChecked={index === 0}/><span aria-hidden="true">{a.emoji}</span><small>{a.label.split(' ')[1]}</small></label>)}</div></fieldset><fieldset><legend>What lights them up? <small>Choose up to 3</small></legend><div className="interest-options">{INTERESTS.map(i => <label key={i.id}><input type="checkbox" name="interests" value={i.id}/><span>{i.emoji} {i.label}</span></label>)}</div></fieldset><label>Daily adventure length<select name="dailyGoal" defaultValue="10"><option value="8">About 8 minutes</option><option value="10">About 10 minutes</option><option value="15">About 15 minutes</option><option value="20">About 20 minutes</option></select></label><p className="privacy-note"><ShieldCheck size={17}/> CurioQuest stores a nickname and learning preferences—not a birth date, child email, or location.</p><div className="modal-actions"><button type="button" className="text-button" onClick={() => { setAdding(false); setError(''); }}>Cancel</button><button className="primary" disabled={busy}>{busy ? 'Creating explorer…' : 'Begin their adventure'}<ArrowRight size={18}/></button></div></form></section></div>}
    {gate && <ParentGate onClose={()=>setGate(false)} onUnlocked={parentUnlocked}/>}
    {play && p && !p.preferences.paused && <QuestPlayer profile={p} current={current} feedback={feedback} selected={selected} busy={busy} error={error}
      onBack={()=>{setPlay(false);if(session!.gameId)setView('games');window.speechSynthesis?.cancel();}} onAnswer={answer} onHint={hint} onNext={next}
      onReflect={strategy=>action({action:'reflect',session:session!.id,question:current!.id,strategy})}
      onFeeling={value=>action({action:'feeling',session:session!.id,value})}
      onFinish={()=>{setPlay(false);setView(session!.gameId?'games':session!.teamId?'team':session!.chapter!==undefined?'garden':'adventure');window.speechSynthesis?.cancel();}}/>}
    </>;
}
