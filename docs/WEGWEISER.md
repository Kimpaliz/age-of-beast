# Wegweiser — die Karte über allem

Jede Aussage hier ist am Code belegt (Stand 04.09.2026): Wo „A liest B"
steht, wurde der `import`, das `<script>` oder die Freigabeliste
gesehen. Zahlen, die sich ändern, stehen **nicht** hier, sondern in den
Dateien, die sie führen — [ALTLASTEN.md](ALTLASTEN.md) für Zeilenzahlen,
[REGELN.md](REGELN.md) für Tags und Zweignamen.

Zwei Leser sind gemeint. **Jannik** liest Teil 1 und Teil 3. **Wer hier
zu bauen anfängt**, liest alles, bevor er eine Datei öffnet.

---

## Teil 1 · Die Karte in Worten

Das Wiki ist eine **statische Seite ohne Bauschritt**. `index.html`
öffnen genügt — es gibt keinen Paketmanager, keine Bibliothek und keine
`package.json`. Node braucht man nur für die Werkzeuge und die Prüfungen.

Zum **Lesen** kommt die Welt aus `daten/welt.js`, einer Datei im
Repository: sofort da, auch wenn das Netz weg ist. Danach fragt die
Seite Firestore, ob es etwas Neueres gibt, und tauscht die Anzeige aus.
Zum **Schreiben** meldet man sich mit dem Google-Konto an; wer schreiben
darf, entscheidet `firestore.rules` — nicht der Browser. Gespeichert
heißt veröffentlicht.

Der Weg nach GitHub Pages läuft über `.github/workflows/pages.yml`:
Jeder Push auf `main` prüft alles und lädt eine **Kopie** hoch, in der
jede veränderliche Datei eine Kennung aus dem Commit trägt — sonst würde
ein Besucher neues HTML mit altem JavaScript aus dem Zwischenspeicher
mischen.

### Die Systeme

| | System | was es tut | wo es heute liegt |
| --- | --- | --- | --- |
| 1 | **Leseoberfläche** | zeigt die Welt an: Navigation, Seiten, Suche, Vorschau, hell/dunkel | `index.html`, `wiki.js`, `runtime/` |
| 2 | **Gestaltung** | wie es aussieht | `stil.css` als Fassade, `styles/` mit fünf Dateien |
| 3 | **Bearbeiten** | die Stifte an Texten, Abschnitten und Steckbriefzeilen | `bearbeiten*.js`, `texte-bearbeiten.js`, `struktur-bedienung.js` und drei Module in `werkzeuge/` |
| 4 | **Werkstatt und Rahmen** | der Kampagnenrahmen-Assistent und das Regelwiki | `rahmen-assistent.js`, `werkzeuge/rahmen-*.mjs`, `regeln-*.mjs`, `werkstatt-uebernehmen.mjs` |
| 5 | **Weltdaten** | die eine Quelle und ihre zwei Ableitungen | `daten/`, `werkzeuge/welt-*.mjs` |
| 6 | **Speicher und Anmeldung** | Firestore lesen und schreiben, Google-Anmeldung, Regeln | `firebase-konfig.js`, `firestore.rules`, `werkzeuge/firestore-*.mjs` |
| 7 | **Kartenwappen** | eigene SVG-Wappen statt fremder Illustrationen | `werkzeuge/kartenbilder-erzeugen.mjs`, `daten/kartenbilder/` |
| 8 | **Weltkarte** | eine gemalte Karte in Biome übersetzen (im Bau) | `karte/`, `werkzeuge/karte-malen.mjs` |
| 9 | **Betrieb und Auslieferung** | zwei lokale Server, Cache-Kennungen, die zwei GitHub-Abläufe | `werkzeuge/vorschau-server.mjs`, `heim-server.mjs`, `versioniere-browser-ressourcen.mjs`, `.github/workflows/` |
| 10 | **Prüfwesen** | die Wächter und die Kette; was jeder festhält, steht im Kopf von `pruefe-alles.mjs` | `werkzeuge/pruefe-*.mjs`, `werkzeuge/helfer.mjs` |
| 11 | **Dokumentation** | dieses Verzeichnis und die zwei Changelogs | `docs/`, `README.md`, `CHANGELOG*.md` |

Tags und Zweignamen dazu stehen in [REGELN.md](REGELN.md), Regel 2 —
dort ist die eine Quelle, hier steht das Warum.

---

## Teil 2 · Wer redet mit wem, und warum

### Der Start im Browser, in dieser Reihenfolge

`index.html` lädt **sieben** klassische Skripte, danach genau ein Modul:

```
daten/welt.js          →  window.AGE_OF_BEAST_WELT
runtime/symbole.js     ┐
runtime/datenindex.js  │
runtime/ansichten.js   ├─ tragen sich in window.__aobLeserBausteine ein
runtime/interaktion.js │
runtime/routing.js     ┘
wiki.js                →  setzt window.ageOfBeast, startet
bearbeiten.js          (type="module", erst danach)
```

⚠️ **Es sind fünf `runtime/`-Dateien, nicht vier.** `symbole.js` kam mit
den Kategoriesymbolen dazu (Fassung 2.8.0) und steht in mehreren älteren
Dokumenten noch nicht — siehe „Was die alte Doku falsch sagt".

| Verbindung | Art | worüber | warum so |
| --- | --- | --- | --- |
| `runtime/*.js` → `wiki.js` | globaler Container | `window.__aobLeserBausteine` | Klassische Skripte statt Browser-Module: Sie laufen in fester Reihenfolge und brauchen keinen Bauschritt. Der Container ist **intern** — Bearbeitungsmodule fassen ihn nie an. |
| `wiki.js` → alle | Fassade | `window.ageOfBeast` mit `weltSetzen`, `weltHolen`, `beiNeuZeichnen`, `rahmenRendererRegistrieren`, `rahmenZeichnen` | Die Fassade steht, **bevor** zum ersten Mal nach `#inhalt` geschrieben wird. Sonst käme ein Deep Link beim harten Aufruf ins Leere. `pruefe-rahmen-routen.mjs` hält das fest. |
| `runtime/ansichten.js` → Bearbeitung | DOM-Vertrag | `data-eintrag`, `data-feld`, `data-abschnitt`, `data-panel`, `data-zeile` | Die Stifte finden ihre Stelle über diese Attribute. Sie zu ändern ist eine Vertragsänderung, kein Aufräumen. |
| `bearbeiten.js` → `werkzeuge/firestore-speicher.mjs` | Import | anmelden, lesen, schreiben, `darfSchreiben()` | Der einzige Weg zu den Daten. Das Firebase-SDK wird **erst beim Anmelden** geladen; die Besucheransicht lädt kein fremdes Skript. |
| `werkzeuge/firestore-speicher.mjs` → `firestore-format.mjs` | Import | Welt ⇄ Firestore-Dokumente | Die Welt wird nach Modul aufgeteilt, weil `daten/quelle.json` **660 KB** groß ist (675.840 Bytes, gemessen) und ein Firestore-Dokument bei 1 MB endet. Reine Logik, kein DOM, kein Netz — deshalb in Node prüfbar. |
| `werkzeuge/welt-dateien.mjs` → `welt-umwandeln.mjs` | Import | erzeugt `welt.json` und `welt.js` aus der Quelle | **Eine** Stelle legt das Dateiformat fest. Früher bauten `welt-aufbereiten.mjs` und der Browser die Dateien getrennt zusammen; ein Leerzeichen Unterschied genügte, und `pruefe-gleichstand.mjs` schlug an. |
| `bearbeiten.js` → `bearbeiten-kontext.js` → drei Module | eingefrorener Kontext | Rohstand lesen, Änderung anfordern, neu zeichnen, Fehler melden | Text-, Struktur- und Rahmenmodul hängen an einer beschriebenen Schnittstelle statt an verdeckten Globalen. `Object.freeze` verhindert, dass ein Modul dem anderen den Rückruf austauscht. |
| `texte-bearbeiten.js` → `werkzeuge/bearbeiten-stellen.mjs` → `text-schreibweise.mjs` | Import | Feld → Datenbankpfad; HTML ⇄ einfache Schreibweise | Im Eingabefeld steht **kein HTML**, sondern `## Überschrift`, `**fett**`, `- Punkt`. Beide Module kennen weder DOM noch Node — dieselbe Logik läuft im Browser und in der Prüfung. |
| `firestore.rules` → **Scotophobia** | geteilte Ressource | eine Regeldatei für zwei Projekte | Die gefährlichste Verbindung des Projekts. Sie hat ihr eigenes Dokument: [PROJEKTGRENZE.md](PROJEKTGRENZE.md). |
| `.github/workflows/*` → `werkzeuge/pruefe-*.mjs` | Sammelaufruf | jede Datei, die so heißt, wird einzeln gestartet | Ein neuer Wächter läuft dadurch automatisch in der CI mit — auch `pruefe-alles.mjs` und `pruefe-freigabe.mjs`. Wer eine Datei so nennt, macht sie zum Pflichtgate. |
| beide Server → Browser | Freigabeliste | `vorschau-server.mjs` und `heim-server.mjs` nennen jede erlaubte Datei einzeln | Kein Ordner wird pauschal freigegeben. Eine neue Browser-Datei muss dort **und** im Cache-Graphen eingetragen werden, sonst fehlt sie im Betrieb. |

### Der Altweg, der noch da ist

`werkzeuge/github-speicher.mjs` schrieb bis Fassung 3.0.0 die Welt über
die GitHub-Git-Data-API zurück ins Repository. **Kein Browserpfad führt
noch dorthin** — geprüft: nur `pruefe-github.mjs` importiert ihn, die
zwei Server führen ihn in ihrer Freigabeliste. Er bleibt als Rückweg
liegen; `pruefe-github.mjs` hält ihn funktionsfähig.

---

## Teil 3 · „Ich will X ändern — wo fasse ich an?"

| Ich will … | Dateien, in dieser Reihenfolge | Prüfung, die zuerst rot würde | Zweig |
| --- | --- | --- | --- |
| einen Text im Wiki ändern | gar keine — im Browser anmelden, „Bearbeiten", Stift | — | — |
| eine neue Kategorie anlegen | `daten/quelle.json` (über die Oberfläche), `werkzeuge/welt-umwandeln.mjs`, `runtime/symbole.js`, `styles/kategorien.css` | `pruefe-datenvertrag.mjs`, dann `pruefe-symbole.mjs` | `weltdaten/…` |
| das Aussehen ändern | `styles/tokens.css` zuerst, dann die Feature-Datei | `pruefe-stilstruktur.mjs` | `gestaltung/…` |
| eine neue Browser-Datei einführen | `index.html`, `werkzeuge/vorschau-server.mjs`, `werkzeuge/heim-server.mjs`, `werkzeuge/versioniere-browser-ressourcen.mjs` | `pruefe-cache-graph.mjs`, dann `pruefe-server-sicherheit.mjs` | `leseruntime/…` |
| ein neues bearbeitbares Feld | `runtime/ansichten.js` (Datenattribut), `werkzeuge/bearbeiten-stellen.mjs`, `texte-bearbeiten.js` | `pruefe-bearbeiten.mjs` | `bearbeiten/…` |
| ändern, wer schreiben darf | `firestore.rules` — **und vorher [PROJEKTGRENZE.md](PROJEKTGRENZE.md) lesen** | `pruefe-firestore-trennung.mjs` | `speicher/…` |
| einen Schritt im Rahmen-Assistenten | `daten/rahmen-felder.json`, `rahmen-assistent.js`, `werkzeuge/rahmen-felder-lesen.mjs` | `pruefe-datenvertrag.mjs` (Descriptor-Teil) | `werkstatt/…` |
| eine Kopfnotiz nachtragen | die Datei, dann ihre Zeile in [ALTLASTEN.md](ALTLASTEN.md) streichen | `pruefe-tags.mjs` | `pruefung/…` |
| veröffentlichen | nichts — Push auf `main` löst `pages.yml` aus | die ganze Kette, plus `pruefe-freigabe.mjs` | — |

Für jede Änderung gilt zusätzlich, immer: [WORKCLAIM.md](../WORKCLAIM.md)
lesen und eintragen · `CHANGELOG.md` oben ergänzen (technische Messungen
in `CHANGELOG-TECHNIK.md`) · `node werkzeuge/pruefe-alles.mjs` am Ende.

---

## Was die alte Doku falsch sagt

Acht Dokumente in `docs/` stammen vom 1. September 2026, also **vor** dem
Umzug nach Firestore (Fassung 3.0.0, Commit `56ec0ee`) und vor den
Kategoriesymbolen. Sie sind am 04.09.2026 Aussage für Aussage gegen den
Code gehalten worden; die Korrekturen stehen jeweils oben in der
betroffenen Datei. Die drei größten:

1. **Der Schreibweg geht nicht mehr über GitHub.** `bearbeiten.js`
   importiert `werkzeuge/firestore-speicher.mjs`; ein
   Fine-grained-Token wird nur noch **aufgeräumt**
   (`ALTE_SCHLUESSEL_ABLAGE`), nicht mehr angelegt.
2. **Es sind fünf `runtime/`-Dateien und fünf `styles/`-Dateien**, nicht
   je vier.
3. **Die Pakete A–H sind veröffentlicht.** `main` und `origin/main`
   stehen beide auf `cde2533`, 25 Commits nach dem Etikett `v2.7.0`, und
   jeder Push auf `main` veröffentlicht.
