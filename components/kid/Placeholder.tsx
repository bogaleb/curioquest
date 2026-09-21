/**
 * The drawn marks the child layer is allowed to use before there is an illustrator.
 *
 * Three rules sit behind this file. No emoji, because an emoji is a different artist's
 * work in a different style and it makes an unfinished screen look finished (§G). No
 * icon library, because a 1.5px Lucide stroke belongs to a web dashboard, not to a
 * four-year-old. And no picture carries meaning on its own — every mark here appears
 * next to a word or inside a control that already has an accessible name.
 */

/**
 * Art that does not exist yet. Grey on purpose: the gap has to stay visible to
 * everyone who looks at the screen, including whoever is deciding what to commission.
 */
export function Placeholder({ label }: { label?: string }) {
  return (
    <svg
      className="kid-placeholder"
      viewBox="0 0 64 48"
      role={label ? "img" : "presentation"}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <rect className="kid-placeholder-fill" x="1" y="1" width="62" height="46" rx="8" />
      <rect className="kid-placeholder-line" x="1" y="1" width="62" height="46" rx="8" strokeDasharray="6 5" />
      {/* A horizon and a hill: enough shape to read as "a picture goes here". */}
      <path className="kid-placeholder-line" d="M6 34h52M18 34c4-9 9-13 14-13s10 4 14 13" />
      <circle className="kid-placeholder-line" cx="44" cy="15" r="5" />
    </svg>
  );
}

/** "Say that again." A speaker with two waves — the one glyph pre-readers already know. */
export function SpeakerMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M15.4 9a4.2 4.2 0 0 1 0 6M18.2 6.4a8 8 0 0 1 0 11.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Correct. A drawn check, so "right" is not carried by green alone. */
export function RightMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M5 13.2 9.6 18 19 6.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Not yet. An arrow curving back to the start, never a cross: the child is being
 * invited to go round again, which is what actually happens next.
 */
export function NotYetMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M19 12a7 7 0 1 1-2.6-5.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M17.2 2.6v4.2h-4.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * The way back to the map: an arch with a path leading into it.
 *
 * Drawn rather than an arrow, because an arrow means "previous" to an adult and nothing in
 * particular to a four-year-old, while a door is a place you can walk through.
 */
export function DoorMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M5 21V10a7 7 0 0 1 14 0v11"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M9.5 21v-7a2.5 2.5 0 0 1 5 0v7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path d="M3 21h18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}
