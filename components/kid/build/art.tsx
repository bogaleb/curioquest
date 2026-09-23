import type { Heading, MapTile } from "@/lib/build/types";

/**
 * The Build Yard's drawings. Every piece is drawn in a 100×100 box and coloured by
 * class, so the palette lives in `app/kid.css` with the rest of the child layer and a
 * tile reads the same in every workshop it appears in.
 */

export function RobotArt({ heading = "E" }: { heading?: Heading }) {
  const turn = { N: -90, E: 0, S: 90, W: 180 }[heading];
  return (
    <svg viewBox="0 0 100 100" className="build-art build-robot" aria-hidden="true">
      <g transform={`rotate(${turn} 50 50)`}>
        <rect className="robot-wheel" x="18" y="14" width="44" height="12" rx="6" />
        <rect className="robot-wheel" x="18" y="74" width="44" height="12" rx="6" />
        <rect className="robot-body" x="14" y="22" width="60" height="56" rx="16" />
        <rect className="robot-face" x="44" y="32" width="24" height="36" rx="9" />
        <circle className="robot-eye" cx="58" cy="42" r="5" />
        <circle className="robot-eye" cx="58" cy="58" r="5" />
        <path className="robot-nose" d="M74 40 L90 50 L74 60 Z" />
        <circle className="robot-light" cx="28" cy="50" r="6" />
      </g>
    </svg>
  );
}

export function FlagArt() {
  return (
    <svg viewBox="0 0 100 100" className="build-art" aria-hidden="true">
      <rect className="flag-pole" x="30" y="14" width="6" height="74" rx="3" />
      <path className="flag-cloth" d="M36 16 C52 10 60 26 78 20 L78 48 C60 54 52 38 36 44 Z" />
      <ellipse className="flag-base" cx="33" cy="88" rx="16" ry="5" />
    </svg>
  );
}

export function RockArt() {
  return (
    <svg viewBox="0 0 100 100" className="build-art" aria-hidden="true">
      <path className="rock" d="M16 78 C12 58 26 36 44 30 C62 22 84 38 86 60 C88 76 76 84 50 84 C30 84 18 84 16 78 Z" />
      <path className="rock-shine" d="M40 42 C46 38 54 38 58 42" fill="none" />
    </svg>
  );
}

export function GemArt() {
  return (
    <svg viewBox="0 0 100 100" className="build-art" aria-hidden="true">
      <path className="gem" d="M30 34 L42 22 L58 22 L70 34 L50 80 Z" />
      <path className="gem-facet" d="M30 34 L70 34 M42 22 L50 34 L58 22 M50 34 L50 80" fill="none" />
    </svg>
  );
}

/** One drawing per map tile. Water and land are the ground; the rest stand on it. */
export function MapTileArt({ tile }: { tile: MapTile }) {
  switch (tile) {
    case "water":
      return (
        <svg viewBox="0 0 100 100" className="build-art" aria-hidden="true">
          <path className="water-wave" d="M14 40 q9 -8 18 0 t18 0 t18 0 t18 0 M14 64 q9 -8 18 0 t18 0 t18 0 t18 0" fill="none" />
        </svg>
      );
    case "land":
      return (
        <svg viewBox="0 0 100 100" className="build-art" aria-hidden="true">
          <path className="grass-tuft" d="M30 70 l4 -12 l4 12 M62 46 l4 -12 l4 12" fill="none" />
        </svg>
      );
    case "tree":
      return (
        <svg viewBox="0 0 100 100" className="build-art" aria-hidden="true">
          <rect className="trunk" x="45" y="56" width="10" height="30" rx="3" />
          <circle className="leaves" cx="50" cy="40" r="26" />
          <circle className="leaves-light" cx="42" cy="32" r="8" />
        </svg>
      );
    case "house":
      return (
        <svg viewBox="0 0 100 100" className="build-art" aria-hidden="true">
          <rect className="wall" x="22" y="46" width="56" height="40" rx="3" />
          <path className="roof" d="M14 50 L50 16 L86 50 Z" />
          <rect className="door" x="44" y="62" width="14" height="24" rx="2" />
          <rect className="window" x="28" y="56" width="11" height="11" rx="2" />
        </svg>
      );
    case "school":
      return (
        <svg viewBox="0 0 100 100" className="build-art" aria-hidden="true">
          <rect className="wall school-wall" x="14" y="40" width="72" height="46" rx="3" />
          <path className="roof" d="M10 44 L50 20 L90 44 Z" />
          <rect className="flag-pole" x="48" y="6" width="4" height="18" />
          <path className="flag-cloth" d="M52 6 L66 11 L52 16 Z" />
          <rect className="door" x="43" y="62" width="14" height="24" rx="2" />
          <rect className="window" x="22" y="52" width="12" height="12" rx="2" />
          <rect className="window" x="66" y="52" width="12" height="12" rx="2" />
        </svg>
      );
    case "mountain":
      return (
        <svg viewBox="0 0 100 100" className="build-art" aria-hidden="true">
          <path className="mountain" d="M8 86 L40 24 L58 56 L68 40 L94 86 Z" />
          <path className="snow" d="M32 40 L40 24 L48 40 L44 44 L40 38 L36 44 Z" />
        </svg>
      );
    case "road":
      return (
        <svg viewBox="0 0 100 100" className="build-art" aria-hidden="true">
          <rect className="road" x="0" y="0" width="100" height="100" />
          <path className="road-line" d="M20 50 H40 M60 50 H80" fill="none" />
        </svg>
      );
    case "bridge":
      return (
        <svg viewBox="0 0 100 100" className="build-art" aria-hidden="true">
          <path className="bridge-arch" d="M0 30 H100 V70 H84 C84 48 16 48 16 70 H0 Z" />
          <path className="bridge-rail" d="M0 30 H100" fill="none" />
        </svg>
      );
    case "treasure":
      return (
        <svg viewBox="0 0 100 100" className="build-art" aria-hidden="true">
          <rect className="chest" x="20" y="44" width="60" height="38" rx="5" />
          <path className="chest-lid" d="M20 48 C20 28 80 28 80 48 Z" />
          <rect className="chest-lock" x="44" y="48" width="12" height="14" rx="2" />
          <path className="treasure-x" d="M30 90 L42 98 M42 90 L30 98" fill="none" />
        </svg>
      );
    case "park":
      return (
        <svg viewBox="0 0 100 100" className="build-art" aria-hidden="true">
          <circle className="leaves" cx="30" cy="36" r="16" />
          <rect className="trunk" x="27" y="48" width="6" height="18" />
          <rect className="bench" x="46" y="60" width="40" height="7" rx="3" />
          <rect className="bench" x="50" y="67" width="5" height="14" />
          <rect className="bench" x="77" y="67" width="5" height="14" />
          <circle className="flower" cx="22" cy="82" r="5" />
          <circle className="flower" cx="40" cy="86" r="4" />
        </svg>
      );
    case "shop":
      return (
        <svg viewBox="0 0 100 100" className="build-art" aria-hidden="true">
          <rect className="wall" x="18" y="40" width="64" height="46" rx="3" />
          <path className="awning" d="M14 40 H86 L80 28 H20 Z" />
          <path className="awning-stripe" d="M32 28 L30 40 M50 28 V40 M68 28 L70 40" fill="none" />
          <rect className="window" x="26" y="52" width="20" height="16" rx="2" />
          <rect className="door" x="56" y="56" width="16" height="30" rx="2" />
        </svg>
      );
  }
}

export function CompassArt() {
  return (
    <svg viewBox="0 0 100 100" className="build-art build-compass" role="img" aria-label="Compass: north is up, south is down, east is right, west is left">
      <circle className="compass-face" cx="50" cy="50" r="44" />
      <path className="compass-north" d="M50 12 L58 50 L42 50 Z" />
      <path className="compass-south" d="M50 88 L58 50 L42 50 Z" />
      <text x="50" y="9" textAnchor="middle" className="compass-letter">N</text>
      <text x="50" y="99" textAnchor="middle" className="compass-letter">S</text>
      <text x="96" y="54" textAnchor="middle" className="compass-letter">E</text>
      <text x="5" y="54" textAnchor="middle" className="compass-letter">W</text>
    </svg>
  );
}

/** The four workshop signs on the yard. */
export function WorkshopArt({ workshop }: { workshop: "robot" | "map" | "tower" | "shapes" }) {
  switch (workshop) {
    case "robot":
      return <RobotArt heading="E" />;
    case "map":
      return (
        <svg viewBox="0 0 100 100" className="build-art" aria-hidden="true">
          <path className="map-paper" d="M10 20 L36 12 L64 22 L90 14 V80 L64 88 L36 78 L10 86 Z" />
          <path className="map-fold" d="M36 12 V78 M64 22 V88" fill="none" />
          <path className="map-island" d="M20 50 C18 38 32 34 38 42 C44 50 30 62 20 50 Z" />
          <path className="treasure-x" d="M66 44 L78 56 M78 44 L66 56" fill="none" />
          <path className="map-trail" d="M38 46 C48 40 56 58 66 50" fill="none" />
        </svg>
      );
    case "tower":
      return (
        <svg viewBox="0 0 100 100" className="build-art" aria-hidden="true">
          <rect className="block block-3" x="14" y="68" width="48" height="16" rx="3" />
          <rect className="block block-2" x="22" y="52" width="32" height="16" rx="3" />
          <rect className="block block-1" x="30" y="36" width="16" height="16" rx="3" />
          <rect className="block block-1" x="30" y="20" width="16" height="16" rx="3" />
          <path className="water-wave" d="M64 84 q6 -5 12 0 t12 0" fill="none" />
          <rect className="block block-3" x="54" y="56" width="40" height="12" rx="3" />
        </svg>
      );
    case "shapes":
      return (
        <svg viewBox="0 0 100 100" className="build-art" aria-hidden="true">
          <rect className="swatch-red" x="14" y="14" width="34" height="34" rx="4" />
          <rect className="swatch-blue" x="52" y="14" width="34" height="34" rx="4" />
          <rect className="swatch-yellow" x="14" y="52" width="34" height="34" rx="4" />
          <rect className="swatch-green" x="52" y="52" width="34" height="34" rx="4" />
        </svg>
      );
  }
}

/**
 * The yard's small control marks, drawn rather than borrowed from an icon library so they
 * share a stroke weight and a hand with the rest of the child layer.
 */
export type BuildIconName =
  | "up" | "down" | "left" | "right" | "turn-left" | "turn-right"
  | "play" | "clear" | "undo" | "erase" | "remove" | "idea" | "star" | "done" | "back" | "next" | "again";

const iconPaths: Record<BuildIconName, string> = {
  up: "M12 20 V5 M5 11 L12 4 L19 11",
  down: "M12 4 V19 M5 13 L12 20 L19 13",
  left: "M20 12 H5 M11 5 L4 12 L11 19",
  right: "M4 12 H19 M13 5 L20 12 L13 19",
  "turn-left": "M18 20 V12 C18 8 15 6 11 6 H5 M9 2 L5 6 L9 10",
  "turn-right": "M6 20 V12 C6 8 9 6 13 6 H19 M15 2 L19 6 L15 10",
  play: "M7 4 L20 12 L7 20 Z",
  clear: "M4 7 H20 M9 7 V4 H15 V7 M6 7 L7 20 H17 L18 7",
  undo: "M9 5 L4 10 L9 15 M4 10 H14 C18 10 20 13 20 16 C20 18 19 20 17 20",
  erase: "M14 4 L20 10 L10 20 H6 L3 17 Z M9 9 L15 15 M10 20 H21",
  remove: "M6 6 L18 18 M18 6 L6 18",
  idea: "M9 18 H15 M10 21 H14 M12 3 C8 3 5 6 5 10 C5 13 7 14 8 16 H16 C17 14 19 13 19 10 C19 6 16 3 12 3 Z",
  star: "M12 3 L14.6 9 L21 9.4 L16 13.6 L17.6 20 L12 16.4 L6.4 20 L8 13.6 L3 9.4 L9.4 9 Z",
  done: "M4 12 L10 18 L20 6",
  back: "M20 12 H5 M11 5 L4 12 L11 19",
  next: "M4 12 H19 M13 5 L20 12 L13 19",
  again: "M4 12 A8 8 0 1 0 7 6 M4 3 V8 H9",
};

export function BuildIcon({ name, size = 24 }: { name: BuildIconName; size?: number }) {
  const filled = name === "play" || name === "star";
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className="build-icon" data-filled={filled || undefined} aria-hidden="true">
      <path d={iconPaths[name]} />
    </svg>
  );
}
