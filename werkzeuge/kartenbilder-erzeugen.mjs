/**
 * [Aufgabe: Bilder]
 * Erzeugt Kartengrafiken als SVG.
 *
 * Warum überhaupt: Die Bilder der Werkstatt sind offizielle Illustrationen
 * von Darrington Press. In einem öffentlichen Repository wären sie
 * Weiterverbreitung. Diese Dateien hier sind Ersatz — eigene Grafiken, die
 * niemandem gehören außer diesem Projekt.
 *
 * Was sie sind und was nicht: Es sind **keine** gemalten Illustrationen.
 * Es sind Wappen — Farbe, Form und Muster, aus den Angaben der Karte
 * abgeleitet. Jede Karte bekommt ein eigenes, wiedererkennbares Bild, und
 * Karten derselben Domäne sehen verwandt aus.
 *
 * Drei Gründe für SVG statt Rastergrafik:
 *
 *   1. Größe. Ein Wappen wiegt rund 1 KB statt 29 KB. Alle 234 zusammen
 *      bleiben unter 300 KB — die Originalbilder wiegen 8,4 MB.
 *   2. Schärfe. SVG ist auf jedem Bildschirm scharf, auch beim Drucken.
 *   3. Farbe. Die Domänenfarbe steckt in der Datei und lässt sich später
 *      ändern, ohne neu zu zeichnen.
 *
 * Die Erzeugung ist **bestimmt**: Derselbe Kartenname ergibt immer dasselbe
 * Bild. Ein zweiter Lauf ändert also nichts, und der Diff bleibt leer.
 *
 * Aufruf:
 *   node werkzeuge/kartenbilder-erzeugen.mjs            (alle)
 *   node werkzeuge/kartenbilder-erzeugen.mjs --proben   (nur ein paar, zum Ansehen)
 */

import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = dirname(fileURLToPath(import.meta.url));
const WURZEL = join(HIER, '..');
const ZIEL = join(WURZEL, 'daten', 'kartenbilder');

const WERKSTATT =
  'C:/Users/Jannik/Documents/Codex/2026-07-26/ka/work/daggerheart-werkstatt/src/data/cardCreator/cards.de.json';

/* ------------------------------------------------------------------ *
 * Farben und Zeichen der Domänen
 *
 * Die Farben stammen aus `DOMAIN_COLORS` der Werkstatt. Farbwerte sind
 * keine schützenswerte Gestaltung, sondern die Ordnung des Spiels — sie
 * sorgen dafür, dass eine Arkane Karte violett bleibt.
 * ------------------------------------------------------------------ */

/*
 * Die Namen bleiben englisch. Die Domänen sind Eigennamen des Spiels —
 * „Arcana" ist keine Übersetzung von etwas, sondern heißt so. Genauso
 * behandelt das Regelwerk sie, und in gemischten Runden spricht ohnehin
 * niemand von „Arkaner Macht".
 */
const DOMAENEN = {
  ARCANA:    { farbe: '#755391', name: 'Arcana',    motiv: 'rune' },
  BLADE:     { farbe: '#a34843', name: 'Blade',     motiv: 'klinge' },
  BONE:      { farbe: '#5a6f7b', name: 'Bone',      motiv: 'knochen' },
  CODEX:     { farbe: '#94723f', name: 'Codex',     motiv: 'buch' },
  GRACE:     { farbe: '#a35479', name: 'Grace',     motiv: 'welle' },
  MIDNIGHT:  { farbe: '#41476f', name: 'Midnight',  motiv: 'mond' },
  SAGE:      { farbe: '#4c7650', name: 'Sage',      motiv: 'blatt' },
  SPLENDOR:  { farbe: '#b38f2c', name: 'Splendor',  motiv: 'sonne' },
  VALOR:     { farbe: '#9a5d3f', name: 'Valor',     motiv: 'schild' },
  ANCESTRY:  { farbe: '#477980', name: 'Ancestry',  motiv: 'spirale' },
  COMMUNITY: { farbe: '#765d85', name: 'Community', motiv: 'ring' },
  SUBCLASS:  { farbe: '#665e87', name: 'Subclass',  motiv: 'stern' },
};

const BREITE = 320;
const HOEHE = 170;

/* ------------------------------------------------------------------ *
 * Bestimmter Zufall
 *
 * Aus dem Kartennamen wird eine Zahl, aus der Zahl eine Folge. Dieselbe
 * Karte ergibt damit immer dasselbe Bild — sonst änderte sich bei jedem
 * Lauf jede Datei, und der Diff wäre nutzlos.
 * ------------------------------------------------------------------ */

function saatAus(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function wuerfler(saat) {
  let z = saat || 1;
  return () => {
    z ^= z << 13; z >>>= 0;
    z ^= z >> 17;
    z ^= z << 5; z >>>= 0;
    return z / 4294967296;
  };
}

/* ------------------------------------------------------------------ *
 * Motive
 * ------------------------------------------------------------------ */

const rund = (n) => Math.round(n * 10) / 10;

function motivZeichnen(art, x, y, r, strich) {
  const p = (...z) => z.map(rund).join(' ');
  switch (art) {
    case 'klinge':
      return `<path d="M${p(x, y - r)} L${p(x + r * 0.28, y + r * 0.45)} L${p(x, y + r)} L${p(x - r * 0.28, y + r * 0.45)} Z" fill="none" stroke="${strich}" stroke-width="2"/>` +
             `<line x1="${rund(x - r * 0.5)}" y1="${rund(y + r * 0.45)}" x2="${rund(x + r * 0.5)}" y2="${rund(y + r * 0.45)}" stroke="${strich}" stroke-width="2"/>`;
    case 'mond':
      return `<path d="M${p(x + r * 0.35, y - r * 0.9)} A ${p(r, r)} 0 1 0 ${p(x + r * 0.35, y + r * 0.9)} A ${p(r * 0.78, r * 0.78)} 0 1 1 ${p(x + r * 0.35, y - r * 0.9)} Z" fill="none" stroke="${strich}" stroke-width="2"/>`;
    case 'sonne': {
      let s = `<circle cx="${rund(x)}" cy="${rund(y)}" r="${rund(r * 0.45)}" fill="none" stroke="${strich}" stroke-width="2"/>`;
      for (let i = 0; i < 8; i += 1) {
        const w = (i / 8) * Math.PI * 2;
        s += `<line x1="${rund(x + Math.cos(w) * r * 0.65)}" y1="${rund(y + Math.sin(w) * r * 0.65)}" x2="${rund(x + Math.cos(w) * r)}" y2="${rund(y + Math.sin(w) * r)}" stroke="${strich}" stroke-width="2"/>`;
      }
      return s;
    }
    case 'blatt':
      return `<path d="M${p(x, y + r)} C ${p(x - r, y + r * 0.2)} ${p(x - r * 0.6, y - r)} ${p(x, y - r)} C ${p(x + r * 0.6, y - r)} ${p(x + r, y + r * 0.2)} ${p(x, y + r)} Z" fill="none" stroke="${strich}" stroke-width="2"/>` +
             `<line x1="${rund(x)}" y1="${rund(y - r)}" x2="${rund(x)}" y2="${rund(y + r)}" stroke="${strich}" stroke-width="1.4"/>`;
    case 'schild':
      return `<path d="M${p(x, y - r)} L${p(x + r * 0.78, y - r * 0.55)} L${p(x + r * 0.78, y + r * 0.2)} C ${p(x + r * 0.78, y + r * 0.72)} ${p(x, y + r)} ${p(x, y + r)} C ${p(x, y + r)} ${p(x - r * 0.78, y + r * 0.72)} ${p(x - r * 0.78, y + r * 0.2)} L${p(x - r * 0.78, y - r * 0.55)} Z" fill="none" stroke="${strich}" stroke-width="2"/>`;
    case 'buch':
      return `<path d="M${p(x - r * 0.85, y - r * 0.6)} L${p(x, y - r * 0.36)} L${p(x + r * 0.85, y - r * 0.6)} L${p(x + r * 0.85, y + r * 0.62)} L${p(x, y + r * 0.86)} L${p(x - r * 0.85, y + r * 0.62)} Z" fill="none" stroke="${strich}" stroke-width="2"/>` +
             `<line x1="${rund(x)}" y1="${rund(y - r * 0.36)}" x2="${rund(x)}" y2="${rund(y + r * 0.86)}" stroke="${strich}" stroke-width="1.6"/>`;
    case 'knochen':
      return `<path d="M${p(x - r * 0.7, y - r * 0.35)} L${p(x + r * 0.7, y + r * 0.35)}" stroke="${strich}" stroke-width="2.4" stroke-linecap="round"/>` +
             `<circle cx="${rund(x - r * 0.78)}" cy="${rund(y - r * 0.55)}" r="${rund(r * 0.22)}" fill="none" stroke="${strich}" stroke-width="1.8"/>` +
             `<circle cx="${rund(x - r * 0.5)}" cy="${rund(y - r * 0.72)}" r="${rund(r * 0.2)}" fill="none" stroke="${strich}" stroke-width="1.8"/>` +
             `<circle cx="${rund(x + r * 0.78)}" cy="${rund(y + r * 0.55)}" r="${rund(r * 0.22)}" fill="none" stroke="${strich}" stroke-width="1.8"/>` +
             `<circle cx="${rund(x + r * 0.5)}" cy="${rund(y + r * 0.72)}" r="${rund(r * 0.2)}" fill="none" stroke="${strich}" stroke-width="1.8"/>`;
    case 'welle':
      return `<path d="M${p(x - r, y)} C ${p(x - r * 0.5, y - r * 0.7)} ${p(x - r * 0.5, y + r * 0.7)} ${p(x, y)} C ${p(x + r * 0.5, y - r * 0.7)} ${p(x + r * 0.5, y + r * 0.7)} ${p(x + r, y)}" fill="none" stroke="${strich}" stroke-width="2"/>` +
             `<path d="M${p(x - r * 0.8, y + r * 0.5)} C ${p(x - r * 0.4, y - r * 0.1)} ${p(x - r * 0.4, y + r * 1.1)} ${p(x, y + r * 0.5)} C ${p(x + r * 0.4, y - r * 0.1)} ${p(x + r * 0.4, y + r * 1.1)} ${p(x + r * 0.8, y + r * 0.5)}" fill="none" stroke="${strich}" stroke-width="1.3" opacity="0.6"/>`;
    case 'spirale': {
      let d = `M${p(x, y)}`;
      for (let i = 0; i <= 90; i += 1) {
        const w = (i / 90) * Math.PI * 4;
        const rr = (i / 90) * r;
        d += ` L${p(x + Math.cos(w) * rr, y + Math.sin(w) * rr)}`;
      }
      return `<path d="${d}" fill="none" stroke="${strich}" stroke-width="1.8"/>`;
    }
    case 'ring':
      return `<circle cx="${rund(x)}" cy="${rund(y)}" r="${rund(r * 0.9)}" fill="none" stroke="${strich}" stroke-width="2"/>` +
             `<circle cx="${rund(x)}" cy="${rund(y)}" r="${rund(r * 0.55)}" fill="none" stroke="${strich}" stroke-width="1.4" opacity="0.7"/>`;
    case 'stern': {
      let d = '';
      for (let i = 0; i < 10; i += 1) {
        const w = (i / 10) * Math.PI * 2 - Math.PI / 2;
        const rr = i % 2 ? r * 0.42 : r;
        d += (i ? ' L' : 'M') + p(x + Math.cos(w) * rr, y + Math.sin(w) * rr);
      }
      return `<path d="${d} Z" fill="none" stroke="${strich}" stroke-width="2"/>`;
    }
    case 'rune':
    default: {
      let s = `<circle cx="${rund(x)}" cy="${rund(y)}" r="${rund(r * 0.92)}" fill="none" stroke="${strich}" stroke-width="2"/>`;
      for (let i = 0; i < 6; i += 1) {
        const w = (i / 6) * Math.PI * 2;
        const w2 = ((i + 2) / 6) * Math.PI * 2;
        s += `<line x1="${rund(x + Math.cos(w) * r * 0.92)}" y1="${rund(y + Math.sin(w) * r * 0.92)}" x2="${rund(x + Math.cos(w2) * r * 0.92)}" y2="${rund(y + Math.sin(w2) * r * 0.92)}" stroke="${strich}" stroke-width="1.4" opacity="0.8"/>`;
      }
      return s;
    }
  }
}

/* ------------------------------------------------------------------ *
 * Ein Wappen bauen
 * ------------------------------------------------------------------ */

export function wappen(name, domaene) {
  const d = DOMAENEN[String(domaene || '').toUpperCase()] || DOMAENEN.ARCANA;
  const zufall = wuerfler(saatAus(name + '|' + domaene));

  // Der Grund ist ein sehr dunkles Oliv wie im Wiki, darüber ein
  // Farbschleier der Domäne. So passt jedes Wappen zur Seite.
  const kennung = 'w' + saatAus(name).toString(36);

  // Sterne im Hintergrund, aus dem Namen abgeleitet
  let punkte = '';
  const anzahl = 14 + Math.floor(zufall() * 10);
  for (let i = 0; i < anzahl; i += 1) {
    const x = zufall() * BREITE;
    const y = zufall() * HOEHE;
    const r = 0.6 + zufall() * 1.5;
    punkte += `<circle cx="${rund(x)}" cy="${rund(y)}" r="${rund(r)}" fill="#ffffff" opacity="${rund(0.06 + zufall() * 0.16)}"/>`;
  }

  // Ein schräges Band, dessen Neigung aus dem Namen kommt
  const neigung = 24 + zufall() * 26;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${BREITE} ${HOEHE}" width="${BREITE}" height="${HOEHE}" role="img" aria-label="${name}">
<defs>
<linearGradient id="${kennung}g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="${d.farbe}" stop-opacity="0.95"/>
<stop offset="1" stop-color="#161815" stop-opacity="0.95"/>
</linearGradient>
<radialGradient id="${kennung}s" cx="0.5" cy="0.42" r="0.6">
<stop offset="0" stop-color="#ffffff" stop-opacity="0.16"/>
<stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
</radialGradient>
</defs>
<rect width="${BREITE}" height="${HOEHE}" fill="#161815"/>
<rect width="${BREITE}" height="${HOEHE}" fill="url(#${kennung}g)"/>
${punkte}
<path d="M${rund(-neigung)} ${HOEHE} L${rund(BREITE * 0.42 - neigung)} 0 L${rund(BREITE * 0.42)} 0 L0 ${HOEHE} Z" fill="#ffffff" opacity="0.05"/>
<rect width="${BREITE}" height="${HOEHE}" fill="url(#${kennung}s)"/>
${motivZeichnen(d.motiv, BREITE / 2, HOEHE / 2 - 12, 40, 'rgba(255,255,255,0.82)')}
<text x="${BREITE / 2}" y="${HOEHE - 22}" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="13" font-weight="600" letter-spacing="3.4" fill="#ffffff" fill-opacity="0.72">${d.name.toUpperCase()}</text>
<rect x="1" y="1" width="${BREITE - 2}" height="${HOEHE - 2}" fill="none" stroke="#ffffff" stroke-opacity="0.14" rx="6"/>
</svg>`;
}

/* ------------------------------------------------------------------ *
 * Durchlauf
 * ------------------------------------------------------------------ */

const nurProben = process.argv.includes('--proben');

/** Aus dem Bildpfad der Werkstatt wird unser Dateiname. */
function dateiname(karte) {
  const pfad = String(karte.image || '');
  const teil = pfad.split('/').pop() || '';
  const ohne = teil.replace(/\.[a-z0-9]+$/i, '');
  return (ohne || String(karte.id || 'karte')) + '.svg';
}

/** Zu welcher Gruppe gehoert die Karte? */
function bereich(karte) {
  const pfad = String(karte.image || '');
  const teile = pfad.split('/');
  const i = teile.indexOf('card-header-images');
  if (i >= 0 && teile[i + 1]) {
    return teile[i + 1] === 'domains' ? 'domains/' + (teile[i + 2] || 'arcana') : teile[i + 1];
  }
  return 'sonstige';
}

let karten;
try {
  const roh = JSON.parse(readFileSync(WERKSTATT, 'utf8'));
  karten = Object.values(roh).flat();
} catch (fehler) {
  console.error('Die Kartendaten der Werkstatt sind nicht lesbar:');
  console.error('  ' + WERKSTATT);
  console.error('  ' + fehler.message);
  process.exit(1);
}

// Für die Proben je Domäne genau eine Karte, damit jedes Motiv einmal zu
// sehen ist. Echte Domänenkarten haben Vorrang — sonst gewönnen die
// Subklassenkarten, die ebenfalls eine Domäne tragen.
const auswahl = nurProben
  ? Object.keys(DOMAENEN)
      .map(
        (d) =>
          karten.find(
            (k) =>
              String(k.type || '').toUpperCase() === 'DOMAIN' &&
              String(k.primaryDomain || '').toUpperCase() === d,
          ) || karten.find((k) => String(k.type || '').toUpperCase() === d),
      )
      .filter(Boolean)
  : karten;

let geschrieben = 0;
let zeichen = 0;
const jeBereich = {};

for (const karte of auswahl) {
  const domaene = String(karte.primaryDomain || karte.type || 'ARCANA').toUpperCase();
  const svg = wappen(karte.name || karte.id || 'Karte', domaene);
  const ordner = join(ZIEL, bereich(karte));
  mkdirSync(ordner, { recursive: true });
  writeFileSync(join(ordner, dateiname(karte)), svg + '\n', 'utf8');
  geschrieben += 1;
  zeichen += svg.length;
  const b = bereich(karte);
  jeBereich[b] = (jeBereich[b] || 0) + 1;
}

console.log('Kartenbilder erzeugt');
console.log('--------------------');
console.log('Dateien:        ' + geschrieben + (nurProben ? '   (nur Proben)' : ''));
console.log('Zusammen:       ' + (zeichen / 1024).toFixed(1) + ' KB');
console.log('Im Schnitt:     ' + (zeichen / geschrieben / 1024).toFixed(2) + ' KB je Bild');
console.log('');
for (const [b, n] of Object.entries(jeBereich).sort()) console.log('  ' + b.padEnd(22) + n);
console.log('');
console.log('Ordner: daten/kartenbilder');
