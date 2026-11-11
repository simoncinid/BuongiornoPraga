import { ReservationFlow } from "@/components/ReservationFlow";
export const metadata = {
  title: "Completa la prenotazione",
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <section className="section">
      <div className="container-page">
        <ReservationFlow mode="checkout" />
      </div>
    </section>
  );
}
