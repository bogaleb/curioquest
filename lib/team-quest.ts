import type { ExplorerProfile } from "./explorers";
import { questions } from "./curriculum";

export function startTeamQuest(first: ExplorerProfile, second: ExplorerProfile, id: string, now=Date.now()) {
  if(first.id===second.id) throw new Error("Choose two different explorers.");
  for(const profile of [first,second]) {
    if(profile.session && profile.session.index<profile.session.questions.length) {
      throw new Error(`${profile.name} has an adventure in progress. Finish it before starting a Team Quest.`);
    }
    if(profile.team && !profile.team.completedAt) throw new Error(`${profile.name} has a Team Quest waiting to be finished.`);
  }
  for(const [profile,partner] of [[first,second],[second,first]]) {
    const ids=["seeds","word","garden-pattern"].map(slug=>`garden-${profile.grade}-${slug}`);
    profile.team={id,partnerId:partner.id};
    profile.session={
      id:crypto.randomUUID(),teamId:id,subject:"daily",questions:ids,index:0,misses:0,hinted:false,first:0,
      started:now,estimatedMinutes:6,
      plan:ids.map(questionId=>({questionId,skillId:questions.find(q=>q.id===questionId)!.skillId,reason:"team-role"})),
    };
    profile.events=[...profile.events,{type:"team-start",at:new Date(now).toISOString()}].slice(-100);
  }
}

export function completeTeamQuest(first:ExplorerProfile,second:ExplorerProfile,now=new Date()) {
  const id=first.team?.id;
  if(!id || second.team?.id!==id || first.team?.partnerId!==second.id || second.team?.partnerId!==first.id) {
    throw new Error("These explorers are not in the same Team Quest.");
  }
  if(!first.history.some(h=>h.teamId===id)||!second.history.some(h=>h.teamId===id)) {
    throw new Error("Both explorers have a part to play. Finish both sets of discoveries first.");
  }
  for(const profile of [first,second]) {
    profile.team!.completedAt ??= now.toISOString();
    if(!profile.adventure.unlocks.includes("Team treehouse")) profile.adventure.unlocks.push("Team treehouse");
  }
}
