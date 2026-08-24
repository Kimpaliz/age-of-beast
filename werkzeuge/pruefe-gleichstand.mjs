/**
 * Prueft, dass die abgelegte Kopie unter `daten/` wirklich aus den Rohdaten
 * im Repository stammt.
 *
 * Hintergrund: Angemeldet zeigt das Wiki den Live-Stand, den es im Browser
 * mit derselben Funktion `umwandeln()` erzeugt. Weichen abgelegte Kopie und
 * Rohdaten voneinander ab, saehe die Leseansicht anders aus als die
 * Bearbeitungsansicht. Genau das faengt diese Pruefung ab.
 *
 * Aufruf:
 *   node werkzeuge/pruefe-gleichstand.mjs
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { umwandeln } from './welt-umwandeln.mjs';

const HIER = dirname(fileURLToPath(import.meta.url));
const WURZEL = join(HIER, '..');

const roh = JSON.parse(readFileSync(join(HIER, 'rohdaten-weltenschmiede.json'), 'utf8'));
const abgelegt = JSON.parse(readFileSync(join(WURZEL, 'daten', 'welt.json'), 'utf8'));
const { welt } = umwandeln(roh);

// Der Zeitstempel der Erzeugung aendert sich bei jedem Lauf und zaehlt nicht.
delete welt.erzeugtAm;
delete abgelegt.erzeugtAm;

const a = JSON.stringify(abgelegt);
const b = JSON.stringify(welt);

if (a === b) {
  console.log('Gleichstand in Ordnung: daten/welt.json passt zu den Rohdaten.');
  console.log('Eintraege: ' + welt.eintraege.length);
  process.exit(0);
}

console.error('Gleichstand verletzt: daten/welt.json passt nicht zu den Rohdaten.');
console.error('Laenge abgelegt/erzeugt: ' + a.length + ' / ' + b.length);
for (let i = 0; i < Math.min(a.length, b.length); i += 1) {
  if (a[i] !== b[i]) {
    console.error('Erste Abweichung bei Zeichen ' + i + ':');
    console.error('  abgelegt: ' + a.slice(Math.max(0, i - 60), i + 60));
    console.error('  erzeugt : ' + b.slice(Math.max(0, i - 60), i + 60));
    break;
  }
}
console.error('');
console.error('Behebung: node werkzeuge/welt-aufbereiten.mjs   und das Ergebnis mitliefern.');
process.exit(1);
