# Projektgrenze zu Scotophobia

Status: **beschlossen und gebaut** · Stand: 04.09.2026

Dieses Wiki hat einen Nachbarn, den man ihm nicht ansieht: das Spiel
**Scotophobia** (`C:\Users\Jannik\OneDrive\Dokumente\Granithoehle`,
Repository `Kimpaliz/granithoehle`, live auf
<https://scotophobia-jt.web.app>). Kein Quelltext ist geteilt, keine
Datei wird kopiert — und trotzdem kann eine Änderung hier das Spiel
abschalten.

Der Grund steht in einem Satz: **Firestore hat pro Datenbank genau eine
Regeldatei, und der Spark-Tarif erlaubt keine zweite Datenbank**
(`billingEnabled: false`, gemessen). Beide Anwendungen leben im
Firebase-Projekt `kampagnenrahmen-jt`. Wer aus einem der beiden
Repositorys `firestore.rules` deployt, überschreibt damit auch die
Regeln des anderen — und der Deploy **meldet dabei Erfolg**.

## Dieses Projekt besitzt

- die Firestore-Sammlungen `wiki_welt` und `wiki_zugang`
- die Regelfunktionen `istWikiAdmin()` und `istWikiSchreiber()`
- die GitHub-Pages-Seite <https://kimpaliz.github.io/age-of-beast/>
- alles in diesem Repository außer dem, was unten steht

## Scotophobia besitzt

- seine eigenen Firestore-Sammlungen (`spielstaende`, Rückmeldungen,
  Freigaben und weitere) — sie werden **nicht aufgezählt**, sondern aus
  Scotophobias Regeldatei gelesen; eine neue Sammlung dort wäre sonst
  eine Lücke, die niemandem auffällt
- seine Hilfsfunktionen, darunter `istFreigeschaltet()`
- den Firebase-Hosting-Teil des Projekts

## Erlaubte Verbindung

Genau eine, und sie läuft nur in **eine** Richtung:

```text
Kimpaliz/granithoehle
  └─ firestore.rules  (Scotophobias Fassung, die Wahrheit für seinen Teil)
       └─ dieses Repository schneidet sie heraus und setzt seinen
          Wiki-Teil daneben — abgetippt wird nie
```

`werkzeuge/pruefe-firestore-trennung.mjs` liest Scotophobias Regeldatei
als Vergleichsquelle. Der Pfad ist **nicht fest verdrahtet**: Ohne
Umgebungsvariable sucht sie `../Granithoehle/firestore.rules`, mit
`SCOTOPHOBIA_REGELN` gilt ausschließlich der gesetzte Pfad.

## Verboten

- Scotophobias Regelblöcke hier **abtippen** statt schneiden — sie
  veralten still
- eine Bedingung teilen: Wer bei Scotophobia freigeschaltet ist, darf
  dadurch **nicht** das Wiki bearbeiten. Deshalb `istWikiSchreiber()`
  statt `istFreigeschaltet()`
- Schreibzugriff auf Scotophobias Sammlungen
- gemeinsame Tokens oder Zugangsdaten
- **`firebase deploy --only firestore:rules` aus irgendeinem der beiden
  Repositorys, ohne vorher diese Prüfung laufen zu lassen**

## ⚠️ Geteilte Ressourcen

| Ressource | geteilt mit | Regel | Wächter |
| --- | --- | --- | --- |
| Firestore-Regeldatei `firestore.rules` | Scotophobia | Nur die **Sammelfassung** aus diesem Repository deployen; sie muss Scotophobias Blöcke wortgleich enthalten | `werkzeuge/pruefe-firestore-trennung.mjs` |
| Firebase-Projekt `kampagnenrahmen-jt` | Scotophobia **und** der Daggerheart-Werkstatt (Realtime Database, `daggerheartCreator`) | Das Projekt darf **nicht** abgeschaltet werden — es hängt mehr daran als dieses Wiki | — (nur diese Notiz) |

## Der Musterfall: die Falle ist wirklich zugeschnappt

Am **04.09.2026** ist genau das eingetreten, wogegen der Wächter gebaut
wurde — und zwar **in beide Richtungen**:

1. Zwischen dem ersten Deploy am 02.09. und dem Zusammenführen nach
   `main` wurde **Scotophobias Teilfassung** veröffentlicht. Folge: Die
   Wiki-Regeln waren weg, jeder Lesezugriff auf `wiki_welt` antwortete
   mit **403**. Bemerkt wurde es beim Abgleich vor dem Merge — nicht
   durch eine Meldung. Der Deploy hatte Erfolg gemeldet.
2. Umgekehrt war die Wiki-Fassung inzwischen ebenfalls veraltet:
   Scotophobia hatte acht Hilfsfunktionen und zwei Sammlungen dazu
   bekommen, seine Regeldatei war von **4.822 auf 11.198 Zeichen**
   gewachsen. Ein Deploy der Wiki-Fassung hätte nun **Scotophobia**
   beschädigt.

Punkt 2 hat `pruefe-firestore-trennung.mjs` verhindert: **elf Meldungen,
Rückgabewert 1.** Behoben wurde es, indem die Datei aus Scotophobias
aktueller Fassung neu gebaut wurde — der Wiki-Teil wird geschnitten, nie
abgetippt.

**Die Lehre:** Eine Grenze, die nur im Kopf existiert, wird überschritten.
Diese hier hat einen Wächter, und der hat seine Wirksamkeit an sechs
absichtlichen Beschädigungen belegt.

**Und eine zweite, teurer bezahlte:** Beim Neubau der Datei war die
Klammerbilanz **ausgeglichen (16 zu 16)** und die Datei trotzdem kaputt —
ein neu geschriebener Trennkommentar hatte das fehlende Zeichenpaar
zufällig ersetzt. Der Wächter zählt seitdem der Reihe nach statt in
Summe. *Eine ausgeglichene Bilanz beweist keine heile Struktur.*

---

## Warum das Präfix entscheidet, nicht die Datei

Bis zum 04.09.2026 galt für `werkzeuge/pruefe-firestore-trennung.mjs`:
*Was in Scotophobias Regeldatei steht, gehört Scotophobia.* Diese Annahme
ist entfallen.

Seit dem Tag führen **beide Repositorys dieselbe vollständige Regeldatei**.
Der Grund steht oben im Musterfall: Eine Firestore-Datenbank hat genau eine
Regeldatei, der Spark-Plan erlaubt keine zweite, und Scotophobias
Teilfassung hat das Wiki bei jedem Deploy abgeschaltet — an einem Tag
viermal, einmal 68 Sekunden nach einer Reparatur. Wiederholtes Reparieren
half nicht; erst die gemeinsame vollständige Datei hat es beendet.

Damit stehen die `wiki_`-Blöcke auch in Scotophobias Fassung. Ein Wächter,
der die Zugehörigkeit aus der Datei ableitet, hält `wiki_welt` seither für
eine Scotophobia-Sammlung und meldet die Trennung als verletzt. **Maßgeblich
ist deshalb das Präfix**, und zwar an zwei Stellen: bei der Zuordnung der
Sammlungen und Hilfsfunktionen, und bei der Wahl des Blocks, den der
Selbsttest beschädigt — sonst prüfte der Selbsttest das Gegenteil dessen,
wofür er da ist.

Die Gegenrichtung sichert `werkzeuge/pruefe-firestore-wiki.mjs` in
Scotophobias Repository: Es prüft, dass die `wiki_`-Blöcke dort vorhanden
und mit der Fassung hier wortgleich sind.

## Vor jeder Veröffentlichung

Die Kette (`node werkzeuge/pruefe-alles.mjs`) allein genügt nicht. Dazu:

```bash
node werkzeuge/pruefe-freigabe.mjs
```

Sie prüft den Arbeitsstand auf Verbotenes, die Doku auf ungefüllte
Platzhalter, das Vorhandensein einer `README.md` — und durchsucht die
**gesamte Git-Historie** nach Geheimnismustern. Das ist der Teil, den man
nachträglich nicht mehr reparieren kann: Das Repository ist seit dem
24.08.2026 öffentlich.

Beide GitHub-Abläufe sammeln jede `werkzeuge/pruefe-*.mjs` ein, diese
Prüfung läuft dort also ohnehin mit (gemessen 04.09.2026: 0,34 s, davon
148 ms für 4.086.314 Zeichen `git log --all -p`).

**Was nur ein Mensch prüfen kann**, druckt sie am Ende selbst:
mitgelieferte Fremdlizenzen, echte Personendaten in Beispieldaten, die
Absender-Adresse der Commits — und ein Durchklick am echten Gerät.

**Und was hier dazukommt:** Ein Regel-Deploy braucht zusätzlich einen
Blick nach Scotophobia — nach dem Deploy einmal nachsehen, dass seine
Sammlungen noch lesbar sind. Der Wächter prüft die Datei, nicht die
Wirklichkeit.
