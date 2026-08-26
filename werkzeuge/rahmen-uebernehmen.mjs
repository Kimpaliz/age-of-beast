/**
 * Übernimmt die Kampagnenrahmen der Werkstatt als eigene Quelle.
 *
 * Wichtig ist der Unterschied zur ersten Übernahme (Fassung 2.2.0): Damals
 * wurde der Rahmen einmalig in fertige Wiki-Abschnitte umgewandelt. Zum
 * Lesen genügte das, zum Bearbeiten nicht — die Struktur war verloren.
 *
 * Jetzt liegt der Rahmen als **Rohform** unter `rahmen` in
 * `daten/quelle.json`, genau so, wie die Werkstatt ihn führt. Der
 * Wiki-Eintrag wird daraus bei jedem Aufbereiten neu erzeugt. Damit gibt es
 * eine Wahrheit statt zwei, und der Assistent kann die Felder direkt ändern.
 *
 * Aufruf:
 *   node werkzeuge/rahmen-uebernehmen.mjs <abzug-campaigns.json>
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = dirname(fileURLToPath(import.meta.url));
const WURZEL = join(HIER, '..');
const ZIEL = join(WURZEL, 'daten', 'quelle.json');

const abzugPfad = process.argv[2];
if (!abzugPfad) {
  console.error('Bitte den Abzug der Kampagnen angeben:');
  console.error('  node werkzeuge/rahmen-uebernehmen.mjs <abzug-campaigns.json>');
  process.exit(1);
}

const abzug = JSON.parse(readFileSync(abzugPfad, 'utf8'));

/** Aus einem Titel wird eine Kennung: „Prototyp" wird `prototyp`. */
function alsKennung(titel) {
  return String(titel || 'rahmen')
    .toLowerCase()
    .split('ä').join('ae').split('ö').join('oe').split('ü').join('ue').split('ß').join('ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'rahmen';
}

const rahmen = {};

for (const roh of Object.values(abzug || {})) {
  if (!roh || !roh.payload) continue;

  let inhalt;
  try {
    inhalt = JSON.parse(roh.payload);
  } catch {
    console.error('Ein Rahmen liess sich nicht lesen und wurde uebersprungen.');
    continue;
  }

  const id = 'rahmen-' + alsKennung(inhalt.title);

  // Bewusst nur der Inhalt. Die Huellenfelder der Werkstatt tragen
  // E-Mail-Adressen und Firebase-Kennungen; sie gehoeren nicht in ein
  // oeffentliches Repository und werden auch nicht gebraucht.
  rahmen[id] = {
    id,
    schritt: Number(roh.currentStep) || 1,
    status: String(roh.status || 'draft'),
    angelegtAm: roh.createdAt ? new Date(roh.createdAt).toISOString() : new Date().toISOString(),
    geaendertAm: roh.updatedAt ? new Date(roh.updatedAt).toISOString() : new Date().toISOString(),
    inhalt,
  };
}

/* --- Sicherheitsnetz ---------------------------------------------- */

const alsText = JSON.stringify(rahmen);
const mails = alsText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
if (mails.length) {
  console.error('Abbruch: E-Mail-Adressen im Ergebnis: ' + [...new Set(mails)].join(', '));
  process.exit(1);
}

/* --- Einhängen ----------------------------------------------------- */

const quelle = JSON.parse(readFileSync(ZIEL, 'utf8'));
quelle.rahmen = rahmen;

// Die alten, einmalig umgewandelten Kampagnen-Eintraege entfallen: Sie
// werden ab jetzt aus `rahmen` erzeugt. Blieben sie stehen, gaebe es den
// Eintrag doppelt.
if (quelle.elements && quelle.elements.werkstatt) {
  for (const id of Object.keys(quelle.elements.werkstatt)) {
    if (id.startsWith('werkstatt-kampagne-')) delete quelle.elements.werkstatt[id];
  }
}

quelle.updatedAt = new Date().toISOString();
writeFileSync(ZIEL, JSON.stringify(quelle, null, 2) + '\n', 'utf8');

console.log('Kampagnenrahmen als Quelle übernommen');
console.log('-------------------------------------');
for (const [id, r] of Object.entries(rahmen)) {
  const felder = JSON.stringify(r.inhalt).length;
  console.log('  ' + id.padEnd(22) + (r.inhalt.title || 'ohne Titel') + '   Schritt ' + r.schritt + ', ' + felder + ' Zeichen');
}
console.log('');
console.log('Der Wiki-Eintrag wird ab jetzt daraus erzeugt, nicht mehr fest abgelegt.');
console.log('Nächster Schritt:  node werkzeuge/welt-aufbereiten.mjs');
