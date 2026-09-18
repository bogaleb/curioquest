import type {Artwork,ArtMark} from './workspace-content';
import {drawTemplate} from './art-templates';
export function floodFill(ctx:CanvasRenderingContext2D,x:number,y:number,color:string){
  const transform=ctx.getTransform();const px=Math.floor(x*transform.a+transform.e),py=Math.floor(y*transform.d+transform.f);
  const {width:w,height:h}=ctx.canvas;if(px<0||px>=w||py<0||py>=h)return;const pixels=ctx.getImageData(0,0,w,h);const d=pixels.data;const start=(py*w+px)*4;
  const target=[d[start],d[start+1],d[start+2]],rgb=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16));
  if(target.every((n,i)=>Math.abs(n-rgb[i])<8))return;
  const stack=[start/4],seen=new Uint8Array(w*h);
  while(stack.length){const p=stack.pop()!;if(seen[p])continue;seen[p]=1;const at=p*4;if(!target.every((n,i)=>Math.abs(d[at+i]-n)<32))continue;rgb.forEach((n,i)=>d[at+i]=n);d[at+3]=255;const col=p%w;if(col>0)stack.push(p-1);if(col<w-1)stack.push(p+1);if(p>=w)stack.push(p-w);if(p<(h-1)*w)stack.push(p+w);}
  ctx.putImageData(pixels,0,0);
}
export function drawMark(ctx:CanvasRenderingContext2D,mark:ArtMark){
  ctx.save();ctx.strokeStyle=mark.tool==='eraser'?'#ffffff':mark.color;ctx.fillStyle=ctx.strokeStyle;ctx.lineWidth=mark.size;ctx.lineCap='round';ctx.lineJoin='round';
  if(mark.tool==='fill'){floodFill(ctx,mark.points[0][0],mark.points[0][1],mark.color);ctx.restore();return;}
  if(mark.tool==='stamp'){ctx.font=`${mark.size*3}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(mark.stamp??'⭐',...mark.points[0]);ctx.restore();return;}
  ctx.globalAlpha=mark.tool==='marker'?.6:mark.tool==='crayon'?.65:mark.tool==='brush'?.85:1;
  if(mark.points.length===1){ctx.beginPath();ctx.arc(...mark.points[0],mark.size/2,0,Math.PI*2);ctx.fill();}
  else{ctx.beginPath();mark.points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();}
  if(mark.tool==='crayon'){ctx.globalAlpha=.3;ctx.lineWidth=1;for(let i=0;i<mark.points.length;i+=3){const [x,y]=mark.points[i];ctx.clearRect(x-1,y-1,1,1);}}
  ctx.restore();
}
export function renderArtwork(canvas:HTMLCanvasElement,art:Artwork){const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)return;ctx.save();ctx.setTransform(canvas.width/1000,0,0,canvas.height/700,0,0);ctx.fillStyle='#fff';ctx.fillRect(0,0,1000,700);drawTemplate(ctx,art.template,art.mode==='writing'?art.guide:'');art.marks.forEach(mark=>drawMark(ctx,mark));drawTemplate(ctx,art.template,art.mode==='writing'?art.guide:'');ctx.restore();}
