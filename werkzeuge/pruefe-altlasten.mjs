/* [Aufgabe: Prüfwesen] Kleine Dateien als Ratchet.

   Muster übernommen aus Florians BATC-TEAM (Regel 2 samt
   `DATEIGROESSEN-BASELINE.md`, 02.09.2026). Die Idee: Beim Nachrüsten
   eines gewachsenen Projekts wäre „keine Datei über 500 Zeilen" ein
   Vorwand für einen riskanten Komplettumbau. Stattdessen:

   - **Neue** Quelldateien bleiben unter 500 Zeilen — hart.
   - **Bekannte Altlasten** stehen mit ihrer gemessenen Zeilenzahl in
     `docs/ALTLASTEN.md` und dürfen **nie wachsen**, nur schrumpfen.
     Beim nächsten fachlichen Eingriff wird der berührte Teil zuerst
     herausgelöst.

   Ohne `docs/ALTLASTEN.md` (Neubau) gilt schlicht: alles unter 500.

   Was sie fängt: die Altlast, die „nur diesmal" um dreißig Zeilen
   wächst — genau so sind die 12.548 Zeilen von BATC entstanden.

   ── Arbeitet zusammen mit ───────────────────────────────────────────

   `helfer.mjs` (Quelldateien aus `alpha-code.json`) und
   `docs/ALTLASTEN.md` (die Baseline-Tabelle: | `pfad` | Zeilen | …).
   Zeilen zählt sie wie `wc -l` — Anzahl Zeilenumbrüche. */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { macheMelder, liesDatei, liesEinstellung, quellDateien, WURZEL } from "./helfer.mjs";

const { melde, ende } = macheMelder({ still: true });
const GRENZE = 500;

/* Die Baseline: | `pfad` | 1234 | … — nur Zeilen mit Backtick-Pfad. Wo sie
   liegt, sagt `alpha-code.json` (`altlasten`); Standard ist docs/ALTLASTEN.md. */
const BASELINE_DATEI = liesEinstellung().altlasten;
const baseline = new Map();
if (existsSync(join(WURZEL, BASELINE_DATEI)))
  for (const z of liesDatei(BASELINE_DATEI).matchAll(/^\|\s*`([^`]+)`\s*\|\s*([\d.]+)\s*\|/gm))
    baseline.set(z[1], parseInt(z[2].replace(/\./g, ""), 10));

const zaehle = (text) => (text.match(/\n/g) || []).length;

let zuGross = 0, gewachsen = 0, schrumpfbar = 0;
for (const d of quellDateien()) {
  const zeilen = zaehle(liesDatei(d));
  if (baseline.has(d)) {
    const alt = baseline.get(d);
    if (zeilen > alt) { gewachsen++; console.log(`    Altlast gewachsen: ${d} (${alt} → ${zeilen})`); }
    else if (zeilen <= GRENZE) { schrumpfbar++; console.log(`    kann aus der Altlastenliste: ${d} (${zeilen})`); }
  } else if (zeilen > GRENZE) {
    zuGross++;
    console.log(`    über ${GRENZE} Zeilen und nicht als Altlast geführt: ${d} (${zeilen})`);
  }
}

console.log(`  ${quellDateien().length} Quelldateien, ${baseline.size} geführte Altlast(en)` +
  (schrumpfbar ? `, ${schrumpfbar} davon inzwischen unter der Grenze` : ""));

melde(zuGross === 0, `keine neue Quelldatei über ${GRENZE} Zeilen`,
  zuGross ? `${zuGross} Datei(en) — herauslösen oder begründet in ${BASELINE_DATEI} aufnehmen` : "");
melde(gewachsen === 0, "keine Altlast ist gewachsen (Ratchet)",
  gewachsen ? `${gewachsen} — beim Eingriff wird der berührte Teil zuerst herausgelöst` : "");

ende();
