/**
 * Einen Browser starten und fernsteuern.  [Aufgabe: Prüfwesen]
 *
 * Herausgeloest aus `pruefe-bogenfarben.mjs`, weil die Datei mit der
 * Begruendung der Umgebungsweiche ueber 500 Zeilen gewachsen war — und
 * weil „einen Browser fahren" ohnehin ein eigenes Thema ist, das die
 * naechste Messung wiederverwenden kann.
 *
 * **Ohne Fremdbibliothek:** Node bringt seit Fassung 22 einen eigenen
 * WebSocket mit, Chrome ein eingebautes Fernsteuerungsprotokoll. Zusammen
 * genuegt das, um eine Seite rechnen zu lassen und das Ergebnis
 * zurueckzuholen. Playwright oder Puppeteer haetten die Regel „null
 * Abhaengigkeiten" gebrochen.
 *
 * ⚠️ Auf einem Bauserver gibt es keinen dieser Browser. `browserPfad()`
 * liefert dann `undefined` und `browserStarten()` wirft mit einer
 * Meldung, die den Fall benennt — der Aufrufer entscheidet, ob das ein
 * Fehler ist oder ein zu ueberspringender Teil.
 */
import { createServer } from 'node:http';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { connect } from 'node:net';
import { randomBytes } from 'node:crypto';
export function browserPfad() {
  return [
    'C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe',
    'C:/Program Files (x86)/BraveSoftware/Brave-Browser/Application/brave.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  ].find((pfad) => existsSync(pfad));
}

/**
 * Ein kleiner Webserver fuer die Messung.
 *
 * `hilfsseite`, `wurzel`, `dateien` und `typen` werden **uebergeben**,
 * nicht importiert: Die Messseite und die Liste der auslieferbaren
 * Dateien gehoeren zu der Pruefung, die misst — dieses Modul soll nichts
 * ueber Bogenfarben wissen. Ein Import von dort waere ein Ringbezug.
 */
/* ⚠️ `seite` und die Ergebnis-ID waren bis zum 04.09.2026 fest auf
   „bogenfarben" verdrahtet — in einem Modul, dessen eigener Kopf
   verspricht, dass die naechste Messung es wiederverwenden kann. Die
   erste Wiederverwendung (`pruefe-filter.mjs`) lief deshalb stumm ins
   404: Der Server lieferte die Messseite nicht aus, der Browser fand
   die ID nie, und die Meldung lautete bloss „kein Messergebnis".

   Die Standardwerte halten die bestehende Messung unveraendert. */
export function starteServer({ hilfsseite, wurzel, dateien, typen,
  seite = '/__aob-bogenfarben.html' }) {
  return new Promise((fertig) => {
    const server = createServer(async (anfrage, antwort) => {
      const adresse = decodeURIComponent((anfrage.url || '/').split('?')[0]);
      if (adresse === seite) {
        antwort.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
        antwort.end(hilfsseite());
        return;
      }
      const relativ = normalize(adresse.replace(/^\/+/, '')).replace(/\\/g, '/');
      if (!dateien.has(relativ)) { antwort.writeHead(404); antwort.end(); return; }
      try {
        const inhalt = await readFile(join(wurzel, relativ));
        antwort.writeHead(200, { 'Content-Type': typen[extname(relativ)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
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

export async function browserStarten(url, ergebnisId = 'aob-bogenfarben-ergebnis') {
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
        const antwort = await cdp.ruf('Runtime.evaluate', { expression: 'document.getElementById(' + JSON.stringify(ergebnisId) + ')?.textContent', returnByValue: true });
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
