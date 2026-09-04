# Age of Beast – Weltwiki

Ein Nachschlagewerk zur Daggerheart-Welt **Age of Beast**: Kampagnenübersicht,
Fraktionen, Spezies, Figuren und Gegenstände. Verlinkte Begriffe zeigen beim
Überfahren mit der Maus eine Kurzfassung, ohne dass man die Seite wechseln muss.

**Stand der Weltdaten:** 26. August 2026 · **58 angezeigte Einträge** · 347 Abschnitte

---

## Wiki ansehen

**Der einfachste Weg:** Doppelklick auf `index.html`. Das Wiki läuft ohne
Installation und ohne Internetverbindung direkt im Browser.

**Wie später im Netz:** einen kleinen lokalen Server starten.

```bash
node werkzeuge/vorschau-server.mjs
```

Danach `http://127.0.0.1:4173` im Browser öffnen. Die Vorschau ist bewusst
nur auf diesem PC erreichbar. Für eingetragene Geräte im NetBird-Netz gibt es
`Wiki-im-eigenen-Netz-starten.cmd`. Beenden mit `Strg + C`.

---

## Was das Wiki kann

| Funktion | Beschreibung |
| --- | --- |
| **Verweise im Text** | Namen anderer Einträge werden im Fließtext automatisch verlinkt. |
| **Vorschau beim Überfahren** | Die Maus über einen Verweis halten zeigt Kategorie, Kurztext und Anzahl der Verknüpfungen. Auf dem Handy genügt ein Antippen. |
| **Verknüpfungen** | Jede Seite zeigt, womit der Eintrag fest verbunden ist – und wo er sonst noch erwähnt wird. |
| **Suche** | Sucht in Namen, anderen Bezeichnungen und im gesamten Fließtext. Taste `/` springt ins Suchfeld. |
| **Filter** | Auf der Startseite lässt sich nach Kategorie eingrenzen. |
| **Hell und dunkel** | Umschaltbar oben rechts. Dunkel ist die Voreinstellung. |
| **Handy und Tablet** | Vollständig nutzbar; die Seitenleiste klappt ein. |
| **Bearbeiten** | Nur angemeldet: Texte ändern, Abschnitte anlegen, löschen und umsortieren, Steckbriefzeilen pflegen. Siehe unten. |

Die redaktionellen Inhalte liegen als Text vor. Die Werkstattkarten verwenden
234 lokal erzeugte SVG-Wappen. Es gibt keine Werbung und keine
Nachverfolgung. Der Lesemodus lädt kein fremdes Skript; er holt die
Weltdaten über eine einfache Abfrage bei Firebase. Erst zum Bearbeiten wird
das Firebase-SDK nachgeladen.

---

## Aufbau des Projekts

```
index.html                 die Seite selbst und die feste Lade-Reihenfolge
stil.css                   schmale Stil-Fassade
styles/                    Tokens, Wiki-, Bearbeitungs- und Werkstatt-Stile
runtime/                   Datenindex, Ansichten, Interaktion und Routing
wiki.js                    Bootstrap und öffentliche Kompatibilitätsfassade
bearbeiten.js              Weltdaten holen, Anmeldung und Speichern
firebase-konfig.js         öffentliche Zugangsdaten des Firebase-Projekts
firestore.rules            wer lesen und schreiben darf
texte-bearbeiten.js        die Bedienung zum Ändern von Texten
daten/quelle.json          Abbild der Welt für den ersten Bildaufbau
daten/welt.json            daraus abgeleitet, die Anzeigefassung
daten/welt.js              dieselben Daten für den Betrieb ohne Server
werkzeuge/                 Umwandlung, Speicherweg und Prüfungen
```

Bewusst **ohne** Baukasten, ohne `npm install`, ohne Übersetzungsschritt:
Wer die Dateien herunterlädt, kann das Wiki sofort öffnen.

**Ohne eigenen Server.** Seit Fassung 3.0.0 liegt die Welt in Firestore, im
Firebase-Projekt `kampagnenrahmen-jt`. Angemeldet wird mit dem Google-Konto.

Der Lesemodus lädt trotzdem **kein fremdes Skript**: Die Weltdaten kommen
über eine gewöhnliche Abfrage der Firebase-Schnittstelle, nicht über deren
Programmbibliothek. Die wird erst beim Anmelden geholt. Wer das Wiki nur
liest, lädt damit genauso wenig wie vorher — keine Schriftart, kein Skript,
keine Nachverfolgung.

**Getrennt von allem anderen im selben Projekt.** In `kampagnenrahmen-jt`
läuft auch das Spiel Scotophobia. Das Wiki benutzt eigene Sammlungen
(`wiki_welt`, `wiki_zugang`) und eigene Regelblöcke; wer dort
freigeschaltet ist, darf dadurch **nicht** das Wiki bearbeiten. Ein Wächter
prüft diese Trennung bei jeder Veröffentlichung.

---

## Wo die Inhalte liegen

Die Welt steht in **`daten/quelle.json`** in diesem Repository. Das ist die
Wahrheit — es gibt keine Datenbank und keinen Anbieter dahinter.

Daraus werden zwei Dateien abgeleitet, die das Wiki zum Anzeigen braucht:

| Datei | Was sie ist |
| --- | --- |
| `daten/quelle.json` | **die Welt.** Wird bearbeitet, alles andere folgt daraus |
| `daten/welt.json` | daraus erzeugt: die aufbereitete Anzeigefassung |
| `daten/welt.js` | dieselben Daten, damit `index.html` auch per Doppelklick läuft |

Der übliche Weg ist, im Wiki zu bearbeiten (siehe unten) — dann werden alle
drei Dateien zusammen in **einem** Commit abgelegt und bleiben automatisch
stimmig.

Wer `daten/quelle.json` ausnahmsweise von Hand ändert, muss danach die
abgeleiteten Dateien neu erzeugen:

```bash
node werkzeuge/welt-aufbereiten.mjs
```

> **Wichtig:** `daten/welt.json` und `daten/welt.js` niemals von Hand
> bearbeiten. Sie werden beim nächsten Erzeugen überschrieben. Geändert wird
> immer `daten/quelle.json` — am besten über das Wiki.

### Und die Weltenschmiede?

Wird nicht mehr gebraucht. Bis zum 25. August 2026 lagen die Inhalte dort in
einer Firebase-Datenbank, und das Wiki war nur ein Abzug davon. Seit Fassung
2.0.0 ist es umgekehrt: Das Wiki *ist* die Quelle.

`werkzeuge/welt-holen.mjs` kann den alten Stand noch aus der Weltenschmiede
holen und liegt nur als Rückweg bei. Es weigert sich, ohne `--wirklich` zu
laufen — denn es würde `daten/quelle.json` überschreiben und damit alles
verlieren, was seither im Wiki geändert wurde.

---

## Texte im Wiki ändern

Texte lassen sich direkt im Wiki bearbeiten — im Browser, auch auf dem Handy.
Gespeichert wird in Firestore.

### Anmelden

1. Oben rechts auf **Anmelden**. Es öffnet sich das gewohnte Google-Fenster.
2. Auf **Bearbeiten** klicken.

Mehr ist nicht nötig. Bis Fassung 2.x brauchte es einen selbst erzeugten
GitHub-Schlüssel — anlegen, richtig zuschneiden, in den Browser kopieren.
Der Weg funktionierte, aber jeder weitere Mitschreiber hätte denselben
Aufwand gehabt.

### Wer bearbeiten darf

Ohne Freigabe geht es nicht. Jannik ist als Verwalter eingetragen; jedes
andere Google-Konto kann sich anmelden und legt damit **eine** Anfrage an,
die Jannik bestätigen muss.

Entschieden wird das in `firestore.rules`, nicht im Browser. Eine
veränderte Seite kann sich den Stift zwar anzeigen lassen, aber keinen
Schreibvorgang durchsetzen.
3. Auf den Stift ✎ neben dem gewünschten Text klicken.
4. Ändern, **Speichern**.

Änderbar sind der Name eines Eintrags, sein Kurztext, die Überschrift eines
Abschnitts und der Text eines Abschnitts.

**Seit Fassung 2.1.0 auch der Aufbau.** Im Bearbeitungsmodus stehen oben
rechts an jedem Abschnitt drei Knöpfe: ↑ und ↓ verschieben ihn, ✕ löscht ihn
nach Rückfrage. Unter dem letzten Abschnitt legt **+ Abschnitt** einen neuen
an. Im Steckbrief rechts hat jede Zeile einen Stift und ein ✕, darunter legt
**+ Zeile** eine neue an.

Ein neu angelegter Abschnitt bekommt eine Überschrift und den Satz „Hier steht
noch nichts." Das ist Absicht: Das Wiki zeigt keine Abschnitte ohne Text, ein
wirklich leerer wäre also unsichtbar.

Ein Speichervorgang legt `quelle.json`, `welt.json` und `welt.js` zusammen in
**einen** Commit. Das Repository ist damit nach jeder Änderung in sich
stimmig — es gibt keinen Zwischenzustand, in dem die Dateien nicht
zueinander passen.

Im Bearbeitungsfeld steht kein HTML, sondern eine einfache Schreibweise:

| Eingabe | Ergebnis |
| --- | --- |
| Leerzeile | neuer Absatz |
| `## Überschrift` | Zwischenüberschrift |
| `**fett**` | **fett** |
| `*kursiv*` | *kursiv* |
| `- Punkt` | Aufzählung |
| `1. Punkt` | nummerierte Liste |
| `> Zitat` | eingerücktes Zitat |

### Wann die öffentliche Seite den neuen Stand zeigt

Sofort. Gespeichert **ist** veröffentlicht: Die Seite liest die Welt aus
Firestore, es gibt nichts mehr zu bauen.

Bis Fassung 2.x lag zwischen Speichern und Sichtbarwerden etwa eine Minute,
weil GitHub die Seite neu baute. Dieses Warten entfällt.

Jeder Browser merkt sich die zuletzt geholte Welt. Beim nächsten Besuch fragt
er zuerst nur nach, ob sich etwas geändert hat — ein Abruf statt zehn.

---

## Weiterentwicklung

Die technische Grundlage für sichere Upgrades ist dokumentiert:

- [Projektinventar](docs/INVENTAR.md)
- [Architekturkarte](docs/ARCHITEKTUR.md)
- [Datenvertrag](docs/DATENVERTRAG.md)
- [QA-Matrix](docs/QA_MATRIX.md)
- [Release-Runbook](docs/RELEASE_RUNBOOK.md)
- [Upgrade-Fahrplan](docs/UPGRADE_ROADMAP.md)

---

## Prüfungen

Zwölf lokale Wächter sichern Daten, Speicherweg, Laufzeit, Stilstruktur und
Servergrenzen ab. Sie brauchen keine Installation und
schreiben nichts in die Datenbank.

```bash
node werkzeuge/pruefe-gleichstand.mjs
```

Stellt sicher, dass die Kopie unter `daten/` wirklich aus den Rohdaten im
Repository stammt.

```bash
node werkzeuge/pruefe-schreibweise.mjs
```

Übersetzt jeden echten Text hin und wieder zurück und vergleicht, was der
Leser sieht.

```bash
node werkzeuge/pruefe-bearbeiten.mjs
```

Spielt für **alle** bearbeitbaren Felder durch, was beim Öffnen und sofortigen
Speichern passiert. Der Eintrag muss danach zeichengleich sein. Zusätzlich
wird nachgewiesen, dass eine echte Änderung ankommt.

```bash
node werkzeuge/pruefe-struktur.mjs
```

Prüft das Anlegen, Löschen und Umsortieren von Abschnitten und
Steckbriefzeilen auf allen Roh-Einträgen.

```bash
node werkzeuge/pruefe-github.mjs
```

Sichert den früheren Speicherweg über GitHub ab. Er wird seit Fassung 3.0.0
nicht mehr benutzt; die Prüfung bleibt, solange der Weg als Rückfall
bestehen soll. Braucht kein Netz und keine Anmeldung.

```bash
node werkzeuge/pruefe-server-sicherheit.mjs
```

Startet beide reinen Lese-Server nur kurz lokal und prüft erlaubte
Browser-Dateien, gesperrte Pfade, Methoden, HEAD-Antworten und die
Loopback-Bindung der Vorschau.

Zusätzlich prüfen `pruefe-datenvertrag.mjs`, `pruefe-rahmen-routen.mjs`,
`pruefe-bearbeitungskontext.mjs`, `pruefe-leseruntime.mjs`,
`pruefe-cache-graph.mjs` und `pruefe-stilstruktur.mjs` den Legacy-v0-Vertrag,
Rahmenrouten, Bearbeitungsgrenzen, die aufgeteilte Leseruntime, den
Cache-Graphen und die unveränderte Stilbasis.

Die beiden GitHub-Workflows finden alle Dateien nach dem Muster
`werkzeuge/pruefe-*.mjs` automatisch. Schlägt ein Wächter fehl, wird ein
Pages-Artefakt nicht bereitgestellt.

---

## Änderungen nachlesen

Es gibt zwei Änderungsprotokolle mit demselben Inhalt in unterschiedlicher
Sprache:

- **[CHANGELOG.md](CHANGELOG.md)** – in normalem Deutsch, ohne Fachbegriffe.
- **[CHANGELOG-TECHNIK.md](CHANGELOG-TECHNIK.md)** – in der üblichen Entwicklerform.

---

## Herkunft der Inhalte

Die Weltdaten stammten ursprünglich aus der **Weltenschmiede** und wurden am
25. August 2026 in dieses Repository übernommen. Im Datenformat stehen darum
noch alte Bezeichnungen: Das Projekt heißt dort `project-sturmwende-20260730`,
weil die Welt bis zum 24. August 2026 *Sturmwende* hieß. Das ist die Adresse
der Daten, kein Anzeigename — der Weltname **Age of Beast** wird im Wiki
gesetzt.

Die Spezies-Einträge beruhen auf dem Daggerheart-Grundregelwerk beziehungsweise
der SRD 1.0 sowie den Erweiterungen; die jeweilige Quelle steht auf jeder
Spezies-Seite unter **Herkunft**.

Die Gestaltung folgt Janniks Design-Entwurf *Aschekodex Wiki*. Es wird keine
Schriftart aus dem Netz nachgeladen: Ist „Inter“ auf dem Gerät vorhanden, wird
sie verwendet, sonst die Systemschrift.

Daggerheart ist ein Produkt von Darrington Press. Dieses Wiki ist ein
privates Hilfsmittel für eine Heimrunde und steht in keiner Verbindung zum
Verlag.
