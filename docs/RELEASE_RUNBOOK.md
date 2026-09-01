# Age of Beast – Release- und Betriebsablauf

## Grundsatz

Ein lokaler Commit oder ein grüner lokaler Test veröffentlicht nichts. Die
öffentliche GitHub-Pages-Version ändert sich erst nach einem ausdrücklich
freigegebenen Push auf main oder einem manuellen Workflow-Lauf.

## Lokale Vorbereitung

~~~text
git status --short
node --check wiki.js
node --check daten/welt.js
node werkzeuge/pruefe-gleichstand.mjs
node werkzeuge/pruefe-schreibweise.mjs
node werkzeuge/pruefe-bearbeiten.mjs
node werkzeuge/pruefe-struktur.mjs
node werkzeuge/pruefe-github.mjs
node werkzeuge/pruefe-server-sicherheit.mjs
git diff --check
~~~

Vor einem Datenpaket kommt zusätzlich der künftige Datenvertragstest hinzu.
Vor einem Runtime-, Server- oder CSS-Paket kommen die in QA_MATRIX.md
genannten Paket-Gates dazu.

## CI und GitHub Pages

Der bestehende Workflow läuft bei Push auf main oder manuell:

1. Checkout und Node 22.
2. Syntax- und JSON-Prüfungen.
3. Sechs Daten-, Bearbeitungs- und Serverprüfungen.
4. Erzeugung eines Pages-Artefakts.
5. Cache-Versionierung im Artefakt.
6. Upload und Bereitstellung auf GitHub Pages.

Die Cache-Versionierung verändert nur die hochgeladene Kopie von index.html.
Die Quelldatei bleibt unverändert. Der aktuelle Workflow versieht vier direkte
Startressourcen mit einer SHA-Kennung; bei neuen Browser-Abhängigkeiten muss
das Cache-Gate vorher erweitert werden.

## Abnahme nach einer freigegebenen Veröffentlichung

1. Den Actions-Lauf für genau den Ziel-SHA als grün bestätigen.
2. Die Seite in einem frischen Browser-Kontext laden.
3. Die geänderte Funktion selbst ausführen, nicht nur die Startseite öffnen.
4. Bei Browser-Modulen und Bildern prüfen, dass die erwartete SHA-Kennung
   geladen wird.
5. Ergebnis, SHA und überprüften Pfad im passenden Changelog festhalten.

## Rücksprung

v2.7.0 ist der bekannte Release-Anker. Bei einem fehlerhaften freigegebenen
Paket wird kein paralleler Schnellfix veröffentlicht. Stattdessen wird ein
klarer Revert-Commit auf Grundlage des betroffenen Pakets vorbereitet und
wieder durch alle Gates geführt. Ein Git-Reset oder eine Überschreibung der
gemeinsamen Historie ist dafür nicht nötig.

## Lokale Server

- Der Vorschau-Server bindet ausschließlich an 127.0.0.1 und liefert nur
  eine feste Freigabeliste aus.
- Der Heim-Server ist der bewusste Weg für den NetBird-Zugriff; --alle bleibt
  eine sichtbare, ausdrückliche Ausnahme und nutzt dieselbe Freigabeliste.
- Kein Server liefert versteckte Projektdateien, .env-Dateien, lokale
  Credential-Dateien oder andere nicht veröffentlichte Repository-Dateien.

Paket A ist lokal umgesetzt und durch pruefe-server-sicherheit.mjs abgesichert.
Es ist damit noch nicht veröffentlicht.
