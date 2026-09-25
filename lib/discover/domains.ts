import type { DiscoveryDomain } from "./types";

export const discoveryDomains: { id: DiscoveryDomain; label: string; invitation: string; href: string }[] = [
  { id: "reading", label: "Words & stories", invitation: "Listen, imagine, read.", href: "/read" },
  { id: "math", label: "Numbers & shapes", invitation: "Make sense of more.", href: "/play" },
  { id: "science", label: "Our amazing world", invitation: "Wonder. Try. Find out.", href: "/science" },
  { id: "logic", label: "Think & build", invitation: "Small steps, big ideas.", href: "/build" },
  { id: "world", label: "Places & people", invitation: "Explore a little further.", href: "/worlds" },
  { id: "wellbeing", label: "Me & my friends", invitation: "Listen, care, connect.", href: "/team" },
];
