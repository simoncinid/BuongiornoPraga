import { NextResponse } from "next/server";
import { bookings } from "@/lib/booking-store";

export async function GET() {
  return NextResponse.json({ bookings });
}
