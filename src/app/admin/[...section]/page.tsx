import { notFound } from "next/navigation";
import { AdminWorkspace } from "@/components/AdminWorkspace";
export const metadata = {
  title: "Spazio di gestione",
  robots: { index: false, follow: false },
};
const allowed = [
  "sito",
  "contenuti",
  "tour",
  "calendario",
  "prenotazioni",
  "prezzi",
  "sconti",
  "last-minute",
  "affiliati",
  "email",
  "canali",
  "richieste",
  "impostazioni",
  "report",
  "audit",
  "pre-tour",
];
export default async function Page({
  params,
}: {
  params: Promise<{ section: string[] }>;
}) {
  const { section } = await params;
  if (!allowed.includes(section[0]) || section.length > 2) notFound();
  return <AdminWorkspace key={section.join("/")} />;
}
