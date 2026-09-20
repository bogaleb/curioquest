import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTs } from './load-typescript.mjs';
const { newExplorer, normalizeExplorer } = loadTs('lib/explorers');
const { parkSession, resumeSession } = loadTs('lib/saved-sessions');

test('switching saves attempts and excludes time spent in other games', () => {
  const p = newExplorer('test', 'Explorer', 'prek', 'fox');
  p.session = { id: 'robot', subject: 'logic', questions: ['one','two'], index: 1, misses: 2, hinted: true, first: 0, started: 1000 };
  parkSession(p, 2000);
  p.session = { ...p.session, id: 'kitchen', index: 0, started: 2000 };
  assert.equal(resumeSession(p, 'robot', 6000), true);
  assert.equal(p.session.index, 1);
  assert.equal(p.session.misses, 2);
  assert.equal(p.session.hinted, true);
  assert.equal(p.session.started, 5000);
  assert.deepEqual(p.savedSessions.map(s => s.id), ['kitchen']);
  assert.equal(resumeSession(p, 'missing', 7000), false);
  assert.equal(p.session.id, 'robot');
  assert.deepEqual(p.savedSessions.map(s => s.id), ['kitchen']);
});

test('legacy profiles load without saved sessions and completed sessions are not parked', () => {
  const p = normalizeExplorer({ id: 'legacy', grade: 'prek' });
  assert.deepEqual(p.savedSessions, []);
  p.session = { id: 'finished', subject: 'math', questions: ['one'], index: 1, misses: 0, hinted: false, first: 1, started: 1000 };
  parkSession(p, 2000);
  assert.deepEqual(p.savedSessions, []);
});

test('starting a mission over discards it rather than resuming, and keeps other adventures', () => {
  const { discardGameSession } = loadTs('lib/saved-sessions');
  const p = newExplorer('test', 'Explorer', 'prek', 'fox');

  // A different adventure is parked, and the robot mission is the live one.
  p.session = { id: 'daily', subject: 'daily', questions: ['a', 'b'], index: 1, misses: 0, hinted: false, first: 1, started: 1000 };
  parkSession(p, 2000);
  p.session = { id: 'robot-live', subject: 'logic', questions: ['one', 'two'], index: 1, misses: 3, hinted: true, first: 0, started: 2000, gameId: 'robot', gameLevel: 0 };

  discardGameSession(p, 'robot', 0);

  assert.equal(p.session, null, 'the live mission must be cleared, not parked');
  assert.deepEqual(p.savedSessions.map(s => s.id), ['daily'], 'an unrelated adventure must survive');
});

test('starting over also removes a parked copy, so the restart cannot resume it', () => {
  const { discardGameSession } = loadTs('lib/saved-sessions');
  const p = newExplorer('test', 'Explorer', 'prek', 'fox');
  p.session = { id: 'robot-parked', subject: 'logic', questions: ['one', 'two'], index: 1, misses: 0, hinted: false, first: 0, started: 1000, gameId: 'robot', gameLevel: 0 };
  parkSession(p, 2000);
  assert.equal(p.savedSessions.length, 1);

  discardGameSession(p, 'robot', 0);
  assert.deepEqual(p.savedSessions, [], 'a parked copy would be resumed by the next game-start');

  // A different level of the same game is a different mission and stays put.
  p.session = { id: 'robot-l1', subject: 'logic', questions: ['x'], index: 0, misses: 0, hinted: false, first: 0, started: 3000, gameId: 'robot', gameLevel: 1 };
  parkSession(p, 4000);
  discardGameSession(p, 'robot', 0);
  assert.deepEqual(p.savedSessions.map(s => s.gameLevel), [1]);
});
