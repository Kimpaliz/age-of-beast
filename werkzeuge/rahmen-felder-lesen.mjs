/**
 * Liest die Feldbeschreibungen des Kampagnenrahmen-Assistenten aus der
 * Daggerheart-Werkstatt und legt sie als reine Daten ab.
 *
 * Der eigentliche Wert des Assistenten sind nicht die Eingabefelder,
 * sondern die Fragen: „Was tut die Gruppe regelmäßig?" statt „Aktivität".
 * Dazu die Hilfetexte und die Beispiele. Genau das wird hier übernommen.
 *
 * Die Quelle ist JSX. Statt sie zu übersetzen, werden die `FieldGroup`-
 * Blöcke ausgelesen: Beschriftung, Hilfetext, Pflichtfeld, Datenpfad,
 * Beispiel, Feldart und Höchstlänge. Das ist zuverlässig, weil der Aufbau
 * durchgehend gleich ist — und es bleibt lesbar, wenn die Werkstatt sich
 * ändert.
 *
 * Ergebnis: `daten/rahmen-felder.json`
 *
 * Aufruf:
 *   node werkzeuge/rahmen-felder-lesen.mjs [pfad/zu/FrameStepFields.tsx]
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = dirname(fileURLToPath(import.meta.url));
const WURZEL = join(HIER, '..');
const WERKSTATT =
  'C:/Users/Jannik/Documents/Codex/2026-07-26/ka/work/daggerheart-werkstatt/src';

const FELDER_QUELLE = process.argv[2] || WERKSTATT + '/features/frame/FrameStepFields.tsx';
const SCHRITTE_QUELLE = WERKSTATT + '/data/daggerheart.ts';

/* ------------------------------------------------------------------ *
 * Schritte
 * ------------------------------------------------------------------ */

function schritteLesen() {
  const quelle = readFileSync(SCHRITTE_QUELLE, 'utf8');
  const block = quelle.slice(
    quelle.indexOf('export const FRAME_STEPS'),
    quelle.indexOf('export const CHARACTER_STEPS'),
  );
  return [...block.matchAll(/\{\s*id:\s*(\d+),\s*label:\s*'([^']+)',\s*short:\s*'([^']+)'/g)].map(
    (m) => ({ nummer: Number(m[1]), name: m[2], kurz: m[3] }),
  );
}

/* ------------------------------------------------------------------ *
 * Felder
 * ------------------------------------------------------------------ */

/** Aus `setCore('concept', …)` und `frame.core.concept` wird `core/concept`. */
function pfadAus(block) {
  const wert = block.match(/value=\{frame\.([A-Za-z0-9_.[\]]+)\}/);
  if (!wert) return null;
  return wert[1].split('.').join('/');
}

function feldartAus(block) {
  if (/<TextArea\b/.test(block)) return 'absatz';
  if (/<TextField\b/.test(block)) return 'zeile';
  return null;
}

function felderLesen() {
  const quelle = readFileSync(FELDER_QUELLE, 'utf8');

  // Jeder Block beginnt mit <FieldGroup und endet mit </FieldGroup>.
  const bloecke = [...quelle.matchAll(/<FieldGroup([\s\S]*?)<\/FieldGroup>/g)].map((m) => m[0]);

  const felder = [];
  for (const block of bloecke) {
    const beschriftung = block.match(/label="([^"]+)"/);
    if (!beschriftung) continue;

    const pfad = pfadAus(block);
    const art = feldartAus(block);
    // Blöcke ohne einfachen Pfad sind Listen (Besonderheiten, Fraktionen).
    // Sie werden gesondert behandelt und hier übersprungen.
    if (!pfad || !art) continue;

    const hilfe = block.match(/help="([^"]+)"/);
    const beispiel = block.match(/placeholder="([^"]+)"/);
    const laenge = block.match(/maxLength=\{(\d+)\}/);

    felder.push({
      pfad,
      beschriftung: beschriftung[1],
      hilfe: hilfe ? hilfe[1] : '',
      beispiel: beispiel ? beispiel[1] : '',
      art,
      pflicht: /\brequired\b/.test(block),
      hoechstlaenge: laenge ? Number(laenge[1]) : null,
    });
  }
  return felder;
}

/* ------------------------------------------------------------------ *
 * Welcher Schritt gehört zu welchem Feld?
 * ------------------------------------------------------------------ */

/**
 * Die Zuordnung steht nicht als Angabe im JSX, sondern ergibt sich aus dem
 * Aufbau der Datei: je Schritt eine Funktion. Sie wird deshalb über den
 * Datenpfad hergestellt — das ist stabiler als über Zeilennummern.
 */
const SCHRITT_JE_BEREICH = {
  title: 1, tagline: 1, pitch: 1, core: 1,
  mood: 2,
  overview: 3,
  engine: 4,
  distinctions: 5,
  factions: 6,
  characterHooks: 7,
  opening: 8, optionalMechanic: 8,
  finalNotes: 9,
};

/* ------------------------------------------------------------------ *
 * Schreiben
 * ------------------------------------------------------------------ */

const schritte = schritteLesen();
const felder = felderLesen().map((f) => ({
  ...f,
  schritt: SCHRITT_JE_BEREICH[f.pfad.split('/')[0]] || 0,
}));

// Die beiden Listen aus Schritt 5 und 6 haben je Eintrag dieselben Felder.
// Sie stehen im JSX in einer Schleife und lassen sich deshalb nicht als
// einzelne Blöcke auslesen — sie werden hier fest beschrieben.
const listen = [
  {
    pfad: 'distinctions',
    schritt: 5,
    name: 'Besonderheiten der Welt',
    hilfe:
      'Drei Dinge, die diese Welt von anderen unterscheiden. Sie sollen im Alltag spürbar sein, nicht nur im Hintergrund stehen.',
    anzahl: 3,
    felder: [
      { schluessel: 'name', beschriftung: 'Name', art: 'zeile' },
      { schluessel: 'description', beschriftung: 'Was ist das?', art: 'absatz' },
      { schluessel: 'everydayImpact', beschriftung: 'Wie merkt man das im Alltag?', art: 'absatz' },
    ],
  },
  {
    pfad: 'factions',
    schritt: 6,
    name: 'Fraktionen',
    hilfe:
      'Gruppen, die etwas wollen und etwas können. Wichtig ist nicht, wie viele es sind, sondern dass sie einander im Weg stehen.',
    anzahl: 3,
    felder: [
      { schluessel: 'name', beschriftung: 'Name', art: 'zeile' },
      { schluessel: 'goal', beschriftung: 'Was will sie?', art: 'zeile' },
      { schluessel: 'leverage', beschriftung: 'Was kann sie?', art: 'zeile' },
      { schluessel: 'relationship', beschriftung: 'Verhältnis zur Gruppe', art: 'absatz' },
    ],
  },
];

const ergebnis = { schritte, felder, listen, gelesenAm: new Date().toISOString() };
writeFileSync(join(WURZEL, 'daten', 'rahmen-felder.json'), JSON.stringify(ergebnis, null, 2) + '\n', 'utf8');

console.log('Kampagnenrahmen – Felder gelesen');
console.log('--------------------------------');
console.log('Schritte:      ' + schritte.length);
console.log('Einzelfelder:  ' + felder.length);
console.log('Listen:        ' + listen.length);
console.log('');
for (const s of schritte) {
  const n = felder.filter((f) => f.schritt === s.nummer).length;
  const l = listen.filter((x) => x.schritt === s.nummer).length;
  console.log('  ' + String(s.nummer) + '. ' + s.name.padEnd(24) + n + ' Felder' + (l ? ', ' + l + ' Liste' : ''));
}
const ohne = felder.filter((f) => !f.schritt);
if (ohne.length) {
  console.log('');
  console.log('Ohne Schritt zugeordnet: ' + ohne.map((f) => f.pfad).join(', '));
}
console.log('');
console.log('Geschrieben: daten/rahmen-felder.json');
