/**
 * The child component layer (blueprint §D7, WP-02).
 *
 * Child surfaces are built from these and from nothing else. shadcn/Radix belongs to
 * Grown-ups; a `Card` from `components/ui/` on a child screen is a bug, not a shortcut.
 *
 * Everything here is styled by `app/kid.css` against the tokens in `app/tokens.css`, and
 * `scripts/check-tokens.mjs` plus `scripts/check-child-surfaces.mjs` keep it that way: no
 * raw colours, no px type, no `!important`, no emoji, no icon library.
 */
export { KidButton, type KidButtonState, type KidButtonTone } from "./KidButton";
export { KidCard } from "./KidCard";
export { ObjectSlot } from "./ObjectSlot";
export { NotYetMark, Placeholder, RightMark, SpeakerMark } from "./Placeholder";
export { ProgressTrail } from "./ProgressTrail";
export { SceneLayer } from "./SceneLayer";
export { SpeechBubble, type KidSpeaker } from "./SpeechBubble";
export { KidSurfaceProvider, useCopyWarning, useKidSurface, type KidSurface, type KidWorld } from "./surface";
