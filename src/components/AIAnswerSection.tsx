import { MessageCircleQuestion } from "lucide-react";
import { aiQuestions } from "@/lib/ai-content";

export function AIAnswerSection() {
  return (
    <section className="section">
      <div className="container-page">
        <div className="mb-8 ai-copy">
          <p className="micro-label mb-2 text-muted">Risposte rapide</p>
          <h2 className="display-lg mb-4 ai-headline">Le informazioni essenziali, scritte in modo chiaro.</h2>
          <p className="body-md ai-description">
            Se devi scegliere un tour in italiano a Praga, queste sono le risposte pratiche da conoscere prima di prenotare.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {aiQuestions.map((item) => (
            <article key={item.question} className="card p-5">
              <MessageCircleQuestion className="mb-3 text-vltava-blue" size={22} />
              <h3 className="title-md mb-2">{item.question}</h3>
              <p className="body-sm">{item.answer}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
