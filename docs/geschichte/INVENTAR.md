# Age of Beast – Projektinventar

> ## ⚠️ Nachtrag vom 04.09.2026 — drei Angaben sind überholt
>
> **Die Zahlen im Abschnitt „Inhaltlicher Datenstand" stimmen alle** —
> nachgezählt: 57 Roh-Einträge, 58 angezeigte, 7 Kategorien, 347
> Abschnitte, 72 Wörterbuch-Verweise, 234 SVG, Rohdatenversion 42.
> Überholt ist der Rahmen darum:
>
> | Steht unten | Gemessen am 04.09.2026 | Befehl |
> | --- | --- | --- |
> | „Veröffentlichter Referenzstand: v2.7.0" und „Pakete A–H … noch nicht veröffentlicht" | **v2.7.0 ist zwar das neueste Etikett, aber nicht der veröffentlichte Stand.** Die Live-Seite steht auf `cde2533`, **25 Commits** danach; `main` und `origin/main` sind gleich | `git tag --sort=-v:refname \| head -1` · `git log --oneline v2.7.0..HEAD \| wc -l` |
> | „Der angemeldete Bearbeitungsmodus schreibt … über die GitHub-Git-Data-API" | **Firestore** (Fassung 3.0.0, Commit `56ec0ee`). Siehe [DATENVERTRAG.md](../DATENVERTRAG.md), Nachtrag | `grep -n firestore-speicher bearbeiten.js` |
> | „`werkzeuge` … zwölf Prüfscripts" | **fünfzehn** vor der Alpha-Code-Einrichtung; seither mehr | `ls werkzeuge/pruefe-*.mjs \| wc -l` |
>
> Nicht mehr vollständig sind außerdem die **Schichten**: `runtime/`
> hat fünf Dateien (`symbole.js` fehlt unten), `styles/` ebenfalls
> (`kategorien.css` fehlt), und dazugekommen sind die
> Firestore-Anbindung (`firebase-konfig.js`, `firestore.rules`,
> `werkzeuge/firestore-*.mjs`) sowie die Weltkarte (`karte/`).
> Die vollständige Systemtabelle steht in
> [WEGWEISER.md](../WEGWEISER.md) und [REGELN.md](../REGELN.md).

**Veröffentlichter Referenzstand:** Git-Tag v2.7.0, Commit 815a808c29375a5e4597b9fb64bb2742193807e5
**Lokaler Ausbau:** Pakete A–H sind zusätzlich umgesetzt und geprüft, aber
noch nicht veröffentlicht.
**Erfasst am:** 1. September 2026
**Zweck:** Diese Karte beschreibt den Ist-Zustand. Sie ist kein Auftrag, Dateien
blind umzubauen.

## Was das Projekt ist

Age of Beast ist ein statisches Daggerheart-Weltwiki. Es benötigt zum Lesen
keinen Build-Schritt und keinen Server: index.html lädt die angezeigten Daten
aus daten/welt.js. Der angemeldete Bearbeitungsmodus schreibt die kanonische
Quelle über die GitHub-Git-Data-API zurück in das Repository.

## Schichten und Eigentümer

| Schicht | Verantwortliche Dateien | Aufgabe |
| --- | --- | --- |
| Einstieg | index.html | Statische DOM-Anker und feste Lade-Reihenfolge |
| Leseruntime | runtime/datenindex.js, ansichten.js, interaktion.js, routing.js; wiki.js | Indizes, Ansichten, Interaktion, Routing; `wiki.js` ist Bootstrap und öffentliche Kompatibilitätsfassade |
| Bearbeitung | bearbeiten.js, bearbeiten-kontext.js | Anmeldung, geladener Rohstand, Speichern und eingefrorener Bearbeitungskontext |
| Textoberfläche | texte-bearbeiten.js | Bearbeiten der Textfelder |
| Strukturoberfläche | struktur-bedienung.js | Abschnitte, Steckbriefzeilen, Reihenfolge |
| Rahmen-Assistent | rahmen-assistent.js | Asynchroner Kampagnenrahmen-Editor |
| Darstellung | stil.css; styles/ | Importfassade sowie getrennte Tokens, Wiki-, Bearbeitungs- und Werkstatt-/Rahmen-Stile |
| Kanonische Daten | daten/quelle.json | Einzige bearbeitbare Weltquelle |
| Abgeleitete Daten | daten/welt.json, daten/welt.js | Deterministische Anzeigeformate |
| Assistenten-Descriptor | daten/rahmen-felder.json | UI-Felder und Schritte, nicht Teil der Weltquelle |
| Lokale Wappen | daten/kartenbilder | 234 selbst erzeugte SVG-Dateien |
| Transformation und Tests | werkzeuge | Aufbereitung, GitHub-Speicher, lokale Server und zwölf Prüfscripts |
| Qualitätssicherung | .github/workflows/qa.yml | Pull-Request-/manuelle Prüfung ohne Deployment |
| Auslieferung | .github/workflows/pages.yml | Syntax, alle Wächter, Cache-Artefakt und GitHub Pages auf main |

## Inhaltlicher Datenstand

| Kennzahl | Wert |
| --- | ---: |
| Roh-Einträge in quelle.json | 57 |
| Angezeigte Wiki-Einträge | 58 |
| Kategorien | 7 |
| Abschnitte | 347 |
| Wörterbuch-Verweise | 72 |
| Lokale SVG-Wappen | 234 |
| Rohdatenversion | 42 |

Der zusätzliche angezeigte Eintrag entsteht aus einem Kampagnenrahmen. Er wird
aus der Quelle abgeleitet und ist kein zweiter unabhängig zu pflegender
Datensatz.

## Was zwischen v2.2.0 und v2.7.0 hinzugekommen ist

| Version | Erweiterung | Vor allem betroffen |
| --- | --- | --- |
| v2.3.0 | Werkstatt als eigenes Modul, Layout und Cache-Behandlung | wiki.js, stil.css |
| v2.4.0 | Regelwiki-Farbkontext | stil.css |
| v2.5.0 | Kampagnenrahmen-Assistent | rahmen-assistent.js, Daten und Werkzeuge |
| v2.6.0 | Werkstatt als lokale Seite statt Einbettung | index.html, wiki.js, stil.css |
| v2.7.0 | Lokale Kartenwappen | daten/kartenbilder, wiki.js, stil.css |

Die Differenz v2.2.0 bis v2.7.0 umfasst 254 Dateien, 22.412 Einfügungen und
567 Löschungen. Der größte fachliche Zuwachs liegt damit nicht nur im
Erscheinungsbild, sondern auch in Datenaufbereitung, Bearbeitung und Betrieb.

## Unverrückbare Grenzen vor einem Upgrade

1. Nur daten/quelle.json ist kanonisch. daten/welt.json und daten/welt.js
   niemals direkt ändern.
2. Ein Speichern aus dem Browser erzeugt Quelle und beide Ableitungen
   gemeinsam. Diese Dreiergruppe darf nicht auseinanderlaufen.
3. Keine Schlüssel, Zugangsdaten oder lokale Geheimdateien in Dokumentation,
   Tests oder Commits aufnehmen.
4. Ein Upgrade arbeitet auf einem Branch oder Worktree und wird erst nach
   vollständigen lokalen Gates nach main übernommen.
5. GitHub Pages wird nur nach einer ausdrücklichen Freigabe veröffentlicht.

Die genaue technische Architektur steht in ARCHITEKTUR.md, die Datenregeln in
DATENVERTRAG.md und der nächste sichere Arbeitsweg in UPGRADE_ROADMAP.md.
