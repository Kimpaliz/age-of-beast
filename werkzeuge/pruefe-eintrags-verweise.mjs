/* [Aufgabe: Prüfwesen]
   Verifies unresolved wiki targets and selectable entry icons.

   Creation logic runs without a browser or Firebase. This proves that a
   link target never overwrites an existing entry and that its selected icon
   reaches the reader-facing world data.
*/

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  eindeutigeKennung,
  eintragEntwurf,
  eintragNachName,
} from './eintrag-anlegen.mjs';
import { umwandeln } from './welt-umwandeln.mjs';

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), '..');
let pruefungen = 0;
const fehler = [];

function pruefe(wert, text) {
  pruefungen += 1;
  if (!wert) fehler.push(text);
}

const vorhandene = new Set(['items-kurzschwert', 'items-kurzschwert-2']);
pruefe(
  eindeutigeKennung('items', 'Kurzschwert', vorhandene) === 'items-kurzschwert-3',
  'Eine neue Kennung ueberschreibt keinen vorhandenen Eintrag.',
);

const entwurf = eintragEntwurf({
  name: 'Fälscherwerkzeug',
  kategorie: 'items',
  icon: 'key',
  vorhandeneIds: vorhandene,
  zeit: '2026-09-21T12:00:00.000Z',
});
pruefe(entwurf.id === 'items-faelscherwerkzeug', 'Umlaute werden in einer stabilen Kennung umgesetzt.');
pruefe(entwurf.module === 'items', 'Der Entwurf landet in der gewaehlten Kategorie.');
pruefe(entwurf.icon === 'key', 'Das gewaehlte Icon wird am Roh-Eintrag gespeichert.');
pruefe(Array.isArray(entwurf.customPanels) && entwurf.customPanels.length === 0,
  'Ein neuer Linkeintrag erhaelt keine erfundenen Inhaltsfelder.');

const roh = {
  project: { subtitle: 'Pruefwelt' },
  createdAt: '2026-09-21T11:00:00.000Z',
  updatedAt: '2026-09-21T12:00:00.000Z',
  elements: {
    items: {
      [entwurf.id]: entwurf,
      'items-kurzschwert': {
        id: 'items-kurzschwert', module: 'items', name: 'Kurzschwert',
        description: '', fields: { aliases: 'Short Sword', connections: [] },
        attributeRows: [], customPanels: [], panelOrder: [],
      },
    },
  },
};

pruefe(eintragNachName(roh, 'KURZSCHWERT')?.id === 'items-kurzschwert',
  'Die Namenssuche ignoriert Gross- und Kleinschreibung.');
pruefe(eintragNachName(roh, 'Short Sword')?.id === 'items-kurzschwert',
  'Auch ein gepflegter Alias findet den vorhandenen Eintrag.');

const { welt } = umwandeln(roh);
const gelesen = welt.eintraege.find((eintrag) => eintrag.id === entwurf.id);
pruefe(gelesen?.icon === 'key', 'Das Icon gelangt aus der Quelle in die Leserwelt.');

const bogen = readFileSync(join(WURZEL, 'karte', 'bogen-werte.js'), 'utf8');
pruefe(/verweis-fehlt/u.test(bogen), 'Der Charakterbogen kennzeichnet ein fehlendes Wiki-Ziel.');
pruefe(/data-karte/u.test(bogen) && /wiki/u.test(bogen),
  'Regelkarte und Wiki-Verweis bleiben im Charakterbogen getrennt erreichbar.');

const bogenAnzeige = readFileSync(join(WURZEL, 'karte', 'bogen-zeigen.js'), 'utf8');
pruefe(/standLesen/u.test(bogenAnzeige) && /weltLesen/u.test(bogenAnzeige),
  'Der Charakterbogen gleicht seinen Eintragsstand mit der gemeinsamen Welt ab.');

const ansichten = readFileSync(join(WURZEL, 'runtime', 'ansichten.js'), 'utf8');
pruefe(/fehlenderEintragZeichnen/u.test(ansichten),
  'Das Wiki besitzt eine eigene Rueckfrage fuer fehlende Eintraege.');
pruefe(/eintragSymbol/u.test(ansichten), 'Die Wiki-Ansichten verwenden Eintrags-Icons.');

if (fehler.length) {
  console.error('Eintragsverweis-Pruefung fehlgeschlagen:\n- ' + fehler.join('\n- '));
  process.exitCode = 1;
} else {
  console.log('Age-of-Beast-Wiki – Eintragsverweise und Icons geprueft');
  console.log('Pruefungen: ' + pruefungen);
  console.log('Ergebnis: fehlende Ziele sind sicher anlegbar, Icons bleiben erhalten.');
}
