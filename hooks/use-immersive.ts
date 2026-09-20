"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type FullscreenElement = HTMLDivElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};
type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

function fullscreenElement() {
  const doc = document as FullscreenDocument;
  return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

/**
 * Immersive activity mode.
 *
 * Takes over the viewport for games, drawing, stories, and simulations. Real browser
 * fullscreen is used where it exists; everywhere else — notably Safari on iPhone,
 * which has no element fullscreen at all — the same state drives a fixed-position
 * fallback that covers the viewport. Callers get one `active` flag either way, so no
 * screen has to branch on browser support.
 */
export function useImmersive(options: { onExit?: () => void } = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [nativeSupported, setNativeSupported] = useState(false);
  const onExit = options.onExit;

  useEffect(() => {
    const element = ref.current as FullscreenElement | null;
    setNativeSupported(
      typeof document !== "undefined" &&
        (document.fullscreenEnabled ?? false) &&
        typeof element?.requestFullscreen === "function",
    );
  }, []);

  // The browser can leave fullscreen without us (Escape, a system gesture, the OS),
  // so browser state is the source of truth whenever native fullscreen is in play.
  useEffect(() => {
    const sync = () => {
      if (!fullscreenElement() && active && nativeSupported) {
        setActive(false);
        onExit?.();
      }
    };
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
    };
  }, [active, nativeSupported, onExit]);

  // In the fallback path nothing else stops the page behind from scrolling.
  useEffect(() => {
    if (!active) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [active]);

  const enter = useCallback(async () => {
    const element = ref.current as FullscreenElement | null;
    if (!element) return;
    setActive(true);
    try {
      if (typeof element.requestFullscreen === "function") {
        await element.requestFullscreen({ navigationUI: "hide" });
      } else if (typeof element.webkitRequestFullscreen === "function") {
        await element.webkitRequestFullscreen();
      }
    } catch {
      // Fullscreen can be refused (permissions policy, an untrusted gesture, iPhone
      // Safari). The fallback covers the viewport, so this is not an error the child
      // ever needs to see.
    }
  }, []);

  const exit = useCallback(async () => {
    setActive(false);
    const doc = document as FullscreenDocument;
    try {
      if (fullscreenElement()) {
        if (typeof doc.exitFullscreen === "function") await doc.exitFullscreen();
        else if (typeof doc.webkitExitFullscreen === "function") await doc.webkitExitFullscreen();
      }
    } catch {
      // Already out of fullscreen; the state above is what the layout reads.
    }
    onExit?.();
  }, [onExit]);

  const toggle = useCallback(() => {
    if (active) void exit();
    else void enter();
  }, [active, enter, exit]);

  return { ref, active, nativeSupported, enter, exit, toggle };
}

/**
 * Reports the immersive stage's usable size, recalculated on resize and on orientation
 * change. Canvas-based activities size their backing store from this rather than
 * assuming a fixed viewport.
 */
export function useStageSize(ref: React.RefObject<HTMLElement | null>, active: boolean) {
  const [size, setSize] = useState({ width: 0, height: 0, dpr: 1 });

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const rect = element.getBoundingClientRect();
      setSize({
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        dpr: Math.min(window.devicePixelRatio || 1, 3),
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    window.addEventListener("orientationchange", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("orientationchange", measure);
    };
  }, [ref, active]);

  return size;
}
