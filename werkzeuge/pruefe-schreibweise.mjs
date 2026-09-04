/**
 * [Aufgabe: Prüfwesen]
 * Prueft, dass das Bearbeiten keinen Text beschaedigt.
 *
 * Hintergrund: Im Bearbeitungsfeld sieht Jannik nicht das HTML der
 * Weltenschmiede, sondern eine einfache Schreibweise (`## Ueberschrift`,
 * `**fett**`, `- Punkt`). Beim Speichern wird daraus wieder HTML. Wenn dabei
 * etwas verloren geht, wuerde das Oeffnen und sofortige Speichern eines
 * Textes ihn stillschweigend veraendern. Genau das faengt diese Pruefung ab.
 *
 * Geprueft wird der Weg
 *
 *     HTML  ->  Schreibweise  ->  HTML
 *
 * und zwar an jedem einzelnen echten Text des Projekts. Verglichen wird
 * nicht das rohe HTML, sondern das, was das Wiki daraus anzeigt. Ob die
 * Weltenschmiede `<b>` und das Wiki `<strong>` schreibt, ist gleichgueltig,
 * solange der Leser dasselbe sieht.
 *
 * Aufruf:
 *   node werkzeuge/pruefe-schreibweise.mjs
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { alsSchreibweise, alsHtml } from './text-schreibweise.mjs';
import { alsAbsaetze } from './welt-umwandeln.mjs';

const HIER = dirname(fileURLToPath(import.meta.url));
const roh = JSON.parse(readFileSync(join(HIER, '..', 'daten', 'quelle.json'), 'utf8'));

/* ------------------------------------------------------------------ *
 * 1. Alle bearbeitbaren Texte einsammeln
 * ------------------------------------------------------------------ */

const texte = [];

for (const [kategorie, gruppe] of Object.entries(roh.elements || {})) {
  for (const [id, element] of Object.entries(gruppe)) {
    const panels = Array.isArray(element.customPanels) ? element.customPanels : [];
    panels.forEach((panel, i) => {
      const feld = (panel.textFields || [])[0];
      if (feld && feld.html) texte.push({ ort: `${kategorie}/${id}/Panel ${i + 1} „${panel.title || ''}"`, wert: feld.html });
      else if (panel.text) texte.push({ ort: `${kategorie}/${id}/Panel ${i + 1} (nur Text)`, wert: panel.text });
    });

    for (const [schluessel, wert] of Object.entries(element.richText || {})) {
      if (typeof wert === 'string' && wert.trim()) texte.push({ ort: `${kategorie}/${id}/richText.${schluessel}`, wert });
    }

    for (const [schluessel, wert] of Object.entries(element.fields || {})) {
      if (typeof wert === 'string' && wert.trim() && /<\w+/.test(wert)) {
        texte.push({ ort: `${kategorie}/${id}/fields.${schluessel}`, wert });
      }
    }
  }
}

/* ------------------------------------------------------------------ *
 * 2. Hin und wieder zurueck
 * ------------------------------------------------------------------ */

const fehler = [];
let mitRueckstrich = 0;

for (const eintrag of texte) {
  const schreibweise = alsSchreibweise(eintrag.wert);
  if (schreibweise.includes('\\')) mitRueckstrich += 1;

  const vorher = alsAbsaetze(eintrag.wert);
  const nachher = alsAbsaetze(alsHtml(schreibweise));

  if (vorher !== nachher) fehler.push({ ...eintrag, schreibweise, vorher, nachher });
}

/* ------------------------------------------------------------------ *
 * 3. Zusaetzliche Faelle, die in den echten Daten (noch) nicht vorkommen
 * ------------------------------------------------------------------ */

const KNIFFLIGE_FAELLE = [
  ['Sterne im Text', '<p>Ein Stern * bleibt ein Stern.</p>'],
  ['Doppelter Stern', '<p>Zwei ** Sterne mitten im Satz.</p>'],
  ['Unterstrich', '<p>Die Datei heisst welt_daten_2026.</p>'],
  ['Raute am Zeilenanfang', '<p># keine Ueberschrift</p>'],
  ['Strich am Zeilenanfang', '<p>- kein Listenpunkt</p>'],
  ['Groesserzeichen', '<p>&gt; kein Zitat</p>'],
  ['Nummer am Zeilenanfang', '<p>1. kein Listenpunkt</p>'],
  ['Kaufmannsund', '<p>Sturm &amp; Drang</p>'],
  ['Spitze Klammern', '<p>5 &lt; 7 und 9 &gt; 3</p>'],
  ['Umbruch im Absatz', '<p>Erste Zeile<br>Zweite Zeile</p>'],
  ['Fett und kursiv', '<p><strong>Fett</strong> und <em>kursiv</em> gemischt.</p>'],
  ['Verschachtelte Liste', '<ul><li>Erster <strong>Punkt</strong></li><li>Zweiter</li></ul>'],
  ['Nummerierte Liste', '<ol><li>Eins</li><li>Zwei</li></ol>'],
  ['Zitat', '<blockquote>Ein kluger Satz.</blockquote>'],
  ['Alle Ueberschriften', '<h2>Zwei</h2><h3>Drei</h3><h4>Vier</h4>'],
  ['Leerer Text', ''],
  ['Nur Leerzeichen', '   '],
];

for (const [name, wert] of KNIFFLIGE_FAELLE) {
  const schreibweise = alsSchreibweise(wert);
  const vorher = alsAbsaetze(wert);
  const nachher = alsAbsaetze(alsHtml(schreibweise));
  if (vorher !== nachher) fehler.push({ ort: 'Sonderfall: ' + name, wert, schreibweise, vorher, nachher });
}

/* ------------------------------------------------------------------ *
 * 4. Bilanz
 * ------------------------------------------------------------------ */

console.log('Age-of-Beast-Wiki – Schreibweise geprueft');
console.log('-----------------------------------------');
console.log(`Echte Texte geprueft:   ${texte.length}`);
console.log(`Sonderfaelle geprueft:  ${KNIFFLIGE_FAELLE.length}`);
console.log(`Mit Rueckstrich:        ${mitRueckstrich}   (Zeichen, die geschuetzt werden mussten)`);

if (!fehler.length) {
  console.log('');
  console.log('Alles in Ordnung: Oeffnen und Speichern veraendert keinen Text.');
  process.exit(0);
}

console.error('');
console.error(`FEHLER: ${fehler.length} Text(e) wuerden sich beim Speichern veraendern.`);
for (const f of fehler.slice(0, 10)) {
  console.error('');
  console.error('  Ort:          ' + f.ort);
  console.error('  Schreibweise: ' + JSON.stringify(f.schreibweise).slice(0, 400));
  console.error('  Vorher:       ' + JSON.stringify(f.vorher).slice(0, 400));
  console.error('  Nachher:      ' + JSON.stringify(f.nachher).slice(0, 400));
}
if (fehler.length > 10) console.error(`\n  … und ${fehler.length - 10} weitere.`);
process.exit(1);
