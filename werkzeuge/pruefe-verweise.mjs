/* [Aufgabe: Prüfwesen] Kein Verweis zeigt ins Leere.

   Ein Wegweiser, der auf eine Datei zeigt, die es nicht mehr gibt, ist
   schlimmer als kein Wegweiser — er wird geglaubt. Diese Prüfung hält
   jeden Markdown-Verweis in der Doku gegen die Platte.

   Geprüft werden **nur** echte Markdown-Verweise `[Text](pfad)`. Nackte
   Dateinamen in Backticks bleiben absichtlich draußen: Ein Name wie
   `helfer.mjs` kann aus jedem Ordner gemeint sein, und eine Prüfung, die
   raten muss, meldet Falsches — das ist im Scotophobia-Projekt einmal
   mit 15 Fehlalarmen auf einen Schlag passiert.

   ── Arbeitet zusammen mit ───────────────────────────────────────────

   `helfer.mjs` und allen `.md` unter `docs/` (rekursiv) sowie `CLAUDE.md`,
   `README.md`, `CHANGELOG.md`, `WORKCLAIM.md` in der Wurzel. */

import { existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { macheMelder, liesDatei, WURZEL } from "./helfer.mjs";

const { melde, ende } = macheMelder({ still: true });

const seiten = ["CLAUDE.md", "README.md", "CHANGELOG.md", "WORKCLAIM.md"]
  .filter((d) => existsSync(join(WURZEL, d)));
/* docs/ rekursiv: Ein Unterordner voller Verweise (BATC-TEAM führt
   architecture/, domains/, migration/, operations/, history/) wäre sonst
   unsichtbar — im Livepunkte-Projekt lagen 18 tote Verweise genau dort. */
const sammleDocs = (rel) => {
  for (const d of readdirSync(join(WURZEL, rel), { withFileTypes: true })) {
    const r = rel + "/" + d.name;
    if (d.isDirectory()) sammleDocs(r);
    else if (d.name.endsWith(".md")) seiten.push(r);
  }
};
if (existsSync(join(WURZEL, "docs"))) sammleDocs("docs");

let verweise = 0, tot = 0;
for (const seite of seiten) {
  const text = liesDatei(seite);
  for (const m of text.matchAll(/\[[^\]]*\]\(([^)#\s]+)(#[^)]*)?\)/g)) {
    const ziel = m[1];
    if (/^[a-z]+:/.test(ziel)) continue;          /* http:, mailto:, … */
    verweise++;
    const voll = join(WURZEL, dirname(seite), decodeURIComponent(ziel));
    if (!existsSync(voll)) { tot++; console.log(`    tot: ${seite} → ${ziel}`); }
  }
}

console.log(`  ${seiten.length} Seiten, ${verweise} Dateiverweise`);
melde(tot === 0, "jeder Markdown-Verweis zeigt auf eine vorhandene Datei",
  `${tot} tote(r) Verweis(e)`);

ende();
