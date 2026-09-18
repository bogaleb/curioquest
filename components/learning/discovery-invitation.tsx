"use client";

import { ArrowRight, Compass, Volume2 } from "lucide-react";
import type { PublicExplorer } from "@/lib/explorer-view";

export function DiscoveryInvitation({ profile, busy, onStart, onListen }: {
  profile: PublicExplorer; busy: boolean; onStart: () => void; onListen: (text: string) => void;
}) {
  if (profile.discovery?.grade === profile.grade) return null;
  // The public session contains total rather than the private question queue.
  const active = profile.session && profile.session.index < profile.session.total;
  const inProgress = active && !!profile.session?.discovery;
  if (active && !profile.session?.discovery) return null;
  const message = `Hello ${profile.name}! I’m Nova. Let’s find three paths together. We’ll listen, count, and solve little puzzles. You can ask for help any time.`;
  return <section className="discovery-invitation" aria-labelledby="discovery-title">
    <span className="discovery-buddy" aria-hidden="true">🦊</span>
    <div className="discovery-copy"><div className="eyebrow">YOUR FIRST TRAIL WITH NOVA</div>
      <h2 id="discovery-title">A little hello. A world to discover.</h2>
      <p>Six little discoveries help Nova find a comfortable path for you. No rush, and help is always welcome.</p>
      <div className="discovery-paths"><span>🌳 Listen</span><span>🌻 Count</span><span>🔎 Wonder</span></div>
      <div className="discovery-actions"><button className="primary" disabled={busy} onClick={onStart}>
        <Compass size={19}/>{inProgress || active ? "Continue with Nova" : "Meet Nova"}<ArrowRight size={18}/>
      </button><button className="text-button" onClick={() => onListen(message)}><Volume2 size={19}/>Listen</button></div>
      <small>You can explore another adventure first. Nova will be here.</small>
    </div>
  </section>;
}
