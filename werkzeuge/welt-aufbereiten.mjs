/**
 * Wandelt die Rohdaten der Weltenschmiede in das schlanke Wiki-Format um.
 *
 * Ergebnis:
 *   daten/welt.json  – die Daten als reines JSON (gut lesbar, gut vergleichbar)
 *   daten/welt.js    – dieselben Daten als JS-Datei, damit das Wiki auch ohne
 *                      Webserver funktioniert (Doppelklick auf index.html)
 *
 * Wichtig: Das Skript prüft, ob jeder Text aus den Rohdaten im Wiki ankommt.
 * Texte, die in keinem Panel stehen, werden als eigener Abschnitt ergänzt.
 * Am Ende steht eine Bilanz, die genau das belegt.
 *
 * Aufruf:
 *   node werkzeuge/welt-aufbereiten.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = dirname(fileURLToPath(import.meta.url));
const WURZEL = join(HIER, '..');
const QUELLE = process.argv[2] || join(HIER, 'rohdaten-weltenschmiede.json');

/* ------------------------------------------------------------------ *
 * Beschriftungen
 * ------------------------------------------------------------------ */

// Reihenfolge der Kategorien im Wiki
const KATEGORIEN = [
  { schluessel: 'wiki', name: 'Kampagne', einzahl: 'Kampagnenübersicht', zeichen: '◆' },
  { schluessel: 'factions', name: 'Fraktionen', einzahl: 'Fraktion', zeichen: '⚑' },
  { schluessel: 'species', name: 'Spezies', einzahl: 'Spezies', zeichen: '❖' },
  { schluessel: 'characters', name: 'Figuren', einzahl: 'Figur', zeichen: '☗' },
  { schluessel: 'items', name: 'Gegenstände', einzahl: 'Gegenstand', zeichen: '⚔' },
  { schluessel: 'places', name: 'Orte', einzahl: 'Ort', zeichen: '⌂' },
  { schluessel: 'events', name: 'Ereignisse', einzahl: 'Ereignis', zeichen: '✦' },
  { schluessel: 'lore', name: 'Wissen', einzahl: 'Wissenseintrag', zeichen: '✎' },
];

// Deutsche Überschriften für Textfelder, die in keinem Panel stehen
const FELD_UEBERSCHRIFT = {
  biology: 'Biologie und Erscheinung',
  society: 'Gesellschaft',
  notes: 'Ausführliche Beschreibung',
  drive: 'Antrieb',
  resource: 'Mittel und Rückhalt',
  info: 'Hinweis',
  role: 'Rolle',
  secret: 'Geheimnis',
  function: 'Aufbau und Funktion',
  history: 'Geschichte',
  definition: 'Kurzdefinition',
  usage: 'Verwendung',
  motive: 'Beweggrund',
  pressure: 'Druck',
  traits: 'Merkmale',
  source: 'Quelle',
};

// Reihenfolge, in der Zusatztexte angehängt werden
const FELD_REIHENFOLGE = [
  'definition', 'info', 'role', 'notes', 'drive', 'resource',
  'function', 'history', 'biology', 'society', 'traits',
  'motive', 'pressure', 'secret', 'usage', 'source',
];

// Attributschlüssel, deren Wert auf einen anderen Eintrag zeigt
const VERWEIS_FELDER = new Set([
  'leaderId', 'headquartersPlaceId', 'factionId', 'locationId',
  'ownerId', 'residencePlaceId', 'species',
]);

// Diese Schlüssel sind Technik, keine Inhalte
const KEINE_INHALTE = new Set(['connections', 'tags', 'aliases']);

// Woher je Kategorie die Unterart für das Etikett stammt
// (zum Beispiel „SPEZIES · KERN-ABSTAMMUNG")
const UNTERART_FELD = {
  species: ['classification'],
  factions: ['type'],
  items: ['rarity', 'type'],
  characters: ['characterType', 'occupation'],
  // `wiki` bewusst ohne Unterart: Der Kampagneneintrag heißt ohnehin so.
};

// Kürzel aus der Weltenschmiede in lesbare Wörter übersetzen
const UNTERART_KLARTEXT = {
  sc: 'Spielfigur',
  pc: 'Spielfigur',
  npc: 'Nichtspielerfigur',
  nsc: 'Nichtspielerfigur',
};

/* ------------------------------------------------------------------ *
 * Hilfsfunktionen
 * ------------------------------------------------------------------ */

const nurText = (html) =>
  String(html ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();

const vergleichsform = (text) => nurText(text).toLowerCase().replace(/[^\p{L}\p{N} ]/gu, '');

/** Ist `text` inhaltlich schon in `bestand` enthalten? Satzweise geprüft. */
function schonEnthalten(text, bestand) {
  const saetze = vergleichsform(text)
    .split(/(?<=[.!?])\s+|\s{2,}/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);
  if (saetze.length === 0) return vergleichsform(text).length > 0 && bestand.includes(vergleichsform(text));
  const gefunden = saetze.filter((s) => bestand.includes(s)).length;
  return gefunden / saetze.length >= 0.8;
}

/** Erzeugt aus HTML-Text der Weltenschmiede sauberes, sicheres Wiki-HTML. */
function htmlSaeubern(roh) {
  let html = String(roh ?? '').trim();
  if (!html) return '';
  // Skripte, Stile und Ereignis-Attribute entfernen
  html = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript:/gi, '');
  // Nur erlaubte Auszeichnungen behalten. Öffnende und schließende Tags
  // werden getrennt erkannt, damit `</strong>` erhalten bleibt.
  const erlaubt = /^(p|br|strong|b|em|i|u|ul|ol|li|h3|h4|blockquote|code)$/i;
  html = html.replace(/<\s*(\/?)\s*([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g, (treffer, schraegstrich, name) => {
    if (!erlaubt.test(name)) return '';
    return `<${schraegstrich}${name.toLowerCase()}>`;
  });
  // Übrig gebliebene spitze Klammern entfernen
  html = html.replace(/<(?!\/?(?:p|br|strong|b|em|i|u|ul|ol|li|h3|h4|blockquote|code)>)/g, '&lt;');
  return html.replace(/(<p><\/p>)+/g, '').trim();
}

/** Reiner Text ohne Auszeichnung wird zu Absätzen. */
function alsAbsaetze(text) {
  const roh = String(text ?? '').trim();
  if (!roh) return '';
  if (/<\w+/.test(roh)) return htmlSaeubern(roh);
  return roh
    .split(/\n+/)
    .map((zeile) => zeile.trim())
    .filter(Boolean)
    .map((zeile) => `<p>${zeile.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`)
    .join('');
}

/* ------------------------------------------------------------------ *
 * Umwandlung
 * ------------------------------------------------------------------ */

const roh = JSON.parse(readFileSync(QUELLE, 'utf8'));
const rohElemente = roh.elements || {};

// Nachschlagewerk: welche IDs gibt es überhaupt?
const alleIds = new Map();
for (const [kategorie, gruppe] of Object.entries(rohElemente)) {
  for (const [id, element] of Object.entries(gruppe)) {
    alleIds.set(id, { kategorie, name: element.name || id });
  }
}

const bilanz = { panels: 0, zusatztexte: 0, uebersprungen: 0, attribute: 0, verbindungen: 0 };
const eintraege = [];

for (const kategorieInfo of KATEGORIEN) {
  const gruppe = rohElemente[kategorieInfo.schluessel];
  if (!gruppe) continue;

  for (const [id, element] of Object.entries(gruppe)) {
    // --- Panels (Hauptinhalt) ---------------------------------------
    const reihenfolge = Array.isArray(element.panelOrder) ? element.panelOrder : [];
    const panelsRoh = Array.isArray(element.customPanels) ? element.customPanels : [];
    const sortiert = [...panelsRoh].sort((a, b) => {
      const ia = reihenfolge.indexOf(a.id);
      const ib = reihenfolge.indexOf(b.id);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });

    const abschnitte = [];
    for (const panel of sortiert) {
      const teile = (panel.textFields || [])
        .map((feld) => htmlSaeubern(feld.html) || alsAbsaetze(feld.text))
        .filter(Boolean);
      const html = teile.join('') || alsAbsaetze(panel.text);
      if (!html) continue;
      abschnitte.push({ titel: panel.title || '', html });
      bilanz.panels += 1;
    }

    // Alles, was bereits in den Panels steht
    const bestand = vergleichsform(abschnitte.map((a) => a.html).join(' ') + ' ' + (element.description || ''));

    // --- Zusatztexte, die in keinem Panel vorkommen ------------------
    for (const schluessel of FELD_REIHENFOLGE) {
      const wert = element.richText?.[schluessel] ?? element.fields?.[schluessel];
      if (!wert || typeof wert !== 'string' || nurText(wert).length < 15) continue;
      if (schonEnthalten(wert, bestand)) { bilanz.uebersprungen += 1; continue; }
      abschnitte.push({
        titel: FELD_UEBERSCHRIFT[schluessel] || schluessel,
        html: alsAbsaetze(wert),
        ergaenzt: true,
      });
      bilanz.zusatztexte += 1;
    }

    // --- Attributtabelle --------------------------------------------
    const attribute = [];
    for (const zeile of element.attributeRows || []) {
      const schluessel = zeile.key;
      if (!schluessel || KEINE_INHALTE.has(schluessel)) continue;
      const wert = element.fields?.[schluessel];
      if (wert === undefined || wert === null || wert === '') continue;
      const text = nurText(wert);
      if (!text) continue;
      // Die Attributspalte ist schmal. Längere Angaben stehen ohnehin im
      // Fließtext und würden hier nur eine hohe, unlesbare Säule ergeben.
      if (text.length > 110) continue;
      const eintrag = { beschriftung: zeile.label || schluessel, wert: text };
      if (VERWEIS_FELDER.has(schluessel) && alleIds.has(wert)) {
        eintrag.ziel = wert;
        eintrag.wert = alleIds.get(wert).name;
      }
      attribute.push(eintrag);
      bilanz.attribute += 1;
    }

    // --- Verbindungen ------------------------------------------------
    const verbindungen = (element.fields?.connections || [])
      .filter((v) => v && v.targetId && alleIds.has(v.targetId))
      .map((v) => ({ art: v.kind || 'Verbunden', text: v.label || '', ziel: v.targetId }));
    bilanz.verbindungen += verbindungen.length;

    // --- Andere Bezeichnungen ---------------------------------------
    const aliasRoh = element.fields?.aliases;
    const aliase = String(aliasRoh || '')
      .split(/[,;]/)
      .map((a) => a.trim())
      .filter(Boolean);

    // --- Unterart für das Etikett -----------------------------------
    let unterart = '';
    for (const schluessel of UNTERART_FELD[kategorieInfo.schluessel] || []) {
      const roh = nurText(element.fields?.[schluessel]);
      if (!roh) continue;
      const wert = UNTERART_KLARTEXT[roh.toLowerCase()] || roh;
      // Nur kurze Klassifizierungen taugen als Etikett
      if (wert.length > 28) continue;
      // Doppelungen wie „Kampagnenübersicht · Kampagnen-Frame" vermeiden
      const a = vergleichsform(wert);
      const b = vergleichsform(kategorieInfo.einzahl);
      if (a === b || a.startsWith(b) || b.startsWith(a)) continue;
      unterart = wert;
      break;
    }

    eintraege.push({
      id,
      name: element.name || id,
      kategorie: kategorieInfo.schluessel,
      unterart,
      kurz: nurText(element.description),
      aliase,
      quelle: nurText(element.fields?.source || ''),
      attribute,
      abschnitte,
      verbindungen,
      geaendert: element.updatedAt || '',
    });
  }
}

/* ------------------------------------------------------------------ *
 * Wörterbuch für die automatische Verlinkung
 * ------------------------------------------------------------------ */

// Begriffe, die absichtlich NICHT automatisch verlinkt werden.
// `prototyp` ist ein alter Arbeitsalias des Kampagnen-Eintrags. Als Verweis
// wäre er irreführend, weil das Wort im Text etwas anderes meint.
const NICHT_VERLINKEN = new Set(['prototyp']);

const woerterbuch = {};
const ausgeschlossen = [];
const gepflegteBegriffe = new Set();
const eintragen = (begriff, ziel, gepflegt = false) => {
  const schluessel = String(begriff || '').trim().toLowerCase();
  if (schluessel.length < 3) return;
  if (NICHT_VERLINKEN.has(schluessel)) return;
  // Ein bereits belegter Begriff wird nicht überschrieben
  if (woerterbuch[schluessel]) return;
  woerterbuch[schluessel] = ziel;
  if (gepflegt) gepflegteBegriffe.add(schluessel);
};

// 1. Von Jannik in der Weltenschmiede gepflegte Begriffe haben Vorrang
for (const gruppe of Object.values(rohElemente)) {
  for (const element of Object.values(gruppe)) {
    for (const [begriff, verweis] of Object.entries(element.textLinks || {})) {
      if (verweis?.id && alleIds.has(verweis.id)) eintragen(begriff, verweis.id, true);
    }
  }
}

// 2. Mehrdeutige andere Bezeichnungen ermitteln: Ein Alias, den sich mehrere
//    Einträge teilen (zum Beispiel `Elemental Kin`), darf nicht automatisch
//    auf einen davon zeigen.
const aliasZaehler = new Map();
for (const eintrag of eintraege) {
  for (const alias of eintrag.aliase) {
    const schluessel = alias.trim().toLowerCase();
    aliasZaehler.set(schluessel, (aliasZaehler.get(schluessel) || 0) + 1);
  }
}

// 3. Danach Namen und eindeutige andere Bezeichnungen aller Einträge
for (const eintrag of eintraege) {
  eintragen(eintrag.name, eintrag.id);
  for (const alias of eintrag.aliase) {
    const schluessel = alias.trim().toLowerCase();
    if (aliasZaehler.get(schluessel) > 1) {
      if (!ausgeschlossen.includes(alias)) ausgeschlossen.push(alias);
      continue;
    }
    eintragen(alias, eintrag.id);
  }
}

/* ------------------------------------------------------------------ *
 * Schreiben
 * ------------------------------------------------------------------ */

const welt = {
  titel: roh.project?.title || 'Sturmwende',
  untertitel: roh.project?.subtitle || '',
  standDerDaten: roh.updatedAt || '',
  erzeugtAm: new Date().toISOString(),
  kategorien: KATEGORIEN.filter((k) => eintraege.some((e) => e.kategorie === k.schluessel)),
  eintraege,
  woerterbuch,
};

mkdirSync(join(WURZEL, 'daten'), { recursive: true });
const alsJson = JSON.stringify(welt, null, 2);
writeFileSync(join(WURZEL, 'daten', 'welt.json'), alsJson + '\n', 'utf8');
writeFileSync(
  join(WURZEL, 'daten', 'welt.js'),
  '/* Automatisch erzeugt von werkzeuge/welt-aufbereiten.mjs. Nicht von Hand ändern. */\n' +
    'window.STURMWENDE_WELT = ' + alsJson + ';\n',
  'utf8',
);

/* ------------------------------------------------------------------ *
 * Bilanz
 * ------------------------------------------------------------------ */

console.log('Sturmwende-Wiki – Daten aufbereitet');
console.log('-----------------------------------');
console.log(`Stand der Daten:        ${welt.standDerDaten}`);
console.log(`Einträge:               ${eintraege.length}`);
for (const k of welt.kategorien) {
  const n = eintraege.filter((e) => e.kategorie === k.schluessel).length;
  console.log(`   ${k.name.padEnd(18)} ${n}`);
}
console.log(`Abschnitte aus Panels:  ${bilanz.panels}`);
console.log(`Ergänzte Zusatztexte:   ${bilanz.zusatztexte}   (Texte, die in keinem Panel standen)`);
console.log(`Als Dublette erkannt:   ${bilanz.uebersprungen}   (bereits in einem Panel enthalten)`);
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
