/* [Aufgabe: Charakterbogen]
   Field contract and validation for the character-sheet editor.
   Empty inputs stay unknown; copying preserves data not exposed by this form. */
import { SHEET_TRAITS, emptySheetValues } from './charakterbogen-daten.mjs';

export const SHEET_FIELDS = [
  ['player', 'Spieler', 'text'], ['fuerwort', 'Pronomen', 'text'],
  ['abstammung', 'Abstammung', 'text'], ['gemeinschaft', 'Gemeinschaft', 'text'],
  ['klasse', 'Klasse', 'text'], ['unterklasse', 'Unterklasse', 'text'],
  ['stufe', 'Stufe', 'number', 1, 10], ['proficiency', 'Übung / Proficiency', 'number', 1, 10],
  ['evasion', 'Ausweichen mit Ausrüstung', 'number', 0, 99],
  ['hp', 'Trefferpunkte (Maximum)', 'number', 1, 30], ['stress', 'Stress (Maximum)', 'number', 1, 30],
  ['hoffnung.start', 'Hoffnung bei Erschaffung', 'number', 0, 6],
  ['hoffnung.max', 'Hoffnung (Maximum)', 'number', 1, 6],
  ...SHEET_TRAITS.map(([key, name]) => ['attribute.' + key, name, 'number', -5, 10]),
  ['ruestung.name', 'Rüstung', 'text'], ['ruestung.score', 'Grund-Rüstungswert', 'number', 0, 12],
  ['ruestung.basisSchwer', 'Schwere Grundschwelle', 'number', 0, 99],
  ['ruestung.basisErnst', 'Ernste Grundschwelle', 'number', 0, 99],
  ['ruestung.merkmal', 'Rüstungsmerkmal', 'text'],
  ['zauberattribut', 'Zauberattribut', 'text'], ['klassenfertigkeit', 'Klassenfertigkeit', 'text'],
  ['hoffnungsfertigkeit', 'Hoffnungsfertigkeit', 'text'], ['klassengegenstand', 'Klassengegenstand', 'text'],
  ['domaenen', 'Domänen', 'lines'], ['karten', 'Fähigkeitskarten', 'lines'],
  ['vorrat', 'Inventar', 'lines'], ['offen', 'Noch festzulegen', 'lines'],
];

export function readSheetPath(values, path) {
  return path.split('.').reduce((node, key) => node?.[key], values);
}

function setPath(values, path, value) {
  const keys = path.split('.');
  let node = values;
  keys.slice(0, -1).forEach((key, index) => {
    if (node[key] == null) node[key] = /^\d+$/.test(keys[index + 1]) ? [] : {};
    node = node[key];
  });
  node[keys.at(-1)] = value;
}

export function sheetFormFields(values) {
  const fields = [...SHEET_FIELDS];
  for (let i = 0; i < Math.max(2, values.waffen?.length || 0); i += 1) {
    for (const [key, label] of [['name', 'Name'], ['regelname', 'Regelkarte (Name)'],
      ['attribut', 'Angriffsattribut'], ['reichweite', 'Reichweite'], ['schaden', 'Schaden']]) {
      fields.push(['waffen.' + i + '.' + key, (i === 0 ? 'Hauptwaffe: ' : i === 1 ? 'Nebenwaffe: ' : 'Waffe: ') + label, 'text']);
    }
  }
  for (let i = 0; i < Math.max(2, values.erfahrungen?.length || 0); i += 1) {
    fields.push(['erfahrungen.' + i + '.name', 'Erfahrung ' + (i + 1), 'text'],
      ['erfahrungen.' + i + '.bonus', 'Bonus', 'number', -5, 10],
      ['erfahrungen.' + i + '.vorlaeufig', 'Noch nicht bestätigt', 'checkbox']);
  }
  return fields;
}

export function valuesFromSheetForm(original, input) {
  original ||= {};
  const result = structuredClone(original || emptySheetValues());
  for (const [path, label, type, min, max] of sheetFormFields(result)) {
    if (!Object.hasOwn(input, path)) continue;
    const before = readSheetPath(original, path);
    const raw = input[path];
    let value;
    if (type === 'checkbox') value = raw === true || raw === 'on';
    else if (type === 'lines') value = String(raw).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    else if (type === 'number') {
      value = String(raw).trim() === '' ? null : Number(raw);
      if (value !== null && (!Number.isInteger(value) || value < min || value > max)) {
        throw new Error(label + ': Bitte eine ganze Zahl zwischen ' + min + ' und ' + max + ' eingeben.');
      }
    } else value = String(raw).trim();
    if (JSON.stringify(value) === JSON.stringify(before)) continue;
    if (before == null && (value === '' || value === null || value === false
      || (Array.isArray(value) && !value.length))) continue;
    setPath(result, path, value);
    // Explicit edits outrank catalogue defaults without reinterpreting legacy copies.
    const itemField = /^(ruestung|waffen\.\d+)\.(score|basisSchwer|basisErnst|merkmal|attribut|reichweite|schaden)$/.exec(path);
    if (itemField) setPath(result, itemField[1] + '.overrides.' + itemField[2], value);
  }
  // A renamed item must not silently keep the old item's rule statistics.
  if (result.ruestung?.name !== original.ruestung?.name) delete result.ruestung.regelname;
  for (const [key, translated] of [['klasse', 'klasseDe'], ['unterklasse', 'unterklasseDe']]) {
    if (result[key] !== original[key]) delete result[translated];
  }
  const armor = result.ruestung || {};
  if (Number.isFinite(armor.basisSchwer) && Number.isFinite(armor.basisErnst)
    && armor.basisErnst < armor.basisSchwer) throw new Error('Die ernste Schwelle darf nicht kleiner als die schwere sein.');
  if (result.hoffnung?.start > result.hoffnung?.max) throw new Error('Die Start-Hoffnung darf das Maximum nicht überschreiten.');
  return result;
}
