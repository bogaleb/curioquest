import {database} from '@/db/raw';
import {defaultReadingCatalog} from './content';
import {newReadingProfile} from './engine';
import type {ReadingCatalog,ReadingProfile,ReadingAttempt} from './types';
export async function readingCatalog():Promise<ReadingCatalog>{
  const db=database();const configured=await db.prepare("SELECT data FROM reading_settings WHERE id='v1'").first<{data:string}>();
  if(!configured){await db.batch([
    ...defaultReadingCatalog.skills.map(s=>db.prepare('INSERT OR IGNORE INTO reading_skills(id,data) VALUES (?,?)').bind(s.id,JSON.stringify(s))),
    ...defaultReadingCatalog.words.map(w=>db.prepare('INSERT OR IGNORE INTO reading_words(id,data) VALUES (?,?)').bind(w.id,JSON.stringify(w))),
    ...defaultReadingCatalog.stories.map(s=>db.prepare('INSERT OR IGNORE INTO reading_stories(id,data) VALUES (?,?)').bind(s.id,JSON.stringify(s))),
    db.prepare("INSERT OR IGNORE INTO reading_settings(id,data) VALUES ('v1',?)").bind(JSON.stringify(defaultReadingCatalog.settings)),
  ]);}
  const [skills,words,stories,settings]=await Promise.all([db.prepare('SELECT data FROM reading_skills').all<{data:string}>(),db.prepare('SELECT data FROM reading_words ORDER BY rowid').all<{data:string}>(),db.prepare('SELECT data FROM reading_stories ORDER BY rowid').all<{data:string}>(),db.prepare("SELECT data FROM reading_settings WHERE id='v1'").first<{data:string}>()]);
  return {skills:skills.results.map(r=>JSON.parse(r.data)),words:words.results.map(r=>JSON.parse(r.data)),stories:stories.results.map(r=>JSON.parse(r.data)),settings:JSON.parse(settings!.data)};
}
export async function readingProfile(childId:string){
  const db=database();await db.prepare('INSERT OR IGNORE INTO reading_profiles(child_id,data,revision) SELECT ?,?,0 WHERE EXISTS (SELECT 1 FROM explorers WHERE id=?)').bind(childId,JSON.stringify(newReadingProfile()),childId).run();
  const row=await db.prepare('SELECT data,revision FROM reading_profiles WHERE child_id=?').bind(childId).first<{data:string;revision:number}>();
  return row?{profile:JSON.parse(row.data) as ReadingProfile,revision:row.revision}:null;
}
export async function saveReading(childId:string,profile:ReadingProfile,revision:number,attempt:ReadingAttempt|null,stars=0){
  // Unique server nonce ties all side effects to the winning compare-and-swap.
  const db=database(),mutation=crypto.randomUUID();profile.lastMutation=mutation;
  const statements=[db.prepare('UPDATE reading_profiles SET data=?,revision=revision+1 WHERE child_id=? AND revision=?').bind(JSON.stringify(profile),childId,revision)];
  if(attempt)statements.push(db.prepare("INSERT INTO reading_attempts(id,child_id,session_id,data,created_at) SELECT ?,?,?,?,? WHERE EXISTS (SELECT 1 FROM reading_profiles WHERE child_id=? AND json_extract(data,'$.lastMutation')=?)").bind(attempt.id,childId,attempt.sessionId,JSON.stringify(attempt),attempt.createdAt,childId,mutation));
  if(stars)statements.push(db.prepare("UPDATE explorers SET data=json_set(data,'$.stars',COALESCE(json_extract(data,'$.stars'),0)+?),revision=revision+1 WHERE id=? AND EXISTS (SELECT 1 FROM reading_profiles WHERE child_id=? AND json_extract(data,'$.lastMutation')=?)").bind(stars,childId,childId,mutation));
  const result=await db.batch(statements);return result[0].meta.changes===1;
}
