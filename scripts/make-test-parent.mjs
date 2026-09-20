// Creates (or reuses) a confirmed parent account for local UI verification only.
// Never run against production data you care about; delete with --remove.
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n').filter(Boolean).map((l) => {
    const i = l.indexOf('=');
    return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
  }),
);
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const EMAIL = 'curioquest-ui-check@example.com';
const PASSWORD = 'ui-verification-passphrase-2026';

const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
const existing = list?.users.find((u) => u.email === EMAIL);

if (process.argv.includes('--remove')) {
  if (existing) { await admin.auth.admin.deleteUser(existing.id); console.log('removed', EMAIL); }
  else console.log('nothing to remove');
  process.exit(0);
}

if (existing) {
  console.log(JSON.stringify({ email: EMAIL, password: PASSWORD, id: existing.id, reused: true }));
} else {
  const { data, error } = await admin.auth.admin.createUser({
    email: EMAIL, password: PASSWORD, email_confirm: true,
    user_metadata: { display_name: 'UI Check' },
  });
  if (error) { console.error('create failed:', error.message); process.exit(1); }
  console.log(JSON.stringify({ email: EMAIL, password: PASSWORD, id: data.user.id, reused: false }));
}
