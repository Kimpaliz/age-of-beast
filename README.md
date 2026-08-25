# Age of Beast – Weltwiki

Ein Nachschlagewerk zur Daggerheart-Welt **Age of Beast**: Kampagnenübersicht,
Fraktionen, Spezies, Figuren und Gegenstände. Verlinkte Begriffe zeigen beim
Überfahren mit der Maus eine Kurzfassung, ohne dass man die Seite wechseln muss.

**Stand der Weltdaten:** 22. August 2026 · **29 Einträge** · 79 Abschnitte

---

## Wiki ansehen

**Der einfachste Weg:** Doppelklick auf `index.html`. Das Wiki läuft ohne
Installation und ohne Internetverbindung direkt im Browser.

**Wie später im Netz:** einen kleinen lokalen Server starten.

```bash
node werkzeuge/vorschau-server.mjs
```

Danach `http://localhost:4173` im Browser öffnen. Beenden mit `Strg + C`.

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
| **Bearbeiten** | Nur angemeldet: Name, Kurztext, Abschnittsüberschriften und Abschnittstexte lassen sich direkt im Wiki ändern. Siehe unten. |

Alle Inhalte sind Text. Es gibt keine Bilder, keine Werbung, keine
Nachverfolgung und keine Verbindung nach außen.

---

## Aufbau des Projekts

```
index.html                 die Seite selbst
stil.css                   die gesamte Gestaltung
wiki.js                    Navigation, Suche, Verweise, Vorschau
bearbeiten.js              Anmeldung und Speichern nach GitHub
texte-bearbeiten.js        die Bedienung zum Ändern von Texten
daten/quelle.json          DIE WELT – hier steht die Wahrheit
daten/welt.json            daraus abgeleitet, die Anzeigefassung
daten/welt.js              dieselben Daten für den Betrieb ohne Server
werkzeuge/                 Umwandlung, Speicherweg und Prüfungen
```

Bewusst **ohne** Baukasten, ohne `npm install`, ohne Übersetzungsschritt:
Wer die Dateien herunterlädt, kann das Wiki sofort öffnen.

**Ohne fremde Dienste.** Seit Fassung 2.0.0 braucht das Wiki keinen Server
und keinen Datenbankanbieter. Die Welt liegt als Datei im Repository, gelesen
und geschrieben wird über GitHub selbst. Für Besucher wird nichts von außen
nachgeladen — keine Schriftart, kein Skript, keine Nachverfolgung.

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
Gespeichert wird als Commit in dieses Repository.

### Einmalig: Schlüssel anlegen

GitHub Pages liefert nur Dateien aus; dort läuft kein Programm, das ein
Passwort verwahren könnte. Zum Schreiben braucht das Wiki deshalb einen
Schlüssel, den du selbst erzeugst:

1. [Fine-grained Token bei GitHub anlegen](https://github.com/settings/personal-access-tokens/new)
2. **Repository access** → *Only select repositories* → `age-of-beast`
3. **Permissions** → *Repository permissions* → **Contents: Read and write**
4. Erzeugen und kopieren

Der Schlüssel darf damit **nur Dateien in diesem einen Repository ändern** —
nicht an dein Konto, nicht an andere Repositories, an gar nichts sonst. Jede
Änderung ist ein Commit und damit rücknehmbar. Widerrufen kannst du ihn
jederzeit in den GitHub-Einstellungen.

### Danach: bearbeiten

1. Oben rechts auf **Anmelden**, Schlüssel einfügen. Das Wiki merkt ihn sich
   auf diesem Gerät — auf einem neuen Gerät einmal wiederholen.
2. Auf **Bearbeiten** klicken.
3. Auf den Stift ✎ neben dem gewünschten Text klicken.
4. Ändern, **Speichern**.

Änderbar sind der Name eines Eintrags, sein Kurztext, die Überschrift eines
Abschnitts und der Text eines Abschnitts. Abschnitte anlegen, löschen oder
umsortieren geht noch nicht.

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

Gespeichert ist sofort. Die öffentliche Seite baut GitHub danach neu, das
dauert etwa eine Minute. Das Wiki sagt dir Bescheid: erst
„Wird veröffentlicht …", dann „Veröffentlicht. Die Seite ist überall aktuell."

Du selbst siehst deine Änderung natürlich sofort — angemeldet zeigt das Wiki
den Stand aus dem Repository, nicht die veröffentlichte Kopie.

---

## Prüfungen

Drei Skripte sichern die Inhalte ab. Sie brauchen keine Installation und
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
node werkzeuge/pruefe-github.mjs
```

Sichert den Speicherweg ab: dass die Umkodierung auch bei 274 KB und Umlauten
keinen Text verändert, und dass der Browser beim Speichern Zeichen für Zeichen
dieselben Dateien erzeugt wie das Skript. Braucht kein Netz und keinen
Schlüssel — es wird nichts geschrieben und nichts abgefragt.

Alle vier laufen auch bei jeder Veröffentlichung automatisch. Schlägt eine
fehl, geht die Änderung nicht online.

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
