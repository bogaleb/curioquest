// Runs migrations and real RLS queries in a new, disposable PostgreSQL cluster.
// No Docker or hosted database password is needed. Supabase Auth is NOT tested here.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import assert from 'node:assert/strict';
import { generateDatabaseTypes } from './supabase-types.mjs';
import { verifySupabaseApplication } from '../tests/supabase-application.mjs';

const root = resolve(import.meta.dirname, '..');
const directory = mkdtempSync(join(tmpdir(), 'curioquest-postgres-'));
const data = join(directory, 'data');
const port = String(process.env.SUPABASE_TEST_PORT || 55439);
if (!/^\d{4,5}$/.test(port)) throw new Error('Invalid SUPABASE_TEST_PORT.');
const binary = name => process.env.PG_BIN ? join(process.env.PG_BIN, name + (process.platform === 'win32' ? '.exe' : '')) : name;
const dbEnv = { ...process.env, PGHOST: '127.0.0.1', PGPORT: port, PGUSER: 'curioquest_test', PGDATABASE: 'postgres' };
// Prevent inherited connection settings from redirecting the local test runner.
for (const key of ['PGSERVICE','PGSERVICEFILE','PGPASSWORD','PGPASSFILE','PGOPTIONS']) delete dbEnv[key];
function run(name, args, input) {
  const result = spawnSync(binary(name), args, { encoding: 'utf8', input, env: dbEnv, timeout: 60000,
    // Background postgres must not retain the parent's captured pipe handles on Windows.
    ...(name === 'pg_ctl' ? { stdio: 'ignore' } : {}),
  });
  if (result.error) throw new Error(`${name}: ${result.error.message}. Install PostgreSQL 17 and set PG_BIN to its bin directory.`);
  if (result.status !== 0) throw new Error(`${name} failed: ${result.stderr || result.stdout}`);
  return result.stdout;
}
const sql = input => run('psql', ['-X', '-q', '-A', '-t', '-v', 'ON_ERROR_STOP=1'], input);
let started = false;
try {
  run('initdb', ['-D', data, '-U', 'curioquest_test', '--auth-local=trust', '--auth-host=trust', '--encoding=UTF8', '--locale=C']);
  run('pg_ctl', ['-D', data, '-l', join(directory, 'postgres.log'), '-o', `-h 127.0.0.1 -p ${port}`, '-w', 'start']);
  started = true;
  // Minimal Supabase identity contract, in this disposable cluster only.
  sql(`create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
    create schema auth; create table auth.users (id uuid primary key, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
    create schema storage;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
    alter table storage.objects enable row level security;
    create function storage.foldername(name text) returns text[] language sql immutable as $$select string_to_array(name,'/')$$;
    grant usage on schema public,storage to anon,authenticated,service_role;`);
  for (const file of readdirSync(join(root, 'supabase/migrations')).filter(f => f.endsWith('.sql') && (!process.argv.includes('--bundle') || f.startsWith('20260918000100'))).sort()) {
    sql(readFileSync(join(root, 'supabase/migrations', file), 'utf8'));
    console.log(`Applied ${file}`);
  }
  if(process.argv.includes('--bundle')) sql(readFileSync(join(root,'work/supabase-upgrade.sql'),'utf8'));
  sql(readFileSync(join(root, 'supabase/tests/rls.sql'), 'utf8'));
  sql(readFileSync(join(root, 'supabase/tests/import.sql'), 'utf8'));
  console.log('PostgreSQL checks passed: ownership, published content, private answers, forbidden writes, and session foreign keys.');
  const types = generateDatabaseTypes(sql);
  if (process.argv.includes('--integration')) await verifySupabaseApplication(sql);
  const typePath = join(root, 'lib/supabase/database.types.ts');
  if (process.argv.includes('--write-types')) {
    writeFileSync(typePath, types);
    console.log('Generated database.types.ts from the migrated PostgreSQL catalog.');
  } else {
    assert.equal(readFileSync(typePath, 'utf8'), types, 'Database types differ from migrations. Run supabase:test-db -- --write-types.');
    console.log('Database types match the migrated schema.');
  }
} finally {
  if (started) run('pg_ctl', ['-D', data, '-m', 'fast', '-w', 'stop']);
}
