'use client';
import {useState} from 'react';
import type {ExperienceView} from '@/lib/experience/types';
import {ItemArt} from './ItemArt';
import {CastFigure} from '@/components/kid/art/cast';
import {TreehouseRoom} from '@/components/kid/art/room';

/**
 * My Treehouse — the screen that is supposed to *be* the child's progress (§D9, WP-09).
 *
 * Before this change it was two flat colour bands, one white ellipse for a cloud, Nova
 * standing in a void, and three text cards. A child who had earned nothing and a child who
 * had earned everything saw very nearly the same screen. It was the biggest miss in the
 * product: the blueprint's whole reward argument is that progress should be objects a child
 * can see, and there was nothing to see.
 *
 * It is a room now — drawn floorboards, a window onto the valley the map is set in, a wall,
 * a shelf and a desk — and the three places a child can put something are places *in that
 * room* rather than three cards under it. An empty spot reads as empty: a drawn outline of
 * the shape that would sit there, so a child can tell there is more to come without a
 * number telling them and without a padlock implying something is being withheld.
 *
 * ## What is deliberately not changed
 *
 * The slots. There are three — wall, shelf, desk — because that is what the server accepts
 * and what every existing family's saved placements refer to. WP-09 is the package that
 * decides whether a treehouse should fill up with more than three things; adding slots here
 * would be a data change wearing a paint job, and it would be the kind of change that
 * quietly breaks a child's room.
 *
 * `onPlace`, the selection flow and the inventory are all as they were.
 */
export function Treehouse({data,busy,onPlace}:{data:ExperienceView;busy:boolean;onPlace:(slot:string,item:string|null)=>void}){
  const [selected,setSelected]=useState(''),[message,setMessage]=useState('');
  const earned=data.items.filter(item=>data.inventory.some(i=>i.item_id===item.id));
  const chosen=data.items.find(i=>i.id===selected);

  return (
    <section className="kid-room" data-kid-world="treehouse">
      <div className="kid-room-scene">
        <TreehouseRoom />

        <span className="kid-room-nova">
          <CastFigure who="curio" state={selected?'point':'idle'} />
        </span>

        {/* The three places something can go. Each is a real button with the slot's name,
            so the keyboard path and the screen-reader path are the same path a finger takes. */}
        {(['wall','shelf','desk'] as const).map(slot=>{
          const item=data.items.find(i=>i.id===data.placements.find(p=>p.slot===slot)?.item_id);
          return (
            <div className={`kid-room-spot spot-${slot}`} key={slot}>
              <button
                type="button"
                className="kid-room-place"
                data-filled={!!item||undefined}
                data-ready={!!selected&&!item||undefined}
                disabled={busy||!selected}
                aria-label={item?`${item.name} is on the ${slot}. Choose to replace it.`:`Empty ${slot}. Place the thing you picked here.`}
                onClick={()=>{onPlace(slot,selected);setMessage(chosen?`Putting your ${chosen.name} on the ${slot}.`:'');}}
              >
                {item?<ItemArt art={item.art}/>:<span className="kid-room-empty" aria-hidden="true" />}
              </button>
              {item&&(
                <button className="kid-room-return" disabled={busy} aria-label={`Put ${item.name} back in your bag`} onClick={()=>onPlace(slot,null)}>
                  Back in my bag
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p className="kid-room-said" role="status">
        {data.feedback||message||'Everything here is yours. Move it whenever you like.'}
      </p>

      {/* The bag. Not a shop and not a checklist — the things a child already has. */}
      <div className="kid-room-bag">
        <h3>My bag</h3>
        {earned.length?(
          <div className="kid-room-bag-items">
            {earned.map(item=>(
              <button
                key={item.id}
                type="button"
                aria-pressed={selected===item.id}
                className={selected===item.id?'selected':''}
                disabled={busy}
                onClick={()=>{setSelected(item.id);setMessage(`Now choose a spot for your ${item.name}.`);}}
              >
                <ItemArt art={item.art}/>
                <strong>{item.name}</strong>
              </button>
            ))}
          </div>
        ):(
          <p className="kid-room-bag-empty">Your first thing is waiting on the trail.</p>
        )}
      </div>

      {/* Where things come from. A disclosure rather than a list on the screen: it is a
          grown-up's question, and a child who wants to know can open it. */}
      <details className="kid-room-guide">
        <summary>Where things come from</summary>
        {data.items.map(item=><p key={item.id}><strong>{item.name}</strong> · {item.unlock}</p>)}
      </details>
    </section>
  );
}
