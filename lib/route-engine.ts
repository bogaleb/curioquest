import type { ActivityEngine } from "./activity-types";
export type RouteEngine = Extract<ActivityEngine, {kind:"route"}>;
export const routeDirections = [{id:"up",label:"Up",symbol:"↑"},{id:"left",label:"Left",symbol:"←"},{id:"down",label:"Down",symbol:"↓"},{id:"right",label:"Right",symbol:"→"}] as const;
export function traceRoute(engine: RouteEngine, moves: string[]) {
  let position=engine.start;
  const trail=[position];
  for(const move of moves) {
    let next=position;
    if(move==="up") next-=engine.size;
    else if(move==="down") next+=engine.size;
    else if(move==="left" && position%engine.size>0) next--;
    else if(move==="right" && position%engine.size<engine.size-1) next++;
    else return {trail,blocked:true,arrived:false};
    if(next<0||next>=engine.size*engine.size||engine.rocks.includes(next)) return {trail,blocked:true,arrived:false};
    position=next;trail.push(position);
  }
  return {trail,blocked:false,arrived:position===engine.goal};
}
