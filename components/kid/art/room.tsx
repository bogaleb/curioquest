/**
 * The inside of the treehouse (WP-11 §3.4).
 *
 * One drawing, sized to its container, with the three places a child can put something
 * left deliberately empty — the buttons that fill them are positioned over this by
 * `app/kid.css`, so the room is scenery and the slots are controls, and neither has to
 * know about the other.
 *
 * The window matters more than it looks. It shows the same valley the map is set in —
 * the same hills, the same canopy colours — so a child can see that their room is *in*
 * the world they have been walking around, rather than a separate screen about it.
 *
 * Light comes from the window, which is on the left, so every shadow in here falls to the
 * right. That is the opposite of the outdoor scenes, and it is the one place in the art
 * layer where that is correct: indoors, the light source is the hole in the wall.
 */
export function TreehouseRoom() {
  return (
    <svg
      className="kid-room-art"
      viewBox="0 0 1000 620"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      {/* Back wall, in planks. */}
      <rect className="kid-room-wall" x="0" y="0" width="1000" height="470" />
      <path
        className="kid-room-plank"
        d="M0 60h1000M0 130h1000M0 200h1000M0 270h1000M0 340h1000M0 410h1000"
      />

      {/* The window onto the valley. */}
      <rect className="kid-room-sky" x="600" y="70" width="330" height="240" rx="12" />
      <path className="kid-room-hill-far" d="M600 250c50-40 96-54 140-42 40 11 68 34 110 34 40 0 60-16 80-24v92H600z" />
      <path className="kid-room-hill" d="M600 286c56-26 104-32 150-18 38 12 66 26 106 24 30-2 50-10 74-16v34H600z" />
      <circle className="kid-room-sun" cx="860" cy="126" r="30" />
      <rect className="kid-room-frame" x="592" y="62" width="346" height="256" rx="14" />
      <path className="kid-room-frame-bar" d="M765 70v240M600 190h330" />

      {/* Roof beams overhead. */}
      <path className="kid-room-beam" d="M0 0h1000v34H0z" />
      <path className="kid-room-beam-deep" d="M120 34h34v70h-34zM846 34h34v70h-34z" />

      {/* The shelf on the left wall, under the light. */}
      <rect className="kid-room-timber" x="70" y="250" width="300" height="20" rx="6" />
      <path className="kid-room-timber-deep" d="M96 270h26v26H96zM318 270h26v26h-26z" />

      {/* The desk, standing on the floor. */}
      <rect className="kid-room-timber" x="370" y="392" width="300" height="24" rx="8" />
      <path className="kid-room-timber-deep" d="M396 416h28v84h-28zM616 416h28v84h-28z" />

      {/* The floor: boards running away from the viewer, and a rug. */}
      <rect className="kid-room-floor" x="0" y="470" width="1000" height="150" />
      <path
        className="kid-room-board"
        d="M0 470 90 620M180 470l40 150M360 470l14 150M540 470l-14 150M720 470l-40 150M900 470l-90 150"
      />
      <ellipse className="kid-room-rug" cx="500" cy="560" rx="230" ry="46" />
      <ellipse className="kid-room-rug-deep" cx="500" cy="560" rx="160" ry="30" />

      {/* Dust in the window light. Ambient, stopped under the motion preference. */}
      <g className="kid-room-motes">
        <circle cx="560" cy="200" r="4" />
        <circle cx="520" cy="300" r="3" />
        <circle cx="596" cy="360" r="3.5" />
      </g>
    </svg>
  );
}
