# Änderungen – einfach erklärt

Hier steht in normalem Deutsch, was sich im Wiki geändert hat. Ohne Fachbegriffe.
Dieselben Änderungen stehen in Entwicklersprache in [CHANGELOG-TECHNIK.md](CHANGELOG-TECHNIK.md).

Das Neueste steht immer oben.

---

## Fassung 1.0.0 – 24. August 2026

**Das Wiki gibt es jetzt.** Bisher lagen die Inhalte nur in der Weltenschmiede.
Dort muss man sich anmelden und sich durch die Bearbeitungsoberfläche klicken.
Jetzt gibt es zusätzlich eine reine Leseseite, die sich schnell öffnet, auf dem
Handy funktioniert und keine Anmeldung braucht.

### Was drin ist

Alle **29 Einträge** aus dem Sturmwende-Projekt:

- die Kampagnenübersicht,
- die beiden Fraktionen **Maschinisten** und **Goldene Garde**,
- alle **24 Spezies**,
- **Lukas' Spielfigur**,
- die **Uniform der Goldenen Garde**.

Dazu 103 Textabschnitte, 106 Angaben in den Steckbriefen und 9 feste
Verbindungen zwischen Einträgen.

### Die wichtigste Neuerung: Verweise mit Vorschau

Wenn im Text der Name eines anderen Eintrags vorkommt, wird er automatisch zu
einem Verweis. Hält man die Maus darüber, klappt ein kleines Fenster auf und
zeigt, worum es bei diesem Eintrag geht — man muss die Seite nicht verlassen.
Auf dem Handy genügt ein Antippen; ein zweites Tippen auf „Öffnen" führt hin.

Insgesamt erkennt das Wiki **45 Begriffe**. Elf davon hattest du selbst in der
Weltenschmiede hinterlegt, die übrigen sind die Namen und Zweitbezeichnungen
der Einträge.

Zwei Regeln sorgen dafür, dass der Text lesbar bleibt:

- Ein Begriff wird pro Seite nur **beim ersten Mal** verlinkt. Sonst wäre bei
  den Maschinisten fast jedes zweite Wort unterstrichen.
- Ein Begriff wird nur verlinkt, wenn er **groß geschrieben** ist. Deutsche
  Hauptwörter sind das immer. Dadurch wird aus der Zahl „elf" kein Verweis auf
  die Spezies „Elf".

### Zwei Begriffe werden mit Absicht nicht verlinkt

- **„Elemental Kin"** gehört gleichzeitig zu vier Spezies (Earthkin, Emberkin,
  Skykin, Tidekin). Ein Verweis müsste sich für eine entscheiden und läge in
  drei von vier Fällen falsch.
- **„Prototyp"** ist eine alte Zweitbezeichnung des Kampagnen-Eintrags. Das Wort
  kommt im Text in ganz anderer Bedeutung vor.

Beide Bezeichnungen stehen weiterhin bei ihren Einträgen — sie werden nur nicht
automatisch verlinkt.

### Was jede Eintragsseite zeigt

Links der Fließtext, rechts ein Steckbrief mit vier Blöcken:

| Block | Inhalt |
| --- | --- |
| **Attribute** | die Kurzangaben, etwa Klassifikation oder Lebenserwartung |
| **Verknüpfungen** | womit der Eintrag fest verbunden ist, mit Erklärung |
| **Erwähnt in** | wo er sonst noch im Text vorkommt |
| **Herkunft** | Regelquelle und wann er zuletzt bearbeitet wurde |

Auf schmalen Bildschirmen rutschen diese Blöcke unter den Text.

### Kein Text ist verlorengegangen

Die Weltenschmiede legt Texte an zwei Stellen ab: in Anzeigefeldern und in
Hintergrundfeldern. Beim Übertragen wurde geprüft, ob wirklich jeder Text im
Wiki ankommt.

Ergebnis: **10 Texte** standen nur in den Hintergrundfeldern. Sie wurden als
eigene Abschnitte ergänzt und sind mit dem Vermerk *aus der Weltenschmiede*
gekennzeichnet. Weitere **75 Texte** waren doppelt vorhanden und wurden nur
einmal übernommen.

### Ein Hinweis auf den Reifegrad

Jede Kachel zeigt unten rechts **ausgebaut** oder **knapp**. Das ist keine
Bewertung, sondern nur eine Messung des Umfangs: mindestens drei Abschnitte und
mehr als 900 Zeichen gelten als ausgebaut. So siehst du auf einen Blick, wo noch
Arbeit wartet.

### Aussehen

Das Wiki folgt deinem Entwurf **„Aschekodex"** aus dem Design-Projekt: sehr
dunkler Hintergrund, Serifenschrift für Überschriften, blauviolette Akzente,
kleine gesperrte Großbuchstaben als Etiketten und ein sanfter Schein, wenn die
Maus über eine Kachel fährt.

Zusätzlich gibt es oben rechts einen Schalter zwischen hell und dunkel. Dunkel
ist voreingestellt.

### Drei Fehler, die beim Bauen auffielen und behoben wurden

1. **Alles war fett.** Beim Übertragen aus der Weltenschmiede gingen die
   schließenden Markierungen verloren, dadurch lief eine Fettschrift bis zum
   Seitenende weiter. Jetzt ist geprüft, dass in allen 29 Einträgen jede
   Auszeichnung sauber geschlossen wird.
2. **Auf dem Handy war der Text unsichtbar.** Wenn die Seitenleiste zugeklappt
   war, bekam der Inhalt eine null Pixel breite Spalte zugewiesen. Behoben.
3. **Der Kopfbereich lief über.** Der lange Untertitel drückte das Suchfeld auf
   null. Jetzt behält die Suche immer mindestens 200 Pixel, und der Untertitel
   weicht bei schmalen Fenstern.

### Womit das Wiki gebaut ist

Mit nichts. Es sind drei Dateien — die Seite, die Gestaltung und die Logik —
dazu die Daten. Kein Baukasten, keine Installation, keine fremden Bausteine,
die man pflegen müsste. Wer den Ordner in fünf Jahren öffnet, kann ihn immer
noch benutzen.

---

## Wie es hier weitergeht

Bei jeder Änderung kommt oben ein neuer Abschnitt dazu. Die Nummer davor
bedeutet:

- **Dritte Stelle** (1.0.**1**): Ein Fehler wurde behoben, sonst nichts.
- **Zweite Stelle** (1.**1**.0): Es ist etwas dazugekommen.
- **Erste Stelle** (**2**.0.0): Etwas funktioniert grundlegend anders als vorher.

Reines Auffrischen der Inhalte aus der Weltenschmiede bekommt keine neue Nummer.
