# Age-of-Beast-Wiki — zuerst lesen

Das **Weltwiki zu Janniks Daggerheart-Welt „Age of Beast"**: eine
statische Seite, die die Einträge der Welt zeigt — Kampagne, Fraktionen,
Spezies, Figuren, Gegenstände, Regeln — mit Verlinkung, Vorschaukarten,
Volltextsuche und Kategoriefiltern. Wer angemeldet ist, bearbeitet die
Texte **im Wiki selbst**; gespeichert heißt veröffentlicht. Es gibt
keinen Bauschritt, keine Bibliothek und keine `package.json`:
`index.html` lässt sich direkt öffnen.

Die Richtung hat Jannik am 24.08.2026 festgelegt und am 25.08. bestätigt:
**Das Wiki soll die Weltenschmiede vollständig ersetzen und selbst zum
Bearbeiten dienen.** Seit Fassung 3.0.0 (02.09.2026, Commit `56ec0ee`)
liegt die Welt in Firestore, angemeldet wird mit dem Google-Konto.

Auftraggeber ist **Jannik**. Er kann nicht programmieren: Er entscheidet
fachlich, alles Technische wird für ihn gebaut und ihm in seiner Sprache
erklärt. Sein Wortlaut ist die Quelle — Wünsche werden zitiert, nicht
umformuliert.

## In dreißig Sekunden

- Zweig anlegen, `WORKCLAIM.md` lesen und eintragen — **dann** erst bauen.
- Jede Änderung: Changelog-Eintrag oben, dann `node werkzeuge/pruefe-alles.mjs`.
- Ein roter Ausgangsstand wird zuerst **gemeldet**, nicht überbaut.
- Merge, Push, Deploy, Veröffentlichung: nur auf Janniks ausdrückliches Ja.
- Was unter „Ausdrücklich nicht gefordert" steht, wird nicht gebaut und
  nicht als Lücke gemeldet.

## ⚠️ Das Eine, das man vorher wissen muss

`firestore.rules` gehört **zwei** Projekten: diesem Wiki und dem Spiel
**Scotophobia**. Firestore hat pro Datenbank genau eine Regeldatei. Ein
Deploy der falschen Fassung schaltet das jeweils andere Projekt ab — und
der Deploy meldet dabei Erfolg. **Das ist am 04.09.2026 wirklich
passiert, in beide Richtungen.** Bevor irgendetwas an dieser Datei oder
an der Anmeldung geändert wird: [docs/PROJEKTGRENZE.md](docs/PROJEKTGRENZE.md).

## Ausdrücklich nicht gefordert

*(Aus der bestehenden Doku dieses Projekts abgeleitet — **von Jannik zu
bestätigen oder zu streichen**. Die Liste verhindert, dass Agenten
Anforderungen einpreisen, die niemand gestellt hat.)*

- **Kein Paketmanager, kein Bauschritt, keine Bibliothek.** Node dient
  nur Werkzeugen und Prüfungen. Ein npm- oder pnpm-Umbau ist kein
  Fortschritt, sondern eine Änderung der Bauart.
- **Kein Browser-Testwerkzeug** (Playwright, Puppeteer und dergleichen).
  Falls es je nötig wird, ist es ein eigenes, begründetes Vorhaben — nie
  eine Nebenwirkung.
- **Keine Performance-Umschreibung.** Bei dieser Datenmenge gibt es
  keinen Anlass; die Beobachtungspunkte stehen in
  [docs/UPGRADE_ROADMAP.md](docs/UPGRADE_ROADMAP.md).
- **Keine fremden Illustrationen.** Die Kartenbilder sind bewusst eigene
  SVG-Wappen, weil die offiziellen Bilder von Darrington Press stammen.
- **Keine Datenmigration auf eine neue Vertragsversion** nebenbei. Der
  Bestand ist Legacy-v0; eine Versionierung ist eine eigene, kontrollierte
  Datenänderung.
- **Kein Umbau der abgeleiteten Weltdateien von Hand.** `daten/welt.json`
  und `daten/welt.js` entstehen ausschließlich aus `daten/quelle.json`.

---

## Die Regeln

Ausführlich in [docs/REGELN.md](docs/REGELN.md); die prüfbaren laufen in
der Kette mit.

1. **Nie direkt auf `main`.** Jede Änderung entsteht auf einem Zweig.
   Hier besonders wichtig: **Jeder Push auf `main` veröffentlicht** —
   `pages.yml` baut und stellt die öffentliche Seite bereit.
2. **Ein Zweig je System.** Die Tabelle steht in `docs/REGELN.md`.
3. **Nach jeder Änderung wird gefragt**, ob sie nach `main` soll —
   Merge, Push und Deploy nur auf Janniks ausdrückliches Ja.
4. **Alles steht im Changelog.** Jede einzelne Änderung, genau, oben.
   Dieses Projekt führt **zwei**: `CHANGELOG.md` in Alltagssprache (weil
   es echte Leser hat) und `CHANGELOG-TECHNIK.md` mit den Messungen.
   Nicht zusammenlegen.
5. **Workclaim:** [WORKCLAIM.md](WORKCLAIM.md) erst lesen, dann
   eintragen, dann schreiben. Fremde Bereiche sind gesperrt.

```bash
node werkzeuge/pruefe-alles.mjs      # die ganze Prüfkette
node werkzeuge/pruefe-freigabe.mjs   # zusätzlich vor jeder Veröffentlichung
```

---

## Wegweiser — welche Datei beantwortet welche Frage

**Vor dem Bauen immer zuerst:** dieses Dokument, dann
[docs/FEHLERBUCH.md](docs/FEHLERBUCH.md) — dort stehen die Fehler, die
sich wiederholen, und woran man sie erkennt, **bevor** man hineinläuft.

| Frage | Datei |
| --- | --- |
| Welches System redet mit welchem, und warum? Wo fasse ich für Wunsch X an? | [docs/WEGWEISER.md](docs/WEGWEISER.md) |
| Was darf ich auf keinen Fall kaputtmachen? | [docs/PROJEKTGRENZE.md](docs/PROJEKTGRENZE.md) |
| Wer arbeitet gerade woran? | [WORKCLAIM.md](WORKCLAIM.md) |
| Was wurde zuletzt gebaut, und warum | [CHANGELOG.md](CHANGELOG.md), oberster Eintrag |
| … mit den Messungen dazu | [CHANGELOG-TECHNIK.md](CHANGELOG-TECHNIK.md) |
| Welche Regeln gelten, welche Tags und Zweignamen gibt es? | [docs/REGELN.md](docs/REGELN.md) |
| Welche Fehler wiederholen sich? | [docs/FEHLERBUCH.md](docs/FEHLERBUCH.md) |
| Was ist noch offen, gemessen? | [docs/ALTLASTEN.md](docs/ALTLASTEN.md) |
| Wie verteile ich Arbeit auf Agenten? | `.claude/PROJEKTPROFIL.md` |
| Was prüft welcher Wächter, und was käme ohne ihn durch? | Kopf von `werkzeuge/pruefe-alles.mjs` |

### Ältere Fachdokumente

Acht Dokumente vom 01.09.2026 beschreiben Architektur, Datenvertrag,
Inventar, QA und Release im Detail: [ARCHITEKTUR.md](docs/ARCHITEKTUR.md),
[DATENVERTRAG.md](docs/DATENVERTRAG.md), [INVENTAR.md](docs/INVENTAR.md),
[QA_MATRIX.md](docs/QA_MATRIX.md),
[RELEASE_RUNBOOK.md](docs/RELEASE_RUNBOOK.md),
[SUBAGENT_PROFILE.md](docs/SUBAGENT_PROFILE.md),
[UPGRADE_ANALYSE_PLAN.md](docs/UPGRADE_ANALYSE_PLAN.md),
[UPGRADE_ROADMAP.md](docs/UPGRADE_ROADMAP.md).

⚠️ Sie stammen von **vor** dem Umzug nach Firestore. Am 04.09.2026 wurde
jede Aussage darin gegen den Code gehalten; wo etwas überholt ist, steht
die Korrektur als Kasten oben in der jeweiligen Datei. Im Zweifel gilt
der Code, danach [docs/WEGWEISER.md](docs/WEGWEISER.md).

---

## Die Haltung dieses Projekts

**Jede Zahl ist gemessen.** Nicht geschätzt, nicht aus einem Kommentar
übernommen. Wenn irgendwo eine Zahl steht, gibt es den Befehl, der sie
nachrechnet.

**Umbau und Inhalt werden getrennt.** Ein Umbau ohne sichtbare Änderung
lässt sich beweisen (gleiche Eingaben → gleiches Ergebnis, byteweise);
ein Umbau mit Änderung nicht. Deshalb erst das eine, dann das andere.

**Jede neue Prüfung wird zuerst rot gemacht.** Den Fehler absichtlich
einbauen, anschlagen sehen, zurücknehmen. Eine Prüfung, die nie rot
war, prüft womöglich nichts.

**Geprüft wird der Fall, der ohne die Arbeit falsch wäre.** Nicht der,
der ohnehin gewinnt.
