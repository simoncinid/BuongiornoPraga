import { platformApi } from "@/lib/platform/api";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;
async function handle(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return platformApi(request, (await params).path);
}
export { handle as GET, handle as POST, handle as PUT, handle as PATCH };
