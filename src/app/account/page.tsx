import { AccountClient } from "@/components/AccountClient";

export const metadata = { title: "Area cliente", robots: { index: false, follow: false } };

export default function AccountPage() { return <section className="section"><div className="container-page max-w-4xl"><p className="micro-label mb-2 text-muted">Buongiorno Praga</p><h1 className="display-xl mb-6">La tua area cliente</h1><AccountClient /></div></section>; }
