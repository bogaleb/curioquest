import "./aurora-backdrop.css";

/**
 * The moving light behind an Aurora surface.
 *
 * A server component with no state and no props beyond its variant, so it costs nothing
 * on the client and never re-renders. All motion is CSS on compositor properties; see
 * `aurora-backdrop.css` for why that matters on the hardware this runs on.
 *
 * `deep` is the grown-up register — dark ground, coloured light. `lux` is the same
 * composition inverted for children, where a bright background is not a style choice
 * but the difference between a word being legible and not.
 */
export function AuroraBackdrop({
  variant = "deep",
  beam = false,
  grid = true,
}: {
  variant?: "deep" | "lux";
  /** One slow sweep of light. Right for a landing screen, wrong behind an activity. */
  beam?: boolean;
  grid?: boolean;
}) {
  return (
    // aria-hidden because there is nothing here to describe: every rule in the
    // stylesheet is decorative, and announcing "image" to a screen reader user would be
    // announcing that they are missing something when they are not.
    <div className="aurora-backdrop" data-variant={variant} aria-hidden="true">
      <div className="aurora-blob" data-layer="a"/>
      <div className="aurora-blob" data-layer="b"/>
      <div className="aurora-blob" data-layer="c"/>
      <div className="aurora-blob" data-layer="d"/>
      {grid && <div className="aurora-grid"/>}
      {beam && <div className="aurora-beam"/>}
      <div className="aurora-grain"/>
      <div className="aurora-vignette"/>
    </div>
  );
}
