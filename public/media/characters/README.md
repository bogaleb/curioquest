# Character scene assets

These 24 scenes were supplied by the project owner in `Downloads/New folder (2)`.
Each web copy is a 10-second, 1280 × 720 H.264 animation at 24 fps with fast-start metadata.
The JPEGs are poster frames taken at 1.5 seconds.

The source files are unchanged. Web copies omit the unaudited source audio. The player
offers optional spoken descriptions from `lib/character-clips.ts`, with the same text
always visible. Those descriptions explain the visuals; they are not transcripts.

Regenerate with:

```
node scripts/import-character-clips.mjs "path/to/source-folder" "path/to/ffmpeg"
```

Clips are requested only after Play. There is no autoplay or looping. The app pauses
clips when hidden, out of view, blocked by a dialog, or paused by the parent, and
retains posters and activities when video is unavailable. The theater exposes the
whole collection; other sections offer selected scenes and matching activities.

The filenames beginning with `nova-` depict human explorers. They are presented as
explorer friends rather than replacing Nova, the existing fox character.

The letter demonstration is specifically uppercase A. Plant growth is explicitly
described as sped up. The space/ocean portals are imaginary scenes. Rhythm pads use
a separately authored visual sequence rather than pretending to match unaudited audio.

Activities here are optional local practice; watching or completing them does not
write mastery evidence, award stars, or alter saved curriculum progress.
