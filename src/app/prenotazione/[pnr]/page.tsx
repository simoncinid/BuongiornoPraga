import { notFound } from "next/navigation";
import { BookingConfirmation } from "@/components/BookingConfirmation";
export const metadata = {
  title: "Conferma prenotazione",
  robots: { index: false, follow: false },
};
export default async function Page({
  params,
}: {
  params: Promise<{ pnr: string }>;
}) {
  if ((await params).pnr !== "confermata") notFound();
  return <BookingConfirmation />;
}
