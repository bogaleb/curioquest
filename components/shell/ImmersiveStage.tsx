"use client";

import { type ReactNode } from "react";
import { ArrowLeft, Maximize2, Minimize2 } from "lucide-react";
import { useImmersive } from "@/hooks/use-immersive";

type Props = {
  /** Shown in the stage header so a child always knows where they are. */
  title: string;
  /** Child-friendly exit. Called on the back control and on leaving fullscreen. */
  onExit?: () => void;
  /** Label for the back control; keep it concrete for young readers. */
  exitLabel?: string;
  /**
   * Fixes the activity's aspect ratio inside the stage (e.g. 1000/700 for the drawing
   * canvas). Omit for activities that should simply fill the available space.
   */
  aspectRatio?: number;
  /** Extra controls for the stage header, e.g. pause, restart, sound. */
  tools?: ReactNode;
  children: ReactNode;
};

/**
 * A reusable immersive container for games, drawing, stories, videos, and simulations.
 *
 * Collapsed, it is an ordinary section in the page flow with a visible full-screen
 * control. Expanded, it covers the viewport, removes surrounding navigation, and keeps
 * one large, always-visible way back out — a child must never be trapped in an
 * activity. Real fullscreen is used when the browser has it and a CSS fallback covers
 * the viewport when it does not, so the experience is the same on an iPhone as on a
 * Chromebook.
 */
export function ImmersiveStage({
  title,
  onExit,
  exitLabel = "Back",
  aspectRatio,
  tools,
  children,
}: Props) {
  const { ref, active, toggle } = useImmersive();

  return (
    <section
      ref={ref}
      className="cq-immersive"
      data-active={active}
      aria-label={title}
    >
      <header className="cq-stage-bar">
        {onExit && (
          <button type="button" className="cq-stage-exit" onClick={onExit}>
            <ArrowLeft aria-hidden="true" />
            <span>{exitLabel}</span>
          </button>
        )}
        <h2 className="cq-stage-title">{title}</h2>
        <div className="cq-stage-tools">
          {tools}
          <button
            type="button"
            className="cq-stage-fullscreen"
            aria-pressed={active}
            onClick={toggle}
          >
            {active ? <Minimize2 aria-hidden="true" /> : <Maximize2 aria-hidden="true" />}
            <span>{active ? "Leave full screen" : "Full screen"}</span>
          </button>
        </div>
      </header>

      <div
        className="cq-stage-surface"
        style={aspectRatio ? { aspectRatio: String(aspectRatio) } : undefined}
      >
        {children}
      </div>
    </section>
  );
}
