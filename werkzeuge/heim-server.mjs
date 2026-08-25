/**
 * Liefert das Wiki im eigenen NetBird-Netz aus.
 *
 * Damit ist das Wiki von Janniks Handy und anderen eingetragenen Geräten
 * erreichbar, solange dieser PC läuft — ohne Internet, ohne Portfreigabe
 * am Router, ohne Kosten.
 *
 * SICHERHEIT — vier Maßnahmen, jede mit Grund:
 *
 *   1. Der Server lauscht ausschliesslich auf der NetBird-Adresse, nicht
 *      auf 0.0.0.0. Damit ist er weder aus dem Heimnetz noch aus dem
 *      Internet erreichbar, sondern nur über das verschlüsselte
 *      NetBird-Netz. Wer nicht als Gerät eingetragen ist, kommt gar nicht
 *      erst an den Server heran.
 *
 *   2. Nur Lesen. GET und HEAD werden beantwortet, alles andere mit
 *      HTTP 405 abgewiesen. Der Server kann nichts verändern, auch nicht
 *      bei einem Fehler in seinem eigenen Code.
 *
 *   3. Kein Ausbrechen aus dem Ordner. Jeder angefragte Pfad wird
 *      aufgelöst und muss unterhalb der Wurzel liegen. Sonst 403.
 *      Ohne diese Prüfung könnte `../../` beliebige Dateien des PCs
 *      ausliefern.
 *
 *   4. Keine Ordnerlisten. Wer ein Verzeichnis anfragt, bekommt dessen
 *      `index.html` oder nichts.
 *
 * WAS DIESER SERVER NICHT TUT: bearbeiten. Gespeichert wird weiterhin
 * nach GitHub. Würde dieser Server auch schreiben, gäbe es zwei Stände —
 * einen hier, einen auf GitHub — und niemanden, der sie zusammenführt.
 * Genau dieser Fehler ist bei der Weltenschmiede schon einmal passiert.
 *
 * Aufruf:
 *   node werkzeuge/heim-server.mjs
 *   node werkzeuge/heim-server.mjs --alle     (auch im Heimnetz sichtbar)
 */

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { networkInterfaces } from 'node:os';
import { dirname, join, normalize, resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = dirname(fileURLToPath(import.meta.url));
const WURZEL = resolve(join(HIER, '..'));
const PORT = Number(process.env.PORT) || 4180;

const TYPEN = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};

/* ------------------------------------------------------------------ *
 * Die eigene NetBird-Adresse finden
 * ------------------------------------------------------------------ */

/**
 * NetBird vergibt Adressen aus 100.64.0.0/10 (dem sogenannten
 * CGNAT-Bereich). Genau daran ist die Adresse zu erkennen.
 */
function netbirdAdresse() {
  for (const [name, liste] of Object.entries(networkInterfaces())) {
    for (const eintrag of liste || []) {
      if (eintrag.family !== 'IPv4' || eintrag.internal) continue;
      const teile = eintrag.address.split('.').map(Number);
      if (teile[0] === 100 && teile[1] >= 64 && teile[1] <= 127) {
        return { adresse: eintrag.address, adapter: name };
      }
    }
  }
  return null;
}

const alleAdressen = process.argv.includes('--alle');
const netbird = netbirdAdresse();

if (!netbird && !alleAdressen) {
  console.error('Keine NetBird-Adresse gefunden.');
  console.error('');
  console.error('Moegliche Gruende:');
  console.error('  - NetBird laeuft nicht. Im Infobereich der Taskleiste nachsehen.');
  console.error('  - Dieser PC ist nicht mit dem Netz verbunden.');
  console.error('');
  console.error('Nur zum Ausprobieren im Heimnetz:');
  console.error('  node werkzeuge/heim-server.mjs --alle');
  process.exit(1);
}

const lauschtAuf = alleAdressen ? '0.0.0.0' : netbird.adresse;

/* ------------------------------------------------------------------ *
 * Ausliefern
 * ------------------------------------------------------------------ */

async function dateiSuchen(relativ) {
  const ziel = resolve(join(WURZEL, relativ));
  // Massnahme 3: Der aufgeloeste Pfad muss unterhalb der Wurzel liegen.
  if (ziel !== WURZEL && !ziel.startsWith(WURZEL + sep)) return null;

  try {
    const angaben = await stat(ziel);
    if (angaben.isDirectory()) {
      // Massnahme 4: keine Ordnerlisten, nur die index.html darin.
      const drin = join(ziel, 'index.html');
      await stat(drin);
      return drin;
    }
    return ziel;
  } catch {
    return null;
  }
}

const server = createServer(async (anfrage, antwort) => {
  // Massnahme 2: nur Lesen.
  if (anfrage.method !== 'GET' && anfrage.method !== 'HEAD') {
    antwort.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8', Allow: 'GET, HEAD' });
    antwort.end('Nur Lesen erlaubt. Geaendert wird ueber GitHub.\n');
    return;
  }

  try {
    const adresse = decodeURIComponent((anfrage.url || '/').split('?')[0].split('#')[0]);
    const relativ = normalize(adresse === '/' ? 'index.html' : adresse.replace(/^\/+/, ''));

    const datei = await dateiSuchen(relativ);
    if (!datei) {
      antwort.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      antwort.end('<h1>404 &ndash; nicht gefunden</h1>');
      return;
    }

    const inhalt = await readFile(datei);
    antwort.writeHead(200, {
      'Content-Type': TYPEN[extname(datei).toLowerCase()] || 'application/octet-stream',
      'Content-Length': inhalt.length,
      'Cache-Control': 'no-cache',
      // Die Seite laedt nichts von aussen. Das hier sagt es dem Browser
      // auch, damit ein eingeschleustes Skript gar nicht erst laufen kann.
      'Content-Security-Policy':
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://api.github.com; frame-src https://daggerheart-werkstatt-jt.web.app",
      'X-Content-Type-Options': 'nosniff',
    });
    if (anfrage.method === 'HEAD') antwort.end();
    else antwort.end(inhalt);
  } catch {
    antwort.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
    antwort.end('<h1>500 &ndash; Serverfehler</h1>');
  }
});

server.listen(PORT, lauschtAuf, () => {
  console.log('Age-of-Beast-Wiki laeuft im eigenen Netz');
  console.log('---------------------------------------');
  console.log('Ordner:      ' + WURZEL);
  if (alleAdressen) {
    console.log('Erreichbar:  http://localhost:' + PORT + '   (und im ganzen Heimnetz)');
    console.log('');
    console.log('ACHTUNG: Mit --alle ist der Server fuer jedes Geraet im Heimnetz');
    console.log('sichtbar. Fuer den Dauerbetrieb ohne --alle starten.');
  } else {
    console.log('Adapter:     ' + netbird.adapter);
    console.log('Erreichbar:  http://' + netbird.adresse + ':' + PORT);
    console.log('');
    console.log('Nur von Geraeten, die in deinem NetBird-Netz eingetragen sind.');
    console.log('Aus dem Heimnetz und aus dem Internet nicht erreichbar.');
  }
  console.log('');
  console.log('Beenden mit Strg + C');
});
