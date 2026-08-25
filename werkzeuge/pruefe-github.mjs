/**
 * Prueft den Weg, auf dem das Wiki im Browser nach GitHub speichert.
 *
 * Es wird **nichts** geschrieben und nichts abgefragt: Diese Pruefung
 * braucht kein Netz und keinen Schluessel. Sie sichert die zwei Dinge ab,
 * die beim Speichern still schiefgehen koennten.
 *
 *   1. **Umkodierung.** Der Browser muss die Dateien Base64-kodiert
 *      hochladen. Bei 280 KB und deutschen Umlauten ist das die Stelle,
 *      an der eine naive Umsetzung entweder Zeichen zerstoert oder am
 *      Aufrufstapel scheitert.
 *
 *   2. **Gleiche Dateien.** Der Browser legt bei jedem Speichern auch die
 *      abgeleiteten Dateien `daten/welt.json` und `daten/welt.js` in den
 *      Commit. Erzeugte er sie auch nur um ein Leerzeichen anders als das
 *      Skript auf der Festplatte, wuerde der Veroeffentlichungslauf
 *      danach zu Recht meckern – und zwar erst nach dem Speichern, also
 *      zum denkbar unguenstigsten Zeitpunkt.
 *
 * Zusaetzlich wird geprueft, dass `umwandeln()` wirklich vorhersagbar ist:
 * zweimal derselbe Rohstand muss zweimal dieselben Bytes ergeben.
 *
 * Aufruf:
 *   node werkzeuge/pruefe-github.mjs
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { weltDateien, QUELLE } from './welt-dateien.mjs';
import { alsBase64, ausBase64 } from './github-speicher.mjs';

const HIER = dirname(fileURLToPath(import.meta.url));
const WURZEL = join(HIER, '..');

const fehler = [];
const melde = (text) => fehler.push(text);

/* ------------------------------------------------------------------ *
 * 1. Umkodierung
 * ------------------------------------------------------------------ */

const KNIFFLIGE_TEXTE = [
  ['leer', ''],
  ['Umlaute', 'Größe, Fährte, Öl, Übermut, weiß'],
  ['französisch', 'Créatures étranges – naïve Idée'],
  ['Sonderzeichen', '« » „ " ‚ ‘ … – — · ✎ ◆ ⚑ ❖ ☗ ⚔'],
  ['Zeilenumbrüche', 'Erste\nZweite\r\nDritte\tmit Tabulator'],
  ['HTML', '<p>Ein <strong>Test</strong> &amp; noch einer</p>'],
];

for (const [name, text] of KNIFFLIGE_TEXTE) {
  const zurueck = ausBase64(alsBase64(text));
  if (zurueck !== text) melde(`Umkodierung verändert „${name}": ${JSON.stringify(zurueck)}`);
}

// Der Ernstfall: die echte Quelldatei in voller Länge.
const quelleText = readFileSync(join(WURZEL, QUELLE), 'utf8');
let grossOk = false;
try {
  const zurueck = ausBase64(alsBase64(quelleText));
  grossOk = zurueck === quelleText;
  if (!grossOk) melde('Die echte Quelldatei kommt nach dem Umkodieren verändert zurück.');
} catch (f) {
  melde('Die echte Quelldatei ließ sich nicht umkodieren: ' + f.message);
}

/* ------------------------------------------------------------------ *
 * 2. Gleiche Dateien wie auf der Festplatte
 * ------------------------------------------------------------------ */

const roh = JSON.parse(quelleText);
const { dateien } = weltDateien(roh);

const ERWARTET = [QUELLE, 'daten/welt.json', 'daten/welt.js'];
for (const pfad of ERWARTET) {
  if (!(pfad in dateien)) { melde('Im Commit fehlte die Datei ' + pfad); continue; }
  const aufPlatte = readFileSync(join(WURZEL, pfad), 'utf8');
  if (dateien[pfad] === aufPlatte) continue;

  melde(
    `Der Browser würde ${pfad} anders schreiben als das Skript ` +
      `(${dateien[pfad].length} statt ${aufPlatte.length} Zeichen).`,
  );
  for (let i = 0; i < Math.max(dateien[pfad].length, aufPlatte.length); i += 1) {
    if (dateien[pfad][i] !== aufPlatte[i]) {
      melde('  Erste Abweichung bei Zeichen ' + i + ':');
      melde('    Browser: ' + JSON.stringify(dateien[pfad].slice(Math.max(0, i - 50), i + 50)));
      melde('    Platte:  ' + JSON.stringify(aufPlatte.slice(Math.max(0, i - 50), i + 50)));
      break;
    }
  }
}

/* ------------------------------------------------------------------ *
 * 3. Zweimal dasselbe Ergebnis
 * ------------------------------------------------------------------ */

const nochmal = weltDateien(JSON.parse(quelleText)).dateien;
for (const pfad of ERWARTET) {
  if (dateien[pfad] !== nochmal[pfad]) {
    melde(`${pfad} fällt bei zwei Läufen unterschiedlich aus – irgendwo steckt noch etwas Wanderndes drin.`);
  }
}

/* ------------------------------------------------------------------ *
 * Bilanz
 * ------------------------------------------------------------------ */

console.log('Age-of-Beast-Wiki – Speicherweg nach GitHub geprueft');
console.log('----------------------------------------------------');
console.log(`Kniffligste Texte:      ${KNIFFLIGE_TEXTE.length}`);
console.log(`Echte Quelldatei:       ${Math.round(quelleText.length / 1024)} KB, umkodiert ${grossOk ? 'unveraendert' : 'FEHLERHAFT'}`);
console.log(`Dateien im Commit:      ${Object.keys(dateien).join(', ')}`);

if (!fehler.length) {
  console.log('');
  console.log('Alles in Ordnung:');
  console.log('  - Umkodierung veraendert keinen Text, auch nicht bei voller Dateigroesse.');
  console.log('  - Der Browser schreibt Zeichen fuer Zeichen dieselben Dateien wie das Skript.');
  console.log('  - Zwei Laeufe ergeben dasselbe Ergebnis.');
  process.exit(0);
}

console.error('');
console.error(`FEHLER: ${fehler.length} Beanstandung(en).`);
for (const zeile of fehler) console.error('  ' + zeile);
console.error('');
console.error('Behebung: node werkzeuge/welt-aufbereiten.mjs   und das Ergebnis mitliefern.');
process.exit(1);
