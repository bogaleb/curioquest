"use client";

import Link from "next/link";
import { discoveryDomains } from "@/lib/discover/domains";
import { DiscoveryArrow, DiscoveryArt } from "./DiscoveryArt";
import { destinations } from "@/lib/navigation";
import type { LearningBandId } from "@/lib/learning-bands";

export function DiscoveryHome({ name, band, paused, busy, hasActiveTrail, faith, onTrail, onMap, onGrownUps }: { name: string; band: LearningBandId; paused: boolean; busy: boolean; hasActiveTrail: boolean; faith: boolean; onTrail: () => void; onMap: () => void; onGrownUps: () => void }) {
  return <section className="discovery-home" data-band={band}>
    <header className="discovery-home-top"><div className="discovery-wordmark"><span className="discovery-brand-mark" aria-hidden="true">c<span>q</span></span><span>curioquest<span className="discovery-wordmark-note">A world of little wonders</span></span></div><div className="discovery-home-links"><button type="button" onClick={onMap}>My world map</button><button type="button" onClick={onGrownUps}>Grown-ups</button></div></header>
    <div className="discovery-home-hero" data-domain="reading">
      <div className="discovery-hero-copy"><span className="discovery-eyebrow">Hello, {name}. What will you discover?</span><h1>Small wonders.<br/><em>Big possibilities.</em></h1><p>A story to imagine. A puzzle to solve.<br/>A whole world to figure out.</p><div className="discovery-actions"><button type="button" className="discovery-button" disabled={paused || busy} onClick={onTrail}>{hasActiveTrail ? "Continue my adventure" : "Start my adventure"}<DiscoveryArrow/></button><Link className="discovery-quiet" href="/discover">Explore discoveries</Link></div><span className="discovery-hero-note">Play a little. Learn something. Try it in your world.</span></div>
      <div className="discovery-hero-illustration"><span className="discovery-orbit discovery-orbit-one"/><span className="discovery-orbit discovery-orbit-two"/><DiscoveryArt domain="reading" hero/><span className="discovery-floating-note">What if…?</span><span className="discovery-floating-word">Let’s find out.</span></div>
    </div>
    {paused && <p className="discovery-notice" role="status">Time for a rest. Your adventures are safe.</p>}
    <section className="discovery-home-worlds" aria-labelledby="discovery-worlds-title"><div className="discovery-section-heading"><div><span className="discovery-eyebrow">Pick a little adventure</span><h2 id="discovery-worlds-title">Where will curiosity take you?</h2></div><Link href="/discover">See all discoveries <DiscoveryArrow/></Link></div><div className="discovery-domain-grid">{discoveryDomains.map((domain) => <Link className="discovery-domain-card" data-domain={domain.id} key={domain.id} href={`/discover?domain=${domain.id}`}><DiscoveryArt domain={domain.id}/><div><h3>{domain.label}</h3><p>{domain.invitation}</p></div><span className="discovery-domain-go"><DiscoveryArrow/></span></Link>)}</div></section>
    <div className="discovery-home-bottom"><section className="discovery-pocket-note"><span className="discovery-eyebrow">An adventure away from the screen</span><h2>Become a noticing detective.</h2><p>Find something round, something that grows, and something that makes a sound. What do you notice?</p><span>Try it together with a grown-up.</span></section><section className="discovery-familiar"><span className="discovery-eyebrow">Your favourite places</span><h2>Keep making. Keep exploring.</h2><nav aria-label="All learning places">{destinations.filter((d) => d.id !== "adventure" && (!d.requiresFaith || faith)).map((d) => <Link key={d.id} href={d.href}>{d.label}<DiscoveryArrow/></Link>)}</nav></section></div>
  </section>;
}
