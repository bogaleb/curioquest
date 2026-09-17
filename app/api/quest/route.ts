import { database } from "@/db/raw";
import { questions, publicQuestion, type Subject } from "@/lib/curriculum";
import {
  AVATARS,
  INTERESTS,
  newExplorer,
  normalizeExplorer,
  type AvatarId,
  type ExplorerProfile,
  type GradeTrack,
  type InterestId,
} from "@/lib/explorers";
import { recordAttempt, recordHint } from "@/lib/mastery";
import { recommendQuest, rememberActivityType } from "@/lib/recommendation";
import { evaluateResponse } from "@/lib/activity-evaluation";
import { campaignChapters, campaignQuestionIds } from "@/lib/campaign";
import { validGarden } from "@/lib/adventure";
import { startTeamQuest, completeTeamQuest } from "@/lib/team-quest";
import { authoredHint } from "@/lib/nova";
import { startDiscovery, advanceDiscovery } from "@/lib/discovery";
import { arcadeKey, arcadeQuestionIds, gameById } from "@/lib/arcade";
import { parentAuthorized, familyAuthorized } from "@/lib/parent-security";
import { requestJson, RequestBodyError } from "@/lib/request-json";
import { parkSession, resumeSession } from "@/lib/saved-sessions";

const subjects: Subject[] = ["reading", "math", "logic"];
const allowedGoals = [8, 10, 15, 20];
const maxProfiles = 4;

type ExplorerRow = { data: string; revision: number };

function defaultProfiles() {
  return [
    newExplorer("maya", "Maya", "grade1", "fox", ["stories", "puzzles"], 10),
    newExplorer("lydia", "Lydia", "prek", "rabbit", ["animals", "nature"], 8),
  ];
}

async function ensureFamily() {
  const db = database();
  const count = await db.prepare("SELECT COUNT(*) AS total FROM explorers").first<{ total: number }>();
  if (Number(count?.total ?? 0) > 0) return;

  await db.batch(
    defaultProfiles().map((profile) =>
      db
        .prepare("INSERT OR IGNORE INTO explorers (id, data, revision) VALUES (?, ?, 0)")
        .bind(profile.id, JSON.stringify(profile)),
    ),
  );
}

async function row(id: string) {
  return database()
    .prepare("SELECT data, revision FROM explorers WHERE id = ?")
    .bind(id)
    .first<ExplorerRow>();
}

function clean(profile: ExplorerProfile) {
  return {
    ...profile,
    savedSessions: profile.savedSessions.map(({ id, subject, index, questions, gameId, gameLevel, chapter, teamId, discovery }) => ({ id, subject, index, total: questions.length, gameId, gameLevel, chapter, teamId, discovery: !!discovery })),
    session: profile.session
      ? {
          ...profile.session,
          questions: undefined,
          question:
            profile.session.index < profile.session.questions.length
              ? publicQuestion(
                  questions.find(
                    (question) => question.id === profile.session?.questions[profile.session.index],
                  )!,
                )
              : null,
          total: profile.session.questions.length,
        }
      : null,
  };
}

async function readAll() {
  await ensureFamily();
  const result = await database()
    .prepare("SELECT data FROM explorers ORDER BY rowid")
    .all<{ data: string }>();
  return result.results.map((item) => clean(normalizeExplorer(JSON.parse(item.data))));
}

function validName(value: unknown): value is string {
  return typeof value === "string" && value.trim().length >= 1 && value.trim().length <= 24;
}

function validGrade(value: unknown): value is GradeTrack {
  return value === "prek" || value === "grade1";
}

function validAvatar(value: unknown): value is AvatarId {
  return typeof value === "string" && AVATARS.some((avatar) => avatar.id === value);
}

function validInterests(value: unknown): value is InterestId[] {
  return (
    Array.isArray(value) &&
    value.length <= 3 &&
    value.every(
      (interest, index) =>
        typeof interest === "string" &&
        value.indexOf(interest) === index &&
        INTERESTS.some((option) => option.id === interest),
    )
  );
}

function validGoal(value: unknown) {
  return allowedGoals.includes(Number(value));
}

export async function GET(request: Request) {
  try {
    if(!(await familyAuthorized(request)))return Response.json({error:"Sign in with this family's account to open its adventures."},{status:403,headers:{"Cache-Control":"no-store"}});
    return Response.json({ profiles: await readAll() }, {headers:{"Cache-Control":"no-store"}});
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "We could not load your adventures. Please try again." },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  try {
    if(!(await familyAuthorized(request)))return Response.json({error:"Sign in with this family's account to open its adventures."},{status:403});
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) {
      return Response.json({ error: "Request not allowed." }, { status: 403 });
    }

    let input:Record<string,unknown>;
    try { input=await requestJson(request,12000); }
    catch(error){if(error instanceof RequestBodyError)return Response.json({error:error.message},{status:error.status});throw error;}
    if (["create-profile","profile","offline-confirm","preferences"].includes(String(input.action)) && !(await parentAuthorized(request))) {
      return Response.json({error:"Unlock Parent Corner to change family settings."},{status:403});
    }

    if (input.action === "create-profile") {
      if (
        !validName(input.name) ||
        !validGrade(input.grade) ||
        !validAvatar(input.avatar) ||
        !validInterests(input.interests) ||
        !validGoal(input.dailyGoal)
      ) {
        return Response.json(
          { error: "Please complete the explorer profile and choose up to three interests." },
          { status: 400 },
        );
      }

      const count = await database()
        .prepare("SELECT COUNT(*) AS total FROM explorers")
        .first<{ total: number }>();
      if (Number(count?.total ?? 0) >= maxProfiles) {
        return Response.json(
          { error: "A family can have up to four explorer profiles in this edition." },
          { status: 409 },
        );
      }

      const id = `explorer_${crypto.randomUUID()}`;
      const profile = newExplorer(
        id,
        input.name.trim(),
        input.grade,
        input.avatar,
        input.interests,
        Number(input.dailyGoal),
      );
      const inserted = await database()
        .prepare("INSERT INTO explorers (id, data, revision) SELECT ?, ?, 0 WHERE (SELECT COUNT(*) FROM explorers) < 4")
        .bind(id, JSON.stringify(profile))
        .run();
      if (!inserted.meta.changes) return Response.json({error:"This family already has four explorers."},{status:409});
      return Response.json({ profile: clean(profile) }, { status: 201 });
    }

    if (typeof input.profile !== "string" || input.profile.length > 80) {
      return Response.json({ error: "Choose an explorer." }, { status: 400 });
    }

    const old = await row(input.profile);
    if (!old) {
      return Response.json({ error: "That explorer profile was not found." }, { status: 404 });
    }

    const profile = normalizeExplorer(JSON.parse(old.data));
    if (profile.preferences.paused && ["start","game-start","session-resume","campaign-start","discovery-start","team-start","answer","hint","save-garden"].includes(String(input.action))) {
      return Response.json({error:"Your adventures are taking a little rest. A grown-up can resume them in Parent Corner."},{status:403});
    }
    if (input.action === "team-start" || input.action === "team-complete") {
      const partnerId=input.action==="team-start"?input.partner:profile.team?.partnerId;
      if (typeof partnerId!=="string" || partnerId===profile.id) return Response.json({error:"Choose a different explorer to join you."},{status:400});
      const partnerRow=await row(partnerId);
      if (!partnerRow) return Response.json({error:"That explorer was not found."},{status:404});
      const partner=normalizeExplorer(JSON.parse(partnerRow.data));
      try {
        if (input.action==="team-start") startTeamQuest(profile,partner,crypto.randomUUID());
        else completeTeamQuest(profile,partner);
      } catch (error) { return Response.json({error:(error as Error).message},{status:409}); }
      // One SQLite statement updates both records only if both revisions still match.
      const result=await database().prepare(
        "UPDATE explorers SET data = CASE id WHEN ? THEN ? ELSE ? END, revision = revision + 1 WHERE id IN (?, ?) AND (SELECT COUNT(*) FROM explorers WHERE (id = ? AND revision = ?) OR (id = ? AND revision = ?)) = 2"
      ).bind(profile.id,JSON.stringify(profile),JSON.stringify(partner),profile.id,partner.id,profile.id,old.revision,partner.id,partnerRow.revision).run();
      if(result.meta.changes!==2) return Response.json({error:"Your team changed in another window. Reload and try again."},{status:409});
      return Response.json({profile:clean(profile),profiles:[clean(profile),clean(partner)]});
    }
    let feedback: { correct?: boolean; message?: string; hint?: string | null } | null = null;

    if (input.action === "profile") {
      if (
        !validName(input.name) ||
        !validGrade(input.grade) ||
        !validAvatar(input.avatar) ||
        !validInterests(input.interests) ||
        !validGoal(input.dailyGoal)
      ) {
        return Response.json(
          { error: "Please complete the explorer profile and choose up to three interests." },
          { status: 400 },
        );
      }

      if (input.grade !== profile.grade) {
        if(profile.team&&!profile.team.completedAt)return Response.json({error:"Finish the shared Team Quest before changing learning tracks."},{status:409});
        const reset = newExplorer(
          profile.id,
          profile.name,
          input.grade,
          profile.avatar,
          profile.interests,
          profile.dailyGoal,
        );
        profile.skills = reset.skills;
        // Evidence describes the learner, so it survives a change in starting track.
        profile.recentActivityTypes = [];
        profile.seen = [];
        profile.session = null;
        profile.savedSessions = [];
      }
      profile.name = input.name.trim();
      profile.grade = input.grade;
      profile.avatar = input.avatar;
      profile.interests = input.interests;
      profile.dailyGoal = Number(input.dailyGoal);
    } else if (input.action === "favorite-game") {
      const game = gameById(input.game);
      if (!game || typeof input.favorite !== "boolean") return Response.json({error:"Choose a game."},{status:400});
      profile.favorites = profile.favorites.filter(id=>id!==game.id);
      if (input.favorite) profile.favorites.push(game.id);
    } else if (input.action === "preferences") {
      if (typeof input.autoRead !== "boolean" || typeof input.reducedMotion !== "boolean" || (input.paused!==undefined&&typeof input.paused!=="boolean")) return Response.json({error:"Choose your comfort settings."},{status:400});
      profile.preferences = {autoRead:input.autoRead,reducedMotion:input.reducedMotion,paused:typeof input.paused==="boolean"?input.paused:profile.preferences.paused};
    } else if (input.action === "session-resume") {
      if (profile.session && profile.session.id === input.session && profile.session.index < profile.session.questions.length) return Response.json({profile:clean(profile)});
      if (typeof input.session !== "string" || !resumeSession(profile, input.session)) return Response.json({error:"That saved adventure is no longer available. Choose a game to play."},{status:404});
    } else if (input.action === "game-start") {
      const game = gameById(input.game), level = input.level;
      if (!game || typeof level!=="number" || !Number.isInteger(level) || level<0 || level>2) return Response.json({error:"Choose a game mission."},{status:400});
      const completed=profile.arcade[arcadeKey(profile.grade,game.id)]?.levels??[];
      if (level>0 && !completed.includes(level-1)) return Response.json({error:"Explore the earlier mission first."},{status:409});
      if (profile.session?.gameId === game.id && profile.session.gameLevel === level && profile.session.index < profile.session.questions.length) return Response.json({profile:clean(profile)});
      const saved = profile.savedSessions.find(session => session.gameId === game.id && session.gameLevel === level);
      if (saved) resumeSession(profile, saved.id);
      else {
      parkSession(profile);
      const ids=arcadeQuestionIds(profile.grade,game.id,level);
      profile.session={id:crypto.randomUUID(),subject:game.subject,questions:ids,index:0,misses:0,hinted:false,first:0,started:Date.now(),estimatedMinutes:8,gameId:game.id,gameLevel:level,
        plan:ids.map(id=>({questionId:id,skillId:questions.find(q=>q.id===id)!.skillId,reason:"game-mission"}))};
      }
    } else if (input.action === "reflect") {
      const session=profile.session;
      if (!session || session.id!==input.session || session.index<1 ||
        session.questions[session.index-1]!==input.question ||
        !["counted","clue","pattern","tried"].includes(String(input.strategy))) {
        return Response.json({error:"Share a strategy after making a discovery."},{status:400});
      }
      profile.reflections=[...profile.reflections.filter(r=>r.sessionId!==session.id||r.questionId!==input.question),
        {sessionId:session.id,questionId:String(input.question),strategy:String(input.strategy),at:new Date().toISOString()}].slice(-100);
    } else if (input.action === "save-garden") {
      if (!validGarden(input.garden)) return Response.json({error:"Choose a garden piece for each space."},{status:400});
      if (input.garden.includes("sunflower") && !profile.adventure.chapters.includes(2)) {
        return Response.json({error:"Finish the garden story to unlock sunflowers."},{status:400});
      }
      if (input.garden.includes("treehouse") && !profile.adventure.unlocks.includes("Team treehouse")) {
        return Response.json({error:"Finish a Team Quest together to discover the treehouse."},{status:400});
      }
      profile.adventure.garden=input.garden;
      profile.adventure.gardenSavedAt=new Date().toISOString();
    } else if (input.action === "offline-request" || input.action === "offline-confirm") {
      if (!profile.adventure.chapters.includes(2)) return Response.json({error:"Finish the garden story first."},{status:409});
      if (input.action === "offline-request") profile.adventure.offline.requestedAt ??= new Date().toISOString();
      else {
        if (!profile.adventure.offline.requestedAt) return Response.json({error:"Ask your explorer to share their seed mission first."},{status:409});
        profile.adventure.offline.confirmedAt ??= new Date().toISOString();
      }
    } else if (input.action === "feeling") {
      if (!["easy","right","tricky"].includes(String(input.value)) || typeof input.session!=="string"
        || !profile.history.some(h=>h.sessionId===input.session)) return Response.json({error:"Choose a feeling for a completed quest."},{status:400});
      profile.adventure.feelings=[...profile.adventure.feelings.filter(f=>f.sessionId!==input.session),
        {sessionId:input.session,value:input.value as "easy"|"right"|"tricky",date:new Date().toISOString()}].slice(-30);
    } else if (input.action === "discovery-start") {
      try { startDiscovery(profile, crypto.randomUUID()); }
      catch (error) { return Response.json({ error: (error as Error).message }, { status: 409 }); }
    } else if (input.action === "campaign-start") {
      if (profile.session && profile.session.index < profile.session.questions.length) return Response.json({profile:clean(profile)});
      const chapter=campaignChapters.findIndex((_,i)=>!profile.adventure.chapters.includes(i));
      if (chapter<0) return Response.json({error:"You solved the seed mystery! Visit your garden to keep creating."},{status:409});
      const ids=campaignQuestionIds(profile.grade,chapter);
      profile.session={id:crypto.randomUUID(),subject:"daily",questions:ids,index:0,misses:0,hinted:false,first:0,
        started:Date.now(),estimatedMinutes:ids.length*2,chapter,
        plan:ids.map(id=>({questionId:id,skillId:questions.find(q=>q.id===id)!.skillId,reason:"story-mission"}))};
    } else if (input.action === "start") {
      if (input.subject !== "daily" && !subjects.includes(input.subject as Subject)) {
        return Response.json({ error: "Choose a world." }, { status: 400 });
      }
      const requestedSubject = input.subject as Subject | "daily";
      if (
        profile.session &&
        profile.session.index < profile.session.questions.length
      ) {
        return Response.json({ profile: clean(profile) });
      }

      const recommendation = recommendQuest(profile, requestedSubject);
      if (!recommendation.questionIds.length) {
        return Response.json({ error: "No quest activities are ready for this explorer." }, { status: 409 });
      }
      profile.session = {
        id: crypto.randomUUID(),
        subject: requestedSubject,
        questions: recommendation.questionIds,
        index: 0,
        misses: 0,
        hinted: false,
        first: 0,
        started: Date.now(),
        estimatedMinutes: recommendation.estimatedMinutes,
        plan: recommendation.plan,
      };
    } else if (input.action === "answer" || input.action === "hint") {
      const session = profile.session;
      if (
        !session ||
        session.id !== input.session ||
        session.index >= session.questions.length ||
        input.question !== session.questions[session.index]
      ) {
        return Response.json(
          { error: "This activity changed. Please return to your adventure and try again." },
          { status: 409 },
        );
      }

      const question = questions.find((item) => item.id === session.questions[session.index])!;
      if (input.action === "hint") {
        if (!session.hinted) recordHint(profile.skillMastery, question);
        session.hinted = true;
        session.hintLevel=Math.min(3,(session.hintLevel??0)+1);
        feedback = { hint: authoredHint(question,{activityId:question.id,skillId:question.skillId,track:question.grade,hintLevel:session.hintLevel}).text };
      } else {
        const evaluation = evaluateResponse(question, input.answer);
        if (!evaluation.valid) {
          return Response.json({ error: "Choose one of the answers." }, { status: 400 });
        }
        const correct = evaluation.correct;
        const independent = session.misses === 0 && !session.hinted;
        // One evidence observation per question. Retries remain useful practice,
        // but cannot manufacture mastery or inflate confidence.
        if (session.misses === 0) recordAttempt(profile.skillMastery, question, session.id, correct, independent);
        feedback = {
          correct,
          message: correct ? question.explanation : "Good thinking. Let’s try another answer.",
          hint: correct ? null : question.hint,
        };
        if (correct) {
          const skill = profile.skills[question.subject];
          skill.seen += 1;
          profile.recentActivityTypes = rememberActivityType(
            profile.recentActivityTypes,
            question.activityType,
          );
          if (independent) {
            skill.first += 1;
            session.first += 1;
          }
          if (!profile.seen.includes(question.id)) profile.seen.push(question.id);
          profile.recentQuestionIds = [...profile.recentQuestionIds, question.id].slice(-20);
          session.index += 1;
          advanceDiscovery(profile, question, independent);
          session.misses = 0;
          session.hinted = false;
          session.hintLevel = 0;
          if (skill.seen % 5 === 0) {
            const ratio = skill.first / skill.seen;
            if (ratio >= 0.8) skill.level = Math.min(3, skill.level + 1);
            else if (ratio < 0.5) skill.level = Math.max(1, skill.level - 1);
          }
          if (session.index === session.questions.length) {
            if (session.gameId && session.gameLevel!==undefined) {
              const key=arcadeKey(profile.grade,session.gameId), previous=profile.arcade[key];
              profile.arcade[key]={levels:[...new Set([...(previous?.levels??[]),session.gameLevel])],plays:(previous?.plays??0)+1,lastPlayedAt:new Date().toISOString()};
            }
            if (session.chapter !== undefined && !profile.adventure.chapters.includes(session.chapter)) {
              profile.adventure.chapters.push(session.chapter);
              const unlock=campaignChapters[session.chapter]?.unlock;
              if (unlock && !profile.adventure.unlocks.includes(unlock)) profile.adventure.unlocks.push(unlock);
            }
            profile.completed += 1;
            profile.stars += session.questions.length * 2;
            profile.history = [
              {
                date: new Date().toISOString(),
                subject: session.subject,
                first: session.first,
                total: session.questions.length,
                grade: profile.grade,
                skillIds: [...new Set(session.plan?.map((item) => item.skillId) ?? [])],
                durationSeconds: Math.max(1, Math.round((Date.now() - session.started) / 1000)),
                sessionId:session.id,
                chapter:session.chapter,
                teamId:session.teamId,
                discovery:!!session.discovery,
                gameId:session.gameId,
                gameLevel:session.gameLevel,
              },
              ...profile.history,
            ].slice(0, 100);
          }
        } else {
          session.misses += 1;
        }
      }
    } else {
      return Response.json({ error: "Unknown action." }, { status: 400 });
    }

    profile.events=[...profile.events,{type:String(input.action),at:new Date().toISOString(),
      ...(typeof input.question==="string"?{questionId:input.question}:{})}].slice(-100);
    const result = await database()
      .prepare("UPDATE explorers SET data = ?, revision = revision + 1 WHERE id = ? AND revision = ?")
      .bind(JSON.stringify(profile), profile.id, old.revision)
      .run();
    if (!result.meta.changes) {
      return Response.json(
        { error: "Progress changed in another window. Please reload." },
        { status: 409 },
      );
    }
    return Response.json({ profile: clean(profile), feedback });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Your progress could not be saved. Please try again." },
      { status: 503 },
    );
  }
}
