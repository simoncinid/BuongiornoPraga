import Image from "next/image";

const galleryItems = [
  {
    title: "Ponte Carlo al tramonto",
    caption: "Il passaggio iconico che molti attraversano di corsa, raccontato con ritmo e contesto.",
    imageUrl: "https://images.unsplash.com/photo-1519677100203-a0e668c92439?auto=format&fit=crop&w=1200&q=80",
    className: "md:col-span-2 md:row-span-2"
  },
  {
    title: "Castello e Mala Strana",
    caption: "Panorami, potere e vicoli storici senza seguire un percorso improvvisato.",
    imageUrl: "https://images.unsplash.com/photo-1541849546-216549ae216d?auto=format&fit=crop&w=900&q=80",
    className: ""
  },
  {
    title: "Birra ceca e locali scelti",
    caption: "Esperienze serali ordinate, conviviali e lontane dai soliti locali turistici.",
    imageUrl: "https://images.unsplash.com/photo-1600788886242-5c96aabe3757?auto=format&fit=crop&w=900&q=80",
    className: ""
  },
  {
    title: "Citta Vecchia",
    caption: "Punti essenziali, indicazioni pratiche e consigli per muoversi con sicurezza.",
    imageUrl: "https://images.unsplash.com/photo-1541849546-216549ae216d?auto=format&fit=crop&w=900&q=80",
    className: ""
  },
  {
    title: "Praga senza stress",
    caption: "Punti d'incontro chiari, guide in italiano e supporto prima del tour.",
    imageUrl: "https://images.unsplash.com/photo-1519677100203-a0e668c92439?auto=format&fit=crop&w=900&q=80",
    className: ""
  }
];

export function PragueGallery() {
  return (
    <section className="section bg-surface-card">
      <div className="container-page">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="gallery-copy">
            <p className="micro-label mb-2 text-muted">Gallery</p>
            <h2 className="display-lg mb-3 gallery-headline">Praga da guardare, non da inseguire sul telefono.</h2>
            <p className="body-md gallery-description">
              Scorci reali dei percorsi: luoghi iconici, quartieri storici e momenti pensati per chi vuole orientarsi senza frizione.
            </p>
          </div>
        </div>
        <div className="grid auto-rows-[240px] gap-4 md:grid-cols-4 md:auto-rows-[220px]">
          {galleryItems.map((item) => (
            <figure key={item.title} className={`group relative overflow-hidden rounded-md ${item.className}`}>
              <Image
                src={item.imageUrl}
                alt={item.title}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                loading="eager"
                className="object-cover transition duration-300 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#071a35]/95 via-[#143b77]/48 to-transparent" />
              <figcaption className="absolute inset-x-0 bottom-0 p-4 text-on-dark">
                <strong className="title-md !text-on-dark">{item.title}</strong>
                <span className="body-sm mt-1 block !text-hairline-soft">{item.caption}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
