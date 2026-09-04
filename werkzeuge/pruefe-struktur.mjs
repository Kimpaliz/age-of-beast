/**
 * [Aufgabe: Prüfwesen]
 * Prüft die Strukturänderungen an allen echten Einträgen.
 *
 * Geprüft wird jeweils an einer Kopie des Weltstands, nie an der Quelle.
 * Für jede Änderung gilt dieselbe Frage: Kommt genau das an, was gewollt
 * war — und bleibt alles andere unberührt?
 *
 * Aufruf:
 *   node werkzeuge/pruefe-struktur.mjs
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { umwandeln } from './welt-umwandeln.mjs';
import { inTiefeSetzen } from './bearbeiten-stellen.mjs';
import {
  abschnittAnlegen,
  abschnittLoeschen,
  abschnittVerschieben,
  abschnittsReihenfolge,
  steckbriefZeilen,
  zeileAnlegen,
  zeileLoeschen,
  zeileSetzen,
  alsSchluessel,
} from './struktur-bearbeiten.mjs';

const HIER = dirname(fileURLToPath(import.meta.url));
const WURZEL = join(HIER, '..');
const roh = JSON.parse(readFileSync(join(WURZEL, 'daten', 'quelle.json'), 'utf8'));

let fehler = 0;
let geprueft = 0;

function pruefe(bedingung, was) {
  geprueft += 1;
  if (bedingung) return true;
  fehler += 1;
  console.error('  FEHLER: ' + was);
  return false;
}

/** Wendet Änderungen auf eine Kopie an und gibt den neuen Stand zurück. */
function anwenden(stand, basis, aenderungen) {
  const kopie = structuredClone(stand);
  for (const [pfad, wert] of Object.entries(aenderungen)) {
    if (!inTiefeSetzen(kopie, basis + pfad, wert)) {
      throw new Error('Pfad nicht setzbar: ' + basis + pfad);
    }
  }
  return kopie;
}

/** Der Eintrag, wie das Wiki ihn zeigt. */
function alsEintrag(stand, id) {
  return umwandeln(stand).welt.eintraege.find((e) => e.id === id);
}

/** Alle Einträge außer einem, als Vergleichsabdruck. */
function abdruckOhne(stand, id) {
  return JSON.stringify(umwandeln(stand).welt.eintraege.filter((e) => e.id !== id));
}

/**
 * Der Rohknoten eines Eintrags als Abdruck, ohne den Zeitstempel.
 *
 * Warum zusätzlich zur Anzeige geprüft wird: Eine Änderung kann in den
 * Rohdaten Spuren hinterlassen, die man der Anzeige nicht ansieht – etwa
 * ein geleertes statt entferntes Feld. Beim wiederholten Anlegen und
 * Entfernen würde sich das aufsummieren.
 */
function rohAbdruck(stand, kategorie, id) {
  const kopie = structuredClone(stand.elements[kategorie][id]);
  delete kopie.updatedAt;
  return JSON.stringify(kopie);
}

/* ------------------------------------------------------------------ *
 * Durchlauf über alle Einträge
 * ------------------------------------------------------------------ */

const alle = [];
for (const [kategorie, gruppe] of Object.entries(roh.elements || {})) {
  for (const [id, element] of Object.entries(gruppe)) alle.push({ kategorie, id, element });
}

console.log('Age-of-Beast-Wiki – Struktur geprueft');
console.log('-------------------------------------');

let angelegt = 0;
let geloescht = 0;
let verschoben = 0;
let zeilenGeprueft = 0;

for (const { kategorie, id, element } of alle) {
  const basis = 'elements/' + kategorie + '/' + id + '/';
  const vorher = alsEintrag(roh, id);
  const fremdVorher = abdruckOhne(roh, id);
  const rohVorher = rohAbdruck(roh, kategorie, id);

  /* --- Abschnitt anlegen ---------------------------------------- */
  {
    const schritt = abschnittAnlegen(element, id, 'Probeabschnitt');
    const stand = anwenden(roh, basis, schritt.aenderungen);
    const nachher = alsEintrag(stand, id);

    pruefe(
      nachher.abschnitte.length === vorher.abschnitte.length + 1,
      id + ': Anlegen ergibt keinen zusätzlichen Abschnitt',
    );

    // Der neue Abschnitt steht hinter allen anderen aus Panels. Ganz am Ende
    // stehen kann er nicht: `welt-umwandeln.mjs` hängt danach noch die
    // Zusatztexte an, die in keinem Panel vorkommen.
    const stelleNeu = nachher.abschnitte.findIndex((a) => a.titel === 'Probeabschnitt');
    const letzterAusPanel = nachher.abschnitte.reduce(
      (max, a, i) => (a.herkunft && a.herkunft.art === 'panel' ? i : max),
      -1,
    );
    pruefe(stelleNeu !== -1, id + ': Der neue Abschnitt erscheint nicht');
    pruefe(
      stelleNeu === letzterAusPanel,
      id + ': Der neue Abschnitt steht nicht hinter den vorhandenen Abschnitten',
    );

    pruefe(
      abdruckOhne(stand, id) === fremdVorher,
      id + ': Anlegen hat andere Einträge verändert',
    );

    // Alle vorhandenen Abschnitte müssen unberührt und in derselben Folge
    // dastehen. Geprüft wird, indem der neue wieder herausgenommen wird.
    const ohneNeuen = nachher.abschnitte.filter((_, i) => i !== stelleNeu);
    pruefe(
      JSON.stringify(ohneNeuen) === JSON.stringify(vorher.abschnitte),
      id + ': Anlegen hat vorhandene Abschnitte verändert',
    );
    angelegt += 1;

    /* --- und gleich wieder löschen ------------------------------- */
    const elementNeu = stand.elements[kategorie][id];
    const zurueck = abschnittLoeschen(elementNeu, schritt.neueId);
    if (pruefe(zurueck !== null, id + ': Der neue Abschnitt ließ sich nicht löschen')) {
      const stand2 = anwenden(stand, basis, zurueck.aenderungen);
      pruefe(
        JSON.stringify(alsEintrag(stand2, id)) === JSON.stringify(vorher),
        id + ': Anlegen und Löschen ergibt nicht den Ausgangszustand',
      );
      pruefe(
        rohAbdruck(stand2, kategorie, id) === rohVorher,
        id + ': Anlegen und Löschen hinterlässt Spuren in den Rohdaten',
      );
      geloescht += 1;
    }
  }

  /* --- Abschnitt verschieben ------------------------------------ */
  const reihenfolge = abschnittsReihenfolge(element);
  if (reihenfolge.length >= 2) {
    const ersterId = reihenfolge[0];
    const runter = abschnittVerschieben(element, ersterId, 1);
    if (pruefe(runter !== null, id + ': Verschieben nach unten nicht möglich')) {
      const stand = anwenden(roh, basis, runter.aenderungen);
      const neu = abschnittsReihenfolge(stand.elements[kategorie][id]);
      pruefe(
        neu[0] === reihenfolge[1] && neu[1] === reihenfolge[0],
        id + ': Verschieben hat die Reihenfolge nicht getauscht',
      );
      pruefe(
        [...neu].sort().join('|') === [...reihenfolge].sort().join('|'),
        id + ': Verschieben hat Abschnitte verloren oder erfunden',
      );
      // Feste Panels müssen erhalten bleiben.
      const festVorher = (element.panelOrder || []).filter((p) => !reihenfolge.includes(p));
      const festNachher = (stand.elements[kategorie][id].panelOrder || []).filter(
        (p) => !neu.includes(p),
      );
      pruefe(
        JSON.stringify(festVorher) === JSON.stringify(festNachher),
        id + ': Verschieben hat feste Panels verändert',
      );
      pruefe(
        abdruckOhne(stand, id) === fremdVorher,
        id + ': Verschieben hat andere Einträge verändert',
      );

      // Wieder zurück ergibt den Ausgangszustand.
      const hoch = abschnittVerschieben(stand.elements[kategorie][id], ersterId, -1);
      if (pruefe(hoch !== null, id + ': Verschieben nach oben nicht möglich')) {
        const stand2 = anwenden(stand, basis, hoch.aenderungen);
        pruefe(
          JSON.stringify(alsEintrag(stand2, id)) === JSON.stringify(vorher),
          id + ': Hin und zurück verschieben ergibt nicht den Ausgangszustand',
        );
      }
      verschoben += 1;
    }
  }

  /* --- Am Rand: nicht über das Ende hinaus ---------------------- */
  if (reihenfolge.length) {
    pruefe(
      abschnittVerschieben(element, reihenfolge[0], -1) === null,
      id + ': Der erste Abschnitt ließ sich nach oben schieben',
    );
    pruefe(
      abschnittVerschieben(element, reihenfolge[reihenfolge.length - 1], 1) === null,
      id + ': Der letzte Abschnitt ließ sich nach unten schieben',
    );
  }

  /* --- Steckbriefzeilen ----------------------------------------- */
  {
    const neu = zeileAnlegen(element, id, 'Probefeld', 'Probewert');
    if (pruefe(neu !== null, id + ': Steckbriefzeile ließ sich nicht anlegen')) {
      const stand = anwenden(roh, basis, neu.aenderungen);
      const nachher = alsEintrag(stand, id);
      const treffer = nachher.attribute.find((a) => a.beschriftung === 'Probefeld');
      pruefe(treffer && treffer.wert === 'Probewert', id + ': Die neue Zeile erscheint nicht');
      pruefe(
        abdruckOhne(stand, id) === fremdVorher,
        id + ': Zeile anlegen hat andere Einträge verändert',
      );

      const elementNeu = stand.elements[kategorie][id];
      const schluessel = alsSchluessel('Probefeld');
      const weg = zeileLoeschen(elementNeu, schluessel);
      if (pruefe(weg !== null, id + ': Die neue Zeile ließ sich nicht entfernen')) {
        const stand2 = anwenden(stand, basis, weg.aenderungen);
        pruefe(
          JSON.stringify(alsEintrag(stand2, id)) === JSON.stringify(vorher),
          id + ': Zeile anlegen und entfernen ergibt nicht den Ausgangszustand',
        );
        pruefe(
          rohAbdruck(stand2, kategorie, id) === rohVorher,
          id + ': Zeile anlegen und entfernen hinterlässt Spuren in den Rohdaten',
        );
      }
    }

    // Vorhandene Zeile ändern und zurücksetzen
    const zeilen = steckbriefZeilen(element);
    if (zeilen.length) {
      const z = zeilen[0];
      const geaendert = zeileSetzen(element, z.schluessel, z.beschriftung, 'Neuer Probewert');
      if (pruefe(geaendert !== null, id + ': Zeile ließ sich nicht ändern')) {
        const stand = anwenden(roh, basis, geaendert.aenderungen);
        pruefe(
          String(stand.elements[kategorie][id].fields[z.schluessel]) === 'Neuer Probewert',
          id + ': Der geänderte Wert kam nicht an',
        );
        const zurueck = zeileSetzen(
          stand.elements[kategorie][id],
          z.schluessel,
          z.beschriftung,
          z.wert,
        );
        if (zurueck) {
          const stand2 = anwenden(stand, basis, zurueck.aenderungen);
          pruefe(
            JSON.stringify(alsEintrag(stand2, id)) === JSON.stringify(vorher),
            id + ': Ändern und zurücksetzen ergibt nicht den Ausgangszustand',
          );
        }
      }
      zeilenGeprueft += zeilen.length;
    }

    // Unverändertes Speichern darf gar nichts melden.
    for (const z of zeilen) {
      pruefe(
        zeileSetzen(element, z.schluessel, z.beschriftung, z.wert) === null,
        id + ': Unverändertes Speichern meldet eine Änderung',
      );
    }
  }
}

/* ------------------------------------------------------------------ *
 * Schlüssel aus Beschriftungen
 * ------------------------------------------------------------------ */

const schluesselProben = [
  ['Gebunden an', 'gebundenAn'],
  ['Einwohner', 'einwohner'],
  ['Größe', 'groesse'],
  ['Anführer der Garde', 'anfuehrerDerGarde'],
  ['Über-Ich', 'ueberIch'],
  ['   ', ''],
];
for (const [ein, aus] of schluesselProben) {
  pruefe(alsSchluessel(ein) === aus, 'Schlüssel aus "' + ein + '" ergibt "' + alsSchluessel(ein) + '" statt "' + aus + '"');
}

/* ------------------------------------------------------------------ *
 * Bilanz
 * ------------------------------------------------------------------ */

console.log('Einträge geprüft:       ' + alle.length);
console.log('Abschnitte angelegt:    ' + angelegt + '   (und wieder entfernt)');
console.log('Abschnitte gelöscht:    ' + geloescht);
console.log('Einträge umsortiert:    ' + verschoben);
console.log('Steckbriefzeilen:       ' + zeilenGeprueft);
console.log('Einzelprüfungen:        ' + geprueft);
console.log('');

if (fehler) {
  console.error('Fehlgeschlagen: ' + fehler + ' Prüfung(en).');
  process.exit(1);
}
console.log('Alles in Ordnung:');
console.log('  - Anlegen, Löschen und Umsortieren treffen genau den Eintrag.');
console.log('  - Jede Änderung lässt sich zurücknehmen, ohne Spuren.');
console.log('  - Feste Panels der Weltenschmiede bleiben unberührt.');
