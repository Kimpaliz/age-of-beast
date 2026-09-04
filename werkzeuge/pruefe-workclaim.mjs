/* [Aufgabe: Prüfwesen] Wer arbeitet woran — und ist das lesbar notiert?

   Janniks Regel (02.09.2026): „Eine Workclaim-Datei ist wichtig, in der
   notiert wird, welcher Agent zurzeit an was arbeitet — und auf diese
   Bereiche darf aktuell nur mit Erlaubnis zugegriffen werden."

   Der Ernstfall dazu ist dokumentiert: Am selben Tag hat eine zweite
   Sitzung mitten im Checkout einer ersten einen Merge gestartet —
   sieben Dateien voller Konfliktmarker. Eine gelesene `WORKCLAIM.md`
   hätte das verhindert.

   Diese Prüfung kann nicht wissen, *wer* gerade schreibt. Sie prüft,
   dass die Datei da ist, ihr Format stimmt und jeder Anspruch
   vollständig ist — damit das Lesen vor dem Schreiben überhaupt eine
   verlässliche Antwort liefert.

   ── Arbeitet zusammen mit ───────────────────────────────────────────

   `helfer.mjs` und `WORKCLAIM.md` in der Wurzel. */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { macheMelder, liesDatei, WURZEL } from "./helfer.mjs";

const { melde, ende } = macheMelder({ still: true });

melde(existsSync(join(WURZEL, "WORKCLAIM.md")), "WORKCLAIM.md liegt in der Wurzel");
if (!existsSync(join(WURZEL, "WORKCLAIM.md"))) ende();

const text = liesDatei("WORKCLAIM.md");
melde(/\|\s*Bereich\s*\|\s*Besitzer\s*\|\s*Ziel\s*\|\s*Seit\s*\|/.test(text),
  "die Anspruchstabelle hat die vier Spalten Bereich · Besitzer · Ziel · Seit");

/* Jede Datenzeile der Tabelle: vier gefüllte Felder oder das eine
   ausdrückliche `frei`. Ein halber Anspruch („irgendwer, irgendwann")
   ist schlimmer als keiner — man verlässt sich darauf. */
const zeilen = [...text.matchAll(/^\|([^|\n]*)\|([^|\n]*)\|([^|\n]*)\|([^|\n]*)\|\s*$/gm)]
  .map((m) => m.slice(1, 5).map((f) => f.trim()))
  .filter((f) => f[0] !== "Bereich" && !/^-+$/.test(f[0]));

let halb = 0, frei = 0, aktiv = 0;
for (const [bereich, besitzer, ziel, seit] of zeilen) {
  if (bereich === "frei" || besitzer === "frei") { frei++; continue; }
  aktiv++;
  if (!bereich || !besitzer || !ziel || !seit) {
    halb++;
    console.log(`    unvollständig: | ${bereich} | ${besitzer} | ${ziel} | ${seit} |`);
  }
}

console.log(`  ${aktiv} aktive(r) Anspruch/Ansprüche, ${frei} frei-Zeile(n)`);
melde(halb === 0, "jeder Anspruch nennt Bereich, Besitzer, Ziel und Startzeit",
  `${halb} unvollständig`);
melde(aktiv + frei > 0, "die Tabelle hat mindestens eine Zeile (notfalls `frei`)",
  "eine leere Tabelle beantwortet die Schreibfrage nicht");

ende();
