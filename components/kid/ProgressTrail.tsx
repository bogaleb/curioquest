/**
 * How far along we are, with no numbers.
 *
 * A five-year-old cannot read "60%" and does not benefit from being able to. The trail is
 * a row of stepping stones: the ones behind are filled in, the one you are on is larger
 * and warmer, and the path ahead is dashed. That is legible at a glance, at a distance,
 * and to a child who has never seen a progress bar.
 *
 * The written equivalent exists for assistive technology only. It says "stop 3 of 6",
 * because a screen reader user needs the count that the drawing gives everyone else — and
 * `aria-current` marks which stone is the one underfoot.
 *
 * Deliberately not a percentage, not a star count, and not a streak (§A).
 */
export function ProgressTrail({
  total,
  done,
  label = "Your trail",
}: {
  /** Stops in this run. Episodes are 8–12 lessons, so this stays a countable number. */
  total: number;
  /** Stops already finished. The stop the child is on is `done` + 1. */
  done: number;
  label?: string;
}) {
  const stops = Math.max(0, Math.trunc(total));
  const finished = Math.min(Math.max(0, Math.trunc(done)), stops);
  const here = finished < stops ? finished : -1;

  return (
    <ol className="kid-trail" aria-label={label}>
      {Array.from({ length: stops }, (_, index) => (
        <li
          key={index}
          className="kid-trail-stop"
          data-done={index < finished || undefined}
          data-here={index === here || undefined}
          aria-current={index === here ? "step" : undefined}
        >
          <span className="kid-sr-only">
            {index === here
              ? `You are here: stop ${index + 1} of ${stops}.`
              : index < finished
                ? `Stop ${index + 1} of ${stops}, finished.`
                : `Stop ${index + 1} of ${stops}, still to come.`}
          </span>
          {index < stops - 1 ? (
            <span className="kid-trail-link" data-done={index < finished - 1 || undefined} aria-hidden="true" />
          ) : null}
        </li>
      ))}
    </ol>
  );
}
