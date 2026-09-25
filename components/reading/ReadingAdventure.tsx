'use client';
import {useEffect,useRef,useState,useCallback} from 'react';
import {ArrowRight,RefreshCw} from 'lucide-react';
import type {ReadingView,ReadingActivity} from '@/lib/reading/types';
import {AudioButton} from './AudioButton';
import {LetterCatch} from './LetterCatch';
import {BlendTrain} from './BlendTrain';
import {SoundBoxes} from './SoundBoxes';
import {DecodableReader} from './DecodableReader';
import {celebrate} from '@/lib/audio';
import {Scene,ScenePlane} from '@/components/kid/art/Scene';
import {Bloom,Bush,FarHills,ForeLeaves,GrassTuft,GroundBand,SkyWash,Tree} from '@/components/kid/art/backdrops';
import {CastFigure} from '@/components/kid/art/cast';
import {READING_STATIONS} from '@/components/kid/art/stations';
import {DoorMark} from '@/components/kid/Placeholder';
import {ProgressTrail} from '@/components/kid/ProgressTrail';
import {SpeechBubble} from '@/components/kid/SpeechBubble';
import {KidSurfaceProvider} from '@/components/kid/surface';
import type {LearningBandId} from '@/lib/learning-bands';

/**
 * The Reading Grove (WP-11 §3.3).
 *
 * Reading is the spine (§D2) and this is the screen a child on the reading trail sees
 * every day, so it is the screen where the old shape cost the most. It was a marketing
 * landing page: an ALL-CAPS kicker, a three-line headline — "A sound. A word. A whole new
 * world." — a subhead, a call to action, and five stage cards illustrated with 👂 🏡 🚂 🧩
 * 📖. A four-year-old who cannot read arrived at a pitch written for their parent.
 *
 * It is now the grove. Five drawn stations stand along a path through the trees, in the
 * order a child walks them; the path is lit exactly as far as they have actually been.
 * Nova says one short line and there is one thing to touch.
 *
 * ## What is deliberately unchanged
 *
 * Every line of the data flow: `fetchReading`, `act`, the revision handling, the help
 * ladder, the skip path, the placement logic. `LetterCatch`, `BlendTrain`, `SoundBoxes`
 * and `DecodableReader` keep their mechanics exactly — they are the strongest existing
 * work in the repo and this package has no business rewriting them. What changed is the
 * frame they sit in and the pictures around them.
 */
async function fetchReading(profileId:string,signal?:AbortSignal):Promise<ReadingView>{const r=await fetch(`/api/reading?profile=${encodeURIComponent(profileId)}`,{signal:signal?AbortSignal.any([signal,AbortSignal.timeout(20000)]):AbortSignal.timeout(20000)});const d=await r.json() as ReadingView;if(!r.ok)throw Error(d.error);return d;}

export function ReadingAdventure({profileId,name,paused,offline,onStars,band='prek',narration=true}:{profileId:string;name:string;paused:boolean;offline:boolean;onStars:(stars:number)=>void;band?:LearningBandId;narration?:boolean}){
  const [data,setData]=useState<ReadingView|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[playing,setPlaying]=useState(false),[success,setSuccess]=useState<{activity:ReadingActivity;text:string}|null>(null);
  const lock=useRef(false),stage=useRef<HTMLDivElement>(null);
  const refresh=useCallback(async()=>{try{setData(await fetchReading(profileId));setError('');}catch(e){setError(e instanceof Error?e.message:'Try again.');}},[profileId]);
  useEffect(()=>{const controller=new AbortController();fetchReading(profileId,controller.signal).then(d=>{if(!controller.signal.aborted){setData(d);setError('');}}).catch(e=>{if(!controller.signal.aborted)setError(e.message);});return()=>{controller.abort();window.speechSynthesis?.cancel();};},[profileId]);
  async function act(action:string,response?:string){if(!data||lock.current)return;lock.current=true;setBusy(true);setError('');const previous=data.session?.activity;
    try{const r=await fetch('/api/reading',{method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(20000),body:JSON.stringify({action,profile:profileId,revision:data.revision,session:data.session?.id,activity:previous?.id,response})});const next=await r.json() as ReadingView;if(!r.ok)throw Error(next.error);setData(next);onStars(next.stars);if(action==='start'){setPlaying(true);setSuccess(null);requestAnimationFrame(()=>stage.current?.scrollIntoView({block:'start',behavior:'instant'}));}if(action==='answer'&&next.correct&&previous){setSuccess({activity:previous,text:next.feedback??'A new discovery!'});celebrate(!!next.session?.completedAt&&next.session.kind==='quest');}if(action==='skip')setSuccess(null);
    }catch(e){setError(e instanceof Error?e.message:'Try again.');}finally{lock.current=false;setBusy(false);}}

  const session=data?.session,activity=session?.activity;
  const skill=data?.catalog.skills.find(s=>s.id===activity?.skillId),word=data?.catalog.words.find(w=>w.id===activity?.target),story=data?.catalog.stories.find(s=>s.id===activity?.target);
  const help=session?.helpLevel??0;
  const prompt=activity?.kind==='letter-catch'?`Listen to ${skill?.example}. Find the letter for its first sound.`:activity?.kind==='blend-train'?'Say the sounds and slide the train cars together. Then read the word.':activity?.kind==='sound-boxes'?'Listen to the word and put one letter in each sound box.':'Try reading each little word. Then tell us about the story.';
  function helpedText(){if(!activity)return '';if(activity.kind==='letter-catch')return `${skill?.cue} The letter is ${activity.target}.`;if(activity.kind==='story')return help>=4?story?.pages[session?.storyPage??0]??story?.pages.join(' ')??'':'Look at every letter. Say each sound and slide the sounds together.';if(help>=4)return word?.word??'';return help>=3?`Say the sounds slowly, without a gap: ${word?.word}.`:`${word?.graphemes.map(l=>data?.catalog.skills.find(s=>s.letter===l)?.cue).join(' ')}`;}

  // How far along the path the child actually is. The old screen used exactly this
  // expression to decide which stage cards looked "ready"; it is kept rather than replaced,
  // because inventing a new meaning for progress is a content decision, not a visual one.
  const reached=(index:number)=>index<2||!!data?.readyWords.length;

  return (
    <KidSurfaceProvider value={{band,narration,world:'grove'}}>
      <section className="reading-adventure" ref={stage} data-kid-world="grove" data-band={band}>
        {error&&<div className="error" role="alert">{error}<button className="secondary" disabled={busy} onClick={()=>{setSuccess(null);void refresh();}}><RefreshCw size={18}/>Refresh my saved place</button></div>}
        {!data&&!error&&<p className="loading" role="status">Nova is opening your reading map…</p>}

        {data&&(!playing?(
          /* ---- The grove: five stations along a path, and one thing to do ---- */
          <div className="kid-grove">
            <Scene world="grove" band={band} className="kid-grove-scene" label="The reading grove">
              <ScenePlane plane="sky"><SkyWash /></ScenePlane>
              <ScenePlane plane="far"><FarHills /></ScenePlane>

              <ScenePlane plane="mid">
                <GroundBand />
                <span className="kid-grove-tree" data-at="1"><Tree tone="mid" /></span>
                <span className="kid-grove-tree" data-at="2"><Tree /></span>
                <span className="kid-grove-tree" data-at="3"><Tree tone="mid" /></span>
              </ScenePlane>

              {/* The stations. A label under a picture, never the control itself — and the
                  whole grove is walked by pressing one button, so these are scenery with
                  names rather than twelve more things to choose between. */}
              <ScenePlane plane="mid" className="kid-grove-stations">
                {READING_STATIONS.map((station,index)=>{
                  const Art=station.art;
                  return (
                    <span key={station.id} className="kid-grove-stop" data-at={index+1} data-reached={reached(index)||undefined}>
                      <Art className="kid-place-art" />
                      <span className="kid-grove-name">{STATION_NAMES[index]}</span>
                    </span>
                  );
                })}
              </ScenePlane>

              <ScenePlane plane="near">
                <span className="kid-grove-bush" data-at="1"><Bush /></span>
                <span className="kid-grove-bush" data-at="2"><Bush /></span>
                <span className="kid-grove-grass" data-at="1"><GrassTuft /></span>
                <span className="kid-grove-grass" data-at="2"><GrassTuft /></span>
                <span className="kid-grove-bloom" data-at="1"><Bloom tone="a" /></span>
                <span className="kid-grove-bloom" data-at="2"><Bloom tone="c" /></span>
              </ScenePlane>

              <ScenePlane plane="fore"><ForeLeaves /></ScenePlane>

              <ScenePlane plane="actors">
                <span className="kid-grove-curio"><CastFigure who="curio" state="wave" /></span>
              </ScenePlane>
            </Scene>

            {/* Nova's line and the one thing to touch, below the picture and within reach. */}
            <div className="kid-grove-reach">
              <SpeechBubble
                line={{who:'curio',text:!data.profile.placementDone?`Hello ${name}! Let's find your sounds.`:session&&!session.completedAt?'Your words are waiting.':'Ready for some sounds?'}}
                tail="start"
              />
              <button className="kid-grove-go" disabled={busy||paused} onClick={()=>act('start')}>
                {!data.profile.placementDone?'Start':session&&!session.completedAt?'Carry on':'Read with me'}
                <ArrowRight size={24} />
              </button>
            </div>

            {/* The shelf. A grown-up-facing explanation used to sit above it; the words a
                child has earned are the point, so they come first and the explanation goes. */}
            <section className="reading-shelf">
              <h2>My little reading shelf</h2>
              <div className="reading-word-shelf">
                {data.readyWords.length?data.readyWords.map(w=>(
                  <details key={w.id}>
                    <summary>{w.word}</summary>
                    <span aria-hidden="true">{w.emoji}</span>
                    <p>{w.meaning}</p>
                    <AudioButton kind="word" audioKey={w.word} text={w.word} src={w.audioSrc}/>
                  </details>
                )):<p>Your first word is waiting on the path.</p>}
              </div>
            </section>
          </div>
        ):(
          /* ---- A session: the same frame as the activity player ---- */
          <div className="reading-session kid-activity" data-kid-world="grove" data-band={band}>
            <Scene world="grove" band={band} className="kid-activity-scene" label="">
              <ScenePlane plane="sky"><SkyWash /></ScenePlane>
              <ScenePlane plane="far"><FarHills /></ScenePlane>
              <ScenePlane plane="mid"><GroundBand /></ScenePlane>
            </Scene>
            <div className="kid-activity-veil" aria-hidden="true" />

            <div className="kid-activity-frame">
              <header className="kid-activity-top">
                <button
                  type="button"
                  className="kid-activity-door"
                  disabled={busy}
                  aria-label="Save and take a break"
                  onClick={()=>{setPlaying(false);setSuccess(null);window.speechSynthesis?.cancel();}}
                >
                  <DoorMark />
                </button>
                <ProgressTrail total={session?.total??0} done={session?.index??0} label="Your reading path" />
                <span className="kid-activity-spacer" />
              </header>

              {success?(
                <div className="kid-activity-done">
                  <h2>{success.activity.kind==='letter-catch'?success.activity.target:success.activity.kind==='story'?'A little story, understood.':data.catalog.words.find(w=>w.id===success.activity.target)?.word}</h2>
                  {['blend-train','sound-boxes'].includes(success.activity.kind)&&(
                    <div className="word-meaning">
                      <span aria-hidden="true">{data.catalog.words.find(w=>w.id===success.activity.target)?.emoji}</span>
                      <p>{data.catalog.words.find(w=>w.id===success.activity.target)?.meaning}</p>
                    </div>
                  )}
                  <p className="kid-activity-done-line">{success.text}</p>
                  <button className="primary" onClick={()=>{setSuccess(null);requestAnimationFrame(()=>stage.current?.scrollIntoView({block:'start',behavior:'instant'}));}}>Keep going<ArrowRight size={20}/></button>
                </div>
              ):session?.completedAt?(
                <div className="kid-activity-done">
                  <span className="kid-activity-cast"><CastFigure who="curio" state="celebrate" /></span>
                  <h2>{session.kind==='placement'?'Your next adventure begins here.':'Look what you read!'}</h2>
                  <p className="kid-activity-done-line">{session.kind==='placement'?'Nova found a gentle starting place. Let’s meet a sound together.':'You listened, joined sounds together, and tried ideas.'}</p>
                  {session.kind==='quest'&&(
                    <>
                      <span className="kid-activity-stars">+3 stars</span>
                      {offline&&<p className="reading-offline">With a grown-up, find something that begins with the first sound in “moon.” Stretch that sound together.</p>}
                    </>
                  )}
                  <button className="primary" disabled={busy||paused} onClick={()=>session.kind==='placement'?act('start'):setPlaying(false)}>{session.kind==='placement'?'Meet my first sound':'Back to the grove'}<ArrowRight size={20}/></button>
                </div>
              ):activity&&(
                <>
                  <div className="kid-activity-stage">
                    {/* The instruction, asked by Nova rather than printed above a button. */}
                    <div className="kid-activity-ask">
                      <span className="kid-activity-nova">
                        <CastFigure who="curio" state={data.feedback?'explain':'idle'} />
                      </span>
                      <SpeechBubble line={{who:'curio',text:data.feedback||prompt}} tail="start" />
                    </div>
                    <AudioButton text={prompt} label="Hear my mission"/>

                    {activity.kind==='letter-catch'&&skill&&<LetterCatch key={session!.id+activity.id} activity={activity} skill={skill} needsTeaching={activity.taught&&!data.profile.introduced.includes(activity.target)} busy={busy||paused} onTeach={()=>act('teach')} onAnswer={answer=>act('answer',answer)}/>}
                    {activity.kind==='blend-train'&&word&&<BlendTrain key={session!.id+activity.id} activity={activity} word={word} busy={busy||paused} onAnswer={answer=>act('answer',answer)}/>}
                    {activity.kind==='sound-boxes'&&word&&<SoundBoxes key={session!.id+activity.id} activity={activity} word={word} busy={busy||paused} onAnswer={answer=>act('answer',answer)}/>}
                    {activity.kind==='story'&&story&&<DecodableReader story={story} page={session?.storyPage??0} busy={busy||paused} onPage={()=>act('story-page')} onAnswer={answer=>act('answer',answer)} onHelp={()=>act('help')}/>}
                  </div>

                  <div className="kid-activity-reach">
                    {help>0&&(
                      <aside className={`reading-help help-${help}`}>
                        <strong>{['','Look at the letters','Try each sound','Slide the sounds','Try it together'][help]}</strong>
                        {help===1?(
                          <p className="scaffold-letters">{activity.kind==='story'?story?.pages[session?.storyPage??0]??'':activity.target.split('').join(' · ')}</p>
                        ):(
                          <><p>{helpedText()}</p><AudioButton text={helpedText()} label="Hear this help" slow/></>
                        )}
                      </aside>
                    )}
                    <div className="reading-support">
                      <button className="secondary" disabled={busy||paused||help===4} onClick={()=>act('help')}>A little help</button>
                      <button className="text-button" disabled={busy||paused||(activity.taught&&!data.profile.introduced.includes(activity.target))} onClick={()=>act('skip')}>{session?.kind==='placement'?'I’m still learning this':'Save this for another day'}</button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </section>
    </KidSurfaceProvider>
  );
}

/**
 * What each station is called, in a child's words.
 *
 * Three words or fewer, no system vocabulary, and no shouting — the same rules
 * `tests/child-map.test.mjs` already applies to the landmark names on the map, because
 * these are read out in exactly the same way and by exactly the same child.
 */
const STATION_NAMES = ['Listen', 'Letter village', 'Sound bridge', 'Word workshop', 'Story trail'];
