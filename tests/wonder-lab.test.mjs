import test from "node:test";
import assert from "node:assert/strict";
import { loadTs } from "./load-typescript.mjs";

const { labTopics, allLabStations, publicLab, judgeLabAttempt, stationSteps, stationsForTier, tierForBand } =
  loadTs("lib/science/lab");
const { labObjectArt, labDiagrams, labStrands, labTiers } = loadTs("lib/science/types");
const { skillById } = loadTs("lib/skill-graph");
const { labQuestion } = loadTs("lib/science/lab-events");
const { isValidEvent, eventForQuestion } = loadTs("lib/learning-events");

const ART = new Set(labObjectArt);
const DIAGRAMS = new Set(labDiagrams);

/** Every art key a station names, wherever it names one. */
function artKeysOf(station) {
  const activity = station.activity;
  if (activity.kind === "predict") return activity.setups.map((setup) => setup.art);
  if (activity.kind === "sort") return [...activity.bins, ...activity.items].map((entry) => entry.art);
  if (activity.kind === "sequence") return activity.stages.map((stage) => stage.art);
  if (activity.kind === "fair-test") return activity.variables.map((variable) => variable.art);
  return [];
}

/** The right answer for one step of a station, as the client would send it. */
function correctAttempt(station, step) {
  const activity = station.activity;
  if (activity.kind === "predict") return { step, choice: activity.setups[step].outcome };
  if (activity.kind === "sort") return { step, item: activity.items[step].id, choice: activity.items[step].bin };
  if (activity.kind === "sequence") return { step, order: activity.stages.map((stage) => stage.id) };
  if (activity.kind === "fair-test") return { step, choice: activity.change };
  // `label` is answered by hotspot id, and the mapping is deliberately server-side.
  // The test below brute-forces it, which is also the proof that it cannot be guessed
  // from anything in the public payload.
  return null;
}

/* ------------------------------------------------------------------ the content */

test("every station files its evidence under a real, active science skill", () => {
  for (const station of allLabStations) {
    const skill = skillById.get(station.skillId);
    assert.ok(skill, `${station.id} names unknown skill ${station.skillId}`);
    assert.equal(skill.subject, "science", `${station.id} is filed under a non-science skill`);
    assert.ok(skill.active, `${station.id} points at an inactive skill`);
  }
});

test("every drawn thing a station names has a drawing", () => {
  for (const station of allLabStations) {
    for (const art of artKeysOf(station)) {
      assert.ok(ART.has(art), `${station.id} names art "${art}", which nothing draws`);
    }
    if (station.activity.kind === "label") {
      assert.ok(DIAGRAMS.has(station.activity.diagram), `${station.id} names an undrawn diagram`);
    }
  }
  for (const topic of labTopics) {
    assert.ok(ART.has(topic.art), `topic ${topic.id} names art "${topic.art}", which nothing draws`);
  }
});

test("the lab is a science lab, not a physics lab with a plant in it", () => {
  const covered = new Set(labTopics.map((topic) => topic.strand));
  for (const strand of labStrands) {
    assert.ok(covered.has(strand), `no topic covers the ${strand} strand`);
  }
  // Wave 07's completion criterion, as a number. The lab it replaces had nine
  // experiments and one interaction between them.
  assert.ok(allLabStations.length >= 25, `only ${allLabStations.length} stations`);
  const kinds = new Set(allLabStations.map((station) => station.activity.kind));
  assert.ok(kinds.size >= 5, `only ${kinds.size} kinds of interaction in the whole lab`);
});

test("every tier has a lab of its own, and the youngest is never left with scraps", () => {
  for (const tier of labTiers) {
    const topics = labTopics.filter((topic) => stationsForTier(topic, tier).length > 0);
    assert.ok(topics.length >= 6, `${tier} sees only ${topics.length} topics`);
    const strands = new Set(topics.map((topic) => topic.strand));
    assert.ok(strands.size >= 4, `${tier} sees only ${strands.size} strands`);
  }
});

test("age changes what is said, not just how loudly", () => {
  for (const station of allLabStations) {
    if (station.tiers.includes("explorer") && station.tiers.includes("scientist")) {
      assert.notEqual(
        station.explain.explorer,
        station.explain.scientist,
        `${station.id} says the same thing to a four-year-old and a nine-year-old`,
      );
      assert.notEqual(
        station.notebook.explorer,
        station.notebook.scientist,
        `${station.id} asks the same notebook question of every age`,
      );
    }
  }
});

test("every station offers a way to try it away from the screen, with an adult", () => {
  for (const station of allLabStations) {
    assert.ok(station.offscreen.length > 30, `${station.id} has no real off-screen invitation`);
    assert.match(
      station.offscreen,
      /grown-up|Ask a grown-up/i,
      `${station.id} sends a child off to do something alone`,
    );
  }
});

test("no clue gives away the outcome it is a clue to", () => {
  for (const station of allLabStations) {
    if (station.activity.kind !== "predict") continue;
    const outcomes = station.activity.outcomes;
    for (const setup of station.activity.setups) {
      const answer = outcomes.find((outcome) => outcome.id === setup.outcome);
      for (const tier of station.tiers) {
        // Only words that belong to *this* outcome and no other. A word every option
        // shares — "magnet" in "the magnet attracts it" and "the magnet does not
        // attract it" — is the name of the apparatus, and a clue is allowed to say
        // what is on the bench.
        const shared = new Set(
          outcomes
            .filter((outcome) => outcome.id !== setup.outcome)
            .flatMap((outcome) => outcome.label[tier].toLowerCase().replace(/[^a-z ]/g, "").split(" ")),
        );
        const words = answer.label[tier]
          .toLowerCase()
          .replace(/[^a-z ]/g, "")
          .split(" ")
          .filter((word) => word.length > 4 && !shared.has(word));
        for (const clue of setup.clues) {
          const detail = clue.detail[tier].toLowerCase();
          for (const word of words) {
            assert.ok(
              !detail.includes(word),
              `${station.id}/${setup.id} clue "${clue.id}" contains the outcome word "${word}" for ${tier}`,
            );
          }
        }
      }
    }
  }
});

test("a labelled part is never named in the question that asks for it", () => {
  // The whole point of an unlabelled diagram is that the child works out where the job
  // happens. A question that says "the stem holds the plant up" has already answered
  // itself, and can be solved by matching a word rather than by understanding anything.
  for (const station of allLabStations) {
    if (station.activity.kind !== "label") continue;
    for (const part of station.activity.parts) {
      for (const tier of station.tiers) {
        const name = part.label[tier].toLowerCase().replace(/^the /, "");
        const singular = name.endsWith("s") ? name.slice(0, -1) : name;
        const job = part.job[tier].toLowerCase();
        assert.ok(
          !job.includes(singular),
          `${station.id}/${part.id} names "${part.label[tier]}" in the question asking for it (${tier})`,
        );
      }
    }
  }
});

/* ------------------------------------------------------------------- the answers */

test("the public lab carries no answer, no observation and no explanation", () => {
  for (const tier of labTiers) {
    const payload = JSON.stringify(publicLab(tier, new Set()));
    for (const station of allLabStations) {
      if (!station.tiers.includes(tier)) continue;
      assert.ok(!payload.includes(station.explain[tier]), `${station.id} ships its explanation to the browser`);
      const activity = station.activity;
      if (activity.kind === "predict") {
        for (const setup of activity.setups) {
          assert.ok(
            !payload.includes(setup.observation[tier]),
            `${station.id}/${setup.id} ships its observation before the child has predicted`,
          );
        }
      }
      if (activity.kind === "label") {
        for (const part of activity.parts) {
          assert.ok(
            !payload.includes(`"label":"${part.label[tier]}"`),
            `${station.id} writes "${part.label[tier]}" onto the diagram before it is found`,
          );
        }
      }
      if (activity.kind === "fair-test") {
        assert.ok(!payload.includes(activity.because[tier]), `${station.id} ships the reason with the question`);
      }
    }
  }
});

test("a sort station's bench never arrives already sorted", () => {
  for (const tier of labTiers) {
    for (const topic of publicLab(tier, new Set())) {
      for (const station of topic.stations) {
        if (station.activity.kind !== "sort") continue;
        const authored = allLabStations.find((one) => one.id === station.id).activity.items;
        const shown = station.activity.items.map((item) => item.id);
        assert.notDeepEqual(shown, authored.map((item) => item.id), `${station.id} is served in authored order`);
      }
    }
  }
});

test("a sequence station never arrives in the right order", () => {
  for (const tier of labTiers) {
    for (const topic of publicLab(tier, new Set())) {
      for (const station of topic.stations) {
        if (station.activity.kind !== "sequence") continue;
        const truth = allLabStations
          .find((one) => one.id === station.id)
          .activity.stages.map((stage) => stage.id);
        assert.notDeepEqual(
          station.activity.stages.map((stage) => stage.id),
          truth,
          `${station.id} hands the child the finished answer`,
        );
      }
    }
  }
});

test("the server accepts every right answer and finishes on the last one", () => {
  for (const station of allLabStations) {
    for (const tier of station.tiers) {
      const steps = stationSteps(station);
      for (let step = 0; step < steps; step += 1) {
        const attempt = correctAttempt(station, step);
        if (!attempt) continue;
        const judged = judgeLabAttempt(station, tier, attempt);
        assert.ok(judged, `${station.id} rejected a well-formed attempt at step ${step}`);
        assert.equal(judged.correct, true, `${station.id} marked its own answer wrong at step ${step}`);
        assert.equal(judged.result.finished, step === steps - 1, `${station.id} finished at the wrong step`);
        assert.ok(judged.result.observation, `${station.id} reports nothing after the test`);
        assert.ok(judged.result.explain, `${station.id} explains nothing`);
      }
    }
  }
});

test("a wrong answer is recorded with a reason, and never finishes the station", () => {
  for (const station of allLabStations) {
    const activity = station.activity;
    if (activity.kind !== "predict") continue;
    for (const tier of station.tiers) {
      activity.setups.forEach((setup, step) => {
        const wrong = activity.outcomes.find((outcome) => outcome.id !== setup.outcome);
        const judged = judgeLabAttempt(station, tier, { step, choice: wrong.id });
        assert.equal(judged.correct, false);
        assert.equal(judged.result.finished, false);
        assert.equal(judged.distractor, wrong.id, `${station.id} loses which wrong idea was chosen`);
        // The apparatus still runs. A model that only performs for a correct prediction
        // teaches that being wrong means seeing nothing.
        assert.equal(judged.result.motion, setup.motion, `${station.id} hides the result after a miss`);
        assert.ok(judged.result.observation, `${station.id} says nothing after a wrong prediction`);
      });
    }
  }
});

test("a labelled part can only be found by looking, not by counting", () => {
  for (const station of allLabStations) {
    if (station.activity.kind !== "label") continue;
    const tier = station.tiers[0];
    const spots = station.activity.parts.length;
    const mapping = [];
    for (let step = 0; step < spots; step += 1) {
      const right = [];
      for (let spot = 0; spot < spots; spot += 1) {
        const judged = judgeLabAttempt(station, tier, { step, choice: `p${spot}` });
        assert.ok(judged, `${station.id} rejected hotspot p${spot}`);
        if (judged.correct) right.push(spot);
      }
      assert.equal(right.length, 1, `${station.id} has ${right.length} right answers at step ${step}`);
      mapping.push(right[0]);
    }
    // The questions are not simply the hotspots in order, or the whole diagram could be
    // solved by working along it without reading anything.
    assert.notDeepEqual(
      mapping,
      mapping.map((_, index) => index),
      `${station.id} asks for its hotspots in the order they are drawn`,
    );
  }
});

test("a malformed answer is refused rather than guessed at", () => {
  const station = allLabStations.find((one) => one.activity.kind === "predict");
  const tier = station.tiers[0];
  assert.equal(judgeLabAttempt(station, tier, { step: -1, choice: "float" }), null);
  assert.equal(judgeLabAttempt(station, tier, { step: 99, choice: "float" }), null);
  assert.equal(judgeLabAttempt(station, tier, { step: 0, choice: "not-an-outcome" }), null);
  assert.equal(judgeLabAttempt(station, tier, { step: 0 }), null);
});

/* -------------------------------------------------------------------- the record */

test("every lab attempt produces a learning event the database will accept", () => {
  for (const station of allLabStations) {
    for (const tier of station.tiers) {
      const question = labQuestion(station, tier, "grade1");
      const event = eventForQuestion({
        question,
        sessionId: "lab-session",
        correct: true,
        support: "none",
        catalogueVersion: "code-1",
      });
      assert.ok(isValidEvent(event), `${station.id} produces an event the database would reject`);
      assert.equal(event.itemId, station.id);
      assert.equal(event.skillId, station.skillId);
      assert.ok(question.answer === "", `${station.id}'s question shim carries an answer`);
    }
  }
});

test("the lab records something other than choosing", () => {
  const verbs = new Set(
    allLabStations.flatMap((station) =>
      station.tiers.map((tier) => labQuestion(station, tier, "grade1").verb),
    ),
  );
  // The whole point of the lab, as a number: the quest bank records `choose` almost
  // everywhere, and the evidence rule (§C2) needs two different verbs per skill.
  assert.ok(verbs.has("predict"), "no station records a prediction");
  assert.ok(verbs.has("sort"), "no station records a classification");
  assert.ok(verbs.has("sequence"), "no station records a sequencing");
  assert.ok(verbs.size >= 4, `the lab only ever records ${[...verbs].join(", ")}`);
});

test("a band maps to the voice it is owed, and an unknown band is not talked down to", () => {
  assert.equal(tierForBand("early-preschool"), "explorer");
  assert.equal(tierForBand("prek"), "explorer");
  assert.equal(tierForBand("kindergarten"), "investigator");
  assert.equal(tierForBand("grade1"), "investigator");
  assert.equal(tierForBand("grade2"), "scientist");
  assert.equal(tierForBand("grade3"), "scientist");
  assert.equal(tierForBand(undefined), "investigator");
  assert.equal(tierForBand("nonsense"), "investigator");
});

test("progress is counted against what this child is actually offered", () => {
  const done = new Set([allLabStations[0].id]);
  for (const tier of labTiers) {
    for (const topic of publicLab(tier, done)) {
      assert.equal(topic.progress.total, topic.stations.length);
      assert.equal(topic.progress.done, topic.stations.filter((station) => station.done).length);
      assert.ok(topic.progress.done <= topic.progress.total);
    }
  }
});
