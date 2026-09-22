import {RewardObject} from '@/components/kid/art/objects';

/**
 * A thing a child has earned, drawn.
 *
 * This used to render a Lucide icon — a 1.6px grey stroke in a 24px box, the same weight
 * as the glyphs in a settings menu — with a CSS sparkle and a `✦` glyph on top. The
 * blueprint's reward argument (§D9, WP-09) is that progress should be objects a child can
 * see and place, and a toolbar icon does not carry that however well it is styled.
 *
 * The drawings live in the child art layer, with everything else that a child looks at.
 * This stays as the call site's name so the treehouse, the bag and the reward moment all
 * keep working unchanged.
 */
export function ItemArt({art}:{art:string}){
  return <span className="item-art" data-art={art} aria-hidden="true"><RewardObject art={art}/></span>;
}
