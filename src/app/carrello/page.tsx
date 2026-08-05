import { CartClient } from "@/components/CartClient";

export const metadata = {
  title: "Carrello",
  robots: { index: false, follow: false }
};

export default function CartPage() {
  return (
    <section className="section bg-surface-soft">
      <div className="container-page max-w-5xl">
        <CartClient />
      </div>
    </section>
  );
}
