import test from "node:test";
import assert from "node:assert/strict";
import { loadTs } from "./load-typescript.mjs";
import { solveRoute } from "./solve-route.mjs";
const {questions,publicQuestion}=loadTs("lib/curriculum");
const {arcadeGames,arcadeQuestionIds,normalizeArcade}=loadTs("lib/arcade");
const {evaluateResponse}=loadTs("lib/activity-evaluation");

test("every age-specific game mission contains four valid, solvable activities",()=>{
  // Counts are derived from the catalogue so adding a game cannot silently skip
  // this check, and a game missing its content fails here rather than in a child's
  // hands.
  const expected=2*arcadeGames.length*3*4;
  const ids=[];
  for(const grade of ["prek","grade1"])for(const game of arcadeGames)for(let level=0;level<3;level++){
    const mission=arcadeQuestionIds(grade,game.id,level);
    assert.equal(mission.length,4);
    for(const id of mission){
      ids.push(id);const q=questions.find(q=>q.id===id);assert.ok(q,id);assert.equal(q.grade,grade);
      let answer=q.answer;
      if(["matching","ordering","sorting"].includes(q.engine?.kind))answer=JSON.stringify(q.engine.solution);
      if(q.engine?.kind==="memory")answer=JSON.stringify(q.engine.sequence);
      if(q.engine?.kind==="route")answer=JSON.stringify(solveRoute(q.engine));
      assert.deepEqual(evaluateResponse(q,answer),{valid:true,correct:true},id);
      assert.equal(publicQuestion(q).answer,undefined);
      assert.equal(publicQuestion(q).engine?.solution,undefined);
    }
  }
  assert.equal(new Set(ids).size,expected);
});
test("robot plans cannot wrap edges, cross rocks, forge moves, or exceed their budget",()=>{
  const original=questions.find(q=>q.engine?.kind==="route");
  const q={...original,engine:{kind:"route",size:3,start:0,goal:2,rocks:[1],maxMoves:4}};
  for(const moves of [["left","left"],["right","right"],["up"]])assert.equal(evaluateResponse(q,JSON.stringify(moves)).correct,false);
  for(const moves of [["teleport"],[],["down","right","right","up","left"]])assert.equal(evaluateResponse(q,JSON.stringify(moves)).valid,false);
  assert.equal(evaluateResponse(q,JSON.stringify(["down","right","right","up"])).correct,true);
});
test("matching and ordering reject duplicate or missing cards",()=>{
  const match=questions.find(q=>q.engine?.kind==="matching");
  const duplicates=Object.fromEntries(match.engine.items.map(item=>[item.id,match.engine.targets[0].id]));
  assert.equal(evaluateResponse(match,JSON.stringify(duplicates)).valid,false);
  const order=questions.find(q=>q.engine?.kind==="ordering");
  assert.equal(evaluateResponse(order,JSON.stringify(Array(order.engine.items.length).fill(order.engine.items[0].id))).valid,false);
  assert.equal(evaluateResponse(order,JSON.stringify([...order.engine.solution].reverse())).correct,false);
});
test("stored arcade progress rejects unknown games and invalid levels",()=>{
  assert.deepEqual(normalizeArcade({"prek:robot":{levels:[0,0,9,-1,1.5],plays:-5},"prek:fake":{levels:[0]}}),{"prek:robot":{levels:[0],plays:0,lastPlayedAt:""}});
});
