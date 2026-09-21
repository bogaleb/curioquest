/**
 * The quest buddies, drawn.
 *
 * A child picks which explorer they are by finding their own buddy, so the six have to be
 * tellable apart by silhouette alone — ears, mostly — by someone who cannot read their own
 * name yet. The emoji the profile data still stores (`🦊`) belongs to the parent screens;
 * a child surface never shows one (§G).
 *
 * Provisional geometry. WP-11 replaces these with the commissioned cast.
 */
type BuddyProps = { className?: string };

const base = {
  viewBox: "0 0 48 48",
  "aria-hidden": true as const,
  focusable: "false" as const,
};

const face = "kid-buddy-face";
const mark = "kid-buddy-mark";

/** Fox: pointed ears set wide, narrow muzzle. */
function Fox({ className }: BuddyProps) {
  return (
    <svg {...base} className={className}>
      <path d="M6 8l10 8-6 8zM42 8L32 16l6 8z" className={face} />
      <path d="M24 12c10 0 16 8 16 16S33 44 24 44 8 36 8 28s6-16 16-16z" className={face} />
      <path d="M24 30l-5 4h10z" className={mark} />
      <circle cx="17" cy="26" r="2.4" className={mark} />
      <circle cx="31" cy="26" r="2.4" className={mark} />
    </svg>
  );
}

/** Rabbit: two tall ears. */
function Rabbit({ className }: BuddyProps) {
  return (
    <svg {...base} className={className}>
      <rect x="14" y="2" width="7" height="20" rx="3.5" className={face} />
      <rect x="27" y="2" width="7" height="20" rx="3.5" className={face} />
      <circle cx="24" cy="32" r="14" className={face} />
      <circle cx="19" cy="30" r="2.2" className={mark} />
      <circle cx="29" cy="30" r="2.2" className={mark} />
      <circle cx="24" cy="36" r="2.6" className={mark} />
    </svg>
  );
}

/** Bear: small round ears sitting close to the head. */
function Bear({ className }: BuddyProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="11" cy="14" r="7" className={face} />
      <circle cx="37" cy="14" r="7" className={face} />
      <circle cx="24" cy="28" r="16" className={face} />
      <circle cx="18" cy="25" r="2.4" className={mark} />
      <circle cx="30" cy="25" r="2.4" className={mark} />
      <ellipse cx="24" cy="33" rx="5" ry="4" className={mark} />
    </svg>
  );
}

/** Owl: ear tufts and two very large eyes. */
function Owl({ className }: BuddyProps) {
  return (
    <svg {...base} className={className}>
      <path d="M8 10l8 6-10 4zM40 10l-8 6 10 4z" className={face} />
      <path d="M24 8c9 0 15 7 15 17S32 44 24 44 9 35 9 25 15 8 24 8z" className={face} />
      <circle cx="18" cy="24" r="6" className={mark} />
      <circle cx="30" cy="24" r="6" className={mark} />
      <path d="M24 30l-3 5h6z" className={mark} />
    </svg>
  );
}

/** Panda: round ears, dark patches — the eyes are the silhouette. */
function Panda({ className }: BuddyProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="10" cy="12" r="7" className={mark} />
      <circle cx="38" cy="12" r="7" className={mark} />
      <circle cx="24" cy="28" r="16" className={face} />
      <ellipse cx="17" cy="25" rx="5" ry="6" className={mark} />
      <ellipse cx="31" cy="25" rx="5" ry="6" className={mark} />
      <circle cx="24" cy="34" r="3" className={mark} />
    </svg>
  );
}

/** Lion: a mane all the way round. */
function Lion({ className }: BuddyProps) {
  return (
    <svg {...base} className={className}>
      <path
        d="M24 2l5 5 7-2 1 7 7 2-4 6 4 6-7 2-1 7-7-2-5 5-5-5-7 2-1-7-7-2 4-6-4-6 7-2 1-7 7 2z"
        className={mark}
      />
      <circle cx="24" cy="26" r="11" className={face} />
      <circle cx="20" cy="24" r="2" className={mark} />
      <circle cx="28" cy="24" r="2" className={mark} />
      <path d="M24 29l-4 3h8z" className={mark} />
    </svg>
  );
}

const buddies: Record<string, (props: BuddyProps) => React.ReactElement> = {
  fox: Fox,
  rabbit: Rabbit,
  bear: Bear,
  owl: Owl,
  panda: Panda,
  lion: Lion,
};

export function BuddyArt({ id, className = "kid-buddy-art" }: { id: string | undefined; className?: string }) {
  const Buddy = buddies[id ?? "fox"] ?? Fox;
  return <Buddy className={className} />;
}
