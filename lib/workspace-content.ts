import { z } from 'zod';
export const quizQuestionSchema=z.object({prompt:z.string().trim().min(1).max(350),answer:z.string().trim().min(1).max(100),choices:z.array(z.string().trim().min(1).max(100)).max(6).default([]),hint:z.string().max(350).default(''),explanation:z.string().max(500).default('')}).refine(q=>!q.choices.length||(q.choices.length>=2&&new Set(q.choices).size===q.choices.length&&q.choices.includes(q.answer)),'Choices must be unique and include the answer.');
export const quizSchema=z.object({title:z.string().trim().min(1).max(70),questions:z.array(quizQuestionSchema).min(1).max(20)});
export type Quiz=z.infer<typeof quizSchema>;
export type Assignment={title:string;questions:Quiz['questions'];index:number;correct:number;misses:number;completedAt?:string;due:string|null;badge:boolean;sourceId:string};
export type PublicAssignment=Omit<Assignment,'questions'> & {id:string;revision:number;total:number;question:Omit<Quiz['questions'][number],'answer'|'explanation'>|null};
export type WorkspaceItem<T=unknown>={id:string;profileId:string;kind:string;data:T;revision:number;updatedAt:string};
export function publicAssignment(item:WorkspaceItem<Assignment>):PublicAssignment{
  const {questions,...data}=item.data;
  const q=questions[data.index];
  return {...data,id:item.id,revision:item.revision,total:questions.length,question:q?{prompt:q.prompt,choices:q.choices,hint:q.hint}:null};
}
export const pointSchema=z.tuple([z.number().min(0).max(1000),z.number().min(0).max(700)]);
/**
 * One mark on a drawing.
 *
 * `color` is a *colour id* from `lib/studio/palette.ts` — "sunflower", "deep sea" — since
 * the Making Place rebuild, so a saved picture holds a name rather than a value and the
 * child layer never stores a raw hex. Artwork saved before that holds `#rrggbb`, and the
 * regex branch keeps it loading: a family's pictures are theirs, and quietly repainting
 * them to the nearest named colour is not a migration anyone asked for.
 *
 * `stamp` is a shape from the same catalogue the colouring pages are built from. It used
 * to be an emoji, which is why it was four characters long.
 */
export const markSchema=z.object({tool:z.enum(['pencil','marker','crayon','brush','eraser','stamp','fill']),color:z.string().regex(/^(#[0-9a-fA-F]{6}|[a-z][a-z0-9-]{0,23})$/),size:z.number().min(1).max(80),points:z.array(pointSchema).min(1).max(3000),stamp:z.string().max(20).optional()});
/**
 * A piece of a child's work.
 *
 * Three shapes in one record, because they are all "something my child made" to a parent
 * and they all belong in one gallery:
 *
 *   drawing   `marks` — strokes on blank paper
 *   coloring  `page` + `fills` — which colouring page, and what colour each region is
 *   writing   `caption` — a finished sentence or story, with `guide` holding the opening
 *
 * `fills` is capped at 64 entries because the largest page has 21 fillable regions, and a
 * cap is cheaper than trusting the client about how big a page is.
 */
export const artSchema=z.object({title:z.string().trim().min(1).max(70),mode:z.enum(['drawing','coloring','writing']),template:z.string().max(60).default('blank'),page:z.string().max(40).default(''),guide:z.string().max(50).default(''),caption:z.string().max(800).default(''),fills:z.record(z.string().max(40),z.string().max(24)).refine(value=>Object.keys(value).length<=64,'Too many coloured regions.').default({}),marks:z.array(markSchema).max(600)});
export type Artwork=z.infer<typeof artSchema>;
export type ArtMark=z.infer<typeof markSchema>;
