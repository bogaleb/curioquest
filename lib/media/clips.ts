import type { CastId } from "@/lib/character/director";

/**
 * The hero clip library — short character videos for the big moments.
 *
 * Clips live in `public/media/clips/<id>.mp4` in dev. In production they are
 * served from Supabase Storage (`curriculum-media` bucket); set
 * `NEXT_PUBLIC_CLIP_CDN` to the storage public URL prefix and `clipUrl`
 * resolves there first, falling back to the local path.
 *
 * Every clip has a caption so the moment still lands when the video cannot
 * load — the live SVG puppet always covers.
 */

export type ClipKind = "welcome" | "intro" | "teaching" | "transition" | "celebration" | "calm" | "encourage" | "goodbye";

export type ClipMeta = {
  id: string;
  title: string;
  kind: ClipKind;
  who: CastId;
  /** What the moment means, spoken/shown when the video is unavailable. */
  caption: string;
  /** Interaction cue for the child while the clip plays. */
  cue: string;
};

export const CLIP_CATALOG: Record<string, ClipMeta> = {
  "curio-welcome": {
    id: "curio-welcome",
    title: "Curio welcomes you",
    kind: "welcome",
    who: "curio",
    caption: "Hello, explorer! I'm Curio. Ready for an adventure?",
    cue: "Wave back at Curio!",
  },
  "nova-intro": {
    id: "nova-intro",
    title: "Nova's mystery",
    kind: "intro",
    who: "nova",
    caption: "Come on — there's a mystery in the forest, and I need your help.",
    cue: "Follow Nova into the story.",
  },
  "luna-intro": {
    id: "luna-intro",
    title: "Luna's reading time",
    kind: "intro",
    who: "luna",
    caption: "Let's read together. I'll help you with every letter.",
    cue: "Say the letters with Luna.",
  },
  "milo-intro": {
    id: "milo-intro",
    title: "Milo's number lab",
    kind: "intro",
    who: "milo",
    caption: "One, two, three! Counting is my favorite game.",
    cue: "Count along with Milo.",
  },
  "bea-intro": {
    id: "bea-intro",
    title: "Bea's garden",
    kind: "intro",
    who: "bea",
    caption: "Look what I found growing! Nature is full of surprises.",
    cue: "Tell Bea what you notice.",
  },
  "tuno-intro": {
    id: "tuno-intro",
    title: "Meet Tuno",
    kind: "intro",
    who: "tuno",
    caption: "Hello. I'm Tuno. When big feelings come, we'll slow down together.",
    cue: "Say hello to Tuno.",
  },
  "tuno-breathing": {
    id: "tuno-breathing",
    title: "Breathe with Tuno",
    kind: "calm",
    who: "tuno",
    caption: "Slow and steady. Breathe in with me… and out. There's no hurry.",
    cue: "Breathe in… and out, with Tuno.",
  },
  "riff-intro": {
    id: "riff-intro",
    title: "Riff's rhythm",
    kind: "intro",
    who: "riff",
    caption: "Clap, clap! Can you copy my rhythm?",
    cue: "Clap it back to Riff!",
  },
  "atlas-intro": {
    id: "atlas-intro",
    title: "Atlas's big world",
    kind: "intro",
    who: "atlas",
    caption: "The world is so big and wonderful. Where shall we go today?",
    cue: "Point to a place on the globe.",
  },
  "cast-finale": {
    id: "cast-finale",
    title: "The whole crew celebrates",
    kind: "celebration",
    who: "curio",
    caption: "We did it — all of us, together! You were amazing.",
    cue: "Dance with the whole crew!",
  },
  "curio-celebrate": {
    id: "curio-celebrate",
    title: "Curio cheers for you",
    kind: "celebration",
    who: "curio",
    caption: "You did it! I'm so proud of you, explorer!",
    cue: "Cheer with Curio!",
  },
  "nova-highfive": {
    id: "nova-highfive",
    title: "High five, Nova!",
    kind: "celebration",
    who: "nova",
    caption: "High five! We make a great team!",
    cue: "Give Nova a high five!",
  },
  "luna-praise": {
    id: "luna-praise",
    title: "Luna is proud",
    kind: "celebration",
    who: "luna",
    caption: "You read it! Every letter, all by yourself.",
    cue: "Take a bow with Luna.",
  },
  "milo-dance": {
    id: "milo-dance",
    title: "Milo's happy dance",
    kind: "celebration",
    who: "milo",
    caption: "Beep boop — I mean, amazing counting!",
    cue: "Dance like a robot with Milo!",
  },
  "tuno-proud": {
    id: "tuno-proud",
    title: "Tuno's quiet cheer",
    kind: "celebration",
    who: "tuno",
    caption: "Slow and steady wins. I'm proud of you.",
    cue: "Take a calm breath with Tuno.",
  },
  "bea-celebrate": {
    id: "bea-celebrate",
    title: "Bea's honey dance",
    kind: "celebration",
    who: "bea",
    caption: "Buzz buzz — you grew that idea all by yourself!",
    cue: "Buzz and wiggle with Bea!",
  },
  "riff-celebrate": {
    id: "riff-celebrate",
    title: "Riff's victory riff",
    kind: "celebration",
    who: "riff",
    caption: "That's music to my ears! You nailed it!",
    cue: "Clap the rhythm with Riff!",
  },
  "atlas-celebrate": {
    id: "atlas-celebrate",
    title: "Atlas's big cheer",
    kind: "celebration",
    who: "atlas",
    caption: "You remembered! What a wonderful explorer you are.",
    cue: "Stomp gently with Atlas!",
  },
  // --- Teaching moments: replayable, one per skill -------------------------
  "luna-letter-trace": {
    id: "luna-letter-trace",
    title: "Trace a letter with Luna",
    kind: "teaching",
    who: "luna",
    caption: "Watch my wing — down, down, across. Now you trace it in the air!",
    cue: "Trace the letter in the air.",
  },
  "milo-counting": {
    id: "milo-counting",
    title: "Count with Milo",
    kind: "teaching",
    who: "milo",
    caption: "One apple, two apples, three! How many do you see?",
    cue: "Count the apples with Milo.",
  },
  "bea-growth": {
    id: "bea-growth",
    title: "How a seed grows",
    kind: "teaching",
    who: "bea",
    caption: "First a sprout, then leaves, then a flower! What changed?",
    cue: "Tell Bea what changed.",
  },
  "riff-copy-rhythm": {
    id: "riff-copy-rhythm",
    title: "Copy Riff's rhythm",
    kind: "teaching",
    who: "riff",
    caption: "Stomp, clap, clap! Now you try — copy my rhythm!",
    cue: "Copy the rhythm back!",
  },
  "atlas-continents": {
    id: "atlas-continents",
    title: "Three places on the globe",
    kind: "teaching",
    who: "atlas",
    caption: "Three glowing places! Which one would you visit first?",
    cue: "Point to the place you like.",
  },
  // --- Transitions: moving between worlds ----------------------------------
  "nova-entry": {
    id: "nova-entry",
    title: "Nova enters the learning world",
    kind: "transition",
    who: "nova",
    caption: "Come on — the learning world is waiting!",
    cue: "Follow Nova in!",
  },
  "portal-forest": {
    id: "portal-forest",
    title: "Through the forest portal",
    kind: "transition",
    who: "curio",
    caption: "Through the branches — into the forest of stories!",
    cue: "Step through the portal!",
  },
  "portal-ocean": {
    id: "portal-ocean",
    title: "Dive into the ocean world",
    kind: "transition",
    who: "bea",
    caption: "The waves are parting! Let's see what's underneath!",
    cue: "Dive in!",
  },
  "portal-space": {
    id: "portal-space",
    title: "Rocket to the space world",
    kind: "transition",
    who: "milo",
    caption: "Three, two, one — blast off to the planets!",
    cue: "Count down with Milo!",
  },
  "meadow-hub": {
    id: "meadow-hub",
    title: "Home meadow",
    kind: "transition",
    who: "curio",
    caption: "Welcome home to the meadow. Where shall we explore today?",
    cue: "Choose a portal!",
  },
  // --- Encouragement: being wrong is survivable --------------------------------
  "nova-try-again": {
    id: "nova-try-again",
    title: "Nova tries again",
    kind: "encourage",
    who: "nova",
    caption: "Oops — that one tricked me too! Let's try again together.",
    cue: "Try again with Nova!",
  },
  // --- Farewell: the session ends warm -----------------------------------------
  "curio-goodbye": {
    id: "curio-goodbye",
    title: "Curio says goodbye",
    kind: "goodbye",
    who: "curio",
    caption: "What an adventure! I'll be right here when you come back.",
    cue: "Wave goodbye to Curio!",
  },
};

const CDN = process.env.NEXT_PUBLIC_CLIP_CDN?.replace(/\/$/, "");

/** Resolve the playable URL for a clip id. Null when the clip is unknown. */
export function clipUrl(id: string): string | null {
  if (!CLIP_CATALOG[id]) return null;
  const file = `${id}.mp4`;
  return CDN ? `${CDN}/${file}` : `/media/clips/${file}`;
}

/** Look up a clip's metadata. Null when the clip is unknown. */
export function clipMeta(id: string): ClipMeta | null {
  return CLIP_CATALOG[id] ?? null;
}
