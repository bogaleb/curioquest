import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTs } from './load-typescript.mjs';

const { getSupabaseConfig, SupabaseConfigurationError } = loadTs('lib/supabase/config');
const { checkConnectivity, EXPECTED_DATABASE_VERSION } = loadTs('lib/supabase/connectivity');
const { GET } = loadTs('app/api/supabase/health/route');
const keys = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'];
function configure(t, url = 'https://example.supabase.co', key = 'sb_publishable_test') {
  const original = Object.fromEntries(keys.map(k => [k, process.env[k]]));
  process.env[keys[0]] = url; process.env[keys[1]] = key;
  t.after(() => { for (const k of keys) { if (original[k] === undefined) delete process.env[k]; else process.env[k] = original[k]; } });
}

test('Supabase configuration rejects missing, secret, legacy JWT and non-origin values without disclosing them', t => {
  configure(t);
  assert.equal(getSupabaseConfig().url, 'https://example.supabase.co');
  for (const key of ['', 'sb_secret_do_not_print', 'eyJservice_role', 'eyJanon']) {
    process.env[keys[1]] = key;
    assert.throws(getSupabaseConfig, error => error instanceof SupabaseConfigurationError && (!key || !error.message.includes(key)));
  }
  process.env[keys[1]] = 'sb_publishable_test';
  for (const url of ['not-a-url', 'http://example.supabase.co', 'https://user:pass@example.supabase.co', 'https://example.supabase.co/rest/v1/', 'https://example.supabase.co?key=secret']) {
    process.env[keys[0]] = url;
    assert.throws(getSupabaseConfig, SupabaseConfigurationError);
  }
  process.env[keys[0]] = 'http://127.0.0.1:54321';
  assert.equal(getSupabaseConfig().url, 'http://127.0.0.1:54321');
});

test('Connectivity requires a successful database RPC and the expected migration version', async t => {
  configure(t);
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (input, init) => {
    calls.push({ input: String(input), init });
    return Response.json(EXPECTED_DATABASE_VERSION);
  });
  assert.deepEqual(await checkConnectivity(), { status: 'connected', databaseVersion: EXPECTED_DATABASE_VERSION });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].input, 'https://example.supabase.co/rest/v1/rpc/backend_version');
  assert.equal(calls[0].init.method, 'POST');
  assert.ok(calls[0].init.signal instanceof AbortSignal);
});

test('Health never reports connected for missing schema, stale schema, or bad configuration', async t => {
  configure(t);
  t.mock.method(globalThis, 'fetch', async () => Response.json({ code: 'PGRST202', message: 'private upstream detail' }, { status: 404 }));
  const missing = await GET();
  assert.equal(missing.status, 503);
  assert.equal(missing.headers.get('cache-control'), 'no-store');
  assert.equal((await missing.json()).status, 'unavailable');
  globalThis.fetch.mock.mockImplementation(async () => Response.json('old-version'));
  await assert.rejects(checkConnectivity, /schema does not match/);
  process.env[keys[1]] = '';
  const absent = await GET();
  assert.equal(absent.status, 503);
  assert.equal((await absent.json()).status, 'not_configured');
});

test('Health reports an uncached success only after database verification', async t => {
  configure(t);
  t.mock.method(globalThis, 'fetch', async () => Response.json(EXPECTED_DATABASE_VERSION));
  const response = await GET();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), { status: 'connected', databaseVersion: EXPECTED_DATABASE_VERSION });
});
