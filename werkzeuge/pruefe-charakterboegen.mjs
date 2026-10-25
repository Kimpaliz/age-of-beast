/* [Aufgabe: Prüfwesen]
   Regression checks for entry types, both real sheets, and lossless blank print.
   --beweis-rot intentionally prints filled values in blank mode to prove detection. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isCharacterSheet, SHEET_TYPE, emptySheetValues, sheetForPrint, preserveUnknownSheetValues } from './charakterbogen-daten.mjs';
import { valuesFromSheetForm, sheetFormFields, readSheetPath } from './charakterbogen-formular.mjs';
import { eintragEntwurf } from './eintrag-anlegen.mjs';
import { umwandeln } from './welt-umwandeln.mjs';
import { bogenAusDaten } from './werte-rechnen.mjs';
import { renderPrintSheet } from '../karte/bogen-druck.mjs';

const root = new URL('../', import.meta.url);
const read = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const source = read('daten/quelle.json');
const snapshot = JSON.stringify(source);
const world = umwandeln(source).welt;
const catalogue = read('daten/daggerheart-gegenstaende.json');
const items = Array.isArray(catalogue) ? catalogue : catalogue.gegenstaende;
const find = (name) => items.find((item) => item.name === name) || null;
let checks = 0;
function check(condition, message) { checks += 1; assert.ok(condition, message); }
function throws(callback, message) { checks += 1; assert.throws(callback, message); }
function same(a, b, message) { checks += 1; assert.deepEqual(a, b, message); }
const proveRed = process.argv.includes('--beweis-rot');

for (const [id, evasion, major, severe] of [
  ['character-aob-xeno-sc', 13, 6, 12], ['character-aob-lukas-sc', 12, 7, 14],
]) {
  const raw = source.elements.characters[id];
  const entry = world.eintraege.find((item) => item.id === id);
  check(raw.fields.entryType === SHEET_TYPE, id + ': explicit entry type');
  check(isCharacterSheet(raw) && isCharacterSheet(entry), id + ': raw and reader recognize sheets');
  check(entry.entryType === SHEET_TYPE, id + ': conversion preserves type');
  const result = bogenAusDaten(entry.spielwerte, find);
  same([result.werte.evasion.endwert, result.werte.schwelleSchwer.endwert, result.werte.schwelleErnst.endwert],
    [evasion, major, severe], id + ': correct calculated defenses');
  check(entry.spielwerte.proficiency === 1, id + ': confirmed level-one proficiency');
  const full = renderPrintSheet(entry, result);
  const blank = renderPrintSheet(entry, result, { blank: !proveRed });
  check(full.includes(entry.name) && full.includes(entry.spielwerte.ruestung.name), id + ': filled print contains stored values');
  check(blank.includes(entry.name) && blank.includes(entry.spielwerte.abstammung), id + ': blank print keeps identity');
  check(!blank.includes(entry.spielwerte.ruestung.name), id + ': blank print omits equipment');
  check(!blank.includes(entry.spielwerte.erfahrungen[0].name), id + ': blank print omits experience values');
  check(!blank.includes(entry.spielwerte.klassenfertigkeit), id + ': blank print omits ability contents');
  check(!/class="filled"/.test(full), id + ': no invented current resource marks');
  check((blank.match(/class="sheet-print-page"/g) || []).length === 2, id + ': two A4 page sections');
  check(blank.includes('print-boxes') && blank.includes('print-experience'), id + ': writable resource and experience fields remain');
  check(blank.includes('Hauptwaffe') && blank.includes('Nebenwaffe'), id + ': blank print retains distinct weapon slots');
  const emptyCopy = sheetForPrint(entry, true);
  same(emptyCopy.values.attribute, emptySheetValues().attribute, id + ': traits genuinely removed from print data');
  const fields = Object.fromEntries(sheetFormFields(entry.spielwerte).map(([path, , type]) => {
    const v = readSheetPath(entry.spielwerte, path);
    return [path, type === 'checkbox' ? Boolean(v) : type === 'lines' ? (v || []).join('\n') : String(v ?? '')];
  }));
  same(valuesFromSheetForm(entry.spielwerte, fields), entry.spielwerte, id + ': open and save without change is lossless');
}

const brix = world.eintraege.find((entry) => entry.id === 'character-aob-xeno-sc');
const brixResult = bogenAusDaten(brix.spielwerte, find);
check(renderPrintSheet(brix, brixResult).includes('(vorläufig)'), 'Provisional experiences remain clearly marked');
const dagger = brixResult.ausruestung.find((item) => item.name === 'Dolch');
check(dagger.score === null, 'Weapons do not invent an armour score of zero');
same([dagger.attribut, dagger.reichweite, dagger.schaden], ['Finesse', 'Melee', 'd8+1 phy'], 'Dagger uses verified catalogue data');
check(!brixResult.ausruestung.find((item) => item.name === 'Kurzschwert').schaden, 'Unknown shortsword is not assigned invented damage');
const changed = valuesFromSheetForm(brix.spielwerte, { 'attribute.agility': '0', hp: '7' });
same([changed.attribute.agility, changed.hp, changed.attribute.finesse], [0, 7, 2], 'Edits preserve zero and untouched traits');
check(valuesFromSheetForm(brix.spielwerte, { hp: '' }).hp === null, 'Clearing a value creates unknown, not zero');
const custom = valuesFromSheetForm(brix.spielwerte, {
  'waffen.0.schaden': 'd10+3 phy', 'waffen.0.reichweite': 'Very Close', 'ruestung.score': '5',
  'ruestung.basisSchwer': '7', 'ruestung.merkmal': '+2 Ausweichen',
});
const customResult = preserveUnknownSheetValues(bogenAusDaten(custom, find), custom);
same([customResult.ausruestung[0].schaden, customResult.ausruestung[0].reichweite],
  ['d10+3 phy', 'Very Close'], 'Explicit weapon edits outrank rule-card defaults');
same([customResult.werte.ruestungswert.endwert, customResult.werte.schwelleSchwer.endwert],
  [5, 8], 'Explicit armor edits are actually calculated');
same(customResult.ausruestung.find((item) => item.rolle === 'ruestung').wirkung,
  '+2 Ausweichen', 'Editing an armor feature changes its calculated effect');
same(customResult.ausruestung.find((item) => item.rolle === 'ruestung').abweichungen,
  [], 'Intentional overrides do not produce legacy discrepancy warnings');
check(renderPrintSheet({ ...brix, spielwerte: custom }, customResult).includes('d10+3 phy'), 'Print uses the edited weapon damage');
const partialArmor = { ...brix.spielwerte, ruestung: { name: 'Gambeson', regelname: 'Gambeson Armor' } };
const partialResult = preserveUnknownSheetValues(bogenAusDaten(partialArmor, find), partialArmor);
same([partialResult.werte.ruestungswert.endwert, partialResult.werte.schwelleSchwer.endwert, partialResult.werte.schwelleErnst.endwert],
  [3, 6, 12], 'Missing manual armor stats can resolve from the rule card');
check(renderPrintSheet({ ...brix, spielwerte: partialArmor }, partialResult).includes('5 / 11'), 'Rule-card armor values are also printed');
const cleared = valuesFromSheetForm(custom, { 'ruestung.basisSchwer': '', 'waffen.0.schaden': '' });
const clearedResult = preserveUnknownSheetValues(bogenAusDaten(cleared, find), cleared);
same([clearedResult.werte.schwelleSchwer.endwert, clearedResult.werte.schwelleErnst.endwert, clearedResult.ausruestung[0].schaden],
  [null, 12, null], 'Cleared manual values stay unknown without hiding unrelated known values');
const unequipped = preserveUnknownSheetValues(bogenAusDaten(partialArmor, find, { 'ruestung:Gambeson': false }), partialArmor);
same([unequipped.werte.ruestungswert.endwert, unequipped.werte.schwelleSchwer.endwert], [0, 1], 'Unequipping known armor keeps actual zero and level threshold');
const unknownArmor = { ...brix.spielwerte, ruestung: { name: 'Unbekannte Rüstung' } };
const unknownResult = preserveUnknownSheetValues(bogenAusDaten(unknownArmor, find), unknownArmor);
same([unknownResult.werte.ruestungswert.endwert, unknownResult.werte.schwelleSchwer.endwert], [null, null], 'Unknown armor does not invent score or thresholds');
throws(() => valuesFromSheetForm(brix.spielwerte, { hp: 'abc' }), /Trefferpunkte/);
throws(() => valuesFromSheetForm(brix.spielwerte, { 'hoffnung.start': '9' }), /Hoffnung/);
throws(() => valuesFromSheetForm(brix.spielwerte, { 'ruestung.basisErnst': '1' }), /Schwelle/);
const created = eintragEntwurf({ name: 'Neue Heldin', kategorie: 'characters', entryType: SHEET_TYPE });
check(isCharacterSheet(created), 'Creation supports a character-sheet entry');
check(created.fields.spielwerte.evasion === null, 'New sheets do not invent character stats');
check(!isCharacterSheet(eintragEntwurf({ name: 'Notiz', kategorie: 'lore' })), 'Ordinary entries remain ordinary');
check(!isCharacterSheet(eintragEntwurf({ name: 'Schwert', kategorie: 'items', entryType: SHEET_TYPE })), 'Only character entries use sheet type');
check(isCharacterSheet({ spielwerte: { system: 'Daggerheart' } }), 'Older stored sheets need no destructive migration');
const malicious = renderPrintSheet({ name: '<img src=x onerror=alert(1)>', spielwerte: emptySheetValues() }, {});
check(!malicious.includes('<img'), 'User-entered text is escaped');
same(JSON.stringify(source), snapshot, 'Printing, form edits, and conversion leave original source unchanged');
console.log(checks + ' Charakterbogen-Prüfungen bestanden.');
