/* [Aufgabe: Prüfwesen] Was in jeder Prüfung gleich ist — an genau einer Stelle.

   Übernommen aus dem Scotophobia-Projekt (09/2026). Dort stand derselbe
   kleine Helfer immer wieder neu, und die Melder waren nicht gleich:
   Die Hälfte der Prüfungen zählte nur Fehler und meldete „alles in
   Ordnung" — eine gelöschte Zusicherung sah dort genauso aus wie vorher.
   Deshalb zählt hier jede Prüfung **jede** Zusicherung mit, auch die
   bestandene, und die Zahl steht in jedem Lauf.

   ── Arbeitet zusammen mit ───────────────────────────────────────────

   Allen `pruefe-*.mjs`. Diese Datei importiert selbst nichts aus dem
   Projekt: Sie ist reine Werkzeugtechnik und darf deshalb von jeder
   Prüfung geladen werden, ohne deren Messung zu beeinflussen. */

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/* Die Wurzel des Projekts, von `werkzeuge/` aus gesehen. */
export const WURZEL = join(fileURLToPath(new URL(".", import.meta.url)), "..");

/* Eine Datei aus dem Projekt, Pfad relativ zur Wurzel. */
export const liesDatei = (pfad) => readFileSync(join(WURZEL, pfad), "utf8");

/* Die Alpha-Code-Einstellung des Projekts. Fehlt sie, gelten die
   Standardwerte — die Wächter sollen das Arbeiten nicht verhindern,
   bevor das Projekt eingerichtet ist. */
export function liesEinstellung() {
  const standard = {
    hauptzweig: "main",
    quellordner: ["."],
    endungen: [".js", ".mjs"],
    ausnahmen: ["node_modules", ".git", "vendor", "dist", "build", "daten"],
    /* Die Baseline-Tabelle der Großdateien. Ein nachgerüstetes Projekt
       darf sie unter seinem bestehenden Namen weiterführen. */
    altlasten: "docs/ALTLASTEN.md"
  };
  const pfad = join(WURZEL, "alpha-code.json");
  if (!existsSync(pfad)) return standard;
  return { ...standard, ...JSON.parse(readFileSync(pfad, "utf8")) };
}

/* Der Melder einer Prüfung.

   `melde(gut, text, zusatz)` zählt jede Zusicherung mit. `ende()` druckt
   die Bilanz und setzt den Rückgabewert des Prozesses, den
   `pruefe-alles.mjs` auswertet. `still: true` druckt nur die Fehler —
   gezählt wird trotzdem alles. */
export function macheMelder({ still = false } = {}) {
  let gepruef = 0, fehler = 0;

  const melde = (gut, text, zusatz = "") => {
    gepruef++;
    if (!gut) fehler++;
    if (still && gut) return;
    console.log(`  ${gut ? "ok    " : "FEHLER"}  ${text}${zusatz ? "  ·  " + zusatz : ""}`);
  };

  const stand = () => ({ gepruef, fehler });

  const ende = () => {
    console.log(`\n${gepruef} Prüfungen, ${fehler} Fehler`);
    process.exit(fehler ? 1 : 0);
  };

  return { melde, stand, ende };
}

/* Alle Quelldateien des Projekts gemäß `alpha-code.json`, als Pfade
   relativ zur Wurzel (mit `/` als Trenner, auch unter Windows). Läuft
   selbst durch die Ordner statt ein Paket zu brauchen — die Wächter
   kommen ohne jede Abhängigkeit aus. */
export function quellDateien() {
  const e = liesEinstellung();
  const raus = [];
  const gesperrt = (rel, name) =>
    e.ausnahmen.some((a) => rel === a || rel.startsWith(a + "/") || name === a);
  const gehe = (rel) => {
    for (const name of readdirSync(join(WURZEL, rel))) {
      const relKind = rel === "." ? name : rel + "/" + name;
      if (gesperrt(relKind, name)) continue;
      if (statSync(join(WURZEL, relKind)).isDirectory()) gehe(relKind);
      else if (e.endungen.some((x) => name.endsWith(x))) raus.push(relKind);
    }
  };
  for (const o of e.quellordner) if (existsSync(join(WURZEL, o))) gehe(o);
  return raus;
}
