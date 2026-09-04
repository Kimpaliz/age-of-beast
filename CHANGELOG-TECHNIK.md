# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden hier festgehalten.

Das Format orientiert sich an [Keep a Changelog](https://keepachangelog.com/de/1.1.0/),
die Versionierung an [Semantic Versioning](https://semver.org/lang/de/).

Eine Fassung desselben Protokolls in Alltagssprache liegt unter
[CHANGELOG.md](CHANGELOG.md).

## [Unveröffentlicht]

### Hinzugefügt

- **Spielwerte fuer Brix Borin** (`character-aob-xeno-sc`). Quelle ist
  die Werkstattfigur `werkstatt-figur-brix-borin` (Klasse, Unterklasse,
  Abstammung, Gemeinschaft, Attribute, Ausweichen, Ausruestung, Karten);
  die Klassenzahlen — Domaenen Midnight/Grace, HP 6, Basis-Ausweichen 12,
  `Rogue's Dodge`, `Cloaked & Sneak Attack`, Zauberattribut Finesse —
  aus `docs/daggerheart/REGELN-GRUNDLAGEN.md`, Zeile Rogue.
  **Zwei Gegenproben gingen auf:** Ausweichen 13 = Rogue-Basis 12 + 1
  durch das Gambeson-Merkmal *Flexible*; und die zwei Karten sind je eine
  aus seinen zwei Domaenen, beide Stufe 1.
- **Steckbrief und Verbindungen.** Neun Attributzeilen statt drei; neue
  Verbindungen zum Baubogen, zu Lukas und zum Volk `species-dh-ribbet`.
  Zwei Abschnitte aus dem Baubogen uebernommen (Erscheinung, Hintergrund).

### Behoben

- **`Spieler: Lukas` auf Xenos Figur** — Rest der urspruenglichen
  Fehlzuordnung. Ebenso `Charaktername: Noch nicht festgelegt` und der
  Abschnitt „Noch offene Angaben", der Volk, Gemeinschaft, Klasse und
  Hintergrund als offen fuehrte, obwohl sie seit dem 01.09. vorlagen.
- **Fuerwort durchgehend `sie` statt `er`** in Titel und Text des
  Abschnitts „Was am Tisch ueber ihn bekannt ist".
- **Schadensschwellen ohne Stufenbonus.** Die Regel lautet „Grundwert der
  Ruestung **plus eigene Stufe**"; im Bogen standen die Grundwerte der
  Ruestungstabelle. `spielwerte.ruestung` traegt jetzt `basisSchwer` /
  `basisErnst`, der Bogen rechnet und schreibt die Herkunft darunter.
  Lukas 6/13 → **7/14**, Brix 5/11 → **6/12**.
  Neu im Bogen: `fuerwort`, `klassengegenstand`, `ruestung.merkmal` —
  letzteres erklaert, warum das Ausweichen von der Klassenbasis abweicht;
  ohne die Zeile saehe der Wert nach einem Tippfehler aus.

### Bekannt

- **Zwei Eintraege heissen „Brix Borin"** (Figur und Baubogen). Bewusst
  nicht zusammengelegt: Der Werkstatteintrag entsteht beim naechsten
  Import neu. Sie sind stattdessen ueber die Verbindung „Baubogen"
  verknuepft. `Clank` ist aus demselben Grund doppelt.

### Behoben

- **Zweispaltiges Kartenraster unter 30rem.** `minmax(12rem, 1fr)` ergab
  bei 470 px Fensterbreite zwei Spalten à 228 px; dort liefen **25 von
  270** Karten ueber, obwohl `passendMachen()` bereits bis zur
  Untergrenze 0,58rem (9,3 px) geschrumpft hatte. Jetzt `1fr`.
  ⚠️ **Der Fall war in der ersten Pruefung unsichtbar**, weil ich
  `main.style.width` gesetzt habe statt der Fensterbreite — Media
  Queries folgen dem Viewport, die Regel loeste nie aus. Derselbe Fehler
  war kurz zuvor schon bei der Kopfleiste passiert.
  **Gemessen mit echten Viewports** (375/470/500/820/1100/1140/1420/
  1600/1920): ueberall **0** Ueberlaeufe, kleinste Schrift durchgaengig
  10,48 px — die Anpassung muss gar nicht mehr eingreifen. Schmalste
  Karte real 270 px (bei 1140 und 1420, kurz bevor eine Spalte
  dazukommt).
  Nebenbefund: Eine emulierte Viewport-Aenderung loest **kein**
  `resize`-Ereignis in der Seite aus. Eine Messung nach blossem
  Umschalten der Groesse zeigt deshalb einen Ueberlauf, den ein frischer
  Aufruf derselben Breite nicht hat.

### Hinzugefügt

- **Charakterbögen** (`bogen.html`, `karte/bogen-zeigen.js`,
  `styles/charakterbogen.css`). Gezeichnet wird aus `eintrag.spielwerte`;
  die Struktur liegt in `daten/quelle.json` unter `fields.spielwerte` und
  wird von `welt-umwandeln.mjs` unveraendert durchgereicht. Fehlende
  Angaben erscheinen als sichtbares „noch offen", nie als weggelassenes
  Feld.
  **Gemessen:** 23 Textstellen, beide Schemata, Mindestkontrast 6,07
  (hell) und 6,17 (dunkel) gegen gefordert 4,5. Sieben Beschriftungen von
  `--schrift-leise` (3,05–3,54) auf `--schrift-matt` gehoben.
  ⚠️ Die Kontrastmessung ging dreimal daneben, bevor sie stimmte: erst
  wurde der **eigene** durchsichtige Hintergrund eines `<span>` gemessen
  (Ergebnis 1,52 und 11.837.750), dann scheiterte der Parser an
  `oklab()`-Werten aus `color-mix` und las eine helle Flaeche als
  Schwarz. Erst das Aufloesen ueber eine Zeichenflaeche misst wirklich.

### Geändert

- **`werkzeuge/welt-rahmen.mjs` aus `welt-umwandeln.mjs` herausgeloest**
  (147 Zeilen: `angaben`, `rahmenPanelRoh`, `rahmenAlsElement`,
  `mitRahmen`, `BILD_VORGABE`). Anlass war der Altlasten-Ratchet: Fuer
  `spielwerte` musste die Datei um 7 Zeilen wachsen, und Regel 10
  verlangt, dass ein fachlicher Eingriff ein Stueck der Abloesung zahlt.
  **582 → 471 Zeilen**, damit unter 500 und aus `docs/ALTLASTEN.md`
  gestrichen.
  **Beweis:** `daten/welt.json` und `daten/welt.js` geloescht, neu
  erzeugt, **bytegleich** (240.029 und 240.143 Bytes). `alsAbsaetze` wird
  durchgereicht statt importiert (Ringbezug); die acht `rahmenPanel`-
  Aufrufe blieben unangetastet, weil ein lokaler Kurzname die alte
  Signatur behaelt — dadurch ist der Umbau an den Bytes nachweisbar.
- **Umbruchschwelle der Modulleiste 68rem → 78rem.** Vier beschriftete
  Knoepfe brauchen gemessen 1221 px (bei 1200 fehlten 21, bei 1260
  passte es); die alte Schwelle lag bei 1088. Dazwischen lag ein Band, in
  dem die Beschriftungen standen, aber nicht passten. Sechs Fensterbreiten
  von 375 bis 1400 px geprueft: kein Ueberlauf, keine Ueberlappung.
- **`pruefe-firestore-trennung.mjs`: Zuordnung folgt dem Praefix, nicht
  der Datei.** Seit beide Repositorys dieselbe vollstaendige Regeldatei
  fuehren, stehen die `wiki_`-Bloecke auch in Scotophobias Fassung — der
  Waechter hielt sie daraufhin fuer Scotophobia-Sammlungen und meldete
  die Trennung als verletzt. Betroffen waren die Zuordnung **und** die
  Wahl des Selbsttest-Opfers.

### Behoben

- **Rollbalken auf einzelnen Spielkarten.** `data-enge` staffelt die
  Schriftgroesse nach Textlaenge, war aber bei 306 px Kartenbreite
  eingestellt. Das Raster (`minmax(16.5rem, 1fr)`) erzeugt als schmalste
  Karte **264 px**; dort liefen 6 von 270 Karten ueber — `Syndicate`,
  `Warden of the Elements` (Foundation und Mastery), `Book of Vagras`,
  `Teleport`, `Forager`.

  Eine feinere Staffelung traegt nicht: Bei 264 px gemessen braucht eine
  Karte mit 601 Zeichen 0,659 rem, eine mit 627 Zeichen dagegen 0,687 —
  die Zeichenzahl sagt den Platzbedarf nicht genau genug voraus, weil
  Merkmalsueberschriften und Absaetze eigene Hoehe tragen.

  `passendMachen()` in `karte/karten-zeigen.js` verkleinert deshalb nur,
  was wirklich ueberlaeuft, in 0,015-rem-Schritten bis zu einer Untergrenze
  von 0,58 rem. Vor dem Messen wird `style.fontSize` geleert, sonst bliebe
  eine einmal geschrumpfte Karte nach dem Vergroessern des Fensters klein.
  Laeuft nach jedem `zeichnen()` und 150 ms nach dem letzten `resize`.

  **Gemessen:** 12 von 270 Karten angepasst, 279 Layoutschritte, **29 ms**
  gesamt; kleinste Schrift 10 px. Bei zehn Fensterbreiten von 380 bis
  1900 px je **0** Ueberlaeufe, und nach dem Zuruecksetzen ist die kleinste
  Schrift wieder 10,48 px. Gegenprobe: ohne die Anpassung sind es bei
  265 px Kartenbreite wieder genau 6.

  Der Rollbalken (`overflow-y: auto`) bleibt als letzter Ausweg — Text
  auszublenden waere die schlechtere Havarie.

### Geändert

- **`firestore.rules` wird jetzt auch von Scotophobia in voller Fassung
  gefuehrt.** Das Projekt `kampagnenrahmen-jt` hat eine Datenbank und
  damit eine Regeldatei; der Spark-Plan erlaubt keine zweite. Scotophobias
  Teilfassung loeschte bei jedem Deploy die `wiki_`-Bloecke — am
  04.09.2026 viermal, einmal 68 s nach einer Reparatur. Beide Repositorys
  fuehren nun dieselbe Datei (18.823 Zeichen), und `pruefe-firestore-wiki.mjs`
  dort sichert es spiegelbildlich zu `pruefe-firestore-trennung.mjs` hier.


### Alpha-Code nachgerüstet – 2026-09-04

Gerüst, Wächter und Karten der Alpha-Code-Methode. **Kein Verhalten
geändert:** keine bestehende Quelldatei, kein Stylesheet, kein Datensatz,
keine Regeldatei, kein Workflow angefasst. Belegt durch `git status`: acht
geänderte Dateien, alle unter `docs/`, alle nur um einen Korrekturkasten
ergänzt.

#### Neu

`CLAUDE.md` · `WORKCLAIM.md` · `alpha-code.json` · `docs/REGELN.md` ·
`docs/WEGWEISER.md` · `docs/ALTLASTEN.md` · `docs/PROJEKTGRENZE.md` ·
`docs/FEHLERBUCH.md` · `.claude/PROJEKTPROFIL.md` ·
`werkzeuge/helfer.mjs` und acht Wächter, dazu `werkzeuge/pruefe-alles.mjs`
als Einstieg.

#### Messungen

| Größe | Wert | Befehl |
| --- | ---: | --- |
| Quelldateien (`.js`/`.mjs`, ohne `daten/`) | 56 | `alpha-code.json` → `quellDateien()` |
| davon ohne Kopfnotiz | 47 | `node werkzeuge/pruefe-tags.mjs` |
| Wächter vorher / nachher | 15 / 23 | `ls werkzeuge/pruefe-*.mjs \| wc -l` |
| Kette vorher, 15 Wächter nacheinander | 24,2 s, 15 grün / 0 rot | eigener Lauf |
| Kette jetzt, 21 Wächter parallel + Syntax | **12,2 s, alles grün** | `node werkzeuge/pruefe-alles.mjs` |
| syntaxgeprüfte Dateien | 57, davon 13 als ES-Modul über stdin | ebenda |
| Textdateien in der Geheimnissuche | 330 | `node werkzeuge/pruefe-geheimnisse.mjs` |
| Markdown-Verweise geprüft | 53 auf 19 Seiten | `node werkzeuge/pruefe-verweise.mjs` |
| Git-Historie für `pruefe-freigabe.mjs` | 4.086.314 Zeichen in 148 ms | `git log --all -p --no-color` |
| Altlasten über 500 Zeilen | 5 | `node werkzeuge/pruefe-altlasten.mjs` |
| `daten/quelle.json` | 675.840 Bytes | `ls -l daten/quelle.json` |

Alle Zahlen gelten auf dem Zweig `einrichtung/alpha-code`. Der parallele
Zweig `welt/karte-und-figuren` bringt sieben weitere Quelldateien und
einen sechzehnten Fachwächter mit — beim Zusammenführen ändern sich die
ersten vier Zeilen.

#### Drei Anpassungen an der Skill-Vorlage, jede begründet

1. **`pruefe-geheimnisse.mjs` liest `geheimnisAusnahmen`** statt
   `ausnahmen`. Die Vorlage teilt sich die Liste mit der
   Quelldateiauswahl, in der hier `daten` und `docs` stehen — **251
   Dateien wären nie durchsucht worden**. Die Prüfung meldet jetzt
   zusätzlich, wie viele Dateien sie angesehen hat, und schlägt bei unter
   hundert an. Fehlerbuch **E3**.
2. **`pruefe-tags.mjs` bekommt einen Ratchet.** 47 Dateien ohne
   Kopfnotiz lassen sich nicht anfassen, solange mehrere Sitzungen im
   selben Checkout arbeiten. Sie stehen namentlich in
   `docs/ALTLASTEN.md`; jede *andere* Datei muss ihren Tag tragen. Neu ist
   außerdem eine Prüfung gegen Karteileichen in dieser Liste.
3. **Die Syntaxprüfung in `pruefe-alles.mjs` läuft über die
   Standardeingabe** (`node --input-type=module --check`) statt über
   Dateien, und über **alle** `.js` statt nur über die Quellordner —
   `daten/welt.js` wird vom Browser geladen, ein Tippfehler darin wäre
   ein weißer Bildschirm.

   Gemessen auf Node v24.16.0: `node --check bearbeiten.js` besteht,
   weil die Modulerkennung seit Node 22.7 von selbst greift; mit
   `--no-experimental-detect-module` fällt derselbe Aufruf durch
   („Cannot use import statement outside a module"). Die Prüfung soll
   nicht an einer Voreinstellung hängen. Die Workflows lösen dasselbe
   mit temporären `.mjs`-Kopien — die wären hier eine Schreiboperation
   im Repository, die `pruefe-arbeitsweise.mjs` als offene Änderung
   sähe. Die stdin-Form steht so schon in `docs/RELEASE_RUNBOOK.md`.

#### Rot-Beweis — 14 Beschädigungen, jede zurückgenommen

Ein Wächter, der nie rot war, prüft womöglich nichts. Jede Zusicherung
wurde einzeln gebrochen:

| Wächter | Beschädigung | Meldung |
| --- | --- | --- |
| `pruefe-tags` | Tag aus `helfer.mjs` entfernt | „ohne Tag: werkzeuge/helfer.mjs" |
| `pruefe-tags` | Tag auf `[Aufgabe: Quatsch]` gesetzt | „unbekannter Tag „Quatsch"" |
| `pruefe-tags` | erfundene Datei auf die Nachrüstliste | „Nachrüstliste zeigt ins Leere: gibtesnicht.js" |
| `pruefe-altlasten` | zwei Zeilen an `welt-umwandeln.mjs` angehängt | „Altlast gewachsen: … (582 → 584)" |
| `pruefe-altlasten` | neue Datei mit 521 Zeilen | „über 500 Zeilen und nicht als Altlast geführt" |
| `pruefe-verweise` | Verweis auf `docs/GIBT-ES-NICHT.md` | „tot: CLAUDE.md → docs/GIBT-ES-NICHT.md" |
| `pruefe-workclaim` | Spalte „Seit" in „Wann" umbenannt | „die Anspruchstabelle hat die vier Spalten …" |
| `pruefe-workclaim` | Anspruch ohne Besitzer, Ziel und Zeit | „unvollständig: \| werkzeuge/ \| \| \| \|" |
| `pruefe-geheimnisse` | Token-Muster in eine Datei unter `docs/` | „GitHub-Token in docs/…" |
| `pruefe-geheimnisse` | **alte gemeinsame Ausnahmeliste wiederhergestellt** | „77 Dateien — unter 100 heißt: eine Ausnahme greift zu weit" |
| `pruefe-geheimnisse` | `probe.zip` angelegt | „verbotenes Format: probe.zip" |
| `pruefe-arbeitsweise` | beide Changelogs zurückgesetzt | „26 Datei(en) geändert, CHANGELOG.md nicht darunter" |
| `pruefe-arbeitsweise` | `hauptzweig` auf den Arbeitszweig gesetzt | „auf `einrichtung/alpha-code` wird nicht gearbeitet" |
| `pruefe-freigabe` | `{{OFFENER_PLATZHALTER}}` in `REGELN.md` | „kein Vorlagen-Platzhalter mehr in der Doku · 1 offen" |
| Syntax in `pruefe-alles` | `runtime/probe-kaputt.js` mit `const a = ;` | „SyntaxError: Unexpected token ';'" → `FEHLGESCHLAGEN Syntax` |

Die zehnte Zeile ist die aufschlussreichste: Mit der ursprünglichen
gemeinsamen Ausnahmeliste hätte die Prüfung den Token unter `docs/`
**nicht gefunden** und trotzdem grün gemeldet. Gefangen hat ihn erst die
neue Zusicherung „die Suche hat den Bestand wirklich gesehen".

#### Acht Fehlbeschriftungen in der bestehenden Doku

Alle acht Dokumente vom 01.09.2026 wurden Aussage für Aussage gegen den
Code gehalten und tragen jetzt oben einen Korrekturkasten. Die drei
folgenreichsten: Der Schreibweg geht nach **Firestore**, nicht nach
GitHub (`bearbeiten.js` importiert `werkzeuge/firestore-speicher.mjs`);
es sind **fünf** `runtime/`- und **fünf** `styles/`-Dateien, nicht je
vier; und die Pakete A–H sind **veröffentlicht** (`main` = `origin/main`
= `cde2533`, 25 Commits nach `v2.7.0`).

#### Bewusst nicht geändert

- **Keine Kopfnotizen eingesetzt** (Schritt 5 der Methode). Er berührt
  alle 47 Dateien und kollidiert mit paralleler Arbeit. Vorbereitet:
  Systemtabelle, Tags, namentliche Liste.
- Keine der 15 bestehenden Fachprüfungen angefasst.
- Kein Stylesheet, kein Datensatz, `firestore.rules` nicht, die beiden
  Workflows nicht — obwohl `pruefe-alles.mjs` und `pruefe-freigabe.mjs`
  dort mitgesammelt werden und die Kette in der CI dadurch zweimal läuft.
  Das ist doppelte Arbeit, kein Fehler; es zu ändern wäre ein eigener
  Auftrag.
- Ein Selbstwiderspruch in `stil.css` bleibt stehen: Der Kommentar spricht
  von „die vier Imports", darunter stehen fünf. Die Datei gehört nicht in
  diesen Auftrag.

#### Rückrollweg

Der Zweig `einrichtung/alpha-code` enthält alles in einem Commit; `main`
steht unverändert auf `cde2533`. Nichts gepusht, nichts deployt, keine
Firebase-Regel und kein Datensatz berührt.

## [3.0.0] – 2026-09-02

Weltdaten in Firestore, Anmeldung über Google. Der GitHub-Schlüssel als
Schreibweg entfällt.

### Warum

Der Schreibweg aus 2.0.0 funktionierte — am 01.09.2026 wurde darüber
gespeichert (Commit `0f09f40`, nur Zeitstempel im Diff). Die Hürde war der
Token selbst: fein zuschneiden, von Hand erzeugen, in den Browser kopieren.
Für einen einzelnen Bearbeiter machbar, für jeden weiteren dieselbe Prozedur —
und der Token liegt danach im Browser statt bei einem Anbieter, der ihn
erneuern kann.

Der Grund für diese Bauart war real: Auf reinem Statik-Hosting gibt es keine
Stelle, die eine Anmeldung nachprüfen könnte. Firebase ist genau diese Stelle.
Die Prüfung liegt in `firestore.rules` und damit außerhalb des Browsers.

### Hinzugefügt

- `werkzeuge/firestore-format.mjs`: Zerlegung der Welt in Dokumente und
  zurück. Reine Logik, ohne DOM und ohne Node-Bausteine, deshalb ohne Netz
  prüfbar.
- `werkzeuge/firestore-speicher.mjs`: Lesen über REST, Anmeldung und
  Schreiben über das SDK.
- `firebase-konfig.js`: die öffentliche Web-Konfiguration.
- `firestore.rules`: Regeln für **beide** Anwendungen im Projekt.
- `werkzeuge/pruefe-firestore-trennung.mjs`: 135 Prüfungen gegen die
  Deploy-Falle.
- `werkzeuge/pruefe-firestore-format.mjs`: Umlaufprüfung der Zerlegung.
- `werkzeuge/welt-hochladen.mjs`: einmalige Erstbefüllung, ohne `--wirklich`
  ein reiner Trockenlauf.

### Aufteilung der Welt

`daten/quelle.json` misst 483 KB. Als ein Dokument abgelegt, schriebe jede
geänderte Zeile die ganze Datei neu. Aufgeteilt wird deshalb nach Modul:

| Dokument | Größe |
| --- | --- |
| regeln | 260.4 KB |
| species | 151.0 KB |
| factions | 25.2 KB |
| wiki | 25.1 KB |
| werkstatt | 8.6 KB |
| items | 4.8 KB |
| characters | 4.0 KB |
| _rahmen | 3.1 KB |
| _kopf | 1.1 KB |

Der Inhalt liegt als JSON-**Zeichenkette** in einem Feld, nicht als
verschachteltes Firestore-Objekt. Firestore beschränkt Feldnamen, verbietet
Arrays in Arrays und begrenzt die Verschachtelung; die Weltdaten halten sich
an nichts davon. Als Zeichenkette kommt exakt zurück, was hineinging — und
genau das lässt sich zeichenweise nachprüfen. Abgefragt wird auf Feldern
ohnehin nie, das Wiki liest immer die ganze Welt.

### Zwei Wege statt einem

**Lesen** über die Firestore-REST-Schnittstelle mit gewöhnlichem `fetch`.
Kein SDK, kein fremdes Skript, keine Anmeldung. Die Alternative wäre überall
das SDK gewesen — dann zöge jeder Besucher rund ein halbes Megabyte fremden
Code nach, nur um Text zu lesen.

**Schreiben** über das SDK, dynamisch importiert beim Anmelden. Token-Erneuerung
und Fehlerbehandlung von Hand nachzubauen wäre fahrlässig.

### Zwischenspeicher im Browser

Ein voller Abruf sind zehn Lesevorgänge, ein Standabruf einer. Der Browser
merkt sich die zuletzt geholte Welt samt Standkennung; beim nächsten Besuch
genügt der Standabruf, solange sich nichts geändert hat.

**Ein Entwurfsfehler dabei, vor dem Bauen bemerkt:** Der erste Ansatz verglich
gegen den in `daten/welt.js` mitgelieferten Stand. Das hätte nie gegriffen —
die Datei ändert sich nur bei einer Veröffentlichung des Repositories,
während in Firestore laufend gespeichert wird. Der Vergleich läuft deshalb
gegen den im Browser gemerkten Stand.

### Nebenläufigkeit

`weltSchreiben()` schreibt nur die Dokumente, deren Inhalt sich wirklich
geändert hat — eine Textänderung an einer Spezies berührt eins statt zehn.

Der Schutz gegen gleichzeitiges Bearbeiten liegt in einer Transaktion: Sie
liest die betroffenen Dokumente erneut und bricht ab, wenn ihr Stand nicht
mehr der ist, auf dem die Änderung beruht.

### Trennung von Scotophobia

Firestore hat pro Datenbank genau **eine** Regeldatei, und der Spark-Plan
erlaubt keine zweite Datenbank (`billingEnabled: false`, gemessen). Ein
Deploy der Wiki-Regeln allein würde Scotophobia abschalten.

`werkzeuge/pruefe-firestore-trennung.mjs` macht das mechanisch unmöglich: Es
liest Scotophobias Regeldatei aus deren Repository, prüft die drei Blöcke auf
Wortgleichheit und schlägt an, wenn einer fehlt oder entschärft wurde. Der
Wächter belegt seine eigene Wirksamkeit an sechs absichtlichen
Beschädigungen — ein Wächter, der nie rot wird, prüft nichts.

Die Freigabelogik ist getrennt: eigene Sammlungen `wiki_welt` und
`wiki_zugang`, eigene Funktionen `istWikiAdmin()` und `istWikiSchreiber()`.
Scotophobias `istFreigeschaltet()` wird nicht wiederverwendet.

### Behoben

- `darfSchreiben()` prüfte anfangs nur den Freigabeeintrag in `wiki_zugang`.
  Für den Verwalter gibt es dort keinen — ausgerechnet er hätte sich anmelden
  können und keinen Stift bekommen. Die Admin-Prüfung steht jetzt vor der
  Abfrage, wie in `istWikiAdmin()` der Regeln.

### Bekannte Einschränkung

`werkzeuge/pruefe-stilstruktur.mjs` friert die vier Ursprungs-Stildateien über
eine SHA-256-Summe ein. Der Beweis gilt der Aufteilung — er verhindert aber
auch jede spätere legitime Änderung an ihnen, etwa das Entfernen der nun
toten Stile des früheren Schlüsseldialogs. Beim Nachziehen eines Kommentars
in dieser Fassung ist die Prüfung angeschlagen; die Änderung wurde
zurückgenommen. Sauber wäre, den historischen Beweis gegen den Git-Stand des
Aufteilungs-Commits zu führen statt gegen die Arbeitskopie.

### Der Zwischenfall vom 04.09.2026 — die Falle ist eingetreten

Zwischen dem ersten Deploy (02.09.) und dem Zusammenführen nach `main`
wurde Scotophobias Teilfassung veröffentlicht. Folge: Die Wiki-Regeln waren
weg, jeder Lesezugriff auf `wiki_welt` antwortete mit 403. Bemerkt beim
Abgleich vor dem Merge, nicht durch eine Meldung — der Deploy selbst hatte
Erfolg gemeldet.

Umgekehrt war die Wiki-Datei inzwischen ebenfalls veraltet: Scotophobia hatte
acht Hilfsfunktionen und zwei Sammlungen (`feedbackbewertungen`,
`feedbackquoten`) dazubekommen, die Regeldatei war von 4.822 auf 11.198
Zeichen gewachsen. **Ein Deploy der Wiki-Fassung hätte nun umgekehrt
Scotophobia beschädigt** — und genau das hat `pruefe-firestore-trennung.mjs`
verhindert: elf Meldungen, Rückgabewert 1.

Behoben, indem die Datei aus Scotophobias aktueller Fassung neu gebaut wurde.
Der Wiki-Teil wird dabei geschnitten, nie abgetippt.

### Ein eigener Fehler beim Neubau

Der erste Neubau wurde von Firebase abgelehnt (`INVALID_ARGUMENT`, ohne
Zeilenangabe). Ursache: Der Schnitt suchte nach `/* ══` mit
Unicode-Doppelstrichen, in der Datei stehen gewöhnliche Gleichheitszeichen.
Der Rückfall traf eine Zeile **innerhalb** des Kommentars — das öffnende
`/*` fehlte, das schließende blieb stehen, und Firestore las den
Kommentartext als Code.

**Die Klammerbilanz war dabei ausgeglichen und hat nichts gemerkt:** 16 zu 16,
weil der neu geschriebene Trennkommentar das fehlende Zeichenpaar zufällig
ersetzte. Eine ausgeglichene Bilanz beweist keine heile Struktur.

Der Wächter zählt jetzt der Reihe nach statt in Summe: Ein `*/` ohne offenen
Kommentar ist ein Fehler. Rot bewiesen an genau dieser Beschädigung.

Der Schnitt selbst sucht den Anfang nicht mehr über eine Zeichenfolge, sondern
über die Struktur — das letzte `/*` vor der ersten Wiki-Funktion — und prüft
danach, dass das Stück in sich geschlossen ist.

### Nicht entfernt

`werkzeuge/github-speicher.mjs` und `werkzeuge/pruefe-github.mjs` bleiben
liegen. Sie werden von keiner Seite mehr geladen, sind aber der belegte
Rückweg, solange der erste echte Schreibvorgang über Firestore aussteht.


## [2.8.0] – 2026-09-02

Kategoriesymbole als SVG-Sprite, eigene Farbtöne für alle zehn Kategorien
und ein Wächter, der beides misst statt behauptet.

### Hinzugefügt

- `runtime/symbole.js`: klassischer Leserbaustein mit zehn Motiven als
  24×24-Pfade, `sprite()` für den einmaligen `<symbol>`-Vorrat und
  `symbol(kategorie, klasse)` für die `<use>`-Verweise. Der Baustein fasst
  kein DOM an; er liefert Zeichenketten.
- `styles/kategorien.css`: Symbolgestaltung und je Kategorie ein Block, der
  nur die Akzentvariablen überschreibt — dasselbe Muster, das Werkstatt und
  Regeln bereits nutzen. Kachel, Rand, Schein und Etikett folgen daraus.
- `werkzeuge/pruefe-symbole.mjs`: 505 Prüfungen. Führt `runtime/symbole.js`
  in einer VM aus und misst gegen `KATEGORIEN` aus `welt-umwandeln.mjs`.
- Symbole an fünf Stellen: Kachel (Plakette), Navigation, Filterknöpfe,
  Kopfzeile der Kategorieseite, Kategoriezeile der Eintragsseite.

### Geändert

- `werkzeuge/welt-umwandeln.mjs` exportiert `KATEGORIEN`, damit die Prüfung
  gegen die Quelle statt gegen eine Kopie messen kann.
- `werkzeuge/pruefe-stilstruktur.mjs` unterscheidet jetzt `STIL_TEILE`
  (die vier Teile der ursprünglichen Aufteilung) von `STIL_ZUSATZ`. Der
  SHA-256-Beweis, dass die Aufteilung nichts verloren hat, läuft weiterhin
  ausschließlich über die vier Ursprungsteile — sonst hätte die erste neue
  Datei diese Aussage entwertet.
- `werkzeuge/pruefe-rahmen-routen.mjs` ordnet den Quellvertrag über den
  Dateinamen statt über `runtimeQuelltexte[3]` zu. Der feste Index zeigte
  nach dem Hinzufügen einer Runtime-Datei auf die falsche Quelle. Die
  DOM-Attrappe kennt jetzt `insertAdjacentHTML`, `document.body` und
  `document.querySelector`, damit der Symbolpfad wirklich durchlaufen wird.
- `werkzeuge/vorschau-server.mjs` und `werkzeuge/heim-server.mjs` geben die
  zwei neuen Dateien frei. Beide arbeiten mit einer Positivliste; ohne den
  Eintrag antworten sie mit 403.

### Farbmessung statt Augenmaß

Abstände in OKLab, weil gleiche Zahlenabstände dort ungefähr gleichen
wahrgenommenen Abständen entsprechen. In sRGB gemessen wäre „weit
auseinander" eine Behauptung.

Zwei Kollisionen im dunklen Stil, beide gemessen:

| Paar | vorher | nachher |
| --- | --- | --- |
| items / regeln | 0.065 | 0.092 |
| events / werkstatt | 0.050 | über 0.10 |

Im hellen Stil lagen **elf** Paare unter der Schwelle, das engste bei 0.031.
Ursache ist strukturell: Auf hellem Grund brauchen alle Töne wenig
Helligkeit, wodurch das nutzbare Band schrumpft. Sieben Töne wurden per
lokaler Suche neu bestimmt — Farbwinkel je Kategorie festgehalten (er trägt
die Bedeutung), Helligkeit und Sattheit frei, Zielgröße der kleinste
Paarabstand.

Erster Lauf ohne Helligkeitsschranke lieferte formal bessere Werte
(0.102) und optisch ein anderes Wiki: `#10103d` statt Violett für die
Leitfarbe. Mit der Schranke L 0.38…0.58 bleibt 0.083 — und das engste Paar
ist `wiki`/`regeln`, also bestehende Gestaltung.

Schwellen: Abstand ≥ 0.08, Kontrast ≥ 4.5:1 gegen den jeweiligen Grund.
Gemessen liegt der schwächste Kontrast bei 5.37:1.

### Zwei Fehler in der eigenen Prüfung

1. Die erste Fassung las jede Zahl im Pfad als absolute Koordinate. In
   `h-11` ist die −11 aber ein relativer Schritt. Gemeldet wurden Fehler,
   die es nicht gab. Der Pfad wird jetzt abgelaufen; für Kurven genügen
   Stütz- und Endpunkte, weil eine Bezierkurve ihre Hülle nie verlässt.
2. Der Tokenizer verlangte einen Ziffernanfang und las aus `.8` eine `8`.
   Dadurch schienen drei Pfote-Pfade das Feld bei 25.4, 24.9 und 28.3 zu
   verlassen. Das Muster fasst jetzt auch Zahlen ohne führende Null.

### Verifiziert

- 505 Prüfungen in `pruefe-symbole.mjs`, alle 13 Wächter grün.
- Im Browser gegengeprüft: 10 `<symbol>` im Sprite, 58 Plaketten auf der
  Startseite, 72 Symbole im Dokument; Kachel, Navigation, Filter,
  Kategorieseite und Eintragsseite einzeln belegt.
- Helle Ansicht gemessen statt geschätzt: Der dunkle Streifen im
  Vorschaubild war eine eingefrorene Compositing-Ebene
  (`position: sticky` mit eigenem Scrollbereich) — die berechneten Farben
  waren durchgehend korrekt, nach einem Scroll auch die Darstellung.



### Geändert

- Inhaltliche Umbenennung in der Realtime Database (Quelle, nicht Repository):
  `elements/wiki/wiki-sturmwende-kampagnenframe/name` sowie `html` und
  `text` des ersten `textFields`-Eintrags von `customPanels[0]` von
  „Sturmwende" auf „Age of Beast". Drei Schreibvorgänge, jeder einzeln per
  `PUT` auf den Blattknoten; kein Überschreiben ganzer Teilbäume.
  Vollsicherung des Knotens vor dem Schreiben unter
  `RPG/backups/age-of-beast-umbenennung-20260824/kampagnenframe-vorher.json`.
  Schlüssel und IDs (`wiki-sturmwende-kampagnenframe`,
  `panel-sturmwende-*`, `text-sturmwende-grundidee`) bleiben unverändert.
- `daten/welt.json`, `daten/welt.js` und
  `werkzeuge/rohdaten-weltenschmiede.json` entsprechend neu erzeugt.
  Bilanz unverändert: 29 Einträge, 93 Panel-Abschnitte, 45 Wörterbucheinträge.
  Der Wörterbuchschlüssel lautet jetzt `kampagnen-frame: age of beast`.

Ohne Versionsnummer: reine Inhaltsänderung an der Quelle, keine Änderung am
Wiki-Code.

## [2.7.0] – 2026-08-26

234 erzeugte Kartenwappen als SVG, dazu die erste Bildunterstützung im
Wiki überhaupt.

### Hinzugefügt

- `werkzeuge/kartenbilder-erzeugen.mjs`: erzeugt je Karte ein SVG-Wappen
  aus Domänenfarbe, Domänenmotiv und einem aus dem Kartennamen
  berechneten Sternmuster. Neun Domänen plus Ancestry, Community und
  Subclass, jeweils mit eigenem Motiv (Rune, Klinge, Knochen, Buch, Welle,
  Mond, Blatt, Sonne, Schild, Spirale, Ring, Stern).
  `--proben` erzeugt nur je ein Beispiel zum Ansehen.
- `daten/kartenbilder/` mit 234 Dateien, in derselben Ordnung wie die
  Bilder der Werkstatt (ancestry, community, subclass, domains/<domäne>).
- `bild` am Eintrag in `welt-umwandeln.mjs`, gefiltert durch `bildPfad()`.
- Anzeige in `wiki.js` als `figure.eintrag-bild` über dem Fließtext,
  Gestaltung in `stil.css`.

### Warum erzeugt statt übernommen

Die Originalbilder sind offizielle Illustrationen von Darrington Press.
Weiterverbreitung über ein öffentliches Repository ist etwas anderes als
private Nutzung. Bis Fassung 2.2.0 stand deshalb nur ein Hinweistext an
ihrer Stelle; jetzt gibt es Ersatz statt einer Lücke.

Die Domänenfarben aus `DOMAIN_COLORS` der Werkstatt werden übernommen.
Farbwerte sind keine schützenswerte Gestaltung, sondern die Ordnung des
Spiels — eine Arcana-Karte muss violett bleiben, sonst stimmt die Zuordnung
am Tisch nicht mehr.

### Warum SVG

| | WebP-Original | SVG-Wappen |
| --- | --- | --- |
| je Bild | 28,7 KB | 2,65 KB |
| 234 zusammen | 8,4 MB | 621 KB |
| Auflösung | fest 1600×850 | beliebig |

Dazu: Die Domänenfarbe steht als Wert in der Datei und lässt sich ändern,
ohne neu zu zeichnen.

### Bestimmtheit

Die Erzeugung ist bewusst reproduzierbar: `saatAus()` bildet den
Kartennamen auf eine Zahl ab, `wuerfler()` macht daraus eine feste Folge
(Xorshift). Derselbe Name ergibt immer dasselbe Bild.

Ohne das hätte jeder Lauf alle 234 Dateien geändert und jeden Diff
unbrauchbar gemacht. Nachgewiesen: Zwei Läufe hintereinander, Prüfsummen
aller 234 Dateien verglichen — kein Unterschied.

### Sicherheitsleine für Bildpfade

`bildPfad()` in `welt-umwandeln.mjs` lässt nur Pfade unterhalb von `daten/`
durch, ohne `..`. Eine fremde Adresse würde die Seite von außen abhängig
machen; ein eingebettetes `data:`-Bild würde `quelle.json` um Hunderte
Kilobyte aufblähen — genau der Fehler, den die Werkstatt beim Clank-Bild
gemacht hat (386 KB Base64 in einem Datensatz von 388 KB).

### Behoben

- Die Steckbriefzeile „Illustration" nannte den Künstler der offiziellen
  Karte. Beim eigenen Wappen ist das eine falsche Zuschreibung; die Zeile
  ist entfernt, im Übernehmer wie in den Daten.
- `loading="lazy"` am Eintragsbild entfernt. Es steht direkt unter der
  Überschrift, also ohnehin im Blick — verzögertes Laden bringt dort nichts
  und lässt die Seite beim Nachladen springen. Aufgefallen ist es, weil das
  Bild in der Prüfansicht gar nicht lud: Ohne Darstellung tritt ein
  lazy-Bild nie in den sichtbaren Bereich.

### Verifiziert

- 234 Dateien erzeugt, 621,1 KB zusammen, im Schnitt 2,65 KB.
- Zweiter Lauf: alle 234 Prüfsummen identisch.
- Alle 234 als wohlgeformtes SVG geprüft (Wurzelelement, ausgeglichene Tags).
- Ausgeliefert mit `image/svg+xml`, im Wiki geladen, 320×170.
- Keine Zeichenfolge `Mat Wilma` und kein `data:image` in den Daten.
- Wiki gesamt 2,6 MB gegenüber 1 GB Grenze bei GitHub Pages.
- Alle fünf Prüfskripte bestanden.


## [2.6.0] – 2026-08-26

Die Werkstatt bekommt einen eigenen Platz in der Kopfzeile und eine eigene
Seite. Die eingebettete Firebase-Werkstatt ist entfernt.

### Entfernt — und warum

Fassung 2.3.0 hatte `daggerheart-werkstatt-jt.web.app` als `iframe`
eingebettet. Das war ein tragfähiger Zwischenschritt, steht aber dem Ziel
im Weg: Die eingebettete Anwendung verlangt eine Google-Anmeldung, und
genau davon soll die Werkstatt gelöst werden. Solange der Rahmen dastand,
wäre „läuft vollständig über GitHub" nicht wahr gewesen.

Die Seite zeigt jetzt ausschließlich, was tatsächlich im Repository liegt.
Was fehlt, wird benannt statt verschwiegen (`data-zustand="teilweise"`,
gestrichelte Umrandung, Vermerk „wird noch übernommen").

Im Betriebscode gibt es keinen Verweis mehr auf
`daggerheart-werkstatt-jt.web.app` — geprüft über `wiki.js`, `index.html`,
`stil.css` und `heim-server.mjs`. Die `frame-src`-Ausnahme in der
Content-Security-Policy des Heim-Servers wurde wieder entfernt.

### Hinzugefügt

- `#werkstatt-knopf` in der Kopfzeile, zwischen Suche und rechter
  Knopfgruppe. Das Raster von `.kopf` bekam dafür eine fünfte Spalte.
  Unter 68 rem entfällt die Beschriftung, das Zeichen bleibt.
- `werkstattBereiche()` und die neue `werkstattZeichnen()` in `wiki.js`:
  vier Felder mit Anzahl, Beschreibung, Ziel und Zustand. Die Zahlen
  werden aus `WELT` gerechnet, nicht fest eingetragen — sie stimmen also
  auch nach der nächsten Übernahme.
- Gestaltung in `stil.css`: `.werkstatt-knopf`, `.werkstatt-seite`,
  `.werkstatt-felder`, `.werkstatt-feld`, `.werkstatt-marke`. Der Goldton
  ist am Knopf fest gesetzt, weil er außerhalb der Kategoriebereiche steht.

### Entfernt

- Der Navigationsbereich `.nav-werkzeuge` aus der Seitenleiste. Mit dem
  Knopf in der Kopfzeile gäbe es zwei Wege zum selben Ziel.

### Behoben

- Ein- und Mehrzahl: „1 Figuren" und „1 Karten" hießen so, weil die
  Einheit fest eingetragen war. Sie richtet sich jetzt nach der Anzahl.

### Verifiziert

- Knopf sitzt in `.kopf`, führt auf `#/werkstatt`.
- Seite: vier Felder mit „1 Rahmen", „26 Einträge", „1 Figur", „1 Karte";
  zwei davon als „teilweise" gekennzeichnet; drei Inhaltskacheln darunter.
- Wege geprüft: „Assistent öffnen" führt nach `#/rahmen/rahmen-prototyp`,
  „Regeln durchsehen" nach `#/kategorie/regeln` mit 26 Kacheln.
- Kein `iframe` mehr im Dokument.
- Seitenleiste ohne den doppelten Eintrag.
- Alle fünf Prüfskripte bestanden, `node --check` über alle Dateien.

### Stand der Übernahme

| Bereich | Stand |
| --- | --- |
| Regelwiki | übernommen (2.4.0) |
| Kampagnenrahmen | übernommen (2.5.0) |
| Figurenassistent | offen — 2.238 Zeilen |
| Kartenwerkstatt | offen — 234 Vorlagen, PNG/PDF, 300 Bilder |
| Live-Sitzungen | nicht möglich ohne Rückkanal |


## [2.5.0] – 2026-08-26

Kampagnenrahmen-Assistent: neun Schritte, 33 Felder, zwei Listen. Zweiter
Schritt der Werkstatt-Übernahme — das erste übernommene Werkzeug mit
Bedienung, nicht nur Text.

### Die entscheidende Änderung: Rohform statt fertiger Text

Fassung 2.2.0 hatte den Rahmen **einmalig** in Wiki-Abschnitte umgewandelt.
Zum Lesen genügte das, zum Bearbeiten nicht: Die Feldstruktur war dabei
verloren, übrig blieb Fließtext.

Jetzt liegt der Rahmen als Rohform unter `rahmen` in `daten/quelle.json` —
so, wie die Werkstatt ihn führt. Der Wiki-Eintrag wird daraus bei **jedem**
Aufbereiten neu erzeugt (`mitRahmen()` / `rahmenAlsElement()` in
`welt-umwandeln.mjs`). Eine Quelle, zwei Ansichten: Der Assistent ändert die
Rohform, die Anzeige folgt automatisch. Die alten, fest abgelegten
`werkstatt-kampagne-*`-Einträge werden beim Übernehmen entfernt, sonst gäbe
es den Eintrag doppelt.

### Hinzugefügt

- `werkzeuge/rahmen-uebernehmen.mjs`: holt die Kampagnen aus einem
  Firebase-Abzug in die Rohform. Übernimmt ausschließlich `payload`; die
  Hüllenfelder tragen E-Mail-Adressen und Firebase-Kennungen. Bricht ab,
  wenn im Ergebnis eine Adresse steht.
- `werkzeuge/rahmen-felder-lesen.mjs`: liest die Feldbeschreibungen aus
  `FrameStepFields.tsx` der Werkstatt nach `daten/rahmen-felder.json` —
  Beschriftung, Hilfetext, Pflichtkennzeichen, Datenpfad, Beispiel, Feldart
  und Höchstlänge. Die Quelle ist JSX; statt sie zu übersetzen, werden die
  `FieldGroup`-Blöcke ausgelesen. Der Aufbau ist durchgehend gleich, deshalb
  trägt das. Ergebnis: 9 Schritte, 33 Felder.
  Die beiden Listen aus Schritt 5 und 6 stehen im JSX in einer Schleife und
  lassen sich nicht als Einzelblöcke lesen; sie sind im Skript beschrieben.
- `rahmen-assistent.js`: die Bedienung. Route `#/rahmen/<id>` in `wiki.js`,
  Anmeldung über `window.ageOfBeast.rahmenZeichnen`. Ohne Anmeldung
  erscheint ein Hinweis statt eines halb bedienbaren Formulars.
- Knopf „Im Assistenten bearbeiten" am Eintragskopf, nur bei Einträgen mit
  Präfix `rahmen-`.
- Gestaltung in `stil.css`: Schrittleiste, Felder, Listen, Knopfleiste.

### Speichern

Je Schritt ein Commit über alle geänderten Felder dieses Schritts, mit
sprechender Nachricht („Prototyp: Stimmung (1 Feld)"). Pfade der Form
`rahmen/<id>/inhalt/<pfad>`; geschrieben wird über dasselbe `schreiben()`
wie bei Texten und Struktur, also mit denselben Sicherungen (Kopie,
Blob-SHA-Vergleich, ein Commit für alle drei Dateien).

### Behoben (beim Prüfen gefunden)

- Nach dem Speichern rief der Assistent `neuZeichnen()`, was die ganze Seite
  ersetzt — samt des Feldes, in das gerade „Gespeichert" geschrieben worden
  war. Sichtbar blieb nichts. Die Meldung wird jetzt in `naechsteMeldung`
  zwischengelegt und beim Aufbau des neuen Schritts angezeigt.
- `finalNotes` war keinem Schritt zugeordnet, weil die Zuordnung über den
  ersten Pfadteil läuft und dieses Feld direkt an der Wurzel hängt.
  Schritt 9 ergänzt.

### Verifiziert

- Feldübernahme: 9 Schritte, 33 Felder, 2 Listen, kein Feld ohne Schritt.
- Erzeugter Eintrag gegen den vorherigen verglichen: gleicher Name, gleiche
  8 Abschnitte, gleicher Steckbrief — die Umstellung auf die Rohform hat die
  Anzeige nicht verändert.
- Im Prüfstand gegen eine Attrappe statt GitHub: Schrittwechsel 1 → 2 → 6 →
  9, Liste „Fraktionen" mit 3 Einträgen und 12 Feldern, Wert „Maschinisten"
  geladen. Änderung in Schritt 2 gespeichert; Commit-Nachricht
  „Prototyp: Stimmung (1 Feld)"; Wert in der Rohform angekommen; Meldung
  nach dem Neuaufbau sichtbar; Schritt 2 blieb offen.
- **Durchstich geprüft:** Die im Assistenten geänderte Stimmung erscheint
  ohne weiteres Zutun im Abschnitt „Ton und Stimmung" des Eintrags.
- Alle fünf Prüfskripte bestanden, `node --check` über 24 Dateien.


## [2.4.0] – 2026-08-26

Erster Schritt der vollständigen Übernahme der Daggerheart-Werkstatt: das
Regelwiki als Modul `regeln`. Ohne Firebase, ohne Anmeldung.

### Warum dieser Teil zuerst

Eine Bestandsaufnahme der Werkstatt ergab, dass Firebase nur **6 von rund
100 Quelldateien** berührt (`App.tsx`, `AuthScreens.tsx`, `useAuth.ts`,
`firebase.ts`, `liveSessions.ts`, `repository.ts`). Die Funktionen selbst
gehen über `repository.ts` als Zwischenschicht — sie hängen also nicht
selbst an Firebase. Das macht die Übernahme überhaupt erst machbar.

Das Regelwiki ist davon der reinste Fall: `wikiContent.ts` ist eine
Datenstruktur ohne Bedienung, ohne Zustand, ohne Abhängigkeiten.

### Hinzugefügt

- `werkzeuge/regeln-uebernehmen.mjs`: liest `wikiContent.ts` der Werkstatt
  und legt die Artikel als Modul `regeln` in `daten/quelle.json`.
  Die Quelle ist TypeScript, wird aber **nicht übersetzt**: Sie enthält
  ausschließlich Objektliterale. Das Skript entfernt die Typangaben per
  Textersetzung und wertet den Rest als gewöhnliches JavaScript aus. Das
  ist robuster als ein eigener Parser und spart den Übersetzer als
  Abhängigkeit.
- Kategorie `regeln`, Unterart aus `fields.regelBereich` (Grundlagen,
  Charaktere, Konflikte, Spielleitung).
- Eigener Akzentton in `stil.css` über `[data-kategorie="regeln"]`:
  ruhiges Blau `#7fa8c9`, für hell und dunkel getrennt gesetzt.

### Aufbau der Übernahme

- Jeder `WikiRulePoint` wird ein eigener Abschnitt mit der Punkt-Beschriftung
  als Überschrift. Dadurch bleibt die Gliederung der Werkstatt erhalten und
  jeder Punkt ist einzeln über den Stift bearbeitbar.
- `note` wird ein Abschnitt „Hinweis".
- `keywords` werden eine Steckbriefzeile „Stichworte" — sie fließen damit in
  die Volltextsuche ein.
- Das Glossar wird **ein** Eintrag mit 43 Abschnitten, nicht 43 Einträge.
  43 Kleinsteinträge hätten die Übersicht überschwemmt; als ein Eintrag mit
  Abschnitten bleibt es durchsuchbar und verlinkbar.

### Nebenwirkung, geprüft statt vermutet

Das Wörterbuch für die automatische Verlinkung wuchs von 45 auf 72 Begriffe.
Vor der Übernahme geprüft, welche davon zu allgemein sind: Von den 26 neuen
sind 22 mehrwortige Artikelnamen (unkritisch). Bei den vier einzelnen Wörtern
wurde nachgemessen, wie oft sie ausserhalb des Regelteils vorkommen:

| Begriff | Treffer in Welttexten |
| --- | --- |
| Stress | 15 Spezies |
| Zustände | keine |
| Countdowns | keine |
| Glossar | keine |

„Stress" bleibt bewusst drin: Die Treffer stehen in Spezies-Fähigkeiten, die
genau diese Regel meinen. Der Verweis ist dort ein Gewinn, kein Rauschen.
Nachgeprüft am Firbolg — „Stress" verweist dort jetzt auf `regel-stress`.

### Verifiziert

- 58 Einträge (vorher 32), 362 Panel-Abschnitte (vorher 108),
  176 Attributzeilen (vorher 125).
- Alle fünf Prüfskripte bestanden, `node --check` über alle Dateien.
- Regelseite im Browser: Etikett „Regelartikel · Konflikte", 6 Abschnitte,
  Steckbrief mit Bereich und Stichworten, Kontrast des Etiketts 8,33:1.
- Querverweis Welt → Regeln am Firbolg nachgewiesen.

### Nicht übertragbar

Live-Sitzungen. Echtzeit-Zusammenarbeit braucht einen Server mit
Rückkanal; GitHub Pages liefert nur statische Dateien aus. Das ist eine
technische Grenze, keine Frage des Aufwands.

## [2.3.0] – 2026-08-26

Modul „Daggerheart-Werkstatt" als eingebettete Anwendung, Layout näher am
Entwurf, Versionierung gegen den Browser-Zwischenspeicher.

### Hinzugefügt

- Route `#/werkstatt` in `wiki.js` mit `werkstattZeichnen()`: bettet
  `daggerheart-werkstatt-jt.web.app` als `iframe` ein, dazu eine Leiste mit
  Zielverweis und ein Hinweis darunter. Vorher gemessen, dass die Seite
  sich überhaupt einbetten lässt — sie setzt kein `X-Frame-Options`.
- Navigationsbereich `.nav-werkzeuge` unterhalb der Kategorien. Werkzeuge
  sind keine Kategorie mit Einträgen, sondern eigene Anwendungen; sie
  stehen deshalb abgesetzt.
- Gestaltung `.modul-rahmen`, `.modul-fenster`, `.modul-knopf` und
  `.modul-hinweis` im Werkstatt-Goldton, damit erkennbar bleibt, dass
  eingebettetes Modul und übernommene Einträge zusammengehören.
- `frame-src` in der Content-Security-Policy des Heim-Servers. Ohne diesen
  Eintrag hätte der lokale Server das Modul blockiert.

### Warum eingebettet und nicht portiert

Gemessener Umfang der Werkstatt: **18.873 Zeilen** TypeScript/React,
dazu 226 KB Kartendaten, 267 KB Gegnerdaten und 300 Bilddateien. Allein
der Figurenassistent hat 2.238 Zeilen, der Karten-Inspektor 1.417. Sie
setzt React 19, jsPDF, html-to-image und react-easy-crop ein; das Wiki
ist rund 1.200 Zeilen reines JavaScript ohne Abhängigkeiten und ohne
Übersetzungsschritt. Eine Portierung wäre ein eigenes Vorhaben und
verlöre die Live-Sitzungen ohnehin, weil GitHub Pages keinen Rückkanal
hat.

### Geändert — Abgleich mit dem Entwurf

Gemessen am gerenderten Entwurf, nicht geschätzt:

| Stelle | Entwurf | vorher | jetzt |
| --- | --- | --- | --- |
| Kopf, Trennlinie | keine | 1 px | keine |
| Kopf, Fläche | transparent | 92 % Grund | 72 % Grund |
| Seitenleiste, Trennlinie | keine | 1 px | keine |
| Seitenleiste, Fläche | transparent | voller Grund | transparent |
| Seitenleiste, Innenabstand | 11.2 / 11.2 / 72 / 16.8 | 18.4 / 9.6 / 48 | wie Entwurf |
| Inhalt, Innenabstand | 16.8 / 22.4 / 110 | 30.4 / 35.2 / 80 | wie Entwurf |

Der Weichzeichner der Kopfzeile bleibt: Ohne eigene Fläche liefe sonst
Text sichtbar darunter durch. Das Aufleuchten der Seitenleiste beim
Überfahren des Umschalters lief über den nun entfernten Rand und
geschieht jetzt über einen Verlauf.

### Behoben

- GitHub Pages liefert `Cache-Control: max-age=600`. Nach einer
  Veröffentlichung sah Jannik deshalb bis zu zehn Minuten den alten
  Stand — konkret fehlte ihm das ganze Modul „Werkstatt", und er meldete
  es als Fehler. Der Veröffentlichungslauf hängt jetzt die ersten acht
  Stellen des Commit-Kennzeichens an `stil.css`, `daten/welt.js`,
  `wiki.js` und `bearbeiten.js` an. Jede Fassung bekommt damit eine
  eigene Adresse, die der Browser gar nicht aus dem Zwischenspeicher
  nehmen kann.

### Verifiziert

- Einbettbarkeit vorab gemessen: Das `iframe` lädt; der Inhalt ist
  erwartungsgemäß nicht auslesbar (fremde Herkunft). Genau deshalb wurde
  überhaupt erst geprüft, statt es anzunehmen.
- Layoutwerte nach der Änderung nachgemessen: Seitenleiste
  `11.2px 11.2px 72px 16.8px`, Inhalt `16.8px 22.4px 110.4px`, keine
  Trennlinien mehr — deckungsgleich mit dem Entwurf.
- Alle fünf Prüfskripte bestanden, `node --check` über alle Dateien.
- Werkstatt-Seite: Rahmen, Fenster, Knopf und Hinweis vorhanden, das
  Fenster lädt die Werkstatt.

## [2.2.0] – 2026-08-26

Neues Modul `werkstatt`: die Inhalte der Daggerheart-Werkstatt aus
`daggerheartCreator/v1` als Wiki-Einträge, mit eigenem Akzentton.

### Hinzugefügt

- `werkzeuge/werkstatt-uebernehmen.mjs`: wandelt einen Firebase-Abzug in
  Wiki-Elemente und hängt sie als `elements.werkstatt` in
  `daten/quelle.json`. Drei Wandler — Kampagnenrahmen, Spielfigur, Karte —
  bauen jeweils Panels und Steckbriefzeilen im Format, das
  `welt-umwandeln.mjs` erwartet.
- Kategorie `werkstatt` in `KATEGORIEN`, Unterart aus `fields.werkstattArt`
  über `UNTERART_FELD`. Dadurch trägt jeder Eintrag die Etikettzeile
  „Werkstatt-Eintrag · Kampagnenrahmen" o. ä.
- Eigener Farbton in `stil.css`: Die Akzentvariablen werden innerhalb von
  `[data-kategorie="werkstatt"]` überschrieben. Kacheln, Verweise, Stifte
  und Bedienleisten nehmen den Ton dadurch ohne eine einzige zusätzliche
  Regel an. Für hell und dunkel getrennt gesetzt.
  Der Ton `#b79a6a` stammt aus Janniks Entwurf, wo er als `--wk-warm`
  deklariert, aber nirgends verwendet war.

### Geändert

- `wiki.js`: `.nav-gruppe` trägt jetzt `data-kategorie`, damit die
  Seitenleiste denselben Modulton bekommt wie Kacheln und Eintragsseiten.

### Bewusst nicht übernommen

- **Personenbezogene Daten.** Der Abzug enthielt drei E-Mail-Adressen
  (`createdBy`, `ownerEmail`) und einen Klarnamen von Mitspielern. Das
  Repository ist öffentlich; ein Commit wäre über die Versionsgeschichte
  nicht mehr rückholbar. Die Wandler übernehmen ausschließlich Inhaltsfelder
  aus `payload`, nie die Hüllenfelder. Zusätzlich bricht das Skript vor dem
  Schreiben ab, wenn im Ergebnis eine Adresse oder ein `data:image/` steht.
- **Die Kartengrafik.** 283 KB WebP, 1600×850, offizielle Illustration von
  Darrington Press (Mat Wilma, „DH Core 056/270"). Weiterverbreitung über ein
  öffentliches Repository ist etwas anderes als private Nutzung. Statt des
  Bildes steht ein Abschnitt „Zur Illustration" mit der Zuschreibung.
- **`appMembers`, `appInvites`, `liveSessions`, `liveSessionDirectory`.** An
  Firebase Auth gebunden und ohne sie bedeutungslos. Echtzeit-Zusammenarbeit
  lässt sich über GitHub grundsätzlich nicht abbilden.

### Abgrenzung

Übernommen sind die Inhalte, nicht die Anwendung. Der Kartenbaukasten
(234 Vorlagen, 129 Gegnervorlagen, Bildzuschnitt, PNG- und PDF-Export) ist
eine eigene React-Anwendung mit 766 Dateien und bleibt auf Firebase. Das
Firebase-Projekt `kampagnenrahmen-jt` darf deshalb weiterhin nicht
abgeschaltet werden.

### Verifiziert

- `node werkzeuge/werkstatt-uebernehmen.mjs`: 3 Einträge, 15 Abschnitte.
  Eingebaute Sperre gegen Adressen und eingebettete Bilder greift.
- `welt-aufbereiten`: 32 Einträge (vorher 29), 108 Panel-Abschnitte
  (vorher 93), 125 Attributzeilen (vorher 106).
- `pruefe-gleichstand`, `pruefe-schreibweise`, `pruefe-bearbeiten`,
  `pruefe-struktur`, `pruefe-github`: alle bestanden. Die Strukturprüfung
  läuft damit auch über die drei neuen Einträge.
- Im Browser: Modul erscheint in der Seitenleiste, alle drei Einträge
  rendern mit Abschnitten und Steckbrief. Kontrast im Modulton — Etikett
  8,01:1, Verweis 9,85:1. Keine Adresse im gerenderten DOM, keine
  Konsolenmeldung.

## [2.1.0] – 2026-08-25

Strukturbearbeitung: Abschnitte anlegen, löschen und umsortieren,
Steckbriefzeilen ändern, anlegen und entfernen.

### Entwurfsentscheidung

Janniks Entwurf zeigt eine Bearbeitungsmaske, die die Leseansicht ersetzt.
Umgesetzt wurden stattdessen Bedienleisten **an** den vorhandenen Elementen.
Grund: Die Maske hätte den an 206 Feldern geprüften Stift-Pfad ersetzt und
damit getestete Arbeit weggeworfen, ohne eine Fähigkeit hinzuzufügen, die die
Leisten nicht auch bieten. Übernommen sind die Fähigkeiten des Entwurfs, nicht
sein Bedienmodell.

### Hinzugefügt

- `werkzeuge/struktur-bearbeiten.mjs`: reine Logik, kein DOM. Exportiert
  `abschnittAnlegen`, `abschnittLoeschen`, `abschnittVerschieben`,
  `abschnittsReihenfolge`, `steckbriefZeilen`, `zeileSetzen`, `zeileAnlegen`,
  `zeileLoeschen`, `alsSchluessel`. Jede Funktion liefert eine Zuordnung von
  Pfad auf Wert — dasselbe Format, das `bearbeiten-stellen.mjs` schon
  verwendet, und damit ohne Änderung an `schreiben()` verwendbar.
- `struktur-bedienung.js`: die Bedienung. Registriert sich über
  `window.ageOfBeast.beiNeuZeichnen` und lauscht auf das neue Ereignis
  `bearbeiten-umgeschaltet`, das `texte-bearbeiten.js` beim Umschalten
  auslöst. Beide Dateien kennen einander nicht.
- `werkzeuge/pruefe-struktur.mjs`: 886 Einzelprüfungen über alle 29 Einträge.
- `.mikro`-Kategoriezeile und Steckbrief bekommen Bedienleisten; Gestaltung in
  `stil.css` (`.struktur-leiste`, `.struktur-knopf`, `.struktur-anhang`,
  `.struktur-neu`, `.zeile-formular`).

### Geändert

- `werkzeuge/welt-umwandeln.mjs`: Attribute tragen jetzt `schluessel`. Ohne
  ihn wüsste die Bedienung nicht, welches Feld in `fields` zu einer Zeile
  gehört — dieselbe Rolle, die `abschnitt.herkunft` für Abschnitte spielt.
- `wiki.js`: Abschnitte aus einem Panel tragen `data-panel` mit der
  Panel-Kennung, Steckbriefzeilen `data-zeile` mit dem Schlüssel. Ergänzte
  Abschnitte bekommen bewusst **kein** `data-panel`: Sie stammen aus einem
  Feld, haben keinen Platz in `panelOrder` und lassen sich nicht umsortieren.
- `.github/workflows/pages.yml`: `pruefe-struktur.mjs` und die Syntaxprüfung
  für `struktur-bedienung.js` ergänzt.

### Drei Eigenheiten, die den Ausschlag gaben

- **Ein neuer Abschnitt bekommt einen Starttext.** `welt-umwandeln.mjs`
  überspringt jedes Panel ohne Text (`if (!html) continue`). Ein leer
  angelegter Abschnitt wäre unsichtbar geblieben und hätte damit auch keinen
  Stift bekommen — die Bedienung wäre in eine Sackgasse gelaufen. Konstante
  `STARTTEXT`.
- **`panelOrder` enthält auch fremde Kennungen.** Neben den eigenen Panels
  stehen dort `core-connections` und `references`, die es in `customPanels`
  gar nicht gibt. `abschnittVerschieben` tauscht deshalb nur die Plätze der
  eigenen Abschnitte und lässt alles andere stehen; die Prüfung vergleicht
  das ausdrücklich.
- **Der neue Abschnitt steht nicht am Ende der Anzeige.** Nach den Panels
  hängt `welt-umwandeln.mjs` noch Zusatztexte an, die in keinem Panel
  vorkommen. Die Prüfung erwartet ihn deshalb hinter dem letzten Abschnitt
  **aus einem Panel**, nicht an letzter Stelle.

### Behoben (vor der Veröffentlichung im Prüfstand gefunden)

- `zeileLoeschen` setzte `fields[schluessel]` auf den Leerstring, statt den
  Schlüssel zu entfernen. In der Anzeige war das unsichtbar — leere Werte
  werden ohnehin übersprungen —, aber jeder Zyklus aus Anlegen und Entfernen
  hätte einen leeren Schlüssel mehr hinterlassen. `fields` wird jetzt als
  Ganzes ohne den Schlüssel geschrieben, wie `attributeRows` daneben.
- Die Prüfung selbst war zu schwach: Sie verglich nur die gerenderte Anzeige
  und hätte den Rest nie bemerkt. `rohAbdruck()` vergleicht jetzt zusätzlich
  den Rohknoten; damit stieg die Zahl der Einzelprüfungen von 828 auf 886.

### Verifiziert

- `node werkzeuge/pruefe-struktur.mjs`: 886 Prüfungen, 29 Einträge,
  126 Steckbriefzeilen, 0 Fehler. Geprüft wird je Eintrag: Anlegen erzeugt
  genau einen Abschnitt an der richtigen Stelle, verändert keinen anderen
  Eintrag und keinen vorhandenen Abschnitt; Anlegen und Löschen ergibt den
  Ausgangszustand in Anzeige **und** Rohdaten; Verschieben tauscht genau zwei
  Plätze, verliert nichts und lässt feste Panels unberührt; an den Rändern
  verweigert es sich; unverändertes Speichern meldet keine Änderung.
- `pruefe-gleichstand`, `pruefe-schreibweise`, `pruefe-bearbeiten`,
  `pruefe-github`: unverändert bestanden.
- `node --check` über alle 16 JavaScript-Dateien.
- Prüfstand im Browser gegen eine Attrappe statt GitHub: verschieben, hin und
  zurück, anlegen, löschen, Zeile anlegen, ändern, entfernen. Danach ist der
  Stand gegenüber `daten/quelle.json` **bytegleich** (213.211 Zeichen).
- Ohne Anmeldung: kein Bearbeiten-Knopf, 0 Stifte, 0 Leisten, 0 Anhänge,
  6 Abschnitte, keine fremden Skripte, keine Konsolenmeldung.
- Weltdaten: einzige Änderung ist das neue Feld `attribute[].schluessel`.
  Texte und Attributwerte unverändert.

## [2.0.1] – 2026-08-25

Abgleich mit dem überarbeiteten Entwurf „Aschekodex Wiki" (Design-System
*nocturne*) und Behebung eines vorbestehenden Fehlers beim Themenwechsel.

### Abgleich mit dem Entwurf

Der Entwurf wurde lokal gerendert und gegen den Ist-Zustand **gemessen**, nicht
nach Augenmaß übernommen. Identisch waren bereits: `--color-bg` `#161815`,
`--color-surface` `#1e211d`, `--color-text` `#e9e9ed`, `--color-accent`
`#9184d9`, Trennlinien bei 16 %, Inter durchgehend, der Lichtverlauf
`radial-gradient(1200px 700px at 8% -18%, #22251f, #161815 60%)`, Kachelgrund
`srgb(0.118 0.129 0.114 / 0.82)`, h1 ≈ 43 px/500, h2 ≈ 19 px/500.

Nicht übernommen: `--wk-warm` `#b79a6a` ist im Entwurf zwar deklariert, aber
an **keiner** Stelle verwendet. Ebenso wenig der zunächst vermutete
Kachelradius von 8 px — der Messwert stammte von einem anderen Element; der
Entwurf hat keine Kachelfläche, die der Startseite entspricht.

### Geändert

- Neue Variablen `--verweis` / `--verweis-aktiv`. Dunkel `#af9ee4` → `#d2cefd`,
  hell `#5d5294` → `#423a6a`. Bisher lag der Ruhezustand auf `--akzent-hell`,
  also auf dem Ton, den der Entwurf für `:hover` vorsieht.
- Neue Variable `--tuerkis`: dunkel `#71c3b1` (aus dem Entwurf,
  `oklch(0.76 0.085 178)`), hell `#2c6c5e` (abgedunkelt, da der Entwurf keine
  helle Ansicht kennt). Angewandt auf `.mikro` und `.brotkrumen .pfad`.

### Behoben

- **Farbnachzug beim Themenwechsel.** Elemente mit `transition: color`
  behielten nach dem Umschalten die Farbe des vorherigen Themas; betroffen
  waren sieben Regeln, darunter `a.verweis`. In der hellen Ansicht ergab das
  `#af9ee4` auf `#f6f6f3` — **2,2:1**.

  Ursache: Ändert sich nur eine Custom Property, übernimmt der Browser den
  neuen Wert nicht in eine Eigenschaft mit eingerichtetem Übergang. Isoliert
  nachgewiesen — bei `transition: none` schlug ein testweise gesetztes
  `--verweis: #ff0000` sofort durch, mit aktivem Übergang blieb die Farbe
  eingefroren, selbst wenn die Variable direkt am Element gesetzt wurde.

  Behebung in `themaSetzen()`: Klasse `thema-wechsel` setzen (CSS legt darunter
  alle Übergänge per `transition: none !important` stumm), Thema wechseln,
  **Neuberechnung mit `void wurzel.offsetWidth` erzwingen**, dann freigeben.
  Der erzwungene Umbruch ist der entscheidende Teil: Ohne ihn gewann die
  Freigabe das Rennen gegen die Berechnung und der Fehler blieb bestehen.
  Freigegeben wird über `requestAnimationFrame` **und** `setTimeout(…, 120)` —
  in einem unsichtbaren Tab feuert `requestAnimationFrame` nicht, wodurch die
  Klasse sonst hängen bliebe und sämtliche Übergänge tot wären. Beides wurde
  vor der Veröffentlichung reproduziert.

  Der Fehler bestand seit `1.0.0` (`a.verweis { color: var(--akzent-hell);
  transition: … color 0.14s }`) und fiel nur nicht auf, weil sich die Töne
  beider Themen kaum unterschieden.

### Verifiziert

- Kontrast nach WCAG, gemessen im Browser gegen `--grund`:

  | Element | dunkel | hell |
  | --- | --- | --- |
  | `a.verweis` | 7,51:1 | 6,26:1 |
  | `.mikro` | 8,63:1 | 5,68:1 |
  | `.brotkrumen .pfad` | 8,63:1 | 5,68:1 |
  | `.nav-gruppe li a` | 12,43:1 | 12,88:1 |
  | Fließtext | 14,75:1 | 16,34:1 |

  Niedrigster Wert 5,68:1, also über AA (4,5:1); im dunklen Thema alles über
  AAA (7:1).
- Drei aufeinanderfolgende Themenwechsel: alle fünf geprüften Elemente stimmen
  bei jedem Durchgang, Klasse danach entfernt, Übergänge wieder aktiv.
- `node --check` über alle 15 JavaScript-Dateien: fehlerfrei.
- `pruefe-gleichstand`, `pruefe-schreibweise`, `pruefe-bearbeiten`,
  `pruefe-github`: bestanden. Weltdaten unberührt.

## [2.0.0] – 2026-08-25

Ablösung von Firebase. Die Quelle der Wahrheit wandert von der Realtime
Database in das Repository (`daten/quelle.json`); Lesen und Schreiben laufen
über die GitHub-API. Kein Server, kein Datenbankanbieter, keine
Fremdressource zur Laufzeit.

Bruch in der Hauptnummer, weil sich Speicherort und Anmeldeverfahren ändern
und `daten/quelle.json` einen neuen Pfad hat.

### Warum kein OAuth

Zwei Dinge wurden am 25.08.2026 gegen die echten Endpunkte gemessen:

- `OPTIONS https://api.github.com/repos/…/contents/…` antwortet mit
  `Access-Control-Allow-Origin: *` und `Access-Control-Allow-Methods: …PUT…`
  – ein Browser darf also schreiben.
- `OPTIONS https://github.com/login/oauth/access_token` liefert **keine**
  `Access-Control-*`-Kopfzeilen – ein Browser kann eine GitHub-Anmeldung
  folglich nicht abschließen.

Damit bleibt auf reinem Statik-Hosting nur ein Token im Browser. Ein
Identitätsanbieter (Google, GitHub) wäre ohne serverseitige Prüfstelle bloße
Verzierung: Es gäbe niemanden, der die Behauptung nachprüft.

### Hinzugefügt

- `werkzeuge/github-speicher.mjs`: `schluesselPruefen`, `dateiLesen`,
  `dateienSchreiben`, `veroeffentlichungStand`, `alsBase64`/`ausBase64`.
  Base64 in 32-KB-Stücken, weil `String.fromCharCode(...bytes)` bei 274 KB
  den Aufrufstapel sprengt. Fehlerklasse `GitHubFehler` mit Status und
  übersetzten Meldungen für 401/403/404/409/422 und Rate-Limit.
- `werkzeuge/welt-dateien.mjs`: **eine** Stelle legt das Dateiformat unter
  `daten/` fest. Node-Skript und Browser benutzen sie beide; vorher hätte
  ein Leerzeichen Unterschied gereicht, um `pruefe-gleichstand.mjs` nach
  einem Speichern rot zu färben.
- `werkzeuge/pruefe-github.mjs`: Base64-Umlauf über 6 knifflige Texte und
  über die echte 274-KB-Quelldatei; Vergleich der browserseitig erzeugten
  Dateien gegen die Festplatte, Zeichen für Zeichen; Nachweis, dass zwei
  Läufe dasselbe ergeben. Ohne Netz und ohne Schlüssel.
- Schlüssel-Dialog in `bearbeiten.js` samt Anleitung zum Zuschneiden des
  Tokens; Stil unter `.schluessel-*` in `stil.css`. Wird erst bei Klick
  gebaut, Besucher sehen ihn nie.
- Rückmeldung zur Veröffentlichung: nach dem Commit wird
  `/actions/runs?head_sha=…` alle 5 s abgefragt (höchstens 20-mal), bis der
  Pages-Lauf durch ist.

### Geändert

- `werkzeuge/rohdaten-weltenschmiede.json` → **`daten/quelle.json`**. Der alte
  Name legte nahe, es handle sich um einen Wegwerf-Abzug; die Datei ist jetzt
  der Bestand.
- `bearbeiten.js` vollständig neu: kein Firebase-SDK, kein
  `signInWithPopup`, kein `localStorage`-Merker für die Google-Sitzung.
  Stattdessen Token in `localStorage`, `dateiLesen` beim Start,
  `dateienSchreiben` beim Speichern.
- Ein Speichervorgang geht über die **Git-Data-API**, nicht über die
  Contents-API: Blob je Datei → Tree auf `base_tree` → Commit → `PATCH` des
  Ref mit `force: false`. Ein Commit enthält `quelle.json`, `welt.json` und
  `welt.js` gemeinsam. Über die Contents-API wären es drei Commits und
  zwischendurch ein widersprüchliches Repository.
- Nebenläufigkeit doppelt abgesichert: vor dem Schreiben wird die Blob-SHA
  von `quelle.json` gegen den Stand beim Laden verglichen (→ 409), und der
  `PATCH` ohne `force` scheitert, falls der Zweig inzwischen weitergewandert
  ist.
- `schreiben()` arbeitet auf `structuredClone(rohStand)` und übernimmt die
  Kopie erst nach bestätigtem Commit. Vorher trug `texte-bearbeiten.js` die
  Änderung selbst ein — bei einem Fehlschlag hätte das Wiki einen Stand
  angezeigt, den es nirgends gibt.
- `texte-bearbeiten.js` kennt den Speicherort nicht mehr; `werkzeug.schreiben`
  bekommt zusätzlich eine Beschreibung für die Commit-Nachricht
  (`„Aetheris: Name des Eintrags geändert"`).
- `welt.erzeugtAm` **entfernt**. Das Feld wurde nirgends angezeigt und von
  `pruefe-gleichstand.mjs` vor dem Vergleich gelöscht — seit die Dateien in
  jedem Commit landen, wäre es nur wandernder Diff-Lärm. `umwandeln()` ist
  damit vorhersagbar, und der Vergleich braucht keine Ausnahme mehr.
- `werkzeuge/welt-holen.mjs` bricht ohne `--wirklich` mit Rückgabewert 1 ab
  und erklärt, warum. Es würde `daten/quelle.json` mit dem alten
  Firebase-Stand überschreiben.
- `.github/workflows/pages.yml`: `node --check` jetzt über **alle**
  Browser-Module und `werkzeuge/*.mjs`; alle vier Prüfskripte laufen vor der
  Veröffentlichung.
- `index.html`: Kopfangabe „aus der Weltenschmiede" → „gespeicherter Stand",
  angemeldet „live aus GitHub".

### Entfernt

- Jede Abhängigkeit von Firebase zur Laufzeit: kein SDK von `gstatic.com`,
  keine Realtime Database, keine Google-Anmeldung, keine `authorizedDomains`.

### Sicherheit

- Der Token liegt in `localStorage` derselben Herkunft. Auf einer Seite ohne
  fremde Inhalte und ohne nachgeladene Skripte ist die Angriffsfläche dafür
  gering; der Zuschnitt (ein Repository, nur `Contents`) begrenzt den Schaden
  zusätzlich, und jede Änderung ist als Commit rücknehmbar.
- `schluesselPruefen` lehnt einen Token ohne `permissions.push` sofort mit
  einer verständlichen Meldung ab, statt später beim Speichern zu scheitern.

### Geprüft

- `node werkzeuge/pruefe-github.mjs` – 6 Texte, 274-KB-Datei, Dateivergleich
  gegen die Festplatte, zwei Läufe gleich. 0 Fehler.
- `pruefe-gleichstand.mjs`, `pruefe-schreibweise.mjs`, `pruefe-bearbeiten.mjs`
  weiterhin fehlerfrei (149 Texte, 206 Felder).
- Vollständiger Speichervorgang in Chrome gegen eine GitHub-Attrappe
  durchgespielt — **keine einzige Anfrage an GitHub**. Ergebnis: Anmeldung
  mit gemerktem Schlüssel, Kopf „live aus GitHub", 6 Stifte, genau 3 Blobs,
  ein Commit mit allen drei Dateien in Modus `100644`, ein Elternteil,
  `force: false`, gültiges JSON, Umlaute unverletzt („Größe, weiß"),
  erzeugtes `<h3>…</h3>`, `welt.json` ohne `erzeugtAm`. Ein zweites Speichern
  im selben Lauf belegt, dass die SHA danach korrekt nachgezogen wird.
- Schutzmechanismen einzeln geprüft: falscher Schlüssel → 401 mit
  verständlichem Text; veraltete SHA → 409, es wird **nicht** geschrieben;
  aktuelle SHA → Commit geht durch.

## [1.4.0] – 2026-08-25

> Zusammen mit 2.0.0 veröffentlicht. Diese Fassung hat kein eigenes
> Etikett: Sie war nie ein eigenständiger Stand im Repository.

Schreibpfad. Name, Kurztext, Abschnittsüberschrift und Abschnittstext lassen
sich angemeldet im Wiki ändern und werden punktgenau in die Weltenschmiede
zurückgeschrieben. Struktur (Panels anlegen, löschen, umsortieren),
Steckbriefzeilen, Verknüpfungen sowie das Anlegen und Löschen von Einträgen
bleiben Fassung 1.5.0 und 1.6.0 vorbehalten.

### Hinzugefügt

- `werkzeuge/text-schreibweise.mjs`: Verlustfreie Übersetzung zwischen dem
  HTML der Weltenschmiede und einer Markdown-artigen Schreibweise
  (`#`/`##`/`###` → `h2`/`h3`/`h4`, `**`, `*`, `__`, Backticks, `-`, `1.`,
  `>`, Leerzeile → `<p>`, Zeilenumbruch → `<br>`). Reine Logik ohne
  Node-Bausteine, dadurch in Browser und Node identisch. Zwischenmarken
  werden zur Laufzeit aus `String.fromCharCode(1)` gebaut, damit im Quelltext
  keine unsichtbaren Zeichen stehen. Zeichen mit Sonderbedeutung werden mit
  Rückstrich geschützt, Zeilenanfänge zusätzlich.
- `werkzeuge/bearbeiten-stellen.mjs`: Abbildung von angezeigtem Feld auf
  Datenbankpfad (`stelleFinden`), Umrechnung in beide Richtungen
  (`zumBearbeiten`, `zumSpeichern`) und Nachziehen im gehaltenen Rohstand
  (`inTiefeSetzen`). Ebenfalls DOM-frei, damit in Node prüfbar.
- `texte-bearbeiten.js` (ES-Modul, nur Bedienung): Umschalter im Kopf,
  Stiftknöpfe an jedem `[data-feld]`, aufklappendes Eingabefeld mit
  Speichern/Abbrechen, `Esc` bricht ab, `Strg`+`Eingabe` speichert.
- `werkzeuge/pruefe-schreibweise.mjs`: 149 echte Texte und 17 Sonderfälle
  durch `HTML → Schreibweise → HTML`. Verglichen wird nicht das rohe HTML,
  sondern das Ergebnis von `alsAbsaetze()` – maßgeblich ist, was der Leser
  sieht.
- `werkzeuge/pruefe-bearbeiten.mjs`: End-zu-End über alle **206**
  bearbeitbaren Felder. Öffnen und unverändertes Speichern muss den Eintrag
  zeichengleich lassen; zusätzlich wird an 12 Feldern nachgewiesen, dass eine
  echte Änderung ankommt (sonst wäre ein Test, der nichts tut, immer grün).
- `abschnitt.herkunft` in `welt-umwandeln.mjs`: `{art: 'panel', panel,
  panelId, feld?}` bzw. `{art: 'richText'|'feld', schluessel}`. Notwendig,
  weil die Anzeigereihenfolge `panelOrder` folgt, die Datenbankstelle aber der
  ursprünglichen Reihenfolge in `customPanels`. Panels mit mehr als einem
  Textfeld ergeben bewusst `null` und bleiben schreibgeschützt.
- `window.ageOfBeast.beiNeuZeichnen(rueckruf)`; `weltSetzen()` nimmt jetzt
  `stelleHalten` und stellt die Scrollposition wieder her.
- `htmlSaeubern` und `alsAbsaetze` aus `welt-umwandeln.mjs` exportiert.

### Geändert

- `wiki.js`, `eintragZeichnen()`: `data-eintrag`/`data-kategorie` am
  `<article>`, `data-feld` an Überschrift, Anriss, Abschnittsüberschrift und
  Abschnittstext; der Abschnittstext liegt jetzt in
  `<div class="abschnitt-text">`. `data-feld="titel"` nur bei
  `herkunft.art === 'panel'` – die Überschrift eines ergänzten Abschnitts ist
  eine feste Beschriftung, keine Eingabe.
- `bearbeiten.js` hält den Rohstand (`rohStand`), reicht `update` als
  `schreiben` durch und zeichnet nach dem Speichern aus dem nachgezogenen
  Rohstand neu, ohne erneut zu lesen.
- Ein Schreibvorgang bündelt alle Pfade in einem `update()`: bei einem Panel
  `textFields/<n>/html`, `textFields/<n>/text` und `customPanels/<n>/text`,
  dazu `updatedAt` am Element und an der Wurzel des Projektknotens. Die
  Weltenschmiede führt drei Fassungen desselben Textes; nur eine zu ändern
  hinterließe drei Stände.

### Sicherheit

- Vor jedem Öffnen und vor jedem Schreiben wird `herkunft.panelId` gegen
  `customPanels[n].id` geprüft. Hat die Weltenschmiede zwischenzeitlich
  umsortiert, zeigt die gemerkte Nummer auf ein fremdes Panel; dann wird nicht
  geschrieben, sondern zum Neuladen aufgefordert.
- Kein neues Recht und keine Regeländerung. Verbindlich bleiben die Regeln der
  Realtime Database: `.read`/`.write` nur bei `auth != null`,
  `email_verified`, `sign_in_provider == 'google.com'` und genau einer Adresse.

### Geprüft

- `node werkzeuge/pruefe-schreibweise.mjs` – 149 Texte, 17 Sonderfälle, 0 Fehler.
- `node werkzeuge/pruefe-bearbeiten.mjs` – 206 Felder, 0 Fehler, 12 Änderungsproben.
- `node werkzeuge/pruefe-gleichstand.mjs` – `daten/welt.json` passt zu den Rohdaten.
- `node --check` auf allen geänderten JavaScript-Dateien.
- Leseansicht gegen `HEAD` verglichen: zwei Eintragsseiten in Chrome
  (`--headless=new --dump-dom`) gerendert; nach Entfernen der neuen
  `data-`Angaben und des Wrapper-`div` **zeichengleich**. Anonym bleibt der
  Bearbeiten-Knopf verborgen, es entsteht kein Stift, keine Konsolenmeldung.
- Bedienung mit einem Prüfstand durchgespielt, der Firebase durch eine
  Attrappe ersetzt: 6 Stifte am erwarteten Ort, Schreibweise statt HTML im
  Feld, korrekte Pfade beim Speichern, erzeugtes HTML
  `<h3>…</h3><p>Ein <strong>neuer</strong> Absatz…</p>`, Namensänderung auch in
  der Navigation, Abbrechen ohne Schreibvorgang, Stifte nach Seitenwechsel neu
  gesetzt. Der Prüfstand wurde danach entfernt und ist nicht Teil des
  Repositorys.

## [1.3.0] – 2026-08-24

Grundlage für den Bearbeitungsmodus: Google-Anmeldung, Live-Bezug aus der
Realtime Database und ein austauschbarer Weltstand zur Laufzeit. Noch **ohne**
Schreibpfad.

### Hinzugefügt

- `werkzeuge/welt-umwandeln.mjs`: Die Umwandlung wurde aus
  `welt-aufbereiten.mjs` herausgelöst und exportiert jetzt die reine Funktion
  `umwandeln(roh)`. Keine Node-Importe, dadurch identisch im Browser lauffähig.
  `welt-aufbereiten.mjs` ist auf einen dünnen Node-Mantel geschrumpft
  (430 → 80 Zeilen), der liest, `umwandeln()` aufruft, schreibt und die Bilanz
  ausgibt.
- `bearbeiten.js` (ES-Modul): Google-Anmeldung über `signInWithPopup`,
  Einmal-Lesen von `rooms/project-sturmwende-20260730/project`, Umwandlung und
  Übergabe an das Wiki. Das Firebase-SDK (12.16.0, gstatic) wird per
  dynamischem `import()` **erst bei Bedarf** geladen: entweder auf Klick oder
  wenn `localStorage` eine frühere Anmeldung vermerkt. Nicht angemeldete
  Besucher erzeugen null Anfragen an gstatic.
- `window.ageOfBeast` in `wiki.js` mit `weltSetzen(welt)` und `weltHolen()`.

### Geändert

- `wiki.js`: `const WELT` → `let WELT`. Die neun aus `WELT` abgeleiteten
  Strukturen (`nachId`, `kategorieInfo`, `nachKategorie`, `volltext`,
  `begriffe`, `verweisMuster`, `erwaehntVon`, `erwaehnt`, `verbundenVon`) sind
  ebenfalls `let` und werden in `nachschlagewerkeAufbauen()` gesetzt. Die
  Kopfzeile ist als `kopfzeileSetzen()` gekapselt.
  Bewusst **kein** erneutes Ausführen der IIFE: Sie bindet 21 Ereignisse,
  davon 11 an `document`/`window`; ein zweiter Durchlauf hätte sie doppelt
  registriert. Der Datenwechsel setzt deshalb nur Zustand und zeichnet neu.
- `werkzeuge/vorschau-server.mjs`: `.mjs` → `text/javascript`. Ohne das lehnt
  der Browser den Modulimport wegen der strengen MIME-Prüfung ab.
- `index.html`: Knopf `#anmelde-knopf` und Statusfeld `#anmelde-status` im
  Kopf; `bearbeiten.js` als `type="module"` nach `wiki.js`.
- `stil.css`: Gestaltung für Knopf und Status; `html[data-quelle="live"]`
  hebt die Quellenangabe hervor.

### Sicherheit

- Die Adressprüfung in `bearbeiten.js` dient allein der Anzeige. Verbindlich
  ist die Regel auf `rooms/$roomId`, live geprüft: `auth != null`,
  `email_verified == true`, `sign_in_provider == 'google.com'` und
  `email.toLowerCase() == 'kimpaliz1989@gmail.com'` — für `.read` **und**
  `.write`. Die Wurzel steht auf `.read: false` / `.write: false`.
- `kimpaliz.github.io` wurde den `authorizedDomains` des Projekts hinzugefügt.
  Ohne diesen Eintrag verweigert Firebase Auth die Anmeldung von der
  veröffentlichten Seite.
- Der Firebase-Web-Schlüssel steht im Repository. Das ist bei Firebase
  vorgesehen: Er identifiziert das Projekt, er berechtigt nicht. Der Zugriff
  wird ausschließlich über die Datenbankregeln entschieden.

### Verifiziert

- Node-Mantel nach dem Herauslösen: `daten/welt.json` ist gegenüber vorher
  **identisch** (nur `erzeugtAm` weicht ab), Bilanz unverändert.
- Im Browser: `umwandeln()` auf denselben Rohdaten liefert ein Ergebnis, das
  zeichengenau mit `window.AGE_OF_BEAST_WELT` übereinstimmt.
- `weltSetzen()` mit einem geänderten Eintragsnamen: Navigation und Kacheln
  zeichnen neu, 29 Einträge, kein Neuladen.
- Ohne Anmeldung: 29 Kacheln, Suche, Verweise und Vorschau unverändert,
  **0** Anfragen an gstatic, keine Konsolenfehler.

### Offen

- Kein Schreibpfad. Der Bearbeitungsmodus folgt in 1.4.0.
- Der Anmeldevorgang selbst wurde nicht durchgespielt: Das Google-Fenster
  verlangt Janniks eigene Bestätigung.

## [1.2.0] – 2026-08-24

Übernahme des Design-Canvas „Aschekodex Wiki" (Nocturne-Designsystem) in
`stil.css`. Reine Präsentationsschicht: kein Markup-, Verhaltens- oder
Datenmodellwechsel.

### Geändert

- Farbtoken in `:root` auf die Werte des Entwurfs gesetzt:
  `--grund #161815`, `--flaeche #1e211d`, `--schrift #e9e9ed`,
  `--akzent #9184d9`, `--akzent-hell #d2cefd` (entspricht
  `--color-accent-300` des Entwurfs). Ränder und matte Textfarben laufen
  jetzt über `rgba()`-Deckungen statt fester Grautöne, damit sie auf dem
  olivfarbenen Grund neutral bleiben.
- `body` erhält den Lichtverlauf des Entwurfs:
  `radial-gradient(1200px 700px at 8% -18%, var(--grund-tief), var(--grund) 60%)`,
  mit `background-attachment: fixed`, damit er beim Scrollen ruhig steht.
- `--serif` zeigt nicht länger auf eine Serifenschrift. Der Entwurf setzt
  `--font-heading` auf Inter, also führen beide Stapel `"Inter", system-ui, …`.
  Bewusst ohne `@font-face` und ohne Google-Fonts-Einbindung: das Wiki soll
  weiterhin ohne Netzzugriff vollständig funktionieren.
- `a.verweis` von `--schrift` mit neutraler Unterlinie auf `--akzent-hell`
  mit `--akzent-rand` umgestellt; Hover hinterlegt mit `--akzent-schleier`.
  Die Sonderregel, die Verweise in `.artikel-seite` und `.bezugsliste`
  unterlinienlos zeichnete, ist entfallen — der Entwurf zeigt die Unterlinie
  durchgehend.
- `.kacheln`: Spaltenmindestbreite 15.5rem → 17.6rem (Entwurf: 282 px).
  `.kachel` mit `color-mix(in srgb, var(--flaeche) 82%, transparent)` und
  `translateY(-3px)` beim Überfahren.
- `.vorschau`: Name 16 px / `line-height 1.2`, Text 13 px / 1.5,
  Einblendung auf `0.18s ease both` mit 6 px Versatz (Entwurf: `wkPop`).
- Radien auf `0.75rem` / `0.5rem`; Schatten als Ring plus Schlagschatten
  analog `--shadow-md` des Entwurfs.
- Favicon in `index.html` auf die neue Palette (`#161815` / `#d2cefd`).

### Helles Thema

Der Entwurf liefert nur eine dunkle Palette. Das helle Thema wurde aus
denselben Farbfamilien abgeleitet: Grund `#f6f6f3`, Akzent `#5d5294`,
Verweise `#423a6a` (entspricht `--color-accent-800` des Entwurfs).

### Verifiziert

- Kontrastmessung im laufenden Wiki, Übergänge für die Messung deaktiviert:
  Verweis auf Grund **11,90:1** dunkel und **9,48:1** hell; Fließtext auf
  Grund **16,34:1** hell. WCAG AA verlangt 4,5:1.
- Aufgelöste Werte gegen den gerenderten Entwurf abgeglichen: Grund, Kachel-
  fläche, Kachelüberschrift (18,56 px vs. 18,5 px), Etikett (`#d2cefd`,
  10,88 px, `letter-spacing` 0,1em) und Vorschauname (16 px) stimmen überein.
- Keine Konsolenfehler im Wiki; 29 Kacheln werden gerendert.

## [1.1.0] – 2026-08-24

Umbenennung der Welt von *Sturmwende* zu **Age of Beast**. Reine Namens- und
Bezeichnerpflege: Datenmodell, Rendering, Routing und Inhalte sind unverändert.

### Geändert

- `werkzeuge/welt-aufbereiten.mjs`: Der Weltname stammt nicht länger aus
  `roh.project?.title`, sondern aus der neuen Konstante `WELT_TITEL`.
  Begründung: Das Projekt wird in der Realtime Database unverändert unter
  `project-sturmwende-20260730` mit dem Titel „Sturmwende" geführt. Der
  bisherige Fallthrough hätte den Anzeigenamen bei jedem
  `welt-holen` → `welt-aufbereiten`-Zyklus stillschweigend zurückgesetzt.
- Globales Datenobjekt `window.STURMWENDE_WELT` → `window.AGE_OF_BEAST_WELT`.
  Erzeuger (`welt-aufbereiten.mjs`) und Verbraucher (`wiki.js`) wurden
  gemeinsam umgestellt. Ein Alias auf den alten Bezeichner wurde bewusst nicht
  angelegt: `daten/welt.js` ist generiert, und es existiert kein externer
  Konsument.
- `localStorage`-Schlüssel `sturmwende-leiste` → `age-of-beast-leiste`,
  `sturmwende-thema` → `age-of-beast-thema`. Ohne Migrationspfad, da sich der
  Verlust auf zwei UI-Präferenzen beschränkt, die beim nächsten Umschalten
  ohnehin neu geschrieben werden.
- `index.html`: `<title>`, `meta[name="description"]`, `#welt-titel`.
- Titel- und Kopfkommentare in `README.md`, `stil.css`, `wiki.js`,
  `werkzeuge/vorschau-server.mjs`, `werkzeuge/welt-holen.mjs`.
- Repository-Verweise am Dateiende auf `Kimpaliz/age-of-beast` gesetzt.

### Bewusst unverändert

- `PROJEKT_PFAD = 'rooms/project-sturmwende-20260730/project'` in
  `werkzeuge/welt-holen.mjs`. Das ist der Primärschlüssel des Projekts in der
  Realtime Database, kein Anzeigename; eine Änderung würde den Abruf brechen.
- Die Weltenschmiede selbst. Der Zugriff erfolgte ausschließlich lesend.

### Verifiziert

- `node --check` auf `wiki.js`, `werkzeuge/welt-aufbereiten.mjs`,
  `werkzeuge/welt-holen.mjs`, `werkzeuge/vorschau-server.mjs`: fehlerfrei.
- `node werkzeuge/welt-holen.mjs`: 29 Einträge, Stand
  `2026-08-22T07:54:45.193Z`. `werkzeuge/rohdaten-weltenschmiede.json` ist
  gegenüber 1.0.0 bytegleich — der Abzug bestätigt, dass sich inhaltlich
  nichts geändert hat.
- `node werkzeuge/welt-aufbereiten.mjs`: 29 Einträge, 93 Panel-Abschnitte,
  10 ergänzte Zusatztexte, 106 Attributzeilen, 9 feste Verbindungen,
  45 Wörterbucheinträge. Bilanz identisch zu 1.0.0.
- `git diff daten/welt.json` weist genau zwei geänderte Zeilen aus: `titel`
  und der Zeitstempel `erzeugtAm`.

## [1.0.0] – 2026-08-24

Erstveröffentlichung. Statischer Wiki-Client für das
Weltenschmiede-Projekt `project-sturmwende-20260730`.

### Hinzugefügt

**Anwendung**

- `index.html` / `stil.css` / `wiki.js`: SPA ohne Build-Schritt und ohne
  Laufzeitabhängigkeiten. Hash-basiertes Routing (`#/`,
  `#/kategorie/<schluessel>`, `#/eintrag/<id>`).
- Datenübergabe über `window.STURMWENDE_WELT` aus `daten/welt.js`, damit die
  Seite auch unter `file://` läuft (`fetch` scheitert dort an CORS).
  `daten/welt.json` wird zusätzlich für Diffs und Fremdnutzung geschrieben.
- Automatische Verlinkung: eine nach Länge absteigend sortierte Alternation
  über 45 Wörterbucheinträge, angewandt per `TreeWalker` auf Textknoten.
  Ausgeschlossen sind Nachfahren von `a`, `code` und `h1`–`h4`; eine
  unterstrichene Überschrift stört den Lesefluss und verbrauchte zudem den
  Erstvorkommen-Platz des Begriffs für den Text darunter.
  Wortgrenzen über Unicode-Lookarounds `(?<![\p{L}\p{N}])…(?![\p{L}\p{N}])`.
- Zwei Heuristiken gegen Übersättigung und Fehltreffer: ein Ziel wird je
  Eintrag nur einmal verlinkt (gemeinsames `Set` über alle Abschnitte), und
  der Treffer muss mit einem Großbuchstaben beginnen (deutsche Substantive;
  verhindert das Numerale „elf" → Spezies `Elf`).
- Vorschaukarte an Verweisen: Einblenden nach 170 ms bei `pointerover`,
  Ausblenden nach 160 ms Karenz, damit die Karte selbst erreichbar bleibt.
  Zusätzlich `focusin` für Tastaturbedienung und ein Zwei-Stufen-Pfad für
  `pointerType === 'touch'` (erster Tap zeigt, „Öffnen" navigiert).
  Positionierung mit Viewport-Clamping und Flip nach oben.
- Beziehungsgraph zur Laufzeit: ausgehende `verbindungen`, invertierte
  eingehende Verbindungen sowie Texterwähnungen in beide Richtungen.
  `verknuepfungsZahl()` liefert die Zahl distinkter verwandter Einträge.
  Gegenrichtungen einer bereits gelisteten Beziehung werden unterdrückt.
- Volltextsuche mit gestufter Gewichtung (Name exakt 100 / Präfix 80 /
  Teilstring 60 / Alias 50 / Kurztext 35 / Fließtext 20), Trefferhervorhebung,
  Pfeiltasten-Navigation und `/` als Fokus-Kürzel.
- Kategoriefilter auf der Startseite über `hidden` statt Neuaufbau des DOM.
- Umschalter für Seitenleiste und Farbschema, beide in `localStorage`
  persistiert und gegen gesperrten Speicher abgesichert.
- Reifegrad-Kennzeichnung je Eintrag, abgeleitet aus Abschnittszahl (≥ 3) und
  Textlänge (> 900 Zeichen).

**Werkzeuge**

- `werkzeuge/welt-holen.mjs`: lesender Export aus der Realtime Database.
  Bewusst ohne npm-Abhängigkeit: Das Bearer-Token kommt aus
  `gcloud auth application-default print-access-token`, der Abruf über das in
  Node eingebaute `fetch`. Unter Windows via `cmd /c call gcloud.cmd`, weil die
  PowerShell-Skriptausführung auf diesem Rechner gesperrt ist. Keine
  Schreiboperationen; 401/403 führen zu einem Hinweis auf die Neuanmeldung.
- `werkzeuge/welt-aufbereiten.mjs`: Transformation der Weltenschmiede-Struktur
  in das Wiki-Schema, inklusive Bilanzausgabe.
- `werkzeuge/vorschau-server.mjs`: statischer Server auf Port 4173 mit
  Path-Traversal-Schutz über `normalize()` und `..`-Prüfung.

**Infrastruktur**

- GitHub-Actions-Workflow zur Veröffentlichung auf GitHub Pages.

### Gestaltung

- Gestaltungssprache nach dem Design-Canvas „Aschekodex Wiki": Grund `#0b0b0d`,
  Flächen `#141417` / `#1b1b20`, Ränder `#26262c` / `#34343d`,
  Akzent `#8b8bf0`. Serifen-Stack für Überschriften, System-Sans für Fließtext,
  gesperrte Versalien (`0.14em`) als Etikettenmotiv.
- Sämtliche Farben als Custom Properties auf `:root`; das helle Schema
  überschreibt ausschließlich Tokens unter `html[data-thema="hell"]`.
- Kachel-Schein als `radial-gradient` in `::before` innerhalb von
  `overflow: hidden`, gespeist aus `--maus-x` / `--maus-y`, die ein
  gedrosselter `pointermove`-Handler setzt.
- Umbruchpunkte: 68 rem (Artikel einspaltig, Kopf-Metadaten aus),
  60 rem (Seitenleiste als Overlay), 40 rem (Kacheln einspaltig,
  Suchfeld auf 16 px gegen iOS-Autozoom).
- `prefers-reduced-motion` deaktiviert Transitions und Animationen.

### Datenaufbereitung

- Panels werden über `panelOrder` sortiert und aus `textFields[].html`
  gerendert, mit Rückfall auf `textFields[].text` und `panel.text`.
- Abdeckungsprüfung gegen Textverlust: Jedes Feld aus `richText` und `fields`
  wird satzweise gegen den bereits gerenderten Panelinhalt geprüft. Bei unter
  80 % Deckung wird es als eigener Abschnitt mit Flag `ergaenzt` ergänzt.
  Ergebnis: 93 Panel-Abschnitte, 10 ergänzte Texte, 75 als Dublette verworfen.
- Anschließend werden Abschnitte verworfen, deren Vergleichsform vollständig in
  der Kurzbeschreibung enthalten ist (betrifft alle 24 Spezies, deren erstes
  Panel wortgleich der `description` entspricht). Die Prüfung läuft nach der
  Abdeckungsbilanz, damit ein verworfener Abschnitt nicht anschließend als
  fehlend gilt und über den Zusatztext-Pfad zurückkehrt. Netto 79 Abschnitte.
- Der abschließende Absatz `Regelquelle: …` wird aus dem letzten Abschnitt
  entfernt, sofern `fields.source` gesetzt ist; die Angabe erscheint
  stattdessen im Steckbrief-Block „Herkunft" (24 Fälle). Bleibt danach kein
  Text übrig, entfällt der Abschnitt ganz.
- HTML-Bereinigung auf eine Positivliste
  (`p, br, strong, b, em, i, u, ul, ol, li, h3, h4, blockquote, code`);
  Attribute, `script`, `style` und `javascript:` werden entfernt.
- Wörterbuchaufbau mit Vorrang für kuratierte `textLinks` aus der
  Weltenschmiede, danach Namen und eindeutige Aliase. Aliase, die mehr als ein
  Element beanspruchen, werden verworfen und im Lauf gemeldet
  (betrifft `Elemental Kin`). Eine explizite Sperrliste enthält `prototyp`.
- `unterart` je Kategorie aus einem definierten Feld, begrenzt auf 28 Zeichen,
  mit Klartext-Mapping für Kürzel (`sc` → `Spielfigur`) und Unterdrückung von
  Dopplungen zur Kategoriebezeichnung.
- Attributwerte über 110 Zeichen werden nicht in die Steckbriefspalte
  übernommen; sie stehen ohnehin im Fließtext.

### Behoben

- `htmlSaeubern()` verwarf sämtliche schließenden Tags: Der Tagname wurde per
  `split(/[\s/>]/)[0]` ermittelt, was bei `</strong>` den Leerstring liefert
  und die Positivliste nie trifft. Folge war unbalanciertes Markup, wodurch
  `<strong>` bis zum Ende des Abschnitts durchlief. Ersetzt durch
  `/<\s*(\/?)\s*([a-zA-Z][a-zA-Z0-9]*)[^>]*>/`, das öffnende und schließende
  Tags getrennt behandelt. Balance ist über alle 29 Einträge verifiziert.
- Auf Viewports ≤ 60 rem gewann `.rahmen.leiste-zu` mit
  `grid-template-columns: 0 minmax(0, 1fr)` per Spezifität gegen die
  Einspalten-Regel der Media Query. Da die Navigation dort `position: fixed`
  ist, rückte `main` in die 0-Pixel-Spalte; der Fließtext war 0 px breit.
  Beide Selektoren werden in der Media Query nun gemeinsam zurückgesetzt.
- Der Kopfbereich lief bei 1000 px um 24 px über, weil `.marke` mit
  `white-space: nowrap` auf 427 px wuchs und die Suchspalte `minmax(0, 1fr)`
  auf 0 px kollabierte. Die Spalte hat jetzt `minmax(12.5rem, 1fr)`, `.marke`
  bekam `min-width: 0` mit `text-overflow: ellipsis`, und unterhalb von 68 rem
  entfallen Untertitel und Kopf-Metadaten.

### Sicherheit

- Kein Netzwerkzugriff zur Laufzeit; keine externen Ressourcen, keine Analytik.
- Sämtliche aus Daten stammenden Zeichenketten laufen durch `sicher()`
  (HTML-Entity-Kodierung), bevor sie in Templates eingesetzt werden.
  Ausgenommen ist der bereits serverseitig bereinigte Abschnitts-HTML.
- Die Datendateien wurden vor dem Commit auf Zugangsdaten, Schlüssel und
  E-Mail-Adressen geprüft; Treffer: keine.

[Unveröffentlicht]: https://github.com/Kimpaliz/age-of-beast/compare/v2.7.0...HEAD
[2.7.0]: https://github.com/Kimpaliz/age-of-beast/compare/v2.6.0...v2.7.0
[2.6.0]: https://github.com/Kimpaliz/age-of-beast/compare/v2.5.0...v2.6.0
[2.5.0]: https://github.com/Kimpaliz/age-of-beast/compare/v2.4.0...v2.5.0
[2.4.0]: https://github.com/Kimpaliz/age-of-beast/compare/v2.3.0...v2.4.0
[2.3.0]: https://github.com/Kimpaliz/age-of-beast/compare/v2.2.0...v2.3.0
[2.2.0]: https://github.com/Kimpaliz/age-of-beast/compare/v2.1.0...v2.2.0
[2.1.0]: https://github.com/Kimpaliz/age-of-beast/compare/v2.0.1...v2.1.0
[2.0.1]: https://github.com/Kimpaliz/age-of-beast/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/Kimpaliz/age-of-beast/compare/v1.3.0...v2.0.0
[1.4.0]: https://github.com/Kimpaliz/age-of-beast/compare/v1.3.0...v2.0.0
[1.3.0]: https://github.com/Kimpaliz/age-of-beast/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/Kimpaliz/age-of-beast/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/Kimpaliz/age-of-beast/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/Kimpaliz/age-of-beast/releases/tag/v1.0.0
