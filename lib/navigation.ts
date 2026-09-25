import {
  BookOpen,
  Clapperboard,
  Compass,
  FlaskConical,
  Gamepad2,
  Globe,
  Heart,
  Leaf,
  Map as MapIcon,
  Palette,
  Star,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { KidWorld } from "./kid-worlds";

/**
 * Navigation described as data so one model can drive two very different surfaces.
 *
 * On Grown-ups it is a labelled sidebar, an icon rail or a tab bar — familiar web
 * patterns for a reader. On a child surface it is a drawn map: the same destinations,
 * placed at fixed coordinates and reached by touching a picture (WP-03). Adding a
 * destination should never mean touching layout code on either surface.
 */

/**
 * Where a destination sits on the child's map.
 *
 * Position is memory. A four-year-old learns "the grove is over there on the left" long
 * before they can read "Reading Adventure", so these coordinates never change and are
 * never reordered by recency or recommendation. Primary places sit low, where hands rest
 * on a tablet; secondary places sit higher up the picture, which reads as further away
 * and keeps them out of the first thing a child touches.
 */
export type Place = {
  /** Percentage across and down the map. Fixed. Not a layout hint — a landmark. */
  x: number;
  y: number;
  /** The hue this destination keeps everywhere: map, episode, reward. */
  world: KidWorld;
  /** What Nova says on the first touch. Child words, never a product name. */
  childName: string;
  /** A richer first-touch cue. The short childName remains the visible landmark label. */
  call?: string;
  /** How near it feels. Primary destinations are drawn large and close. */
  size: "large" | "small";
};
export type Destination = {
  /** Stable key, also the legacy view name. */
  id: string;
  /** Route segment this destination lives at. The home screen is the index route. */
  href: string;
  /** Used in the sidebar and the More sheet. */
  label: string;
  /** Used in the bottom tab bar and the icon rail, where space is tight. */
  shortLabel: string;
  icon: LucideIcon;
  /** Breadcrumb/title shown in the top bar for this destination. */
  title: string;
  /**
   * `primary` destinations are the five a child reaches constantly and are always one
   * tap away. Everything else lives one level down so the interface stays calm.
   */
  group: "primary" | "secondary";
  /** Only shown when the family has opted in to faith content. */
  requiresFaith?: boolean;
  /** Where this destination is drawn on the child's map. */
  place: Place;
};

export const destinations: Destination[] = [
  { id: "adventure", href: "/", label: "My adventure", shortLabel: "Today", icon: Compass, title: "My adventure", group: "primary",
    place: { x: 50, y: 62, world: "grove", childName: "The trail", call: "The trail. Start with Nova and try a little of everything.", size: "large" } },
  { id: "reading", href: "/read", label: "Reading Adventure", shortLabel: "Read", icon: BookOpen, title: "Reading Adventure", group: "primary",
    place: { x: 10, y: 62, world: "grove", childName: "Reading grove", call: "Reading grove. Hear a sound, build a word, and read a tiny page.", size: "large" } },
  { id: "games", href: "/play", label: "Game Zone", shortLabel: "Play", icon: Gamepad2, title: "Game Zone", group: "primary",
    place: { x: 90, y: 62, world: "city", childName: "Playing field", call: "Playing field. Practice patterns, numbers, shapes, and memory.", size: "large" } },
  { id: "studio", href: "/create", label: "Creative Studio", shortLabel: "Create", icon: Palette, title: "Creative Studio", group: "primary",
    place: { x: 30, y: 86, world: "workshop", childName: "Making place", call: "Making place. Draw, write, color, and make something yours.", size: "large" } },
  { id: "myworld", href: "/world", label: "My World", shortLabel: "World", icon: Globe, title: "My World", group: "primary",
    place: { x: 70, y: 86, world: "treehouse", childName: "My treehouse", call: "My treehouse. Keep the things you earned and visit Creature Grove.", size: "large" } },

  { id: "science", href: "/science", label: "Discovery Lab", shortLabel: "Science", icon: FlaskConical, title: "Discovery Lab", group: "secondary",
    place: { x: 8, y: 34, world: "lab", childName: "Wonder lab", call: "Wonder lab. Predict, test, and explain what changed.", size: "small" } },
  { id: "stories", href: "/stories", label: "Story Harbor", shortLabel: "Stories", icon: BookOpen, title: "Story Harbor", group: "secondary",
    place: { x: 92, y: 36, world: "harbor", childName: "Story harbour", call: "Story harbour. Open a story and choose what to notice.", size: "small" } },
  { id: "theater", href: "/theater", label: "Theater", shortLabel: "Theater", icon: Clapperboard, title: "CurioQuest Theater", group: "secondary",
    place: { x: 72, y: 10, world: "harbor", childName: "The theatre", call: "The theatre. Watch a little scene and answer along the way.", size: "small" } },
  { id: "worlds", href: "/worlds", label: "My worlds", shortLabel: "Worlds", icon: MapIcon, title: "My worlds", group: "secondary",
    place: { x: 44, y: 10, world: "grove", childName: "The far hills", call: "The far hills. Choose a learning world and follow its trail.", size: "small" } },
  { id: "garden", href: "/build", label: "Build Yard", shortLabel: "Build", icon: Leaf, title: "Build Yard", group: "secondary",
    place: { x: 16, y: 10, world: "workshop", childName: "Build yard", call: "Build yard. Plan routes, stack blocks, and make shapes fit.", size: "small" } },
  { id: "team", href: "/team", label: "Team Quest", shortLabel: "Team", icon: Users, title: "Team Quest", group: "secondary",
    place: { x: 70, y: 36, world: "city", childName: "Team camp", call: "Team camp. Take turns and solve something together.", size: "small" } },
  { id: "rewards", href: "/rewards", label: "Treasure chest", shortLabel: "Rewards", icon: Star, title: "Treasure chest", group: "secondary",
    place: { x: 34, y: 34, world: "treehouse", childName: "My chest", call: "My chest. See the badges and treasures you have earned.", size: "small" } },
  { id: "faith", href: "/faith", label: "Faith & Bible", shortLabel: "Faith", icon: Heart, title: "Faith & Bible", group: "secondary", requiresFaith: true,
    place: { x: 52, y: 34, world: "harbor", childName: "Quiet garden", call: "Quiet garden. Read, pray, and wonder with your family.", size: "small" } },
];


const byId = new Map(destinations.map((destination) => [destination.id, destination]));

/** Destinations that are modes or gated areas rather than navigation entries. */
const extra: Record<string, { title: string; href: string }> = {
  discoveries: { title: "Discovery Library", href: "/discover" },
  "daily-adventure": { title: "Today’s Adventure", href: "/today" },
  parent: { title: "Parent corner", href: "/parent" },
};

export function destinationTitle(id: string) {
  return byId.get(id)?.title ?? extra[id]?.title ?? "CurioQuest";
}

/** The route a destination id lives at. */
export function destinationHref(id: string) {
  return byId.get(id)?.href ?? extra[id]?.href ?? "/";
}

const byHref = new Map<string, string>([
  ...destinations.map((destination) => [destination.href, destination.id] as const),
  ...Object.entries(extra).map(([id, meta]) => [meta.href, id] as const),
]);

/** The destination id a pathname represents, for highlighting the active nav item. */
export function destinationForPath(pathname: string) {
  return byHref.get(pathname === "" ? "/" : pathname) ?? "adventure";
}

export function availableDestinations(options: { faith: boolean }) {
  return destinations.filter((destination) => !destination.requiresFaith || options.faith);
}

export function primaryDestinations(options: { faith: boolean }) {
  return availableDestinations(options).filter((destination) => destination.group === "primary");
}

export function secondaryDestinations(options: { faith: boolean }) {
  return availableDestinations(options).filter((destination) => destination.group === "secondary");
}

export function isDestination(id: string) {
  return byId.has(id);
}

export function destinationFor(id: string) {
  return byId.get(id);
}

/**
 * Every place drawn on the child's map, near ones first.
 *
 * Deliberately not sorted by recency, progress or recommendation: the map is a memory
 * aid, and a landmark that moves is not a landmark.
 */
export function mapPlaces(options: { faith: boolean }) {
  return availableDestinations(options)
    .filter((destination) => destination.id !== "adventure")
    .sort((a, b) => b.place.y - a.place.y);
}
