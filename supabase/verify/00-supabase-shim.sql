-- The Supabase-shaped surface the migrations expect, for a throwaway Postgres.
--
-- This is NOT Supabase. It is the smallest set of roles, schemas and functions that lets
-- the real migrations run unmodified against a plain `postgres:17` container, so that
-- `node scripts/verify-migrations.mjs` can execute them rather than merely read them.
--
-- Anything added here is a claim about what production provides. Keep it minimal: a
-- generous shim would let a migration pass locally and fail in Supabase, which is worse
-- than no check at all.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema if not exists auth;
create schema if not exists private;
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create table if not exists auth.users (
  id uuid primary key default extensions.gen_random_uuid(),
  email text unique,
  email_confirmed_at timestamptz default now()
);
create or replace function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
-- Supabase puts gen_random_uuid() on the search path everywhere; vanilla PG17 has it built in.
create schema if not exists storage;
create table if not exists storage.buckets (
  id text primary key, name text, public boolean default false,
  file_size_limit bigint, allowed_mime_types text[], owner uuid,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists storage.objects (
  id uuid primary key default extensions.gen_random_uuid(),
  bucket_id text references storage.buckets(id), name text, owner uuid,
  created_at timestamptz default now(), updated_at timestamptz default now(),
  last_accessed_at timestamptz default now(), metadata jsonb
);
alter table storage.objects enable row level security;
create or replace function storage.foldername(name text) returns text[]
language sql immutable as $$ select string_to_array(name, '/') $$;
create or replace function storage.filename(name text) returns text
language sql immutable as $$ select (string_to_array(name, '/'))[array_length(string_to_array(name,'/'),1)] $$;
create or replace function storage.extension(name text) returns text
language sql immutable as $$ select substring(name from '\.([^.]*)$') $$;
alter table auth.users add column if not exists raw_user_meta_data jsonb default '{}'::jsonb;
