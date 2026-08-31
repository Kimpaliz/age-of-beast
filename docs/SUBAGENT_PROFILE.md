# Subagenten-Profil: Age of Beast

| Feld | Wert |
| --- | --- |
| Standardbranch | `main` |
| Arbeitsbranch-Schema | `codex/<thema>` |
| Konventionsdatei | Projekt-README und die verbindlichen Arbeitsregeln von Jannik |
| Prüfbefehle | `node --check wiki.js`; Browser-Module über temporäre `.mjs`-Kopien prüfen; `node werkzeuge/pruefe-gleichstand.mjs`; `node werkzeuge/pruefe-schreibweise.mjs`; `node werkzeuge/pruefe-bearbeiten.mjs`; `node werkzeuge/pruefe-struktur.mjs`; `node werkzeuge/pruefe-github.mjs` |
| Paketmanager | keiner: statisches HTML/CSS/JavaScript, Node 22 nur für Werkzeuge und Prüfungen; kein unnötiger npm- oder pnpm-Umbau |
| Wächtertests | alle fünf `werkzeuge/pruefe-*.mjs` sowie die Syntaxprüfung in `.github/workflows/pages.yml` |
| Deploy | GitHub Pages veröffentlicht nach Push auf `main`; Subagenten und Analysebranches deployen oder pushen nie |
| Abnahme | Alle Wächter grün, GitHub-Actions-Lauf auf dem Zielcommit grün, dann frischer Live-Check von `https://kimpaliz.github.io/age-of-beast/` |

## Konventionen

- Deutsche UI- und Dokumentationstexte verwenden korrekt ä, ö, ü und ß. Dateinamen und vorhandene technische Bezeichner bleiben unverändert.
- Es wird ausschließlich die beauftragte Fläche geändert. Kein kreativer Nebenumbau, keine Umformatierung fremder Dateien und keine Löschung ohne belegten Migrationsnachweis.
- Daten werden nur in `daten/quelle.json` bearbeitet. `daten/welt.json` und `daten/welt.js` sind abgeleitet und werden ausschließlich gemeinsam erzeugt bzw. gespeichert.
- Jede Bestand- oder Größenbehauptung nennt den Rohbefehl und die gezählte Zahl.
- Commits bleiben lokal, bis Jannik einen Push ausdrücklich freigibt. Commit-Betreff auf Deutsch und klar beschreibend.

## Stille Fallen

- Der GitHub-Speicherweg ist ein browserseitiger Git-Data-API-Client. Blob-SHAs müssen vor dem Speichern gelesen werden; ein Konflikt darf nie durch Überschreiben oder Force-Push aufgelöst werden.
- Ein Bearbeitungsvorgang muss `daten/quelle.json`, `daten/welt.json` und `daten/welt.js` zusammen schreiben. Nur eine davon zu ändern ergibt eine scheinbar funktionierende, aber inkonsistente Welt.
- `werkzeuge/welt-holen.mjs --wirklich` kann die heute kanonische GitHub-Quelle überschreiben. Es bleibt außerhalb aller Upgrade-Schritte.
- Das Pages-Deployment schreibt vor dem Upload Versionskennzeichen in `index.html`. Lokale Checks dürfen daraus keine dauerhaften Quelltextänderungen ableiten.
- Der persönliche Fine-grained GitHub-Token gehört nie in Repository, Changelog, Testausgabe oder Subagentenauftrag. Der Client darf nur den bereits vorgesehenen lokalen Speicher nutzen.
- Kartenbilder sind lokale SVG-Wappen. Keine fremden Illustrationen, Hotlinks oder nicht geklärten Lizenzen ergänzen.

## Was Agenten nicht tun

Nicht deployen, nicht pushen, nicht mergen, keine Tokens lesen oder ausgeben, keine Weltdaten verändern, `daten/welt.json` oder `daten/welt.js` nicht direkt bearbeiten und `werkzeuge/welt-holen.mjs` nicht ausführen.
