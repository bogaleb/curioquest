import test from 'node:test';
import assert from 'node:assert/strict';
import {loadTs} from './load-typescript.mjs';
const {mediaFormat}=loadTs('lib/media-validation');
test('Media uploads require the declared type to match the file signature',()=>{
 const png=new Uint8Array([137,80,78,71,13,10,26,10,0]);
 assert.deepEqual(mediaFormat(png,'image/png'),{extension:'png',kind:'image'});
 assert.equal(mediaFormat(png,'video/mp4'),null);
 assert.equal(mediaFormat(new TextEncoder().encode('<script>alert(1)</script>'),'image/png'),null);
 assert.equal(mediaFormat(new TextEncoder().encode('<svg></svg>'),'image/svg+xml'),null);
 assert.deepEqual(mediaFormat(new TextEncoder().encode('WEBVTT\n\n'),'text/vtt'),{extension:'vtt',kind:'captions'});
});
