import { getScheduleResponse } from "@/lib/nj/getSchedule";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const station = searchParams.get("station") ?? "";
  const line = searchParams.get("line");
  try {
    const body = await getScheduleResponse(station, line);
    return Response.json(body);
  } catch (e) {
    return Response.json(
      {
        stationCode: station,
        stationName: "",
        items: [],
        error: e instanceof Error ? e.message : "Schedule request failed",
      },
      { status: 500 },
    );
  }
}
