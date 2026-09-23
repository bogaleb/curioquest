'use client';
import type {ReadingActivity,ReadingSkill,ReadingWord} from '@/lib/reading/types';
import {coachScript} from '@/lib/reading/coach';
import type {LearningBandId} from '@/lib/learning-bands';

/**
 * The grown-up's script for the step on screen.
 *
 * Borrowed from the strongest idea in co-play phonics programmes such as Reading.com:
 * a parent needs no training if every step tells them exactly what to say. Each script
 * follows the same gradual release — I show, we try, you try — and ends with the one
 * correction a grown-up most often needs for that step, because a wrong correction
 * ("it's em!") undoes more than no correction at all.
 *
 * It is text for the adult, so it sits folded under the activity rather than in Nova's
 * bubble, and it is open by default only for the youngest bands, where a lesson is
 * expected to be done side by side.
 */
export function GrownUpCoach({activity,skill,word,teaching,band}:{activity:ReadingActivity;skill?:ReadingSkill;word?:ReadingWord;teaching:boolean;band:LearningBandId}){
  const script=coachScript(activity,{skill,word,teaching});
  const young=band==='early-preschool'||band==='prek';
  return (
    <details className="grownup-coach" open={young}>
      <summary>For the grown-up: what to say</summary>
      <ol>
        <li><strong>I show</strong><span>{script.show}</span></li>
        <li><strong>We try</strong><span>{script.together}</span></li>
        <li><strong>You try</strong><span>{script.alone}</span></li>
      </ol>
      <p><strong>If they get stuck:</strong> {script.stuck}</p>
      <p className="grownup-coach-note">Keep it short and stop while it is still fun. Praise hard work, not being clever.</p>
    </details>
  );
}
