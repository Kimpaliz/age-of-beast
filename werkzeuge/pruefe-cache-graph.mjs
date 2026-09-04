/**
 * [Aufgabe: Prüfwesen]
 * Prüft den Browser-Cache-Graphen ohne Browser, Netzwerk oder Paketmanager.
 *
 * Ohne Argumente wird eine temporäre Kopie des aktuellen Repositories
 * versioniert, gegen die Quelle geprüft und mit kleinen, gezielten Fixtures
 * gegen Regressionen abgesichert. Mit --artefakt prüft das Skript nur die
 * übergebenen Verzeichnisse und schreibt nirgends hinein.
 *
 * Aufruf:
 *   node werkzeuge/pruefe-cache-graph.mjs
 *   node werkzeuge/pruefe-cache-graph.mjs \
 *     --quelle <Quellverzeichnis> --artefakt <Verzeichnis> --version <Kennung>
 */

import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  artefaktCacheGraphPruefen,
  artefaktVersionieren,
  browserGraphLesen,
  CacheGraphFehler,
  REPOSITORY_WURZEL,
} from './versioniere-browser-ressourcen.mjs';

const HIER = dirname(fileURLToPath(import.meta.url));
const WURZEL = resolve(HIER, '..');
const PRUEF_VERSION = 'cache-fixture-1';

function optionenLesen(argumente) {
  const optionen = {};
  for (let index = 0; index < argumente.length; index += 1) {
    const schalter = argumente[index];
    if (schalter === '--hilfe' || schalter === '-h') return { hilfe: true };
    if (!['--quelle', '--artefakt', '--version'].includes(schalter)) {
      throw new Error('Unbekannte Option: ' + schalter);
    }
    const wert = argumente[index + 1];
    if (!wert || wert.startsWith('--')) throw new Error('Wert fehlt nach ' + schalter + '.');
    optionen[schalter.slice(2)] = wert;
    index += 1;
  }
  return optionen;
}

function hilfeAusgeben() {
  console.log('Aufruf: node werkzeuge/pruefe-cache-graph.mjs [--quelle <Verzeichnis> --artefakt <Verzeichnis> --version <Kennung>]');
  console.log('Ohne Artefakt laufen zusätzlich die temporären Mutations- und Fixture-Prüfungen.');
}

function sha256(text) {
  return createHash('sha256').update(text).digest('hex');
}

async function graphFingerabdruck(graph) {
  const teile = [];
  for (const pfad of [...graph.knoten.keys()].sort()) {
    const knoten = graph.knoten.get(pfad);
    const inhalt = await readFile(knoten.datei);
    teile.push(pfad + '\0' + sha256(inhalt));
  }
  return sha256(teile.join('\n'));
}

function kopierFilter(quelle) {
  const teile = relative(REPOSITORY_WURZEL, quelle).split(/[\\/]/u);
  return !teile.includes('.git');
}

async function artefaktKopieren(quelle, praefix) {
  const ziel = await mkdtemp(join(tmpdir(), praefix));
  await cp(quelle, ziel, { recursive: true, filter: kopierFilter });
  return ziel;
}

function einmalErsetzen(text, alt, neu, bezeichnung) {
  const ersteStelle = text.indexOf(alt);
  assert.notEqual(ersteStelle, -1, bezeichnung + ': erwartete Stelle fehlt.');
  assert.equal(text.indexOf(alt, ersteStelle + alt.length), -1, bezeichnung + ': erwartete Stelle ist mehrdeutig.');
  return text.slice(0, ersteStelle) + neu + text.slice(ersteStelle + alt.length);
}

async function mussFehlschlagen(aktion, muster, bezeichnung) {
  let fehler = null;
  try {
    await aktion();
  } catch (ursache) {
    fehler = ursache;
  }
  assert.ok(fehler instanceof CacheGraphFehler, bezeichnung + ': CacheGraphFehler erwartet.');
  assert.match(fehler.message, muster, bezeichnung + ': aussagekräftige Fehlerursache erwartet.');
}

async function dateiSchreiben(wurzel, pfad, inhalt) {
  const ziel = join(wurzel, ...pfad.split('/'));
  const ordner = dirname(ziel);
  await mkdir(ordner, { recursive: true });
  await writeFile(ziel, inhalt, 'utf8');
}

/** Baut einen kleinen, aber vollständigen HTML-, CSS-, ESM- und fetch-Graphen. */
async function fixtureBauen(wurzel) {
  await dateiSchreiben(wurzel, 'index.html', `<!doctype html>
<link rel="stylesheet" href="css/app.css?thema=hell&amp;alt=1#druck">
<link rel="icon" href="data:image/svg+xml,unveraendert">
<script src="js/einstieg.js?direkt=1#start"></script>
<img src="daten/kartenbilder/stamm.svg">
<a href="#inhalt">Anker</a>
<a href="https://example.invalid/extern.js">Extern</a>
`);
  await dateiSchreiben(wurzel, 'css/app.css', `@import url("./grundlage.css?medium=screen#basis");
.zeichen { background-image: url("../bilder/zeichen.svg?farbe=violett#marke"); }
.karte { mask-image: url("../daten/kartenbilder/stamm.svg"); }
.extern { background-image: url("https://example.invalid/extern.svg"); }
.daten { background-image: url(data:image/svg+xml,unveraendert); }
`);
  await dateiSchreiben(wurzel, 'css/grundlage.css', ':root { color: #111; }\n');
  await dateiSchreiben(wurzel, 'bilder/zeichen.svg', '<svg xmlns="http://www.w3.org/2000/svg"/>\n');
  await dateiSchreiben(wurzel, 'js/einstieg.js', `import './unter/modul.js?alt=1#eins';
const FELDER_ADRESSE = '../daten/felder.json?quelle=regel#formular';
await fetch(FELDER_ADRESSE);
await import('./unter/spaet.js?lade=1#zwei');
`);
  await dateiSchreiben(wurzel, 'js/unter/modul.js', "export { wert } from '../../gemeinsam/helfer.mjs?modus=test#teil';\n");
  await dateiSchreiben(wurzel, 'js/unter/spaet.js', 'export const spaet = true;\n');
  await dateiSchreiben(wurzel, 'gemeinsam/helfer.mjs', 'export const wert = 1;\n');
  await dateiSchreiben(wurzel, 'daten/felder.json', '{"felder": []}\n');
  await dateiSchreiben(wurzel, 'daten/kartenbilder/stamm.svg', '<svg xmlns="http://www.w3.org/2000/svg"/>\n');
}

async function fixturePruefen() {
  const quelle = await mkdtemp(join(tmpdir(), 'aob-cache-quelle-'));
  const artefakt = await mkdtemp(join(tmpdir(), 'aob-cache-artefakt-'));
  let prueffalle = 0;

  try {
    await fixtureBauen(quelle);
    await cp(quelle, artefakt, { recursive: true });

    const quellGraph = await browserGraphLesen(quelle);
    assert.equal(quellGraph.abhaengigkeiten.size, 9, 'Fixture muss neun lokale Abhängigkeiten erkennen.');
    assert.equal(quellGraph.referenzen.length, 10, 'Fixture muss zehn lokale Kanten erkennen.');
    prueffalle += 2;

    const versioniert = await artefaktVersionieren({ artefakt, version: PRUEF_VERSION });
    assert.equal(versioniert.umschreibungen, 8, 'Nur die acht veränderlichen Fixture-Kanten dürfen versioniert werden.');
    prueffalle += 1;

    const geprueft = await artefaktCacheGraphPruefen({ quelle, artefakt, version: PRUEF_VERSION });
    assert.equal(geprueft.artefaktGraph.abhaengigkeiten.size, 9, 'Artefakt muss denselben Fixture-Graphen behalten.');
    prueffalle += 1;

    const index = await readFile(join(artefakt, 'index.html'), 'utf8');
    assert.match(index, /css\/app\.css\?thema=hell&amp;alt=1&amp;v=cache-fixture-1#druck/u, 'HTML-Parameter und Fragment müssen erhalten bleiben.');
    assert.match(index, /js\/einstieg\.js\?direkt=1&amp;v=cache-fixture-1#start/u, 'HTML-Startmodul muss eine Kennung erhalten.');
    assert.match(index, /data:image\/svg\+xml,unveraendert/u, 'data:-Adresse darf nicht verändert werden.');
    assert.match(index, /https:\/\/example\.invalid\/extern\.js/u, 'Externe Adresse darf nicht verändert werden.');
    assert.match(index, /daten\/kartenbilder\/stamm\.svg"/u, 'Statisches Karten-SVG darf keine Kennung erhalten.');
    assert.match(index, /href="#inhalt"/u, 'Hash-Anker darf nicht verändert werden.');
    prueffalle += 6;

    const css = await readFile(join(artefakt, 'css', 'app.css'), 'utf8');
    assert.match(css, /url\("\.\.\/bilder\/zeichen\.svg\?farbe=violett&v=cache-fixture-1#marke"\)/u, 'Lokales CSS-Asset muss eine Kennung erhalten.');
    assert.match(css, /url\("\.\.\/daten\/kartenbilder\/stamm\.svg"\)/u, 'Statisches Karten-SVG aus CSS darf keine Kennung erhalten.');
    assert.match(css, /https:\/\/example\.invalid\/extern\.svg/u, 'Externe CSS-Adresse darf nicht verändert werden.');
    assert.match(css, /data:image\/svg\+xml,unveraendert/u, 'data:-Adresse in CSS darf nicht verändert werden.');
    prueffalle += 4;

    await writeFile(
      join(artefakt, 'index.html'),
      einmalErsetzen(index, '?thema=hell&amp;alt=1&amp;v=' + PRUEF_VERSION + '#druck', '?thema=hell&amp;alt=1#druck', 'Fehlende Startkennung'),
      'utf8',
    );
    await mussFehlschlagen(
      () => artefaktCacheGraphPruefen({ quelle, artefakt, version: PRUEF_VERSION }),
      /genau eine Versionskennung/u,
      'Fehlende Startkennung',
    );
    prueffalle += 1;

    await artefaktVersionieren({ artefakt, version: PRUEF_VERSION });
    const modulPfad = join(artefakt, 'js', 'unter', 'modul.js');
    const modul = await readFile(modulPfad, 'utf8');
    await writeFile(
      modulPfad,
      einmalErsetzen(modul, '?modus=test&v=' + PRUEF_VERSION + '#teil', '?modus=test#teil', 'Unversionierter Transitimport'),
      'utf8',
    );
    await mussFehlschlagen(
      () => artefaktCacheGraphPruefen({ quelle, artefakt, version: PRUEF_VERSION }),
      /genau eine Versionskennung/u,
      'Unversionierter Transitimport',
    );
    prueffalle += 1;

    await dateiSchreiben(quelle, 'js/unter/modul.js', "import '../../../außen.js';\n");
    await mussFehlschlagen(
      () => browserGraphLesen(quelle),
      /verlässt das Artefakt/u,
      'Ausbruch aus dem Quellgraphen',
    );
    prueffalle += 1;

    return { prueffalle, abhaengigkeiten: geprueft.artefaktGraph.abhaengigkeiten.size };
  } finally {
    await rm(artefakt, { recursive: true, force: true });
    await rm(quelle, { recursive: true, force: true });
  }
}

async function vollPruefen() {
  const quellGraph = await browserGraphLesen(WURZEL);
  const vorher = await graphFingerabdruck(quellGraph);
  const artefakt = await artefaktKopieren(WURZEL, 'aob-cache-artefakt-');

  try {
    const versioniert = await artefaktVersionieren({ artefakt, version: PRUEF_VERSION });
    const geprueft = await artefaktCacheGraphPruefen({
      quelle: WURZEL,
      artefakt,
      version: PRUEF_VERSION,
    });
    const fixture = await fixturePruefen();
    const nachher = await graphFingerabdruck(await browserGraphLesen(WURZEL));
    assert.equal(nachher, vorher, 'Die Prüfung darf keine Browser-Quelldatei verändern.');

    return {
      quellGraph,
      artefaktGraph: geprueft.artefaktGraph,
      umschreibungen: versioniert.umschreibungen,
      prueffalle: fixture.prueffalle + 1,
      quelleUnveraendert: true,
    };
  } finally {
    await rm(artefakt, { recursive: true, force: true });
  }
}

function ergebnisAusgeben(ergebnis) {
  console.log('Age-of-Beast-Wiki – Cache-Graph geprüft');
  console.log('Quell-Abhängigkeiten: ' + ergebnis.quellGraph.abhaengigkeiten.size);
  console.log('Quell-Kanten: ' + ergebnis.quellGraph.referenzen.length);
  console.log('Artefakt-Abhängigkeiten: ' + ergebnis.artefaktGraph.abhaengigkeiten.size);
  console.log('Artefakt-Kanten: ' + ergebnis.artefaktGraph.referenzen.length);
  if (ergebnis.umschreibungen !== undefined) console.log('Versionierte Kanten: ' + ergebnis.umschreibungen);
  if (ergebnis.prueffalle !== undefined) console.log('Prüffälle: ' + ergebnis.prueffalle);
  if (ergebnis.quelleUnveraendert) console.log('Quelle unverändert: ja');
}

async function ausfuehren() {
  const optionen = optionenLesen(process.argv.slice(2));
  if (optionen.hilfe) {
    hilfeAusgeben();
    return;
  }

  if (optionen.artefakt || optionen.quelle || optionen.version) {
    if (!optionen.artefakt || !optionen.version) {
      throw new Error('Für eine explizite Artefaktprüfung sind --artefakt und --version verpflichtend.');
    }
    const geprueft = await artefaktCacheGraphPruefen({
      quelle: optionen.quelle ? resolve(optionen.quelle) : WURZEL,
      artefakt: resolve(optionen.artefakt),
      version: optionen.version,
    });
    ergebnisAusgeben({
      quellGraph: geprueft.quellGraph,
      artefaktGraph: geprueft.artefaktGraph,
    });
    return;
  }

  ergebnisAusgeben(await vollPruefen());
}

try {
  await ausfuehren();
} catch (fehler) {
  console.error('Cache-Graph-Prüfung fehlgeschlagen: ' + fehler.message);
  process.exitCode = 1;
}
