"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, X } from "lucide-react";

export function AddedToCartBanner() {
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(searchParams.get("added") === "1");
  }, [searchParams]);

  if (!visible) return null;

  return (
    <div className="mb-6 flex items-start justify-between gap-4 border border-primary/30 bg-[#fbf3dd] px-5 py-4">
      <div className="flex gap-3">
        <CheckCircle2 className="mt-0.5 shrink-0 text-primary" size={22} />
        <div>
          <p className="font-semibold text-ink">Tour aggiunto al carrello</p>
          <p className="body-sm mt-1">
            Continua a esplorare altre esperienze, oppure{" "}
            <Link href="/carrello" className="font-semibold text-ink underline underline-offset-2">
              vai al carrello
            </Link>{" "}
            per completare l&apos;acquisto.
          </p>
        </div>
      </div>
      <button type="button" onClick={() => setVisible(false)} aria-label="Chiudi" className="text-muted hover:text-ink">
        <X size={18} />
      </button>
    </div>
  );
}
