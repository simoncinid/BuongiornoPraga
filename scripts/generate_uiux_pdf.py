# -*- coding: utf-8 -*-
from pathlib import Path
from shutil import copyfile

from PIL import Image as PILImage
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm, mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    Image,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "output" / "pdf"
TMP_DIR = ROOT / "tmp" / "pdfs" / "uiux-assets"
PDF_PATH = OUT_DIR / "analisi-ui-ux-buongiorno-praga.pdf"
PDF_ALIAS_PATH = OUT_DIR / "Analisi_UIUX_Buongiorno_Praga_fine.pdf"

NAVY = colors.HexColor("#1268D6")
NAVY_SOFT = colors.HexColor("#0A56B2")
AMBER = colors.HexColor("#FF8A00")
AMBER_DARK = colors.HexColor("#E87500")
CANVAS = colors.HexColor("#F4F9FF")
SURFACE = colors.white
BODY = colors.HexColor("#48657D")
MUTED = colors.HexColor("#627C91")
HAIRLINE = colors.HexColor("#C4D9E9")
SOFT = colors.HexColor("#EAF4FC")
SUCCESS = colors.HexColor("#15803D")
BLUE = colors.HexColor("#168AF4")
WHATSAPP = colors.HexColor("#25D366")


def register_fonts():
    regular = "/System/Library/Fonts/Supplemental/Arial.ttf"
    bold = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
    if Path(regular).exists() and Path(bold).exists():
        pdfmetrics.registerFont(TTFont("DocSans", regular))
        pdfmetrics.registerFont(TTFont("DocSans-Bold", bold))
        return "DocSans", "DocSans-Bold"
    return "Helvetica", "Helvetica-Bold"


FONT, FONT_BOLD = register_fonts()


def make_styles():
    base = getSampleStyleSheet()
    return {
        "cover_kicker": ParagraphStyle(
            "cover_kicker",
            parent=base["Normal"],
            fontName=FONT_BOLD,
            fontSize=9,
            leading=12,
            textColor=AMBER,
            uppercase=True,
            spaceAfter=10,
        ),
        "cover_title": ParagraphStyle(
            "cover_title",
            parent=base["Title"],
            fontName=FONT_BOLD,
            fontSize=34,
            leading=39,
            textColor=colors.white,
            alignment=TA_LEFT,
            spaceAfter=12,
        ),
        "cover_subtitle": ParagraphStyle(
            "cover_subtitle",
            parent=base["Normal"],
            fontName=FONT,
            fontSize=13,
            leading=19,
            textColor=colors.HexColor("#D8E6F2"),
            spaceAfter=18,
        ),
        "h1": ParagraphStyle(
            "h1",
            parent=base["Heading1"],
            fontName=FONT_BOLD,
            fontSize=21,
            leading=26,
            textColor=NAVY,
            spaceBefore=6,
            spaceAfter=12,
        ),
        "h2": ParagraphStyle(
            "h2",
            parent=base["Heading2"],
            fontName=FONT_BOLD,
            fontSize=15,
            leading=19,
            textColor=NAVY,
            spaceBefore=8,
            spaceAfter=7,
        ),
        "body": ParagraphStyle(
            "body",
            parent=base["BodyText"],
            fontName=FONT,
            fontSize=9.7,
            leading=14.3,
            textColor=BODY,
            spaceAfter=7,
        ),
        "body_small": ParagraphStyle(
            "body_small",
            parent=base["BodyText"],
            fontName=FONT,
            fontSize=8.7,
            leading=12.5,
            textColor=BODY,
            spaceAfter=5,
        ),
        "caption": ParagraphStyle(
            "caption",
            parent=base["BodyText"],
            fontName=FONT,
            fontSize=8.2,
            leading=11.5,
            textColor=MUTED,
            spaceBefore=4,
            spaceAfter=9,
        ),
        "callout": ParagraphStyle(
            "callout",
            parent=base["BodyText"],
            fontName=FONT_BOLD,
            fontSize=10.5,
            leading=15,
            textColor=NAVY,
            spaceAfter=0,
        ),
        "table_head": ParagraphStyle(
            "table_head",
            parent=base["BodyText"],
            fontName=FONT_BOLD,
            fontSize=8.6,
            leading=11,
            textColor=colors.white,
        ),
        "table_cell": ParagraphStyle(
            "table_cell",
            parent=base["BodyText"],
            fontName=FONT,
            fontSize=8.2,
            leading=11.3,
            textColor=BODY,
        ),
        "table_cell_bold": ParagraphStyle(
            "table_cell_bold",
            parent=base["BodyText"],
            fontName=FONT_BOLD,
            fontSize=8.2,
            leading=11.3,
            textColor=NAVY,
        ),
        "quote": ParagraphStyle(
            "quote",
            parent=base["BodyText"],
            fontName=FONT_BOLD,
            fontSize=13,
            leading=18,
            textColor=NAVY,
            alignment=TA_CENTER,
            spaceAfter=6,
        ),
        "meta": ParagraphStyle(
            "meta",
            parent=base["BodyText"],
            fontName=FONT,
            fontSize=8.5,
            leading=12,
            textColor=colors.HexColor("#D8E6F2"),
        ),
    }


S = make_styles()


def p(text, style="body"):
    return Paragraph(text, S[style])


def bullet(text):
    return p(f"<font color='#E87500'>■</font> {text}", "body")


def crop_image(name, box, out_name):
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    src = ROOT / "screenshots" / name
    dst = TMP_DIR / out_name
    if not dst.exists() or dst.stat().st_mtime < src.stat().st_mtime:
        with PILImage.open(src) as im:
            im.crop(box).save(dst)
    return dst


def figure(path, caption, width=16.2 * cm, max_height=11.2 * cm):
    with PILImage.open(path) as im:
        iw, ih = im.size
    ratio = min(width / iw, max_height / ih)
    img = Image(str(path), width=iw * ratio, height=ih * ratio)
    img.hAlign = "CENTER"
    return KeepTogether([img, p(caption, "caption")])


def callout(text, accent=AMBER):
    data = [[p(text, "callout")]]
    table = Table(data, colWidths=[16.2 * cm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), SOFT),
                ("BOX", (0, 0), (-1, -1), 0.4, HAIRLINE),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
                ("LINEBEFORE", (0, 0), (0, -1), 4, accent),
            ]
        )
    )
    return table


def table(rows, widths, header=True):
    converted = []
    for r_index, row in enumerate(rows):
        style = "table_head" if header and r_index == 0 else "table_cell"
        converted.append([p(str(cell), style) for cell in row])
    t = Table(converted, colWidths=widths, repeatRows=1 if header else 0)
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), NAVY if header else SURFACE),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white if header else BODY),
                ("GRID", (0, 0), (-1, -1), 0.35, HAIRLINE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, CANVAS]),
            ]
        )
    )
    return t


def footer(canvas, doc):
    page = canvas.getPageNumber()
    width, height = A4
    if page == 1:
        return
    canvas.saveState()
    canvas.setStrokeColor(HAIRLINE)
    canvas.setLineWidth(0.4)
    canvas.line(doc.leftMargin, 15 * mm, width - doc.rightMargin, 15 * mm)
    canvas.setFont(FONT, 7.5)
    canvas.setFillColor(MUTED)
    canvas.drawString(doc.leftMargin, 10 * mm, "Analisi UI/UX - Buongiorno Praga")
    canvas.drawRightString(width - doc.rightMargin, 10 * mm, str(page))
    canvas.restoreState()


def cover(canvas, doc):
    width, height = A4
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.rect(0, 0, width, height, fill=1, stroke=0)
    canvas.setFillColor(AMBER)
    canvas.rect(0, height - 18 * mm, width, 18 * mm, fill=1, stroke=0)
    canvas.setFillColor(NAVY_SOFT)
    canvas.rect(0, 0, width, 34 * mm, fill=1, stroke=0)
    canvas.setFillColor(colors.white)
    canvas.setFont(FONT_BOLD, 8)
    canvas.drawString(22 * mm, 24 * mm, "Cliente: Buongiorno Praga")
    canvas.drawString(22 * mm, 18 * mm, "Documento: Analisi UI/UX - Fase 1")
    canvas.drawRightString(width - 22 * mm, 24 * mm, "Autore: Diego Simoncini")
    canvas.drawRightString(width - 22 * mm, 18 * mm, "Formato: A4 verticale")
    canvas.restoreState()


def build_story():
    home_crop = crop_image("home-desktop.png", (0, 0, 1440, 900), "home-hero.png")
    home_mobile = crop_image("home-mobile.png", (0, 0, 390, 1180), "home-mobile-top.png")
    tour_crop = crop_image("tour-desktop.png", (0, 0, 1440, 1120), "tour-detail.png")
    tour_mobile = crop_image("tour-mobile.png", (0, 0, 390, 1500), "tour-mobile-top.png")
    gallery_crop = crop_image("home-gallery-desktop.png", (0, 760, 1440, 1760), "catalogo-tours.png")
    geo_crop = crop_image("home-mobile-geo.png", (0, 4100, 390, 5700), "mobile-geo.png")

    story = []

    story += [
        Spacer(1, 92 * mm),
        p("ANALISI UI/UX", "cover_kicker"),
        p("Buongiorno Praga", "cover_title"),
        p(
            "Scelte progettuali per la Fase 1 del sito proprietario: esperienza pubblica, prenotazione, fiducia, assistenza e base operativa.",
            "cover_subtitle",
        ),
        Spacer(1, 8 * mm),
        p(
            "Obiettivo: trasformare il posizionamento di brand - protezione, chiarezza e assistenza per il turista italiano a Praga - in un'interfaccia concreta, leggibile e orientata alla prenotazione diretta.",
            "meta",
        ),
        PageBreak(),
    ]

    story += [
        p("Executive Summary", "h1"),
        p(
            "La demo di Fase 1 non va letta come una semplice sequenza di pagine. E' il primo nucleo di prodotto attraverso cui Buongiorno Praga puo presentarsi come alternativa credibile ai free tour di massa, alle boutique poco digitalizzate e alle OTA globali impersonali.",
        ),
        p(
            "La direzione UI/UX e volutamente sobria: pochi elementi decorativi, percorsi evidenti, call to action riconoscibili, supporto WhatsApp sempre raggiungibile e contenuti che riducono l'incertezza prima dell'acquisto. Il design lavora quindi su tre leve: fiducia, conversione e controllo operativo.",
        ),
        callout(
            "Sintesi: l'interfaccia traduce la promessa 'Goditi Praga con gli occhi, non con lo schermo del telefono' in scelte misurabili: booking guidato, punti d'incontro chiari, conferma tracciata, calendario, assistenza e back-office."
        ),
        Spacer(1, 6),
        table(
            [
                ["Asse", "Scelta progettuale", "Valore generato"],
                [
                    "Fiducia",
                    "Palette blu brillante, navbar bianca, copy rassicurante, WhatsApp H24, pagine legali e conferma strutturata.",
                    "Riduce ansia e aumenta la percezione di affidabilita prima del pagamento.",
                ],
                [
                    "Conversione",
                    "Catalogo leggibile, schede tour complete, CTA arancioni, booking con slot e partecipanti.",
                    "Trasforma l'interesse in prenotazione senza passare da email o chat manuali.",
                ],
                [
                    "Operativita",
                    "Admin, calendario, PNR, email, .ics, pre-tour e self-service tokenizzato.",
                    "Prepara scalabilita e riduce errori di gestione quando aumentano tour e richieste.",
                ],
            ],
            [3.0 * cm, 7.0 * cm, 6.2 * cm],
        ),
        PageBreak(),
    ]

    story += [
        p("1. Posizionamento UX", "h1"),
        p(
            "Il mercato dei tour italiani a Praga presenta tre vulnerabilita ricorrenti: gruppi troppo grandi, prenotazioni ancora gestite in modo artigianale e piattaforme globali efficienti ma fredde. La UI risponde a queste debolezze posizionando Buongiorno Praga come servizio locale, protettivo e organizzato.",
        ),
        p("Dal concetto di scudo protettivo all'interfaccia", "h2"),
        p(
            "Lo scudo protettivo diventa esperienza quando l'utente trova subito rassicurazioni pratiche: guida in italiano, gruppi ristretti, indicazioni geolocalizzate, cancellazione flessibile e contatto WhatsApp. Questi elementi non sono trattati come testo promozionale secondario, ma come prova funzionale del servizio.",
        ),
        p("La scelta della promessa iniziale", "h2"),
        p(
            "La frase principale mette al centro il beneficio psicologico, non il prodotto: il viaggiatore vuole vivere Praga senza perdersi tra mappe, cambio valuta, orari e dubbi logistici. Per questo la homepage apre con un messaggio di sollievo e non con un elenco tecnico di tour.",
        ),
        figure(
            home_crop,
            "Screenshot 1 - Homepage. Il primo viewport collega promessa, CTA e fiducia: l'utente capisce subito cosa puo fare e perche il servizio e diverso da una semplice lista di escursioni.",
            max_height=10.5 * cm,
        ),
        PageBreak(),
    ]

    story += [
        p("2. Obiettivi UX della Fase 1", "h1"),
        p(
            "La Fase 1 concentra il lavoro sulle parti che generano valore immediato: scoperta dell'offerta, valutazione del tour, prenotazione, conferma e controllo operativo. Ogni scelta e stata orientata a un problema utente o gestionale preciso.",
        ),
        table(
            [
                ["Obiettivo", "Scelta UI/UX", "Perche conta"],
                [
                    "Ridurre lo stress",
                    "Hero rassicurante, contenuti anti-truffa, WhatsApp visibile, punti d'incontro geolocalizzati.",
                    "Il turista italiano acquista piu facilmente se percepisce un riferimento locale affidabile.",
                ],
                [
                    "Velocizzare la prenotazione",
                    "Schede tour, slot, partecipanti, pagamento e riepilogo in un flusso lineare.",
                    "Meno passaggi manuali significa meno abbandoni e meno carico sul supporto.",
                ],
                [
                    "Comunicare qualita boutique",
                    "Card ordinate, badge di fiducia, copy protettivo, immagini di Praga e focus sui gruppi ristretti.",
                    "Differenzia dai free tour di massa senza rinunciare alla facilita di una piattaforma moderna.",
                ],
                [
                    "Preparare la scalabilita",
                    "Admin, calendario, PNR, .ics, pre-tour e link self-service.",
                    "La piattaforma nasce gia con una logica gestionale, non solo vetrina.",
                ],
            ],
            [3.4 * cm, 6.4 * cm, 6.4 * cm],
        ),
        Spacer(1, 10),
        figure(
            home_mobile,
            "Screenshot 2 - Mobile. La priorita mobile e coerente con l'uso reale: il viaggiatore consulta il sito in movimento, spesso poco prima o durante il soggiorno.",
            width=7.2 * cm,
            max_height=12.2 * cm,
        ),
        PageBreak(),
    ]

    story += [
        p("3. Design System", "h1"),
        p(
            "Il design system prende come riferimento la chiarezza dei marketplace consumer, ma non replica l'identita di Airbnb. Buongiorno Praga richiede un tono piu protettivo, locale e operativo. La conseguenza e una UI pulita, con gerarchie ferme e accenti usati con disciplina.",
        ),
        table(
            [
                ["Elemento", "Uso", "Motivazione"],
                [
                    "Vltava Blue #1268D6",
                    "Brand, testi della navbar bianca, footer, link, icone e sezioni di fiducia.",
                    "Mantiene affidabilita e riconoscibilita, ma rende l'esperienza piu fresca e vitale del precedente navy quasi nero.",
                ],
                [
                    "Prague Orange #FF8A00",
                    "CTA primarie, pagamento, conferma, invio richieste B2B e stati ad alto intento.",
                    "Concentra l'attenzione sulle azioni che generano conversione; non viene sprecato come decorazione.",
                ],
                [
                    "White + Sky Canvas #F4F9FF",
                    "Navbar, card, sfondo principale e aree informative.",
                    "Aumenta luminosita, separa bene le superfici e mantiene leggibilita su smartphone.",
                ],
                [
                    "Inter / sans leggibile",
                    "Titoli, testi, form, tabelle e CTA.",
                    "Garantisce chiarezza, implementazione semplice e un tono contemporaneo senza dipendere da font proprietari.",
                ],
            ],
            [3.4 * cm, 5.7 * cm, 7.1 * cm],
        ),
        Spacer(1, 10),
        callout(
            "Regola chiave: l'arancione viene trattato come colore di decisione, mentre il blu costruisce identita e orientamento. Se tutto fosse evidenziato, nulla guiderebbe davvero l'utente.",
            AMBER_DARK,
        ),
        Spacer(1, 6),
        p(
            "La revisione cromatica introduce una navbar bianca con testi blu e CTA arancione. Le figure conservano il valore di riferimento per struttura, gerarchia e contenuti; la palette descritta in questa sezione e quella applicata all'implementazione corrente.",
            "body_small",
        ),
        p("Forma e densita", "h2"),
        p(
            "Card da 12px, pulsanti da 8px e iconografia chiara producono un'interfaccia familiare senza diventare giocosa. Nelle aree operative, la densita aumenta in modo controllato: l'admin deve essere scandibile, non scenografico.",
        ),
        PageBreak(),
    ]

    story += [
        p("4. Architettura Informativa Pubblica", "h1"),
        p(
            "La struttura pubblica accompagna l'utente da una domanda ampia - 'posso fidarmi?' - a una decisione concreta - 'quale tour prenoto e quando?'. Per questo il sito non separa marketing e prodotto: le pagine commerciali contengono gia le prove operative utili alla conversione.",
        ),
        table(
            [
                ["Pagina", "Ruolo UX", "Scelta di valore"],
                [
                    "Homepage",
                    "Chiarire promessa, differenziazione e primo accesso ai tour.",
                    "La CTA porta subito all'offerta, mentre i trust signals anticipano le obiezioni.",
                ],
                [
                    "Catalogo tour",
                    "Consentire confronto rapido tra esperienze.",
                    "Le card mantengono visibili titolo, durata, prezzo, disponibilita e promessa pratica.",
                ],
                [
                    "Scheda tour",
                    "Trasformare interesse in prenotazione.",
                    "Racconto, mappa, dettagli inclusi e booking convivono nella stessa pagina.",
                ],
                [
                    "Tour privati / Partner Europa",
                    "Separare richieste B2B e gruppi dal funnel standard.",
                    "Evita di forzare scuole, agenzie e grandi gruppi dentro un checkout pensato per piccoli clienti.",
                ],
                [
                    "FAQ, Privacy, Termini",
                    "Ridurre dubbi prima del pagamento.",
                    "Aumentano fiducia e completano il profilo professionale del servizio.",
                ],
            ],
            [3.3 * cm, 5.8 * cm, 7.1 * cm],
        ),
        Spacer(1, 10),
        figure(
            gallery_crop,
            "Screenshot 3 - Tour e sezioni di supporto. La pagina alterna offerta, rassicurazioni e prova pratica, evitando una home puramente promozionale.",
            max_height=9.8 * cm,
        ),
        PageBreak(),
    ]

    story += [
        p("5. Scheda Tour e Flusso di Prenotazione", "h1"),
        p(
            "La scheda tour e il punto in cui il design deve lavorare con maggiore precisione. L'utente deve trovare nello stesso ambiente: cosa vede, quanto dura, dove si presenta, quanto paga, che supporto riceve e come conferma la prenotazione.",
        ),
        p("Scelte principali", "h2"),
        bullet("Booking con tour, slot, adulti, bambini e infanti: raccoglie i dati essenziali senza aprire conversazioni manuali non necessarie."),
        bullet("Disponibilita base: introduce gia un presidio anti-overbooking, coerente con la promessa di gruppi ristretti."),
        bullet("Pagamento Stripe o contanti: bilancia automazione e flessibilita commerciale nella prima fase."),
        bullet("PNR, conferma email, calendario .ics e self-service: danno all'utente prove concrete dopo l'acquisto e riducono l'ansia post-prenotazione."),
        Spacer(1, 6),
        figure(
            tour_crop,
            "Screenshot 4 - Scheda tour. La pagina concentra racconto, dettagli pratici e azione: il booking resta parte naturale dell'esperienza, non un passaggio separato.",
            max_height=10.8 * cm,
        ),
        PageBreak(),
    ]

    story += [
        p("6. WhatsApp H24 come Prodotto", "h1"),
        p(
            "Nel progetto Buongiorno Praga WhatsApp non e un semplice canale di contatto. E' una funzione di brand: rende tangibile la promessa che il turista non sia lasciato solo durante il soggiorno.",
        ),
        p(
            "Il widget persistente riduce la distanza percepita tra sito e assistenza. I messaggi contestuali aggiungono un vantaggio operativo: quando l'utente scrive dalla pagina di un tour, il supporto riceve gia il contesto della richiesta e puo rispondere piu velocemente.",
        ),
        callout(
            "Il valore UX di WhatsApp H24 non e 'avere un bottone verde'. Il valore e dare all'utente un punto di riferimento immediato nei momenti di incertezza: disponibilita, punto d'incontro, ritardi, modifiche o dubbi logistici.",
            WHATSAPP,
        ),
        Spacer(1, 10),
        figure(
            geo_crop,
            "Screenshot 5 - Mobile e geolocalizzazione. La combinazione tra mobile, mappe e contatto rapido riduce la dipendenza da ricerche esterne durante il viaggio.",
            width=7.5 * cm,
            max_height=12.4 * cm,
        ),
        PageBreak(),
    ]

    story += [
        p("7. Back-office e UX Operativa", "h1"),
        p(
            "Una buona UX non riguarda solo il cliente finale. Nel turismo, la qualita percepita dipende anche da dati corretti, disponibilita aggiornate, pagamenti tracciati e comunicazioni puntuali. Per questo la Fase 1 include gia una base admin.",
        ),
        table(
            [
                ["Modulo", "Funzione", "Impatto operativo"],
                [
                    "Dashboard",
                    "KPI, prenotazioni, stato pagamenti e disponibilita.",
                    "Fornisce una lettura rapida della giornata e riduce il bisogno di fogli esterni.",
                ],
                [
                    "Tour e orari",
                    "Gestione contenuti, slot, capienza e prezzi.",
                    "Crea il punto di controllo per aggiornare l'offerta senza intervenire sul codice.",
                ],
                [
                    "Calendario",
                    "Vista operativa degli slot e delle prenotazioni.",
                    "Aiuta a prevenire sovrapposizioni e a preparare le guide.",
                ],
                [
                    "Pre-tour",
                    "Controllo reminder, link self-service e messaggio WhatsApp preparato.",
                    "Anticipa il modello anti-no-show e riduce lavoro manuale prima dell'evento.",
                ],
            ],
            [3.2 * cm, 6.0 * cm, 7.0 * cm],
        ),
        Spacer(1, 8),
        p(
            "La scelta di mantenere l'admin visivamente piu denso rispetto al sito pubblico e intenzionale: chi lavora nel back-office deve leggere stati, date e importi con rapidita. Qui il design deve essere silenzioso e affidabile.",
        ),
        PageBreak(),
    ]

    story += [
        p("8. Mobile-first, Accessibilita e Fiducia Digitale", "h1"),
        p(
            "Il progetto assume che una quota rilevante degli utenti arrivi da smartphone, spesso in condizioni non ideali: viaggio, strada, luce esterna, connessione variabile, tempo limitato. La UI risponde con touch target ampi, gerarchie semplici e azioni primarie sempre riconoscibili.",
        ),
        p("Principi applicati", "h2"),
        bullet("CTA primarie alte almeno 48px: piu facili da usare con una mano e meno soggette a errori."),
        bullet("Contrasto controllato: testo blu scuro su arancione, blu su bianco, bianco sulle superfici blu e corpo leggibile sul canvas chiaro."),
        bullet("Microcopy operativo: le etichette spiegano cosa succede dopo l'azione, non decorano l'interfaccia."),
        bullet("Riduzione del carico cognitivo: poche scelte principali per schermata e priorita visiva stabile."),
        Spacer(1, 8),
        figure(
            tour_mobile,
            "Screenshot 6 - Scheda tour mobile. La stessa informazione del desktop viene compressa in un percorso lineare, piu adatto alla consultazione in movimento.",
            width=7.3 * cm,
            max_height=12.4 * cm,
        ),
        PageBreak(),
    ]

    story += [
        p("9. SEO, GEO e Perimetro di Fase", "h1"),
        p(
            "La Fase 1 include elementi tecnici che rafforzano la fiducia digitale e la trovabilita: metadata per home, listing e schede tour, contenuti FAQ, coordinate, link Google Maps e struttura orientata alle ricerche in italiano.",
        ),
        p(
            "Queste scelte hanno una conseguenza UX diretta: l'utente arriva su pagine piu pertinenti, trova informazioni coerenti con la ricerca e ha meno bisogno di uscire dal sito per verificare dettagli essenziali.",
        ),
        table(
            [
                ["Gia in Fase 1", "Evoluzione naturale in Fase 2"],
                [
                    "Sito pubblico, catalogo e dettaglio tour; booking base; Stripe o payment link demo; email di conferma; calendario .ics; admin; calendario operativo; pre-tour; self-service tokenizzato; widget WhatsApp contestuale.",
                    "Master Inventory completo; reminder WhatsApp automatici via provider; affiliati e commissioni; parsing OTA; ERP con margini e payout guide; upselling post-tour automatizzato.",
                ],
            ],
            [8.1 * cm, 8.1 * cm],
        ),
        Spacer(1, 10),
        callout(
            "La Fase 1 va presentata come una base intenzionale: copre il percorso cliente e prepara i moduli necessari per scalare, senza promettere come completate le automazioni che appartengono alla fase successiva.",
            BLUE,
        ),
        p("Conclusione", "h1"),
        p(
            "La demo traduce strategia, brand e operativita in un'esperienza coerente. Ogni scelta ha una funzione: generare fiducia, guidare la conversione, chiarire i passaggi o ridurre lavoro manuale. Il risultato non e solo una veste grafica, ma una direzione di prodotto pronta a evolvere con inventory, automazioni, affiliazioni e reportistica.",
        ),
    ]

    return story


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    TMP_DIR.mkdir(parents=True, exist_ok=True)

    doc = SimpleDocTemplate(
        str(PDF_PATH),
        pagesize=A4,
        rightMargin=22 * mm,
        leftMargin=22 * mm,
        topMargin=20 * mm,
        bottomMargin=22 * mm,
        title="Analisi UI/UX - Buongiorno Praga",
        author="Diego Simoncini",
    )
    doc.build(build_story(), onFirstPage=cover, onLaterPages=footer)
    copyfile(PDF_PATH, PDF_ALIAS_PATH)
    print(PDF_PATH)


if __name__ == "__main__":
    main()
