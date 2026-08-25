/**
 * Erzeugt den Inhalt aller Dateien unter `daten/` aus dem Weltstand.
 *
 * Warum als eigenes Modul: Diese Dateien entstehen an zwei Orten.
 *
 *   - `welt-aufbereiten.mjs` schreibt sie auf der Festplatte,
 *   - das Wiki im Browser legt sie beim Speichern mit in den Commit.
 *
 * Wuerden beide die Dateien selbst zusammenbauen, liefen sie frueher oder
 * spaeter auseinander – ein zusaetzliches Leerzeichen genuegt, und
 * `pruefe-gleichstand.mjs` schlaegt Alarm. Deshalb gibt es genau eine
 * Stelle, die das Format festlegt: diese hier.
 *
 * Reine Logik, keine Node-Bausteine.
 */

import { umwandeln } from './welt-umwandeln.mjs';

const KOPFZEILE =
  '/* Automatisch erzeugt von werkzeuge/welt-aufbereiten.mjs. Nicht von Hand ändern. */\n';

/** Der Name der Quelldatei. Sie ist die Wahrheit, alles andere leitet sich ab. */
export const QUELLE = 'daten/quelle.json';

/**
 * Baut aus einem Rohstand alle Dateien, die im Repository liegen muessen.
 *
 * @param {object} roh  Der Weltstand im Quellformat
 * @returns {{dateien: Object<string,string>, welt: object, bilanz: object,
 *            gepflegteBegriffe: Set<string>, ausgeschlossen: string[]}}
 *   `dateien` bildet Pfad auf Inhalt ab, einschliesslich der Quelldatei selbst.
 */
export function weltDateien(roh) {
  const ergebnis = umwandeln(roh);
  const alsJson = JSON.stringify(ergebnis.welt, null, 2);

  return {
    ...ergebnis,
    dateien: {
      [QUELLE]: JSON.stringify(roh, null, 2) + '\n',
      'daten/welt.json': alsJson + '\n',
      'daten/welt.js': KOPFZEILE + 'window.AGE_OF_BEAST_WELT = ' + alsJson + ';\n',
    },
  };
}
