# Age of Beast – Architekturkarte

**Ist-Stand:** v2.7.0
**Ziel dieser Karte:** Die bestehende Anwendung verständlich teilen, ohne ihre
Laufzeit jetzt durch eine Komplett-Neuschreibung zu gefährden.

## Start- und Laufzeitpfad

~~~text
index.html
 ├─ daten/welt.js
 │   └─ window.AGE_OF_BEAST_WELT
 ├─ wiki.js
 │   ├─ Indizes aus WELT
 │   ├─ Hash-Routing, Rendering, Suche, Vorschau und Theme
 │   └─ window.ageOfBeast
 │       ├─ weltSetzen()
 │       ├─ weltHolen()
 │       └─ beiNeuZeichnen()
 └─ bearbeiten.js als ES-Modul
     ├─ GitHub- und Datentransformation
     ├─ texte-bearbeiten.js
     ├─ struktur-bedienung.js
     └─ rahmen-assistent.js
         └─ registriert den Rahmen-Renderer
~~~

Die Leseruntime wird zuerst ausgeführt. Der Bearbeitungsmodus ergänzt sie
anschließend. Das macht die Wiki-Seite ohne Anmeldung klein und direkt
lesbar, erzeugt aber heute mehrere implizite Verträge.

## Bestehende Verträge

| Vertrag | Wer stellt ihn bereit | Wer nutzt ihn | Upgrade-Regel |
| --- | --- | --- | --- |
| window.AGE_OF_BEAST_WELT | daten/welt.js | wiki.js | Dateiname und globaler Name bleiben bis zur kontrollierten Modulmigration stabil. |
| window.ageOfBeast | wiki.js | bearbeiten.js und Rahmen-Assistent | Öffentliche Fassade zuerst initialisieren, erst danach die erste Route zeichnen. |
| Statische DOM-Anker | index.html | wiki.js und Bearbeitung | #inhalt, #navigation, #rahmen, #vorschau und Kopf-Elemente nur mit begleitendem Test ändern. |
| Gerendertes Datenattribut-Markup | wiki.js | Text- und Strukturbearbeitung | data-eintrag, data-feld, data-abschnitt, data-panel und data-zeile sind ein expliziter UI-Vertrag. |
| Nach-Render-Rückrufe | wiki.js | Bearbeitungsmodule | Jeder Renderer muss idempotent sein; Listener dürfen sich nicht verdoppeln. |
| Bearbeitungskontext | bearbeiten.js | Drei Bearbeitungsmodule | Rohstand, Änderung, Neuzeichnen und Fehlerbehandlung werden schrittweise als klare Schnittstelle geführt. |

## Wichtigste technische Risiken

| Priorität | Befund | Sichere erste Reaktion |
| --- | --- | --- |
| P1 | Ein frischer Direktaufruf von #/rahmen/<id> kann vor der Initialisierung der öffentlichen Fassade auf den Rahmen-Renderer zugreifen. | Fassade vor dem ersten Render erzeugen und Deep Links automatisiert prüfen. |
| P2 | Der asynchrone Rahmen-Assistent kann eine inzwischen andere Route überschreiben. | Render-Generation oder Abbruchsignal einführen. |
| P2 | Freischalten während einer offenen Rahmenroute zeichnet nicht zwingend erneut. | Registrierung des Renderers und Neuzeichnen als einen kontrollierten Ablauf behandeln. |
| P2 | Bearbeitung hängt zugleich an Globals, DOM-Attributen und einem Custom Event. | Kontext und Markup-Vertrag vor einer Aufspaltung explizit dokumentieren und testen. |
| P3 | Einige alte Einbettungs-Selektoren in stil.css sind unbenutzt. | Erst nach visueller Regressionstestung entfernen. |

## Zielbild für die schrittweise Modulgrenze

Dies ist eine **geplante** Struktur, keine bereits vorgenommene Verschiebung:

~~~text
web/
  bootstrap.js        Einstieg und Kompatibilitätsfassade
  runtime/
    datenindex.js     Indizes und Suchdaten
    routing.js        Hash-Route und Render-Generation
    ansichten.js      Start-, Kategorie-, Eintrags- und Werkstattansichten
    interaktion.js    Suche, Vorschau, Theme und Leiste
  bearbeiten/
    kontext.js        Bearbeitungskontext und kontrollierte Aktualisierung
    text.js           Textbedienung
    struktur.js       Strukturbedienung
    rahmen.js         Rahmen-Assistent
  styles/
    tokens.css
    wiki.css
    bearbeiten.css
    werkstatt.css
~~~

Der erste Schritt führt keine neue Verzeichnisstruktur erzwungen ein. Er
zieht nur schmale, testbare Grenzen innerhalb der bestehenden Dateien. Die
Fassade window.ageOfBeast bleibt dabei vorübergehend erhalten, damit
Bearbeitung und bestehende Links nicht brechen.

## Regeln für eine sichere Runtime-Migration

1. Pro Paket genau eine Verantwortungsgrenze verschieben.
2. Vor jedem Verschieben die vorhandenen DOM-Attribute als Vertragstest
   festhalten.
3. Hash-Routen immer als normale Navigation **und** als harter Seitenaufruf
   prüfen.
4. Asynchrone Ansichten erhalten eine aktuelle Render-Kennung; ein alter
   Ladevorgang darf keine neue Route überschreiben.
5. Weltformat und GitHub-Speicher bleiben bei reinen UI-Paketen unverändert.
6. Erst nach grüner Runtime- und Bearbeitungsabnahme CSS nach Features
   trennen.

Die konkrete Reihenfolge, Dateien und Abnahmekriterien stehen in
UPGRADE_ROADMAP.md.
