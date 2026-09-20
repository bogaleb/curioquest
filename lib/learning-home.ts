import type {PublicExplorer} from './explorer-view';
import {skillById, type SkillSubject} from './skill-graph';
import {bySubject, subjectRegistry} from './subjects';

// Presentation of recorded practice, never a second mastery or scoring engine.
export function learningHome(profile: PublicExplorer) {
  const practiced = bySubject(() => 0);
  for (const [id, evidence] of Object.entries(profile.skillMastery)) {
    const skill = skillById.get(id);
    if (skill && evidence.attemptCount > 0) practiced[skill.subject]++;
  }
  const active = profile.session && profile.session.index < profile.session.total ? profile.session : null;
  return {practiced, active, gradeLabel: profile.grade === 'prek' ? 'Pre-K explorer' : 'Grade 1 explorer'};
}

/** Every world a child can visit, described from the subject registry. */
export const homeWorlds: {id: SkillSubject; title: string; short: string; prek: string; grade1: string}[] =
  subjectRegistry.map((subject) => ({
    id: subject.id,
    title: subject.world,
    short: subject.eyebrow,
    prek: subject.younger,
    grade1: subject.older,
  }));

export function offscreenInvitation(grade: PublicExplorer['grade']) {
  return grade === 'prek'
    ? {title:'A tiny treasure hunt',text:'With a grown-up, find 3 leaves. Touch each leaf as you count. Can you find a different way to sort them?',skill:'Counting one by one · noticing differences'}
    : {title:'Be a number detective',text:'With a grown-up, collect 8 small objects. Split them into two groups. How many ways can you make 8? Explain one way.',skill:'Parts and wholes · explaining your thinking'};
}
