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
