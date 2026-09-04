/* [Aufgabe: Prüfwesen] Prüft die Arbeitsregeln, die sich mechanisch prüfen lassen.

   Die Regeln stehen in `docs/REGELN.md`:

     1 · Niemals direkt auf den Hauptzweig — jede Änderung entsteht auf
         einem Zweig.
     4 · Alles steht im Changelog — ausnahmslos.

   Eine Regel, die nur in einem Dokument steht, wird vergessen. Diese
   beiden lassen sich aus dem Git-Zustand ablesen, also werden sie es.

   ── Arbeitet zusammen mit ───────────────────────────────────────────

   Nur `git` und `helfer.mjs`. Sie liest den Arbeitsbaum und läuft in
   `pruefe-alles.mjs` deshalb **allein**, nach den anderen: Ein Werkzeug,
   das nebenher eine Datei anlegt, sähe sie sonst als offene Änderung.
   Aus demselben Grund gehört die Ausgabe eines Messlaufs **außerhalb**
   des Projekts abgelegt, nie hinein. */

import { spawnSync } from "node:child_process";
import { macheMelder, liesEinstellung, WURZEL } from "./helfer.mjs";

const { melde, ende } = macheMelder({ still: true });
const HAUPT = liesEinstellung().hauptzweig;

function git(...argumente) {
  const e = spawnSync("git", argumente, { cwd: WURZEL, encoding: "utf8" });
  /* Nur hinten abschneiden: `git status --porcelain` beginnt jede Zeile
     mit zwei Zustandszeichen, und bei einer nicht vorgemerkten Änderung
     ist das erste ein Leerzeichen. Ein volles `trim()` frisst es in der
     ersten Zeile — dann hieße `CHANGELOG.md` hier `HANGELOG.md`. */
  return { ok: e.status === 0, aus: (e.stdout || "").replace(/\s+$/, "") };
}

/* Ohne Git ist nichts zu prüfen — etwa in einer entpackten Kopie. Die
   Prüfung soll das Arbeiten nicht verhindern, wo sie nichts weiß. */
if (!git("rev-parse", "--is-inside-work-tree").ok) {
  console.log("  kein Git-Arbeitsbaum — nichts zu prüfen");
  console.log("\n0 Prüfungen, 0 Fehler");
  process.exit(0);
}

const zweig = git("branch", "--show-current").aus || "(losgelöst)";

const offen = git("status", "--porcelain").aus
  .split("\n")
  .filter((z) => z.trim().length)
  .map((z) => z.slice(3).split(" -> ").pop().replace(/^"|"$/g, ""));

console.log(`  Zweig: ${zweig}`);
console.log(`  offene Änderungen: ${offen.length}`);

/* ── Regel 1 ── */
melde(offen.length === 0 || zweig !== HAUPT,
  `Regel 1: auf \`${HAUPT}\` wird nicht gearbeitet`,
  `${offen.length} offene Änderung(en) auf ${HAUPT} — bitte auf einen Zweig ` +
  `legen (git switch -c <system>/<kurz>)`);

/* ── Regel 4 ── */
melde(offen.length === 0 || offen.includes("CHANGELOG.md"),
  "Regel 4: jede Änderung steht im Changelog",
  `${offen.length} Datei(en) geändert, CHANGELOG.md nicht darunter`);

if (offen.length && offen.length <= 20) {
  console.log("  geändert:");
  for (const d of offen) console.log(`    ${d}`);
}

ende();
