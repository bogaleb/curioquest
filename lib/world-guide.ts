import type { KidWorld } from "./kid-worlds";

export type WorldGuide = {
  id: string;
  title: string;
  world: KidWorld;
  category: "Explore" | "Make" | "Together";
  invitation: string;
  question: string;
  steps: [string, string, string];
  takeaway: string;
};

/** Invitations describe the existing destinations, rather than promising new activities. */
export const worldGuide: WorldGuide[] = [
  { id: "reading", title: "Reading Grove", world: "grove", category: "Explore", invitation: "Little sounds. Big story adventures.", question: "What happens when we put sounds together?", steps: ["Warm up your listening ears.", "Find a sound and build a word.", "Read a little page with a helping voice."], takeaway: "Try it here: say sun slowly. What sound comes first?" },
  { id: "science", title: "Wonder Lab", world: "lab", category: "Explore", invitation: "A place for your biggest why.", question: "How could we test your idea?", steps: ["Choose something to investigate.", "Make a prediction, then try a test.", "Look at what changed and explain your idea."], takeaway: "Try it here: rub your hands together. What do you notice?" },
  { id: "studio", title: "Making Place", world: "workshop", category: "Make", invitation: "An empty page is a beginning.", question: "What could your imagination make today?", steps: ["Choose a drawing, coloring, or writing room.", "Try marks, colors, and your own ideas.", "Keep a creation you want to come back to."], takeaway: "Try it here: draw a circle in the air. Imagine three things it could become." },
  { id: "games", title: "Playing Field", world: "city", category: "Explore", invitation: "Play a little. Discover a lot.", question: "Can you spot a pattern hiding in plain sight?", steps: ["Pick a number, shape, or memory game.", "Try a move and see what happens.", "Use what you noticed on your next turn."], takeaway: "Try it here: clap, tap, clap, tap. What comes next?" },
  { id: "discoveries", title: "Discovery Library", world: "harbor", category: "Explore", invitation: "Follow a question somewhere new.", question: "What are you curious about?", steps: ["Browse words, numbers, nature, maps, and feelings.", "Open a short lesson that catches your eye.", "Look, listen, and try its activity."], takeaway: "Try it here: find one thing nearby that you want to know more about." },
  { id: "garden", title: "Build Yard", world: "workshop", category: "Make", invitation: "Plan it. Build it. Try again.", question: "What makes a good plan even better?", steps: ["Choose a route, tower, or shape challenge.", "Arrange your pieces and test the plan.", "Change one thing and see if it helps."], takeaway: "Try it here: give directions from your chair to the door. Where do you turn?" },
  { id: "stories", title: "Story Harbor", world: "harbor", category: "Explore", invitation: "Every story opens another door.", question: "What do you think happens next?", steps: ["Find a story to explore.", "Notice the people, places, and little clues.", "Talk about a choice a character makes."], takeaway: "Try it here: begin a story with ‘One morning, a tiny door appeared…’" },
  { id: "theater", title: "The Theater", world: "harbor", category: "Explore", invitation: "Watch closely. Wonder out loud.", question: "What can a little scene help you discover?", steps: ["Choose a scene from the theater.", "Watch and listen for something interesting.", "Join in when the scene asks a question."], takeaway: "Try it here: make a surprised face, then a curious face. What changed?" },
  { id: "worlds", title: "The Far Hills", world: "grove", category: "Explore", invitation: "A new trail for every kind of curious.", question: "Which learning path will you follow?", steps: ["Choose a world: reading, numbers, science, and more.", "Follow a quest one small step at a time.", "Return to try another path when you are ready."], takeaway: "Try it here: name something you learned today, however small." },
  { id: "team", title: "Team Camp", world: "city", category: "Together", invitation: "Two ideas can go further than one.", question: "How can we help each other?", steps: ["Invite someone to explore with you.", "Take turns listening and trying an idea.", "Solve a challenge together."], takeaway: "Try it here: take turns adding one word to a silly sentence." },
  { id: "rewards", title: "Treasure Chest", world: "treehouse", category: "Together", invitation: "Little reminders of how far you’ve come.", question: "What are you proud of trying?", steps: ["Open the chest to see your earned treasures.", "Look back at the practice behind them.", "Choose what you would like to explore next."], takeaway: "Try it here: tell someone about a time you kept trying." },
];
