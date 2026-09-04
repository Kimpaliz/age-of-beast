/**
 * Prüft die CSS-Aufteilung, ohne Browser, Netzwerk oder Quelldateien zu
 * verändern. Der Referenzwert sichert den bisherigen Stil als vollständige
 * Zeichenfolge: Bei späteren beabsichtigten Stiländerungen muss er bewusst
 * zusammen mit dieser Prüfung aktualisiert werden.
 *
 * Aufruf:
 *   node werkzeuge/pruefe-stilstruktur.mjs
 */

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { browserGraphLesen } from './versioniere-browser-ressourcen.mjs';

const HIER = dirname(fileURLToPath(import.meta.url));
const WURZEL = resolve(HIER, '..');

const STIL_FASSADE = 'stil.css';
const STIL_TEILE = [
  'styles/tokens.css',
  'styles/wiki.css',
  'styles/bearbeiten.css',
  'styles/werkstatt.css',
];

/* Nach der Aufteilung hinzugekommene Stilteile. Sie sind bewusst von
   STIL_TEILE getrennt: Der SHA-256-Beweis weiter unten belegt, dass die
   urspruengliche stil.css durch die Aufteilung nichts verloren hat. Diese
   Aussage bleibt nur gueltig, solange sie ausschliesslich ueber die vier
   Ursprungsteile gefuehrt wird. Neue Gestaltung kommt deshalb hier dazu. */
const STIL_ZUSATZ = [
  'styles/kategorien.css',
  'styles/handy.css',
  'styles/grundregeln.css',
];

const STIL_ALLE = [...STIL_TEILE, ...STIL_ZUSATZ];

// SHA-256 der unveränderten vollständigen stil.css vor der Aufteilung.
const URSPRUNG_STIL_SHA256 = '638fbdf31d1d8a35b291f7667d34fb4d6455a327397a914e81fe8c0d22470133';

const SENTINELS = {
  'styles/tokens.css': [
    ':root {',
    'html[data-thema="hell"] {',
    '* { box-sizing: border-box; }',
    'body {',
    '.mikro {',
  ],
  'styles/wiki.css': [
    '.kopf {',
    '.navigation {',
    '.artikel-raster {',
    '.vorschau {',
    '@media (max-width: 60rem) {',
    '.anmelde-knopf {',
  ],
  'styles/bearbeiten.css': [
    '.bearbeiten-knopf {',
    '.schluessel-huelle {',
    'html.thema-wechsel *',
    '.struktur-leiste {',
    '.zeile-formular {',
  ],
  'styles/kategorien.css': [
    '.symbol-vorrat {',
    '.symbol {',
    '.kachel .k-marke {',
    '.kachel[data-kategorie="factions"],',
    '.kachel[data-kategorie="lore"],',
  ],
  'styles/werkstatt.css': [
    '.kachel[data-kategorie="werkstatt"]',
    '.modul-fenster {',
    '.kachel[data-kategorie="regeln"]',
    '.assistent {',
    '.werkstatt-seite {',
    '.eintrag-bild {',
  ],
};

function normalisieren(text) {
  return text.replace(/\r\n/gu, '\n');
}

function sha256(text) {
  return createHash('sha256').update(text).digest('hex');
}

async function textLesen(relativ) {
  const text = normalisieren(await readFile(join(WURZEL, ...relativ.split('/')), 'utf8'));
  assert.ok(text.trim(), relativ + ' darf nicht leer sein.');
  return text;
}

function importsLesen(fassade) {
  const muster = /@import\s+url\(\s*["']([^"']+)["']\s*\)\s*;/gu;
  return [...fassade.matchAll(muster)].map((fund) => ({
    pfad: fund[1],
    start: fund.index,
    ende: fund.index + fund[0].length,
  }));
}

function reineFassadePruefen(fassade) {
  const imports = importsLesen(fassade);
  assert.deepEqual(imports.map((eintrag) => eintrag.pfad), STIL_ALLE, 'stil.css muss alle CSS-Teile exakt in Quellreihenfolge importieren.');

  const ohneKommentare = fassade.replace(/\/\*[\s\S]*?\*\//gu, ' ');
  const ohneImports = ohneKommentare.replace(/@import\s+url\(\s*["'][^"']+["']\s*\)\s*;/gu, ' ').trim();
  assert.equal(ohneImports, '', 'stil.css ist ausschließlich eine Kommentar- und Importfassade.');

  for (let index = 1; index < imports.length; index += 1) {
    assert.ok(imports[index - 1].ende <= imports[index].start, 'Die CSS-Imports dürfen sich nicht überlappen.');
  }
}

/**
 * Ob ein Stilanker als **Grunddefinition** in diesem Text steht.
 *
 * Entscheidend ist Spalte 0. Ein Anker wie `.kopf {` ganz links ist die
 * Stelle, an der ein Element sein Aussehen bekommt — die soll es genau
 * einmal geben, damit niemand einen Block still in eine andere Datei
 * verschiebt.
 *
 * Eingerueckte Vorkommen sind dagegen **Ueberschreibungen** in einer
 * Media Query oder unter einem Elternselektor, und die gehoeren
 * ausdruecklich in die Zusatzdateien. Zuvor zaehlte hier `trimStart()`
 * mit — dadurch sah eine eingerueckte Handy-Regel wie ein zweiter
 * Grundblock aus, und keine Zusatzdatei durfte je etwas anpassen.
 */
function stilankerVorhanden(text, sentinel) {
  return text.split('\n').some((zeile) => zeile.startsWith(sentinel));
}

function sentinelPruefen(teile) {
  for (const [pfad, sentinels] of Object.entries(SENTINELS)) {
    const text = teile.get(pfad);

    for (const sentinel of sentinels) {
      assert.ok(stilankerVorhanden(text, sentinel), pfad + ' muss den Stilanker „' + sentinel + '“ enthalten.');

      for (const andererPfad of STIL_ALLE) {
        if (andererPfad === pfad) continue;
        assert.ok(
          !stilankerVorhanden(teile.get(andererPfad), sentinel),
          'Stilanker „' + sentinel + '“ darf nicht zusätzlich in ' + andererPfad + ' liegen.',
        );
      }
    }
  }
}

async function cacheGraphPruefen() {
  const graph = await browserGraphLesen(WURZEL);
  const kanten = graph.referenzen.filter((referenz) => referenz.von === STIL_FASSADE);

  assert.equal(kanten.length, STIL_ALLE.length, 'stil.css darf genau ' + STIL_ALLE.length + ' Browser-Abhängigkeiten haben.');
  assert.deepEqual(kanten.map((referenz) => referenz.ziel), STIL_ALLE, 'Der Cache-Graph muss die CSS-Imports in Quellreihenfolge erkennen.');

  for (const referenz of kanten) {
    assert.equal(referenz.format, 'css', referenz.von + ' → ' + referenz.ziel + ' muss als CSS-Kante erkannt werden.');
    assert.equal(referenz.versionieren, true, referenz.von + ' → ' + referenz.ziel + ' muss veränderlich cache-versioniert werden.');
    assert.ok(graph.abhaengigkeiten.has(referenz.ziel), referenz.ziel + ' muss eine lokale Browser-Abhängigkeit sein.');
  }

  return graph;
}

async function ausfuehren() {
  const vorab = new Map();
  for (const pfad of [STIL_FASSADE, ...STIL_ALLE]) {
    vorab.set(pfad, await textLesen(pfad));
  }

  reineFassadePruefen(vorab.get(STIL_FASSADE));
  const teile = new Map(STIL_ALLE.map((pfad) => [pfad, vorab.get(pfad)]));
  sentinelPruefen(teile);

  const wiederhergestellt = STIL_TEILE.map((pfad) => teile.get(pfad)).join('');
  assert.equal(
    sha256(wiederhergestellt),
    URSPRUNG_STIL_SHA256,
    'Die vier CSS-Teile müssen die bisherige stil.css vollständig und in derselben Reihenfolge ergeben.',
  );

  const graph = await cacheGraphPruefen();

  for (const [pfad, vorher] of vorab) {
    assert.equal(await textLesen(pfad), vorher, 'Die Stilprüfung darf ' + pfad + ' nicht verändern.');
  }

  console.log('Age-of-Beast-Wiki – Stilstruktur geprüft');
  console.log('Importe: ' + STIL_ALLE.length + ' (' + STIL_TEILE.length + ' aus der Aufteilung, ' + STIL_ZUSATZ.length + ' später hinzugekommen)');
  console.log('CSS-Abhängigkeiten: ' + STIL_ALLE.length);
  console.log('Browser-Abhängigkeiten gesamt: ' + graph.abhaengigkeiten.size);
  console.log('Ursprungsstil vollständig: ja');
  console.log('Quelle unverändert: ja');
}

try {
  await ausfuehren();
} catch (fehler) {
  console.error('Stilstruktur-Prüfung fehlgeschlagen: ' + fehler.message);
  process.exitCode = 1;
}
