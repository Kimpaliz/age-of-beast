/**
 * [Aufgabe: Werkstatt]
 * Übernimmt das Regelwiki der Daggerheart-Werkstatt in das Wiki.
 *
 * Erster Schritt der vollständigen Übernahme: Das Regelwiki ist reine
 * Datenstruktur — Artikel mit Einleitung, Punkten und Stichworten, dazu ein
 * Glossar. Es lässt sich deshalb ohne Verlust übersetzen und braucht weder
 * Firebase noch eine Anmeldung.
 *
 * Die Quelle ist TypeScript. Übersetzt wird nicht: Die Datei enthält
 * ausschließlich Objektliterale, deren Typangaben sich entfernen lassen.
 * Danach wird sie als gewöhnliches JavaScript ausgewertet. Das ist
 * unempfindlicher als ein eigener Parser und braucht keinen Übersetzer.
 *
 * Aufruf:
 *   node werkzeuge/regeln-uebernehmen.mjs [pfad/zu/wikiContent.ts]
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = dirname(fileURLToPath(import.meta.url));
const WURZEL = join(HIER, '..');
const ZIEL = join(WURZEL, 'daten', 'quelle.json');

const QUELLE =
  process.argv[2] ||
  'C:/Users/Jannik/Documents/Codex/2026-07-26/ka/work/daggerheart-werkstatt/src/features/wiki/wikiContent.ts';

/* ------------------------------------------------------------------ *
 * Die TypeScript-Datei auswerten
 * ------------------------------------------------------------------ */

function datenLesen(pfad) {
  let quelle = readFileSync(pfad, 'utf8');

  // Typdeklarationen entfernen. Sie stehen jeweils als eigener Block und
  // enden vor dem naechsten `export`.
  quelle = quelle.replace(/export type [\s\S]*?(?=\nexport )/g, '');

  // `export const NAME: Typ = ` wird zu `const NAME = `. Die Typangabe kann
  // ueber mehrere Zeilen gehen und geschweifte Klammern enthalten, deshalb
  // wird bis zum letzten `=` vor dem Wert gesucht.
  quelle = quelle.replace(
    /export const ([A-Z_0-9]+)\s*:[\s\S]*?=\s*(?=[[{'"`])/g,
    'const $1 = ',
  );
  quelle = quelle.replace(/export const ([A-Z_0-9]+)\s*=/g, 'const $1 =');

  // Uebriggebliebene `as const` und Typzusicherungen
  quelle = quelle.replace(/\s+as\s+const/g, '');

  const namen = [...quelle.matchAll(/^const ([A-Z_0-9]+)\s*=/gm)].map((m) => m[1]);
  const rueckgabe = 'return {' + namen.join(', ') + '};';

  // eslint-disable-next-line no-new-func
  return new Function(quelle + '\n' + rueckgabe)();
}

/* ------------------------------------------------------------------ *
 * Bausteine für das Wiki-Format
 * ------------------------------------------------------------------ */

const BILD_VORGABE = {
  color: 'gold',
  fit: 'contain',
  frame: 'simple',
  positionX: 50,
  positionY: 50,
  zoom: 100,
};

const sicher = (text) =>
  String(text ?? '').split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;');

function alsHtml(text) {
  return String(text ?? '')
    .split(/\n{2,}/)
    .map((a) => a.trim())
    .filter(Boolean)
    .map((a) => '<p>' + sicher(a).split('\n').join('<br>') + '</p>')
    .join('');
}

function panel(id, titel, text) {
  const roh = String(text ?? '').trim();
  if (!roh) return null;
  return {
    id,
    image: '',
    imageSettings: { ...BILD_VORGABE },
    kind: 'text',
    text: roh,
    textFields: [{ html: alsHtml(roh), id: 'text-' + id, label: 'Text', text: roh }],
    textLayout: 'single',
    title: titel,
  };
}

function element({ id, name, beschreibung, panels, zeilen, unterart }) {
  const echte = panels.filter(Boolean);
  const attributeRows = [];
  const fields = {};

  if (unterart) {
    attributeRows.push({ id: 'attribute-' + id + '-bereich', key: 'regelBereich', label: 'Bereich' });
    fields.regelBereich = unterart;
  }
  for (const [schluessel, beschriftung, wert] of zeilen || []) {
    if (!String(wert ?? '').trim()) continue;
    attributeRows.push({ id: 'attribute-' + id + '-' + schluessel, key: schluessel, label: beschriftung });
    fields[schluessel] = String(wert).trim();
  }

  const jetzt = new Date().toISOString();
  return {
    attributeRows,
    createdAt: jetzt,
    customPanels: echte,
    description: String(beschreibung ?? '').trim(),
    descriptionPanelIds: echte.map((p) => p.id),
    fields,
    id,
    image: '',
    imageSettings: { ...BILD_VORGABE },
    module: 'regeln',
    name,
    panelHeights: {},
    panelOrder: ['core-connections', 'references', ...echte.map((p) => p.id)],
    panelWidths: {},
    richText: {},
    updatedAt: jetzt,
  };
}

/* ------------------------------------------------------------------ *
 * Umwandeln
 * ------------------------------------------------------------------ */

const daten = datenLesen(QUELLE);
const bereiche = new Map((daten.WIKI_AREAS || []).map((b) => [b.id, b.label]));

const eintraege = {};

for (const artikel of daten.WIKI_RULES || []) {
  const id = 'regel-' + artikel.id;

  // Jeder Regelpunkt wird ein eigener Abschnitt. Die Beschriftung des
  // Punktes ist die Ueberschrift - so bleibt der Aufbau der Werkstatt
  // erhalten und jeder Punkt ist einzeln bearbeitbar.
  const panels = (artikel.points || []).map((punkt, n) =>
    panel('panel-' + id + '-' + (n + 1), punkt.label || 'Regel', punkt.text),
  );

  if (artikel.note) {
    panels.push(panel('panel-' + id + '-hinweis', 'Hinweis', artikel.note));
  }

  eintraege[id] = element({
    id,
    name: artikel.title,
    beschreibung: artikel.intro,
    unterart: bereiche.get(artikel.area) || artikel.area,
    zeilen: [['regelStichworte', 'Stichworte', (artikel.keywords || []).join(', ')]],
    panels,
  });
}

/* --- Das Glossar wird ein einziger Eintrag mit vielen Abschnitten --- */

const glossar = daten.WIKI_GLOSSARY || [];
if (glossar.length) {
  eintraege['regel-glossar'] = element({
    id: 'regel-glossar',
    name: 'Glossar',
    beschreibung:
      'Die festen deutschen Begriffe des Regelwerks, alphabetisch. ' +
      'Sie werden im übrigen Wiki automatisch verlinkt.',
    unterart: 'Nachschlagen',
    zeilen: [['regelBegriffe', 'Begriffe', String(glossar.length)]],
    panels: glossar.map((g, n) =>
      panel('panel-regel-glossar-' + (n + 1), g.term, g.definition),
    ),
  });
}

/* --- Sicherheitsnetz ---------------------------------------------- */

const alsText = JSON.stringify(eintraege);
const mails = alsText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
if (mails.length) {
  console.error('Abbruch: E-Mail-Adressen im Ergebnis: ' + [...new Set(mails)].join(', '));
  process.exit(1);
}

/* --- Einhängen ----------------------------------------------------- */

const quelle = JSON.parse(readFileSync(ZIEL, 'utf8'));
quelle.elements = quelle.elements || {};
quelle.elements.regeln = eintraege;
quelle.updatedAt = new Date().toISOString();
writeFileSync(ZIEL, JSON.stringify(quelle, null, 2) + '\n', 'utf8');

const abschnitte = Object.values(eintraege).reduce((s, e) => s + e.customPanels.length, 0);
console.log('Regelwiki übernommen');
console.log('--------------------');
console.log('Regelartikel:      ' + (daten.WIKI_RULES || []).length);
console.log('Glossarbegriffe:   ' + glossar.length);
console.log('Einträge gesamt:   ' + Object.keys(eintraege).length);
console.log('Abschnitte gesamt: ' + abschnitte);
console.log('');
for (const [id, label] of bereiche) {
  const n = (daten.WIKI_RULES || []).filter((a) => a.area === id).length;
  if (n) console.log('   ' + label.padEnd(16) + n);
}
console.log('');
console.log('Nächster Schritt:  node werkzeuge/welt-aufbereiten.mjs');
