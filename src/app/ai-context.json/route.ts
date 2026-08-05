import { aiContextJson } from "@/lib/ai-content";

export const dynamic = "force-static";

export function GET() {
  return Response.json(aiContextJson(), {
    headers: {
      "Cache-Control": "public, max-age=3600"
    }
  });
}
