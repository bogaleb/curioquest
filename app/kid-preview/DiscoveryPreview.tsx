"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { DiscoveryData, DiscoverySource } from "@/lib/discover/types";
import { DiscoveryLibrary } from "@/components/kid/discover/DiscoveryLibrary";
import { DiscoveryHome } from "@/components/kid/discover/DiscoveryHome";
import { KidShell } from "@/components/shell/KidShell";

/** Uses the real HTTP handler's judging logic in a development-only endpoint. No family data. */
export function DiscoveryPreview({ data, home = false }: { data: DiscoveryData; home?: boolean }) {
  const router = useRouter();
  const [paused, setPaused] = useState(false);
  const [library, setLibrary] = useState(!home);
  const source = useMemo<DiscoverySource>(() => ({
    async load() { return data; },
    async attempt(input) {
      const response = await fetch("/api/discover-preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...input, band: data.band }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      return body;
    },
  }), [data]);
  return <>
    <div className="discovery-preview-controls">
      <span>Development preview · practice is not saved</span>
      <button type="button" onClick={() => setPaused((value) => !value)}>{paused ? "Resume preview" : "Pause preview"}</button>
      <button type="button" onClick={() => setLibrary((value) => !value)}>{library ? "Show home" : "Show library"}</button>
    </div>
    <KidShell band={data.band} narration={false} backdrop={false} atMap={!library} onHome={() => setLibrary(false)}>
      {library ? <DiscoveryLibrary source={source} paused={paused} narration={false}/> : <DiscoveryHome
        name="Robin" band={data.band} paused={paused} busy={false} hasActiveTrail={false} faith={false}
        onTrail={() => setLibrary(true)} onMap={() => router.push("/kid-preview?screen=map")} onGrownUps={() => setLibrary(true)}
      />}
    </KidShell>
  </>;
}
