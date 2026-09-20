import { z } from 'zod';
export const controlsSchema = z.object({
  age: z.number().int().min(3).max(12).nullable().default(null),
  schoolGrade: z.enum(['prek','kindergarten','grade1','grade2']).default('prek'),
  priorities: z.array(z.enum(['reading','math','logic','science','world','wellbeing'])).max(3).default([]),
  challenge: z.enum(['adaptive','gentle','stretch']).default('adaptive'),
  questLength: z.number().int().min(3).max(15).nullable().default(null),
  allowedDays: z.array(z.number().int().min(0).max(6)).min(1).max(7).default([0,1,2,3,4,5,6]),
  bedtime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().default(null),
  timeZone: z.string().max(80).refine(value=>{try{new Intl.DateTimeFormat('en',{timeZone:value});return true;}catch{return false;}},'Choose a valid time zone').default('America/New_York'),
  faith: z.boolean().default(false),
  offline: z.boolean().default(true),
  audio: z.object({effects:z.boolean().default(false),music:z.boolean().default(false),musicVolume:z.number().min(0).max(1).default(.15),narration:z.boolean().default(true),voiceVolume:z.number().min(0).max(1).default(.8),celebration:z.enum(['gentle','cheerful','energetic','minimal','silent']).default('gentle'),sound:z.enum(['bells','sparkle','cheer']).default('bells')}).default({}),
});
export type LearningControls = z.infer<typeof controlsSchema>;
export function defaultControls(grade='prek'):LearningControls {return controlsSchema.parse({schoolGrade:grade});}
export function normalizeControls(value:unknown,grade='prek'){const result=controlsSchema.safeParse(value);return result.success?result.data:defaultControls(grade);}
export function scheduleMessage(controls:LearningControls,now=new Date()) {
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:controls.timeZone,weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now);
  const part=(key:string)=>parts.find(p=>p.type===key)?.value??'';
  const day=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(part('weekday'));
  if(!controls.allowedDays.includes(day))return 'Today is a day for adventures away from the screen. Your work is saved.';
  if(controls.bedtime&&`${part('hour')}:${part('minute')}`>=controls.bedtime)return 'Time to rest. Your adventures will be here another day.';
  return null;
}
