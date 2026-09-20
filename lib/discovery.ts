import { questions, type Question, type Subject } from "./curriculum";
import type { ExplorerProfile, GradeTrack } from "./explorers";
import { coreSubjects } from "./subjects";

export type DiscoveryProgress = {
  grade: GradeTrack;
  completedAt: string;
  subjects: Partial<Record<Subject, { independent: number; total: number; startingLevel: number }>>;
};

// Placement covers the core subjects only. A welcome check that asked about six
// subjects would be twelve activities long before a child has played anything.
const subjects: Subject[] = [...coreSubjects];

function pick(grade: GradeTrack, subject: Subject, level: number, exclude: string[], pool: Question[] = questions) {
  const question = pool.find(q => q.grade === grade && q.subject === subject &&
    q.level === level && !q.campaignOnly && !exclude.includes(q.id));
  if (!question) throw new Error(`Missing discovery activity for ${grade}/${subject}/${level}`);
  return question;
}

// `pool` is the served catalogue; see recommendQuest for why it is threaded through.
export function startDiscovery(profile: ExplorerProfile, id: string, pool: Question[] = questions) {
  if (profile.session && profile.session.index < profile.session.questions.length) return;
  if (profile.discovery?.grade === profile.grade) throw new Error("Nova already knows your starting paths. Your quests keep adapting as you explore.");
  const selected: Question[] = [];
  for (const subject of subjects) {
    for (let i = 0; i < 2; i++) selected.push(pick(profile.grade, subject, 1, selected.map(q => q.id), pool));
  }
  profile.session = {
    id, subject: "daily", questions: selected.map(q => q.id), index: 0, misses: 0,
    hinted: false, first: 0, started: Date.now(), estimatedMinutes: 12,
    discovery: { independent: Object.fromEntries(subjects.map((subject) => [subject, 0])) as Record<Subject, number> },
    plan: selected.map(q => ({ questionId: q.id, skillId: q.skillId, reason: "welcome-discovery" })),
  };
}

// Called once, on advancement. A hint or retry keeps the next discovery gentle.
export function advanceDiscovery(profile: ExplorerProfile, question: Question, independent: boolean, pool: Question[] = questions) {
  const session = profile.session;
  if (!session?.discovery) return;
  if (independent) session.discovery.independent[question.subject] += 1;
  if (session.index % 2 === 1) {
    const next = pick(profile.grade, question.subject, independent ? 2 : 1, session.questions, pool);
    session.questions[session.index] = next.id;
    session.plan![session.index] = { questionId: next.id, skillId: next.skillId, reason: "welcome-discovery" };
  }
  if (session.index === session.questions.length) {
    const results = {} as DiscoveryProgress["subjects"];
    for (const subject of subjects) {
      const independent = session.discovery.independent[subject];
      const startingLevel = independent === 2 ? 2 : 1;
      results[subject] = { independent, total: 2, startingLevel };
      // A short welcome never overwrites an established practice trail.
      if (profile.skills[subject].seen <= 2) profile.skills[subject].level = startingLevel;
    }
    profile.discovery = { grade: profile.grade, completedAt: new Date().toISOString(), subjects: results };
  }
}
