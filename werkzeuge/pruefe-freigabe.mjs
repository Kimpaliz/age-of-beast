/* [Aufgabe: Prüfwesen] Die Freigabeliste vor einer Veröffentlichung.

       node werkzeuge/pruefe-freigabe.mjs

   Muster übernommen aus Florians `check-release-readiness.mjs`
   (dashboard-game-template, 02.09.2026): **bewusst kein Teil der
   Kette.** Während der Entwicklung ist ein Vorlagenzustand normal —
   diese Liste muss erst durchgehen, bevor ein Repository öffentlich
   wird, eine Seite live geht oder ein Etikett gesetzt wird.

   ⚠️ **In diesem Projekt gilt das nur örtlich.** `qa.yml` und
   `pages.yml` sammeln jede `werkzeuge/pruefe-*.mjs` ein, also auch
   diese — in der CI ist sie ein Pflichtgate. Das ist hier richtig: Das
   Repository ist seit dem 24.08.2026 öffentlich, jeder Push auf `main`
   veröffentlicht, und ein ungefüllter Platzhalter oder ein Geheimnis
   in der Historie darf einen Pull Request rot machen. Gemessen am
   04.09.2026: 0,34 s für den ganzen Lauf, davon 148 ms für
   4.086.314 Zeichen `git log --all -p`.

   Sie prüft das maschinell Prüfbare und druckt am Ende die Liste
   dessen, was nur ein Mensch prüfen kann. `pruefe-alles.mjs` lässt
   sie absichtlich aus (Ausnahmeliste dort).

   Der wichtigste Teil ist die **Historiensuche**: Ein Geheimnis, das
   je committet war, bleibt in der Git-Historie sichtbar, auch wenn es
   im Arbeitsstand längst gelöscht ist. Beim Öffentlichschalten von
   Slay'Em All (26.08.2026) wurde genau diese Suche von Hand gemacht —
   hier läuft sie automatisch.

   ── Arbeitet zusammen mit ───────────────────────────────────────────

   `pruefe-geheimnisse.mjs` (dieselben Muster, dort nur Arbeitsstand),
   `helfer.mjs`, Git (`log --all -p`). */

import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { macheMelder, liesDatei, WURZEL } from "./helfer.mjs";
import { GEHEIMNIS_MUSTER } from "./pruefe-geheimnisse.mjs";

const { melde, ende } = macheMelder();

/* 1 · Der Arbeitsstand ist sauber (derselbe Wächter wie in der Kette). */
const g = spawnSync(process.execPath, ["werkzeuge/pruefe-geheimnisse.mjs"],
  { cwd: WURZEL, encoding: "utf8" });
melde(g.status === 0, "der Arbeitsstand enthält nichts Verbotenes",
  g.status === 0 ? "" : (g.stdout || "").trim().split("\n").slice(-1)[0]);

/* 2 · Keine ungefüllten Platzhalter mehr — wer {{…}} veröffentlicht,
   hat das Gerüst nie zu Ende eingerichtet. */
const kandidaten = ["CLAUDE.md", "README.md", "CHANGELOG.md"];
if (existsSync(join(WURZEL, "docs")))
  for (const d of readdirSync(join(WURZEL, "docs")))
    if (d.endsWith(".md")) kandidaten.push("docs/" + d);
const offen = [];
for (const k of kandidaten) {
  if (!existsSync(join(WURZEL, k))) continue;
  for (const p of liesDatei(k).matchAll(/\{\{[A-Z_ÄÖÜ]+\}\}/g)) offen.push(`${k}: ${p[0]}`);
}
for (const o of [...new Set(offen)].slice(0, 10)) console.log(`    ${o}`);
melde(offen.length === 0, "kein Vorlagen-Platzhalter mehr in der Doku",
  offen.length ? `${offen.length} offen` : "");

/* 3 · Ein README, das dieses Projekt beschreibt. */
melde(existsSync(join(WURZEL, "README.md")), "README.md existiert",
  "wer das Repository öffnet, muss ohne Vorwissen verstehen, was es ist");

/* 4 · Die Historiensuche. `git log --all -p` ist bei großen Historien
   langsam — das ist in Ordnung, diese Prüfung läuft vor einer
   Veröffentlichung, nicht bei jedem Commit. */
const log = spawnSync("git", ["log", "--all", "-p", "--no-color"],
  { cwd: WURZEL, encoding: "utf8", maxBuffer: 512 * 1024 * 1024 });
if (log.status !== 0) {
  melde(false, "die Git-Historie ließ sich durchsuchen", "kein Git oder Fehler beim Lesen");
} else {
  const treffer = [];
  for (const [name, muster] of GEHEIMNIS_MUSTER)
    if (muster.test(log.stdout)) treffer.push(name);
  melde(treffer.length === 0,
    "kein Geheimnismuster in der gesamten Git-Historie",
    treffer.length ? treffer.join(", ") + " — die Historie bleibt nach dem " +
      "Veröffentlichen für immer sichtbar; vorher bereinigen oder neu aufsetzen" : "");
}

/* 5 · Was nur ein Mensch prüfen kann. */
console.log(`
  Von Hand, bevor es öffentlich wird:
  - Lizenzen mitgelieferter Fremdteile (Schriften!) liegen bei.
  - Keine echten Personen-, Kunden- oder Spielerdaten in Beispieldaten.
  - Commit-Absender: die E-Mail-Adresse wird mit veröffentlicht.
  - Die Seite/App einmal komplett durchgeklickt, am echten Gerät.
`);

ende();
