import { getTripPlanResponse } from "@/lib/trip/getTripPlan";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  const body = await getTripPlanResponse(from, to);
  const status = body.error && !body.route ? 400 : 200;

  return Response.json(body, {
    status,
    headers: { "Cache-Control": "private, max-age=15, stale-while-revalidate=30" },
  });
}
