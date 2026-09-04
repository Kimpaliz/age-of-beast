/* [Aufgabe: Prüfwesen] Kein Fortschritt in der Doku.

   Die Regel: **Ein Dokument behauptet nie den aktuellen Zustand.**
   „ist live", „noch offen", „erledigt", „nächster Schritt" und ein
   Häkchen an einem Plan-Schritt sind dieselbe Aussage in
   verschiedener Länge — und sie veraltet **lautlos**. Niemand merkt
   es, weil nichts rot wird; das Dokument sagt weiter, was einmal
   galt.

   Status gehört dorthin, wo er beim Ändern der Wirklichkeit
   mitgeändert wird: in den Vorgangs-Tracker (Issues), oder wo es
   keinen gibt, in **eine** benannte Datei. Doku trägt die
   **Begründung** — Zielbild, Messungen, verworfene Alternativen.

   ── Was durchgelassen wird, und warum ───────────────────────────────

   1. **Datierte Vermerke.** „gemessen am 12.03.2026", „Stand
      12.03.2026", „abgerufen am …" sind Nachweise, keine
      Behauptungen über jetzt — das Datum legt sie trocken. Sie
      bleiben richtig, auch wenn sich die Welt weiterdreht.
   2. **Geschichte.** `docs/history/` (bzw. `docs/geschichte/`) ist
      der Ort, an dem Status ausdrücklich stehen darf: abgeschlossene
      Pläne, alte Übergaben.
   3. **Das Changelog.** Es ist datierte Historie, keine Behauptung
      über den Jetzt-Zustand.
   4. **Anleitungen.** Eine Checkliste, die sagt, was **zu tun** ist
      („- [ ] Kette grün"), behauptet nichts über die Wirklichkeit.
      Deshalb zählen Häkchen nur in Dateien, die einen Plan oder ein
      Vorhaben beschreiben — erkannt an ihrem Namen (siehe `PLAN_NAMEN`).
   5. **Zitate.** Ein Wort in Anführungszeichen oder Backticks ist das
      **Wort selbst**, nicht seine Aussage. Ohne diese Ausnahme fällt
      die Prüfung über den Satz, der sie erklärt — beim ersten Lauf
      genau passiert: Sie meldete `docs/REGELN.md`, weil dort steht,
      dass „ist live" nicht in ein Dokument gehört. Eine Prüfung, die
      ihre eigene Begründung für den Fehler hält, ist wertlos
      (Fehlerbuch B4).

   Was sie fängt: das Dokument, das seit vier Monaten „noch offen"
   sagt, obwohl es längst gebaut ist — und das jeder glaubt, weil es
   im Repository steht.

   ── Arbeitet zusammen mit ───────────────────────────────────────────

   `helfer.mjs` (Melder, Projektwurzel) und `docs/REGELN.md`, Regel 14.
   Sie liest **nur** Markdown unter `docs/`, nicht den Quelltext:
   Ein Kommentar im Code, der einen Zustand beschreibt, steht neben
   dem Code und wird mit ihm geändert. */

import { readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import { macheMelder, liesDatei, WURZEL } from "./helfer.mjs";

const { melde, ende } = macheMelder({ still: true });

/* Wörter, die einen Zustand behaupten. Bewusst eng gehalten: Jedes
   Muster hier muss einen Fehler fangen, der sonst still durchkäme —
   und darf keinen Satz treffen, der bloß erklärt. Deshalb keine
   Allerweltswörter wie „aktuell" oder „derzeit". */
const STATUS_MUSTER = [
  ["ist live",        /\b(ist|sind) (jetzt )?live\b/i],
  ["ist deployt",     /\b(ist|sind) (bereits |schon )?(deployt|ausgeliefert|veröffentlicht)\b/i],
  ["läuft bereits",   /\bläuft (bereits|schon|jetzt)\b/i],
  ["noch offen",      /\b(noch offen|steht noch aus|bislang nicht|noch nicht gebaut)\b/i],
  ["erledigt",        /\b(erledigt|abgeschlossen|fertiggestellt)\b/i],
  ["nächster Schritt",/\bn(ä|ae)chste[rns]? (Schritt|Schritte)\b/i],
  ["TODO",            /\b(TODO|FIXME)\b/],
  ["Status-Zeile",    /^\s*[-*|]?\s*\**Status\**\s*:/im]
];

/* Ein Datum in derselben Zeile macht aus der Behauptung einen
   Nachweis. Erlaubt: 12.03.2026 · 2026-03-12 · März 2026 · 03/2026. */
const DATUM = /(\d{1,2}\.\d{1,2}\.\d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{4}|\b(Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)\s+\d{4})/;

/* Dateien, in denen ein Häkchen einen *Fortschritt* meint statt einer
   Handlungsanweisung. Eine Checkliste in einer Anleitung ist erlaubt. */
const PLAN_NAMEN = /(plan|roadmap|fahrplan|phase|meilenstein|vorhaben)/i;

/* Orte, an denen Status ausdrücklich stehen darf. */
const FREI = /(^|\/)(history|geschichte|archiv)(\/|$)/i;

/* Dateien, die wie das Changelog **datierte Historie** sind: Jeder
   Eintrag beschreibt eine vergangene Lage, nicht die Gegenwart.

   Das Fehlerbuch kam am 04.09.2026 dazu. Sein Vier-Felder-Muster
   verlangt geradezu solche Sätze — „die Aussage klang plausibel, weil
   die Arbeit abgeschlossen war" ist die Schilderung eines Denkfehlers,
   keine Behauptung über jetzt. Ohne die Ausnahme fiele die Prüfung über
   genau die Datei, die sie mit Fällen versorgt (Fehlerbuch B4). */
const HISTORIE = /(^|\/)(FEHLERBUCH|CHANGELOG[A-Z-]*)\.md$/i;

const DOCS = ["docs"].filter((d) => existsSync(join(WURZEL, d)));
const dateien = [];
const sammle = (rel) => {
  for (const name of readdirSync(join(WURZEL, rel))) {
    const kind = rel + "/" + name;
    if (statSync(join(WURZEL, kind)).isDirectory()) { if (!FREI.test(kind)) sammle(kind); }
    else if (name.endsWith(".md") && !HISTORIE.test(kind)) dateien.push(kind);
  }
};
for (const d of DOCS) sammle(d);

let funde = 0, haken = 0;
for (const datei of dateien) {
  const zeilen = liesDatei(datei).split(/\r?\n/);
  let imCodeblock = false;
  zeilen.forEach((zeile, i) => {
    if (/^\s*```/.test(zeile)) { imCodeblock = !imCodeblock; return; }
    if (imCodeblock) return;                       /* Beispiele sind keine Behauptungen */
    if (DATUM.test(zeile)) return;                 /* datierter Vermerk: bleibt */

    /* Zitiertes zuerst herausnehmen: „…", "…" und `…` nennen das Wort,
       statt es zu behaupten. Sonst meldet die Prüfung den Satz, der
       sie erklärt (Fehlerbuch B4). */
    const nurAussage = zeile
      .replace(/`[^`]*`/g, " ")
      .replace(/„[^"“]*["“]/g, " ")
      .replace(/"[^"]*"/g, " ");

    for (const [name, muster] of STATUS_MUSTER)
      if (muster.test(nurAussage)) {
        console.log(`    ${datei}:${i + 1}  ${name}  ·  ${zeile.trim().slice(0, 70)}`);
        funde++;
        return;
      }
    if (/^\s*[-*]\s*\[[ xX]\]/.test(zeile) && PLAN_NAMEN.test(datei)) {
      console.log(`    ${datei}:${i + 1}  Häkchen an einem Plan-Schritt  ·  ${zeile.trim().slice(0, 60)}`);
      haken++;
    }
  });
}

console.log(`  ${dateien.length} Doku-Datei(en) gelesen` +
  (dateien.length === 0 ? " — noch keine docs/" : ""));

melde(funde === 0, "kein Dokument behauptet einen Zustand",
  funde ? `${funde} Stelle(n) — gehört in den Vorgangs-Tracker, oder mit Datum als Nachweis schreiben` : "");
melde(haken === 0, "kein Häkchen an einem Plan-Schritt",
  haken ? `${haken} — ein Häkchen ist „erledigt" in kürzerer Form` : "");

ende();
