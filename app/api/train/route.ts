import { getFollowedTrainResponse } from "@/lib/getFollowedTrain";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id")?.trim() ?? "";
  const body = await getFollowedTrainResponse(id);
  const status = body.configured ? 200 : 503;
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}
