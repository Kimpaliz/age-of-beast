# Altlasten — gemessene Rückstände

Diese Datei führt zwei Rückstände, beide **gemessen am 04.09.2026**, beide
als **Ratchet**: Sie dürfen schrumpfen, nie wachsen. Die Grenze ist kein
Vorwand für einen riskanten Komplettumbau — sie sorgt dafür, dass der
nächste fachliche Eingriff die Ablösung bezahlt, Stück für Stück.

Beide Tabellen werden von Wächtern gelesen. Wer hier eine Zeile ergänzt,
ändert eine Doku-Datei — das ist im Diff sichtbar und braucht eine
Begründung. Genau darin liegt der Schutz.

---

## Abgelöst

- **`werkzeuge/welt-umwandeln.mjs`** stand hier mit 582 Zeilen. Am
  04.09.2026 wurde der Kampagnenrahmen nach `werkzeuge/welt-rahmen.mjs`
  herausgelöst (147 Zeilen) — die Datei liegt jetzt bei **471** und ist
  damit unter der Grenze. Anlass war der Ratchet selbst: Für die
  Charakterbögen musste sie um sieben Zeilen wachsen, und die Regel
  verlangt, dass ein fachlicher Eingriff ein Stück der Ablösung bezahlt.
  Belegt: `daten/welt.json` und `daten/welt.js` wurden gelöscht, neu
  erzeugt und sind **bytegleich** zum Stand davor (je 240 KB).

---

## Großdateien (Regel 10)

`werkzeuge/pruefe-altlasten.mjs` hält die gemessene Zeilenzahl als
Obergrenze fest. Fällt eine Datei unter 500 Zeilen, meldet der Wächter
„kann aus der Altlastenliste" und ihre Zeile wird gestrichen.

Gemessen mit derselben Zählung wie der Wächter (Anzahl `\n`), über die
60 Quelldateien aus `alpha-code.json`:

> **Anhebung um je +1 am 04.09.2026, begründet.** Drei geführte Dateien
> sind um genau eine Zeile gewachsen: `pruefe-datenvertrag` 852 → 853,
> `pruefe-rahmen-routen` 645 → 646, `versioniere-browser-ressourcen`
> 615 → 616. Es ist in allen drei Fällen dieselbe Zeile — das
> `[Aufgabe: …]`, das `werkzeuge/pruefe-tags.mjs` **verlangt**.
>
> Damit standen zwei Wächter gegeneinander: einer fordert die Zeile,
> der andere verbietet das Wachstum. Aufgelöst zugunsten des Tags, weil
> die Zeile ein Kommentar ist und keine Anweisung — der Ratchet schützt
> vor wachsendem *Code*.
>
> ⚠️ **Kein Präzedenzfall.** Diese Ausnahme galt einmalig für die
> Nachrüstung. Jede weitere Anhebung braucht ihre eigene Begründung, und
> die Regel bleibt: Wer eine Altlast anfasst, löst zuerst den berührten
> Teil heraus.

| Datei | Zeilen | Zielbereich beim Herauslösen |
| --- | ---: | --- |
| `werkzeuge/pruefe-datenvertrag.mjs` | 853 | Die sieben Legacy-v0-Regeln aus `DATENVERTRAG.md` sind sieben Prüfblöcke plus 18 Mutationsproben. Die Proben können in eine eigene Datei neben die Regeln. |
| `werkzeuge/pruefe-rahmen-routen.mjs` | 646 | Die DOM- und `location`-Attrappe ist der größere Teil; sie gehört in ein eigenes Modul, das auch `pruefe-leseruntime.mjs` benutzen könnte. |
| `werkzeuge/versioniere-browser-ressourcen.mjs` | 616 | Der Abhängigkeitsläufer (HTML, JavaScript-Importe, CSS-Importe, `url()`) ist von der Umschreiberei trennbar; `pruefe-cache-graph.mjs` bräuchte denselben Läufer. |

Am nächsten dran, aber noch darunter (nur zur Warnung, nicht geführt):
`werkzeuge/werkstatt-uebernehmen.mjs` 426 · `karte/karte-erzeugen.mjs`
415 · `werkzeuge/pruefe-firestore-format.mjs` 403.

### Ausdrücklich **keine** Altlasten

Diese Dateien liegen über 500 Zeilen und werden trotzdem nicht geführt —
weil eine Obergrenze für sie keinen Sinn ergäbe:

⚠️ In dieser Tabelle steht die Zeilenzahl **hinten**. `pruefe-altlasten.mjs`
liest Baseline-Zeilen als `| `pfad` | Zahl |` — stünde sie vorn, zöge der
Wächter diese vier Dateien still in seine Baseline und meldete neun
Altlasten statt fünf. Genau das ist beim ersten Anlauf passiert.

| Datei | Warum keine Schuld | Zeilen |
| --- | --- | ---: |
| `daten/welt.js` | **Erzeugt.** `welt-aufbereiten.mjs` schreibt sie aus `daten/quelle.json`. Sie von Hand zu kürzen wäre ein Fehler, keine Verbesserung — `pruefe-gleichstand.mjs` würde sofort anschlagen. `daten/` ist deshalb in `alpha-code.json` von den Quelldateien ausgenommen. | 5.462 |
| `CHANGELOG-TECHNIK.md` | **Wächst von Natur aus.** Ein Protokoll schrumpfen zu lassen hieße, Belege zu löschen. Regel 4 verlangt jeden Eintrag. | 1.411 |
| `CHANGELOG.md` | dasselbe | 973 |
| `styles/wiki.css` | Kein `.js`/`.mjs`, also außerhalb der Quelldateiliste. Die Aufteilung nach Feature ist bereits geschehen (Paket H): `stil.css` ist nur noch eine Importfassade für fünf Dateien. Eine weitere Teilung braucht einen fachlichen Anlass, nicht eine Zeilenzahl. | 642 |

---

## Ohne Aufgaben-Tag (Regel 6)

`werkzeuge/pruefe-tags.mjs` liest diesen Abschnitt. Eine hier geführte
Datei darf (noch) kein `[Aufgabe: …]` in den ersten zwölf Zeilen tragen;
**jede andere Quelldatei muss eines haben**. Bekommt eine geführte Datei
ihren Tag, meldet der Wächter „kann aus der Nachrüstliste".

**Am 04.09.2026 abgearbeitet — die Liste ist leer.**

Zwei Befunde aus dem Abarbeiten, beide gemessen:

1. **Der Abschnitt hieß „Ohne Kopfnotiz" und war fehlbeschriftet.** Alle
   45 geführten Dateien hatten längst eine brauchbare Kopfnotiz mit Was
   und Warum — es fehlte in jeder nur die eine Zeile `[Aufgabe: …]`.
   Der Wächter prüft den **Tag**, nicht die Notiz; die Überschrift
   versprach mehr Arbeit, als übrig war, und hat sie deshalb länger
   liegen lassen als nötig.

2. **Der Tag `Karte` fasste drei Systeme zusammen.** Der Ordner `karte/`
   trägt die Weltkarte, die Daggerheart-Spielkarten und den
   Charakterbogen. Belegt an den Importen: drei Seiten
   (`karte.html`, `karten.html`, `bogen.html`), drei geschlossene
   Gruppen, **null Importe zwischen Weltkarte und den beiden anderen**;
   geteilt ist einzig `kartenblase.js` zwischen Spielkarten und Bogen.
   `docs/REGELN.md` führt sie jetzt getrennt.

Bleibt die Liste leer, ist das der Normalfall — eine neue Datei ohne Tag
ist sofort rot. Sie wieder zu füllen wäre eine sichtbare Änderung an
dieser Datei und braucht eine Begründung.

| Datei | Tag |
| --- | --- |

## Beim Zusammenführen des Zweigs `welt/karte-und-figuren` nachtragen

⚠️ **Diese Überschrift ist absichtlich `##` und nicht `###`.**
`pruefe-tags.mjs` liest den Abschnitt „Ohne Kopfnotiz" bis zur nächsten
`##`-Überschrift. Stünde hier `###`, würde der Wächter die Zeilen unten
als geführte Rückstände lesen — und sofort melden, dass sie ins Leere
zeigen, weil es die Dateien auf diesem Zweig gar nicht gibt.

Dieser Zweig liegt neben `einrichtung/alpha-code` und bringt sieben
weitere Quelldateien mit. Vier davon tragen ihren Tag `Karte` **bereits**
— nur unterhalb der zwölften Zeile, wo `pruefe-tags.mjs` ihn nicht sieht.
Beim Zusammenführen genügt es, die Kopfnotizen um wenige Zeilen nach oben
zu ziehen; für die drei übrigen ist entweder eine Kopfnotiz oder eine
Zeile hier fällig.

| Datei | Tag | Zustand am 04.09.2026 |
| --- | --- | --- |
| `karte/karte-erzeugen.mjs` | `Karte` | Tag vorhanden, zu weit unten |
| `karte/palette.mjs` | `Karte` | Tag vorhanden, zu weit unten |
| `karte/welt-regionen.mjs` | `Karte` | Tag vorhanden, zu weit unten |
| `werkzeuge/karte-malen.mjs` | `Karte` | Tag in Zeile 13 — eine Zeile zu spät |
| `karte/karte-zeichnen.js` | `Karte` | kein Tag |
| `werkzeuge/pruefe-karte.mjs` | `Prüfwesen` | kein Tag; zusätzlich eine Zeile in der Tabelle im Kopf von `pruefe-alles.mjs` |
| `karte/karte-erzeugen.mjs` (415 Zeilen) | — | nähert sich der 500er-Grenze |

Diese Tabelle ist eine **Erinnerung, keine Erlaubnis**.
