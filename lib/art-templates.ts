import {drawTrace} from './handwriting';
export const artTemplates = [
  ['blank','Blank page','Free create','✨'],['cat','Curious cat','Animals','🐱'],['fish','Rainbow fish','Ocean','🐠'],['butterfly','Butterfly wings','Nature','🦋'],['dinosaur','Friendly dinosaur','Dinosaurs','🦕'],['turtle','Garden turtle','Animals','🐢'],['bird','Little songbird','Animals','🐦'],['whale','Ocean giant','Ocean','🐳'],['rocket','Moon rocket','Space','🚀'],['planets','Our little universe','Space','🪐'],['stars','Starry sky','Space','⭐'],['car','Adventure car','Vehicles','🚗'],['train','Discovery train','Vehicles','🚂'],['boat','Sailing day','Vehicles','⛵'],['house','Dream home','Buildings','🏡'],['castle','Wonder castle','Fantasy','🏰'],['robot','Robot friend','Robots','🤖'],['flower','Flower garden','Nature','🌷'],['tree','Tree of seasons','Nature','🌳'],['rainbow','After the rain','Nature','🌈'],['fruit','Fruit picnic','Food','🍎'],['cupcake','A little celebration','Food','🧁'],['letters','Alphabet garden','Letters','🔤'],['numbers','Counting party','Numbers','🔢'],['helper','Community helper','Community','🧑‍🚒'],['snow','Snowy friend','Seasons','⛄'],
] as const;
export const creativeChallenges=[
  'Draw three things beginning with B.','Draw an animal that lives in water.','Draw five stars and two moons.','Design a house with rectangles and triangles.','Invent a robot that helps a friend.','Draw what a seed needs to grow.','Write one sentence about your picture.','Design a bridge for two tiny animals.',
];
export function drawTemplate(ctx:CanvasRenderingContext2D,id:string,guide=''){
  if(id.startsWith('trace:')){drawTrace(ctx,id.slice(6));return;}
  ctx.save();ctx.strokeStyle='#344b56';ctx.fillStyle='white';ctx.lineWidth=4;ctx.lineJoin='round';ctx.lineCap='round';
  const ellipse=(x:number,y:number,rx:number,ry:number)=>{ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.stroke();};
  const box=(x:number,y:number,w:number,h:number)=>ctx.strokeRect(x,y,w,h);
  const path=(points:number[][],close=false)=>{ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));if(close)ctx.closePath();ctx.stroke();};
  const star=(x:number,y:number,r:number)=>path(Array.from({length:10},(_,i)=>{const a=i*Math.PI/5-Math.PI/2;return [x+Math.cos(a)*(i%2?r*.45:r),y+Math.sin(a)*(i%2?r*.45:r)];}),true);
  const eyes=(x=450,y=290)=>{ellipse(x,y,9,12);ellipse(x+100,y,9,12);};
  if(id==='blank'&&!guide){ctx.restore();return;}
  if(guide){ctx.strokeStyle='#b6c7d0';ctx.lineWidth=2;[240,350,460,570].forEach(y=>path([[65,y],[935,y]]));ctx.setLineDash([3,7]);ctx.font='150px "Trebuchet MS", sans-serif';ctx.textAlign='center';ctx.strokeText(guide,500,430,850);ctx.restore();return;}
  if(['cat','bird','turtle','dinosaur','whale','fish'].includes(id)){
    if(id==='fish'||id==='whale'){ellipse(480,370,200,120);path([[670,365],[815,260],[815,470],[670,375]],true);ellipse(380,340,13,13);path([[390,410],[440,420],[470,405]]);if(id==='fish'){path([[460,270],[530,200],[570,280]]);path([[490,420],[530,465],[560,395]],true);}else{path([[430,245],[430,160],[380,125]]);path([[430,160],[470,115]]);} [180,230,850].forEach((x,i)=>ellipse(x,170+i*90,25,25));}
    if(id==='cat'){ellipse(500,450,140,145);ellipse(500,260,135,110);path([[385,207],[380,100],[465,155]]);path([[535,155],[620,100],[615,207]]);eyes(450,250);path([[480,285],[520,285],[500,310]],true);path([[355,290],[270,270]]);path([[350,320],[265,335]]);path([[645,290],[730,270]]);path([[650,320],[735,335]]);ellipse(430,565,45,25);ellipse(570,565,45,25);}
    if(id==='turtle'){ellipse(500,370,200,140);ellipse(755,350,70,60);ellipse(775,330,10,10);[[350,500],[630,500],[350,240],[630,240]].forEach(([x,y])=>ellipse(x,y,40,30));path([[390,300],[500,245],[610,300],[610,420],[500,490],[390,420]],true);}
    if(id==='bird'){ellipse(500,380,150,175);eyes(450,310);path([[470,350],[530,350],[500,395]],true);ellipse(400,420,40,90);ellipse(600,420,40,90);path([[460,550],[430,610],[490,610]]);path([[540,550],[520,610],[580,610]]);}
    if(id==='dinosaur'){ellipse(480,410,190,120);ellipse(680,230,90,70);path([[600,340],[620,235]]);path([[710,300],[655,440]]);ellipse(705,210,10,10);path([[300,380],[170,300],[300,465]]);box(355,510,65,85);box(530,510,65,85);[370,430,490].forEach(x=>path([[x,295],[x+20,245],[x+40,295]],true));}
  }else if(id==='butterfly'){ellipse(350,285,140,130);ellipse(650,285,140,130);ellipse(370,460,120,110);ellipse(630,460,120,110);ellipse(500,355,30,170);path([[485,190],[440,120]]);path([[515,190],[560,120]]);[350,650].forEach(x=>{ellipse(x,275,60,55);ellipse(x,450,45,40);});}
  else if(id==='rocket'){path([[400,490],[400,260],[500,110],[600,260],[600,490]],true);ellipse(500,290,55,55);path([[400,385],[310,515],[400,480]],true);path([[600,385],[690,515],[600,480]],true);path([[435,500],[460,605],[500,550],[540,605],[565,500]]);star(220,190,45);star(790,350,35);}
  else if(id==='planets'){ellipse(300,300,120,120);ellipse(690,400,95,95);ctx.save();ctx.translate(690,400);ctx.rotate(-.4);ellipse(0,0,170,35);ctx.restore();star(620,160,35);star(360,540,40);}
  else if(id==='stars'){[[230,230,85],[500,180,60],[750,270,95],[390,450,110],[700,530,65]].forEach(([x,y,r])=>star(x,y,r));}
  else if(id==='house'||id==='castle'){box(320,280,360,290);path([[280,280],[500,110],[720,280]],true);box(445,420,110,150);box(360,335,70,70);box(570,335,70,70);if(id==='castle'){box(195,230,125,340);box(680,230,125,340);path([[175,230],[257,110],[340,230]],true);path([[660,230],[742,110],[825,230]],true);}}
  else if(id==='car'||id==='train'){box(240,340,530,170);ellipse(350,520,65,65);ellipse(665,520,65,65);if(id==='car'){path([[310,340],[390,220],[620,220],[710,340]]);box(430,250,140,65);}else{box(255,210,180,130);box(285,245,110,65);box(635,240,60,100);ellipse(680,180,40,40);ellipse(730,120,30,30);}}
  else if(id==='boat'){path([[200,450],[310,570],[710,570],[820,450]],true);path([[500,450],[500,140],[740,410],[500,410]]);path([[470,180],[270,410],[470,410]],true);path([[150,610],[270,585],[400,610],[530,585],[660,610],[810,585]]);}
  else if(id==='robot'){box(370,150,260,190);box(340,360,320,200);eyes(440,225);box(435,285,130,25);path([[500,150],[500,95]]);ellipse(500,75,20,20);box(240,375,80,130);box(680,375,80,130);box(380,560,80,65);box(540,560,80,65);ellipse(500,450,55,55);}
  else if(id==='flower'){[260,500,750].forEach((x,i)=>{const y=280+i%2*90;for(let n=0;n<6;n++)ellipse(x+Math.cos(n*Math.PI/3)*55,y+Math.sin(n*Math.PI/3)*55,32,32);ellipse(x,y,28,28);path([[x,y+90],[x,590]]);ellipse(x-40,500,40,20);});}
  else if(id==='tree'){box(460,340,80,250);ellipse(500,260,160,155);ellipse(345,300,90,100);ellipse(655,300,90,100);path([[140,595],[850,595]]);}
  else if(id==='rainbow'){[240,290,340,390].forEach(r=>{ctx.beginPath();ctx.arc(500,520,r,Math.PI,Math.PI*2);ctx.stroke();});ellipse(200,550,140,60);ellipse(800,550,140,60);}
  else if(id==='fruit'){ellipse(330,380,110,125);ellipse(630,390,120,130);path([[330,255],[345,190]]);ellipse(390,200,45,22);path([[625,260],[630,210]]);ellipse(675,225,40,20);box(170,540,660,25);}
  else if(id==='cupcake'){path([[330,365],[385,585],[615,585],[670,365]],true);ellipse(500,290,195,100);ellipse(500,180,35,35);[420,500,580].forEach(x=>path([[x,400],[x,550]]));}
  else if(id==='letters'||id==='numbers'){ctx.font='150px Trebuchet MS';ctx.textAlign='center';(id==='letters'?['A B C','a b c']:['1 2 3','4 5 6']).forEach((word,i)=>ctx.strokeText(word,500,300+i*220));}
  else if(id==='helper'){ellipse(500,275,105,100);eyes(455,265);path([[460,310],[500,330],[540,310]]);box(365,390,270,190);path([[395,190],[425,115],[575,115],[605,190]],true);box(470,430,60,90);}
  else if(id==='snow'){ellipse(500,470,155,140);ellipse(500,255,100,100);eyes(455,245);path([[500,265],[565,285],[500,295]],true);box(385,140,230,20);box(430,65,140,75);[410,465,520].forEach(y=>ellipse(500,y,12,12));path([[350,410],[240,340]]);path([[650,410],[760,340]]);}
  ctx.restore();
}
