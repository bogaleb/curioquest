import {audioSettings} from './audio';
export function readAloud(text: string) {
  if(!audioSettings().narration)return;
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.85;
  utterance.volume=audioSettings().voiceVolume;
  window.speechSynthesis.speak(utterance);
}
