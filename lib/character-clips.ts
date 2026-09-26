export type ClipActivity = 'count' | 'letter' | 'growth' | 'rhythm' | 'breathe' | 'notice';
export type CharacterClip = {
  id: string;
  title: string;
  friend: string;
  description: string;
  prompt: string;
  activity: ClipActivity;
  celebration?: string;
};

// Names shown to children describe the actual footage. The human explorers are
// not called Nova: that name already belongs to the app's fox.
export const characterClips: CharacterClip[] = [
  { id: 'meadow-hub', title: 'A world of little wonders', friend: 'The meadow', description: 'A monkey sits beside a treehouse. Three glowing doorways lead to a forest, an ocean, and space.', prompt: 'Which doorway would you explore? What do you imagine on the other side?', activity: 'notice' },
  { id: 'portal-forest', title: 'Through the forest doorway', friend: 'Forest friends', description: 'A fox and an explorer step through a glowing doorway into a colorful forest.', prompt: 'Look for a tree, a light, and a path. What might the friends discover?', activity: 'notice' },
  { id: 'portal-ocean', title: 'An underwater daydream', friend: 'Bea', description: 'In this make-believe adventure, Bea the bee travels through a watery doorway to an ocean full of fish.', prompt: 'Find something swimming. How is its home different from a garden?', activity: 'notice' },
  { id: 'portal-space', title: 'A rocket full of questions', friend: 'Milo', description: 'A little robot rides a rocket through a sparkling tunnel into an imaginary world of smiling planets.', prompt: 'Imagine a planet of your own. What would you call it?', activity: 'notice' },
  { id: 'luna-letter-trace', title: 'Make an A with Luna', friend: 'Luna the owl', description: 'Luna draws a glowing uppercase A. It has two sloping lines and a line across the middle.', prompt: 'Follow the three strokes to make an uppercase A.', activity: 'letter', celebration: 'luna-praise' },
  { id: 'luna-praise', title: 'A little reading cheer', friend: 'Luna the owl', description: 'Luna spreads her wings and leans forward with a friendly smile.', prompt: 'Tell Luna one letter or word you practiced.', activity: 'notice' },
  { id: 'milo-counting', title: 'Count along with Milo', friend: 'Milo the robot', description: 'Milo puts red apples on a table and raises a hand. Now it is your turn to count a group of apples.', prompt: 'Touch each apple once. How many are there altogether?', activity: 'count', celebration: 'milo-dance' },
  { id: 'milo-dance', title: 'Milo’s happy dance', friend: 'Milo the robot', description: 'Milo waves and dances in a colorful playroom.', prompt: 'Make up one dance move of your own, if you would like.', activity: 'notice' },
  { id: 'bea-growth', title: 'From a seed to a flower', friend: 'Bea the bee', description: 'Bea watches a shoot grow into a flower. This animation speeds up growth; a real plant takes much longer.', prompt: 'What comes first, next, and last?', activity: 'growth', celebration: 'bea-celebrate' },
  { id: 'bea-celebrate', title: 'A garden celebration', friend: 'Bea the bee', description: 'Bea floats above a flower, then lands and smiles.', prompt: 'What is one thing you noticed about a plant today?', activity: 'notice' },
  { id: 'atlas-intro', title: 'Meet our globe explorer', friend: 'Atlas the elephant', description: 'Atlas looks closely at a globe, then turns toward you.', prompt: 'A globe is a model of Earth. What colors can you spot?', activity: 'notice' },
  { id: 'atlas-continents', title: 'A world to look at', friend: 'Atlas the elephant', description: 'Atlas points at different parts of a globe as little lights appear.', prompt: 'Find land and water. Imagine a journey across each one.', activity: 'notice' },
  { id: 'atlas-celebrate', title: 'A cheer from Atlas', friend: 'Atlas the elephant', description: 'Atlas raises his trunk, celebrates, and smiles at you.', prompt: 'Name a place you would like to learn more about.', activity: 'notice' },
  { id: 'riff-intro', title: 'Meet our music maker', friend: 'Riff the rabbit', description: 'Riff hops into a room full of instruments and brings his paws together.', prompt: 'Make a little rhythm of your own.', activity: 'rhythm', celebration: 'riff-celebrate' },
  { id: 'riff-copy-rhythm', title: 'Your turn to make a rhythm', friend: 'Riff the rabbit', description: 'Riff moves and claps in a music room. Then you can try the new pattern on the pads below.', prompt: 'Try our pattern: drum, clap, drum.', activity: 'rhythm', celebration: 'riff-celebrate' },
  { id: 'riff-celebrate', title: 'Take a bow with Riff', friend: 'Riff the rabbit', description: 'Riff brings his cymbals together and takes a bow.', prompt: 'Take a bow for something you enjoyed making.', activity: 'notice' },
  { id: 'tuno-breathing', title: 'A quiet moment with Tuno', friend: 'Tuno the turtle', description: 'Tuno closes his eyes as a glowing ring grows around him.', prompt: 'If you like, take a comfortable breath in and out. Go at your own pace.', activity: 'breathe', celebration: 'tuno-proud' },
  { id: 'tuno-proud', title: 'Small things to feel proud of', friend: 'Tuno the turtle', description: 'Tuno rests a hand on his chest and smiles as little sparkles appear.', prompt: 'Think of one kind thing you did, or one thing you tried.', activity: 'notice' },
  { id: 'nova-entry', title: 'Meet a forest explorer', friend: 'An explorer friend', description: 'A child walks down a forest path, turns around, and welcomes you.', prompt: 'If you packed an explorer bag, what would you put inside?', activity: 'notice' },
  { id: 'nova-highfive', title: 'A friendly high five', friend: 'A playground friend', description: 'A child smiles and holds up a hand for a high five.', prompt: 'Give a wave or an air high five to someone who helped you.', activity: 'notice' },
  { id: 'nova-try-again', title: 'One more idea', friend: 'A puzzle explorer', description: 'A child looks at a stone puzzle, tries a piece, and celebrates when it fits.', prompt: 'When a plan does not work yet, what is one thing you could change?', activity: 'notice' },
  { id: 'curio-celebrate', title: 'A little star of discovery', friend: 'Curio', description: 'Curio reaches up and holds a glowing star toward you.', prompt: 'What is one thing you are proud of trying?', activity: 'notice' },
  { id: 'curio-goodbye', title: 'Rest well, little explorer', friend: 'Curio', description: 'Curio waves, curls up in a sunny meadow, and rests.', prompt: 'Your adventures can wait. Stretch, rest, or tell someone about your day.', activity: 'notice' },
  { id: 'cast-finale', title: 'A cheer from your friends', friend: 'The whole crew', description: 'The explorer friends gather in the meadow for a colorful celebration.', prompt: 'Tell someone about your favorite discovery.', activity: 'notice' },
];

export function characterClip(id: string): CharacterClip {
  const clip = characterClips.find(item => item.id === id);
  if (!clip) throw new Error(`Unknown character clip: ${id}`);
  return clip;
}
export const clipSource = (id: string) => `/media/characters/${id}.mp4`;
export const clipPoster = (id: string) => `/media/characters/${id}.jpg`;

export const routeClips: Record<string, string[]> = {
  '/': ['meadow-hub', 'nova-entry', 'curio-goodbye'],
  '/read': ['luna-letter-trace', 'portal-forest'],
  '/science': ['bea-growth', 'portal-ocean'],
  '/play': ['milo-counting', 'portal-space', 'riff-copy-rhythm'],
  '/create': ['riff-intro', 'riff-copy-rhythm', 'luna-letter-trace'],
  '/discover': ['atlas-intro', 'atlas-continents', 'bea-growth'],
  '/worlds': ['atlas-intro', 'atlas-continents', 'tuno-breathing'],
  '/build': ['nova-try-again', 'milo-counting'],
  '/stories': ['nova-entry', 'portal-forest', 'curio-goodbye'],
  '/team': ['nova-highfive', 'riff-copy-rhythm', 'cast-finale'],
  '/rewards': ['curio-celebrate', 'cast-finale', 'tuno-proud'],
  '/theater': characterClips.map(clip => clip.id),
};

export const destinationClip: Record<string, string> = {
  reading: 'portal-forest', science: 'bea-growth', studio: 'riff-intro',
  games: 'milo-counting', discoveries: 'atlas-intro', garden: 'nova-try-again',
  stories: 'nova-entry', theater: 'cast-finale', worlds: 'atlas-continents',
  team: 'nova-highfive', rewards: 'curio-celebrate',
};
