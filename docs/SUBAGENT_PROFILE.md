# Subagenten-Profil: Age of Beast

> ## ⚠️ Nachtrag vom 04.09.2026 — ersetzt durch `.claude/PROJEKTPROFIL.md`
>
> Dieses Profil bleibt als Beleg stehen; **maßgeblich ist seit der
> Alpha-Code-Einrichtung `.claude/PROJEKTPROFIL.md`**. Vier Angaben hier
> sind überholt:
>
> | Steht unten | Gemessen am 04.09.2026 |
> | --- | --- |
> | „Arbeitsbranch-Schema `codex/<thema>`" | **`<system>/<kurz>`** aus der Systemtabelle in [REGELN.md](REGELN.md), Regel 2 |
> | „Wächtertests … derzeit zwölf Dateien" | **fünfzehn** vor der Einrichtung, seither mehr (`ls werkzeuge/pruefe-*.mjs \| wc -l`) |
> | „Die Reader-Reihenfolge lautet `daten/welt.js` → `datenindex` → …" | **`runtime/symbole.js` fehlt.** Es sind fünf `runtime/`-Dateien, und `symbole.js` wird als erste geladen (`grep -n 'runtime/' index.html`) |
> | „Der GitHub-Speicherweg ist ein browserseitiger Git-Data-API-Client" · „Der Fine-grained-Token … nur sitzungsweise im Browser" | **Es gibt keinen Token mehr.** Gespeichert wird nach Firestore; `github-speicher.mjs` bleibt als Rückweg liegen, kein Browserpfad führt dorthin |
>
> **Was unverändert gilt und weiterhin wichtig ist:** kein Paketmanager ·
> nur die beauftragte Fläche ändern · Daten nur in `daten/quelle.json` ·
> jede Bestandsbehauptung nennt den Rohbefehl · `welt-holen.mjs
> --wirklich` bleibt außerhalb jedes Auftrags · keine fremden
> Illustrationen · nicht deployen, nicht pushen ohne Janniks Ja.

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
