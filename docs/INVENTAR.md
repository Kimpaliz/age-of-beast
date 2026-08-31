# Age of Beast – Projektinventar

**Referenzstand:** Git-Tag v2.7.0, Commit 815a808c29375a5e4597b9fb64bb2742193807e5
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
| Leseruntime | wiki.js | Routing, Navigation, Suche, Rendering, Vorschau, Theme und öffentliche Kompatibilitätsfassade |
| Bearbeitung | bearbeiten.js | Anmeldung, geladener Rohstand, Speichern und gemeinsamer Bearbeitungskontext |
| Textoberfläche | texte-bearbeiten.js | Bearbeiten der Textfelder |
| Strukturoberfläche | struktur-bedienung.js | Abschnitte, Steckbriefzeilen, Reihenfolge |
| Rahmen-Assistent | rahmen-assistent.js | Asynchroner Kampagnenrahmen-Editor |
| Darstellung | stil.css | Design-Tokens, Layout, Leser-, Bearbeitungs-, Werkstatt- und Assistentenflächen |
| Kanonische Daten | daten/quelle.json | Einzige bearbeitbare Weltquelle |
| Abgeleitete Daten | daten/welt.json, daten/welt.js | Deterministische Anzeigeformate |
| Assistenten-Descriptor | daten/rahmen-felder.json | UI-Felder und Schritte, nicht Teil der Weltquelle |
| Lokale Wappen | daten/kartenbilder | 234 selbst erzeugte SVG-Dateien |
| Transformation und Tests | werkzeuge | Aufbereitung, GitHub-Speicher, lokale Server und Prüfscripts |
| Auslieferung | .github/workflows/pages.yml | Syntax, Datenprüfungen, Cache-Artefakt und GitHub Pages |

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
