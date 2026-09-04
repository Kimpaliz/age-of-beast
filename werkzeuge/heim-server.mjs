/**
 * Liefert das Wiki im eigenen NetBird-Netz aus.
 *
 * Damit ist das Wiki von Janniks Handy und anderen eingetragenen Geräten
 * erreichbar, solange dieser PC läuft — ohne Internet, ohne Portfreigabe
 * am Router, ohne Kosten.
 *
 * SICHERHEIT — vier Maßnahmen, jede mit Grund:
 *
 *   1. Der Server lauscht ausschließlich auf der NetBird-Adresse, nicht
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
 *      aufgelöst und muss unterhalb der Wurzel liegen. Symbolische Links
 *      dürfen ebenfalls nicht aus der Wurzel zeigen. Sonst 403.
 *      Ohne diese Prüfung könnte `../../` beliebige Dateien des PCs
 *      ausliefern.
 *
 *   4. Explizite Freigabe. Nur veröffentlichte Dateien können 200 erhalten;
 *      versteckte und vertrauliche Pfade werden vor jedem Dateizugriff
 *      mit 403 abgewiesen.
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
import { readFile, realpath, stat } from 'node:fs/promises';
import { networkInterfaces } from 'node:os';
import { dirname, extname, isAbsolute, join, normalize, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = dirname(fileURLToPath(import.meta.url));
const WURZEL = resolve(join(HIER, '..'));
const ECHTE_WURZEL = await realpath(WURZEL);
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

const OEFFENTLICHE_DATEIEN = new Set([
  'index.html',
  'wiki.html',
  'karte.html',
  'karten.html',
  'bogen.html',
  'vorlagen.html',
  'stil.css',
  'styles/tokens.css',
  'styles/wiki.css',
  'styles/bearbeiten.css',
  'styles/werkstatt.css',
  'styles/kategorien.css',
  'styles/plattform.css',
  'styles/handy.css',
  'styles/karte.css',
  'styles/spielkarten.css',
  'styles/charakterbogen.css',
  'styles/vorlagen.css',
  'wiki.js',
  'bearbeiten.js',
  'firebase-konfig.js',
  'bearbeiten-kontext.js',
  'texte-bearbeiten.js',
  'struktur-bedienung.js',
  'rahmen-assistent.js',
  'runtime/symbole.js',
  'runtime/favoriten.js',
  'runtime/kontextmenue.js',
  'runtime/kontextmenue-wiki.js',
  'runtime/plattform.js',
  'runtime/wiki-kennung.js',
  'runtime/datenindex.js',
  'runtime/ansichten.js',
  'runtime/interaktion.js',
  'runtime/routing.js',
  'runtime/vorlagen.js',
  'daten/welt.js',
  'daten/rahmen-felder.json',
  'daten/daggerheart-karten.json',
  'daten/daggerheart-gegenstaende.json',
  'werkzeuge/welt-dateien.mjs',
  'karte/karte-zeichnen.js',
  'karte/welt-orte.mjs',
  'karte/karten-zeigen.js',
  'karte/bogen-zeigen.js',
  'karte/karten-daten.js',
  'karte/kartenblase.js',
  'karte/karte-erzeugen.mjs',
  'karte/palette.mjs',
  'karte/welt-regionen.mjs',
  'werkzeuge/firestore-format.mjs',
  'werkzeuge/firestore-speicher.mjs',
  'werkzeuge/plattform-speicher.mjs',
  'werkzeuge/welt-umwandeln.mjs',
  'werkzeuge/welt-rahmen.mjs',
  'werkzeuge/vorlagen.mjs',
  'werkzeuge/bearbeiten-stellen.mjs',
  'werkzeuge/text-schreibweise.mjs',
  'werkzeuge/struktur-bearbeiten.mjs',
]);
const OEFFENTLICHER_SVG_PFAD = /^daten\/kartenbilder\/.+\.svg$/iu;

/* ------------------------------------------------------------------ *
 * Die eigene NetBird-Adresse finden
 * ------------------------------------------------------------------ */

/**
 * NetBird vergibt Adressen aus 100.64.0.0/10 (dem sogenannten
 * CGNAT-Bereich). Genau daran ist die Adresse zu erkennen.
 */
export function netbirdAdresse() {
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

/* ------------------------------------------------------------------ *
 * Ausliefern
 * ------------------------------------------------------------------ */

function liegtInnerhalb(wurzel, ziel) {
  const wegZurDatei = relative(wurzel, ziel);
  return (
    wegZurDatei === '' ||
    (!wegZurDatei.startsWith('..' + sep) && wegZurDatei !== '..' && !isAbsolute(wegZurDatei))
  );
}

function istVertraulichesSegment(segment) {
  if (segment === '.' || segment === '..' || segment.includes(':')) return true;

  const name = segment.replace(/[. ]+$/u, '').toLowerCase();
  return (
    name.startsWith('.') ||
    name.includes('credentials') ||
    (name.includes('adc') && name.endsWith('.json'))
  );
}

function hatVertraulichesSegment(pfad) {
  return pfad.split(/[\\/]+/u).some((segment) => segment && istVertraulichesSegment(segment));
}

function istOeffentlicheDatei(relativ) {
  const webPfad = relativ.replace(/\\/gu, '/');
  return OEFFENTLICHE_DATEIEN.has(webPfad) || OEFFENTLICHER_SVG_PFAD.test(webPfad);
}

function istUnbekannterStilPfad(relativ) {
  const webPfad = relativ.replace(/\\/gu, '/');
  return (webPfad === 'styles' || webPfad.startsWith('styles/')) && !istOeffentlicheDatei(relativ);
}

function mehrfachDekodieren(text) {
  let dekodiert = text;

  for (let durchlauf = 0; durchlauf < 32; durchlauf += 1) {
    if (!/%[0-9a-f]{2}/iu.test(dekodiert)) return dekodiert;

    try {
      const naechsterWert = decodeURIComponent(dekodiert);
      if (naechsterWert === dekodiert) return dekodiert;
      dekodiert = naechsterWert;
    } catch {
      return null;
    }
  }

  // Zu oft verschachtelte Kodierung ist für diese statische Seite nie nötig.
  return null;
}

/**
 * Liefert einen sicheren relativen Pfad oder die HTTP-Entscheidung 403.
 * Die Prüfung geschieht vor dem Dateisystemzugriff, damit gesperrte Namen
 * auch dann nicht verraten, ob es sie im Projekt gibt.
 */
export function pfadAusAnfrage(roheUrl) {
  const ohneParameter = String(roheUrl || '/').split(/[?#]/u, 1)[0] || '/';
  const dekodiert = mehrfachDekodieren(ohneParameter);

  if (!dekodiert || dekodiert.includes('\0')) return { status: 403 };

  const ohneFuehrendeTrenner = dekodiert.replace(/^[\\/]+/u, '');
  if (hatVertraulichesSegment(ohneFuehrendeTrenner)) return { status: 403 };

  const relativ = normalize(ohneFuehrendeTrenner || 'index.html');
  if (hatVertraulichesSegment(relativ)) return { status: 403 };

  return { status: 200, relativ };
}

/**
 * Unterscheidet absichtlich zwischen fehlenden und gesperrten Dateien,
 * damit vertrauliche Pfade immer 403 statt 404 erhalten.
 */
export async function dateiSuchen(relativ) {
  const ziel = resolve(join(WURZEL, relativ));
  // Maßnahme 3: Der aufgelöste Pfad muss unterhalb der Wurzel liegen.
  if (!liegtInnerhalb(WURZEL, ziel) || hatVertraulichesSegment(relativ) || istUnbekannterStilPfad(relativ)) {
    return { status: 403 };
  }

  try {
    const angaben = await stat(ziel);
    // Nicht veröffentlichte, aber vorhandene Dateien bleiben absichtlich
    // ungelesen und erhalten 403. Fehlt ein unverdächtiger Pfad, endet
    // die Stat-Abfrage dagegen unten als 404.
    if (!istOeffentlicheDatei(relativ)) return { status: 403 };

    if (!angaben.isFile()) return { status: 404 };
    const datei = ziel;

    // Auch ein symbolischer Link darf weder aus der Projektwurzel zeigen
    // noch auf eine nicht veröffentlichte Datei innerhalb der Wurzel weisen.
    const echterPfad = await realpath(datei);
    const echterRelativerPfad = relative(ECHTE_WURZEL, echterPfad);
    if (
      !liegtInnerhalb(ECHTE_WURZEL, echterPfad) ||
      hatVertraulichesSegment(echterRelativerPfad) ||
      !istOeffentlicheDatei(echterRelativerPfad)
    ) {
      return { status: 403 };
    }

    return { status: 200, datei: echterPfad };
  } catch {
    return { status: 404 };
  }
}

function antwortSenden(antwort, methode, status, kopfzeilen, inhalt) {
  const koerper = Buffer.isBuffer(inhalt) ? inhalt : Buffer.from(inhalt);
  antwort.writeHead(status, {
    ...kopfzeilen,
    'Content-Length': koerper.length,
  });
  antwort.end(methode === 'HEAD' ? undefined : koerper);
}

export async function anfrageBehandeln(anfrage, antwort) {
  // Maßnahme 2: nur Lesen.
  if (anfrage.method !== 'GET' && anfrage.method !== 'HEAD') {
    antwortSenden(
      antwort,
      anfrage.method,
      405,
      { 'Content-Type': 'text/plain; charset=utf-8', Allow: 'GET, HEAD' },
      'Nur Lesen erlaubt. Geändert wird über GitHub.\n',
    );
    return;
  }

  try {
    const pfad = pfadAusAnfrage(anfrage.url);
    if (pfad.status === 403) {
      antwortSenden(
        antwort,
        anfrage.method,
        403,
        { 'Content-Type': 'text/html; charset=utf-8' },
        '<h1>403 &ndash; Zugriff verweigert</h1>',
      );
      return;
    }

    const gefunden = await dateiSuchen(pfad.relativ);
    if (gefunden.status !== 200) {
      const meldung =
        gefunden.status === 403
          ? '<h1>403 &ndash; Zugriff verweigert</h1>'
          : '<h1>404 &ndash; nicht gefunden</h1>';
      antwortSenden(
        antwort,
        anfrage.method,
        gefunden.status,
        { 'Content-Type': 'text/html; charset=utf-8' },
        meldung,
      );
      return;
    }

    const inhalt = await readFile(gefunden.datei);
    antwortSenden(antwort, anfrage.method, 200, {
      'Content-Type': TYPEN[extname(gefunden.datei).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
      // Die Seite lädt nichts von außen – seit Fassung 2.6.0 auch keinen
      // eingebetteten Rahmen mehr. Das hier sagt es dem Browser auch,
      // damit ein eingeschleustes Skript gar nicht erst laufen kann.
      'Content-Security-Policy':
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://api.github.com",
      'X-Content-Type-Options': 'nosniff',
    }, inhalt);
  } catch {
    antwortSenden(
      antwort,
      anfrage.method,
      500,
      { 'Content-Type': 'text/html; charset=utf-8' },
      '<h1>500 &ndash; Serverfehler</h1>',
    );
  }
}

export function heimServerStarten() {
  const alleAdressen = process.argv.includes('--alle');
  const netbird = netbirdAdresse();

  if (!netbird && !alleAdressen) {
    console.error('Keine NetBird-Adresse gefunden.');
    console.error('');
    console.error('Mögliche Gründe:');
    console.error('  - NetBird läuft nicht. Im Infobereich der Taskleiste nachsehen.');
    console.error('  - Dieser PC ist nicht mit dem Netz verbunden.');
    console.error('');
    console.error('Nur zum Ausprobieren im Heimnetz:');
    console.error('  node werkzeuge/heim-server.mjs --alle');
    process.exitCode = 1;
    return null;
  }

  const lauschtAuf = alleAdressen ? '0.0.0.0' : netbird.adresse;
  const server = createServer(anfrageBehandeln);

  server.listen(PORT, lauschtAuf, () => {
    console.log('Age-of-Beast-Wiki läuft im eigenen Netz');
    console.log('--------------------------------------');
    console.log('Ordner:      ' + WURZEL);
    if (alleAdressen) {
      console.log('Erreichbar:  http://localhost:' + PORT + '   (und im ganzen Heimnetz)');
      console.log('');
      console.log('ACHTUNG: Mit --alle ist der Server für jedes Gerät im Heimnetz');
      console.log('sichtbar. Für den Dauerbetrieb ohne --alle starten.');
    } else {
      console.log('Adapter:     ' + netbird.adapter);
      console.log('Erreichbar:  http://' + netbird.adresse + ':' + PORT);
      console.log('');
      console.log('Nur von Geräten, die in deinem NetBird-Netz eingetragen sind.');
      console.log('Aus dem Heimnetz und aus dem Internet nicht erreichbar.');
    }
    console.log('');
    console.log('Beenden mit Strg + C');
  });

  return server;
}

const direktGestartet = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (direktGestartet) heimServerStarten();
