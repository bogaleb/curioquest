'use client';
import {StoryStation} from '@/components/kid/art/stations';

/**
 * The way into the Reading Grove from elsewhere in the app.
 *
 * Was 🦊 📚 and an ALL-CAPS `NOVA'S READING ADVENTURE` kicker above the heading, with a
 * Lucide book at the end — three different artists' work in one control, two of them
 * banned on a child surface (§A). It is one drawing now: the open book on a stump that
 * marks the Story Trail station inside the grove, so the way in and the place it leads to
 * look like the same place.
 */
export function ReadingInvitation({onOpen}:{onOpen:()=>void}){
  return (
    <button className="reading-invitation" onClick={onOpen}>
      <span aria-hidden="true" className="reading-invitation-mark"><StoryStation/></span>
      <span>
        <strong>Little sounds. Big discoveries.</strong>
        <span>Meet a letter, join the train, and build your first words.</span>
      </span>
    </button>
  );
}
