/* ===================================================================
   Age of Beast – Kartenpins prüfen
   [Aufgabe: Karte]

   -------------------------------------------------------------------
   Stecknadeln sind nur dann brauchbare Wegweiser, wenn ihr Punkt auf
   derselben Karte liegt, die Umrechnung zurückführt und die Ziel-ID
   nicht bloß als tote Zeichenfolge in den erzeugten Daten steht.
   =================================================================== */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STANDARD } from '../karte/karte-erzeugen.mjs';
import {
  KARTENRASTER,
  bildpunktZuKartenpunkt,
  istKartenpunkt,
  kartenpunktZuBildpunkt,
  liegtImKartenraster,
} from '../karte/welt-orte.mjs';

const HIER = dirname(fileURLToPath(import.meta.url));
const WURZEL = join(HIER, '..');
const BILDGROESSE = { breite: STANDARD.breite, hoehe: STANDARD.hoehe };
const IST_ROTPROBE = process.argv.includes('--probe-ausserhalb');

function jsonLesen(relativerPfad) {
  return JSON.parse(readFileSync(join(WURZEL, relativerPfad), 'utf8'));
}

function rohEintraegeNachId(roh) {
  const nachId = new Map();
  for (const gruppe of Object.values(roh.elements || {})) {
    for (const [id, eintrag] of Object.entries(gruppe || {})) {
      nachId.set(id, eintrag);
    }
  }
  return nachId;
}

function gleicherPunkt(a, b) {
  return a.x === b.x && a.y === b.y;
}

function pruefeKartenpins(welt, roh) {
  const fehler = [];
  let pruefungen = 0;
  const pruefe = (bedingung, meldung) => {
    pruefungen += 1;
    if (!bedingung) fehler.push(meldung);
  };

  const eintraege = Array.isArray(welt.eintraege) ? welt.eintraege : [];
  pruefe(Array.isArray(welt.eintraege), 'daten/welt.json.eintraege muss ein Array sein.');

  const rohNachId = rohEintraegeNachId(roh);
  const pins = eintraege.filter((eintrag) => eintrag
    && typeof eintrag === 'object'
    && Object.hasOwn(eintrag, 'kartenpunkt'));
  const pinsJeId = new Map();
  const weltNachId = new Map();
  for (const eintrag of eintraege) {
    if (eintrag && typeof eintrag.id === 'string') weltNachId.set(eintrag.id, eintrag);
  }

  for (const eintrag of pins) {
    const id = typeof eintrag.id === 'string' ? eintrag.id : '';
    const punkt = eintrag.kartenpunkt;
    pruefe(Boolean(id), 'Eine Stecknadel hat keine gültige Eintrags-ID.');
    pruefe(
      !pinsJeId.has(id),
      'Der Eintrag „' + (id || '(ohne ID)') + '“ hätte mehr als eine Stecknadel.',
    );
    pinsJeId.set(id, (pinsJeId.get(id) || 0) + 1);

    const rohEintrag = rohNachId.get(id);
    pruefe(
      Boolean(rohEintrag),
      'Die Stecknadel „' + (id || '(ohne ID)') + '“ zeigt auf keinen vorhandenen Rohdaten-Eintrag.',
    );
    pruefe(
      istKartenpunkt(punkt),
      'Die Stecknadel „' + (id || '(ohne ID)') + '“ braucht ganzzahlige x- und y-Koordinaten.',
    );
    if (!istKartenpunkt(punkt)) continue;

    pruefe(
      liegtImKartenraster(punkt),
      'Die Stecknadel „' + id + '“ liegt außerhalb des Kartenrasters '
        + KARTENRASTER.breite + ' × ' + KARTENRASTER.hoehe + '.',
    );
    if (!liegtImKartenraster(punkt)) continue;

    const bildpunkt = kartenpunktZuBildpunkt(punkt, BILDGROESSE);
    const zurueck = bildpunktZuKartenpunkt(bildpunkt, BILDGROESSE);
    pruefe(
      gleicherPunkt(zurueck, punkt),
      'Die Umrechnung für „' + id + '“ kehrt nicht zum selben Kartenpunkt zurück.',
    );
    pruefe(
      bildpunkt.x >= 0 && bildpunkt.x <= BILDGROESSE.breite
        && bildpunkt.y >= 0 && bildpunkt.y <= BILDGROESSE.hoehe,
      'Die Bildposition für „' + id + '“ liegt außerhalb des erzeugten Bildes.',
    );

    const rohPunkt = rohEintrag?.fields?.kartenpunkt;
    pruefe(
      gleicherPunkt(rohPunkt || {}, punkt),
      'Die erzeugte Stecknadel „' + id + '“ stimmt nicht mit daten/quelle.json überein.',
    );
  }

  for (const [id, rohEintrag] of rohNachId) {
    if (!Object.hasOwn(rohEintrag?.fields || {}, 'kartenpunkt')) continue;
    const erzeugterEintrag = weltNachId.get(id);
    pruefe(
      Boolean(erzeugterEintrag),
      'Der Rohdaten-Eintrag „' + id + '“ mit Kartenpunkt fehlt in daten/welt.json.',
    );
    pruefe(
      gleicherPunkt(erzeugterEintrag?.kartenpunkt || {}, rohEintrag.fields.kartenpunkt),
      'Der Kartenpunkt von „' + id + '“ wurde nicht unverändert durchgereicht.',
    );
  }

  return { fehler, pruefungen, pins: pins.length };
}

function randfehlerEinbauen(welt) {
  const kopie = JSON.parse(JSON.stringify(welt));
  const ziel = kopie.eintraege?.find((eintrag) => liegtImKartenraster(eintrag.kartenpunkt));
  if (!ziel) throw new Error('Die Rotprobe braucht mindestens eine gültige Stecknadel.');
  ziel.kartenpunkt.x = KARTENRASTER.breite + 1;
  return kopie;
}

try {
  const roh = jsonLesen('daten/quelle.json');
  const welt = jsonLesen('daten/welt.json');
  const pruefWelt = IST_ROTPROBE ? randfehlerEinbauen(welt) : welt;
  const ergebnis = pruefeKartenpins(pruefWelt, roh);

  console.log('Age of Beast – Kartenpins geprüft');
  console.log('Kartenraster:          ' + KARTENRASTER.breite + ' × ' + KARTENRASTER.hoehe);
  console.log('Erzeugtes Bild:         ' + BILDGROESSE.breite + ' × ' + BILDGROESSE.hoehe);
  console.log('Stecknadeln:            ' + ergebnis.pins);
  console.log('Prüfungen:              ' + ergebnis.pruefungen);

  if (IST_ROTPROBE) {
    const ausserhalbErkannt = ergebnis.fehler.some((fehler) => fehler.includes('außerhalb des Kartenrasters'));
    if (ausserhalbErkannt) {
      console.error('ABSICHTLICHE ROTPROBE: Der erste Kartenpunkt liegt bei x '
        + (KARTENRASTER.breite + 1) + ' und wurde abgewiesen.');
      process.exitCode = 1;
    } else {
      console.error('FEHLER: Die absichtlich falsche Randkoordinate wurde nicht erkannt.');
      process.exitCode = 2;
    }
  } else if (ergebnis.fehler.length) {
    console.error('FEHLER: ' + ergebnis.fehler.length + ' Kartenpin-Problem(e).');
    for (const fehler of ergebnis.fehler) console.error('  - ' + fehler);
    process.exitCode = 1;
  } else {
    console.log('Ergebnis: Alle Stecknadeln liegen im Raster, führen zu echten Einträgen und rechnen verlustfrei zurück.');
  }
} catch (fehler) {
  console.error('Kartenpin-Prüfung konnte nicht vollständig ausgeführt werden: ' + fehler.message);
  process.exitCode = 1;
}
