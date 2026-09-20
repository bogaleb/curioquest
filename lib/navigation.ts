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
  id: string;
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
  { id: "adventure", label: "My adventure", shortLabel: "Today", icon: Compass, title: "My adventure", group: "primary" },
  { id: "reading", label: "Reading Adventure", shortLabel: "Read", icon: BookOpen, title: "Reading Adventure", group: "primary" },
  { id: "games", label: "Game Zone", shortLabel: "Play", icon: Gamepad2, title: "Game Zone", group: "primary" },
  { id: "studio", label: "Creative Studio", shortLabel: "Create", icon: Palette, title: "Creative Studio", group: "primary" },
  { id: "myworld", label: "My World", shortLabel: "World", icon: Globe, title: "My World", group: "primary" },

  { id: "science", label: "Discovery Lab", shortLabel: "Science", icon: FlaskConical, title: "Discovery Lab", group: "secondary" },
  { id: "stories", label: "Story Harbor", shortLabel: "Stories", icon: BookOpen, title: "Story Harbor", group: "secondary" },
  { id: "theater", label: "Theater", shortLabel: "Theater", icon: Clapperboard, title: "CurioQuest Theater", group: "secondary" },
  { id: "worlds", label: "My worlds", shortLabel: "Worlds", icon: MapIcon, title: "My worlds", group: "secondary" },
  { id: "garden", label: "Build Lab", shortLabel: "Build", icon: Leaf, title: "Build Lab", group: "secondary" },
  { id: "team", label: "Team Quest", shortLabel: "Team", icon: Users, title: "Team Quest", group: "secondary" },
  { id: "rewards", label: "Treasure chest", shortLabel: "Rewards", icon: Star, title: "Treasure chest", group: "secondary" },
  { id: "faith", label: "Faith & Bible", shortLabel: "Faith", icon: Heart, title: "Faith & Bible", group: "secondary", requiresFaith: true },
];

const byId = new Map(destinations.map((destination) => [destination.id, destination]));

/** Titles for destinations that are not in the navigation model (modes, not places). */
const extraTitles: Record<string, string> = {
  "daily-adventure": "Today’s Adventure",
  parent: "Parent corner",
};

export function destinationTitle(id: string) {
  return byId.get(id)?.title ?? extraTitles[id] ?? "CurioQuest";
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
