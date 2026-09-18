import { getTrainsResponse } from "@/lib/nj/getTrains";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const body = await getTrainsResponse();
  const status = body.configured ? 200 : 503;
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "private, max-age=5, stale-while-revalidate=15" },
  });
}
