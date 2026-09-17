import type { Question } from "./curriculum";
import type { GradeTrack } from "./explorers";

// Authored templates stay server-side. The catalogue contains presentation only.
export const arcadeActivities: Question[] = [];
const words = ["cat", "sun", "map", "dog", "hat", "pig", "cup", "pot", "bed", "hen", "bus", "net"];
const pictures = ["🐈", "☀️", "🗺️", "🐕", "🎩", "🐖", "☕", "🪴", "🛏️", "🐔", "🚌", "🥅"];
const letterGroups = ["SMT", "ABF", "CDP", "GHL", "JKN", "ORU", "EVW", "XYZ", "BDS", "MNP", "FHT", "ACG"];
const cargo = [["🌱", "💧", "☀️", "🌷"], ["🐚", "🐟", "🪸", "🐙"], ["⭐", "🌙", "🚀", "🪐"]];
const routines: [string, string[] , string[]][] = [
  ["Grow a sunflower", ["Put soil in a pot", "Plant a seed", "Water the soil", "Watch the sprout grow"], ["🪴", "🌱", "💧", "🌻"]],
  ["Make a fruit snack", ["Wash the fruit", "Ask a grown-up to cut it", "Put it in a bowl", "Enjoy the snack"], ["🚰", "🍎", "🥣", "😋"]],
  ["Get ready for rain", ["Notice the rain", "Put on a raincoat", "Open an umbrella", "Step outside"], ["🌧️", "🧥", "☂️", "🥾"]],
  ["Send a kind note", ["Draw a picture", "Put it in an envelope", "Add a stamp", "Post the letter"], ["🖍️", "✉️", "🎟️", "📮"]],
  ["Build a block tower", ["Find a flat space", "Build a wide base", "Stack blocks on top", "Test if it stands"], ["🟩", "🧱", "🏗️", "🏰"]],
  ["Prepare a picnic", ["Pack the food", "Walk to the park", "Spread the blanket", "Share the picnic"], ["🧺", "🌳", "🟪", "🥪"]],
  ["Wash muddy hands", ["Wet your hands", "Rub with soap", "Rinse the bubbles away", "Dry with a towel"], ["🚰", "🧼", "💧", "🧻"]],
  ["Make a painting", ["Get paper and paint", "Dip the brush", "Paint your picture", "Leave it to dry"], ["🎨", "🖌️", "🖼️", "☀️"]],
  ["Plant a tree with a grown-up", ["Dig a hole together", "Place the young tree", "Fill around it with soil", "Water the tree"], ["🕳️", "🌳", "🟫", "💧"]],
  ["Get ready for bed", ["Put on pajamas", "Brush your teeth", "Listen to a bedtime story", "Close your eyes"], ["👕", "🪥", "📖", "😴"]],
  ["Make a paper kite", ["Choose your paper", "Fold the kite", "Attach the string", "Try it in the breeze"], ["📄", "🔶", "🧵", "🪁"]],
  ["Bake with a grown-up", ["Measure the ingredients", "Mix the batter", "Let the grown-up bake it", "Cool before tasting"], ["🥛", "🥣", "🧑‍🍳", "🧁"]],
];
const stories = [
  { title: "The umbrella for two", emoji: "☂️", text: "Pip packed a picnic. Then rain began to fall. Nova held a big umbrella over both friends. They ate their picnic under the umbrella and listened to the rain.",
    recall: ["What did Nova hold?", "An umbrella", "A kite", "A flower"], cause: ["Why did Nova hold the umbrella over both friends?", "To keep them dry", "To make the rain louder", "To hide the picnic"], clue: "Rain began to fall, and the umbrella covered both friends." },
  { title: "A bridge for Beetle", emoji: "🐞", text: "Beetle reached a wide puddle. He could not cross it. Pip found a flat stick and laid it across the water. Beetle walked over the stick. On the other side, he waved his tiny legs to say thank you.",
    recall: ["What did Pip put across the puddle?", "A flat stick", "A soft hat", "An apple"], cause: ["Why was Pip's stick helpful?", "It made a way across", "It made the puddle deeper", "It hid Beetle"], clue: "Beetle walked over the stick to reach the other side." },
  { title: "The moon in the pond", emoji: "🌙", text: "Nova saw a bright circle in the pond. She looked up and saw the moon. When a breeze rippled the water, the circle wobbled. The moon above stayed still. Nova smiled at its reflection.",
    recall: ["Where did Nova see the bright circle?", "In the pond", "In a basket", "Under a bed"], cause: ["Why did the circle in the pond wobble?", "The breeze moved the water", "The moon fell down", "Someone painted the pond"], clue: "The story says a breeze rippled the water." },
  { title: "Pip's quiet surprise", emoji: "🌼", text: "Pip noticed an empty pot by Nova's door. He planted a seed in it. Each morning he watered the soil. Many days later, a yellow flower opened. Nova found the flower and thanked Pip for his patient care.",
    recall: ["What color was the flower?", "Yellow", "Blue", "Purple"], cause: ["Which action showed Pip cared for the seed?", "He watered it each morning", "He hid the pot", "He picked the flower early"], clue: "Pip kept returning each morning to water the soil." },
  { title: "The missing bell", emoji: "🔔", text: "The little train was ready, but its bell was missing. Pip looked in the carriages. Nova listened carefully. A soft ringing came from a basket. Inside, the bell was beside the apples. Together they put it back on the train.",
    recall: ["Where was the bell?", "In a basket", "In the pond", "On the moon"], cause: ["What helped Nova find the bell?", "Listening for its sound", "Counting the windows", "Painting the train"], clue: "Nova heard a soft ringing coming from the basket." },
  { title: "The windy art show", emoji: "🖼️", text: "The friends hung their pictures outside. A gust of wind lifted the corners. Nova found some clips. Pip used them to fasten the pictures to a line. Now the art stayed in place, and everyone could enjoy it.",
    recall: ["What did Nova find?", "Some clips", "Some seeds", "Some shoes"], cause: ["Why did the friends use clips?", "To stop the pictures blowing away", "To change the colors", "To make more wind"], clue: "The clips fastened the pictures to the line." },
];
const moreStoryDetails = [
  ["What did the friends listen to?", "The rain", "A drum", "A train"],
  ["What did Beetle wave to say thank you?", "His tiny legs", "A big flag", "A leaf"],
  ["What did Nova see when she looked up?", "The moon", "A kite", "A train"],
  ["Where was the empty pot?", "By Nova's door", "On the train", "In a pond"],
  ["What was beside the bell?", "Apples", "Shoes", "Flowers"],
  ["Where did the friends hang their pictures?", "Outside", "Inside a box", "Under a bed"],
];
function rotate<T>(items: T[], n: number) { const by = n % items.length; return [...items.slice(by), ...items.slice(0, by)]; }

for (const grade of ["prek", "grade1"] as GradeTrack[]) {
  const older = grade === "grade1";
  const base = (game: string, n: number, subject: Question["subject"], skillId: string): Question => ({
    id: `arcade-${grade}-${game}-${n}`, grade, subject, skillId, level: Math.floor(n / 4) + 1,
    activityType: "visual-choice", phase: "independent", estimatedMinutes: 2, contextTags: ["puzzles"],
    prompt: "", answer: "", options: [], hint: "", explanation: "",
  });
  for (let n = 0; n < 12; n++) {
    const size = older ? 4 : 3;
    const row = n % (size - 1) + 1, col = Math.floor(n / 3) % (size - 1) + 1;
    const mirrored = n % 2 === 1;
    const start = mirrored ? size - 1 : 0;
    const goal = row * size + (mirrored ? size - 1 - col : col);
    // The clear route goes down the starting edge, then across the goal row.
    const clear = new Set([start, ...Array.from({length:row}, (_,i)=>(i+1)*size+start),
      ...Array.from({length:col}, (_,i)=>row*size+start+(mirrored?-1:1)*(i+1))]);
    const rocks = Array.from({length:size*size}, (_,i)=>i).filter(i=>!clear.has(i) && (i+n)%3===0);
    arcadeActivities.push({ ...base("robot", n, "logic", older ? "LOGIC.G1.PLAN.ROUTE_01" : "LOGIC.PK.PLAN.ROUTE_01"),
      activityType:"route", prompt:"Deliver the star! Plan the robot's moves, then send it along your route.",
      engine:{kind:"route",size,start,goal,rocks,maxMoves:row+col+(older?2:1)},
      hint:"Start at the robot. Follow the open spaces with your finger. Each arrow moves one square.",
      explanation:"Your plan brought the robot safely to the star. You can solve a big journey one step at a time.", contextTags:["building","space"] });

    const a = older ? n % 6 + 4 : n % 5 + 2, b = older ? n % 4 + 1 : 0;
    const subtract = older && n >= 8, total = subtract ? a-b : a+b;
    arcadeActivities.push({ ...base("kitchen", n, "math", older ? (subtract ? "MATH.G1.SUB.WITHIN10_01" : total>10 ? "MATH.G1.ADD.WITHIN20_01" : "MATH.G1.ADD.WITHIN10_01") : "MATH.PK.NUM.CARDINAL_01"),
      activityType:"ten-frame", prompt: older ? (subtract ? `Nova baked ${a} muffins. The friends ate ${b}. Put the muffins left on the tray.` : `Pip brings ${a} strawberries. Nova brings ${b} more. Put their strawberries on the tray.`) : `The picnic needs ${a} apples. Tap empty spaces to pack that many.`,
      engine:{kind:"ten-frame",size:older?20:10,emoji:subtract?"🧁":older?"🍓":"🍎"}, answer:String(total),
      hint:subtract?`Start with ${a}, then take away ${b}.` : older ? `Start with ${a}. Add one for each of the ${b} more.` : "Put down one apple for each count. Stop when you reach the picnic number.",
      explanation: older ? `${a} ${subtract?"take away":"plus"} ${b} is ${total}. The picnic tray is ready.` : `You packed ${total} apples, one in each space.`,contextTags:["nature"] });

    const letters = [...letterGroups[n]], word = words[n];
    arcadeActivities.push(older ? { ...base("words",n,"reading","LIT.G1.PH.CVC_01"),activityType:"word-builder",
      prompt:"Listen to the picture word. Build its label with the letters below.", visual:pictures[n],audioLabel:word,
      engine:{kind:"word-builder",letters:rotate([...word,"z"],n+1),length:word.length}, answer:word,
      hint:`Say ${word} slowly. Which sound comes first? Find one letter for each sound.`,explanation:`You built ${word}: ${[...word].join(" · ")}.`,contextTags:["stories"] }
      : { ...base("words",n,"reading","LIT.PK.ALPH.CASE_01"),activityType:"matching",
        prompt:"The letter partners want to sit together. Match each big letter to its little letter.",
        engine:{kind:"matching",items:letters.map((l,i)=>({id:`i${i}`,label:l})),targets:rotate(letters.map((l,i)=>({id:`t${i}`,label:l.toLowerCase()})),n+1),solution:Object.fromEntries(letters.map((_,i)=>[`i${i}`,`t${i}`]))},
        hint:"Look for familiar curves and lines. A big and little letter can look different but share a name.",explanation:`You matched ${letters.map(l=>`${l} and ${l.toLowerCase()}`).join(", ")}.`,contextTags:["stories"] });

    const theme = cargo[Math.floor(n/4)], sequence = rotate(theme,n).slice(0,older?3:2);
    arcadeActivities.push({...base("memory",n,"logic",older?"LOGIC.G1.MEMORY.THREE_01":"LOGIC.PK.MEMORY.TWO_01"),activityType:"memory",
      prompt:"The train has a special delivery. Remember the cargo in order, then load it again.",
      engine:{kind:"memory",sequence,choices:rotate(theme,n+2)},hint:"Say a tiny story with the objects in order. You can look again whenever you need help.",
      explanation:"You delivered the cargo in the remembered order. The train is ready to go!",contextTags:[Math.floor(n/4)===2?"space":"nature"]});

    const pair = [cargo[n%3][n%4],cargo[n%3][(n+1)%4]], type = older ? n%3 : Math.floor(n/4);
    const unit = type===0?pair:type===1?[pair[0],pair[0],pair[1]]:[pair[0],pair[1],pair[1]];
    const ribbon = [...unit,...unit].slice(0,-1), correct = unit[unit.length-1];
    arcadeActivities.push({...base("patterns",n,"logic",["LOGIC.PK.PATTERN.AB_01","LOGIC.PK.PATTERN.AAB_01","LOGIC.PK.PATTERN.ABB_01"][type]),activityType:"pattern",
      prompt:"One lantern is missing from the carnival garland. Which one finishes the repeating group?",
      engine:{kind:"pattern",sequence:ribbon},options:rotate([...pair,"🎈"],n),answer:correct,
      hint:`Find this little group: ${unit.join(" ")}. Then find it again.`,explanation:`The repeating group is ${unit.join(" ")}. You repaired the garland!`});

    const attributes=older&&n>=4&&n<8;
    const shapeSet = rotate([
      {label:n>=8?"🕒 Clock face":"●",name:attributes?"No corners":"Circle"},
      {label:n>=8?"🟩 Square tile":"■",name:attributes?"Four equal sides":"Square"},
      {label:n>=8?"🔺 Triangular flag":"▲",name:attributes?"Three sides":"Triangle"},
      {label:n>=8?"🃏 Rectangular card":"▬",name:attributes?"Two long and two short sides":"Rectangle"},
    ],n).slice(0,older?4:3);
    arcadeActivities.push({...base("shapes",n,"math",attributes?"MATH.G1.GEO.ATTRIBUTES_01":"MATH.PK.GEO.SHAPE_01"),activityType:"matching",prompt:attributes?"Match each shape to the clue about its sides and corners.":n>=8?"Shapes are all around us! Match each object's flat outline with its shape name.":"Help the safari team label these shapes. Choose a shape, then its name.",
      engine:{kind:"matching",items:shapeSet.map((s,i)=>({id:`i${i}`,label:s.label})),targets:rotate(shapeSet.map((s,i)=>({id:`t${i}`,label:s.name})),n+1),solution:Object.fromEntries(shapeSet.map((_,i)=>[`i${i}`,`t${i}`]))},
      hint:"A circle is round. A triangle has three sides. Squares and rectangles have four sides; a square has four equal sides.",explanation:"You matched the shapes by their outlines. Look for one of these shapes around you.",contextTags:["building"]});

    const [title,steps,emoji] = routines[n], chosen = older ? steps : steps.filter((_,i)=>i!==2);
    const items = chosen.map((label,i)=>({id:`s${i}`,label,emoji:emoji[steps.indexOf(label)]}));
    arcadeActivities.push({...base("steps",n,"logic",older?"LOGIC.G1.SEQUENCE.ROUTINE_01":"LOGIC.PK.SEQUENCE.ROUTINE_01"),activityType:"ordering",
      prompt:`${title}. Put the cards in order from first to last.`,engine:{kind:"ordering",items:rotate(items,1+n%(items.length-1)),solution:items.map(i=>i.id)},
      hint:"What needs to happen before the next step can work? Start with what you need to get ready.",explanation:`First: ${chosen[0].toLowerCase()}. Last: ${chosen[chosen.length-1].toLowerCase()}. You planned the steps.`,contextTags:["stories","building"]});

    const story=stories[Math.floor(n/2)], inference=older&&n%2===1, [prompt,answer,...wrong]=inference?story.cause:n%2===1?moreStoryDetails[Math.floor(n/2)]:story.recall;
    arcadeActivities.push({...base("stories",n,"reading",older?(inference?"LIT.G1.COMP.CAUSE_01":"LIT.G1.COMP.RECALL_01"):"LIT.PK.COMP.RECALL_01"),activityType:"story-choice",
      prompt,passage:{title:story.title,text:story.text,emoji:story.emoji},options:rotate([answer,...wrong],n),answer,
      hint:inference?story.clue:"Listen to the story again. Look for the part about the question.",explanation:inference?story.clue:`The story tells us: ${answer.toLowerCase()}.`,contextTags:["stories","animals"]});
  }
}
