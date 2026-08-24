/**
 * Kleiner Vorschau-Server, um das Wiki lokal anzusehen.
 *
 * Aufruf:
 *   node werkzeuge/vorschau-server.mjs
 *
 * Danach im Browser öffnen:  http://localhost:4173
 * Beenden mit Strg + C.
 *
 * Hinweis: Für einen schnellen Blick genügt auch ein Doppelklick auf
 * index.html. Der Server ist nur nötig, wenn etwas genau so laufen soll
 * wie später auf GitHub Pages.
 */

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT) || 4173;

const TYPEN = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};

const server = createServer(async (anfrage, antwort) => {
  try {
    const adresse = decodeURIComponent((anfrage.url || '/').split('?')[0]);
    const relativ = normalize(adresse === '/' ? 'index.html' : adresse.replace(/^\/+/, ''));

    // Ausbruch aus dem Projektordner verhindern
    if (relativ.startsWith('..' + sep) || relativ === '..') {
      antwort.writeHead(403).end('Zugriff verweigert');
      return;
    }

    const datei = join(WURZEL, relativ);
    const inhalt = await readFile(datei);
    antwort.writeHead(200, {
      'Content-Type': TYPEN[extname(datei).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    antwort.end(inhalt);
  } catch {
    antwort.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    antwort.end('<h1>404 – nicht gefunden</h1>');
  }
});

server.listen(PORT, () => {
  console.log(`Age-of-Beast-Wiki läuft auf http://localhost:${PORT}`);
  console.log('Beenden mit Strg + C.');
});
