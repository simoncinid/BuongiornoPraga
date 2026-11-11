import { catalog, publicSiteContent } from "@/lib/platform/public";
import { aiContextJson } from "@/lib/ai-content";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(
    aiContextJson(await catalog(), await publicSiteContent()),
    {
      headers: {
        "Cache-Control": "public, max-age=60",
      },
    },
  );
}
