# Age of Beast – QA-Matrix

> ## ⚠️ Nachtrag vom 04.09.2026 — die Tabelle ist unvollständig
>
> Die Tabelle „Automatische lokale Wächter" nennt **zwölf** Prüfungen.
> Es waren am 04.09.2026 **fünfzehn** (`ls werkzeuge/pruefe-*.mjs | wc -l`).
> Drei fehlen — darunter ausgerechnet die wichtigste:
>
> | Fehlt unten | Geschützter Vertrag | Bewusste Lücke |
> | --- | --- | --- |
> | `pruefe-firestore-trennung.mjs` | Die geteilte Regeldatei enthält Scotophobias Blöcke wortgleich. **Ein Deploy der falschen Fassung schaltet das Nachbarprojekt ab** — siehe [PROJEKTGRENZE.md](PROJEKTGRENZE.md) | Prüft die Datei, nicht die Wirklichkeit: Nach einem Deploy muss ein Mensch nachsehen |
> | `pruefe-firestore-format.mjs` | Welt ⇄ Firestore-Dokumente, samt Schlüsselreihenfolge | Kein echter Firestore-Schreibvorgang |
> | `pruefe-symbole.mjs` | Jede Kategorie hat eigenes Symbol, eigenen Farbton und ausreichenden Kontrast in hell und dunkel | Keine subjektive Designbewertung |
>
> Seit der Alpha-Code-Einrichtung kommen die Wächter der Arbeitsweise
> hinzu (Tags, Verweise, Workclaim, Geheimnisse, Altlasten, Freigabe).
> **Die eine gültige Liste steht seither als Tabelle im Kopf von
> `werkzeuge/pruefe-alles.mjs`** — mit der Spalte, die hier fehlt: *welcher
> Fehler käme ohne diese Prüfung still durch?*
>
> Ebenfalls überholt: Der PowerShell-Einzeiler unten startet die Wächter
> einzeln. Der Einstieg ist jetzt `node werkzeuge/pruefe-alles.mjs`; die
> beiden GitHub-Abläufe sammeln weiterhin jede `pruefe-*.mjs` selbst ein.

Die Matrix trennt lokale, automatisierte Beweise von Browser- und
Veröffentlichungsabnahmen. Alle lokalen Prüfer sind rein lesend; sie erzeugen
keinen Commit und verwenden keine Zugangsdaten.

## Automatische lokale Wächter

| Befehl | Geschützter Vertrag | Bewusste Lücke |
| --- | --- | --- |
| `pruefe-gleichstand.mjs` | Quelle erzeugt die angezeigte JSON-Welt. | Kein vollständiger Schema-/Referenzvertrag. |
| `pruefe-schreibweise.mjs` | Sichtbarer Text bleibt beim Umwandeln erhalten. | Kein Browser-Bedienpfad. |
| `pruefe-bearbeiten.mjs` | Bearbeitbare Felder lassen sich lesen, schreiben und umwandeln. | Kein echter GitHub-Write. |
| `pruefe-struktur.mjs` | Anlegen, Löschen und Sortieren hinterlässt keine Rohdatenreste. | Kein Assistenten-UI-Test. |
| `pruefe-github.mjs` | Drei-Dateien-Transaktion, Base64 und Konfliktvertrag. | Keine echte API-, CORS- oder Berechtigungsprüfung. |
| `pruefe-server-sicherheit.mjs` | Freigabelisten, Methoden, Sperren, HEAD und Loopback. | Kein Angriffstest mit lokalem Schreibzugriff zwischen `realpath` und Lesen. |
| `pruefe-datenvertrag.mjs` | Legacy-v0-IDs, Kategorien, Panels, Referenzen, Rahmen, Descriptor und Bildpfade. | Keine Datenmigration auf eine neue Vertragsversion. |
| `pruefe-rahmen-routen.mjs` | Fassade, Deep Links, Render-Generation und asynchrone Rahmen-Guards. | Kein echter Browser-Renderer. |
| `pruefe-bearbeitungskontext.mjs` | Eingefrorener Kontext, Delegation, Fehlerpfade und Runtime-Wechsel. | Keine Anmeldung gegen GitHub. |
| `pruefe-leseruntime.mjs` | Klassische Bausteine, Reihenfolge, Fassade und getrennte Zuständigkeiten. | Kein Layout- oder Pointer-Rendering. |
| `pruefe-cache-graph.mjs` | Vollständiger HTML-, JavaScript- und CSS-Abhängigkeitsgraph im Pages-Artefakt. | Kein CDN- oder Browser-Cache außerhalb des Artefakts. |
| `pruefe-stilstruktur.mjs` | Vier CSS-Feature-Dateien ergeben exakt den bisherigen Stilinhalt. | Keine subjektive Designbewertung. |

Alle starten lokal deterministisch mit:

~~~text
Get-ChildItem werkzeuge\pruefe-*.mjs | Sort-Object Name | ForEach-Object { node $_.FullName }
~~~

Vorher wird jede Browser-`.js`-Datei als ES-Modul syntaxgeprüft; die CI nutzt
dazu temporäre `.mjs`-Kopien, damit keine `package.json` nötig ist. Alle
`werkzeuge/*.mjs` durchlaufen zusätzlich `node --check`.

## Browser-Abnahme

Der lokale Browser-Smoke prüft mindestens diese Matrix:

| Fläche | Breiten | Zustände |
| --- | --- | --- |
| Start, Eintrag, Kategorie, Werkstatt, Rahmen-Deep-Link | Desktop, 1024 px, 640 px | hell und dunkel, kein horizontaler Überlauf |
| Suche und Tastatur | Desktop und 640 px | Treffer, Pfeiltasten, Enter, Escape und Leeren |
| Vorschau | Desktop | Verzögerung, Übergang in die Vorschau und Route über „Öffnen“ |
| Leiste | Desktop und 640 px | gespeicherter Desktopzustand, geschlossener Mobilzustand |
| Nicht angemeldeter Rahmen | alle | sichtbarer Login-Hinweis, kein Schreibformular |

Der authentifizierte Bearbeitungspfad und echte GitHub-Schreibvorgänge bleiben
bewusst außerhalb dieser lokalen Prüfung, solange kein Token und keine
ausdrückliche Autorisierung vorliegen.

## CI und Veröffentlichung

- `qa.yml` läuft für Pull Requests und manuell. Er prüft Syntax, alle
  `pruefe-*.mjs` und einen vollständig versionierten Browser-Artefaktgraphen;
  er veröffentlicht nie.
- `pages.yml` läuft nur auf `main` oder manuell. Er führt dieselben Gates aus,
  versioniert ausschließlich eine Artefaktkopie und kann erst danach Pages
  bereitstellen.
- Nach einem ausdrücklich freigegebenen Push wird zusätzlich der
  Actions-Lauf für den Ziel-SHA und die öffentliche Seite in einem frischen
  Browser geprüft.

Das Projekt braucht keinen Paketmanager. Falls später ein eigenständiges
Browser-Testwerkzeug nötig wird, wird es als begründetes separates Paket mit
`pnpm` eingeführt – nicht als Nebenwirkung dieses statischen Wikis.
