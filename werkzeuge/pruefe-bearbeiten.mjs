/**
 * Prueft das Bearbeiten von Ende zu Ende – an allen echten Texten.
 *
 * Fuer jedes bearbeitbare Feld jedes Eintrags wird durchgespielt, was
 * passiert, wenn Jannik den Stift anklickt und sofort speichert, ohne
 * etwas zu tippen:
 *
 *   1. `stelleFinden`  – wo steht der Text in der Weltenschmiede?
 *   2. `zumBearbeiten` – was erscheint im Feld?
 *   3. `zumSpeichern`  – was wuerde geschrieben?
 *   4. `inTiefeSetzen` – in eine Kopie des Rohstands eintragen
 *   5. `umwandeln`     – das Wiki daraus neu bauen
 *
 * Danach muss der Eintrag im Wiki Zeichen fuer Zeichen derselbe sein.
 * Ist er es nicht, wuerde ein versehentliches Speichern Text zerstoeren.
 *
 * Zusaetzlich wird geprueft, dass eine echte Aenderung auch wirklich
 * ankommt – sonst wuerde ein Test, der nichts tut, immer gruen sein.
 *
 * Aufruf:
 *   node werkzeuge/pruefe-bearbeiten.mjs
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { umwandeln } from './welt-umwandeln.mjs';
import { stelleFinden, zumBearbeiten, zumSpeichern, inTiefeSetzen } from './bearbeiten-stellen.mjs';

const HIER = dirname(fileURLToPath(import.meta.url));
const roh = JSON.parse(readFileSync(join(HIER, '..', 'daten', 'quelle.json'), 'utf8'));

const tief = (wert) => JSON.parse(JSON.stringify(wert));
const alsZeichen = (wert) => JSON.stringify(wert);

/* ------------------------------------------------------------------ *
 * Alle bearbeitbaren Felder aufzaehlen
 * ------------------------------------------------------------------ */

/** @returns {Array<{eintragId, kategorie, feld, herkunft, ort}>} */
function felderSammeln(welt) {
  const felder = [];
  for (const eintrag of welt.eintraege) {
    const kopf = { eintragId: eintrag.id, kategorie: eintrag.kategorie };
    felder.push({ ...kopf, feld: 'name', herkunft: null, ort: `${eintrag.id} / Name` });
    if (eintrag.kurz) felder.push({ ...kopf, feld: 'kurz', herkunft: null, ort: `${eintrag.id} / Kurztext` });

    eintrag.abschnitte.forEach((abschnitt, i) => {
      if (!abschnitt.herkunft) return;
      if (abschnitt.herkunft.art === 'panel' && abschnitt.titel) {
        felder.push({ ...kopf, feld: 'titel', herkunft: abschnitt.herkunft, ort: `${eintrag.id} / Abschnitt ${i + 1} Überschrift` });
      }
      felder.push({ ...kopf, feld: 'text', herkunft: abschnitt.herkunft, ort: `${eintrag.id} / Abschnitt ${i + 1} Text` });
    });
  }
  return felder;
}

/* ------------------------------------------------------------------ *
 * 1. Oeffnen und unveraendert speichern
 * ------------------------------------------------------------------ */

const { welt: vorher } = umwandeln(roh);
const felder = felderSammeln(vorher);

const vorherJeEintrag = new Map(vorher.eintraege.map((e) => [e.id, alsZeichen(e)]));
const fehler = [];
let nichtGefunden = 0;

for (const feld of felder) {
  const kopie = tief(roh);
  const element = kopie.elements?.[feld.kategorie]?.[feld.eintragId];
  const stelle = stelleFinden(element, feld.feld, feld.herkunft);

  if (!stelle) {
    // Kein Fehler: Solche Felder bekommen im Wiki gar keinen Stift.
    nichtGefunden += 1;
    continue;
  }

  const imFeld = zumBearbeiten(stelle.wert, stelle.art);
  const werte = zumSpeichern(imFeld, stelle.art, stelle.ziele);

  for (const [pfad, wert] of Object.entries(werte)) {
    const ganz = 'elements/' + feld.kategorie + '/' + feld.eintragId + '/' + pfad;
    if (!inTiefeSetzen(kopie, ganz, wert)) {
      fehler.push({ ort: feld.ort, grund: 'Pfad nicht vorhanden: ' + ganz });
    }
  }

  const { welt: nachher } = umwandeln(kopie);
  const eintragNachher = nachher.eintraege.find((e) => e.id === feld.eintragId);

  if (alsZeichen(eintragNachher) !== vorherJeEintrag.get(feld.eintragId)) {
    fehler.push({
      ort: feld.ort,
      grund: 'Der Eintrag sieht nach dem Speichern anders aus.',
      imFeld,
      vorher: vorherJeEintrag.get(feld.eintragId),
      nachher: alsZeichen(eintragNachher),
    });
  }
}

/* ------------------------------------------------------------------ *
 * 2. Kommt eine echte Aenderung auch an?
 * ------------------------------------------------------------------ */

const PROBE = 'Sturmgezeichnete Probeueberschrift';
let probenGelaufen = 0;
const probenFehler = [];

for (const feld of felder.filter((f) => f.feld === 'text').slice(0, 12)) {
  const kopie = tief(roh);
  const element = kopie.elements?.[feld.kategorie]?.[feld.eintragId];
  const stelle = stelleFinden(element, feld.feld, feld.herkunft);
  if (!stelle) continue;

  const imFeld = zumBearbeiten(stelle.wert, stelle.art) + '\n\n' + PROBE;
  const werte = zumSpeichern(imFeld, stelle.art, stelle.ziele);
  for (const [pfad, wert] of Object.entries(werte)) {
    inTiefeSetzen(kopie, 'elements/' + feld.kategorie + '/' + feld.eintragId + '/' + pfad, wert);
  }

  const { welt: nachher } = umwandeln(kopie);
  const eintragNachher = nachher.eintraege.find((e) => e.id === feld.eintragId);
  probenGelaufen += 1;

  if (!alsZeichen(eintragNachher).includes(PROBE)) {
    probenFehler.push(feld.ort);
  }
}

/* ------------------------------------------------------------------ *
 * Bilanz
 * ------------------------------------------------------------------ */

console.log('Age-of-Beast-Wiki – Bearbeiten geprueft');
console.log('---------------------------------------');
console.log(`Bearbeitbare Felder:    ${felder.length}`);
console.log(`Davon ohne Stelle:      ${nichtGefunden}   (bekommen im Wiki keinen Stift)`);
console.log(`Aenderungsproben:       ${probenGelaufen}`);

if (!fehler.length && !probenFehler.length) {
  console.log('');
  console.log('Alles in Ordnung:');
  console.log('  - Oeffnen und Speichern ohne Tippen veraendert keinen Eintrag.');
  console.log('  - Eine echte Aenderung kommt im Wiki an.');
  process.exit(0);
}

if (fehler.length) {
  console.error('');
  console.error(`FEHLER: ${fehler.length} Feld(er) wuerden beim Speichern etwas veraendern.`);
  for (const f of fehler.slice(0, 6)) {
    console.error('');
    console.error('  Ort:    ' + f.ort);
    console.error('  Grund:  ' + f.grund);
    if (f.imFeld !== undefined) console.error('  Im Feld: ' + JSON.stringify(f.imFeld).slice(0, 300));
    if (f.vorher) {
      for (let i = 0; i < Math.min(f.vorher.length, f.nachher.length); i += 1) {
        if (f.vorher[i] !== f.nachher[i]) {
          console.error('  Vorher:  … ' + f.vorher.slice(Math.max(0, i - 70), i + 70));
          console.error('  Nachher: … ' + f.nachher.slice(Math.max(0, i - 70), i + 70));
          break;
        }
      }
    }
  }
  if (fehler.length > 6) console.error(`\n  … und ${fehler.length - 6} weitere.`);
}

if (probenFehler.length) {
  console.error('');
  console.error(`FEHLER: ${probenFehler.length} Aenderung(en) kamen im Wiki nicht an:`);
  for (const ort of probenFehler) console.error('  - ' + ort);
}

process.exit(1);
