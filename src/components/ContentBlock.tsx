import type { ContentPage } from "@/lib/platform/model";
export function ContentBlock({ page }: { page: ContentPage }) {
  return (
    <section className="section">
      <div className="container-page max-w-4xl">
        <p className="micro-label text-primary">{page.subtitle}</p>
        <h1 className="display-xl my-5">{page.title}</h1>
        <div className="body-md whitespace-pre-wrap">{page.body}</div>
      </div>
    </section>
  );
}
