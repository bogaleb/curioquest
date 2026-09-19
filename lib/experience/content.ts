import type {MediaAsset,MediaCue,WorldItem} from './types';
export const mediaAssets:MediaAsset[]=[
 {id:'missing-map',title:'Nova and the Missing Map',category:'CurioQuest Cartoons',domain:'reading',skills:['sound_m','sound_a','sound_p','blend_cvc'],ageMin:3,ageMax:8,duration:240,active:true,videoUrl:null,captionUrl:null,thumbnail:'map',scenes:[
  {id:'forest',caption:'A treasure garden is waiting! Nova packed a snack and a compass. But where is the map?',setting:'forest',duration:7,nova:'wave'},
  {id:'glow',caption:'A little light flickers near a tree. The first sound in moon will help us find its letter.',setting:'letters',duration:7,nova:'point',letters:'m'},
  {id:'sounds',caption:'Three letters are glowing. Touch m, then a, then p. Say each sound with your grown-up.',setting:'letters',duration:7,nova:'listen',letters:'m a p'},
  {id:'bridge',caption:'Bring the sounds together. Keep the first two sounds going, then finish with a tiny p.',setting:'letters',duration:7,nova:'explain',letters:'m a p'},
  {id:'word',caption:'The sounds make a word! Read it first. Then we can discover what it means.',setting:'letters',duration:6,nova:'encourage',letters:'map'},
  {id:'route',caption:'A map shows a route. Which word did we read? Look at every letter.',setting:'forest',duration:7,nova:'listen'},
  {id:'garden',caption:'You helped Nova reach the treasure garden! Your Explorer Map belongs in your treehouse.',setting:'garden',duration:7,nova:'celebrate'},
 ]},
 ...[
  ['sleeping-moon','The Sleeping Moon','science','moon'],['balance-bridge',"The Bridge That Wouldn’t Balance",'math','bridge'],['creature-mystery','Creature Grove Mystery','science','creature'],['rhythm-robot','The Rhythm Robot','logic','robot'],
 ].map(([id,title,domain,thumbnail])=>({id,title,category:'CurioQuest Cartoons',domain,skills:[],ageMin:3,ageMax:8,duration:180,active:false,videoUrl:null,captionUrl:null,thumbnail,scenes:[]})),
];
export const mediaCues:MediaCue[]=[
 {id:'find-m',mediaId:'missing-map',scene:1,at:5,kind:'choice',prompt:'Which letter starts the sound in moon?',choices:['s','m','a','p'],answer:'m',skillId:'sound_m',help:'Close your lips and hum. The letter is m.'},
 {id:'tap-map',mediaId:'missing-map',scene:2,at:5,kind:'sequence',prompt:'Touch the sounds from left to right: m, a, p.',choices:['p','m','a'],answer:'map',skillId:'blend_cvc',help:'First m, next a, then p. This is guided sound practice.'},
 {id:'blend-map',mediaId:'missing-map',scene:3,at:5,kind:'blend',prompt:'Slide the sounds together. What word do they make?',choices:['mat','map','pat','tap'],answer:'map',skillId:'blend_cvc',help:'Stretch m and short a, then finish with p. The word is map.'},
 {id:'read-map',mediaId:'missing-map',scene:5,at:5,kind:'choice',prompt:'Which word did the sounds make?',choices:['tap','pat','map','mat'],answer:'map',skillId:'blend_cvc',help:'Look at all three letters: m, a, p. Map.'},
];
export const worldItems:WorldItem[]=[
 {id:'explorer-map',name:'Explorer Map',art:'map',category:'decorations',zone:'treehouse',unlock:'Finish Nova and the Missing Map',description:'A reminder that sounds can open a new path.'},
 {id:'moon-lamp',name:'Moon Lamp',art:'moon',category:'science objects',zone:'treehouse',unlock:'Finish Today’s Adventure',description:'A gentle glow for your cozy reading corner.'},
 {id:'creature-poster',name:'Creature Poster',art:'creature',category:'decorations',zone:'treehouse',unlock:'Reserved for a future habitat episode',description:'Room for discoveries about living things.'},
 {id:'robot-toy',name:'Robot Toy',art:'robot',category:'toys',zone:'treehouse',unlock:'Finish a Space Collector mission',description:'A friendly rover who loves a careful thinker.'},
 {id:'bridge-blueprint',name:'Bridge Blueprint',art:'bridge',category:'machines',zone:'treehouse',unlock:'Reserved for a future bridge episode',description:'An idea for something you could build together.'},
 {id:'nova-storybook',name:'Nova Storybook',art:'book',category:'books',zone:'treehouse',unlock:'Finish the tiny story in Today’s Adventure',description:'Small words tell a whole story.'},
 {id:'discovery-plant',name:'Discovery Plant',art:'plant',category:'plants',zone:'treehouse',unlock:'A grown-up confirms your real-world mission',description:'Curiosity grows beyond the screen.'},
 {id:'star-globe',name:'Star Globe',art:'globe',category:'science objects',zone:'treehouse',unlock:'Finish Today’s Adventure',description:'A world of questions, ready to explore.'},
];
export const sampleAdventure={id:'map-adventure-v1',title:'The trail to Treasure Garden',steps:['episode','blend','collector','story','reward','treehouse','offline'],estimatedSeconds:600};
