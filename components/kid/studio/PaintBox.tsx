"use client";

import type { CSSProperties } from "react";
import type { ColourFamily, StudioColour } from "@/lib/studio/types";

/**
 * The paint box.
 *
 * Named colours, grouped by family, at the band's touch size. Three things it does that
 * a row of unlabelled swatches and a `<input type="color">` did not:
 *
 * **Every colour has a name, and the name is on screen.** "Sunflower", "deep sea",
 * "moss". A child asking a grown-up for the one that looks like the sea is doing
 * vocabulary work; a child pointing at a hex swatch is not. The name is also the only
 * way the chosen colour is announced to a screen reader — `aria-pressed` on a coloured
 * square with no text says nothing at all.
 *
 * **Nothing is carried by colour alone.** The chosen swatch is drawn larger, lifted, and
 * outlined, and its name is repeated in the "using" line underneath, so a child who
 * cannot separate the two greens still knows which one is loaded.
 *
 * **There is no spectrum dialog.** A system colour picker is an adult control with a
 * hue wheel in it. Choosing from a curated, named set is also most of why a picture from
 * a real colouring book looks composed.
 */

const FAMILY_NAMES: Record<ColourFamily, string> = {
  warm: "Warm colours",
  green: "Greens",
  cool: "Cool colours",
  earth: "Earthy colours",
  bright: "Bright colours",
  quiet: "Paper and ink",
};

export function PaintBox({
  palette,
  chosen,
  onChoose,
  disabled,
}: {
  palette: StudioColour[];
  chosen: StudioColour;
  onChoose: (colour: StudioColour) => void;
  disabled?: boolean;
}) {
  const families = (["warm", "green", "cool", "earth", "bright", "quiet"] as ColourFamily[]).filter(
    (family) => palette.some((colour) => colour.family === family),
  );

  return (
    <div className="studio-paintbox">
      <p className="studio-using" aria-live="polite">
        Using <strong>{chosen.name}</strong>
      </p>
      {families.map((family) => (
        <div key={family} className="studio-family" role="group" aria-label={FAMILY_NAMES[family]}>
          {palette
            .filter((colour) => colour.family === family)
            .map((colour) => (
              <button
                key={colour.id}
                type="button"
                className="studio-swatch"
                data-chosen={chosen.id === colour.id ? "yes" : undefined}
                aria-pressed={chosen.id === colour.id}
                disabled={disabled}
                onClick={() => onChoose(colour)}
                style={{ "--studio-fill": `var(${colour.token})` } as CSSProperties}
              >
                <span className="studio-swatch-face" aria-hidden="true" />
                <span className="studio-swatch-name">{colour.name}</span>
              </button>
            ))}
        </div>
      ))}
    </div>
  );
}
