import { getScheduleResponse } from "@/lib/nj/getSchedule";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const station = searchParams.get("station") ?? "";
  const line = searchParams.get("line");
  const body = await getScheduleResponse(station, line);
  return Response.json(body);
}
