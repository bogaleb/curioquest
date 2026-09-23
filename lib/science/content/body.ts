import { t2, t3 } from "../tier";
import type { LabTopic } from "../types";

/**
 * The body, and the senses that report it.
 *
 * Two authoring constraints run through this strand, and both are about the child in
 * front of the screen rather than about the science.
 *
 * **Nothing here implies a standard body.** A sense is described by the job it does, not
 * by an assumption that every child has it. "Ears catch sound" is a fact about ears;
 * "you hear with your ears" is a sentence that quietly excludes a deaf child reading it.
 * Where a sense is named, the copy says what the organ does and leaves room for the
 * child's own experience — including the tools and other senses people use instead.
 *
 * **No health instruction, and nothing frightening.** This is not a place to teach a
 * five-year-old what can go wrong inside them. The heart pumps, the lungs take in air,
 * bones hold you up. That is the whole brief.
 */

export const bodyTopics: LabTopic[] = [
  /* ======================================================================== senses */
  {
    id: "senses",
    strand: "body",
    title: "The senses",
    childTitle: t3("Noticing things", "The noticing station", "The senses and their organs"),
    bigQuestion: t3(
      "How do you notice what is around you?",
      "Which part of you notices which kind of thing?",
      "How does the outside world get turned into something you can know about?",
    ),
    art: "eye",
    stations: [
      {
        id: "senses.sort",
        skillId: "SCI.PK.SENSE.FIVE_01",
        tiers: ["explorer", "investigator", "scientist"],
        minutes: 3,
        phase: "discover",
        title: t3("Which part notices?", "Sort by the sense that notices", "Match stimulus to sense organ"),
        activity: {
          kind: "sort",
          model: "bench",
          question: t3(
            "Which part of you notices each one?",
            "Which sense would notice each of these best?",
            "Sort each stimulus by the sense organ that detects it.",
          ),
          bins: [
            { id: "eyes", label: t3("Eyes", "Eyes", "Eyes: light"), art: "eye" },
            { id: "ears", label: t3("Ears", "Ears", "Ears: vibration"), art: "ear" },
            { id: "skin", label: t3("Skin", "Skin", "Skin: touch and temperature"), art: "hand" },
            { id: "nose", label: t3("Nose", "Nose", "Nose: airborne chemicals"), art: "nose" },
          ],
          items: [
            { id: "rainbow", label: t3("A rainbow", "A rainbow", "A rainbow"), art: "sun", bin: "eyes" },
            { id: "bell", label: t3("A ringing bell", "A ringing bell", "A ringing bell"), art: "bell", bin: "ears" },
            { id: "fur", label: t3("Soft fur", "Soft fur", "A soft texture"), art: "cat", bin: "skin" },
            { id: "bread", label: t3("Bread baking", "Bread baking", "Baking bread"), art: "seed", bin: "nose" },
            { id: "ice", label: t3("A cold ice cube", "A cold ice cube", "A cold surface"), art: "ice", bin: "skin", errorKind: "wrong-attribute" },
            { id: "star", label: t3("A tiny far star", "A tiny distant star", "A faint point of light"), art: "star", bin: "eyes" },
          ],
        },
        explain: t3(
          "Different parts of you notice different things. Eyes notice light. Ears notice sounds. Skin notices hot, cold and soft.",
          "Eyes work with light, ears with the shaking we call sound, skin with touch and temperature, and the nose with tiny bits of things floating in the air. Usually more than one is helping at once — and people who cannot use one of them notice the world brilliantly with the others, and with tools.",
          "Each sense organ converts one kind of physical signal into nerve impulses: light, vibration, pressure, temperature, dissolved or airborne chemicals. The brain does the interpreting. People vary in which channels they have, and assistive tools substitute one channel for another — a screen reader turns light into sound, which is the same trick the body does.",
        ),
        notebook: t3(
          "Close your eyes and notice three things. Which part of you noticed?",
          "Pick one thing on this bench that more than one sense could notice.",
          "Describe a device that swaps one sense for another, and say which conversion it performs.",
        ),
        offscreen:
          "With a grown-up, describe a familiar clean object using two senses without naming it, and see if they can guess. Never taste or smell anything unknown.",
      },
      {
        id: "senses.ear",
        skillId: "SCI.PK.SENSE.FIVE_01",
        tiers: ["investigator", "scientist"],
        minutes: 3,
        phase: "independent",
        title: t2("Inside an ear", "How an ear catches a vibration"),
        activity: {
          kind: "label",
          model: "drum",
          question: t2("Find the part of the ear that does this job.", "Identify the structure performing each function."),
          diagram: "sound-ear",
          parts: [
            {
              id: "outer",
              label: t2("The outer ear", "Pinna"),
              x: 20,
              y: 50,
              job: t2(
                "This wide curved part gathers the shaking air and funnels it inwards.",
                "This part collects sound waves over a wide area and funnels them further in.",
              ),
            },
            {
              id: "canal",
              label: t2("The ear canal", "Ear canal"),
              x: 43,
              y: 50,
              job: t2(
                "A little tunnel that carries the shaking air further in.",
                "This part carries the pressure wave inwards to the stretched skin.",
              ),
            },
            {
              id: "drum",
              label: t2("The eardrum", "Tympanic membrane"),
              x: 64,
              y: 50,
              job: t2(
                "A tiny skin stretched tight. The shaking air makes it shake too — just like the rice on the drum.",
                "A thin membrane that vibrates in step with the arriving pressure wave.",
              ),
            },
            {
              id: "nerve",
              label: t2("The nerve", "Auditory nerve"),
              x: 88,
              y: 65,
              job: t2(
                "This carries the message to your brain, which does the understanding.",
                "This part carries the converted signal to the brain, where it is interpreted.",
              ),
            },
          ],
        },
        explain: t2(
          "An ear is a machine for catching shaking. The outer part gathers it, the tunnel carries it, the eardrum shakes, and a nerve takes the message to your brain. It is the rice on the drum, done with a body.",
          "Hearing is a chain of conversions: a pressure wave in air becomes mechanical vibration in a membrane, then mechanical movement in tiny bones, then nerve impulses, then a perception. Any link can differ from person to person, which is why hearing varies and why some assistive devices work by rejoining the chain further along.",
        ),
        notebook: t2(
          "Cup your hands behind your ears. What happens, and why?",
          "Trace a sound from a drum to your understanding of it, naming each conversion.",
        ),
        offscreen:
          "With a grown-up, cup your hands behind your ears and listen to the room. Then face away from the sound and try again.",
      },
    ],
  },

  /* ==================================================================== human-body */
  {
    id: "human-body",
    strand: "body",
    title: "The human body",
    childTitle: t3("Your amazing body", "What is inside you", "Body systems"),
    bigQuestion: t3(
      "What is inside you?",
      "What job does each part inside you do?",
      "How do the parts inside you work together?",
    ),
    art: "heart",
    stations: [
      {
        id: "body.parts",
        skillId: "SCI.PK.BODY.PARTS_01",
        tiers: ["explorer", "investigator", "scientist"],
        minutes: 4,
        phase: "guided",
        title: t3("Inside you", "What each part does", "Organs and their functions"),
        activity: {
          kind: "label",
          model: "bench",
          question: t3(
            "Find the part that does this job.",
            "Find the part of the body doing the job described.",
            "Identify the organ or tissue performing each function.",
          ),
          diagram: "body",
          parts: [
            {
              id: "brain",
              label: t3("Your brain", "Brain", "Brain"),
              x: 50,
              y: 14,
              job: t3(
                "This is where thinking, remembering and deciding happen.",
                "This part does the thinking, remembering and deciding, and sends messages to everything else.",
                "This part processes incoming signals, stores and retrieves information, and coordinates the rest of the body through the nervous system.",
              ),
            },
            {
              id: "heart",
              label: t3("Your heart", "Heart", "Heart"),
              x: 47,
              y: 36,
              job: t3(
                "This squeezes all day and night to push your blood around.",
                "This part pumps blood around your whole body, without ever stopping to rest.",
                "This part is a muscular pump that circulates blood, delivering oxygen and removing waste.",
              ),
            },
            {
              id: "lungs",
              label: t3("Your lungs", "Lungs", "Lungs"),
              x: 58,
              y: 40,
              job: t3(
                "These fill up with air when you breathe in.",
                "This pair takes in air, so your blood can collect the oxygen from it.",
                "This pair exchanges gases: oxygen passes into the blood and carbon dioxide passes out.",
              ),
            },
            {
              id: "bones",
              label: t3("Your bones", "Bones", "Skeleton"),
              x: 38,
              y: 58,
              job: t3(
                "These are the hard parts inside you, and they hold you up.",
                "These hold you up, give you your shape, and protect the soft parts inside.",
                "These provide structural support, protect organs, and anchor the parts that pull on them.",
              ),
            },
            {
              id: "muscle",
              label: t3("Your muscles", "Muscles", "Muscles"),
              x: 66,
              y: 70,
              job: t3(
                "These pull on the hard parts so you can move.",
                "These pull on your bones to move them. They can pull, but they cannot push.",
                "These generate movement by contracting across a joint. They work in opposing pairs, because they can only ever pull.",
              ),
            },
          ],
        },
        explain: t3(
          "Your body is full of parts with jobs. Your heart pushes blood, your lungs take in air, your bones hold you up, and your brain does the thinking.",
          "Every part has a job, and they all depend on each other. Your lungs take in air, your heart pushes the blood that carries it, your bones hold everything in place, and your muscles pull on those bones to move you.",
          "The systems interlock. Respiratory and circulatory systems are useless apart: the lungs load oxygen, the heart distributes it. The skeleton is not only support but leverage — muscles can only contract, so movement needs bones to pull against and opposing pairs to reverse it.",
        ),
        notebook: t3(
          "Put your hand on your chest after jumping. What can you feel?",
          "Why does your heart beat faster when you run?",
          "Muscles can only pull. Explain how your arm straightens again, and what that tells you about how muscles are arranged.",
        ),
        vocabulary: [
          {
            word: "Organ",
            meaning: t3("A part inside you with its own job.", "A part of the body with a particular job to do.", "A structure of several tissue types working together on one function."),
          },
        ],
        offscreen:
          "With a grown-up, find your pulse at your wrist, sitting still. Then hop ten times and find it again. Stop if you feel unwell.",
      },
      {
        id: "body.exercise",
        skillId: "SCI.G1.BODY.SYSTEM_01",
        tiers: ["investigator", "scientist"],
        minutes: 4,
        phase: "independent",
        title: t2("After you run", "Why a run changes your breathing"),
        activity: {
          kind: "predict",
          model: "bench",
          question: t2(
            "Someone has just run up a hill. What do you predict has happened inside them?",
            "Predict the physiological response to sustained exertion.",
          ),
          outcomes: [
            { id: "faster", label: t2("Heart and breathing both speed up", "Heart rate and breathing rate both rise") },
            {
              id: "heart",
              label: t2("Only the heart speeds up", "Heart rate rises; breathing is unchanged"),
              errorKind: "wrong-attribute",
              response: "Half right. Think about where the blood has to collect the oxygen from before it can deliver any.",
            },
            {
              id: "slower",
              label: t2("Everything slows down to save energy", "Both rates fall to conserve energy"),
              errorKind: "not-yet-taught",
              response: "Resting does that. This body is in the middle of needing more, not less.",
            },
          ],
          setups: [
            {
              id: "hill",
              name: t2("Just run up a hill", "Immediately post-exertion"),
              art: "muscle",
              clues: [
                { id: "muscle", label: t2("What are the legs doing?", "Consider the working muscles"), detail: t2("The leg muscles have been working hard the whole way up.", "Sustained contraction has sharply raised the muscles' demand for oxygen.") },
                { id: "blood", label: t2("What carries the oxygen?", "Consider the transport system"), detail: t2("Blood carries oxygen, and the heart is what moves the blood.", "Oxygen is transported dissolved and bound in blood; delivery rate depends on cardiac output.") },
                { id: "lungs", label: t2("Where does the oxygen come from?", "Consider the supply"), detail: t2("The blood can only pick up oxygen in the lungs.", "Blood can only load oxygen at the alveoli, so supply is capped by ventilation rate.") },
              ],
              outcome: "faster",
              motion: "shake",
              observation: t2(
                "Both speed up together. The muscles want more oxygen, so the lungs take in more air and the heart delivers it faster.",
                "Both rates rise together. Ventilation increases to load more oxygen and clear carbon dioxide; cardiac output rises to deliver it to the working muscles.",
              ),
            },
          ],
        },
        explain: t2(
          "Your heart and your lungs are a team. One collects the oxygen and the other delivers it, so when your muscles need more, both have to work harder. That is why you cannot get your breath back just by standing still for one second.",
          "The response is coupled because the systems are serial: ventilation supplies oxygen to the blood, circulation distributes it. Rising carbon dioxide — not falling oxygen — is the main signal that drives the increase in breathing, which is why holding your breath becomes urgent long before oxygen runs short.",
        ),
        notebook: t2(
          "Count your breaths for ten seconds sitting still, then after hopping. Write both numbers.",
          "Explain why breathing rate rises even before oxygen has actually run low.",
        ),
        offscreen:
          "With a grown-up, count breaths in ten seconds at rest, then after twenty star jumps, then after resting two minutes. Stop if you feel unwell.",
      },
    ],
  },
];
