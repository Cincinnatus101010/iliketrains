import { njConfigured } from "@/lib/nj/config";

export async function GET() {
  return Response.json({ ok: true, njConfigured });
}
