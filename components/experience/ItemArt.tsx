import {Map,BookOpen,Leaf,Globe,Blocks,Cat,Moon,Bot} from 'lucide-react';
const icons={map:Map,book:BookOpen,plant:Leaf,globe:Globe,bridge:Blocks,creature:Cat,moon:Moon,robot:Bot};
export function ItemArt({art}:{art:string}){const Icon=icons[art as keyof typeof icons]??Map;return <span className={`item-art art-${art}`} aria-hidden="true"><Icon strokeWidth={1.6}/><i/><b>✦</b></span>;}
