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

| Datei | Zeilen | Zielbereich beim Herauslösen |
| --- | ---: | --- |
| `werkzeuge/pruefe-datenvertrag.mjs` | 852 | Die sieben Legacy-v0-Regeln aus `DATENVERTRAG.md` sind sieben Prüfblöcke plus 18 Mutationsproben. Die Proben können in eine eigene Datei neben die Regeln. |
| `werkzeuge/pruefe-rahmen-routen.mjs` | 645 | Die DOM- und `location`-Attrappe ist der größere Teil; sie gehört in ein eigenes Modul, das auch `pruefe-leseruntime.mjs` benutzen könnte. |
| `werkzeuge/versioniere-browser-ressourcen.mjs` | 615 | Der Abhängigkeitsläufer (HTML, JavaScript-Importe, CSS-Importe, `url()`) ist von der Umschreiberei trennbar; `pruefe-cache-graph.mjs` bräuchte denselben Läufer. |
| `werkzeuge/pruefe-firestore-trennung.mjs` | 592 | Die sechs absichtlichen Beschädigungen, mit denen die Wirksamkeit belegt ist, können neben die Blockprüfung. |

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

## Ohne Kopfnotiz (Regel 6)

`werkzeuge/pruefe-tags.mjs` liest diesen Abschnitt. Eine hier geführte
Datei darf (noch) kein `[Aufgabe: …]` in den ersten zwölf Zeilen tragen;
**jede andere Quelldatei muss eines haben**. Bekommt eine geführte Datei
ihren Tag, meldet der Wächter „kann aus der Nachrüstliste".

**Warum das offen ist:** Die Kopfnotizen sind Schritt 5 der
Alpha-Code-Methode. Er berührt jede einzelne dieser Dateien und hätte am
04.09.2026 die parallel arbeitenden Sitzungen im selben Checkout zerlegt
(`karte/`, `docs/daggerheart/`). Der Schnitt und die Tags stehen in
[REGELN.md](REGELN.md); es fehlt nur das Eintragen.

Stand 04.09.2026 auf dem Zweig `einrichtung/alpha-code`: **47 von 56**
Quelldateien. Die Spalte „Tag" sagt, was beim Nachrüsten hineingehört —
sie ist aus der Systemtabelle abgeleitet, nicht neu erfunden.

```bash
# beide Zahlen nachrechnen
node -e "const f=require('fs');const A=new Set(['node_modules','.git','.entwurf','daten']);let a=0,b=0;(function g(d){for(const n of f.readdirSync(d)){if(A.has(n))continue;const r=d==='.'?n:d+'/'+n;if(f.statSync(r).isDirectory()){g(r);continue}if(!/\.m?js$/.test(n))continue;a++;if(!/\[Aufgabe:/.test(f.readFileSync(r,'utf8').split(/\r?\n/).slice(0,12).join('\n')))b++}})('.');console.log(b+' von '+a)"
```

| Datei | Tag |
| --- | --- |
| `bearbeiten-kontext.js` | `Bearbeiten` |
| `bearbeiten.js` | `Bearbeiten` |
| `firebase-konfig.js` | `Speicher` |
| `rahmen-assistent.js` | `Werkstatt` |
| `runtime/ansichten.js` | `Leseruntime` |
| `runtime/datenindex.js` | `Leseruntime` |
| `runtime/interaktion.js` | `Leseruntime` |
| `runtime/routing.js` | `Leseruntime` |
| `runtime/symbole.js` | `Leseruntime` |
| `struktur-bedienung.js` | `Bearbeiten` |
| `texte-bearbeiten.js` | `Bearbeiten` |
| `wiki.js` | `Leseruntime` |
| `werkzeuge/bearbeiten-stellen.mjs` | `Bearbeiten` |
| `werkzeuge/firestore-format.mjs` | `Speicher` |
| `werkzeuge/firestore-speicher.mjs` | `Speicher` |
| `werkzeuge/github-speicher.mjs` | `Speicher` |
| `werkzeuge/heim-server.mjs` | `Betrieb` |
| `werkzeuge/kartenbilder-erzeugen.mjs` | `Bilder` |
| `werkzeuge/pruefe-bearbeiten.mjs` | `Prüfwesen` |
| `werkzeuge/pruefe-bearbeitungskontext.mjs` | `Prüfwesen` |
| `werkzeuge/pruefe-cache-graph.mjs` | `Prüfwesen` |
| `werkzeuge/pruefe-datenvertrag.mjs` | `Prüfwesen` |
| `werkzeuge/pruefe-firestore-format.mjs` | `Prüfwesen` |
| `werkzeuge/pruefe-firestore-trennung.mjs` | `Prüfwesen` |
| `werkzeuge/pruefe-github.mjs` | `Prüfwesen` |
| `werkzeuge/pruefe-gleichstand.mjs` | `Prüfwesen` |
| `werkzeuge/pruefe-leseruntime.mjs` | `Prüfwesen` |
| `werkzeuge/pruefe-rahmen-routen.mjs` | `Prüfwesen` |
| `werkzeuge/pruefe-schreibweise.mjs` | `Prüfwesen` |
| `werkzeuge/pruefe-server-sicherheit.mjs` | `Prüfwesen` |
| `werkzeuge/pruefe-stilstruktur.mjs` | `Prüfwesen` |
| `werkzeuge/pruefe-struktur.mjs` | `Prüfwesen` |
| `werkzeuge/pruefe-symbole.mjs` | `Prüfwesen` |
| `werkzeuge/rahmen-felder-lesen.mjs` | `Werkstatt` |
| `werkzeuge/rahmen-uebernehmen.mjs` | `Werkstatt` |
| `werkzeuge/regeln-testen.mjs` | `Werkstatt` |
| `werkzeuge/regeln-uebernehmen.mjs` | `Werkstatt` |
| `werkzeuge/struktur-bearbeiten.mjs` | `Bearbeiten` |
| `werkzeuge/text-schreibweise.mjs` | `Bearbeiten` |
| `werkzeuge/versioniere-browser-ressourcen.mjs` | `Betrieb` |
| `werkzeuge/vorschau-server.mjs` | `Betrieb` |
| `werkzeuge/welt-aufbereiten.mjs` | `Weltdaten` |
| `werkzeuge/welt-dateien.mjs` | `Weltdaten` |
| `werkzeuge/welt-hochladen.mjs` | `Weltdaten` |
| `werkzeuge/welt-holen.mjs` | `Weltdaten` |
| `werkzeuge/welt-umwandeln.mjs` | `Weltdaten` |
| `werkzeuge/werkstatt-uebernehmen.mjs` | `Werkstatt` |

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
