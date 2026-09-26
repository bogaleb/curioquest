import { spawn } from 'node:child_process';
import { mkdir, readdir, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';

// Sources stay untouched. Web copies are intentionally silent; the app supplies
// optional narration from reviewed visual descriptions, not unverified dialogue.
const [source, ffmpeg] = process.argv.slice(2);
if (!source || !ffmpeg) throw new Error('Usage: node scripts/import-character-clips.mjs <source folder> <ffmpeg executable>');
const output = resolve('public/media/characters');
await mkdir(output, { recursive: true });
const run = (args) => new Promise((ok, fail) => {
  const child = spawn(ffmpeg, ['-hide_banner', '-loglevel', 'error', ...args], { stdio: 'inherit', windowsHide: true });
  child.on('error', fail);
  child.on('exit', code => code === 0 ? ok() : fail(new Error(`ffmpeg exited ${code}`)));
});
for (const name of (await readdir(source)).filter(name => /^[a-z-]+\.mp4$/.test(name)).sort()) {
  const input = join(source, name);
  await run(['-y', '-i', input, '-map', '0:v:0', '-an', '-vf', 'scale=1280:-2,fps=24', '-c:v', 'libx264', '-preset', 'fast', '-crf', '27', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-threads', '2', join(output, name)]);
  await run(['-y', '-ss', '1.5', '-i', input, '-frames:v', '1', '-vf', 'scale=960:-2', '-q:v', '3', join(output, name.replace('.mp4', '.jpg'))]);
  console.log(`${name}: ${Math.round((await stat(join(output, name))).size / 1024)} KB`);
}
