import test from 'node:test';
import assert from 'node:assert/strict';
import {loadTs} from './load-typescript.mjs';
const {direct, directWelcome, directLessonIntro, SPECIALIST, MOVE_CAST, CLIPS, TEACHING_CLIPS, teachingClipFor} =
  loadTs('lib/character/director');

test('every subject has a specialist, and the daily adventure is Curio\u2019s', () => {
  assert.deepEqual(SPECIALIST, {
    reading: 'luna',
    math: 'milo',
    logic: 'milo',
    science: 'bea',
    world: 'atlas',
    wellbeing: 'tuno',
  });
});

test('asking a question shows the specialist at rest, puppet only', () => {
  const d = direct({subject: 'reading', feedback: null, stalled: false});
  assert.equal(d.who, 'luna');
  assert.equal(d.state, 'idle');
  assert.equal(d.clip, null);
});

test('a correct answer celebrates with the specialist, no video', () => {
  const d = direct({subject: 'math', feedback: {correct: true}, stalled: false});
  assert.equal(d.who, 'milo');
  assert.equal(d.state, 'celebrate');
  assert.equal(d.clip, null);
});

test('the finale brings Curio back with the whole-cast video', () => {
  const d = direct({subject: 'science', feedback: {correct: true}, stalled: false, isFinale: true});
  assert.equal(d.who, 'curio');
  assert.equal(d.state, 'celebrate');
  assert.equal(d.clip, CLIPS.castFinale);
});

test('each teaching move is delivered by its character', () => {
  assert.equal(MOVE_CAST.settle, 'tuno');
  assert.equal(MOVE_CAST.compare, 'nova');
  assert.equal(MOVE_CAST.recount, 'milo');
  assert.equal(MOVE_CAST.relisten, 'luna');
  assert.equal(MOVE_CAST['sound-not-name'], 'luna');
  assert.equal(MOVE_CAST['step-back'], 'curio');
});

test('a settle move plays Tuno\u2019s breathing video', () => {
  const d = direct({subject: 'reading', feedback: {correct: false, message: 'Try again.', move: 'settle'}, stalled: false});
  assert.equal(d.who, 'tuno');
  assert.equal(d.state, 'encourage');
  assert.equal(d.clip, CLIPS.tunoBreathing);
});

test('other moves use the live puppet, never a video mid-lesson', () => {
  for (const move of ['compare', 'relisten', 'sound-not-name', 'recount', 'restate-rule', 'reorder', 'step-back']) {
    const d = direct({subject: 'math', feedback: {correct: false, message: 'Try again.', move}, stalled: false});
    assert.equal(d.who, MOVE_CAST[move]);
    assert.equal(d.state, 'encourage');
    assert.equal(d.clip, null, move);
  }
});

test('a wrong answer without a move gets the specialist explaining', () => {
  const d = direct({subject: 'world', feedback: {correct: false, message: 'Not quite.'}, stalled: false});
  assert.equal(d.who, 'atlas');
  assert.equal(d.state, 'explain');
});

test('a stalled child gets encouragement, never disappointment', () => {
  const d = direct({subject: 'wellbeing', feedback: null, stalled: true});
  assert.equal(d.who, 'tuno');
  assert.equal(d.state, 'encourage');
  assert.notEqual(d.state, 'idle');
});

test('welcome and lesson intros name their hero clips', () => {
  const w = directWelcome();
  assert.equal(w.who, 'curio');
  assert.equal(w.clip, CLIPS.curioWelcome);
  const l = directLessonIntro('science');
  assert.equal(l.who, 'bea');
  assert.equal(l.state, 'explain');
  assert.equal(l.clip, 'bea-intro');
  // Curio's lesson intro is the welcome itself — no separate curio-intro clip.
  const d = directLessonIntro('daily');
  assert.equal(d.who, 'curio');
  assert.equal(d.clip, CLIPS.curioWelcome);
});

test('every subject has a teaching clip for "show me" moments', () => {
  const subjects = ['reading', 'math', 'logic', 'science', 'world', 'wellbeing'];
  for (const s of subjects) {
    const clip = teachingClipFor(s);
    assert.ok(clip, `no teaching clip for ${s}`);
    assert.equal(TEACHING_CLIPS[s], clip);
  }
  // Teaching clips match the subject's specialist character.
  assert.equal(teachingClipFor('reading'), 'luna-letter-trace');
  assert.equal(teachingClipFor('math'), 'milo-counting');
  assert.equal(teachingClipFor('science'), 'bea-growth');
  assert.equal(teachingClipFor('world'), 'atlas-continents');
  assert.equal(teachingClipFor('wellbeing'), 'tuno-breathing');
});
