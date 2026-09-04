/* [Aufgabe: Prüfwesen] Jede Quelldatei sagt selbst, wozu sie da ist.

   Janniks Regel (02.09.2026): „Verteile richtige Funktions-Tags an
   Dateien und Werkzeuge, dass immer klar ist, was ist wozu."

   Der Tag steht in den ersten Zeilen jeder Quelldatei als
   `[Aufgabe: <Tag>]` — in welchem Kommentarzeichen auch immer, deshalb
   wird nur nach der Zeichenfolge gesucht, nicht nach Syntax. Welche
   Tags es gibt, steht in **einer** Tabelle in `docs/REGELN.md`
   (Abschnitt „Ein Zweig je System"); diese Prüfung liest sie von dort,
   damit es keine zweite Liste gibt, die auseinanderlaufen kann.

   Was sie fängt: die Datei ohne Kopfnotiz, den Tippfehler im Tag und
   das neue System, das benutzt wird, bevor es in der Tabelle steht.

   ── Nachrüstliste: warum diese Prüfung einen Ratchet hat ────────────

   Beim Nachrüsten eines gewachsenen Projekts (Age of Beast, 04.09.2026)
   gab es 47 Quelldateien ohne Kopfnotiz. Sie alle in einem Zug
   anzufassen hätte jede parallele Sitzung im selben Checkout zerlegt.
   Statt die Prüfung deshalb abzuschalten, gilt dasselbe Muster wie bei
   den Altlasten:

   - Eine Datei, die in `docs/ALTLASTEN.md` unter „Ohne Kopfnotiz"
     geführt wird, darf (noch) keinen Tag haben.
   - **Jede andere** Datei muss einen haben — eine neue Datei ohne Tag
     ist damit sofort rot, und die Liste kann nicht still wachsen:
     Sie zu verlängern ist eine sichtbare Änderung an einer Doku-Datei.
   - Bekommt eine geführte Datei ihren Tag, meldet die Prüfung „kann aus
     der Liste" — die Liste schrumpft, nie wächst sie.

   ── Arbeitet zusammen mit ───────────────────────────────────────────

   `helfer.mjs` (Dateiliste aus `alpha-code.json`), `docs/REGELN.md`
   (die Tag-Spalte der Systemtabelle) und `docs/ALTLASTEN.md`
   (Abschnitt „Ohne Kopfnotiz"). */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { macheMelder, liesDatei, liesEinstellung, quellDateien, WURZEL } from "./helfer.mjs";

const { melde, ende } = macheMelder({ still: true });

/* Die Tag-Spalte aus der Systemtabelle: | System | Tag | Zweigname | … */
const regeln = liesDatei("docs/REGELN.md");
const tags = new Set();
for (const t of regeln.matchAll(/^\|[^|]+\|\s*`?([A-Za-zÄÖÜäöüß-]+)`?\s*\|\s*`[a-z-]+\/…?`/gm))
  tags.add(t[1]);

melde(tags.size >= 2, "die Systemtabelle in docs/REGELN.md nennt Tags",
  tags.size ? [...tags].join(", ") : "keine Tabelle im erwarteten Format gefunden");

/* Die Nachrüstliste aus `docs/ALTLASTEN.md`, Abschnitt „Ohne Kopfnotiz":
   Zeilen der Form | `pfad` | … . Sie steht bewusst in derselben Datei wie
   die Zeilenzahl-Baseline — beides sind gemessene Rückstände, keine
   Erlaubnisse. */
const BASELINE_DATEI = liesEinstellung().altlasten;
const nachzuruesten = new Set();
if (existsSync(join(WURZEL, BASELINE_DATEI))) {
  const text = liesDatei(BASELINE_DATEI);
  const ab = text.indexOf("## Ohne Kopfnotiz");
  if (ab >= 0) {
    const bis = text.indexOf("\n## ", ab + 1);
    const block = bis < 0 ? text.slice(ab) : text.slice(ab, bis);
    for (const z of block.matchAll(/^\|\s*`([^`]+)`\s*\|/gm)) nachzuruesten.add(z[1]);
  }
}

const dateien = quellDateien();
console.log(`  ${dateien.length} Quelldateien, ${tags.size} zugelassene Tags, ` +
  `${nachzuruesten.size} auf der Nachrüstliste`);

let ohne = 0, falsch = 0, fertig = 0, geistig = 0;
for (const d of dateien) {
  const kopf = liesDatei(d).split(/\r?\n/).slice(0, 12).join("\n");
  const m = kopf.match(/\[Aufgabe:\s*([^\]]+)\]/);
  if (!m) {
    if (nachzuruesten.has(d)) continue;          /* geführter Rückstand */
    ohne++; console.log(`    ohne Tag: ${d}`); continue;
  }
  if (nachzuruesten.has(d)) { fertig++; console.log(`    kann aus der Nachrüstliste: ${d}`); }
  const tag = m[1].trim();
  if (!tags.has(tag)) { falsch++; console.log(`    unbekannter Tag „${tag}": ${d}`); }
}

/* Eine Nachrüstliste, die auf Dateien zeigt, die es nicht mehr gibt,
   täuscht Arbeit vor, die längst erledigt oder gelöscht ist. */
const vorhanden = new Set(dateien);
for (const d of nachzuruesten)
  if (!vorhanden.has(d)) { geistig++; console.log(`    Nachrüstliste zeigt ins Leere: ${d}`); }

melde(ohne === 0, "jede Quelldatei trägt in den ersten 12 Zeilen ihr [Aufgabe: …]",
  `${ohne} Datei(en) ohne Tag und ohne Eintrag in ${BASELINE_DATEI}`);
melde(falsch === 0, "jeder Tag steht in der Systemtabelle von docs/REGELN.md",
  `${falsch} unbekannte(r) Tag(s)`);
melde(geistig === 0, "jede Zeile der Nachrüstliste zeigt auf eine vorhandene Datei",
  `${geistig} Karteileiche(n)`);

ende();
