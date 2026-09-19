import {readFileSync,writeFileSync,readdirSync,mkdirSync} from 'node:fs';
const files=readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql')&&!f.startsWith('20260918000100')).sort();
const sql=['-- Apply once to the project that already has Phase 1. Entire upgrade is atomic.','begin;',...files.map(file=>'-- '+file+'\n'+readFileSync('supabase/migrations/'+file,'utf8').replace(/^begin;\s*$/gmi,'').replace(/^commit;\s*$/gmi,'')),'commit;',''].join('\n');
mkdirSync('work',{recursive:true});writeFileSync('work/supabase-upgrade.sql',sql);
console.log('Prepared work/supabase-upgrade.sql from '+files.length+' version-controlled migrations.');
