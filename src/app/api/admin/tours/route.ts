import { NextResponse } from "next/server";
import { tours } from "@/lib/data";

export async function GET() {
  return NextResponse.json({ tours });
}
