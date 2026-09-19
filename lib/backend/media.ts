import 'server-only';
import { read } from './repository';
import { createAdminClient } from '@/lib/supabase/admin';
import type { MediaAsset } from '@/lib/experience/types';
import type { ReadingCatalog } from '@/lib/reading/types';
type StoredMedia={slug:string;bucket:string|null;object_path:string|null;media_type:string};
async function signed(asset:StoredMedia|undefined) {
  if(!asset?.bucket||!asset.object_path)return null;
  const {data,error}=await createAdminClient().storage.from(asset.bucket).createSignedUrl(asset.object_path,3600);
  return error?null:data.signedUrl;
}
export async function resolveReadingAudio(content:ReadingCatalog) {
  const assets=await read<StoredMedia[]>('media');
  const audio=async <T extends {id:string;audioSrc?:string}>(item:T):Promise<T>=>{
    const url=await signed(assets.find(a=>a.slug===item.id&&a.media_type==='audio'));
    return url?{...item,audioSrc:url}:item;
  };
  return {...content,skills:await Promise.all(content.skills.map(audio)),words:await Promise.all(content.words.map(audio))};
}
export async function resolveMedia(media: MediaAsset[]) {
  const assets = await read<{slug: string; bucket: string | null; object_path: string | null; media_type: string}[]>('media');
  return Promise.all(media.map(async item => {
    const asset = assets.find(a => a.slug === item.id && a.media_type === 'video');
    const [video,caption]=await Promise.all([signed(asset),signed(assets.find(a=>a.slug===item.id+'-captions'&&a.media_type==='captions'))]);
    return {...item,videoUrl:video??item.videoUrl,captionUrl:caption??item.captionUrl};
  }));
}
