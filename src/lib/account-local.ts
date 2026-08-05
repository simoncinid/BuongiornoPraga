"use client";

export type LocalBooking = { pnr: string; tourTitle: string; startsAt: string; totalGuests: number; totalCents: number; status: string; selfServiceUrl: string };
export type LocalAccount = { name: string; email: string; phone: string; bookings: LocalBooking[] };
const key = "buongiorno-praga-account";

export function getLocalAccount(): LocalAccount | null {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(window.localStorage.getItem(key) || "null"); } catch { return null; }
}

export function saveLocalAccount(account: LocalAccount) { window.localStorage.setItem(key, JSON.stringify(account)); }

export function saveBookingToAccount(account: Omit<LocalAccount, "bookings">, booking: LocalBooking) {
  const stored = getLocalAccount();
  const bookings = [booking, ...(stored?.bookings || []).filter((item) => item.pnr !== booking.pnr)];
  saveLocalAccount({ ...account, bookings });
}
