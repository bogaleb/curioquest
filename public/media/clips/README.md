# Hero clip library

Short character videos for CurioQuest's big moments — welcome, lesson intros,
teaching beats, world transitions, celebrations, and Tuno's calm-down.

## Files

`public/media/clips/<clip-id>.mp4` — 25 clips (Phase 1, September 2026).

The catalog lives in `lib/media/clips.ts` (captions, cues, owners). The
CharacterDirector (`lib/character/director.ts`) names clips; `HeroClipPlayer`
(`components/learning/hero-clip-player.tsx`) plays them with an SVG fallback.

## Production path

These files are served from `public/` in dev. For production:

1. Upload the MP4s to the `curriculum-media` Supabase Storage bucket
   (10 MB per-file limit — all clips fit).
2. Set `NEXT_PUBLIC_CLIP_CDN` to the bucket's public URL prefix.
3. `clipUrl()` in `lib/media/clips.ts` resolves there first, falling back
   to `/media/clips/` locally.
4. Run `supabase/migrations/20260925000100_clip_library.sql` so the Theater
   lists them; update `videoUrl` to the CDN URLs when you cut over.

To keep the repo lean, consider git-ignoring `*.mp4` here once the storage
upload is the source of truth.
