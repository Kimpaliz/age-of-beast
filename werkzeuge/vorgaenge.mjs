/* [Aufgabe: Prüfwesen] Vorgänge anlegen, verketten und abfragen.

       node werkzeuge/vorgaenge.mjs roadmap                 was fehlt (Trockenlauf)
       node werkzeuge/vorgaenge.mjs roadmap --wirklich      anlegen
       node werkzeuge/vorgaenge.mjs wunsch "Titel" --datei wunsch.md
       node werkzeuge/vorgaenge.mjs fehler "Titel" --datei bericht.md
       node werkzeuge/vorgaenge.mjs entscheidung "Titel" --datei frage.md
       node werkzeuge/vorgaenge.mjs bericht 42 --datei abschluss.md
       node werkzeuge/vorgaenge.mjs stand                   die Übersicht

   ── Die vier Formen, und warum es genau vier sind ───────────────────

   | Form | Label | Eltern | trägt |
   | --- | --- | --- | --- |
   | **Phase** | `track` | keins | das Abnahmekriterium aus dem Dokument |
   | **Schritt** | `schritt` | Phase | **ein** Fertig-Kriterium |
   | **Fehler** | `fehler` | frei | das Vier-Felder-Muster des Fehlerbuchs |
   | **Entscheidung** | `entscheidung` | **keins** | Frage, Optionen, Empfehlung |
   | **Wunsch** | `wunsch` + `track` | keins | Janniks Wortlaut, dann die Analyse |

   **Warum der Wunsch eine eigene Form ist und keine Phase.** Eine Phase
   kommt aus dem Fahrplan — jemand hat sie geschnitten und begruendet.
   Ein Wunsch kommt von Jannik und ist **noch nicht analysiert**: Was
   dafuer gebraucht wird, steht erst nach dem Nachsehen fest.

   Er traegt deshalb **beide** Label: `wunsch` sagt, woher er kommt,
   `track` macht ihn zum Sammelvorgang, an den Schritte haengen. Damit
   gilt fuer ihn dieselbe Regel wie fuer eine Phase — er enthaelt selbst
   keine Arbeit.

   Sein Wortlaut wird **zitiert, nicht umformuliert**. Was Jannik gesagt
   hat, ist die Quelle; die Auslegung steht darunter und getrennt davon.
   Wer beides vermischt, kann spaeter nicht mehr nachsehen, ob die
   Auslegung stimmte.

   **Eine Entscheidung hängt bewusst an keiner Phase.** Sie hat eine
   andere Lebensdauer als die Arbeit, die auf sie wartet, und überlebt
   sie oft — als Absatz in einem Phasen-Vorgang wäre sie mit dessen
   Abschluss verschwunden, ohne beantwortet zu sein (Regel 13).

   ── Wo die Grenze zum Fehlerbuch liegt ──────────────────────────────

   **Ein Vorgang ist ein offener Fehler. Ein Fehlerbuch-Fall ist die
   gelernte Lehre.** Der Fehler wandert nicht *statt* ins Fehlerbuch in
   einen Vorgang, sondern **nacheinander**: erst der Vorgang (was ist
   kaputt, seit wann, woran erkannt), nach der Behebung der Fall (woran
   ich es früher merke). Wer nur das eine führt, verliert entweder den
   Stand oder die Lehre.

   ── Verweise, in beide Richtungen ───────────────────────────────────

   Ein Verweis, den es nur einmal gibt, ist beim Lesen von der anderen
   Seite unsichtbar. Deshalb je Verbindung zwei:

   - **Kind → Eltern:** die Zeile `Teil von #12` im Rumpf
   - **Eltern → Kind:** ein Punkt der Aufgabenliste `- [ ] #13`
     (GitHub rechnet daraus den Fortschritt des Sammelvorgangs)
   - **Vorgang → Begründung:** `Begründung: docs/ROADMAP.md`
   - **Commit → Vorgang:** `(#13)` am Ende des Betreffs

   Zusätzlich wird die echte Unter-Vorgangs-Verknüpfung versucht, wo
   GitHub sie anbietet; scheitert sie, **wird das gemeldet** und die
   Aufgabenliste trägt die Hierarchie allein.

   ── Nichts geschieht ohne `--wirklich` ──────────────────────────────

   Standard ist der Trockenlauf. Vorgänge anzulegen ist eine Handlung
   nach außen: Sie erzeugt Benachrichtigungen bei allen Beteiligten und
   lässt sich nicht spurlos zurücknehmen.

   ── Arbeitet zusammen mit ───────────────────────────────────────────

   `github-zugang.mjs` (Token, Repo, Aufrufe), `helfer.mjs`
   (Einstellung), `docs/ROADMAP.md` (die Quelle der Phasen) und
   `pruefe-vorgaenge.mjs`, die dieselben Formen **ohne Netz** prüft. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { liesEinstellung, WURZEL } from "./helfer.mjs";
import { repoBestimmen, tokenHolen, api, alleSeiten } from "./github-zugang.mjs";

const argumente = process.argv.slice(2);
const befehl = argumente[0];
const wirklich = argumente.includes("--wirklich");
const wert = (name) => {
  const i = argumente.indexOf("--" + name);
  return i >= 0 ? argumente[i + 1] : null;
};

const konfig = liesEinstellung().vorgaenge;
if (!konfig) {
  console.error("Kein `vorgaenge`-Block in alpha-code.json — siehe docs/REGELN.md, Regel 16.");
  process.exit(1);
}
const LABEL = { phase: konfig.sammel_label || "track", schritt: "schritt", fehler: "fehler", entscheidung: "entscheidung", wunsch: "wunsch" };
const ROADMAP = konfig.roadmap || "docs/ROADMAP.md";

const repo = repoBestimmen(konfig.repo);
if (!repo) { console.error("Kein GitHub-Repository gefunden (weder in alpha-code.json noch als origin)."); process.exit(1); }

let zugang = null;
const verbinden = () => {
  if (zugang) return zugang;
  const { token, quelle } = tokenHolen();
  if (!token) {
    console.error("Kein GitHub-Token. Erwartet: GITHUB_TOKEN, `gh auth login` oder ein\n" +
      "gespeichertes Git-Anmeldedatum für github.com.");
    process.exit(1);
  }
  console.log(`  Zugang über ${quelle}, Repository ${repo}`);
  zugang = { token };
  return zugang;
};

/* ── Die Roadmap lesen ──────────────────────────────────────────────

   `## Überschrift` ist eine Phase, `###` darunter ein Schritt. Eine
   Zeile `Vorgang: #12` merkt sich die Nummer — sie ist die einzige
   Stelle, an der ein Dokument eine Vorgangsnummer trägt, und das ist
   kein Statusanspruch, sondern ein Verweis (Regel 14).

   ⚠️ **Nicht jede Überschrift ist Arbeit.** Ein Fahrplan erklärt sich
   auch selbst: „Das Format, das die Werkzeuge lesen", „Was nicht
   hierher gehört". Beim ersten Lauf am 04.09.2026 wären daraus drei
   Vorgänge geworden — Anleitungstexte als Arbeitspakete, mit
   Benachrichtigung an alle Beteiligten.

   Ein Abschnitt, über dem `<!-- keine-phase -->` steht, wird deshalb
   übersprungen. Die Marke ist **ausdrücklich** und nicht geraten: Eine
   Regel wie „alles vor dem ersten Trenner zählt nicht" wäre unsichtbar
   und bräche, sobald jemand einen Absatz verschiebt. */

const KEINE_PHASE = /<!--\s*keine-phase\s*-->/i;
function roadmapLesen() {
  const pfad = join(WURZEL, ROADMAP);
  if (!existsSync(pfad)) return null;
  const zeilen = readFileSync(pfad, "utf8").split(/\r?\n/);
  const phasen = [];
  let imBlock = false, ueberspringen = false, stumm = false;
  for (const zeile of zeilen) {
    if (/^\s*```/.test(zeile)) { imBlock = !imBlock; continue; }
    if (imBlock) continue;
    if (KEINE_PHASE.test(zeile)) { ueberspringen = true; continue; }
    const p = zeile.match(/^##\s+(.+?)\s*$/);
    const s = zeile.match(/^###\s+(.+?)\s*$/);
    /* Die Marke gilt fuer genau den naechsten Abschnitt. Danach zaehlt
       wieder alles — sonst verschluckte ein vergessenes Zuruecksetzen
       still den halben Fahrplan. */
    if (ueberspringen && (p || s)) { ueberspringen = false; stumm = true; continue; }
    if (stumm && !p && !s) continue;
    if (p || s) stumm = false;
    const v = zeile.match(/^\s*Vorgang:\s*#(\d+)/i);
    if (p) { phasen.push({ titel: p[1], nummer: null, schritte: [], zeilen: [] }); continue; }
    if (!phasen.length) continue;
    const aktuell = phasen[phasen.length - 1];
    if (s) { aktuell.schritte.push({ titel: s[1], nummer: null, zeilen: [] }); continue; }
    if (v) {
      const ziel = aktuell.schritte.length ? aktuell.schritte[aktuell.schritte.length - 1] : aktuell;
      ziel.nummer = parseInt(v[1], 10);
      continue;
    }
    (aktuell.schritte.length ? aktuell.schritte[aktuell.schritte.length - 1] : aktuell).zeilen.push(zeile);
  }
  return phasen;
}

const rumpfBauen = (teile) => teile.filter(Boolean).join("\n\n") + "\n";
const beschreibung = (o) => o.zeilen.join("\n").trim().slice(0, 4000);

async function anlegen(titel, rumpf, labels) {
  if (!wirklich) { console.log(`    [Trockenlauf] würde anlegen: ${titel}  [${labels.join(", ")}]`); return null; }
  const v = await api(`/repos/${repo}/issues`, {
    ...verbinden(), methode: "POST", rumpf: { title: titel, body: rumpf, labels }
  });
  console.log(`    #${v.number}  ${titel}`);
  return v.number;
}

/* Die echte Unter-Vorgangs-Verknüpfung, wo GitHub sie anbietet. Fehlt
   sie, bleibt die Aufgabenliste — und das wird gesagt, nicht verschwiegen. */
async function unterVorgang(eltern, kindId) {
  try {
    await api(`/repos/${repo}/issues/${eltern}/sub_issues`, {
      ...verbinden(), methode: "POST", rumpf: { sub_issue_id: kindId }
    });
    return true;
  } catch (f) {
    console.log(`    Hinweis: echte Unter-Vorgänge nicht verfügbar (${f.status}) — Aufgabenliste trägt die Hierarchie`);
    return false;
  }
}

async function befehlRoadmap() {
  const phasen = roadmapLesen();
  if (!phasen) { console.error(`${ROADMAP} gibt es nicht.`); process.exit(1); }
  console.log(`  ${phasen.length} Phase(n) in ${ROADMAP}`);

  let neu = 0;
  for (const phase of phasen) {
    if (phase.nummer === null) {
      const nummer = await anlegen(phase.titel,
        rumpfBauen([beschreibung(phase), `Begründung: \`${ROADMAP}\``,
          "*(Sammelvorgang. Der Stand lebt hier, die Begründung im Dokument — Regel 13.)*"]),
        [LABEL.phase]);
      phase.nummer = nummer; neu++;
    }
    for (const schritt of phase.schritte) {
      if (schritt.nummer !== null) continue;
      const nummer = await anlegen(schritt.titel,
        rumpfBauen([beschreibung(schritt),
          phase.nummer ? `Teil von #${phase.nummer}` : null,
          `Begründung: \`${ROADMAP}\``]),
        [LABEL.schritt]);
      schritt.nummer = nummer; neu++;
      if (wirklich && phase.nummer && nummer) {
        const kind = await api(`/repos/${repo}/issues/${nummer}`, verbinden());
        await unterVorgang(phase.nummer, kind.id);
      }
    }
    /* Aufgabenliste im Sammelvorgang — sie ergibt den Fortschrittsbalken. */
    if (wirklich && phase.nummer && phase.schritte.length) {
      const alt = await api(`/repos/${repo}/issues/${phase.nummer}`, verbinden());
      const liste = phase.schritte.filter((s) => s.nummer).map((s) => `- [ ] #${s.nummer}`).join("\n");
      if (liste && !(alt.body || "").includes(liste))
        await api(`/repos/${repo}/issues/${phase.nummer}`, {
          ...verbinden(), methode: "PATCH",
          rumpf: { body: (alt.body || "") + "\n\n## Schritte\n\n" + liste + "\n" }
        });
    }
  }
  console.log(neu === 0 ? "\n  Nichts anzulegen — jede Phase und jeder Schritt hat einen Vorgang."
    : `\n  ${neu} Vorgang/Vorgänge ${wirklich ? "angelegt" : "wären anzulegen"}.` +
      (wirklich ? `\n  Trage die Nummern als Zeile \`Vorgang: #N\` in ${ROADMAP} ein.` : " Mit --wirklich anlegen."));
}

async function befehlEinzeln(form) {
  const titel = argumente[1];
  const datei = wert("datei");
  if (!titel || !datei) { console.error(`Aufruf: vorgaenge.mjs ${form} "Titel" --datei <pfad.md>`); process.exit(1); }
  if (!existsSync(datei)) { console.error(`Datei fehlt: ${datei}`); process.exit(1); }
  const eltern = wert("eltern");
  const text = readFileSync(datei, "utf8").trim();

  const HINWEIS = {
    fehler: "*(Offener Fehler. Nach der Behebung wandert die Lehre als Fall ins Fehlerbuch — der Vorgang trägt den Stand, das Fehlerbuch die Gegenprobe.)*",
    entscheidung: "*(Offene Entscheidung. Sie hängt bewusst an keiner Phase: Sie hat eine andere Lebensdauer als die Arbeit, die auf sie wartet — Regel 13.)*",
    wunsch: "*(Wunsch von Jannik, Sammelvorgang. Er enthält selbst keine Arbeit — die Arbeit sind die Schritte darunter. Erst analysieren, was gebraucht wird, dann schneiden.)*"
  };

  /* Ein Wunsch trägt beide Label: `wunsch` sagt, woher er kommt,
     `track` macht ihn zum Sammelvorgang mit Fortschrittsanzeige. */
  const labels = form === "wunsch" ? [LABEL.wunsch, LABEL.phase] : [LABEL[form]];

  const nummer = await anlegen(titel,
    rumpfBauen([text, eltern ? `Teil von #${eltern}` : null, HINWEIS[form]]),
    labels);
  if (wirklich && eltern && nummer) {
    const kind = await api(`/repos/${repo}/issues/${nummer}`, verbinden());
    await unterVorgang(eltern, kind.id);
  }
}

async function befehlBericht() {
  const nummer = argumente[1];
  const datei = wert("datei");
  if (!nummer || !datei) { console.error('Aufruf: vorgaenge.mjs bericht <nummer> --datei <pfad.md>'); process.exit(1); }
  const text = readFileSync(datei, "utf8").trim();
  if (!wirklich) { console.log(`  [Trockenlauf] würde ${text.length} Zeichen an #${nummer} anhängen.`); return; }
  await api(`/repos/${repo}/issues/${nummer}/comments`, { ...verbinden(), methode: "POST", rumpf: { body: text } });
  console.log(`  Bericht an #${nummer} angehängt.`);
}

async function befehlStand() {
  const offen = await alleSeiten(`/repos/${repo}/issues?state=open`, verbinden());
  const echte = offen.filter((v) => !v.pull_request);
  /* Ein Wunsch traegt `wunsch` **und** `track` — sonst haette er keine
     Fortschrittsanzeige. In der Uebersicht darf er deshalb nicht in
     beiden Listen stehen: Am 04.09.2026 erschien #11 zweimal, und wer
     zaehlt, kaeme auf einen Vorgang zu viel. Wuensche werden zuerst
     ausgegeben und danach von den Phasen abgezogen. */
  const schonGenannt = new Set();
  const nach = (label) => echte.filter((v) => {
    if (!v.labels.some((l) => l.name === label)) return false;
    if (schonGenannt.has(v.number)) return false;
    schonGenannt.add(v.number);
    return true;
  });
  console.log(`\n  ${echte.length} offene(r) Vorgang/Vorgänge in ${repo}\n`);
  for (const [name, label] of [["Wünsche", LABEL.wunsch], ["Phasen", LABEL.phase],
    ["Schritte", LABEL.schritt], ["Fehler", LABEL.fehler],
    ["Entscheidungen", LABEL.entscheidung]]) {
    const liste = nach(label);
    if (!liste.length) continue;
    console.log(`  ${name} (${liste.length})`);
    for (const v of liste) console.log(`    #${v.number}  ${v.title}`);
    console.log("");
  }
  const ohne = echte.filter((v) => !Object.values(LABEL).some((l) => v.labels.some((x) => x.name === l)));
  if (ohne.length) console.log(`  ${ohne.length} ohne Form-Label — sie tauchen in keiner Übersicht auf.`);
}

const befehle = {
  roadmap: befehlRoadmap,
  wunsch: () => befehlEinzeln("wunsch"),
  fehler: () => befehlEinzeln("fehler"),
  entscheidung: () => befehlEinzeln("entscheidung"),
  bericht: befehlBericht,
  stand: befehlStand
};

if (!befehle[befehl]) {
  console.error("Befehle: roadmap · wunsch · fehler · entscheidung · bericht · stand\n" +
    "Ohne --wirklich läuft alles trocken.");
  process.exit(1);
}
befehle[befehl]().catch((f) => { console.error("  " + f.message); process.exit(1); });
