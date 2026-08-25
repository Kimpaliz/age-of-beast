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

[Unveröffentlicht]: https://github.com/Kimpaliz/age-of-beast/compare/v2.3.0...HEAD
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
