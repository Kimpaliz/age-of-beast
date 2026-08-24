# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden hier festgehalten.

Das Format orientiert sich an [Keep a Changelog](https://keepachangelog.com/de/1.1.0/),
die Versionierung an [Semantic Versioning](https://semver.org/lang/de/).

Eine Fassung desselben Protokolls in Alltagssprache liegt unter
[CHANGELOG.md](CHANGELOG.md).

## [Unveröffentlicht]

—

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

- `werkzeuge/welt-holen.mjs`: lesender Export aus der Realtime Database über
  `google-auth-library` mit Application Default Credentials. Keine
  Schreiboperationen.
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

[Unveröffentlicht]: https://github.com/Kimpaliz/iron-and-bone/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/Kimpaliz/iron-and-bone/releases/tag/v1.0.0
