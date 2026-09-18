import { getSubwayResponse } from "@/lib/mta/getSubway";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const body = await getSubwayResponse();
  const status = body.configured ? 200 : 503;
  return Response.json(body, { status });
}
