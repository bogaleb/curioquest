import type { DiscoverySource } from "./types";

export function discoverySource(profile: string): DiscoverySource {
  return {
    async load(signal) {
      const response = await fetch(`/api/discover?profile=${encodeURIComponent(profile)}`, { signal: AbortSignal.any([signal, AbortSignal.timeout(20000)]) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "The discoveries could not load.");
      return body;
    },
    async attempt(input) {
      const response = await fetch("/api/discover", { method: "POST", headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(20000), body: JSON.stringify({ ...input, profile }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Your practice could not be saved.");
      return body;
    },
  };
}
