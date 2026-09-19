import type {LearningControls} from './learning-controls';
type Settings=LearningControls['audio'];
let settings:Settings={effects:false,music:false,musicVolume:.15,narration:true,voiceVolume:.8,celebration:'gentle',sound:'bells'};
let context:AudioContext|null=null,musicTimer:ReturnType<typeof setInterval>|null=null;
const ducking=new Set<string>();
export function duckMusic(active:boolean,source='media'){if(active)ducking.add(source);else ducking.delete(source);}
function tone(frequency:number,duration:number,volume:number,delay=0){if(!context||context.state!=='running')return;const oscillator=context.createOscillator(),gain=context.createGain(),start=context.currentTime+delay;oscillator.type='sine';oscillator.frequency.value=frequency;gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(volume,start+.03);gain.gain.exponentialRampToValueAtTime(.001,start+duration);oscillator.connect(gain);gain.connect(context.destination);oscillator.start(start);oscillator.stop(start+duration+.05);}
function stopMusic(){if(musicTimer){clearInterval(musicTimer);musicTimer=null;}}
export function configureAudio(next:Settings){if(JSON.stringify(settings)===JSON.stringify(next))return;settings=next;stopMusic();if(!next.narration&&typeof window!=='undefined')window.speechSynthesis?.cancel();if(context?.state==='running')startMusic();}
function startMusic(){if(!settings.music||musicTimer)return;const notes=[261.63,329.63,392,329.63];let i=0;musicTimer=setInterval(()=>{if(typeof document!=='undefined'&&!document.hidden)tone(notes[i++%notes.length],2.5,settings.musicVolume*(ducking.size?.008:.045));},3000);}
export async function unlockAudio(){try{context??=new AudioContext();if(context.state==='suspended')await context.resume();startMusic();}catch{/* Audio is optional; text feedback always remains. */}}
export function audioSettings(){return settings;}
export function celebrate(complete=false){
  if(typeof window!=='undefined'&&complete)window.dispatchEvent(new CustomEvent('curio-celebration',{detail:{style:settings.celebration}}));
  if(!settings.effects||settings.celebration==='silent'||settings.celebration==='minimal')return;
  const notes=complete?(settings.celebration==='energetic'?[523.25,659.25,783.99,1046.5]:[523.25,659.25,783.99]):settings.sound==='sparkle'?[783.99,1046.5]:[523.25,659.25];
  const gentle=settings.celebration==='gentle';notes.forEach((n,i)=>tone(n,gentle?.5:.4,gentle?.02:.04,i*(gentle?.2:.13)));
  if(settings.sound==='cheer'&&complete&&settings.narration){const u=new SpeechSynthesisUtterance('You kept exploring. Quest complete!');u.volume=settings.voiceVolume;window.speechSynthesis?.speak(u);}
}
export function quietAudio(){stopMusic();void context?.suspend();if(typeof window!=='undefined')window.speechSynthesis?.cancel();}
