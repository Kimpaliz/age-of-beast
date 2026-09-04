# Vom einen Wiki zur Plattform

Januar-Stand: **eine** Welt, fest verdrahtet. Ziel: mehrere Wikis, jedes
mit eigenem Inhalt, eigenen Mitgliedern und eigenen Regelwerken.

Dieses Dokument hält die Entscheidungen fest, **bevor** gebaut wird —
und die eine Vorgabe, die so nicht geht.

---

## Die harte Grenze: „eigene Datenbank" geht nicht

Janniks Wunsch: *„ein ganz neues [Wiki] mit eigener Datenbank erstellen"*.

**Ein Firebase-Projekt auf dem Spark-Plan hat genau eine
Firestore-Datenbank.** Eine zweite verlangt den Blaze-Plan, also ein
hinterlegtes Zahlungsmittel. Das ist heute (04.09.2026) am Projekt
`kampagnenrahmen-jt` gemessen worden — es ist derselbe Befund, an dem
sich Wiki und Scotophobia **eine** Regeldatei teilen müssen.

### Was stattdessen gebaut wird

Jedes Wiki bekommt seinen **eigenen Teilbaum** unter `wikis/{wikiId}/`:

```
wikis/{wikiId}                     ← Steckbrief: Name, Regelwerke, Besitzer
wikis/{wikiId}/welt/{teil}         ← die Weltdaten, wie bisher
wikis/{wikiId}/mitglieder/{uid}    ← wer darf was
```

**Was das leistet — und was nicht:**

| | |
| --- | --- |
| Inhalte getrennt | ✔ kein Wiki sieht die Daten eines anderen |
| Rechte getrennt | ✔ Mitgliedschaft gilt je Wiki |
| Durch Regeln erzwungen | ✔ nicht nur durch die Oberfläche |
| Getrennt abrechenbar | ✘ ein Kontingent für alle |
| Getrennt löschbar/exportierbar | ✔ ein Teilbaum |
| Physisch getrennte Datenbank | ✘ braucht Blaze |

Für alles, was am Spieltisch zählt, ist der Unterschied nicht spürbar.
Wer die physische Trennung wirklich braucht, muss auf Blaze wechseln —
das ist Janniks Entscheidung und kostet Geld.

---

## Die zweite Grenze: Regeln werden **einmal** geschrieben

Ein neues Wiki darf **keinen** Deploy auslösen. Firestore-Regeln lassen
sich nicht je Wiki ergänzen — es gibt eine Datei fürs ganze Projekt, und
ihr Deploy trifft auch Scotophobia (siehe `docs/PROJEKTGRENZE.md`).

Deshalb sind die Regeln **generisch**: Sie sprechen über
`wikis/{wikiId}` und schlagen die Mitgliedschaft in der Datenbank nach.
Ein neues Wiki anzulegen ist damit ein gewöhnlicher Schreibvorgang, kein
Eingriff in die Infrastruktur.

> **Merksatz:** Wenn das Anlegen eines Wikis einen Deploy bräuchte, wäre
> die Plattform kaputt entworfen.

---

## Rollen

| Rolle | darf |
| --- | --- |
| `besitzer` | alles, auch löschen und Mitglieder verwalten |
| `schreiber` | Einträge anlegen, ändern, löschen |
| `leser` | lesen |
| *niemand* | nur öffentliche Wikis lesen |

Ein Wiki ist entweder **öffentlich lesbar** (`oeffentlich: true`) oder
nur für seine Mitglieder. Schreiben verlangt immer Mitgliedschaft.

---

## Der Weg des Benutzers

```
Hauptmenü (index.html)
  ├─ nicht angemeldet → Anmeldeknopf, dazu die öffentlichen Wikis zum Lesen
  └─ angemeldet
       ├─ meine Wikis  → hinein
       ├─ öffentliche Wikis → hinein
       └─ neues Wiki anlegen
            ├─ Name
            ├─ Regelwerke ankreuzen  (heute: Daggerheart)
            └─ öffentlich ja/nein
```

Im Wiki ändert sich für den Leser nichts — es kommt nur der Rückweg ins
Hauptmenü dazu.

---

## Regelwerke

Ein Regelwerk ist ein **Paket aus Daten und Vorlagen**, kein Programm:

```js
{
  schluessel: 'daggerheart',
  name: 'Daggerheart',
  karten: 'daten/daggerheart-karten.json',
  bogen: 'daggerheart',            // welcher Charakterbogen gilt
  vorlagen: ['npc', 'ort', 'poi', 'gegenstand'],
}
```

Wählt ein Wiki Daggerheart, bekommt es die 270 Karten, den
Daggerheart-Charakterbogen und die passenden Vorlagen. Wählt es nichts,
bleiben die allgemeinen Vorlagen.

**Warum als Daten und nicht als Code:** Ein zweites Regelwerk soll eine
Datei sein, kein Umbau.

---

## Migration des bestehenden Wikis

Das Age-of-Beast-Wiki wird das erste Wiki mit der Kennung
`age-of-beast`. Bis die Umstellung durch ist, gilt:

1. `wiki_welt` bleibt liegen und wird **weiter gelesen**.
2. Der neue Baum `wikis/age-of-beast/welt` wird zusätzlich befüllt.
3. Erst wenn beide nachweislich denselben Inhalt tragen, schaltet der
   Leser um.
4. `wiki_welt` wird **nicht** gelöscht, bevor Jannik es sagt.

Das ist dieselbe Vorsicht wie bei BATC: erst doppelt fahren, dann
umschalten, dann erst abräumen.

---

## Reihenfolge des Baus

| | Schritt | Zustand |
| --- | --- | --- |
| A | dieses Dokument | ✔ |
| B | Regeln für `wikis/{wikiId}` | |
| C | Hauptmenü mit Anmeldung, Wikiliste, Anlegen | |
| D | Handy-Oberfläche im Wiki: Navigation und Suche | |
| E | Vorlagen: NPC, Ort, POI, Gegenstand | |
| F | Daggerheart-Karten nach Gruppen | |
| G | Charakterbögen anlegen und pflegen, Farben nach Klasse | |
| H | Weltkarte mit Stecknadeln zu anderen Orten | |
| I | Eigenes Rechtsklickmenü am Rechner | |

Jeder Schritt geht einzeln nach `main` und ist einzeln benutzbar. Das
Wiki bleibt in jedem Zwischenstand lauffähig.

[Aufgabe: Rahmen]
