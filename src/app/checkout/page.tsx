import { redirect } from "next/navigation";

type Props = { searchParams: Promise<{ tour?: string; slot?: string; adults?: string; children?: string }> };

export const metadata = { title: "Dati per la prenotazione", robots: { index: false, follow: false } };

export default async function CheckoutPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = new URLSearchParams();
  if (params.tour) query.set("tour", params.tour);
  if (params.slot) query.set("slot", params.slot);
  if (params.adults) query.set("adults", params.adults);
  if (params.children) query.set("children", params.children);
  redirect(`/pagamento?${query.toString()}`);
}
