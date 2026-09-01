# Subagenten-Profil: Age of Beast

| Feld | Wert |
| --- | --- |
| Standardbranch | `main` |
| Arbeitsbranch-Schema | `codex/<thema>` |
| Architektur | statisches HTML/CSS/JavaScript; klassische `runtime/`-Skripte plus wenige Bearbeitungs-ES-Module |
| Paketmanager | keiner; Node 22 nur für Werkzeuge und Prüfungen. Kein unnötiger npm- oder pnpm-Umbau. |
| Syntax | alle Browser-`.js` als temporäre ES-Module prüfen; alle `werkzeuge/*.mjs` mit `node --check` prüfen |
| Wächtertests | jedes `werkzeuge/pruefe-*.mjs`, derzeit zwölf Dateien |
| Deploy | nur `pages.yml` auf `main` oder manuell; Subagenten und Arbeitsbranches deployen oder pushen nie |
| Abnahme | lokale Wächter, lokaler Browser-Smoke, danach bei Freigabe Actions für Ziel-SHA und frischer Live-Check |

## Konventionen

- Deutsche UI- und Dokumentationstexte verwenden korrekt ä, ö, ü und ß.
  Dateinamen und bestehende technische Bezeichner bleiben unverändert.
- Nur die beauftragte Fläche ändern. Kein kreativer Nebenumbau, keine
  Umformatierung fremder Dateien und keine Löschung ohne belegten
  Migrationsnachweis.
- Daten nur in `daten/quelle.json` bearbeiten. `daten/welt.json` und
  `daten/welt.js` sind abgeleitet und werden ausschließlich gemeinsam erzeugt
  beziehungsweise gespeichert.
- Jede Bestands- oder Größenbehauptung nennt den Rohbefehl und die gezählte
  Zahl.
- Commits bleiben lokal, bis Jannik einen Push ausdrücklich freigibt.
  Commit-Betreff auf Deutsch und klar beschreibend.

## Runtime- und Servergrenzen

- Die Reader-Reihenfolge lautet `daten/welt.js` → `runtime/datenindex.js` →
  `runtime/ansichten.js` → `runtime/interaktion.js` → `runtime/routing.js` →
  `wiki.js`. Die Fassade `window.ageOfBeast` muss vor dem ersten Render
  bestehen.
- `data-eintrag`, `data-feld`, `data-abschnitt`, `data-panel` und `data-zeile`
  sind Verträge der Bearbeitungsoberfläche. Änderungen brauchen passende
  Runtimetests.
- `stil.css` ist nur die Importfassade für die vier Dateien in `styles/`.
  Neue Browser-Abhängigkeiten müssen im Cache-Graphen und in der expliziten
  Server-Freigabe erscheinen.
- Vorschau- und Heim-Server geben ausschließlich explizit erlaubte Dateien
  aus. Keine neue Route pauschal freigeben und keinen geheimen Pfad testen,
  indem dessen Inhalt ausgegeben wird.

## Stille Fallen

- Der GitHub-Speicherweg ist ein browserseitiger Git-Data-API-Client.
  Blob-SHAs müssen vor dem Speichern gegen den gelesenen Head geprüft werden;
  ein Konflikt darf nie durch Überschreiben oder Force-Push gelöst werden.
- Ein Bearbeitungsvorgang schreibt `daten/quelle.json`, `daten/welt.json` und
  `daten/welt.js` zusammen. Nur eine davon zu ändern erzeugt einen scheinbar
  funktionierenden, aber inkonsistenten Stand.
- `werkzeuge/welt-holen.mjs --wirklich` kann die kanonische GitHub-Quelle
  überschreiben. Er bleibt außerhalb aller Upgrade-Schritte.
- Das Pages-Deployment schreibt Versionskennzeichen nur in die hochgeladene
  Artefaktkopie. Lokale Prüfungen dürfen daraus keine Quelltextänderungen
  ableiten.
- Der Fine-grained-Token gehört nie in Repository, Changelog, Testausgabe oder
  Subagentenauftrag. Er wird nur sitzungsweise im Browser gehalten.
- Kartenbilder sind lokale SVG-Wappen. Keine fremden Illustrationen, Hotlinks
  oder nicht geklärten Lizenzen ergänzen.

## Was Agenten nicht tun

Nicht deployen, nicht pushen, keine Tokens lesen oder ausgeben, keine
Weltdaten ohne Auftrag verändern, `daten/welt.json` oder `daten/welt.js` nicht
direkt bearbeiten und `werkzeuge/welt-holen.mjs` nicht ausführen.
