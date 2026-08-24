# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden hier festgehalten.

Das Format orientiert sich an [Keep a Changelog](https://keepachangelog.com/de/1.1.0/),
die Versionierung an [Semantic Versioning](https://semver.org/lang/de/).

Eine Fassung desselben Protokolls in Alltagssprache liegt unter
[CHANGELOG.md](CHANGELOG.md).

## [Unveröffentlicht]

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

[Unveröffentlicht]: https://github.com/Kimpaliz/age-of-beast/compare/v1.3.0...HEAD
[1.3.0]: https://github.com/Kimpaliz/age-of-beast/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/Kimpaliz/age-of-beast/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/Kimpaliz/age-of-beast/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/Kimpaliz/age-of-beast/releases/tag/v1.0.0
