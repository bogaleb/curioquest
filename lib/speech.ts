import {audioSettings,duckMusic} from './audio';
export function readAloud(text: string) {
  if(!audioSettings().narration)return;
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.85;
  utterance.volume=audioSettings().voiceVolume;
  utterance.onstart=()=>duckMusic(true,'voice');
  utterance.onend=utterance.onerror=()=>duckMusic(false,'voice');
  window.speechSynthesis.speak(utterance);
}
