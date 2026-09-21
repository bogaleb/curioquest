"use client";

import { AuroraBackdrop } from "@/components/visuals/AuroraBackdrop";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { MoreHorizontal, X } from "lucide-react";
import {
  destinationTitle,
  primaryDestinations,
  secondaryDestinations,
  type Destination,
} from "@/lib/navigation";
import type { LearningBandId } from "@/lib/learning-bands";

type Props = {
  view: string;
  onNavigate: (view: string) => void;
  /** Drives child-facing touch target sizing through the `data-band` token hook. */
  band: LearningBandId;
  faith: boolean;
  stars: number;
  /** Suppresses interaction while a modal activity owns the screen. */
  inert?: boolean;
  reducedMotion?: boolean;
  /** Brand lockup and explorer switcher, rendered at the head of the rail. */
  brand: ReactNode;
  switcher: ReactNode;
  /** Parent corner, account actions — the grown-up controls at the foot of the rail. */
  utility: ReactNode;
  /** Right-hand side of the top bar: stars, read-aloud, avatar. */
  topbarActions: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
};

/**
 * The grown-up application shell.
 *
 * This is the familiar web layout — sidebar, breadcrumb, top bar — and as of WP-03 it is
 * *only* for adults: Parent Corner and the account screens, behind the parent gate. A child
 * never sees it. Their side of the product is `KidShell`, which has no chrome at all,
 * because every pixel of navigation furniture is a decision a four-year-old has to make
 * before learning starts.
 *
 * One navigation model still renders three ways for the adult:
 *   compact  (<768px)  bottom tab bar with five primary destinations + a More sheet
 *   medium   (>=768px) full-height icon rail
 *   expanded (>=1181px) labelled sidebar
 *
 * Layout lives here rather than in each screen, so no screen has to re-solve it.
 */
export function GrownUpShell({
  view,
  onNavigate,
  band,
  faith,
  stars,
  inert = false,
  reducedMotion = false,
  brand,
  switcher,
  utility,
  topbarActions,
  children,
  footer,
}: Props) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreId = useId();
  const moreButton = useRef<HTMLButtonElement>(null);
  const primary = primaryDestinations({ faith });
  const secondary = secondaryDestinations({ faith });
  const inSecondary = secondary.some((destination) => destination.id === view);
  // Derived rather than synced: an activity taking the screen hides the sheet
  // without a state update, so there is no cascading render.
  const sheetOpen = moreOpen && !inert;

  // The More sheet is a child-facing surface, so it closes on Escape and on navigation
  // and always returns focus to the control that opened it.
  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMoreOpen(false);
        moreButton.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sheetOpen]);

  function go(id: string) {
    setMoreOpen(false);
    onNavigate(id);
  }

  const navButton = (destination: Destination, variant: "rail" | "tab" | "sheet") => {
    const Icon = destination.icon;
    const active = view === destination.id;
    return (
      <button
        key={destination.id}
        type="button"
        className={`cq-nav-item cq-nav-${variant}${active ? " is-active" : ""}`}
        aria-current={active ? "page" : undefined}
        onClick={() => go(destination.id)}
      >
        <span className="cq-nav-icon">
          <Icon aria-hidden="true" />
          {destination.id === "rewards" && stars > 0 && (
            <span className="cq-nav-count">{stars > 99 ? "99+" : stars}</span>
          )}
        </span>
        <span className="cq-nav-label">
          <span className="cq-label-full">{destination.label}</span>
          <span className="cq-label-short">{destination.shortLabel}</span>
        </span>
      </button>
    );
  };

  return (
    <div className="cq-shell" data-band={band} data-reduced-motion={reducedMotion || undefined}>
      {/* The deep register's light. Fixed, decorative, and behind everything the shell
          draws — see `components/visuals/aurora-backdrop.css`. */}
      <AuroraBackdrop variant="deep"/>
      <a className="cq-skip" href="#cq-main">
        Skip to the adventure
      </a>

      <aside className="cq-rail" inert={inert}>
        <div className="cq-rail-head">
          {brand}
          {switcher}
        </div>
        <nav className="cq-rail-nav" aria-label="Main navigation">
          {primary.map((destination) => navButton(destination, "rail"))}
          {secondary.length > 0 && <hr className="cq-rail-divider" />}
          {secondary.map((destination) => navButton(destination, "rail"))}
          <button
            type="button"
            className={`cq-nav-item cq-nav-rail cq-rail-more${inSecondary || sheetOpen ? " is-active" : ""}`}
            aria-expanded={sheetOpen}
            aria-controls={moreId}
            onClick={() => setMoreOpen((open) => !open)}
          >
            <span className="cq-nav-icon">
              <MoreHorizontal aria-hidden="true" />
            </span>
            <span className="cq-nav-label">
              <span className="cq-label-full">More</span>
              <span className="cq-label-short">More</span>
            </span>
          </button>
        </nav>
        <div className="cq-rail-foot">{utility}</div>
      </aside>

      <div className="cq-column" inert={inert}>
        <header className="cq-topbar">
          <div className="cq-crumb">
            <span className="cq-crumb-current">{destinationTitle(view)}</span>
          </div>
          <div className="cq-topbar-actions">{topbarActions}</div>
        </header>
        <main id="cq-main" className="cq-main">
          {children}
        </main>
        {footer && <footer className="cq-footer">{footer}</footer>}
      </div>

      {/* Compact-width navigation. Hidden at >=768px via CSS, not unmounted, so the
          layout does not depend on a JS width measurement that flickers on load. */}
      <nav className="cq-tabbar" aria-label="Main navigation" inert={inert}>
        {primary.map((destination) => navButton(destination, "tab"))}
        <button
          type="button"
          ref={moreButton}
          className={`cq-nav-item cq-nav-tab${inSecondary || sheetOpen ? " is-active" : ""}`}
          aria-expanded={sheetOpen}
          aria-controls={moreId}
          onClick={() => setMoreOpen((open) => !open)}
        >
          <span className="cq-nav-icon">
            <MoreHorizontal aria-hidden="true" />
          </span>
          <span className="cq-nav-label">More</span>
        </button>
      </nav>

      {sheetOpen && (
        <div className="cq-sheet-backdrop" onClick={() => setMoreOpen(false)}>
          <div
            id={moreId}
            className="cq-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="More places to explore"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="cq-sheet-head">
              <h2>More places to explore</h2>
              <button
                type="button"
                className="cq-sheet-close"
                aria-label="Close"
                onClick={() => {
                  setMoreOpen(false);
                  moreButton.current?.focus();
                }}
              >
                <X aria-hidden="true" />
              </button>
            </div>
            <div className="cq-sheet-grid">
              {secondary.map((destination) => navButton(destination, "sheet"))}
            </div>
            <div className="cq-sheet-utility">{utility}</div>
          </div>
        </div>
      )}
    </div>
  );
}
