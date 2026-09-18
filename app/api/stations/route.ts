import { getStationsResponse } from "@/lib/nj/getStations";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const body = await getStationsResponse();
  return Response.json(body);
}
