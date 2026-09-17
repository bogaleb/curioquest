// Independent breadth-first solver verifies every authored route is reachable.
export function solveRoute(engine){
  const queue=[[engine.start,[]]],visited=new Set([engine.start]);
  for(let i=0;i<queue.length;i++){
    const [position,path]=queue[i];if(position===engine.goal)return path;
    if(path.length>=engine.maxMoves)continue;
    const row=Math.floor(position/engine.size),column=position%engine.size;
    for(const [move,r,c] of [["up",row-1,column],["down",row+1,column],["left",row,column-1],["right",row,column+1]]){
      if(r<0||c<0||r>=engine.size||c>=engine.size)continue;
      const next=r*engine.size+c;if(visited.has(next)||engine.rocks.includes(next))continue;
      visited.add(next);queue.push([next,[...path,move]]);
    }
  }
  throw Error("Unsolvable route");
}
