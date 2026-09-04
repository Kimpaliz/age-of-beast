/* [Aufgabe: Prüfwesen] Nichts Verbotenes im Repository.

   Muster übernommen aus Florians `check-project.mjs` (BATC-TEAM,
   02.09.2026) und verallgemeinert. Zwei Sorten Verbotenes:

   1. **Dateiformate**, die in kein Quell-Repository gehören — Binär-
      programme, Archive, Netzmitschnitte, DPAPI-Blobs. Sie sind nicht
      diffbar, oft groß, und genau die Sorte Datei, in der Geheimnisse
      unbemerkt mitreisen.
   2. **Geheimnismuster** im Text — private Schlüssel, GitHub-Tokens,
      hart eingetragene Passwörter.

   ⚠️ Bewusst NICHT geprüft: Firebase-Web-Schlüssel (`AIza…`). Die sind
   per Bauart öffentlich — geschützt hat immer die Regel, nie der
   Schlüssel. Wer sie meldet, erzeugt Alarmmüdigkeit.

   Die Muster sind so geschrieben, dass diese Datei sich nicht selbst
   meldet (das Suchmuster enthält nie ein gültiges Beispiel).

   ⚠️ **Eigene Ausnahmeliste, und das ist der Punkt.** Die Vorlage las
   `ausnahmen` aus `alpha-code.json` — dieselbe Liste, mit der die
   *Quelldateien* eingegrenzt werden. Dort stehen aber gute Gründe, einen
   Ordner **nicht als Quelle** zu führen (erzeugte Daten, Doku), und kein
   einziger Grund, ihn **nicht auf Geheimnisse** zu prüfen. Im
   Alpha-Code-Vorlagenzustand waren `docs` und `daten` gesetzt: Der ganze
   Doku-Ordner wurde nie durchsucht (Fehlerbuch E3). Deshalb liest diese
   Prüfung `geheimnisAusnahmen` und fällt sonst auf `node_modules`/`.git`
   zurück — nie auf die Quelldateiliste.

   Gemessen im Age-of-Beast-Wiki (04.09.2026): mit der gemeinsamen Liste
   251 Dateien in `daten/`, `docs/` und `.github/` ungeprüft; mit der
   eigenen Liste werden sie geprüft, 0 Treffer.

   ── Arbeitet zusammen mit ───────────────────────────────────────────

   `helfer.mjs` (WURZEL, Melder) und `alpha-code.json`
   (`geheimnisAusnahmen`). `pruefe-freigabe.mjs` ruft dieselben Muster
   zusätzlich über die ganze Git-Historie — diese Prüfung hier sieht nur
   den Arbeitsstand. */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { macheMelder, WURZEL } from "./helfer.mjs";

let ausnahmen = ["node_modules", ".git"];
try {
  const e = JSON.parse(readFileSync(join(WURZEL, "alpha-code.json"), "utf8"));
  if (Array.isArray(e.geheimnisAusnahmen))
    ausnahmen = [...new Set([...e.geheimnisAusnahmen, ".git", "node_modules"])];
} catch { /* ohne Einstellung gilt die Standardliste */ }

export const VERBOTENE_ENDUNGEN = new Set([
  ".exe", ".dll", ".pdb", ".zip", ".rar", ".7z",
  ".pcap", ".pcapng", ".dpapi", ".pfx", ".p12", ".keystore"
]);

/* Zusammengesetzt, damit die Definition sich nicht selbst trifft. */
export const GEHEIMNIS_MUSTER = [
  ["privater Schlüssel", new RegExp("-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----")],
  ["GitHub-Token", new RegExp("ghp" + "_[A-Za-z0-9]{30,}")],
  ["GitHub-PAT", new RegExp("github" + "_pat_[A-Za-z0-9_]{30,}")],
  ["GitLab-Token", new RegExp("glpat" + "-[A-Za-z0-9_-]{20,}")],
  ["AWS-Schlüssel", new RegExp("AKIA" + "[A-Z0-9]{16}")],
  ["hartes Passwort", new RegExp("(?:PASSWORD|PASSWORT|SECRET)\\s*=\\s*[\"'][^\"']{4,}[\"']", "i")]
];

/* `pruefe-freigabe.mjs` importiert nur die Muster — der Lauf selbst
   startet ausschließlich beim direkten Aufruf, sonst beendete `ende()`
   den fremden Prozess. */
const direkt = import.meta.url === pathToFileURL(process.argv[1] ?? "").href;

const funde = [];
/* Gezählt wird mit, wie viele Dateien wirklich durchsucht wurden. Ohne
   diese Zahl sieht eine Prüfung, die aus Versehen null Dateien ansieht,
   genauso aus wie eine saubere — genau so ist E3 entstanden. */
let durchsucht = 0;
function gehe(rel) {
  for (const e of readdirSync(join(WURZEL, rel), { withFileTypes: true })) {
    const r = rel === "." ? e.name : rel + "/" + e.name;
    if (e.isDirectory()) {
      if (!ausnahmen.includes(e.name)) gehe(r);
      continue;
    }
    const endung = (e.name.match(/\.[^.]+$/) || [""])[0].toLowerCase();
    if (VERBOTENE_ENDUNGEN.has(endung)) { funde.push(`verbotenes Format: ${r}`); continue; }
    if (statSync(join(WURZEL, r)).size > 2_000_000) continue;  /* große Binärdaten: nur die Endung zählt */
    const roh = readFileSync(join(WURZEL, r));
    if (roh.includes(0)) continue;                              /* binär: kein Textmuster suchbar */
    const text = roh.toString("utf8");
    durchsucht++;
    for (const [name, muster] of GEHEIMNIS_MUSTER)
      if (muster.test(text)) funde.push(`${name} in ${r}`);
  }
}
if (direkt) {
  const { melde, ende } = macheMelder({ still: true });
  gehe(".");
  for (const f of funde) console.log(`    ${f}`);
  console.log(`  ${durchsucht} Textdateien durchsucht, ` +
    `ausgenommen: ${ausnahmen.join(", ")}`);
  melde(funde.length === 0, "kein verbotenes Format und kein Geheimnismuster im Arbeitsstand",
    funde.length ? `${funde.length} Fund(e)` : "");
  melde(durchsucht > 100, "die Suche hat den Bestand wirklich gesehen",
    `${durchsucht} Dateien — unter 100 heißt: eine Ausnahme greift zu weit`);
  ende();
}
