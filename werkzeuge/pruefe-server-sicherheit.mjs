/**
 * Prüft die beiden reinen Lese-Server des Wikis.
 *
 * Der Heim-Server wird nur für diesen lokalen Test mit --alle gestartet und
 * direkt danach wieder beendet. Es werden keine Geheimdateien angelegt oder
 * gelesen: Die gesperrten Namen müssen schon vor jedem Dateizugriff 403
 * liefern.
 */

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer, request } from 'node:http';
import { networkInterfaces } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = dirname(fileURLToPath(import.meta.url));
const WURZEL = join(HIER, '..');
const VORSCHAU = join(HIER, 'vorschau-server.mjs');
const HEIM = join(HIER, 'heim-server.mjs');

function warten(ms) {
  return new Promise((erledigt) => setTimeout(erledigt, ms));
}

async function freierPort() {
  const pruefer = createServer();
  await new Promise((erledigt) => pruefer.listen(0, '127.0.0.1', erledigt));
  const adresse = pruefer.address();
  assert.ok(adresse && typeof adresse === 'object', 'Temporärer Testport fehlt.');
  const port = adresse.port;
  await new Promise((erledigt, fehlgeschlagen) => {
    pruefer.close((fehler) => (fehler ? fehlgeschlagen(fehler) : erledigt()));
  });
  return port;
}

function anfrage(port, pfad, methode = 'GET', host = '127.0.0.1') {
  return new Promise((erledigt, fehlgeschlagen) => {
    const aufruf = request({
      host,
      port,
      path: pfad,
      method: methode,
      timeout: 1_500,
    }, (antwort) => {
      const teile = [];
      antwort.on('data', (teil) => teile.push(teil));
      antwort.on('end', () => erledigt({
        status: antwort.statusCode,
        headers: antwort.headers,
        text: Buffer.concat(teile).toString('utf8'),
      }));
    });
    aufruf.on('timeout', () => aufruf.destroy(new Error('Zeitüberschreitung')));
    aufruf.on('error', fehlgeschlagen);
    aufruf.end();
  });
}

async function starten(name, script, argumente = []) {
  const port = await freierPort();
  const kind = spawn(process.execPath, [script, ...argumente], {
    cwd: WURZEL,
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

  let ausgabe = '';
  kind.stdout.on('data', (teil) => { ausgabe += teil; });
  kind.stderr.on('data', (teil) => { ausgabe += teil; });

  for (let versuch = 0; versuch < 80; versuch += 1) {
    if (kind.exitCode !== null) {
      throw new Error(name + ' wurde vor dem Start beendet:\n' + ausgabe);
    }
    try {
      await anfrage(port, '/');
      return { kind, port };
    } catch {
      await warten(100);
    }
  }

  await beenden(kind);
  throw new Error(name + ' antwortet nicht auf dem Testport.\n' + ausgabe);
}

async function beenden(kind) {
  if (!kind || kind.exitCode !== null) return;
  kind.kill('SIGTERM');
  for (let versuch = 0; versuch < 40 && kind.exitCode === null; versuch += 1) {
    await warten(50);
  }
  if (kind.exitCode === null) {
    kind.kill('SIGKILL');
    for (let versuch = 0; versuch < 40 && kind.exitCode === null; versuch += 1) {
      await warten(50);
    }
  }
}

function lokaleNetzadresse() {
  for (const eintraege of Object.values(networkInterfaces())) {
    for (const eintrag of eintraege || []) {
      if (eintrag.family === 'IPv4' && !eintrag.internal && eintrag.address !== '127.0.0.1') {
        return eintrag.address;
      }
    }
  }
  return null;
}

async function antwortErwarten(port, pfad, methode, status) {
  const antwort = await anfrage(port, pfad, methode);
  assert.equal(antwort.status, status, methode + ' ' + pfad + ' muss HTTP ' + status + ' liefern.');
  return antwort;
}

async function serverPruefen(name, port) {
  const oeffentlicheDateien = [
    '/',
    '/stil.css',
    '/wiki.js',
    '/bearbeiten.js',
    '/bearbeiten-kontext.js',
    '/texte-bearbeiten.js',
    '/struktur-bedienung.js',
    '/rahmen-assistent.js',
    '/daten/welt.js',
    '/daten/rahmen-felder.json',
    '/daten/kartenbilder/ancestry/clank.svg',
    '/werkzeuge/welt-dateien.mjs',
    '/werkzeuge/welt-umwandeln.mjs',
    '/werkzeuge/bearbeiten-stellen.mjs',
    '/werkzeuge/text-schreibweise.mjs',
    '/werkzeuge/struktur-bearbeiten.mjs',
    '/werkzeuge/github-speicher.mjs',
  ];

  for (const pfad of oeffentlicheDateien) {
    const antwort = await antwortErwarten(port, pfad, 'GET', 200);
    assert.ok(antwort.headers['content-type'], name + ' liefert für ' + pfad + ' keinen Content-Type.');
  }

  const seite = await antwortErwarten(port, '/index.html', 'GET', 200);
  const kopf = await antwortErwarten(port, '/index.html', 'HEAD', 200);
  assert.equal(kopf.text, '', name + ' darf bei HEAD keinen Body senden.');
  assert.equal(kopf.headers['content-type'], seite.headers['content-type'], name + ' setzt bei HEAD den falschen Content-Type.');
  assert.equal(kopf.headers['content-length'], seite.headers['content-length'], name + ' setzt bei HEAD die falsche Content-Length.');
  assert.equal(kopf.headers['cache-control'], seite.headers['cache-control'], name + ' setzt bei HEAD die falsche Cache-Regel.');

  const post = await antwortErwarten(port, '/index.html', 'POST', 405);
  assert.equal(post.headers.allow, 'GET, HEAD', name + ' muss den Allow-Header setzen.');

  for (const pfad of [
    '/.env',
    '/.env.local',
    '/.git/config',
    '/.claude/einstellungen.json',
    '/daten/.versteckt',
    '/lokale-credentials.json',
    '/lokale-adc.json',
    '/README.md',
    '/daten/quelle.json',
    '/werkzeuge/vorschau-server.mjs',
    '/%2e%2e%2f.env',
    '/%2e%2e%5c.env',
  ]) {
    await antwortErwarten(port, pfad, 'GET', 403);
  }

  await antwortErwarten(port, '/nicht-vorhandene-datei.txt', 'GET', 404);
}

async function vorschauNurLokalPruefen(port) {
  const adresse = lokaleNetzadresse();
  if (!adresse) {
    console.log('Vorschau-Bindung: keine zweite IPv4-Adresse vorhanden, nur Loopback-Anfrage geprüft.');
    return;
  }

  try {
    const antwort = await anfrage(port, '/', 'GET', adresse);
    assert.notEqual(antwort.status, 200, 'Vorschau darf nicht über die externe IPv4-Adresse antworten.');
  } catch {
    // Eine abgewiesene Verbindung ist das erwartete Ergebnis für Loopback.
  }
}

async function ausfuehren() {
  let vorschau;
  let heim;
  try {
    vorschau = await starten('Vorschau-Server', VORSCHAU);
    await serverPruefen('Vorschau-Server', vorschau.port);
    await vorschauNurLokalPruefen(vorschau.port);
    console.log('Vorschau-Server: Zugriff, Sperren, Methoden und Loopback geprüft.');

    heim = await starten('Heim-Server', HEIM, ['--alle']);
    await serverPruefen('Heim-Server', heim.port);
    console.log('Heim-Server: Zugriff, Sperren und Methoden geprüft.');
  } finally {
    await beenden(heim?.kind);
    await beenden(vorschau?.kind);
  }

  console.log('Age-of-Beast-Wiki – Serversicherheit geprüft');
}

try {
  await ausfuehren();
} catch (fehler) {
  console.error('Serversicherheitsprüfung fehlgeschlagen:', fehler.message);
  process.exitCode = 1;
}
