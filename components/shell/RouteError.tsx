"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Compass, RotateCcw } from "lucide-react";

/**
 * The fallback a route segment shows when it throws.
 *
 * Two audiences, one component.
 *
 * A child gets Nova's voice, no technical vocabulary, and two large choices: try the
 * same thing again, or go somewhere that definitely works. Wave 14 is explicit that
 * children should rarely see technical errors, and a six-year-old reading "an
 * unexpected error occurred" learns only that they broke something.
 *
 * A parent gets the same recovery plus the error digest, because they are the person
 * who might report it and the digest is what matches it to a server log. The message
 * itself is never shown: React deliberately replaces Server Component error messages
 * with a generic string in production to avoid leaking internals, so printing it would
 * be worse than useless in the only environment that matters.
 *
 * `retry` (stable since Next 16.3) re-fetches and re-renders the boundary's children.
 * It is not `reset` — that clears the error state without re-fetching, which here would
 * usually reproduce the same failure.
 */
export function RouteError({
  error,
  retry,
  audience = "child",
}: {
  error: Error & { digest?: string };
  retry: () => void;
  audience?: "child" | "parent";
}) {
  useEffect(() => {
    // Local only. There is no third-party error reporting in this product.
    console.error("[CurioQuest] route error", error);
  }, [error]);

  const parent = audience === "parent";

  return (
    <section className="cq-route-error panel" role="alert">
      <span className="cq-route-error-mark" aria-hidden="true">{parent ? "⚠" : "🦊"}</span>
      <h1>{parent ? "This section could not load" : "Nova lost the trail"}</h1>
      <p>
        {parent
          ? "Nothing your family has saved is affected. Try loading it again, and if it keeps happening the reference below identifies what failed."
          : "Something got tangled up on the way here. Nothing you made is lost — let’s try again."}
      </p>
      <div className="cq-route-error-actions">
        <button className="primary" onClick={() => retry()}>
          <RotateCcw size={18} />{parent ? "Try loading again" : "Try again"}
        </button>
        <Link className="secondary" href="/">
          <Compass size={18} />{parent ? "Back to the adventure" : "Back to my adventure"}
        </Link>
      </div>
      {parent && error.digest && (
        <p className="form-note">Reference: <code>{error.digest}</code></p>
      )}
    </section>
  );
}
