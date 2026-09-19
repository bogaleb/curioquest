import { loadEnvFile } from 'node:process';
import { loadTs } from '../tests/load-typescript.mjs';

const { checkConnectivity } = loadTs('lib/supabase/connectivity');

try { loadEnvFile('.env.local'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
try {
  const result = await checkConnectivity();
  console.log(`Supabase connected; database version ${result.databaseVersion}.`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
