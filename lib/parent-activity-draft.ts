import {questions,type Subject} from './curriculum';
import {quizQuestionSchema,type Quiz} from './workspace-content';
import type {GradeBand} from './skill-graph';
// Only activities that remain meaningful without their interactive engine are eligible.
export function parentActivityDraft(grade:GradeBand,subject:Subject,level:number,count:number):Quiz{
  const candidates=questions.filter(q=>q.grade===grade&&q.subject===subject&&!q.engine&&!q.campaignOnly)
    .sort((a,b)=>Math.abs(a.level-level)-Math.abs(b.level-level)||a.id.localeCompare(b.id));
  const selected:Quiz['questions']=[];
  for(const q of candidates){
    const parsed=quizQuestionSchema.safeParse({prompt:[q.passage?.text,q.visual,q.prompt,q.audioLabel?`The word is ${q.audioLabel}.`:null].filter(Boolean).join('\n'),answer:q.answer,choices:q.options,hint:q.hint,explanation:q.explanation});
    if(parsed.success&&!selected.some(item=>item.prompt===parsed.data.prompt))selected.push(parsed.data);
    if(selected.length===count)break;
  }
  return {title:`${subject==='reading'?'Word Forest':subject==='math'?'Number City':'Logic Mountain'} personal quest`,questions:selected};
}
