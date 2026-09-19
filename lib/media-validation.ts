export const MEDIA_LIMIT = 10 * 1024 * 1024;
export function mediaFormat(bytes: Uint8Array, mime: string): {extension:string;kind:string} | null {
 const text=(a:number,b:number)=>String.fromCharCode(...bytes.slice(a,b));
 if(mime==='image/png'&&bytes.length>8&&[137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v))return {extension:'png',kind:'image'};
 if(mime==='image/jpeg'&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return {extension:'jpg',kind:'image'};
 if(mime==='image/webp'&&text(0,4)==='RIFF'&&text(8,12)==='WEBP')return {extension:'webp',kind:'image'};
 if(mime==='audio/wav'&&text(0,4)==='RIFF'&&text(8,12)==='WAVE')return {extension:'wav',kind:'audio'};
 if(mime==='audio/mpeg'&&(text(0,3)==='ID3'||(bytes[0]===255&&(bytes[1]&224)===224)))return {extension:'mp3',kind:'audio'};
 if(mime==='video/mp4'&&text(4,8)==='ftyp')return {extension:'mp4',kind:'video'};
 if(mime==='text/vtt'&&new TextDecoder().decode(bytes.slice(0,16)).replace(/^\uFEFF/,'').startsWith('WEBVTT'))return {extension:'vtt',kind:'captions'};
 return null;
}
