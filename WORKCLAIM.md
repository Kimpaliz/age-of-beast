# Workclaim — wer arbeitet gerade woran

**Vor jedem Schreiben lesen. Vor jedem eigenen Schreiben eintragen.**
Ein Bereich unter fremdem Besitz wird nicht angefasst — Zugriff nur mit
ausdrücklicher Erlaubnis des Besitzers oder Janniks. Nach getaner
Arbeit wird die eigene Zeile auf `frei` gesetzt oder entfernt.

Warum es diese Datei gibt: Am 02.09.2026 hat eine zweite Sitzung mitten
im Checkout einer ersten einen Merge gestartet — sieben Dateien voller
Konfliktmarker. Chatverläufe sind nicht geteilt; diese Datei ist die
einzige Stelle, an der sich zwei Sitzungen sehen.

**Am 04.09.2026 arbeiten drei Sitzungen im selben Checkout.** Das ist
genau die Lage, für die diese Datei gebaut ist. Wer hinzukommt, trägt
sich ein, bevor er schreibt.

| Bereich | Besitzer | Ziel | Seit |
| --- | --- | --- | --- |
| frei | frei | – | – |

## Der Zwischenfall vom 04.09.2026 — hier passiert, während die Datei entstand

Diese Datei wurde am 04.09.2026 im Zuge der Alpha-Code-Einrichtung
angelegt. **Noch bevor sie zum ersten Mal committet war, ist genau der
Fall eingetreten, gegen den sie gebaut ist:**

Die Einrichtungs-Sitzung arbeitete auf `einrichtung/alpha-code`. Eine
zweite Sitzung („Weltkarte") legte im **selben Arbeitsverzeichnis**
`welt/karte-und-figuren` an, wechselte dorthin und committete. Damit lag
die halbfertige Einrichtung plötzlich auf einem fremden Zweig — nicht
verloren (offene Änderungen wandern beim Wechsel mit), aber am falschen
Ort. Aufgefallen ist es beiläufig, an einem `git branch -a`, nicht durch
eine Meldung.

**Was daraus zu lernen ist**, und was ab jetzt gilt:

1. **Ein Checkout, ein Zweig.** Wer parallel an etwas anderem arbeitet,
   nimmt einen eigenen Worktree (`git worktree add`) — das Projekt hat
   davon schon elf unter `_codex-worktrees/`. Der Zweigwechsel im
   gemeinsamen Verzeichnis ist der Griff, der die Arbeit des anderen
   verschiebt.
2. **Vor `git switch` diese Datei lesen.** Steht dort ein fremder
   Anspruch, wird nicht gewechselt.
3. `git branch --show-current` **vor** dem Committen prüfen. Es hätte
   den Fehler in einer Sekunde gezeigt.

## Was Sitzungen im selben Checkout voneinander wissen müssen

- Die Alpha-Code-Einrichtung (`einrichtung/alpha-code`) hat **keine
  bestehende Quelldatei angefasst**. Sie hat nur neue Gerüst- und
  Wächterdateien angelegt und die acht älteren Dokumente in `docs/`
  richtiggestellt.
- **Die Kopfnotizen fehlen noch** — Schritt 5 der Methode. Er berührt
  jede Quelldatei und wurde deshalb aufgeschoben, solange hier mehrere
  schreiben. Die 47 betroffenen Dateien stehen mit ihrem künftigen Tag
  in [docs/ALTLASTEN.md](docs/ALTLASTEN.md).
- **Der Zweig `welt/karte-und-figuren` bringt sieben Quelldateien mit**,
  von denen vier ihren Tag `Karte` schon tragen — nur ein paar Zeilen zu
  weit unten. Was beim Zusammenführen zu tun ist, steht am Ende von
  [docs/ALTLASTEN.md](docs/ALTLASTEN.md).
- `pruefe-arbeitsweise.mjs` sieht die offenen Dateien **aller**
  Sitzungen. Meldet sie „Änderungen ohne Changelog-Eintrag", lohnt der
  Blick, wessen Dateien das sind.

## Format

- **Bereich:** Ordner oder Dateien, so eng wie möglich (`werkzeuge/`,
  `docs/WEGWEISER.md`). Ein Anspruch auf „alles" blockiert alle.
- **Besitzer:** wer schreibt — `Claude (Sitzung X)`, `Codex`, `Jannik`.
- **Ziel:** ein Satz, was dort entsteht.
- **Seit:** Datum und Uhrzeit. Ein Anspruch, der älter als ein Tag ist,
  darf hinterfragt werden — nachfragen statt überschreiben.
