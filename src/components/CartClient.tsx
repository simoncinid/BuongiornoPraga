"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CreditCard, ShoppingBag, Trash2 } from "lucide-react";
import {
  cartItemTotal,
  cartSubtotal,
  getCartItems,
  removeFromCart,
  type CartItem
} from "@/lib/cart";
import { formatMoney } from "@/lib/format";

export function CartClient() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(getCartItems());
    setReady(true);
  }, []);

  function refresh() {
    setItems(getCartItems());
  }

  function removeItem(id: string) {
    removeFromCart(id);
    refresh();
  }

  function checkoutFirst() {
    const first = items[0];
    if (!first) return;
    router.push(
      `/pagamento?tour=${first.tourSlug}&slot=${first.slotId}&adults=${first.adults}&children=${first.children}`
    );
  }

  if (!ready) {
    return <p className="body-sm">Carico il carrello...</p>;
  }

  if (items.length === 0) {
    return (
      <div className="card shadow-card grid gap-4 p-8 text-center">
        <ShoppingBag className="mx-auto text-primary" size={36} />
        <h1 className="display-lg">Il carrello è vuoto</h1>
        <p className="body-md">Scegli un tour e aggiungilo al carrello per continuare più tardi.</p>
        <Link href="/tour" className="button-primary mx-auto !rounded-full">
          Scopri i tour
        </Link>
      </div>
    );
  }

  const total = cartSubtotal(items);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="grid gap-4">
        <h1 className="display-lg">Il tuo carrello</h1>
        {items.map((item) => (
          <article key={item.id} className="card grid gap-3 p-5 md:grid-cols-[1fr_auto]">
            <div>
              <h2 className="title-md mb-1">{item.tourTitle}</h2>
              <p className="body-sm capitalize">
                {new Date(item.startsAt).toLocaleDateString("it-IT", {
                  weekday: "long",
                  day: "numeric",
                  month: "long"
                })}{" "}
                · {new Date(item.startsAt).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
              </p>
              <p className="body-sm">
                {item.adults} adulti{item.children ? ` · ${item.children} bambini` : ""}
              </p>
              <strong className="mt-2 block text-ink">{formatMoney(cartItemTotal(item))}</strong>
            </div>
            <div className="flex flex-col items-start gap-3 md:items-end">
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink"
              >
                <Trash2 size={16} /> Rimuovi
              </button>
              <Link
                href={`/pagamento?tour=${item.tourSlug}&slot=${item.slotId}&adults=${item.adults}&children=${item.children}`}
                className="text-sm font-semibold text-primary hover:underline"
              >
                Acquista questo
              </Link>
            </div>
          </article>
        ))}
      </div>

      <aside className="card shadow-card sticky top-24 self-start p-6">
        <div className="mb-5 flex justify-between border-b border-hairline pb-4">
          <span className="text-sm text-muted">Totale</span>
          <strong className="text-xl text-ink">{formatMoney(total)}</strong>
        </div>
        <button type="button" onClick={checkoutFirst} className="button-primary mb-3 w-full !rounded-full">
          <CreditCard size={17} /> Completa l&apos;acquisto
        </button>
        <Link href="/tour" className="button-secondary w-full !rounded-full">
          Aggiungi altri tour
        </Link>
      </aside>
    </div>
  );
}
