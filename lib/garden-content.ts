import type { Question } from "./curriculum";
import type { GradeBand } from "./skill-graph";

export const gardenActivities: Question[] = [];

for (const grade of ["prek", "grade1"] as GradeBand[]) {
  const older = grade === "grade1";
  const base = (slug: string, subject: Question["subject"], skillId: string): Question => ({
    id: `garden-${grade}-${slug}`, subject, skillId, grade, level: 1,
    activityType: "visual-choice", phase: "independent", estimatedMinutes: 2,
    contextTags: ["nature"], prompt: "", options: [], answer: "", hint: "", explanation: "",
  });
  gardenActivities.push(
    {
      ...base("seeds", "math", older ? "MATH.G1.ADD.WITHIN10_01" : "MATH.PK.NUM.CARDINAL_01"),
      activityType: "counting",
      prompt: older ? "Pip found 4 seeds, then 3 more. Pack all the seeds for the garden." : "Pip found some seeds! Count them into the garden basket.",
      engine: { kind: "counting", objects: Array(older ? 7 : 4).fill("🫘"), max: 12 },
      answer: older ? "7" : "4",
      hint: "Touch each seed once. The last number tells you how many.",
      explanation: older ? "Four seeds and three more make seven." : "You counted four seeds, one at a time.",
    },
    {
      ...base("sound", "reading", older ? "LIT.G1.PH.CVC_01" : "LIT.PK.PA.INITIAL_01"),
      activityType: "sound-choice", prompt: older ? "The seed bag says /s/ /u/ /n/. Which word opens it?" : "Listen to the word sun. Which letter starts sun?",
      visual: "☀️", options: older ? ["sat", "sun", "sip"] : ["m", "s", "t"],
      answer: older ? "sun" : "s", hint: older ? "Slide the three sounds together: sss-uuu-nnn." : "Say sun slowly: sss-un.",
      explanation: "Sun starts with s. Plants use sunlight as they grow.",
    },
    {
      ...base("sort", "logic", older ? "LOGIC.G1.CLASSIFY.RULE_01" : "LOGIC.PK.SORT.ATTRIBUTE_01"),
      activityType: "sorting", prompt: "The garden supplies got mixed up. Put the fruit and tools in their baskets.",
      engine: {
        kind: "sorting",
        items: [{id:"apple",label:"Apple",emoji:"🍎"},{id:"pear",label:"Pear",emoji:"🍐"},{id:"hammer",label:"Hammer",emoji:"🔨"},{id:"wrench",label:"Wrench",emoji:"🔧"}],
        bins: [{id:"fruit",label:"Fruit",emoji:"🍎"},{id:"tools",label:"Tools",emoji:"🔧"}],
        solution: {apple:"fruit",pear:"fruit",hammer:"tools",wrench:"tools"},
      },
      hint: "Fruit grows on plants. Tools help us build or repair things.",
      explanation: "You grouped the supplies by what they are used for.",
    },
    {
      ...base("trail", "logic", "LOGIC.PK.PATTERN.AB_01"),
      activityType: "pattern", prompt: "Follow the flower trail. What belongs in the empty stepping stone?",
      engine: {kind:"pattern",sequence: older ? ["🌼","🌿","🌼","🌿","🌼","🌿"] : ["🌼","🌿","🌼","🌿"]},
      options: ["🌿","🌼","🍄"], answer:"🌼", hint:"Flower, leaf, flower, leaf. The two things take turns.",
      explanation:"You found the repeating pair: flower, leaf.",
    },
    {
      ...base("memory", "logic", older ? "LOGIC.G1.MEMORY.THREE_01" : "LOGIC.PK.MEMORY.TWO_01"),
      activityType: "memory", prompt: older ? "Remember the three things Pip needs, in order." : "Remember the two things Pip needs, in order.",
      engine: {kind:"memory",sequence: older ? ["🌱","💧","☀️"] : ["🌱","💧"],choices:["☀️","🌱","🪨","💧"]},
      hint:"Look again and say the things in order. Then cover them and try.",
      explanation:"You remembered the garden supplies in order.",
    },
    {
      ...base("word", "reading", older ? "LIT.G1.PH.CVC_01" : "LIT.PK.ALPH.CASE_01"),
      activityType: older ? "word-builder" : "visual-choice",
      prompt: older ? "Build the word pot so Nova can label the seed pot." : "Nova's seed packet has a big S. Find its little partner.",
      visual: older ? "🪴" : "S",
      engine: older ? {kind:"word-builder",letters:["t","o","p","m"],length:3} : undefined,
      answer: older ? "pot" : "s", options: older ? [] : ["m","s","b"],
      hint: older ? "Listen to pot: /p/ /o/ /t/. Choose a letter for each sound." : "S and s have the same curving shape.",
      explanation: older ? "You put p, o, and t together to write pot." : "S and s are the same letter in two sizes.",
    },
    {
      ...base("more", "math", older ? "MATH.G1.ADD.WITHIN10_01" : "MATH.PK.COMP.MORE_01"),
      prompt: older ? "We planted 5 seeds, then 4 more. How many seeds are planted?" : "Pip has 3 seeds. Nova has 5. Which number is more?",
      activityType:"number-choice", visual: older ? "5 + 4 = ?" : "3   •   5",
      options: older ? ["8","9","10"] : ["3","5","4"], answer: older ? "9" : "5",
      hint: older ? "Start at five and count four more." : "Count up from three. Five comes later.",
      explanation: older ? "Five and four make nine." : "Five is more than three.",
    },
    {
      ...base("clue", "reading", older ? "LIT.G1.COMP.RECALL_01" : "LIT.PK.ORAL.WORD_01"),
      activityType:"story-choice", prompt:"Pip found the seeds under a leaf. Nova put them in a pot. Where did Pip find the seeds?",
      options:["Under a leaf","In a shoe","On the moon"],answer:"Under a leaf",
      hint:"Listen again to the first sentence. Where were the seeds?",
      explanation:"The story says Pip found the seeds under a leaf.",
    },
    {
      ...base("plant", "logic", older ? "LOGIC.G1.SEQUENCE.ROUTINE_01" : "LOGIC.PK.SEQUENCE.ROUTINE_01"),
      activityType:"story-choice", prompt:"First we put soil in the pot. Next we plant a seed. What should we do next?",
      options:["Gently water it","Empty the pot","Put it in a drawer"],answer:"Gently water it",
      hint:"A planted seed needs water to begin growing.",
      explanation:"A little water helps the seed begin to grow. A grown-up can help you plant a real seed.",
    },
    {
      ...base("water", "math", older ? "MATH.G1.SUB.WITHIN10_01" : "MATH.PK.NUM.CARDINAL_01"),
      activityType:"counting",prompt: older ? "There were 8 water drops. We used 3. Count the drops left for the next pot." : "Count the water drops for the little seed.",
      engine:{kind:"counting",objects:Array(older ? 5 : 3).fill("💧"),max:10},
      answer:older ? "5" : "3",hint:"Touch each drop once as you count.",
      explanation:older ? "Eight take away three leaves five." : "Three drops are ready for the seed.",
    },
    {
      ...base("garden-pattern", "logic", older ? "LOGIC.PK.PATTERN.AAB_01" : "LOGIC.PK.PATTERN.AB_01"),
      activityType:"pattern",prompt:"Finish the pattern around our new garden.",
      engine:{kind:"pattern",sequence:older ? ["🌷","🌷","🌻","🌷","🌷"] : ["🌷","🌻","🌷"]},
      options:["🌷","🌻","🪨"],answer:"🌻",
      hint:older ? "Two tulips, one sunflower. Find that group again." : "Tulip, sunflower. The flowers take turns.",
      explanation:"You continued the flower pattern. The garden path is ready!",
    },
    {
      ...base("ending", "reading", older ? "LIT.G1.COMP.CAUSE_01" : "LIT.PK.ORAL.WORD_01"),
      activityType:"story-choice",prompt:"The seeds sprouted. Pip kept the soil damp and put the pots near sunlight. What helped the sprouts grow?",
      options:["Water and sunlight","Shoes and socks","Rocks and ribbons"],answer:"Water and sunlight",
      hint:"Think about what Pip gave the plants in the story.",
      explanation:"Water and sunlight helped the sprouts grow. You solved the mystery together!",
    },
  );
}
