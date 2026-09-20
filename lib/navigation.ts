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

/**
 * Navigation described as data so one model can drive three presentations: the
 * labelled sidebar on desktop, the icon rail on tablet, and the bottom tab bar plus
 * "More" sheet on phones. Adding a destination should never mean touching layout code.
 */
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
};

export const destinations: Destination[] = [
  { id: "adventure", href: "/", label: "My adventure", shortLabel: "Today", icon: Compass, title: "My adventure", group: "primary" },
  { id: "reading", href: "/read", label: "Reading Adventure", shortLabel: "Read", icon: BookOpen, title: "Reading Adventure", group: "primary" },
  { id: "games", href: "/play", label: "Game Zone", shortLabel: "Play", icon: Gamepad2, title: "Game Zone", group: "primary" },
  { id: "studio", href: "/create", label: "Creative Studio", shortLabel: "Create", icon: Palette, title: "Creative Studio", group: "primary" },
  { id: "myworld", href: "/world", label: "My World", shortLabel: "World", icon: Globe, title: "My World", group: "primary" },

  { id: "science", href: "/science", label: "Discovery Lab", shortLabel: "Science", icon: FlaskConical, title: "Discovery Lab", group: "secondary" },
  { id: "stories", href: "/stories", label: "Story Harbor", shortLabel: "Stories", icon: BookOpen, title: "Story Harbor", group: "secondary" },
  { id: "theater", href: "/theater", label: "Theater", shortLabel: "Theater", icon: Clapperboard, title: "CurioQuest Theater", group: "secondary" },
  { id: "worlds", href: "/worlds", label: "My worlds", shortLabel: "Worlds", icon: MapIcon, title: "My worlds", group: "secondary" },
  { id: "garden", href: "/build", label: "Build Lab", shortLabel: "Build", icon: Leaf, title: "Build Lab", group: "secondary" },
  { id: "team", href: "/team", label: "Team Quest", shortLabel: "Team", icon: Users, title: "Team Quest", group: "secondary" },
  { id: "rewards", href: "/rewards", label: "Treasure chest", shortLabel: "Rewards", icon: Star, title: "Treasure chest", group: "secondary" },
  { id: "faith", href: "/faith", label: "Faith & Bible", shortLabel: "Faith", icon: Heart, title: "Faith & Bible", group: "secondary", requiresFaith: true },
];

const byId = new Map(destinations.map((destination) => [destination.id, destination]));

/** Destinations that are modes or gated areas rather than navigation entries. */
const extra: Record<string, { title: string; href: string }> = {
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
