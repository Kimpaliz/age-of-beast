# Projektprofil — Age-of-Beast-Wiki

Für die Verteilung von Arbeit auf Subagenten. Jeder Auftrag zieht
hieraus — wörtlich, nicht als Verweis.

*(Ersetzt `docs/SUBAGENT_PROFILE.md` vom 01.09.2026. Jenes bleibt als
Beleg stehen und trägt oben, was daran überholt ist.)*

## Grunddaten

| | |
| --- | --- |
| Projekt | statisches Daggerheart-Weltwiki, kein Bauschritt, keine Abhängigkeit |
| Standardbranch | `main` — **jeder Push dorthin veröffentlicht** (`pages.yml`) |
| Zweigschema | `<system>/<kurz>` aus der Systemtabelle in `docs/REGELN.md` |
| Konventionsdatei | `docs/REGELN.md` |
| Prüfbefehl | `node werkzeuge/pruefe-alles.mjs` |
| vor Veröffentlichung zusätzlich | `node werkzeuge/pruefe-freigabe.mjs` |
| Abnahmeweg | Workclaim eintragen → Zweig → Kette grün → Jannik fragen → `main` |

## ⚠️ Das Eine, das in jeden Auftrag gehört

`firestore.rules` gehört diesem Wiki **und** dem Spiel Scotophobia.
Firestore hat pro Datenbank genau eine Regeldatei; ein Deploy der
falschen Fassung schaltet das andere Projekt ab und **meldet dabei
Erfolg**. Am 04.09.2026 ist das in beide Richtungen passiert. Wer diese
Datei, die Anmeldung oder `firebase-konfig.js` berührt, liest zuerst
`docs/PROJEKTGRENZE.md`.

## Drei Dinge, die dieses Projekt von anderen unterscheiden

1. **Ein Checkout, mehrere Sitzungen.** Am 04.09.2026 hat eine zweite
   Sitzung den Zweig unter der ersten gewechselt (Fehlerbuch F3).
   Parallele Arbeit gehört in einen eigenen Worktree — es gibt schon
   elf unter `_codex-worktrees/`. `git branch --show-current` vor jedem
   Commit.
2. **Zwei Changelogs, mit Absicht.** `CHANGELOG.md` beschreibt
   Änderungen so, wie Jannik sie erlebt; `CHANGELOG-TECHNIK.md` trägt
   die Messungen. Nicht zusammenlegen.
3. **Die beiden GitHub-Abläufe sammeln jede `werkzeuge/pruefe-*.mjs`
   ein** und rufen sie einzeln auf. Wer eine Datei so nennt, macht sie
   zum CI-Pflichtgate — auch versehentlich.

## Konventionen — wörtlich in jeden Auftrag

- **Sprache:** Deutsch. Kommentare, Doku und Nutzertexte mit echten
  Umlauten (ä ö ü ß), niemals `ae oe ue ss`.
- **Kopfnotiz:** jede Quelldatei beginnt mit Was · Warum · „Arbeitet
  zusammen mit", plus `[Aufgabe: <Tag>]` aus der Tabelle in
  `docs/REGELN.md`.
- **Commit-Text:** deutsch, ohne Umlaute im Betreff, Form
  `bereich: was`.
- **Changelog:** jede Änderung, oben, mit Warum und Messung.
- **Zeilenenden:** **LF**, hier ausnahmsweise nicht CRLF —
  `.gitattributes` setzt `* text=auto eol=lf`. Nie mit `grep`/`cat -A`
  beurteilen — `file` oder Bytes zählen (Fehlerbuch C4).
- **Daten:** nur `daten/quelle.json` ist kanonisch, und die wird über
  die Oberfläche bearbeitet. `daten/welt.json` und `daten/welt.js` sind
  Ableitungen und werden **nie** von Hand angefasst.
- **Keine Abhängigkeit einführen.** Es gibt keine `package.json`, und
  das ist eine Entscheidung, keine Lücke.

## Stille Fallen — kommen grün durch

1. `pruefe-arbeitsweise.mjs` schlägt an, wenn offene Änderungen auf
   `main` liegen oder `CHANGELOG.md` nicht mitgeändert ist — auch bei
   reiner Doku-Arbeit.
2. Die Ausgabe eines Messlaufs gehört **außerhalb** des Projekts
   (`> lauf.txt` im Scratchpad), sonst sieht die Arbeitsweise-Prüfung
   sie als offene Änderung.
3. `<befehl> | tail -25; echo $?` meldet den Code von `tail`. Echten
   Code holen: `<befehl> > lauf.txt 2>&1; echo "code=$?"`.
4. Die Werkzeugfallen dieser Umgebung stehen in `docs/FEHLERBUCH.md`,
   Klasse C — **vor dem ersten Shell-Einzeiler lesen**.

## Was Agenten nicht tun

- nicht nach `main` zusammenführen, nicht pushen und nicht deployen;
- keine Dateien außerhalb des eigenen Workclaim-Bereichs ändern;
- keine Prüfmarke, Schwelle oder Abnahmebedingung senken, um einen
  Lauf grün zu machen;
- keine Abhängigkeit oder Grundsatzentscheidung ohne eigenen Auftrag
  einführen.

## Abnahmekriterien

Der Agent liest den vollständigen Diff, weist ausschließlich erlaubte
Pfade nach, führt die Kette aus und nennt Commit-SHA, geänderte
Dateien, Messzahlen und offene Punkte. Die Integrationsinstanz führt
vor einer Freigabe die Kette auf dem **integrierten** Stand aus — ein
grüner Einzel-Worktree beweist nicht, dass die Kombination grün ist.

Jeder Abschlussbericht beantwortet außerdem zwei Fragen aus Florians
PR-Vorlage (BATC-TEAM): **Was wurde bewusst nicht geändert?** — der
Satz, der stille Nebenumbauten sichtbar macht. Und wo ein
Produktivsystem berührt ist: **Wie ist der Rückrollweg?**
