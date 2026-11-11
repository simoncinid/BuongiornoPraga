from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "output" / "pdf" / "Analisi_UIUX_FreeTourPraga_fine.docx"
TEMP = SOURCE.with_suffix(".updated.docx")

REPLACEMENTS = {
    b"0F172A": b"1268D6",
    b"1E293B": b"0A56B2",
    b"F59E0B": b"FF8A00",
    b"D97706": b"E87500",
    b"FCD34D": b"FFC46B",
    b"F8FAFC": b"F4F9FF",
    b"F1F5F9": b"EAF4FC",
    b"E2E8F0": b"D8E6F2",
    b"CBD5E1": b"C4D9E9",
    b"94A3B8": b"91A8BA",
    b"0EA5E9": b"168AF4",
    b"0369A1": b"0A56B2",
    b"111827": b"14324B",
    b"334155": b"48657D",
    b"64748B": b"627C91",
    "Navy Night".encode(): "Vltava Blue".encode(),
    "Golden Amber".encode(): "Prague Orange".encode(),
    "Slate Light".encode(): "Sky Canvas".encode(),
    "Header, footer, sezioni trust".encode(): "Navbar, footer, sezioni trust".encode(),
    b">Header<": b">Navbar bianca<",
    "Comunica stabilità, affidabilità e controllo".encode(): "Comunica fiducia con un tono più vivo".encode(),
    "Call to action e conversione".encode(): "CTA e conversione".encode(),
    "Usato solo per l'azione, evita di disperdere l'attenzione dell'utente".encode(): "Riservato alle azioni, concentra l'attenzione dell'utente".encode(),
    "Sfondo pagina e sezioni informative".encode(): "Navbar bianca, sfondo e sezioni informative".encode(),
    "Mantiene leggibilità e riduce il carico visivo".encode(): "Aumenta luminosità e leggibilità".encode(),
    "9 luglio 2026".encode(): "22 luglio 2026".encode(),
}


def main():
    if not SOURCE.exists():
        raise FileNotFoundError(SOURCE)

    with ZipFile(SOURCE, "r") as source_zip, ZipFile(TEMP, "w", ZIP_DEFLATED) as target_zip:
        for item in source_zip.infolist():
            data = source_zip.read(item.filename)
            if item.filename.endswith((".xml", ".rels")):
                for old, new in REPLACEMENTS.items():
                    data = data.replace(old, new)
            target_zip.writestr(item, data)

    TEMP.replace(SOURCE)
    print(SOURCE)


if __name__ == "__main__":
    main()
