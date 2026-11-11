import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { localMode } from "@/lib/platform/store";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params;
  if (!localMode() || !/^[-a-f0-9]{36}\.webp$/.test(key))
    return new NextResponse(null, { status: 404 });
  try {
    return new NextResponse(await readFile(`.data/media/${key}`), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public,max-age=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
