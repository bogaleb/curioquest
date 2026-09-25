import { isLearningBandId } from "@/lib/learning-bands";
import { judgeDiscovery } from "@/lib/discover/engine";
import { requestJson, RequestBodyError } from "@/lib/request-json";

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") return new Response(null, { status: 404 });
  try {
    const input = await requestJson(request, 8000);
    if (typeof input.lesson !== "string" || !isLearningBandId(input.band)) return Response.json({ error: "Invalid preview." }, { status: 400 });
    const result = judgeDiscovery(input.lesson, input.band, input.response);
    if (!result) return Response.json({ error: "Finish the answer first." }, { status: 400 });
    return Response.json({ ...result, practicedAt: result.correct ? new Date().toISOString() : null }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: "The preview could not check that answer." }, { status: error instanceof RequestBodyError ? error.status : 500 });
  }
}
