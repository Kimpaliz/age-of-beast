/**
 * Erzeugt die Weltkarte als PNG zum Ansehen.
 *
 * Aufruf:
 *   node werkzeuge/karte-malen.mjs [--breite 480] [--saat 20260904] [--zoom 3]
 *   node werkzeuge/karte-malen.mjs --ziel "C:/pfad/karte.png"
 *
 * Das PNG wird von Hand geschrieben — Node bringt mit `zlib` alles mit,
 * was ein PNG braucht. Eine Bildbibliothek waere bequemer, aber das Wiki
 * kommt ohne Abhaengigkeiten aus, und diese Regel ist mehr wert als die
 * Bequemlichkeit.
 *
 * [Aufgabe: Karte]
 */
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { karteErzeugen, biomeZaehlen, STANDARD } from '../karte/karte-erzeugen.mjs';
import { alsBildpunkte } from '../karte/palette.mjs';

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), '..');

function argument(name, standard) {
  const i = process.argv.indexOf('--' + name);
  if (i === -1 || i === process.argv.length - 1) return standard;
  const wert = process.argv[i + 1];
  return typeof standard === 'number' ? Number(wert) : wert;
}

/* ------------------------------------------------------------------ *
 * PNG von Hand
 * ------------------------------------------------------------------ */

function crc32(daten) {
  let c = ~0;
  for (let i = 0; i < daten.length; i += 1) {
    c ^= daten[i];
    for (let k = 0; k < 8; k += 1) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function block(typ, inhalt) {
  const kopf = Buffer.alloc(4);
  kopf.writeUInt32BE(inhalt.length, 0);
  const koerper = Buffer.concat([Buffer.from(typ, 'ascii'), inhalt]);
  const pruef = Buffer.alloc(4);
  pruef.writeUInt32BE(crc32(koerper), 0);
  return Buffer.concat([kopf, koerper, pruef]);
}

function alsPng(breite, hoehe, rgba) {
  const kopf = Buffer.alloc(13);
  kopf.writeUInt32BE(breite, 0);
  kopf.writeUInt32BE(hoehe, 4);
  kopf[8] = 8;   // 8 Bit je Kanal
  kopf[9] = 6;   // RGBA
  kopf[10] = 0;  // Deflate
  kopf[11] = 0;  // Standardfilter
  kopf[12] = 0;  // kein Interlace

  /* Jede Zeile bekommt ein Filterbyte vorangestellt. 0 heisst „kein
     Filter" — bei Pixelkunst mit grossen einfarbigen Flaechen packt
     zlib das ohnehin gut weg. */
  const roh = Buffer.alloc(hoehe * (breite * 4 + 1));
  for (let y = 0; y < hoehe; y += 1) {
    const ziel = y * (breite * 4 + 1);
    roh[ziel] = 0;
    Buffer.from(rgba.buffer, rgba.byteOffset + y * breite * 4, breite * 4).copy(roh, ziel + 1);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    block('IHDR', kopf),
    block('IDAT', deflateSync(roh, { level: 9 })),
    block('IEND', Buffer.alloc(0)),
  ]);
}

/** Vergroessert ohne Weichzeichnen — jeder Bildpunkt wird ein Block.
    Genau das macht den Pixellook aus; jede Glaettung zerstoert ihn. */
function vergroessern(rgba, breite, hoehe, faktor) {
  const bg = breite * faktor;
  const hg = hoehe * faktor;
  const aus = new Uint8ClampedArray(bg * hg * 4);
  for (let y = 0; y < hg; y += 1) {
    const qy = Math.floor(y / faktor);
    for (let x = 0; x < bg; x += 1) {
      const qx = Math.floor(x / faktor);
      const q = (qy * breite + qx) * 4;
      const z = (y * bg + x) * 4;
      aus[z] = rgba[q];
      aus[z + 1] = rgba[q + 1];
      aus[z + 2] = rgba[q + 2];
      aus[z + 3] = rgba[q + 3];
    }
  }
  return { daten: aus, breite: bg, hoehe: hg };
}

/* ------------------------------------------------------------------ *
 * Lauf
 * ------------------------------------------------------------------ */

const breite = argument('breite', STANDARD.breite);
const saat = argument('saat', STANDARD.saat);
const zoom = argument('zoom', 3);
const ziel = argument('ziel', join(WURZEL, 'karte', 'vorschau.png'));

const hoehe = Math.round(breite * (1088 / 1247));

console.log('Age of Beast — Weltkarte');
console.log('Aufloesung: ' + breite + ' x ' + hoehe + ' Bildpunkte, Saat ' + saat);

const start = Date.now();
const karte = karteErzeugen({ breite, hoehe, saat });
const dauer = Date.now() - start;

/* Dieselbe Koernung wie im Browser: aus dem Ort berechnet, nicht
   gewuerfelt. */
const koernung = (x, y) => {
  let h = x * 374761393 + y * 668265263 + saat * 977;
  h = (h ^ (h >>> 13)) >>> 0;
  h = Math.imul(h, 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

const punkte = alsBildpunkte(karte, koernung);
const gross = vergroessern(punkte, breite, hoehe, zoom);
writeFileSync(ziel, alsPng(gross.breite, gross.hoehe, gross.daten));

console.log('Gerechnet in ' + dauer + ' ms');
console.log('');
console.log('Biome:');
for (const b of biomeZaehlen(karte)) {
  console.log('  ' + b.name.padEnd(14) + String(b.anzahl).padStart(7) + '  ' + (b.anteil * 100).toFixed(1).padStart(5) + ' %');
}
console.log('');
console.log('Staedte: ' + karte.staedte.length);
for (const s of karte.staedte) {
  console.log('  ' + s.art.padEnd(12) + ' bei ' + String(s.px).padStart(4) + '/' + String(s.py).padStart(3) + '  ' + s.lage);
}
console.log('');
console.log('Geschrieben: ' + ziel + '  (' + gross.breite + ' x ' + gross.hoehe + ')');
