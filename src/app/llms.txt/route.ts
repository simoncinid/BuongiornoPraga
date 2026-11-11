import { catalog, publicSiteContent } from "@/lib/platform/public";
import { llmsTxt } from "@/lib/ai-content";

export const dynamic = "force-dynamic";

export async function GET() {
  return new Response(llmsTxt(await catalog(), await publicSiteContent()), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=60",
    },
  });
}
