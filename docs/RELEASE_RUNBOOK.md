# Age of Beast – Release- und Betriebsablauf

## Grundsatz

Ein lokaler Commit, eine lokale Browserprüfung oder ein grüner lokaler Test
veröffentlicht nichts. Die öffentliche GitHub-Pages-Version ändert sich erst
nach einem ausdrücklich freigegebenen Push auf `main` oder einem manuellen
Pages-Workflow-Lauf.

## Lokale Vorbereitung

~~~text
git status --short
Get-ChildItem -Recurse -File -Filter '*.js' | ForEach-Object { Get-Content $_.FullName -Raw | node --input-type=module --check }
Get-ChildItem werkzeuge -File -Filter '*.mjs' | ForEach-Object { node --check $_.FullName }
Get-ChildItem werkzeuge\pruefe-*.mjs | Sort-Object Name | ForEach-Object { node $_.FullName }
git diff --check
~~~

Für Runtime-, Server- oder CSS-Änderungen kommt die lokale Browsermatrix aus
`QA_MATRIX.md` hinzu. Für Daten- oder Speicheränderungen bleibt ein echter
GitHub-Schreibtest gesperrt, bis Token und Freigabe ausdrücklich vorliegen.

## CI und GitHub Pages

`qa.yml` läuft bei Pull Requests und manuell:

1. Checkout und Node 22.
2. Syntax aller Browser- und Werkzeugdateien.
3. JSON-Grundprüfung und alle lokalen Wächter nach dem Muster
   `werkzeuge/pruefe-*.mjs`.
4. Erzeugung einer temporären Browser-Artefaktkopie.
5. Versionierung und Prüfung des vollständigen Abhängigkeitsgraphen.

`qa.yml` besitzt keine Pages-Berechtigungen und veröffentlicht nie.

`pages.yml` nutzt dieselbe Prüfkette nur bei Push auf `main` oder manueller
Auslösung. Erst danach lädt er das geprüfte Artefakt hoch und stellt es bereit.
Die Cache-Versionierung verändert dabei nicht die Quelle: Sie versieht jede
veränderliche HTML-, JavaScript- und CSS-Abhängigkeit ausschließlich in der
Artefaktkopie mit der Ziel-SHA.

## Abnahme nach einer freigegebenen Veröffentlichung

1. Den Actions-Lauf für genau den Ziel-SHA als grün bestätigen.
2. Die Seite in einem frischen Browser-Kontext laden.
3. Die konkret geänderte Funktion ausführen, nicht nur die Startseite öffnen.
4. Die erwarteten SHA-Kennungen der geladenen Browser-Abhängigkeiten prüfen.
5. Ergebnis, SHA und geprüften Pfad im passenden Changelog festhalten.

## Rücksprung

v2.7.0 ist der bekannte veröffentlichte Release-Anker. Bei einem fehlerhaften
freigegebenen Paket wird kein paralleler Schnellfix veröffentlicht. Stattdessen
wird ein klarer Revert-Commit auf Grundlage des betroffenen Pakets vorbereitet
und wieder durch alle Gates geführt. Ein Git-Reset oder eine Überschreibung der
gemeinsamen Historie ist dafür nicht nötig.

## Lokale Server

- Der Vorschau-Server bindet ausschließlich an `127.0.0.1` und liefert nur
  eine feste Freigabeliste aus.
- Der Heim-Server ist der bewusste Weg für NetBird; `--alle` bleibt eine
  sichtbare, ausdrückliche Ausnahme und nutzt dieselbe Freigabeliste.
- Beide Server geben nur die erlaubten Browser-, Runtime-, Style-, Daten- und
  SVG-Dateien aus. Versteckte Projektdateien, `.env`, Credentials, Traversal
  und unbekannte `styles/`-Pfade bleiben gesperrt.

Die Pakete A–H sind lokal umgesetzt und automatisiert geprüft. Dieser Status
ist keine Veröffentlichung und ersetzt weder einen Actions- noch einen
Live-Pages-Nachweis.
