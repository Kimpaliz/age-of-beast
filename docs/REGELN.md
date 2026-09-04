# Regeln

Diese Regeln gelten ausnahmslos — in jedem Alpha-Code-Projekt gleich.
Die mechanisch prüfbaren laufen in `werkzeuge/pruefe-alles.mjs` mit.
Regel 9 bis 12 sind aus Florians BATC-TEAM übernommen (02.09.2026).

## 1 · Niemals direkt auf `main`

Jede Änderung entsteht auf einem Zweig. Auch die kleinste, auch reine
Dokumentation. Auf einem Zweig kostet ein Irrtum nichts: Zweig
wegwerfen, fertig.

## 2 · Ein Zweig je System

Wird ein System geändert, bekommt es seinen eigenen Zweig. Zwei Systeme
in einem Zweig sind ein Fehler, auch wenn beides klein ist — ein Zweig,
der eine Sache tut, lässt sich als Ganzes annehmen oder als Ganzes
verwerfen; sobald zwei Sachen darin stecken, hängt das Gute am
Schlechten.

**Die Systeme dieses Projekts**, ihre Tags und Zweignamen. Der Tag steht
in jeder Quelldatei als `[Aufgabe: <Tag>]`; `pruefe-tags.mjs` liest diese
Tabelle als die eine Quelle der zugelassenen Tags — es gibt keine zweite
Liste, die auseinanderlaufen könnte.

Der Schnitt ist am Code gemessen (04.09.2026), nicht geraten: Er folgt
den Ladewegen aus `index.html`, den `import`-Ketten und den
Freigabelisten der beiden lokalen Server. Wie die Systeme zusammenhängen,
steht in [WEGWEISER.md](WEGWEISER.md).

| System | Tag | Zweigname | Bereiche/Dateien |
| --- | --- | --- | --- |
| Leseoberfläche | `Leseruntime` | `leseruntime/…` | `index.html`, `wiki.js`, `runtime/` (5 Dateien) |
| Gestaltung | `Gestaltung` | `gestaltung/…` | `stil.css`, `styles/` (5 Dateien) |
| Bearbeiten | `Bearbeiten` | `bearbeiten/…` | `bearbeiten.js`, `bearbeiten-kontext.js`, `texte-bearbeiten.js`, `struktur-bedienung.js`, `werkzeuge/bearbeiten-stellen.mjs`, `werkzeuge/text-schreibweise.mjs`, `werkzeuge/struktur-bearbeiten.mjs` |
| Werkstatt und Rahmen | `Werkstatt` | `werkstatt/…` | `rahmen-assistent.js`, `werkzeuge/rahmen-*.mjs`, `werkzeuge/regeln-*.mjs`, `werkzeuge/werkstatt-uebernehmen.mjs` |
| Weltdaten | `Weltdaten` | `weltdaten/…` | `daten/quelle.json` und die Ableitungen, `werkzeuge/welt-*.mjs` |
| Speicher und Anmeldung | `Speicher` | `speicher/…` | `firebase-konfig.js`, `firestore.rules`, `werkzeuge/firestore-*.mjs` |
| Plattform (mehrere Wikis) | `Rahmen` | `plattform/…` | `werkzeuge/plattform-speicher.mjs`, `runtime/plattform.js`, `docs/PLATTFORM.md` |
| Kartenwappen | `Bilder` | `bilder/…` | `werkzeuge/kartenbilder-erzeugen.mjs`, `daten/kartenbilder/` (234 SVG) |
| Weltkarte | `Karte` | `karte/…` | `karte.html`, `karte/karte-zeichnen.js`, `karte/karte-erzeugen.mjs`, `karte/palette.mjs`, `karte/welt-regionen.mjs`, `karte/welt-orte.mjs`, `werkzeuge/karte-malen.mjs` |
| Spielkarten | `Spielkarten` | `spielkarten/…` | `karten.html`, `karte/karten-zeigen.js`, `karte/karten-daten.js`, `karte/kartenblase.js`, `daten/daggerheart-*.json` |
| Charakterbogen | `Charakterbogen` | `bogen/…` | `bogen.html`, `karte/bogen-zeigen.js`, `werkzeuge/werte-rechnen.mjs`, `styles/charakterbogen.css` |
| Betrieb und Auslieferung | `Betrieb` | `betrieb/…` | `werkzeuge/vorschau-server.mjs`, `werkzeuge/heim-server.mjs`, `werkzeuge/versioniere-browser-ressourcen.mjs`, `.github/workflows/` |
| Prüfwesen | `Prüfwesen` | `pruefung/…` | `werkzeuge/pruefe-*.mjs`, `werkzeuge/helfer.mjs` |
| Dokumentation | `Doku` | `doku/…` | `docs/`, `README.md`, `CHANGELOG.md`, `CHANGELOG-TECHNIK.md` |

**Zwei Systeme tragen heute keinen Tag**, und das ist kein Versehen:
`Gestaltung` und `Doku` bestehen aus CSS und Markdown, und
`alpha-code.json` führt nur `.js` und `.mjs` als Quelldateien. Ihre
Zeilen stehen trotzdem hier — ein Zweigname wird gebraucht, sobald dort
etwas geändert wird.

**`daten/` ist ausgenommen.** Dort liegen nur erzeugte Weltdaten und die
234 SVG-Wappen. `daten/welt.js` (5.462 Zeilen) schreibt
`welt-aufbereiten.mjs`; eine Kopfnotiz darin wäre beim nächsten Erzeugen
wieder weg. Erzeugtes ist keine Altlast — die Begründung steht in
`alpha-code.json`.

## 3 · Nach jeder Änderung wird gefragt

Ist ein Zweig fertig und grün, wird **gefragt**, ob er nach `main`
soll. Nicht angenommen, nicht stillschweigend gemacht. Die Antwort gibt
Jannik — je Einzelfall. Dasselbe gilt für alles, was nach außen geht:
Veröffentlichen, Deploys, Etiketten, Sichtbarkeit des Repositorys.

## 4 · Alles steht im Changelog

Jede einzelne Änderung wird in `CHANGELOG.md` genau dokumentiert —
oben, mit dem **Warum** und den **Messungen**, nicht nur dem Was.
Ausnahmslos: auch Doku-Änderungen, auch Einzeiler.

## 5 · Workclaim: erst lesen, dann eintragen, dann schreiben

Bevor irgendetwas geschrieben wird, wird `WORKCLAIM.md` gelesen. Steht
ein Bereich dort unter fremdem Besitz, wird er **nicht angefasst** —
Zugriff nur mit ausdrücklicher Erlaubnis des Besitzers oder Janniks.
Wer selbst arbeitet, trägt vorher Bereich, Besitzer, Ziel und Startzeit
ein und setzt die Zeile nach getaner Arbeit auf `frei`.

## 6 · Jede Datei sagt, wozu sie da ist

Jede Quelldatei beginnt mit einer Kopfnotiz, die drei Fragen
beantwortet: **Was** tut sie? **Warum** ist sie so gebaut (die
Entscheidung, nicht die Syntax)? **Mit wem** arbeitet sie zusammen?
In den ersten Zeilen steht ihr Funktions-Tag `[Aufgabe: <Tag>]` aus der
Tabelle in Regel 2.

## 7 · Jeder Fehler wird sofort notiert

In `docs/FEHLERBUCH.md`, nach dem dortigen Vier-Felder-Muster — nicht
am Ende der Arbeit, denn dann fehlt der Zustand, der ihn erklärt.

## 8 · Jede Zahl ist gemessen

Nicht geschätzt, nicht aus einem Kommentar übernommen, nicht aus dem
Gedächtnis. Wenn im Changelog eine Zahl steht, gibt es den Befehl, der
sie nachrechnet. Eine Zahl, die aus einer Liste folgt, wird berechnet
oder verweist auf die eine Stelle, die sie führt — nie danebengeschrieben.

## 9 · Exakter Umfang

Geändert wird nur der angeforderte Bereich. Eine kreative Nebenänderung
braucht einen eigenen Auftrag — auffallen darf sie, gebaut wird sie
nicht nebenbei. Und: **Ein roter Ausgangsstand wird zuerst gemeldet,
nicht überbaut.** Jeder Abschluss nennt auch, was **bewusst nicht
geändert** wurde, und bei allem, was ein Produktivsystem berührt, den
Rückrollweg.

## 10 · Kleine Dateien als Ratchet

Neue oder herausgelöste Quelldateien bleiben unter **500 Zeilen**.
Bestehende Großdateien sind dokumentierte Altlasten in
`docs/ALTLASTEN.md`: Sie wachsen **nie** wieder, und beim nächsten
fachlichen Eingriff wird der berührte Teil zuerst herausgelöst. Die
Grenze ist ein Ratchet, kein Vorwand für einen riskanten Komplettumbau.

## 11 · Nichts Verbotenes im Repository

Keine echten Kunden-, Spieler- oder Personendaten. Keine Passwörter,
Tokens oder privaten Schlüssel — auch nicht „nur kurz zum Testen",
denn die Git-Historie vergisst nichts. Keine Binärprogramme, Archive
oder Mitschnitte. Dateinamen bleiben ASCII (Windows-, Build- und
Cloud-Werkzeuge stolpern sonst); **Inhalte** tragen echte Umlaute.

## 12 · Projektgrenzen sind Verträge

Hat dieses Projekt einen Nachbarn (zweites Repository, gemeinsame
Datenbank, gemeinsamer Rechner), steht die Grenze in
`docs/PROJEKTGRENZE.md`: wer was besitzt, und dass die einzige
erlaubte Verbindung ein **versionierter, lesender Vertrag** ist — nie
kopierter Quelltext, nie geteilte Tokens. Geteilte Ressourcen (etwa
eine gemeinsame Regeldatei) bekommen einen eigenen Wächter.

## 13 · Begründung und Stand sind zwei Dinge

Die häufigste Art, wie ein Repository unehrlich wird, ist kein Fehler im
Code: Es ist ein Dokument, das seit vier Monaten „noch offen" sagt.

| | gehört hin |
| --- | --- |
| **Begründung** — Zielbild, Messungen, verworfene Wege | `docs/` |
| **Stand** — „läuft", „blockiert durch #14" | der Vorgang auf GitHub |
| **Verlauf** — was wann geändert wurde | `CHANGELOG.md` |
| **Abgeschlossenes** — dort *darf* Status stehen | `docs/geschichte/` |

## 14 · Kein Dokument behauptet einen Zustand

„ist live", „erledigt", „nächster Schritt" veralten **lautlos**: Nichts
wird rot, niemand merkt es, und das Dokument wird trotzdem geglaubt.

**Ein datierter Vermerk ist die Ausnahme und bleibt.** „Gemessen am
12.03.2026" behauptet nichts über jetzt — das Datum legt ihn trocken.
Wer eine Zustandsaussage braucht, schreibt sie datiert: dann ist sie in
einem Jahr nicht falsch, sondern alt.

Am 04.09.2026 fand der Wächter beim ersten Lauf eine Stelle in
[WEGWEISER.md](WEGWEISER.md), die einen bestimmten Commit als aktuellen
Stand nannte — und die zu diesem Zeitpunkt **schon falsch war**.

## 15 · Deutsch mit richtigen Umlauten

Kommentare, Doku, Nutzertexte und Commit-Betreffs auf Deutsch, mit
echten ä, ö, ü und ß. Bezeichner im Code dürfen englisch sein, wo das
Umfeld es vorgibt (`hidden`, `display`).

## 16 · Fahrplan, Wünsche und Fehler leben als Vorgänge

Drei Dinge werden Issues und bleiben nicht Absätze in Dokumenten: der
**Fahrplan**, jeder **Wunsch**, jeder **Fehler** — dazu jede offene
**Entscheidung**.

| Form | Label | Eltern | trägt |
| --- | --- | --- | --- |
| **Phase** | `track` | keins | das Abnahmekriterium aus [ROADMAP.md](ROADMAP.md) |
| **Wunsch** | `wunsch` + `track` | keins | Janniks Wortlaut, darunter die Analyse |
| **Schritt** | `schritt` | Phase oder Wunsch | **ein** Fertig-Kriterium |
| **Fehler** | `fehler` | frei | das Vier-Felder-Muster |
| **Entscheidung** | `entscheidung` | **keins** | Frage, Möglichkeiten, Empfehlung |

**Große Vorgänge werden geteilt.** Eine Phase enthält selbst keine
Arbeit — die Arbeit sind ihre Schritte. Lassen sich für einen Schritt
zwei Fertig-Kriterien nennen, sind es zwei Schritte: sonst gibt es
keinen Zeitpunkt, an dem man ihn guten Gewissens schließt.

**Zwei Grenzen, die man leicht übersieht:**

- Eine **Entscheidung hängt an keiner Phase.** Sie hat eine andere
  Lebensdauer als die Arbeit, die auf sie wartet, und überlebt sie oft.
- Ein **Fehler geht durch beide Bücher, nacheinander:** erst der Vorgang
  (was ist kaputt, seit wann, woran erkannt), nach der Behebung der Fall
  im [FEHLERBUCH.md](FEHLERBUCH.md) (woran ich es früher merke). Wer nur
  eines führt, verliert entweder den Stand oder die Lehre.

**Jede Verbindung wird zweimal geschrieben**, sonst ist sie von einer
Seite unsichtbar: `Teil von #12` im Kind, `- [ ] #13` in der
Aufgabenliste des Elternteils (daraus rechnet GitHub den Fortschritt),
dazu die echte Unter-Vorgangs-Verknüpfung, `Vorgang: #12` im Dokument
und `(#13)` am Ende des Commit-Betreffs.

```bash
node werkzeuge/vorgaenge.mjs roadmap              # zeigt, was fehlt
node werkzeuge/vorgaenge.mjs roadmap --wirklich   # legt an und verkettet
node werkzeuge/vorgaenge.mjs wunsch "Titel" --datei wunsch.md
node werkzeuge/vorgaenge.mjs fehler "Titel" --datei bericht.md
node werkzeuge/vorgaenge.mjs stand                # die Übersicht als Abfrage
```

**Ohne `--wirklich` läuft alles trocken.** Vorgänge anzulegen erzeugt
Benachrichtigungen und lässt sich nicht spurlos zurücknehmen.

**Eine Übersicht wird abgefragt, nicht gepflegt.** Eine Tabelle im
Dokument wäre selbst wieder Doku, die veraltet.

## Was davon die Maschine prüft

| Regel | Wächter |
| --- | --- |
| 1 und 4 | `werkzeuge/pruefe-arbeitsweise.mjs` |
| 5 (Format und Vollständigkeit) | `werkzeuge/pruefe-workclaim.mjs` |
| 6 (Tag vorhanden und zugelassen) | `werkzeuge/pruefe-tags.mjs` |
| 10 (Grenze und Ratchet) | `werkzeuge/pruefe-altlasten.mjs` |
| 11 (Formate und Geheimnismuster) | `werkzeuge/pruefe-geheimnisse.mjs` |
| Verweise in der Doku | `werkzeuge/pruefe-verweise.mjs` |
| vor jeder Veröffentlichung zusätzlich | `werkzeuge/pruefe-freigabe.mjs` (samt Git-Historie; hier läuft sie außerdem in beiden GitHub-Abläufen mit) |
| 12 (die gemeinsame Firestore-Regeldatei) | `werkzeuge/pruefe-firestore-trennung.mjs` |
| 14 (kein Zustand in der Doku) | `werkzeuge/pruefe-doku-status.mjs` |
| 16 (Form und Verweise der Vorgänge) | `werkzeuge/pruefe-vorgaenge.mjs` — ohne Netz; `--online` fragt GitHub |
| 2, 3, 7, 8, 9, 13, 15 | kann nur ein Mensch beurteilen |

Dazu die **fünfzehn Fachprüfungen**, die dieses Projekt schon vor der
Alpha-Code-Einrichtung hatte. Was jede einzelne festhält und welcher
Fehler ohne sie still durchkäme, steht als Tabelle im Kopf von
`werkzeuge/pruefe-alles.mjs`.

## Nachtrag zu Regel 6: die Nachrüstliste

Beim Nachrüsten am 04.09.2026 hatten **47 von 60** Quelldateien keine
Kopfnotiz. Alle in einem Zug anzufassen hätte die zwei parallel
arbeitenden Sitzungen im selben Checkout zerlegt. Deshalb gilt für
Regel 6 derselbe Ratchet wie für Regel 10: Die 47 Dateien stehen
namentlich in [ALTLASTEN.md](ALTLASTEN.md) unter „Ohne Kopfnotiz".

- Eine **geführte** Datei darf (noch) keinen Tag haben.
- **Jede andere** muss einen haben — eine neue Datei ohne Tag ist sofort
  rot.
- Die Liste kann nur **schrumpfen**. Sie zu verlängern ist eine sichtbare
  Änderung an einer Doku-Datei und braucht eine Begründung.
