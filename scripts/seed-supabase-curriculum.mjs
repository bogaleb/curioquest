import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { loadTs } from '../tests/load-typescript.mjs';
const {questions,publicQuestion}=loadTs('lib/curriculum');
const {defaultReadingCatalog}=loadTs('lib/reading/content');
const {mediaAssets,mediaCues,worldItems}=loadTs('lib/experience/content');
const {stories,prayers}=loadTs('lib/story-library');
const id = value => { const h=createHash('sha256').update('curioquest:'+value).digest('hex').slice(0,32);return [h.slice(0,8),h.slice(8,12),h.slice(12,16),h.slice(16,20),h.slice(20)].join('-'); };
const q = value => "'"+String(value).replaceAll("'","''")+"'";
const json = value => q(JSON.stringify(value))+'::jsonb';
const sql = ['-- Generated from the versioned authored catalogs. No family data.', 'begin;'];
for(const [name,data] of Object.entries({questions,reading:defaultReadingCatalog,experience:{media:mediaAssets,cues:mediaCues,items:worldItems},stories:{stories,prayers}}))
 sql.push('insert into private.catalogs(name,data) values('+q(name)+','+json(data)+') on conflict(name) do update set data=excluded.data,version=catalogs.version+1;');
for(const subject of ['reading','math','logic'])
 sql.push('insert into public.subjects(id,slug,title,published) values('+q(id(subject))+','+q(subject)+','+q(subject[0].toUpperCase()+subject.slice(1))+',true) on conflict do nothing;');
const units=new Set(),lessons=new Set();
for(const question of questions) {
 const unit=question.grade+'-'+question.subject,lesson=unit+'-'+question.level;
 if(!units.has(unit)){sql.push('insert into public.units(id,subject_id,slug,title,grade,published) values('+q(id(unit))+','+q(id(question.subject))+','+q(unit)+','+q(question.subject)+','+q(question.grade)+',true);');units.add(unit);}
 if(!lessons.has(lesson)){sql.push('insert into public.lessons(id,unit_id,slug,title,position,published) values('+q(id(lesson))+','+q(id(unit))+','+q(lesson)+','+q('Trail '+question.level)+','+question.level+',true);');lessons.add(lesson);}
 const safe=publicQuestion(question),activity=id('activity:'+question.id),questionId=id('question:'+question.id);
 sql.push('insert into public.activities(id,lesson_id,slug,engine_kind,config,published) values('+q(activity)+','+q(id(lesson))+','+q(question.id)+','+q(question.activityType)+','+json(safe)+',true);');
 sql.push('insert into public.questions(id,activity_id,slug,prompt,options,hint) values('+q(questionId)+','+q(activity)+','+q(question.id)+','+q(question.prompt)+','+json(question.options)+','+q(question.hint)+');');
 sql.push('insert into private.question_answers(question_id,answer,explanation) values('+q(questionId)+','+json({answer:question.answer,engine:question.engine??null})+','+q(question.explanation)+');');
}
for(const domain of ['reading','experience'])
 sql.push('insert into public.lessons(id,unit_id,slug,title,published) values('+q(id('runtime-'+domain))+','+q(id('prek-reading'))+','+q('runtime-'+domain)+','+q('Adaptive '+domain)+',false);');
for(const [slug,title] of [['get-curious','Get curious'],['keep-exploring','Keep exploring'],['think-bigger','Think bigger'],['shine-bright','Shine bright']])
 sql.push('insert into public.achievements(id,slug,title,published) values('+q(id(slug))+','+q(slug)+','+q(title)+',true);');
for(const item of worldItems)sql.push('insert into public.rewards(id,slug,title,kind,presentation,published) values('+q(id('reward:'+item.id))+','+q(item.id)+','+q(item.name)+",'world-item',"+json(item)+',true);');
for(const media of mediaAssets)sql.push('insert into public.media_assets(id,slug,title,media_type,metadata,published) values('+q(id('media:'+media.id))+','+q(media.id)+','+q(media.title)+",'scene',"+json(media)+','+String(media.active)+');');
sql.push('commit;','');
writeFileSync('supabase/migrations/20260918000300_curriculum.sql',sql.join('\n'));
console.log('Generated '+questions.length+' activities with private answers and preserved catalog IDs.');
