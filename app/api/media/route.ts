import {withFamily,parentId} from '@/lib/backend/context';
import {parentAuthorized} from '@/lib/parent-security';
import {createAdminClient} from '@/lib/supabase/admin';
import {MEDIA_LIMIT,mediaFormat} from '@/lib/media-validation';
import {requestJson} from '@/lib/request-json';
const reply=(data:unknown,status=200)=>Response.json(data,{status});
export const GET=withFamily(async request=>{
 if(!await parentAuthorized(request))return reply({error:'Unlock Parent Corner to manage family media.'},403);
 const client=createAdminClient(),{data,error}=await client.from('media_assets').select('id,slug,title,media_type,bucket,object_path').eq('parent_id',parentId()).order('created_at',{ascending:false}).limit(100);
 if(error)return reply({error:'Media could not be loaded.'},503);
 const items=await Promise.all(data.map(async item=>{const signed=item.bucket&&item.object_path?await client.storage.from(item.bucket).createSignedUrl(item.object_path,600):null;return {...item,url:signed?.data?.signedUrl??null};}));
 return reply({items});
});
export const POST=withFamily(async request=>{
 if(request.headers.get('origin')!==new URL(request.url).origin)return reply({error:'Request not allowed.'},403);
 if(!await parentAuthorized(request))return reply({error:'Unlock Parent Corner before uploading.'},403);
 const reader=request.body?.getReader();if(!reader)return reply({error:'Choose a file.'},400);
 const parts:Uint8Array[]=[];let size=0;
 while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>MEDIA_LIMIT+65536){await reader.cancel();return reply({error:'Choose a file smaller than 10 MB.'},413);}parts.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length;}
 let form:FormData;try{form=await new Response(bytes.buffer,{headers:{'Content-Type':request.headers.get('content-type')??''}}).formData();}catch{return reply({error:'Choose a valid upload.'},400);}
 const file=form.get('file'),slug=String(form.get('slug')??'').trim(),title=String(form.get('title')??'').trim();
 if(!(file instanceof File)||!file.size||file.size>MEDIA_LIMIT||!/^[a-z0-9_-]{1,80}$/.test(slug)||!title||title.length>100)return reply({error:'Choose a file, a short title, and a valid media ID.'},400);
 const data=new Uint8Array(await file.arrayBuffer()),format=mediaFormat(data,file.type);
 if(!format)return reply({error:'Use PNG, JPEG, WebP, MP3, WAV, MP4, or WebVTT matching its file type.'},400);
 const client=createAdminClient(),owner=parentId();
 const {count,error:countError}=await client.from('media_assets').select('id',{count:'exact',head:true}).eq('parent_id',owner);
 if(countError)return reply({error:'Media storage is unavailable.'},503);
 if((count??0)>=100)return reply({error:'Remove an older family media file first.'},409);
 const path=owner+'/'+crypto.randomUUID()+'.'+format.extension;
 const {error}=await client.storage.from('family-media').upload(path,data,{contentType:file.type,upsert:false});
 if(error)return reply({error:'Your file could not be uploaded. Please try again.'},503);
 const saved=await client.from('media_assets').insert({parent_id:owner,slug,title,media_type:format.kind,bucket:'family-media',object_path:path,published:false});
 if(saved.error){await client.storage.from('family-media').remove([path]);return reply({error:'Your media could not be saved. Please try again.'},503);}
 return reply({saved:true},201);
});
export const DELETE=withFamily(async request=>{
 if(request.headers.get('origin')!==new URL(request.url).origin)return reply({error:'Request not allowed.'},403);
 if(!await parentAuthorized(request))return reply({error:'Unlock Parent Corner before deleting.'},403);
 const body=await requestJson(request,2048);if(body.confirm!==true||typeof body.id!=='string')return reply({error:'Confirm the file deletion.'},400);
 const client=createAdminClient(),{data,error}=await client.from('media_assets').select('id,bucket,object_path').eq('id',body.id).eq('parent_id',parentId()).maybeSingle();
 if(error)return reply({error:'Media could not be opened.'},503);if(!data)return reply({error:'Media not found.'},404);
 if(data.bucket&&data.object_path){const removed=await client.storage.from(data.bucket).remove([data.object_path]);if(removed.error)return reply({error:'File could not be deleted. Please retry.'},503);}
 const removed=await client.from('media_assets').delete().eq('id',data.id).eq('parent_id',parentId());
 return removed.error?reply({error:'Deletion is incomplete. Please retry.'},503):reply({deleted:true});
});
