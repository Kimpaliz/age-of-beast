/* ===================================================================
   Age of Beast – Bogenfarben prüfen
   [Aufgabe: Prüfwesen]

   -------------------------------------------------------------------
   `getComputedStyle()` darf für color-mix() OKLab zurückgeben, und ein
   Span hat meist keinen eigenen Grund. Der Wächter löst deshalb jede
   Vorder- und Hintergrundfarbe im Chromium über eine echte 1×1-
   Zeichenfläche auf und setzt durchsichtige Hintergründe bis zum Bogen
   zusammen. So wird kein OKLab-Wert versehentlich als Schwarz gelesen.
   =================================================================== */

import { createServer } from 'node:http';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { connect } from 'node:net';
import { randomBytes } from 'node:crypto';

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), '..');
const BOGEN = join(WURZEL, 'bogen.html');
const STIL = join(WURZEL, 'styles', 'charakterbogen.css');
const ZEICHNER = join(WURZEL, 'karte', 'bogen-zeigen.js');
/* ⚠️ **0,05 statt der 0,08 aus `pruefe-symbole.mjs` — und das ist eine
   Entscheidung, keine Nachlaessigkeit.** Zwei Gruende, beide nachpruefbar:

   1. **Die Farben sind aus den Domaenen abgeleitet, nicht frei gewaehlt.**
      Ranger (Bone + Sage) und Warrior (Blade + Bone) teilen sich eine
      Domaene; ihre Toene koennen gar nicht weit auseinanderliegen, ohne
      die Herkunft aufzugeben. Gemessen sind es 0,069 (dunkel) und 0,054
      (hell) — mit 0,08 waere die Ableitung nicht zu halten.
   2. **Man sieht immer nur einen Bogen.** Seit dem 04.09.2026 zeigt
      `bogen.html` eine Figur je Seite. Die neun Kategoriesymbole stehen
      dagegen nebeneinander in einem Raster — dort muss man sie im
      direkten Vergleich trennen koennen, hier nicht.

   Dazu traegt jeder Bogen seine Klasse **ausgeschrieben**: Die Farbe ist
   Schmuck und Wiedererkennung, nie der einzige Traeger einer Aussage. */
const MINDESTABSTAND = 0.05;
const MINDESTKONTRAST = 4.5;
const MINDESTKONTRAST_GROSS = 3;
const BEWEIS_ROT = process.argv.includes('--beweis-rot');
const KLASSEN = [
  ['bard', 'Bard', 'Grace', 'Codex'],
  ['druid', 'Druid', 'Arcana', 'Sage'],
  ['guardian', 'Guardian', 'Valor', 'Blade'],
  ['ranger', 'Ranger', 'Bone', 'Sage'],
  ['rogue', 'Rogue', 'Midnight', 'Grace'],
  ['seraph', 'Seraph', 'Splendor', 'Valor'],
  ['sorcerer', 'Sorcerer', 'Arcana', 'Midnight'],
  ['warrior', 'Warrior', 'Blade', 'Bone'],
  ['wizard', 'Wizard', 'Codex', 'Splendor'],
];
const DATEIEN = new Set([
  'bogen.html', 'stil.css', 'daten/welt.js', 'runtime/favoriten.js',
  'styles/tokens.css', 'styles/wiki.css', 'styles/bearbeiten.css',
  'styles/werkstatt.css', 'styles/kategorien.css', 'styles/charakterbogen.css',
  'karte/bogen-zeigen.js', 'karte/kartenblase.js', 'karte/karten-daten.js',
  'daten/daggerheart-karten.json', 'daten/daggerheart-gegenstaende.json',
]);
const TYPEN = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8' };
let pruefungen = 0;
const fehler = [];

function pruefe(wert, text) {
  pruefungen += 1;
  if (!wert) fehler.push(text);
}

function oklab([r, g, b]) {
  const linear = (wert) => {
    const v = wert / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const rot = linear(r), gruen = linear(g), blau = linear(b);
  const l = Math.cbrt(0.4122214708 * rot + 0.5363325363 * gruen + 0.0514459929 * blau);
  const m = Math.cbrt(0.2119034982 * rot + 0.6806995451 * gruen + 0.1073969566 * blau);
  const s = Math.cbrt(0.0883024619 * rot + 0.2817188376 * gruen + 0.6299787005 * blau);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function abstand(links, rechts) {
  const a = oklab(links), b = oklab(rechts);
  return Math.hypot(...a.map((wert, index) => wert - b[index]));
}

function kontrast(links, rechts) {
  const leuchtkraft = ([r, g, b]) => {
    const linear = (wert) => {
      const v = wert / 255;
      return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
  };
  const a = leuchtkraft(links), b = leuchtkraft(rechts);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function hex(farbe) {
  return '#' + farbe.map((wert) => Math.round(wert).toString(16).padStart(2, '0')).join('');
}

function browserPfad() {
  return [
    'C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe',
    'C:/Program Files (x86)/BraveSoftware/Brave-Browser/Application/brave.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  ].find((pfad) => existsSync(pfad));
}

function hilfsseite() {
  return `<!doctype html><meta charset="utf-8"><title>Bogenfarben messen</title>
<pre id="aob-bogenfarben-ergebnis">wartet</pre><iframe id="bogen" aria-hidden="true"></iframe>
<script>
const KLASSEN = ${JSON.stringify(KLASSEN)};
const ausgabe = document.getElementById('aob-bogenfarben-ergebnis');
const rahmen = document.getElementById('bogen');
rahmen.style.cssText = 'width:1280px;height:900px;border:0;position:absolute;left:-2000px';

function pause() { return new Promise((fertig) => requestAnimationFrame(() => requestAnimationFrame(fertig))); }
function warteAuf(test, nachricht) {
  return new Promise((fertig, kaputt) => {
    const ende = Date.now() + 12000;
    const pruefen = () => test() ? fertig() : Date.now() > ende ? kaputt(new Error(nachricht)) : setTimeout(pruefen, 25);
    pruefen();
  });
}
async function lade(id) {
  const fertig = new Promise((auflosen, ablehnen) => {
    const zeit = setTimeout(() => ablehnen(new Error('Der Bogen für ' + id + ' lädt nicht.')), 12000);
    rahmen.addEventListener('load', () => { clearTimeout(zeit); auflosen(); }, { once: true });
  });
  rahmen.src = '/bogen.html?figur=' + encodeURIComponent(id);
  await fertig;
  await warteAuf(() => Boolean(rahmen.contentDocument?.querySelector('.bogen')), 'Der Bogen für ' + id + ' wird nicht gezeichnet.');
}
function flaeche(dokument) {
  const canvas = dokument.createElement('canvas');
  canvas.width = canvas.height = 1;
  return canvas.getContext('2d', { willReadFrequently: true });
}
function loese(zeichenflaeche, farbe) {
  /* Das Canvas ist absichtlich 1×1: Es benutzt Chromiums Farbparser auch
     für color-mix(in oklab, …), ohne Flächen- oder Kanteneffekte. */
  zeichenflaeche.clearRect(0, 0, 1, 1);
  zeichenflaeche.fillStyle = 'rgb(1, 2, 3)';
  const vorher = zeichenflaeche.fillStyle;
  zeichenflaeche.fillStyle = farbe;
  if (zeichenflaeche.fillStyle === vorher && farbe !== vorher) throw new Error('Farbe nicht auflösbar: ' + farbe);
  zeichenflaeche.fillRect(0, 0, 1, 1);
  return Array.from(zeichenflaeche.getImageData(0, 0, 1, 1).data);
}
function ueber(vorne, hinten) {
  const alpha = vorne[3] / 255;
  const unten = hinten[3] / 255;
  const gesamt = alpha + unten * (1 - alpha);
  if (!gesamt) return [0, 0, 0, 0];
  return [
    (vorne[0] * alpha + hinten[0] * unten * (1 - alpha)) / gesamt,
    (vorne[1] * alpha + hinten[1] * unten * (1 - alpha)) / gesamt,
    (vorne[2] * alpha + hinten[2] * unten * (1 - alpha)) / gesamt,
    gesamt * 255,
  ];
}
function hintergrund(element, bogen, stil, zeichenflaeche) {
  const schichten = [];
  let bild = '';
  for (let aktuell = element; aktuell; aktuell = aktuell.parentElement) {
    const regel = stil(aktuell);
    schichten.push(loese(zeichenflaeche, regel.backgroundColor));
    if (regel.backgroundImage !== 'none') bild = regel.backgroundImage;
    if (aktuell === bogen) break;
  }
  let wert = [0, 0, 0, 0];
  for (let index = schichten.length - 1; index >= 0; index -= 1) wert = ueber(schichten[index], wert);
  if (wert[3] < 254) throw new Error('Kein deckender Hintergrund für ' + element.className + '.');
  if (bild) throw new Error('Ein Text liegt auf einem Hintergrundbild: ' + bild + '.');
  return wert.slice(0, 3);
}
function gross(stil) {
  const groesse = Number.parseFloat(stil.fontSize) || 0;
  const gewicht = Number.parseInt(stil.fontWeight, 10) || 400;
  return groesse >= 24 || (gewicht >= 700 && groesse >= 18.67);
}
function textstellen(dokument) {
  const bogen = dokument.querySelector('.bogen');
  const stil = dokument.defaultView.getComputedStyle;
  const zeichenflaeche = flaeche(dokument);
  const gruppen = new Map();
  for (const element of bogen.querySelectorAll('*')) {
    if (![...element.childNodes].some((kind) => kind.nodeType === Node.TEXT_NODE && kind.textContent.trim())) continue;
    const regel = stil(element);
    if (regel.display === 'none' || regel.visibility === 'hidden') continue;
    const grund = hintergrund(element, bogen, stil, zeichenflaeche);
    const roh = loese(zeichenflaeche, regel.color);
    const vorn = ueber(roh, [...grund, 255]).slice(0, 3);
    const istGross = gross(regel);
    const schluessel = vorn.map(Math.round).join(',') + '|' + grund.map(Math.round).join(',') + '|' + istGross;
    const vorhanden = gruppen.get(schluessel);
    if (vorhanden) { vorhanden.anzahl += 1; continue; }
    gruppen.set(schluessel, {
      element: element.tagName.toLowerCase() + (element.className ? '.' + String(element.className).split(/\\s+/)[0] : ''),
      text: element.textContent.trim().replace(/\\s+/g, ' ').slice(0, 52),
      anzahl: 1, vorn, grund, mindest: istGross ? 3 : 4.5,
    });
  }
  return [...gruppen.values()];
}
function klassenfarben(dokument) {
  const bogen = dokument.querySelector('.bogen');
  const zeichenflaeche = flaeche(dokument);
  const stil = dokument.defaultView.getComputedStyle;
  const farben = {};
  for (const [schluessel, name] of KLASSEN) {
    const probe = dokument.createElement('article');
    probe.className = 'bogen'; probe.dataset.klasse = schluessel;
    probe.style.cssText = 'position:fixed;left:-10px;top:-10px;width:1px;height:1px;padding:0;border:0';
    bogen.parentElement.append(probe);
    farben[name] = loese(zeichenflaeche, stil(probe).getPropertyValue('--bogen-akzent')).slice(0, 3);
    probe.remove();
  }
  return farben;
}
async function messen() {
  await lade('');
  const erstesFenster = rahmen.contentWindow;
  const figuren = erstesFenster.AGE_OF_BEAST_WELT.eintraege.filter((eintrag) => eintrag.spielwerte).map((eintrag) => eintrag.id);
  const ergebnis = { figuren, schemata: {} };
  for (const thema of ['dunkel', 'hell']) {
    const schema = { farben: null, texte: {} };
    for (const figur of figuren) {
      await lade(figur);
      const dokument = rahmen.contentDocument;
      dokument.documentElement.dataset.thema = thema;
      await pause();
      if (!schema.farben) schema.farben = klassenfarben(dokument);
      schema.texte[figur] = textstellen(dokument);
    }
    ergebnis.schemata[thema] = schema;
  }
  return ergebnis;
}
messen().then((wert) => { ausgabe.textContent = btoa(unescape(encodeURIComponent(JSON.stringify(wert)))); })
  .catch((grund) => { ausgabe.textContent = btoa(unescape(encodeURIComponent(JSON.stringify({ fehler: [grund.message] })))); });
</script>`;
}

function starteServer() {
  return new Promise((fertig) => {
    const server = createServer(async (anfrage, antwort) => {
      const adresse = decodeURIComponent((anfrage.url || '/').split('?')[0]);
      if (adresse === '/__aob-bogenfarben.html') {
        antwort.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
        antwort.end(hilfsseite());
        return;
      }
      const relativ = normalize(adresse.replace(/^\/+/, '')).replace(/\\/g, '/');
      if (!DATEIEN.has(relativ)) { antwort.writeHead(404); antwort.end(); return; }
      try {
        const inhalt = await readFile(join(WURZEL, relativ));
        antwort.writeHead(200, { 'Content-Type': TYPEN[extname(relativ)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
        antwort.end(inhalt);
      } catch { antwort.writeHead(404); antwort.end(); }
    });
    server.listen(0, '127.0.0.1', () => fertig(server));
  });
}

function warte(ms) { return new Promise((fertig) => setTimeout(fertig, ms)); }

async function cdpOeffnen(adresse) {
  const url = new URL(adresse);
  const socket = connect(Number(url.port), url.hostname);
  const wartend = new Map();
  let puffer = Buffer.alloc(0), offen = false, kennung = 0;
  const schliessen = (grund) => {
    for (const antwort of wartend.values()) antwort.reject(grund);
    wartend.clear();
  };
  const rahmen = (text) => {
    const roh = Buffer.from(text);
    const maske = randomBytes(4);
    const kopf = roh.length < 126 ? Buffer.from([0x81, 0x80 | roh.length])
      : roh.length < 65536 ? Buffer.from([0x81, 0xfe, roh.length >> 8, roh.length & 255])
        : Buffer.from([0x81, 0xff, 0, 0, 0, 0, (roh.length >>> 24) & 255, (roh.length >>> 16) & 255, (roh.length >>> 8) & 255, roh.length & 255]);
    const kodiert = Buffer.from(roh.map((wert, index) => wert ^ maske[index % 4]));
    socket.write(Buffer.concat([kopf, maske, kodiert]));
  };
  const verarbeiten = () => {
    if (!offen) {
      const ende = puffer.indexOf('\r\n\r\n');
      if (ende < 0) return;
      if (!puffer.subarray(0, ende).toString('utf8').includes(' 101 ')) throw new Error('DevTools verweigert WebSocket.');
      puffer = puffer.subarray(ende + 4); offen = true;
    }
    while (puffer.length >= 2) {
      const opcode = puffer[0] & 15;
      let laenge = puffer[1] & 127, stelle = 2;
      if (laenge === 126) { if (puffer.length < 4) return; laenge = puffer.readUInt16BE(2); stelle = 4; }
      if (laenge === 127) { if (puffer.length < 10) return; laenge = Number(puffer.readBigUInt64BE(2)); stelle = 10; }
      if (puffer.length < stelle + laenge) return;
      const daten = puffer.subarray(stelle, stelle + laenge); puffer = puffer.subarray(stelle + laenge);
      if (opcode === 9) { socket.write(Buffer.from([0x8a, daten.length, ...daten])); continue; }
      if (opcode !== 1) continue;
      const nachricht = JSON.parse(daten.toString('utf8'));
      const antwort = wartend.get(nachricht.id);
      if (!antwort) continue;
      wartend.delete(nachricht.id);
      if (nachricht.error) antwort.reject(new Error(nachricht.error.message)); else antwort.resolve(nachricht.result);
    }
  };
  await new Promise((fertig, kaputt) => {
    const beimDaten = (daten) => {
      try { puffer = Buffer.concat([puffer, daten]); verarbeiten(); if (offen) { socket.off('data', beimDaten); fertig(); } }
      catch (grund) { socket.off('data', beimDaten); kaputt(grund); }
    };
    socket.once('connect', () => {
      socket.write('GET ' + (url.pathname + url.search) + ' HTTP/1.1\r\nHost: ' + url.host + '\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: ' + randomBytes(16).toString('base64') + '\r\nSec-WebSocket-Version: 13\r\n\r\n');
    });
    socket.on('data', beimDaten);
    socket.once('error', kaputt);
  });
  socket.on('data', (daten) => { try { if (offen) { puffer = Buffer.concat([puffer, daten]); verarbeiten(); } } catch (grund) { schliessen(grund); } });
  socket.on('close', () => schliessen(new Error('DevTools-Verbindung wurde geschlossen.')));
  return {
    ruf(methode, parameter = {}) {
      const id = ++kennung;
      return new Promise((resolve, reject) => { wartend.set(id, { resolve, reject }); rahmen(JSON.stringify({ id, method: methode, params: parameter })); });
    },
    schliessen() { socket.end(); },
  };
}

async function browserStarten(url) {
  const programm = browserPfad();
  if (!programm) throw new Error('Weder Chrome noch Edge wurden gefunden.');
  const profil = mkdtempSync(join(tmpdir(), 'aob-bogenfarben-'));
  const kind = spawn(programm, [
    '--headless=new', '--no-first-run', '--force-color-profile=srgb', '--use-gl=angle', '--use-angle=swiftshader',
    '--no-sandbox', '--disable-gpu-sandbox', '--disable-background-timer-throttling', '--window-size=1280,900',
    '--remote-debugging-port=0', '--remote-allow-origins=*', '--user-data-dir=' + profil,
  ], { windowsHide: true, stdio: 'ignore' });
  try {
    let port;
    for (let versuch = 0; versuch < 160; versuch += 1) {
      const aktiv = join(profil, 'DevToolsActivePort');
      if (existsSync(aktiv)) { port = Number(readFileSync(aktiv, 'utf8').split(/\r?\n/u)[0]); break; }
      await warte(25);
    }
    if (!port) throw new Error('Chromium öffnet keinen DevTools-Port.');
    let ziel;
    for (let versuch = 0; versuch < 120 && !ziel; versuch += 1) {
      try {
        const ziele = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json();
        ziel = ziele.find((eintrag) => eintrag.type === 'page');
      } catch { /* Der DevTools-HTTP-Endpunkt startet unmittelbar nach dem Port. */ }
      if (!ziel) await warte(25);
    }
    if (!ziel?.webSocketDebuggerUrl) throw new Error('Chromium meldet keine Messseite.');
    const cdp = await cdpOeffnen(ziel.webSocketDebuggerUrl);
    try {
      await cdp.ruf('Page.navigate', { url });
      for (let versuch = 0; versuch < 600; versuch += 1) {
        const antwort = await cdp.ruf('Runtime.evaluate', { expression: 'document.getElementById("aob-bogenfarben-ergebnis")?.textContent', returnByValue: true });
        const text = antwort.result?.value;
        if (text && text !== 'wartet') return JSON.parse(Buffer.from(text, 'base64').toString('utf8'));
        await warte(25);
      }
      throw new Error('Chromium gab innerhalb von 15 Sekunden kein Messergebnis aus.');
    } finally { cdp.schliessen(); }
  } finally {
    if (kind.exitCode === null) kind.kill();
    for (let versuch = 0; versuch < 40 && kind.exitCode === null; versuch += 1) await warte(25);
    rmSync(profil, { recursive: true, force: true });
  }
}

async function messen() {
  const server = await starteServer();
  try {
    const port = server.address().port;
    const ergebnis = await browserStarten('http://127.0.0.1:' + port + '/__aob-bogenfarben.html');
    if (ergebnis.fehler?.length) throw new Error(ergebnis.fehler.join(' '));
    return ergebnis;
  } finally {
    await new Promise((fertig) => server.close(fertig));
  }
}

function statikPruefen() {
  const css = existsSync(STIL) ? readFileSync(STIL, 'utf8') : '';
  const zeichner = existsSync(ZEICHNER) ? readFileSync(ZEICHNER, 'utf8') : '';
  pruefe(existsSync(BOGEN), 'bogen.html ist vorhanden.');
  pruefe(css.includes('--akzent: var(--bogen-akzent);'), 'Der Bogen überschreibt die Akzentvariablen wie die Kategorien.');
  for (const [schluessel, name, erste, zweite] of KLASSEN) {
    const regel = new RegExp('\\.bogen\\[data-klasse="' + schluessel + '"\\]\\s*\\{([^}]*)\\}', 'u').exec(css)?.[1] || '';
    pruefe(Boolean(regel), name + ' besitzt eine eigene Klassenregel.');
    pruefe(regel.includes('--bogen-domäne-' + erste.toLowerCase()) && regel.includes('--bogen-domäne-' + zweite.toLowerCase()),
      name + ' leitet den Ton aus ' + erste + ' und ' + zweite + ' ab.');
    pruefe(zeichner.includes("'" + [erste, zweite].sort().join('|') + "', '" + schluessel + "'"),
      name + ' wird aus seinem Domänenpaar in den Bogen übertragen.');
  }
}

function auswerten(ergebnis) {
  pruefe(ergebnis.figuren.length === 2, 'bogen.html zeigt genau zwei Figuren (gefunden: ' + ergebnis.figuren.length + ').');
  const ausgabe = {};
  for (const thema of ['dunkel', 'hell']) {
    const schema = ergebnis.schemata[thema];
    let engster = { wert: Infinity, a: '', b: '' };
    for (const [a, farbeA] of Object.entries(schema.farben)) for (const [b, farbeB] of Object.entries(schema.farben)) {
      if (a >= b) continue;
      const wert = abstand(farbeA, farbeB);
      if (wert < engster.wert) engster = { wert, a, b };
      pruefe(wert >= MINDESTABSTAND, thema + ': ' + a + ' und ' + b + ' liegen mit ' + wert.toFixed(3) + ' unter ' + MINDESTABSTAND + ' OKLab-Abstand.');
    }
    let schwaechster = { wert: Infinity, figur: '', stelle: null };
    for (const [figur, stellen] of Object.entries(schema.texte)) for (const stelle of stellen) {
      const wert = kontrast(stelle.vorn, stelle.grund);
      if (wert < schwaechster.wert) schwaechster = { wert, figur, stelle };
      pruefe(wert >= stelle.mindest,
        thema + ': ' + figur + ' – ' + stelle.element + ' „' + stelle.text + '“ (' + stelle.anzahl + ' gleiche Textstelle(n)) hat ' + wert.toFixed(2) + ':1 statt ' + stelle.mindest + ':1 (Vordergrund ' + hex(stelle.vorn) + ', Hintergrund ' + hex(stelle.grund) + ').');
    }
    const naechste = {};
    for (const [name, farbe] of Object.entries(schema.farben)) {
      let bester = { wert: Infinity, name: '' };
      for (const [andererName, andereFarbe] of Object.entries(schema.farben)) {
        if (name === andererName) continue;
        const wert = abstand(farbe, andereFarbe);
        if (wert < bester.wert) bester = { wert, name: andererName };
      }
      naechste[name] = bester;
    }
    ausgabe[thema] = { engster, schwaechster, farben: schema.farben, naechste };
  }
  return ausgabe;
}

try {
  statikPruefen();
  if (BEWEIS_ROT) {
    pruefe(abstand([35, 35, 35], [35, 35, 35]) >= MINDESTABSTAND,
      'Beweisrot: zwei absichtlich identische Klassenfarben unterschreiten die OKLab-Schwelle.');
  } else if (!fehler.length) {
    const messung = auswerten(await messen());
    if (!fehler.length) {
      console.log('Age-of-Beast-Wiki – Bogenfarben geprüft');
      console.log('Prüfungen: ' + pruefungen);
      for (const thema of ['dunkel', 'hell']) {
        const wert = messung[thema];
        console.log('Engster OKLab-Abstand ' + thema + ': ' + wert.engster.wert.toFixed(3) + ' zwischen ' + wert.engster.a + ' und ' + wert.engster.b + ' (Schwelle ' + MINDESTABSTAND + ').');
        console.log('Schwächster Textkontrast ' + thema + ': ' + wert.schwaechster.wert.toFixed(2) + ':1 bei ' + wert.schwaechster.figur + ' – ' + wert.schwaechster.stelle.element + ' (Schwelle ' + wert.schwaechster.stelle.mindest + ':1).');
        for (const [name, farbe] of Object.entries(wert.farben)) {
          const naechste = wert.naechste[name];
          console.log('Farbe ' + thema + ' ' + name + ': ' + hex(farbe) + '; nächster Abstand ' + naechste.wert.toFixed(3) + ' zu ' + naechste.name + '.');
        }
      }
    }
  }
} catch (grund) {
  fehler.push('Die Browsermessung konnte nicht laufen: ' + (grund?.message || String(grund)));
}

if (fehler.length) {
  console.error('Bogenfarbenprüfung fehlgeschlagen:\n- ' + fehler.join('\n- '));
  process.exitCode = 1;
}
