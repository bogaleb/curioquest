import test from 'node:test';
import assert from 'node:assert/strict';
import {loadTs} from './load-typescript.mjs';
const {controlsSchema,scheduleMessage}=loadTs('lib/learning-controls');
const {quizSchema,artSchema,publicAssignment}=loadTs('lib/workspace-content');
const {stories,prayers}=loadTs('lib/story-library');
const {experiments}=loadTs('lib/science-lab');
const {tracePaths,traceLetters,traceNumbers,traceShapes}=loadTs('lib/handwriting');
const {parentActivityDraft}=loadTs('lib/parent-activity-draft');

test('handwriting paths are bounded and include each capital, number, and warm-up',()=>{
  assert.equal(traceLetters.length,26);assert.equal(traceNumbers.length,10);
  for(const key of [...traceLetters,...traceNumbers,...traceShapes]){const paths=tracePaths(key);assert.ok(paths.length);assert.ok(paths.every(path=>path.length>1&&path.every(([x,y])=>x>=0&&x<=1000&&y>=0&&y<=700)));}
  assert.deepEqual(tracePaths('unknown'),[]);
});
test('parent curriculum drafts are valid question sets in both learning tracks',()=>{
  for(const grade of ['prek','grade1'])for(const subject of ['reading','math','logic'])for(const level of [1,2,3]){const draft=parentActivityDraft(grade,subject,level,10);assert.equal(quizSchema.safeParse(draft).success,true);assert.ok(draft.questions.length<=10);assert.equal(new Set(draft.questions.map(q=>q.prompt)).size,draft.questions.length);}
});
test('story and science packs have complete unique scenes and valid outcomes',()=>{
  assert.equal(new Set(stories.map(s=>s.id)).size,stories.length);
  for(const story of stories){assert.ok(story.scenes.length>=3);assert.ok(story.lesson);for(const scene of story.scenes){assert.ok(scene.text&&scene.prompt&&scene.emoji);assert.ok(scene.choices.length>=2);assert.ok(scene.choices.every(c=>c.label&&c.response));}}
  assert.equal(stories.filter(s=>s.category==='faith').length,14);assert.equal(prayers.length,9);
  for(const e of experiments){assert.ok(e.items.length>=3);assert.ok(e.items.every(i=>e.outcomes.includes(i.result)&&i.observation));}
});
test('parent schedules use the selected time zone and reject invalid settings',()=>{
  const c=controlsSchema.parse({allowedDays:[1],bedtime:'19:00',timeZone:'America/New_York'});
  assert.equal(scheduleMessage(c,new Date('2026-09-14T20:00:00Z')),null);
  assert.match(scheduleMessage(c,new Date('2026-09-14T23:30:00Z')),/rest/);
  assert.match(scheduleMessage(c,new Date('2026-09-15T15:00:00Z')),/away/);
  assert.equal(controlsSchema.safeParse({timeZone:'invalid'}).success,false);
  assert.equal(controlsSchema.safeParse({allowedDays:[]}).success,false);
});
test('custom questions validate choices and never disclose answers or explanations',()=>{
  assert.equal(quizSchema.safeParse({title:'Quiz',questions:[{prompt:'How many?',answer:'2',choices:['1','1']}]}).success,false);
  const q=quizSchema.parse({title:'Quiz',questions:[{prompt:'How many?',answer:'2',choices:['1','2'],explanation:'The answer is 2.'}]});
  const result=publicAssignment({id:'a',revision:0,data:{...q,index:0,correct:0,misses:0,due:null,badge:false,sourceId:'s'}});
  assert.equal(result.question.answer,undefined);assert.equal(result.question.explanation,undefined);assert.equal(result.questions,undefined);
});
test('art rejects unbounded coordinates and invalid colors',()=>{
  const a={title:'Hello',mode:'drawing',marks:[{tool:'pencil',color:'#123456',size:8,points:[[30,50]]}]};
  assert.equal(artSchema.safeParse(a).success,true);
  assert.equal(artSchema.safeParse({...a,marks:[{...a.marks[0],points:[[1001,50]]}]}).success,false);
  assert.equal(artSchema.safeParse({...a,marks:[{...a.marks[0],color:'url(evil)'}]}).success,false);
});
