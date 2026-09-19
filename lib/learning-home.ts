import type {PublicExplorer} from './explorer-view';
import {skillById, type SkillSubject} from './skill-graph';

// Presentation of recorded practice, never a second mastery or scoring engine.
export function learningHome(profile: PublicExplorer) {
  const practiced = {reading: 0, math: 0, logic: 0};
  for (const [id, evidence] of Object.entries(profile.skillMastery)) {
    const skill = skillById.get(id);
    if (skill && evidence.attemptCount > 0) practiced[skill.subject]++;
  }
  const active = profile.session && profile.session.index < profile.session.total ? profile.session : null;
  return {practiced, active, gradeLabel: profile.grade === 'prek' ? 'Pre-K explorer' : 'Grade 1 explorer'};
}

export const homeWorlds: {id: SkillSubject; title: string; short: string; prek: string; grade1: string}[] = [
  {id:'reading',title:'Word Forest',short:'Listen & read',prek:'Hear sounds. Find letter friends.',grade1:'Build words. Discover their meaning.'},
  {id:'math',title:'Number City',short:'Count & discover',prek:'Count objects. Explore shapes.',grade1:'Add, subtract, and explain your thinking.'},
  {id:'logic',title:'Logic Mountain',short:'Think & solve',prek:'Match, sort, and spot patterns.',grade1:'Plan a route. Test a new idea.'},
];

export function offscreenInvitation(grade: PublicExplorer['grade']) {
  return grade === 'prek'
    ? {title:'A tiny treasure hunt',text:'With a grown-up, find 3 leaves. Touch each leaf as you count. Can you find a different way to sort them?',skill:'Counting one by one · noticing differences'}
    : {title:'Be a number detective',text:'With a grown-up, collect 8 small objects. Split them into two groups. How many ways can you make 8? Explain one way.',skill:'Parts and wholes · explaining your thinking'};
}
