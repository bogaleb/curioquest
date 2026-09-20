"use client";

import { RouteError } from "@/components/shell/RouteError";

/**
 * Parent Corner has its own boundary because its audience is different: a parent can act
 * on a reference code, and is the person who would report a fault. The nearest boundary
 * wins, so this one — not the child-facing explorer boundary — handles anything thrown
 * under /parent.
 */
export default function ParentError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <RouteError error={error} retry={retry} audience="parent" />;
}
