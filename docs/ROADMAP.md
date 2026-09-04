# Fahrplan

Dieses Dokument trägt die **Begründung**: was gebaut werden soll, warum
in dieser Reihenfolge, und woran man erkennt, dass ein Schritt fertig
ist.

**Den Stand trägt es nicht.** Der lebt im Vorgang (Regel 13/14). Ein
„erledigt" hier veraltet lautlos — ein geschlossener Vorgang nicht.
Was gerade offen ist, sagt `node werkzeuge/vorgaenge.mjs stand`.

<!-- keine-phase -->
## Das Format, das die Werkzeuge lesen

| Zeile | Bedeutung |
| --- | --- |
| `## Titel` | eine **Phase** — Sammelvorgang mit Label `track` |
| `### Titel` | ein **Schritt** darunter — Kind-Vorgang mit Label `schritt` |
| `Vorgang: #12` | die Nummer, sobald der Vorgang angelegt ist |

Die Nummer schreibt niemand von Hand: `node werkzeuge/vorgaenge.mjs
roadmap` zeigt erst, was fehlt; mit `--wirklich` legt es die Vorgänge an
und nennt die Nummern.

**Warum die Nummer trotzdem hier steht,** obwohl der Stand es nicht
darf: Sie ist ein **Verweis**, keine Behauptung. `Vorgang: #12` ist
morgen noch richtig, `erledigt` vielleicht nicht.

---

## Die Plattform trägt mehrere Wikis

Am 04.09.2026 wurde aus dem Wiki eine Plattform: Hauptmenü mit
Anmeldung, Wikiliste, Anlegen mit Regelwerkwahl. Die Rechte stehen und
waren am 04.09.2026 veröffentlicht — 25 von 25 Fällen im Simulator.

**Was noch fehlt, ist die Trennung der Inhalte.** `wiki.html` zeigt
heute immer dieselbe Welt, egal welche Kennung in der Adresse steht.
Das ist kein Versehen und auch keine halbe Umsetzung: Wer mit einer
fremden Kennung ankommt, bekommt einen ehrlichen Hinweis statt fremder
Inhalte unter dem richtigen Namen. Ein Wiki, das die falsche Welt unter
dem richtigen Titel zeigt, wäre die schlimmere Sorte Fehler — niemand
bemerkt ihn.

Diese Phase steht vor allen anderen, weil jede weitere Arbeit an
Inhalten sonst doppelt gemacht werden müsste.

**Fertig, wenn:** Zwei verschiedene Wiki-Kennungen zeigen im Browser
nachweislich verschiedene Einträge, und keine Seite liest mehr aus der
alten Sammlung `wiki_welt`.

Vorgang: #1

### Weltdaten nach `wiki_projekte/{wikiId}/welt` umziehen

Die Daten liegen bereits dort — beim Eintragen des bestehenden Wikis
wurden am 04.09.2026 zehn Weltmodule dorthin kopiert, ohne `wiki_welt`
anzufassen. Was fehlt, ist der **Leseweg**: `bearbeiten.js` und der
Startpfad holen die Welt weiterhin aus `wiki_welt`.

Die alte Sammlung bleibt liegen, bis der neue Weg nachweislich
funktioniert. Erst dann wird sie entfernt, und das ist ein eigener
Schritt mit eigener Freigabe.

**Fertig, wenn:** Der Leser holt die Welt aus
`wiki_projekte/{wikiId}/welt`, und ein Aufruf mit einer zweiten Kennung
zeigt im Browser andere Einträge.

Vorgang: #2

### Die alte Sammlung `wiki_welt` entfernen

Erst nach dem Umzug, und erst nach Janniks ausdrücklicher Freigabe:
Gelöschte Firestore-Daten haben keinen Rückweg.

**Fertig, wenn:** `wiki_welt` ist leer, und die Live-Seite zeigt
unverändert 59 Einträge.

Vorgang: #3

---

## Charakterbögen wachsen mit der Ausrüstung

Janniks Wunsch vom 04.09.2026, wörtlich: *„Die Charakterbögen, die Werte
wie Stress, HP, Rüstung usw. sollen sich automatisch ändern beim An-
oder Ablegen von Items. Und beim Drüberhalten wird angezeigt, was
Grundwert und was Bonus oder Malus ist und wodurch es verursacht wird."*

**Warum das ein Umbau ist und keine Anzeige:** In den Figurendaten
stehen heute **fertige Endwerte**. Brix hat `evasion: 13`; dass darin 12
Klassenbasis und +1 vom Gambeson stecken, steht nirgends. Ein Wert ohne
Herkunft lässt sich weder erklären noch beim Ablegen zurücknehmen.

**Die Grenze, gemessen am 04.09.2026:** Von 123 Gegenständen tragen 93
einen Wirkungstext — aber nur **13 sind rein rechenbar**, 8 gemischt,
**72 sind Spielregel statt Zahl** („Stress markieren, um ein weiteres
Ziel anzugreifen"). Solche Wirkungen hängen an einer Entscheidung am
Tisch und werden **angezeigt, nie stillschweigend eingerechnet**. Eine
geratene Zahl wäre schlimmer als keine: Der Bogen zeigte dann einen
Wert, der im Spiel nicht gilt.

**Fertig, wenn:** Ein Gegenstand lässt sich im Bogen an- und ablegen,
alle betroffenen Werte ändern sich mit, und die Herleitung ist am
Bildschirm ablesbar.

Vorgang: #4

### Rechenmodell mit Herleitung

`werkzeuge/werte-rechnen.mjs` — DOM-frei, damit ohne Browser prüfbar.
Grundwert plus Beiträge ergibt den Endwert; jeder Beitrag weiß, woher er
kommt.

**Fertig, wenn:** Die Rechnung reproduziert für beide vorhandenen
Figuren die heute eingetragenen Endwerte, und ein abgelegtes
Rüstungsstück nimmt seinen Bonus nachweislich zurück.

Vorgang: #5

### An- und Ablegen im Bogen

**Fertig, wenn:** Ein Klick auf ein Ausrüstungsstück ändert im Browser
die angezeigten Werte, und ein Neuladen stellt den Zustand wieder her.

Vorgang: #6

### Herleitung beim Überfahren

**Fertig, wenn:** Das Überfahren eines Werts zeigt Grundwert, jeden
Beitrag und seine Quelle; auf dem Handy tut das ein Antippen.

Vorgang: #7

### Charakterbögen anlegen

Bisher lassen sich Bögen nur anzeigen. Janniks Auftrag nennt
ausdrücklich „Charakterbögen erstellen und pflegen".

**Fertig, wenn:** Ein neuer Bogen entsteht im Browser, wird gespeichert
und erscheint nach dem Neuladen in der Auswahlleiste.

Vorgang: #8

---

## Die Regelinhalte sind im Wiki so geordnet wie auf den Kartenseiten

Auf `karten.html` stehen die 393 Karten seit dem 04.09.2026 in 17
Blöcken. Im Wiki selbst liegen die Daggerheart-Einträge weiterhin
ungruppiert zwischen den Welteinträgen.

**Fertig, wenn:** Die Regeleinträge im Wiki sind nach ihrer Art
gegliedert, und die Gliederung stammt aus denselben Daten wie auf der
Kartenseite — nicht aus einer zweiten Liste.

Vorgang: #9

---

<!-- keine-phase -->
## Was **nicht** hierher gehört

| | wohin stattdessen |
| --- | --- |
| „läuft", „erledigt", „als Nächstes" | in den Vorgang |
| ein Häkchen an einem Schritt | in die Aufgabenliste des Sammelvorgangs |
| ein gefundener Fehler | eigener Vorgang mit Label `fehler`, nach der Behebung ein Fall im Fehlerbuch |
| ein Wunsch von Jannik | eigener Vorgang mit `wunsch` + `track`, sein Wortlaut zitiert |
| eine offene Frage | eigener Vorgang mit `entscheidung` — **an keiner Phase** |
| eine gepflegte Übersichtstabelle | `node werkzeuge/vorgaenge.mjs stand` |

<!-- keine-phase -->
## Was ein datierter Vermerk darf

„Gemessen am 04.09.2026: 13 von 93 Wirkungstexten sind rechenbar" bleibt
richtig, auch wenn morgen mehr Gegenstände dazukommen — das Datum legt
die Aussage trocken. Solche Belege sind hier willkommen: Sie begründen
die Reihenfolge.
