# Upgrade-Analyse: Age of Beast ab v2.7.0

## Auftrag

Die umfangreiche Übernahme von Daggerheart-Werkstatt, Regelwiki,
Kampagnenrahmen-Assistent und lokalen Kartenwappen soll nicht als lose
Ansammlung von Dateien weiterwachsen. Diese Analyse schafft die technische
Landkarte und eine sichere Reihenfolge für künftige Upgrades, ohne die
veröffentlichte Seite oder die kanonischen Weltdaten zu verändern.

## Ausgangsstand

- Repository: `Kimpaliz/age-of-beast`
- Basiscommit: `815a808c29375a5e4597b9fb64bb2742193807e5` (`v2.7.0`)
- Standardbranch: `main`; lokaler Integrationsbranch:
  `codex/age-of-beast-upgrade-structure`
- Remote und lokaler `main` waren beim Start synchron.
- Der sichtbare Ausbau umfasst v2.3.0 bis v2.7.0:
  Werkstattmodul, Regelwiki, Kampagnenrahmen-Assistent, eigenständige
  Bearbeitungsseite ohne Google und 234 eigene SVG-Kartenwappen.

## Fester Schnitt

Die drei Leseflächen berühren keine Dateien und können parallel laufen:

| Paket | Eigentümer | Untersuchungsfläche | Ergebnis |
| --- | --- | --- | --- |
| A | Release- und Laufzeitkarte | `index.html`, `wiki.js`, `stil.css`, `bearbeiten.js`, die vier UI-Module, Git-Historie v2.2.0..v2.7.0 | Modulkarte, tatsächliche Abhängigkeiten, Upgrade-Grenzen |
| B | Daten- und GitHub-Backend | `daten/`, `werkzeuge/welt-*.mjs`, `werkzeuge/github-speicher.mjs`, Prüfungen zum Datenpfad | Kanonischer Datenvertrag, Speichertransaktion, Sicherheits- und Migrationsrisiken |
| C | Delivery, Qualität und Betrieb | `.github/workflows/pages.yml`, alle Prüfwerkzeuge, lokale Server, README/Changelogs | Prüfpyramide, Releasekette, Betriebs- und Performancegrenzen |

Kein Paket editiert oder committet Dateien. Daraus entstehen keine
Zusammenführungskonflikte. Der Hauptagent integriert die Befunde anschließend
allein in die Architektur- und Roadmap-Dokumente.

## Zielartefakte der Integration

1. `docs/ARCHITEKTUR.md`: verständliche Systemkarte mit Datenfluss,
   Zuständigkeiten und harten Grenzen.
2. `docs/DATENVERTRAG.md`: eine Quelle, abgeleitete Anzeigen, GitHub-Speichern,
   Konfliktpfad und Erweiterungspunkte.
3. `docs/UPGRADE_ROADMAP.md`: sequenzierte, testbare Upgrade-Pakete, jeweils
   mit abhängigen Dateien, Prüfgates und Rollback-Punkt.
4. `docs/INVENTAR.md`: aktueller Dateibestand und Zuordnung zu den Modulen.
5. Ein minimaler `README`-Verweis auf die neue technische Landkarte.

Die Zielartefakte strukturieren den Bestand zunächst dokumentarisch. Eine
nachfolgende Code-Migration beginnt erst nach Janniks Auswahl eines
Roadmap-Pakets, damit das laufende Wiki nicht durch einen Großumbau gefährdet
wird.

## Nachweisregeln

- Jede Architekturbehauptung nennt konkrete Dateien und, wenn sie Bestand oder
  Größe beschreibt, einen reproduzierbaren Befehl.
- Die Analyse benutzt weder Pegasus noch fremde Regelquellen.
- GitHub wird nur lesend geprüft; es gibt keinen Push, keinen Pages-Deploy und
  keine Datenänderung.
