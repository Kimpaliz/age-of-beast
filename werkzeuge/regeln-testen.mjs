/**
 * Testet `firestore.rules` mit dem offiziellen Simulator der Firebase
 * Rules API.
 *
 * Aufruf:
 *   node werkzeuge/regeln-testen.mjs
 *
 * Es wird **nichts** geschrieben: Der Dienst wertet die Regeln gegen
 * erfundene Anfragen aus und meldet nur, ob sie erlaubt oder abgewiesen
 * würden.
 *
 * Warum dieses Werkzeug nicht `pruefe-*` heisst: Die Wächter unter
 * diesem Namen laufen bei jeder Veröffentlichung automatisch und dürfen
 * weder Netz noch Anmeldung brauchen. Dieser Test braucht beides und
 * wird deshalb von Hand aufgerufen.
 *
 * Er prüft ausdrücklich **beide** Anwendungen: dass das Wiki tut, was es
 * soll, und dass Scotophobias Regeln unverändert wirken.
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), '..');
const PROJEKT = 'kampagnenrahmen-jt';
const REGELN = readFileSync(join(WURZEL, 'firestore.rules'), 'utf8');
const ADMIN = 'kimpaliz1989@gmail.com';

const token = (process.env.FIRESTORE_TOKEN || execFileSync(
  'gcloud.cmd',
  ['auth', 'print-access-token'],
  { encoding: 'utf8', shell: true },
)).trim();

/* `request.time` muss ausdruecklich mitgegeben werden. Der Simulator
   setzt es nicht von selbst, und die Regeln vergleichen `geaendertAm`
   damit — ohne diesen Wert scheitert die Auswertung mit
   „Property time is undefined", was wie ein Regelfehler aussieht. */
function anfrage({ methode, weg, auth, daten, zeit }) {
  const req = { path: '/databases/(default)/documents/' + weg, method: methode };
  if (auth) req.auth = auth;
  else req.auth = null;
  if (daten) req.resource = { data: daten };
  if (zeit) req.time = zeit;
  return req;
}

const jetzt = new Date().toISOString();
const janniksKonto = { uid: 'jannik-uid', token: { email: ADMIN, email_verified: true } };
const fremdesKonto = { uid: 'fremd-uid', token: { email: 'wer@anders.de', email_verified: true } };

const faelle = [
  {
    name: 'Besucher darf die Welt lesen',
    erwartet: true,
    req: anfrage({ methode: 'get', weg: 'wiki_welt/species' }),
  },
  {
    name: 'Besucher darf NICHT schreiben',
    erwartet: false,
    req: anfrage({
      methode: 'update', weg: 'wiki_welt/species',
      daten: { inhalt: 'x', stand: 's', geaendertVon: 'wer', geaendertAm: jetzt },
    }),
  },
  {
    name: 'Jannik darf die Welt schreiben',
    erwartet: true,
    req: anfrage({
      methode: 'update', weg: 'wiki_welt/species', auth: janniksKonto,
      daten: { inhalt: 'x', stand: 's', geaendertVon: 'jannik-uid', geaendertAm: jetzt }, zeit: jetzt,
    }),
  },
  {
    name: 'Jannik darf KEINE fremde Kennung eintragen',
    erwartet: false,
    req: anfrage({
      methode: 'update', weg: 'wiki_welt/species', auth: janniksKonto,
      daten: { inhalt: 'x', stand: 's', geaendertVon: 'jemand-anders', geaendertAm: jetzt },
    }),
  },
  {
    name: 'Jannik darf KEIN zusaetzliches Feld schreiben',
    erwartet: false,
    req: anfrage({
      methode: 'update', weg: 'wiki_welt/species', auth: janniksKonto,
      daten: { inhalt: 'x', stand: 's', geaendertVon: 'jannik-uid', geaendertAm: jetzt, heimlich: 'ja' },
    }),
  },
  {
    name: 'Ein fremdes Konto darf NICHT schreiben',
    erwartet: false,
    req: anfrage({
      methode: 'update', weg: 'wiki_welt/species', auth: fremdesKonto,
      daten: { inhalt: 'x', stand: 's', geaendertVon: 'fremd-uid', geaendertAm: jetzt },
    }),
  },
  {
    name: 'Niemand darf ein Weltmodul loeschen',
    erwartet: false,
    req: anfrage({ methode: 'delete', weg: 'wiki_welt/species', auth: janniksKonto }),
  },
  {
    name: 'Ein fremdes Konto darf eine Anfrage stellen',
    erwartet: true,
    req: anfrage({
      methode: 'create', weg: 'wiki_zugang/fremd-uid', auth: fremdesKonto,
      daten: { konto: 'fremd-uid', email: 'wer@anders.de', name: 'Wer Anders', status: 'offen', angefragtAm: jetzt }, zeit: jetzt,
    }),
  },
  {
    name: 'Ein fremdes Konto darf sich NICHT selbst bestaetigen',
    erwartet: false,
    req: anfrage({
      methode: 'create', weg: 'wiki_zugang/fremd-uid', auth: fremdesKonto,
      daten: { konto: 'fremd-uid', email: 'wer@anders.de', name: 'Wer Anders', status: 'bestaetigt', angefragtAm: jetzt },
    }),
  },
  {
    name: 'Ein fremdes Konto darf NICHT die Antraege anderer lesen',
    erwartet: false,
    req: anfrage({ methode: 'get', weg: 'wiki_zugang/jannik-uid', auth: fremdesKonto }),
  },
  // Scotophobia: seine Regeln muessen unveraendert wirken
  {
    name: 'Scotophobia: Besucher darf KEINEN Spielstand lesen',
    erwartet: false,
    req: anfrage({ methode: 'get', weg: 'spielstaende/irgendwer' }),
  },
  {
    name: 'Scotophobia: Besucher darf KEINE Rueckmeldung lesen',
    erwartet: false,
    req: anfrage({ methode: 'get', weg: 'rueckmeldungen/irgendwas' }),
  },
  {
    name: 'Scotophobia: fremdes Konto darf KEINEN fremden Spielstand schreiben',
    erwartet: false,
    req: anfrage({
      methode: 'update', weg: 'spielstaende/jemand-anders', auth: fremdesKonto,
      daten: { punkte: 1 },
    }),
  },
  {
    name: 'Nicht genannte Sammlung bleibt zu',
    erwartet: false,
    req: anfrage({ methode: 'get', weg: 'irgendwas/x', auth: janniksKonto }),
  },
];

/* ── Plattform: mehrere Wikis ──────────────────────────────────────
   Die Plattformregeln schlagen das Wiki-Dokument mit `get()` nach. Der
   Simulator kennt keine Daten, deshalb wird der Aufruf als Attrappe
   beantwortet — genau das ist `functionMocks`. Ohne sie faellt jede
   dieser Regeln durch, und zwar aus dem falschen Grund. */

const WIKIWEG = '/databases/(default)/documents/wiki_projekte/testwiki';

const wikiAttrappe = (daten) => [{
  function: 'get',
  args: [{ exactValue: WIKIWEG }],
  result: { value: { data: daten } },
}];

const offenesWiki = {
  name: 'Testwiki', beschreibung: '', oeffentlich: true, regelwerke: ['daggerheart'],
  mitgliederIds: ['jannik-uid'], rollen: { 'jannik-uid': 'besitzer' },
  erstelltAm: jetzt, erstelltVon: 'jannik-uid',
};
const geschlossenesWiki = { ...offenesWiki, oeffentlich: false };
const wikiMitLeser = {
  ...geschlossenesWiki,
  mitgliederIds: ['jannik-uid', 'fremd-uid'],
  rollen: { 'jannik-uid': 'besitzer', 'fremd-uid': 'leser' },
};

const weltDaten = (uid) => ({ inhalt: 'x', stand: 's', geaendertVon: uid, geaendertAm: jetzt });

faelle.push(
  {
    name: 'Plattform: offenes Wiki darf jeder lesen',
    erwartet: true,
    attrappen: wikiAttrappe(offenesWiki),
    req: anfrage({ methode: 'get', weg: 'wiki_projekte/testwiki/welt/species' }),
  },
  {
    name: 'Plattform: geschlossenes Wiki liest ein Fremder NICHT',
    erwartet: false,
    attrappen: wikiAttrappe(geschlossenesWiki),
    req: anfrage({ methode: 'get', weg: 'wiki_projekte/testwiki/welt/species', auth: fremdesKonto }),
  },
  {
    name: 'Plattform: geschlossenes Wiki liest sein Besitzer',
    erwartet: true,
    attrappen: wikiAttrappe(geschlossenesWiki),
    req: anfrage({ methode: 'get', weg: 'wiki_projekte/testwiki/welt/species', auth: janniksKonto }),
  },
  {
    name: 'Plattform: Besitzer darf die Welt schreiben',
    erwartet: true,
    attrappen: wikiAttrappe(geschlossenesWiki),
    req: anfrage({
      methode: 'update', weg: 'wiki_projekte/testwiki/welt/species', auth: janniksKonto,
      daten: weltDaten('jannik-uid'), zeit: jetzt,
    }),
  },
  {
    name: 'Plattform: ein Leser darf NICHT schreiben',
    erwartet: false,
    attrappen: wikiAttrappe(wikiMitLeser),
    req: anfrage({
      methode: 'update', weg: 'wiki_projekte/testwiki/welt/species', auth: fremdesKonto,
      daten: weltDaten('fremd-uid'), zeit: jetzt,
    }),
  },
  {
    name: 'Plattform: ein Leser darf lesen',
    erwartet: true,
    attrappen: wikiAttrappe(wikiMitLeser),
    req: anfrage({ methode: 'get', weg: 'wiki_projekte/testwiki/welt/species', auth: fremdesKonto }),
  },
  {
    name: 'Plattform: Welt loeschen geht nie',
    erwartet: false,
    attrappen: wikiAttrappe(geschlossenesWiki),
    req: anfrage({ methode: 'delete', weg: 'wiki_projekte/testwiki/welt/species', auth: janniksKonto }),
  },
  {
    name: 'Plattform: Wiki anlegen als eigener Besitzer',
    erwartet: true,
    req: anfrage({
      methode: 'create', weg: 'wiki_projekte/neuwiki', auth: janniksKonto,
      daten: {
        name: 'Neu', beschreibung: '', oeffentlich: false, regelwerke: [],
        mitgliederIds: ['jannik-uid'], rollen: { 'jannik-uid': 'besitzer' },
        erstelltAm: jetzt, erstelltVon: 'jannik-uid',
      },
      zeit: jetzt,
    }),
  },
  {
    name: 'Plattform: Wiki anlegen und gleich Fremde eintragen — NEIN',
    erwartet: false,
    req: anfrage({
      methode: 'create', weg: 'wiki_projekte/neuwiki', auth: janniksKonto,
      daten: {
        name: 'Neu', beschreibung: '', oeffentlich: false, regelwerke: [],
        mitgliederIds: ['jannik-uid', 'fremd-uid'],
        rollen: { 'jannik-uid': 'besitzer', 'fremd-uid': 'schreiber' },
        erstelltAm: jetzt, erstelltVon: 'jannik-uid',
      },
      zeit: jetzt,
    }),
  },
  {
    name: 'Plattform: Wiki auf fremden Namen anlegen — NEIN',
    erwartet: false,
    req: anfrage({
      methode: 'create', weg: 'wiki_projekte/neuwiki', auth: janniksKonto,
      daten: {
        name: 'Neu', beschreibung: '', oeffentlich: false, regelwerke: [],
        mitgliederIds: ['fremd-uid'], rollen: { 'fremd-uid': 'besitzer' },
        erstelltAm: jetzt, erstelltVon: 'jannik-uid',
      },
      zeit: jetzt,
    }),
  },
  {
    name: 'Plattform: Liste und Rollen duerfen nicht auseinanderlaufen',
    erwartet: false,
    req: anfrage({
      methode: 'create', weg: 'wiki_projekte/neuwiki', auth: janniksKonto,
      daten: {
        name: 'Neu', beschreibung: '', oeffentlich: false, regelwerke: [],
        mitgliederIds: ['jannik-uid'],
        rollen: { 'jannik-uid': 'besitzer', 'fremd-uid': 'schreiber' },
        erstelltAm: jetzt, erstelltVon: 'jannik-uid',
      },
      zeit: jetzt,
    }),
  },
);

const antwort = await fetch(
  'https://firebaserules.googleapis.com/v1/projects/' + PROJEKT + ':test',
  {
    method: 'POST',
    headers: {
      authorization: 'Bearer ' + token,
      'content-type': 'application/json',
      'x-goog-user-project': PROJEKT,
    },
    body: JSON.stringify({
      source: { files: [{ name: 'firestore.rules', content: REGELN }] },
      testSuite: { testCases: faelle.map((f) => ({
        expectation: f.erwartet ? 'ALLOW' : 'DENY',
        request: f.req,
        functionMocks: f.attrappen || [],
      })) },
    }),
  },
);

const ergebnis = await antwort.json();
if (ergebnis.error) {
  console.error('Simulator meldet: ' + ergebnis.error.message);
  process.exit(1);
}

const ergebnisse = ergebnis.testResults || [];
let bestanden = 0;
console.log('Regeltest gegen den Firebase-Simulator');
console.log('='.repeat(58));
ergebnisse.forEach((r, i) => {
  const gut = r.state === 'SUCCESS';
  if (gut) bestanden += 1;
  const erwartung = faelle[i].erwartet ? 'erlaubt' : 'abgewiesen';
  console.log((gut ? '  ok   ' : '  FEHL ') + faelle[i].name.padEnd(52) + '(' + erwartung + ')');
  if (!gut && r.debugMessages) console.log('        ' + r.debugMessages.join(' | ').slice(0, 200));
});
console.log('='.repeat(58));
console.log(bestanden + ' von ' + ergebnisse.length + ' Faellen wie erwartet.');
if (bestanden !== ergebnisse.length) process.exitCode = 1;
