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
import { readFile, realpath, stat } from 'node:fs/promises';
import { extname, isAbsolute, join, normalize, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), '..');
const ECHTE_WURZEL = await realpath(WURZEL);
const PORT = Number(process.env.PORT) || 4173;

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

const FREIGEGEBENE_DATEIEN = new Set([
  'index.html',
  'stil.css',
  'styles/tokens.css',
  'styles/wiki.css',
  'styles/bearbeiten.css',
  'styles/werkstatt.css',
  'wiki.js',
  'bearbeiten.js',
  'bearbeiten-kontext.js',
  'texte-bearbeiten.js',
  'struktur-bedienung.js',
  'rahmen-assistent.js',
  'runtime/datenindex.js',
  'runtime/ansichten.js',
  'runtime/interaktion.js',
  'runtime/routing.js',
  'daten/welt.js',
  'daten/rahmen-felder.json',
  'werkzeuge/welt-dateien.mjs',
  'werkzeuge/welt-umwandeln.mjs',
  'werkzeuge/bearbeiten-stellen.mjs',
  'werkzeuge/text-schreibweise.mjs',
  'werkzeuge/struktur-bearbeiten.mjs',
  'werkzeuge/github-speicher.mjs',
]);

function sendeAntwort(antwort, methode, status, kopfzeilen, inhalt = '') {
  const puffer = Buffer.isBuffer(inhalt) ? inhalt : Buffer.from(inhalt);

  antwort.writeHead(status, {
    ...kopfzeilen,
    'Content-Length': puffer.length,
  });
  antwort.end(methode === 'HEAD' ? undefined : puffer);
}

function hatGesperrtesSegment(pfad) {
  return pfad
    .split(/[\\/]+/)
    .filter(Boolean)
    .some((segment) => {
      // Windows behandelt abschließende Punkte und Leerzeichen besonders.
      const name = segment.replace(/[. ]+$/, '').toLowerCase();
      const basisname = name.split(':', 1)[0];

      return (
        basisname.startsWith('.') ||
        basisname.includes('credentials') ||
        (basisname.includes('adc') && basisname.endsWith('.json'))
      );
    });
}

function liegtAußerhalbDerWurzel(datei, wurzel = WURZEL) {
  const abstand = relative(wurzel, datei);

  return abstand === '..' || abstand.startsWith(`..${sep}`) || isAbsolute(abstand);
}

function istFreigegebeneDatei(relativ) {
  const webPfad = relativ.replace(/\\/g, '/');

  return (
    FREIGEGEBENE_DATEIEN.has(webPfad) ||
    (webPfad.startsWith('daten/kartenbilder/') && webPfad.endsWith('.svg'))
  );
}

function istUnbekannterStilPfad(relativ) {
  const webPfad = relativ.replace(/\\/g, '/');
  return (webPfad === 'styles' || webPfad.startsWith('styles/')) && !istFreigegebeneDatei(relativ);
}

const server = createServer(async (anfrage, antwort) => {
  const methode = anfrage.method || '';

  if (methode !== 'GET' && methode !== 'HEAD') {
    sendeAntwort(
      antwort,
      methode,
      405,
      {
        Allow: 'GET, HEAD',
        'Content-Type': 'text/html; charset=utf-8',
      },
      '<h1>405 – Methode nicht erlaubt</h1>',
    );
    return;
  }

  try {
    const adresse = decodeURIComponent((anfrage.url || '/').split('?')[0]);
    const relativ = normalize(adresse === '/' ? 'index.html' : adresse.replace(/^[\\/]+/, ''));
    const datei = resolve(WURZEL, relativ);

    // Ausbrüche und vertrauliche Dateien ohne Dateizugriff sperren.
    if (liegtAußerhalbDerWurzel(datei) || hatGesperrtesSegment(relativ)) {
      sendeAntwort(
        antwort,
        methode,
        403,
        { 'Content-Type': 'text/html; charset=utf-8' },
        '<h1>403 – Zugriff verweigert</h1>',
      );
      return;
    }

    // Der neue Stilordner bleibt ebenso geschlossen wie alle übrigen Dateien:
    // Nur die vier explizit freigegebenen CSS-Dateien dürfen ihn verlassen.
    if (istUnbekannterStilPfad(relativ)) {
      sendeAntwort(
        antwort,
        methode,
        403,
        { 'Content-Type': 'text/html; charset=utf-8' },
        '<h1>403 – Zugriff verweigert</h1>',
      );
      return;
    }

    if (!istFreigegebeneDatei(relativ)) {
      try {
        await stat(datei);
        sendeAntwort(
          antwort,
          methode,
          403,
          { 'Content-Type': 'text/html; charset=utf-8' },
          '<h1>403 – Zugriff verweigert</h1>',
        );
      } catch (fehler) {
        const fehlt = fehler?.code === 'ENOENT' || fehler?.code === 'ENOTDIR';

        sendeAntwort(
          antwort,
          methode,
          fehlt ? 404 : 403,
          { 'Content-Type': 'text/html; charset=utf-8' },
          fehlt ? '<h1>404 – nicht gefunden</h1>' : '<h1>403 – Zugriff verweigert</h1>',
        );
      }
      return;
    }

    const echteDatei = await realpath(datei);
    const echterRelativ = relative(ECHTE_WURZEL, echteDatei);

    // Junctions und Symlinks dürfen weder aus der Wurzel noch aus der Freigabe führen.
    if (
      liegtAußerhalbDerWurzel(echteDatei, ECHTE_WURZEL) ||
      hatGesperrtesSegment(echterRelativ) ||
      !istFreigegebeneDatei(echterRelativ)
    ) {
      sendeAntwort(
        antwort,
        methode,
        403,
        { 'Content-Type': 'text/html; charset=utf-8' },
        '<h1>403 – Zugriff verweigert</h1>',
      );
      return;
    }

    const inhalt = await readFile(echteDatei);
    sendeAntwort(antwort, methode, 200, {
      'Content-Type': TYPEN[extname(echteDatei).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    }, inhalt);
  } catch {
    sendeAntwort(
      antwort,
      methode,
      404,
      { 'Content-Type': 'text/html; charset=utf-8' },
      '<h1>404 – nicht gefunden</h1>',
    );
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Age-of-Beast-Wiki läuft ausschließlich lokal auf http://127.0.0.1:${PORT}`);
  console.log('Beenden mit Strg + C.');
});
