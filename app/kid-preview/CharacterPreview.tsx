"use client";

import { useState } from 'react';
import { CharacterCorner } from '@/components/experience/CharacterCorner';
import { ClipComfortContext } from '@/components/experience/CharacterClip';
import { routeClips } from '@/lib/character-clips';

export function CharacterPreview() {
  const [route, setRoute] = useState('/read');
  const [paused, setPaused] = useState(false);
  const [offline, setOffline] = useState(false);
  const [narration, setNarration] = useState(true);
  return <main className="preview-page"><div className="preview-bar">
    <label>Section <select value={route} onChange={event => setRoute(event.target.value)}>{Object.keys(routeClips).map(path => <option key={path} value={path}>{path}</option>)}</select></label>
    <label><input type="checkbox" checked={paused} onChange={event => setPaused(event.target.checked)}/>Paused</label>
    <label><input type="checkbox" checked={offline} onChange={event => setOffline(event.target.checked)}/>Offline</label>
    <label><input type="checkbox" checked={narration} onChange={event => setNarration(event.target.checked)}/>Narration</label>
  </div><ClipComfortContext.Provider value={{ paused, offline, narration }}><CharacterCorner key={route} route={route}/></ClipComfortContext.Provider></main>;
}
