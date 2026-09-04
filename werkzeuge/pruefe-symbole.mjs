/**
 * [Aufgabe: Prüfwesen]
 * Prueft die Kategoriesymbole und die Kategoriefarben.
 *
 * Warum es diese Pruefung gibt: Ein Symbol, das eine Kategorie nicht kennt,
 * faellt niemandem auf — die Anzeige nimmt dann stillschweigend das
 * Ersatzsymbol, und zwei Kategorien sehen gleich aus. Genau dieser Fehler
 * waere unsichtbar. Deshalb wird hier gemessen statt angenommen.
 *
 * Kein Browser, kein Netzwerk. Die Symbole laufen in einer VM, die
 * Kategorien kommen aus der Umwandlung, die Farben aus dem Stylesheet.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { KATEGORIEN } from './welt-umwandeln.mjs';

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), '..');

let pruefungen = 0;
const fehler = [];
function pruefe(wert, text) {
  pruefungen += 1;
  if (!wert) fehler.push(text);
}

/* ------------------------------------------------------------------ *
   Die Symbole aus der echten Datei holen
   ------------------------------------------------------------------ */

const quelle = readFileSync(join(WURZEL, 'runtime', 'symbole.js'), 'utf8');
const sandkasten = { window: {} };
vm.createContext(sandkasten);
new vm.Script(quelle, { filename: 'runtime/symbole.js' }).runInContext(sandkasten);

const bausteine = sandkasten.window.__aobLeserBausteine;
pruefe(bausteine && typeof bausteine.symbole === 'function', 'runtime/symbole.js registriert den Baustein `symbole`.');
if (!bausteine || typeof bausteine.symbole !== 'function') {
  console.error('Symbolpruefung fehlgeschlagen:\n- ' + fehler.join('\n- '));
  process.exit(1);
}

const symbole = bausteine.symbole();
const motive = symbole.motive();

/* ------------------------------------------------------------------ *
   1. Jede Kategorie hat ein eigenes Symbol
   ------------------------------------------------------------------ */

for (const kategorie of KATEGORIEN) {
  pruefe(symbole.kennt(kategorie.schluessel), 'Kategorie „' + kategorie.name + '" (' + kategorie.schluessel + ') hat kein eigenes Symbol. Sie bekaeme stillschweigend das Ersatzsymbol.');
}

for (const name of motive) {
  pruefe(KATEGORIEN.some((k) => k.schluessel === name), 'Das Symbol „' + name + '" gehoert zu keiner Kategorie und ist damit tot.');
}

pruefe(motive.length === KATEGORIEN.length, 'Es muss genau ein Symbol je Kategorie geben (' + motive.length + ' Symbole, ' + KATEGORIEN.length + ' Kategorien).');

/* ------------------------------------------------------------------ *
   2. Die Zeichnungen sind gueltig und liegen im Feld
   ------------------------------------------------------------------ */

const sprite = symbole.sprite();
pruefe(sprite.startsWith('<svg') && sprite.endsWith('</svg>'), 'Der Sprite ist ein vollstaendiges SVG-Element.');
pruefe((sprite.match(/<symbol /gu) || []).length === motive.length, 'Der Sprite enthaelt je Kategorie genau ein <symbol>.');
pruefe((sprite.match(/<symbol /gu) || []).length === (sprite.match(/<\/symbol>/gu) || []).length, 'Alle <symbol> im Sprite sind geschlossen.');
pruefe(sprite.includes('aria-hidden="true"'), 'Der Sprite ist fuer Vorlesegeraete ausgeblendet.');

// Alle Pfaddaten aus dem Sprite ziehen und Zahl fuer Zahl nachmessen.
const pfade = [...sprite.matchAll(/<path d="([^"]+)"\/>/gu)].map((f) => f[1]);
pruefe(pfade.length >= motive.length, 'Jedes Symbol besteht aus mindestens einem Pfad.');

const ERLAUBT = /^[MmLlHhVvCcSsQqTtAaZz0-9 .,-]+$/u;

/* Der Pfad wird tatsaechlich abgelaufen, statt nur seine Zahlen anzusehen.
   Das ist noetig, weil Befehle in Kleinschreibung relativ sind: In „h-11"
   ist die -11 keine Koordinate, sondern ein Schritt nach links. Wer die
   Zahlen einzeln prueft, meldet dort einen Fehler, den es nicht gibt.

   Fuer Kurven genuegen Stuetz- und Endpunkte: Eine Bezierkurve verlaesst
   die Huelle ihrer Punkte nie. Das Ergebnis ist damit eine gueltige obere
   Schranke fuer die Ausdehnung der Zeichnung. */
function pfadVermessen(d) {
  // Die Klammer muss auch Zahlen ohne fuehrende Null fassen. Ein Muster,
  // das nur mit einer Ziffer beginnen darf, liest aus „.8" eine 8 — der
  // Punkt faellt weg und die Zeichnung scheint das Feld zu verlassen.
  const teile = d.match(/[MmLlHhVvCcSsQqTtAaZz]|-?(?:\d+\.?\d*|\.\d+)/gu) || [];
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  let befehl = '';
  const punkte = [];
  const setze = (nx, ny) => { x = nx; y = ny; punkte.push([x, y]); };
  let i = 0;
  while (i < teile.length) {
    if (/^[A-Za-z]$/u.test(teile[i])) {
      befehl = teile[i];
      i += 1;
      if (befehl === 'Z' || befehl === 'z') { x = startX; y = startY; }
      continue;
    }
    const zahl = () => Number(teile[i++]);
    const rel = befehl === befehl.toLowerCase();
    const gross = befehl.toUpperCase();
    if (gross === 'M' || gross === 'L' || gross === 'T') {
      const a = zahl();
      const b = zahl();
      setze(rel ? x + a : a, rel ? y + b : b);
      if (gross === 'M') { startX = x; startY = y; befehl = rel ? 'l' : 'L'; }
    } else if (gross === 'H') {
      const a = zahl();
      setze(rel ? x + a : a, y);
    } else if (gross === 'V') {
      const a = zahl();
      setze(x, rel ? y + a : a);
    } else if (gross === 'C') {
      const p = [zahl(), zahl(), zahl(), zahl(), zahl(), zahl()];
      for (let k = 0; k < 6; k += 2) punkte.push([rel ? x + p[k] : p[k], rel ? y + p[k + 1] : p[k + 1]]);
      setze(rel ? x + p[4] : p[4], rel ? y + p[5] : p[5]);
    } else if (gross === 'S' || gross === 'Q') {
      const p = [zahl(), zahl(), zahl(), zahl()];
      for (let k = 0; k < 4; k += 2) punkte.push([rel ? x + p[k] : p[k], rel ? y + p[k + 1] : p[k + 1]]);
      setze(rel ? x + p[2] : p[2], rel ? y + p[3] : p[3]);
    } else if (gross === 'A') {
      const rx = zahl();
      const ry = zahl();
      zahl();
      zahl();
      zahl();
      const ex = zahl();
      const ey = zahl();
      const zielX = rel ? x + ex : ex;
      const zielY = rel ? y + ey : ey;
      // Ein Bogen bleibt im Rechteck um Start und Ziel, erweitert um die Radien.
      punkte.push([Math.min(x, zielX) - rx, Math.min(y, zielY) - ry]);
      punkte.push([Math.max(x, zielX) + rx, Math.max(y, zielY) + ry]);
      setze(zielX, zielY);
    } else {
      i += 1;
    }
  }
  return punkte;
}

let koordinaten = 0;
for (const d of pfade) {
  pruefe(ERLAUBT.test(d), 'Der Pfad „' + d.slice(0, 40) + '…" enthaelt unerlaubte Zeichen.');
  pruefe(/^[Mm]/u.test(d.trim()), 'Jeder Pfad beginnt mit einem Setzbefehl: „' + d.slice(0, 40) + '…"');
  const punkte = pfadVermessen(d);
  pruefe(punkte.length > 0, 'Der Pfad „' + d.slice(0, 40) + '…" zeichnet nichts.');
  koordinaten += punkte.length;
  for (const [px, py] of punkte) {
    pruefe(px >= 0 && px <= 24 && py >= 0 && py <= 24, 'Die Zeichnung verlaesst das 24x24-Feld bei ' + px.toFixed(1) + '/' + py.toFixed(1) + ': „' + d.slice(0, 40) + '…"');
  }
}

/* ------------------------------------------------------------------ *
   3. Keine zwei Kategorien tragen dieselbe Zeichnung
   ------------------------------------------------------------------ */

const zeichnung = new Map();
for (const name of motive) {
  const eines = symbole.symbol(name);
  const kennung = (eines.match(/href="#([^"]+)"/u) || [])[1];
  pruefe(Boolean(kennung), 'Das Symbol „' + name + '" verweist auf eine Kennung im Sprite.');
  pruefe(sprite.includes('id="' + kennung + '"'), 'Die Kennung „' + kennung + '" von „' + name + '" fehlt im Sprite.');

  const block = (sprite.match(new RegExp('<symbol id="' + kennung + '"[^>]*>([\\s\\S]*?)</symbol>', 'u')) || [])[1] || '';
  pruefe(block.length > 0, 'Das Symbol „' + name + '" ist leer.');
  if (zeichnung.has(block)) {
    fehler.push('Die Kategorien „' + zeichnung.get(block) + '" und „' + name + '" tragen dieselbe Zeichnung und waeren nicht zu unterscheiden.');
  }
  pruefungen += 1;
  zeichnung.set(block, name);
}

// Eine unbekannte Kategorie darf nicht abstuerzen, sondern faellt zurueck.
pruefe(symbole.symbol('gibtesnicht').includes('aob-symbol-wiki'), 'Eine unbekannte Kategorie erhaelt das Ersatzsymbol statt eines Fehlers.');
pruefe(!symbole.kennt('gibtesnicht'), 'kennt() meldet unbekannte Kategorien als unbekannt.');

/* ------------------------------------------------------------------ *
   4. Die Farben unterscheiden sich messbar

   Farbabstand in OKLab. Der Raum ist so gebaut, dass gleiche Zahlen-
   abstaende ungefaehr gleichen wahrgenommenen Abstaenden entsprechen —
   in reinem RGB gemessen waere „weit auseinander" eine Behauptung.
   ------------------------------------------------------------------ */

const css = readFileSync(join(WURZEL, 'styles', 'kategorien.css'), 'utf8');
const werkstattCss = readFileSync(join(WURZEL, 'styles', 'werkstatt.css'), 'utf8');
const tokensCss = readFileSync(join(WURZEL, 'styles', 'tokens.css'), 'utf8');

function akzentLesen(text, kategorie, ansicht) {
  // Der helle Block steht hinter `html[data-thema="hell"]`, der dunkle nicht.
  const vorsatz = ansicht === 'hell' ? 'html\\[data-thema="hell"\\] ' : '(?<!hell"\\] )';
  const muster = new RegExp(vorsatz + '\\.kachel\\[data-kategorie="' + kategorie + '"\\][\\s\\S]*?--akzent:\\s*(#[0-9a-f]{6})', 'iu');
  return (text.match(muster) || [])[1] || null;
}

function leitfarbeLesen(ansicht) {
  const muster = ansicht === 'hell'
    ? /html\[data-thema="hell"\]\s*\{[\s\S]*?--akzent:\s*(#[0-9a-f]{6})/iu
    : /:root\s*\{[\s\S]*?--akzent:\s*(#[0-9a-f]{6})/iu;
  return (tokensCss.match(muster) || [])[1] || null;
}

function nachOklab(hex) {
  const zu = (n) => {
    const c = n / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const r = zu(parseInt(hex.slice(1, 3), 16));
  const g = zu(parseInt(hex.slice(3, 5), 16));
  const b = zu(parseInt(hex.slice(5, 7), 16));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return {
    L: 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
  };
}

function abstand(hexA, hexB) {
  const x = nachOklab(hexA);
  const y = nachOklab(hexB);
  return Math.hypot(x.L - y.L, x.a - y.a, x.b - y.b);
}

/* Kontrast nach WCAG. Ein Farbton kann noch so gut unterscheidbar sein —
   wenn er auf seinem Grund nicht lesbar ist, nuetzt das nichts. */
function relLeucht(hex) {
  const zu = (n) => {
    const c = n / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * zu(parseInt(hex.slice(1, 3), 16))
    + 0.7152 * zu(parseInt(hex.slice(3, 5), 16))
    + 0.0722 * zu(parseInt(hex.slice(5, 7), 16));
}

function kontrast(vordergrund, grund) {
  const a = relLeucht(vordergrund);
  const b = relLeucht(grund);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function grundLesen(ansicht) {
  const muster = ansicht === 'hell'
    ? /html\[data-thema="hell"\]\s*\{[\s\S]*?--grund:\s*(#[0-9a-f]{6})/iu
    : /:root\s*\{[\s\S]*?--grund:\s*(#[0-9a-f]{6})/iu;
  return (tokensCss.match(muster) || [])[1] || null;
}

/* Die Schwelle ist bewusst massvoll: Zehn Kategorien in einem Entwurf mit
   engem Helligkeitsband lassen keine grossen Abstaende zu. Sie faengt
   versehentlich doppelt vergebene Toene — die Unterscheidung selbst leistet
   das Symbol. */
const MINDESTABSTAND = 0.08;

/* Lesbarkeit: 4.5:1 ist die uebliche Grenze fuer normalen Text. Die
   Symbole sind zwar Striche, aber die Farbe faerbt auch Etiketten und
   Verweise — deshalb dieselbe Grenze. */
const MINDESTKONTRAST = 4.5;

/* Beide Ansichten werden gemessen. Nur den dunklen Stil zu pruefen waere
   eine Luecke: Die hellen Toene sind eigene Werte und koennen fuer sich
   kollidieren. */
const ergebnis = new Map();
for (const ansicht of ['dunkel', 'hell']) {
  const farben = new Map();
  for (const kategorie of KATEGORIEN) {
    const s = kategorie.schluessel;
    const gefunden = akzentLesen(css, s, ansicht) || akzentLesen(werkstattCss, s, ansicht);
    if (gefunden) { farben.set(s, gefunden); continue; }
    // Kampagne traegt bewusst die Leitfarbe des Wikis.
    if (s === 'wiki') {
      const leitfarbe = leitfarbeLesen(ansicht);
      pruefe(Boolean(leitfarbe), 'Die Leitfarbe der ' + ansicht + 'n Ansicht steht in styles/tokens.css.');
      if (leitfarbe) farben.set(s, leitfarbe);
      continue;
    }
    fehler.push('Kategorie „' + kategorie.name + '" (' + s + ') hat keine eigene Farbe im ' + ansicht + 'n Stil.');
    pruefungen += 1;
  }

  pruefe(farben.size === KATEGORIEN.length, ansicht + ': Jede der ' + KATEGORIEN.length + ' Kategorien hat einen Farbton (gefunden: ' + farben.size + ').');

  let engstesPaar = { abstand: Infinity, a: '', b: '' };
  const namen = [...farben.keys()];
  for (let i = 0; i < namen.length; i += 1) {
    for (let j = i + 1; j < namen.length; j += 1) {
      const d = abstand(farben.get(namen[i]), farben.get(namen[j]));
      if (d < engstesPaar.abstand) engstesPaar = { abstand: d, a: namen[i], b: namen[j] };
      pruefe(d >= MINDESTABSTAND, ansicht + ': Die Farbtoene von „' + namen[i] + '" und „' + namen[j] + '" liegen mit ' + d.toFixed(3) + ' zu dicht beieinander (mindestens ' + MINDESTABSTAND + ').');
    }
  }

  // Lesbarkeit auf dem jeweiligen Grund.
  const grund = grundLesen(ansicht);
  pruefe(Boolean(grund), 'Der Grundton der ' + ansicht + 'n Ansicht steht in styles/tokens.css.');
  let schwaechster = { wert: Infinity, name: '' };
  if (grund) {
    for (const [name, farbe] of farben) {
      const k = kontrast(farbe, grund);
      if (k < schwaechster.wert) schwaechster = { wert: k, name };
      pruefe(k >= MINDESTKONTRAST, ansicht + ': Der Ton von „' + name + '" (' + farbe + ') hat auf dem Grund ' + grund + ' nur ' + k.toFixed(2) + ':1 Kontrast (mindestens ' + MINDESTKONTRAST + ':1).');
    }
  }

  ergebnis.set(ansicht, { ...engstesPaar, kontrast: schwaechster });
}

/* ------------------------------------------------------------------ *
   5. Die alten Schriftzeichen sind nicht mehr die Anzeige

   In den Kategoriedaten steht weiterhin ein `zeichen`. Es darf nicht
   wieder zur Anzeige benutzt werden: Keine der Schriften enthaelt alle
   diese Zeichen, auf manchen Geraeten erscheint ein leeres Kaestchen.
   ------------------------------------------------------------------ */

const ansichten = readFileSync(join(WURZEL, 'runtime', 'ansichten.js'), 'utf8');
pruefe(!ansichten.includes('.zeichen'), 'Die Ansichten duerfen die Schriftzeichen der Kategorien nicht anzeigen — sie fehlen in gaengigen Schriften.');

/* ------------------------------------------------------------------ *
   Ergebnis
   ------------------------------------------------------------------ */

if (fehler.length) {
  console.error('Symbolpruefung fehlgeschlagen:\n- ' + fehler.join('\n- '));
  process.exitCode = 1;
} else {
  console.log('Age-of-Beast-Wiki – Kategoriesymbole geprueft');
  console.log('Pruefungen: ' + pruefungen);
  console.log('Kategorien: ' + KATEGORIEN.length + ', Symbole: ' + motive.length + ', Pfade: ' + pfade.length + ', Koordinaten: ' + koordinaten);
  for (const [ansicht, paar] of ergebnis) {
    console.log('Engster Farbabstand ' + ansicht.padEnd(7) + ': ' + paar.abstand.toFixed(3) + ' zwischen ' + paar.a + ' und ' + paar.b + ' (Schwelle ' + MINDESTABSTAND + ')');
    console.log('Schwaechster Kontrast ' + ansicht.padEnd(6) + ': ' + paar.kontrast.wert.toFixed(2) + ':1 bei ' + paar.kontrast.name + ' (Schwelle ' + MINDESTKONTRAST + ':1)');
  }
  console.log('Ergebnis: jede Kategorie hat ein eigenes Symbol und in beiden Ansichten einen eigenen Farbton.');
}
