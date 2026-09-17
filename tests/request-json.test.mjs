import test from "node:test";
import assert from "node:assert/strict";
import {loadTs} from "./load-typescript.mjs";
const {requestJson}=loadTs("lib/request-json");
test("request reader rejects oversized streamed bytes even without content-length",async()=>{
  const stream=new ReadableStream({start(controller){controller.enqueue(new Uint8Array(13));controller.close();}});
  await assert.rejects(requestJson(new Request("http://localhost",{method:"POST",body:stream,duplex:"half"}),12),error=>error.status===413);
});
test("request reader accepts objects and rejects malformed JSON and arrays",async()=>{
  const request=body=>new Request("http://localhost",{method:"POST",body});
  assert.deepEqual(await requestJson(request('{"action":"start"}'),30),{action:"start"});
  for(const body of ["{","[]","null"] )await assert.rejects(requestJson(request(body),30),error=>error.status===400);
});
