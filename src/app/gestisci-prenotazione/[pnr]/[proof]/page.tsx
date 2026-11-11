import { ManageBooking } from "@/components/ManageBooking";
export const metadata = {
  title: "Gestisci questa prenotazione",
  robots: { index: false, follow: false },
};
export default async function Page({
  params,
}: {
  params: Promise<{ pnr: string; proof: string }>;
}) {
  const { pnr, proof } = await params;
  return <ManageBooking pnr={pnr} proof={proof} />;
}
