/**
 * Erzeugt aus den Rohdaten der Weltenschmiede die Dateien unter `daten/`.
 *
 * Ergebnis:
 *   daten/welt.json  – die Daten als reines JSON (gut lesbar, gut vergleichbar)
 *   daten/welt.js    – dieselben Daten als JS-Datei, damit das Wiki auch ohne
 *                      Webserver funktioniert (Doppelklick auf index.html)
 *
 * Die eigentliche Umwandlung steht in `welt-umwandeln.mjs`. Sie ist bewusst
 * frei von Node-Bausteinen, damit das Wiki im Browser exakt dasselbe Ergebnis
 * erzeugt, wenn es angemeldet live aus der Weltenschmiede liest.
 *
 * Aufruf:
 *   node werkzeuge/welt-aufbereiten.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { umwandeln } from './welt-umwandeln.mjs';

const HIER = dirname(fileURLToPath(import.meta.url));
const WURZEL = join(HIER, '..');
const QUELLE = process.argv[2] || join(HIER, 'rohdaten-weltenschmiede.json');

const roh = JSON.parse(readFileSync(QUELLE, 'utf8'));
const { welt, bilanz, gepflegteBegriffe, ausgeschlossen } = umwandeln(roh);
const eintraege = welt.eintraege;
const woerterbuch = welt.woerterbuch;

/* ------------------------------------------------------------------ *
 * Schreiben
 * ------------------------------------------------------------------ */

mkdirSync(join(WURZEL, 'daten'), { recursive: true });
const alsJson = JSON.stringify(welt, null, 2);
writeFileSync(join(WURZEL, 'daten', 'welt.json'), alsJson + '\n', 'utf8');
writeFileSync(
  join(WURZEL, 'daten', 'welt.js'),
  '/* Automatisch erzeugt von werkzeuge/welt-aufbereiten.mjs. Nicht von Hand ändern. */\n' +
    'window.AGE_OF_BEAST_WELT = ' + alsJson + ';\n',
  'utf8',
);


/* ------------------------------------------------------------------ *
 * Bilanz
 * ------------------------------------------------------------------ */

console.log('Age-of-Beast-Wiki – Daten aufbereitet');
console.log('-------------------------------------');
console.log(`Stand der Daten:        ${welt.standDerDaten}`);
console.log(`Einträge:               ${eintraege.length}`);
for (const k of welt.kategorien) {
  const n = eintraege.filter((e) => e.kategorie === k.schluessel).length;
  console.log(`   ${k.name.padEnd(18)} ${n}`);
}
console.log(`Abschnitte aus Panels:  ${bilanz.panels}`);
console.log(`Ergänzte Zusatztexte:   ${bilanz.zusatztexte}   (Texte, die in keinem Panel standen)`);
console.log(`Als Dublette erkannt:   ${bilanz.uebersprungen}   (bereits in einem Panel enthalten)`);
console.log(`Anriss-Wiederholungen:  ${bilanz.anrissDubletten}   (Abschnitte, die nur den Anriss wiederholten)`);
console.log(`Quellenzeilen entfernt: ${bilanz.quellenzeilen}   (stehen stattdessen im Steckbrief)`);
console.log(`Attributzeilen:         ${bilanz.attribute}`);
console.log(`Feste Verbindungen:     ${bilanz.verbindungen}`);
console.log(
  `Begriffe für Verweise:  ${Object.keys(woerterbuch).length}` +
    `   (davon ${gepflegteBegriffe.size} in der Weltenschmiede gepflegt)`,
);
if (ausgeschlossen.length) {
  console.log(
    `Bewusst nicht verlinkt: ${ausgeschlossen.join(', ')}` +
      '   (mehrdeutig: gehört zu mehreren Einträgen)',
  );
}
console.log('');
console.log('Geschrieben: daten/welt.json und daten/welt.js');
