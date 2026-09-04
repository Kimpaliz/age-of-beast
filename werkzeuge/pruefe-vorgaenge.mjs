/* [Aufgabe: Prüfwesen] Jeder Vorgang hat seinen Platz, jeder Verweis sein Ziel.

       node werkzeuge/pruefe-vorgaenge.mjs             ohne Netz (in der Kette)
       node werkzeuge/pruefe-vorgaenge.mjs --online    zusätzlich bei GitHub nachsehen

   ── Warum die Kette hier ohne Netz prüft ────────────────────────────

   Eine Prüfkette, die ein fremdes Haus braucht, ist keine Prüfkette
   mehr: Sie wird rot, wenn GitHub langsam ist, im Zug, im Flugzeug —
   und weil das oft passiert, gewöhnt man sich das Übergehen an. Dann
   ist sie gar nichts mehr wert.

   Deshalb zwei Stufen. **Ohne Netz** wird geprüft, was in den Dateien
   steht und dort auch falsch sein kann:

   | | was ohne Netz prüfbar ist |
   | --- | --- |
   | 1 | jede Phase der Roadmap trägt eine `Vorgang: #N`-Zeile |
   | 2 | jeder Schritt unter einer Phase ebenso |
   | 3 | keine Nummer zweimal — sonst zeigen zwei Stellen auf einen Vorgang |
   | 4 | die Roadmap behauptet keinen Stand (Regel 14 gilt auch hier) |

   **Mit `--online`** kommt dazu, was nur GitHub weiß: ob es die Nummer
   gibt, ob sie das richtige Form-Label trägt, ob ein Schritt seinen
   Elternvorgang nennt, und ob jede `(#N)` im Changelog auf einen
   existierenden Vorgang zeigt.

   Was sie fängt: die Nummer, die beim Umschreiben der Roadmap verrutscht
   ist — `Vorgang: #14` unter der falschen Phase liest niemand nach, und
   von da an ist die ganze Zuordnung still falsch.

   ── Ohne `vorgaenge` in alpha-code.json läuft sie nicht ─────────────

   Und sagt das auch. Ein Wächter, der ohne Konfiguration still grün
   meldet, ist schlimmer als keiner: Er behauptet eine Zusicherung, die
   niemand gibt. Nicht jedes Projekt hat einen Vorgangs-Tracker — für
   die gilt Regel 13 mit **einer** benannten Standdatei.

   ── Arbeitet zusammen mit ───────────────────────────────────────────

   `helfer.mjs`, `docs/ROADMAP.md`, `CHANGELOG.md` und `vorgaenge.mjs`,
   das dieselben Formen **anlegt**. Nur mit `--online` zusätzlich
   `github-zugang.mjs`. */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { macheMelder, liesDatei, liesEinstellung, WURZEL } from "./helfer.mjs";

const { melde, ende } = macheMelder({ still: true });
const online = process.argv.includes("--online");
const konfig = liesEinstellung().vorgaenge;

if (!konfig) {
  console.log("  kein `vorgaenge` in alpha-code.json — Prüfung übersprungen");
  console.log("    (ein Vorgangs-Tracker ist eine Projektentscheidung, siehe docs/REGELN.md Regel 16)");
  melde(true, "Vorgangs-Tracker nicht eingerichtet (bewusst)");
  ende();
}

const ROADMAP = konfig.roadmap || "docs/ROADMAP.md";
if (!existsSync(join(WURZEL, ROADMAP))) {
  melde(false, `Roadmap fehlt: ${ROADMAP}`,
    "`vorgaenge` ist gesetzt, aber die Quelle der Phasen gibt es nicht");
  ende();
}

/* ── Die Roadmap lesen: `##` Phase, `###` Schritt, `Vorgang: #N` ────

   ⚠️ **Dieselbe Marke wie in `vorgaenge.mjs`, und das ist eine
   Doppelung.** Beide Werkzeuge lesen dasselbe Format; wer die Regel
   nur an einer Stelle ändert, bekommt einen Wächter, der etwas
   anderes zählt als das Werkzeug anlegt. Genau das war am
   04.09.2026 der Fall: `vorgaenge.mjs` sah 3 Phasen, diese Prüfung
   6 — die Anleitungsabschnitte des Fahrplans zählten mit.

   Der Parser gehört langfristig in **eine** Datei. Bis dahin gilt:
   Wer hier etwas ändert, ändert es dort mit. */
const zeilen = liesDatei(ROADMAP).split(/\r?\n/);
const phasen = [];
/* Dieselbe Marke wie in `vorgaenge.mjs` — siehe den Hinweis oben. */
const KEINE_PHASE = /<!--\s*keine-phase\s*-->/i;
let imBlock = false, ueberspringen = false, stumm = false;
zeilen.forEach((zeile, i) => {
  if (/^\s*```/.test(zeile)) { imBlock = !imBlock; return; }
  if (imBlock) return;
  if (KEINE_PHASE.test(zeile)) { ueberspringen = true; return; }
  const p = zeile.match(/^##\s+(.+?)\s*$/);
  const s = zeile.match(/^###\s+(.+?)\s*$/);
  const v = zeile.match(/^\s*Vorgang:\s*#(\d+)/i);
  if (ueberspringen && (p || s)) { ueberspringen = false; stumm = true; return; }
  if (stumm && !p && !s) return;
  if (p || s) stumm = false;
  if (p) { phasen.push({ titel: p[1], zeile: i + 1, nummer: null, schritte: [] }); return; }
  if (!phasen.length) return;
  const aktuell = phasen[phasen.length - 1];
  if (s) { aktuell.schritte.push({ titel: s[1], zeile: i + 1, nummer: null }); return; }
  if (v) {
    const ziel = aktuell.schritte.length ? aktuell.schritte[aktuell.schritte.length - 1] : aktuell;
    if (ziel.nummer !== null)
      console.log(`    ${ROADMAP}:${i + 1}  zweite Vorgangsnummer für „${ziel.titel}"`);
    ziel.nummer = parseInt(v[1], 10);
  }
});

/* ── 1 und 2 · jede Phase und jeder Schritt hat einen Vorgang ─────── */
const ohnePhase = phasen.filter((p) => p.nummer === null);
const ohneSchritt = [];
for (const p of phasen) for (const s of p.schritte) if (s.nummer === null) ohneSchritt.push({ p, s });

for (const p of ohnePhase) console.log(`    ${ROADMAP}:${p.zeile}  Phase ohne Vorgang: ${p.titel}`);
for (const { p, s } of ohneSchritt) console.log(`    ${ROADMAP}:${s.zeile}  Schritt ohne Vorgang: ${s.titel} (in ${p.titel})`);

/* ── 3 · keine Nummer zweimal ─────────────────────────────────────── */
const gesehen = new Map();
let doppelt = 0;
for (const p of phasen) {
  for (const eintrag of [p, ...p.schritte]) {
    if (eintrag.nummer === null) continue;
    if (gesehen.has(eintrag.nummer)) {
      console.log(`    #${eintrag.nummer} steht zweimal: „${gesehen.get(eintrag.nummer)}" und „${eintrag.titel}"`);
      doppelt++;
    } else gesehen.set(eintrag.nummer, eintrag.titel);
  }
}

/* ── 4 · die Roadmap behauptet keinen Stand ───────────────────────── */
/* ⚠️ `fertig` steht bewusst **nicht** allein darin: „**Fertig, wenn:**"
   ist das Abnahmekriterium, das laut `vorlagen/ROADMAP.md` genau hier
   stehen soll — eine Bedingung, keine Behauptung. Ohne diese
   Unterscheidung schlägt die Prüfung gegen ihre eigene Vorlage an
   (Fehlerbuch B4). Gefangen wird nur die Aussage „ist fertig". */
const STAND_MUSTER = /\b(erledigt|abgeschlossen|ist live|läuft bereits|in Arbeit|(?:ist|sind) fertig)\b/i;
let standfunde = 0;
imBlock = false;
zeilen.forEach((zeile, i) => {
  if (/^\s*```/.test(zeile)) { imBlock = !imBlock; return; }
  if (imBlock) return;
  if (/(\d{1,2}\.\d{1,2}\.\d{4}|\d{4}-\d{2}-\d{2})/.test(zeile)) return;   /* datiert = Nachweis */
  const nurAussage = zeile.replace(/`[^`]*`/g, " ").replace(/„[^"“]*["“]/g, " ").replace(/"[^"]*"/g, " ");
  if (STAND_MUSTER.test(nurAussage) || /^\s*[-*]\s*\[[xX]\]/.test(zeile)) {
    console.log(`    ${ROADMAP}:${i + 1}  Stand im Dokument  ·  ${zeile.trim().slice(0, 60)}`);
    standfunde++;
  }
});

const schritte = phasen.reduce((n, p) => n + p.schritte.length, 0);
console.log(`  ${phasen.length} Phase(n), ${schritte} Schritt(e), ${gesehen.size} Vorgangsnummer(n)`);

melde(phasen.length > 0, `${ROADMAP} nennt Phasen`,
  phasen.length === 0 ? "keine `##`-Überschrift gefunden — die Prüfung kann nichts fangen" : "");
melde(ohnePhase.length === 0, "jede Phase hat einen Vorgang",
  ohnePhase.length ? `${ohnePhase.length} ohne — anlegen mit \`node werkzeuge/vorgaenge.mjs roadmap --wirklich\`` : "");
melde(ohneSchritt.length === 0, "jeder Schritt hat einen Vorgang",
  ohneSchritt.length ? `${ohneSchritt.length} ohne` : "");
melde(doppelt === 0, "keine Vorgangsnummer steht zweimal",
  doppelt ? `${doppelt} doppelt — zwei Stellen zeigen auf denselben Vorgang` : "");
melde(standfunde === 0, "die Roadmap behauptet keinen Stand",
  standfunde ? `${standfunde} Stelle(n) — der Stand lebt im Vorgang (Regel 13/14)` : "");

/* ── Mit --online: nachsehen, ob es die Vorgänge wirklich gibt ────── */
if (online) {
  const { repoBestimmen, tokenHolen, api } = await import("./github-zugang.mjs");
  const repo = repoBestimmen(konfig.repo);
  const { token } = tokenHolen();
  if (!repo || !token) {
    melde(false, "Online-Prüfung nicht möglich", !repo ? "kein Repository gefunden" : "kein Token");
    ende();
  }
  const LABEL = { phase: konfig.sammel_label || "track", schritt: "schritt" };
  let fehlend = 0, falschesLabel = 0, ohneEltern = 0;

  for (const p of phasen) {
    if (p.nummer === null) continue;
    let vorgang;
    try { vorgang = await api(`/repos/${repo}/issues/${p.nummer}`, { token }); }
    catch { console.log(`    #${p.nummer} gibt es nicht (${p.titel})`); fehlend++; continue; }
    if (!vorgang.labels.some((l) => l.name === LABEL.phase)) {
      console.log(`    #${p.nummer} ohne Label „${LABEL.phase}" (${p.titel})`);
      falschesLabel++;
    }
    for (const s of p.schritte) {
      if (s.nummer === null) continue;
      let kind;
      try { kind = await api(`/repos/${repo}/issues/${s.nummer}`, { token }); }
      catch { console.log(`    #${s.nummer} gibt es nicht (${s.titel})`); fehlend++; continue; }
      if (!(kind.body || "").includes(`#${p.nummer}`)) {
        console.log(`    #${s.nummer} nennt seinen Elternvorgang #${p.nummer} nicht`);
        ohneEltern++;
      }
    }
  }

  /* Jede Vorgangsnummer im Changelog zeigt auf einen echten Vorgang. */
  let toteNummer = 0;
  if (existsSync(join(WURZEL, "CHANGELOG.md"))) {
    const nummern = new Set([...liesDatei("CHANGELOG.md").matchAll(/\(#(\d+)\)/g)].map((m) => m[1]));
    for (const n of nummern) {
      try { await api(`/repos/${repo}/issues/${n}`, { token }); }
      catch { console.log(`    CHANGELOG.md nennt #${n} — gibt es nicht`); toteNummer++; }
    }
  }

  melde(fehlend === 0, "jede genannte Vorgangsnummer existiert", fehlend ? `${fehlend} tot` : "");
  melde(falschesLabel === 0, `jede Phase trägt „${LABEL.phase}"`, falschesLabel ? `${falschesLabel} ohne` : "");
  melde(ohneEltern === 0, "jeder Schritt nennt seinen Elternvorgang", ohneEltern ? `${ohneEltern} ohne` : "");
  melde(toteNummer === 0, "jede Nummer im Changelog zeigt auf einen Vorgang", toteNummer ? `${toteNummer} tot` : "");
}

ende();
