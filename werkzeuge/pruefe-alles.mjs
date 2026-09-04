/* [Aufgabe: Prüfwesen] Alle Prüfungen, plus die Syntaxprüfung jeder Datei.

       node werkzeuge/pruefe-alles.mjs
       node werkzeuge/pruefe-alles.mjs --nacheinander    (ohne Parallelität)

   ── Wegweiser: welche Prüfung sichert welche Zusicherung ────────────

   Diese Datei öffnet man zuerst, also steht die Landkarte hier. Die
   dritte Spalte ist die wichtigste: **Eine Prüfung, die keinen Fehler
   verhindert, der sonst durchkäme, ist Zierde.**

   | Prüfung | hält fest | was ohne sie still durchkäme |
   | --- | --- | --- |
   | Syntax (hier) | jede `.js`/`.mjs` lässt sich laden | ein Tippfehler in einer Datei, die keine andere importiert |
   | `pruefe-bearbeiten.mjs` | jedes bearbeitbare Feld übersteht Öffnen und Speichern zeichengleich | ein Stift, der beim Speichern in das falsche Feld schreibt |
   | `pruefe-bearbeitungskontext.mjs` | der eingefrorene Kontext, seine Delegation und Fehlerpfade | ein Bearbeitungsmodul, das sich still an eine globale Variable hängt |
   | `pruefe-cache-graph.mjs` | jede veränderliche Browser-Abhängigkeit trägt im Artefakt ihre SHA | ein Besucher mit neuem HTML und altem JavaScript aus dem Zwischenspeicher |
   | `pruefe-datenvertrag.mjs` | IDs, Kategorien, Panels, Verweise, Rahmen, Bildpfade (Legacy-v0) | der Verweis auf einen Eintrag, den es nicht gibt |
   | `pruefe-firestore-format.mjs` | Welt ⇄ Firestore-Dokumente, samt Schlüsselreihenfolge | ein Speichern, das `quelle.json` komplett umsortiert |
   | `pruefe-firestore-trennung.mjs` | die Regeldatei enthält Scotophobias Blöcke wortgleich | **ein Deploy, der das Nachbarprojekt abschaltet** — siehe `docs/PROJEKTGRENZE.md` |
   | `pruefe-github.mjs` | Drei-Dateien-Transaktion, Base64-Umlauf, Konfliktvertrag (Altweg) | ein halb geschriebenes Repository nach einem Speicherabbruch |
   | `pruefe-gleichstand.mjs` | `welt.json` passt zu den Rohdaten | eine Anzeige, die etwas anderes zeigt als die Quelle sagt |
   | `pruefe-leseruntime.mjs` | Bausteine, Ladereihenfolge, Fassade vor dem ersten Render | ein Deep Link, der beim harten Aufruf ins Leere läuft |
   | `pruefe-rahmen-routen.mjs` | Fassade, Deep Links, Render-Generation, späte Rahmen-Renderer | ein verspäteter Assistent, der die inzwischen andere Seite überschreibt |
   | `pruefe-schreibweise.mjs` | sichtbarer Text übersteht die Umwandlung | ein Absatz, der beim Speichern zu HTML-Text zerfällt |
   | `pruefe-server-sicherheit.mjs` | Freigabelisten, Methoden, Loopback der lokalen Server | die `.env`, die der Vorschau-Server ins Netz stellt |
   | `pruefe-stilstruktur.mjs` | die Stildateien ergeben zusammen den bisherigen Inhalt | eine Regel, die beim Aufteilen verlorengegangen ist |
   | `pruefe-struktur.mjs` | Anlegen, Löschen, Sortieren lässt keine Rohdatenreste | der gelöschte Abschnitt, der als Waise in der Quelle bleibt |
   | `pruefe-symbole.mjs` | jede Kategorie hat eigenes Symbol, Farbton und Kontrast | zwei Kategorien, die auf dem Bildschirm gleich aussehen |
   | `pruefe-tags.mjs` | jede Quelldatei trägt ihr `[Aufgabe: …]` aus der Systemtabelle | die Datei, von der niemand mehr weiß, wozu sie da ist |
   | `pruefe-verweise.mjs` | kein Markdown-Verweis zeigt ins Leere | ein Wegweiser auf eine Datei, die es nicht mehr gibt — er wird geglaubt |
   | `pruefe-workclaim.mjs` | WORKCLAIM.md ist da, lesbar, jeder Anspruch vollständig | zwei Sitzungen im selben Checkout, Konfliktmarker in sieben Dateien |
   | `pruefe-geheimnisse.mjs` | kein verbotenes Format, kein Geheimnismuster im Arbeitsstand | der Schlüssel, der „nur kurz zum Testen" eingetragen wurde |
   | `pruefe-altlasten.mjs` | neue Dateien < 500 Zeilen; geführte Altlasten wachsen nie | die Altlast, die „nur diesmal" um dreißig Zeilen wächst |
   | `pruefe-arbeitsweise.mjs` | nie auf dem Hauptzweig, nichts ohne Changelog-Eintrag | genau die zwei Regeln, die man beim Arbeiten vergisst |

   **Nicht in der Kette:** `pruefe-freigabe.mjs` — die Freigabeliste
   vor einer Veröffentlichung. Während der Entwicklung ist ein
   Vorlagenzustand normal; sie läuft von Hand, bevor etwas öffentlich
   wird, und durchsucht dabei auch die ganze Git-Historie.

   ── Verhältnis zu den beiden GitHub-Abläufen ────────────────────────

   `.github/workflows/qa.yml` und `pages.yml` sammeln **jede**
   `werkzeuge/pruefe-*.mjs` ein und rufen sie einzeln auf.

   Daraus folgen zwei Dinge, die man wissen muss, bevor man hier etwas
   ändert:

   1. **Diese Datei heißt selbst `pruefe-…` und läuft dort mit.** Sie
      startet dann alle anderen ein zweites Mal. Doppelte Arbeit, aber
      kein Fehler: Beide Wege müssen dasselbe Ergebnis liefern, sonst
      stimmt einer von beiden nicht. Wer das abstellen will, ändert den
      Ablauf, nicht die Kette.
   2. **`pruefe-freigabe.mjs` wird dort ebenfalls eingesammelt**,
      obwohl sie hier absichtlich draußen bleibt. Sie ist damit in der
      CI ein Pflichtgate — und das ist gewollt: Die Historiensuche nach
      Geheimnissen läuft so bei jedem Pull Request. Gemessen am
      04.09.2026: `git log --all -p` liefert 4.086.314 Zeichen in
      148 ms, der ganze Lauf braucht 0,34 s. Der Preis ist, dass
      **jeder ungefüllte `{{Platzhalter}}` in der Doku die CI rot
      macht** — was in einem längst veröffentlichten Repository richtig
      ist.

   **Neue Fachprüfungen** (`pruefe-<thema>.mjs` hier ablegen) werden
   automatisch aufgenommen. Zwei Pflichten dabei: die Zeile in dieser
   Tabelle ergänzen — und die neue Prüfung **zuerst rot machen** (den
   Fehler absichtlich einbauen, anschlagen sehen, zurücknehmen). Eine
   Prüfung, die nie rot war, prüft womöglich nichts.

   ── Drei Regeln der Kette ───────────────────────────────────────────

   1. **Die Ausgabe bleibt in fester Reihenfolge.** Parallel laufende
      Prozesse schrieben sonst ineinander; jede Prüfung sammelt ihre
      Ausgabe, gedruckt wird in Listenreihenfolge.
   2. **Wer den Arbeitsbaum liest oder schreibt, läuft allein** —
      `pruefe-arbeitsweise.mjs` am Ende, sonst sähe sie die Dateien
      eines parallelen Werkzeugs als offene Änderung.
   3. Die Ausgabe eines Messlaufs gehört **außerhalb** des Projekts
      abgelegt (`> lauf.txt` im Scratchpad), sonst schlägt Regel 4 an.

   ⚠️ Diese Datei bleibt absichtlich ohne `helfer.mjs`: Sie soll auch
   dann eine lesbare Syntaxmeldung ausgeben, wenn genau der kaputt ist. */

import { spawnSync, spawn } from "node:child_process";
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { cpus } from "node:os";

const WURZEL = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const knoten = process.execPath;
const NACHEINANDER = process.argv.includes("--nacheinander");
const GLEICHZEITIG = NACHEINANDER ? 1 : Math.max(1, Math.min(8, cpus().length));

/* ── Syntax zuerst: schnell, und macht alles Weitere sinnlos, wenn sie
   fällt.

   Zwei Abweichungen von der Alpha-Code-Vorlage, beide bewusst:

   1. **Alle `.js`, egal wo** — nicht die `quellordner` aus
      `alpha-code.json`. Dort ist `daten` ausgenommen (erzeugte Welt),
      aber `daten/welt.js` wird vom Browser geladen; ein Tippfehler
      darin wäre ein weißer Bildschirm. Beide GitHub-Abläufe prüfen sie
      ebenfalls, diese Kette darf nicht weniger sehen.
   2. **`.js` wird als ES-Modul geprüft, über die Standardeingabe.**
      Dieses Projekt hat keine `package.json`, `.js` gilt für Node also
      als CommonJS — `bearbeiten.js` und vier weitere Module benutzen
      aber `import`. Gemessen am 04.09.2026 auf Node v24.16.0: `node
      --check bearbeiten.js` besteht, weil die Modulerkennung seit
      Node 22.7 von selbst greift; mit
      `--no-experimental-detect-module` fällt derselbe Aufruf durch.
      Die Prüfung soll nicht an einer Voreinstellung hängen, die sich
      ändern kann.

      Die beiden Abläufe lösen es mit temporären `.mjs`-Kopien — das
      wäre hier eine Schreiboperation im Repository, die
      `pruefe-arbeitsweise.mjs` als offene Änderung sähe.
      `node --input-type=module --check` über stdin braucht keine
      Datei und steht so schon in `docs/RELEASE_RUNBOOK.md`.

   ⚠️ Der Status kommt aus `spawnSync`, nicht aus einer Pipeline:
   `… | head` meldet den Code von `head`, nicht den der Prüfung
   (Fehlerbuch C4). ── */
const AUS = new Set(["node_modules", ".git", ".entwurf"]);
const dateien = [];
const sammle = (rel) => {
  for (const name of readdirSync(join(WURZEL, rel))) {
    if (AUS.has(name)) continue;
    const relKind = rel === "." ? name : rel + "/" + name;
    if (statSync(join(WURZEL, relKind)).isDirectory()) sammle(relKind);
    else if (name.endsWith(".js") || name.endsWith(".mjs")) dateien.push(relKind);
  }
};
sammle(".");
dateien.splice(0, dateien.length, ...new Set(dateien));
dateien.sort();
let syntaxOk = true;
let alsModul = 0;
process.stdout.write(`══ Syntax ${"═".repeat(52)}\n\n`);
for (const d of dateien) {
  const e = d.endsWith(".mjs")
    ? spawnSync(knoten, ["--check", d], { cwd: WURZEL })
    : spawnSync(knoten, ["--input-type=module", "--check"],
        { cwd: WURZEL, input: readFileSync(join(WURZEL, d)) });
  if (!d.endsWith(".mjs")) alsModul++;
  const gut = e.status === 0;
  if (!gut) { syntaxOk = false; process.stdout.write(`  ${d}:\n` + String(e.stderr)); }
  console.log(`  ${gut ? "ok" : "FEHLER"}  ${d}`);
}
console.log(`\n  ${dateien.length} Dateien geprüft, davon ${alsModul} als ES-Modul über stdin`);

/* ── Die Prüfungen: alle `pruefe-*.mjs` außer dieser Datei und der
   Arbeitsweise, die allein läuft (Regel 2). ── */
const PARALLEL = readdirSync(join(WURZEL, "werkzeuge"))
  .filter((d) => /^pruefe-.*\.mjs$/.test(d))
  .filter((d) => d !== "pruefe-alles.mjs" && d !== "pruefe-arbeitsweise.mjs"
    && d !== "pruefe-freigabe.mjs")
  .sort()
  .map((d) => [d.replace(/^pruefe-|\.mjs$/g, ""), ["werkzeuge/" + d]]);
const ALLEIN = [["arbeitsweise", ["werkzeuge/pruefe-arbeitsweise.mjs"]]];

const starte = (titel, argumente) => new Promise((fertig) => {
  const k = spawn(knoten, argumente, { cwd: WURZEL });
  let text = "";
  k.stdout.on("data", (d) => { text += d; });
  k.stderr.on("data", (d) => { text += d; });
  k.on("close", (code) => fertig({ titel, gut: code === 0, text }));
});

const drucke = (r) => {
  process.stdout.write(`\n══ ${r.titel} ${"═".repeat(Math.max(0, 58 - r.titel.length))}\n\n`);
  process.stdout.write(r.text);
};

async function laufeAlle(liste) {
  const raus = new Array(liste.length);
  let naechste = 0;
  const arbeiter = async () => {
    while (true) {
      const i = naechste++;
      if (i >= liste.length) return;
      raus[i] = await starte(liste[i][0], liste[i][1]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(GLEICHZEITIG, Math.max(1, liste.length)) }, arbeiter));
  return raus;
}

const t0 = Date.now();
const ergebnisse = [["Syntax", syntaxOk]];
for (const r of await laufeAlle(PARALLEL)) { drucke(r); ergebnisse.push([r.titel, r.gut]); }
for (const [titel, argumente] of ALLEIN) {
  const r = await starte(titel, argumente);
  drucke(r);
  ergebnisse.push([titel, r.gut]);
}

console.log(`\n══ Zusammenfassung ${"═".repeat(44)}\n`);
let fehler = 0;
for (const [name, gut] of ergebnisse) {
  console.log(`  ${gut ? "bestanden" : "FEHLGESCHLAGEN"}  ${name}`);
  if (!gut) fehler++;
}
console.log(`\n  ${((Date.now() - t0) / 1000).toFixed(1)} s` +
  `${NACHEINANDER ? " (nacheinander)" : `, bis zu ${GLEICHZEITIG} gleichzeitig`}`);
console.log(fehler ? `\n${fehler} Prüfung(en) fehlgeschlagen` : "\nalles grün");
process.exit(fehler ? 1 : 0);
