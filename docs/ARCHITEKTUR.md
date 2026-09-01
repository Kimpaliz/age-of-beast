# Age of Beast – Architekturkarte

**Ist-Stand:** lokaler Upgrade-Stand nach den Paketen A–H. Er ist geprüft,
aber noch nicht veröffentlicht.

## Start- und Laufzeitpfad

~~~text
index.html
 ├─ stil.css
 │   └─ styles/tokens.css, wiki.css, bearbeiten.css, werkstatt.css
 ├─ daten/welt.js
 │   └─ window.AGE_OF_BEAST_WELT
 ├─ runtime/datenindex.js
 │   └─ Indizes, Volltextsuche, Verweise und Referenzen
 ├─ runtime/ansichten.js
 │   └─ Start-, Kategorie-, Eintrags- und Werkstattansichten
 ├─ runtime/interaktion.js
 │   └─ Suche, Vorschau, Theme, Leiste und Filter
 ├─ runtime/routing.js
 │   └─ Hash-Routen, Render-Generation und öffentliche Fassade
 ├─ wiki.js
 │   └─ prüft die Bausteine, setzt window.ageOfBeast vor dem ersten Render
 └─ bearbeiten.js als ES-Modul
     ├─ GitHub-Speicher und Sitzungsschlüssel
     ├─ bearbeiten-kontext.js
     ├─ texte-bearbeiten.js
     ├─ struktur-bedienung.js
     └─ rahmen-assistent.js
         └─ registriert den Rahmen-Renderer
~~~

Die vier Reader-Dateien sind klassische Skripte in fester Reihenfolge, keine
neuen Browser-ES-Module. Dadurch bleibt der Lesemodus ohne Build-Schritt
startfähig. `wiki.js` hält die alte, bewusst kleine globale Schnittstelle
stabil, während die Zuständigkeiten intern getrennt sind.

## Öffentliche und interne Verträge

| Vertrag | Wer stellt ihn bereit | Wer nutzt ihn | Schutz |
| --- | --- | --- | --- |
| `window.AGE_OF_BEAST_WELT` | `daten/welt.js` | `runtime/datenindex.js` | Dateiname und Global bleiben stabil. |
| `window.__aobLeserBausteine` | vier `runtime/`-Dateien | `wiki.js` | Interner Bootstrap-Container; nicht für Bearbeitungsmodule bestimmt. |
| `window.ageOfBeast` | `runtime/routing.js` über `wiki.js` | Bearbeitung und Rahmen-Assistent | `weltSetzen`, `weltHolen`, `beiNeuZeichnen`, `rahmenRendererRegistrieren` und `rahmenZeichnen` bleiben vor dem ersten Render verfügbar. |
| Statische DOM-Anker | `index.html` | Runtime und Bearbeitung | `#inhalt`, `#navigation`, `#rahmen`, `#vorschau` und die Kopf-Elemente nur mit begleitenden Tests ändern. |
| Gerendertes Datenattribut-Markup | `runtime/ansichten.js` | Text- und Strukturbearbeitung | `data-eintrag`, `data-feld`, `data-abschnitt`, `data-panel` und `data-zeile` sind ein UI-Vertrag. |
| Bearbeitungskontext | `bearbeiten-kontext.js` | drei Bearbeitungsmodule | Eingefrorene Rückrufe für Rohstand, Schreiben, Neuzeichnen, Meldung und aktuellen Runtime-Zugriff. |

## Sicherheits- und Betriebsgrenzen

- Die Vorschau bindet ausschließlich an `127.0.0.1`; der Heim-Server bleibt
  im NetBird-Modus, `--alle` ist eine sichtbare Ausnahme.
- Beide Server liefern nur eine explizite Dateiliste, die vier Styles, die
  vier Runtime-Dateien und lokale Karten-SVGs. Vertrauliche, versteckte,
  ausbrechende und unbekannte Stilpfade bleiben gesperrt.
- Der Browser-Speicheradapter akzeptiert bei einer Weltänderung ausschließlich
  `daten/quelle.json`, `daten/welt.json` und `daten/welt.js`; der finale
  Branch-Ref wird nie erzwungen aktualisiert.
- Ein Fine-grained-Token liegt nur in `sessionStorage`. Er wird beim Start aus
  einer möglichen alten dauerhaften Ablage entfernt und ist nach Ende der
  Browser-Sitzung nicht mehr verfügbar.
- `qa.yml` prüft Pull Requests und manuelle QA ohne Deployment. Nur
  `pages.yml` auf `main` kann ein Pages-Artefakt hochladen.

## Testbare Runtime-Regeln

1. Die Fassade ist vor dem ersten Schreiben nach `#inhalt` gesetzt.
2. Jede Route erhält eine Generation. Ein später Rahmen-Renderer darf eine
   inzwischen andere Route nicht überschreiben.
3. Interaktions-Listener werden genau einmal installiert; ein Hashwechsel
   verdoppelt weder Suche noch Theme, Leiste oder Vorschau.
4. Die Vorschau behält die bewährten Verzögerungen und bleibt beim Übergang in
   `#vorschau` offen, bis die Route wechselt, der Fokus wechselt oder sie
   ausdrücklich verborgen wird.
5. `weltSetzen()` baut Indizes, Kopf, Navigation und aktuelle Seite neu auf;
   mit `stelleHalten` wird die frühere Scroll-Höhe wiederhergestellt.
6. Die CSS-Fassade importiert ausschließlich die vier Feature-Dateien. Die
   Stilstrukturprüfung stellt sicher, dass deren Gesamtinhalt dem bisherigen
   Monolithen entspricht.

Die ausführbaren Nachweise stehen in `docs/QA_MATRIX.md`; die Paket-Historie
und die noch fehlende Live-Abnahme stehen in `docs/UPGRADE_ROADMAP.md`.
