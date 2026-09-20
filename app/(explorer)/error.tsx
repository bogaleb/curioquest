"use client";

import { RouteError } from "@/components/shell/RouteError";

/**
 * Catches a throw from any explorer page.
 *
 * It sits inside `(explorer)/layout.tsx`, so the shell around it — navigation, the star
 * count, the explorer switcher — stays mounted and interactive. Only the content area is
 * replaced, which means a child is never stranded: every other destination is still one
 * tap away.
 */
export default function ExplorerError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <RouteError error={error} retry={retry} />;
}
