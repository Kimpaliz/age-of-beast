/**
 * Vertragstest für den Bearbeitungskontext.
 *
 * Der Test läuft ohne DOM- oder Browser-Attrappe. Er prüft die kleine
 * Übergabe zwischen `bearbeiten.js` und den drei Bearbeitungsmodulen:
 * Delegation, eingefrorene Oberfläche, ungültige Rückrufe, den dynamischen
 * Runtime-Leser sowie die bewusst schmale Quell- und Servergrenze.
 *
 * Aufruf:
 *   node werkzeuge/pruefe-bearbeitungskontext.mjs
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BearbeitungskontextFehler,
  bearbeitungskontextErstellen,
} from '../bearbeiten-kontext.js';

const HIER = dirname(fileURLToPath(import.meta.url));
const WURZEL = join(HIER, '..');
const PFLICHT_RUECKRUFE = ['rohStand', 'schreiben', 'neuZeichnen', 'melden', 'runtimeHolen'];

const fehler = [];
let pruefungen = 0;

function pruefe(bedingung, meldung) {
  pruefungen += 1;
  if (!bedingung) fehler.push(meldung);
}

function fehlerErmitteln(aktion) {
  try {
    aktion();
  } catch (fehlerBeimAufruf) {
    return fehlerBeimAufruf;
  }
  return null;
}

function dateiLesen(name) {
  return readFileSync(join(WURZEL, name), 'utf8');
}

async function delegierenUndEinfrierenPruefen() {
  const aufrufe = [];
  const ersterHost = { kennung: 'erster-host' };
  const zweiterHost = { kennung: 'zweiter-host' };
  let aktuellerHost = ersterHost;
  const rohStand = { elemente: true };

  const rueckrufe = {
    rohStand(...werte) {
      aufrufe.push(['rohStand', werte]);
      return rohStand;
    },
    async schreiben(...werte) {
      aufrufe.push(['schreiben', werte]);
      return 'gespeichert';
    },
    neuZeichnen(...werte) {
      aufrufe.push(['neuZeichnen', werte]);
      return 'neu gezeichnet';
    },
    melden(...werte) {
      aufrufe.push(['melden', werte]);
      return 'gemeldet';
    },
    runtimeHolen(...werte) {
      aufrufe.push(['runtimeHolen', werte]);
      return aktuellerHost;
    },
  };

  const kontext = bearbeitungskontextErstellen(rueckrufe);

  pruefe(Object.isFrozen(kontext), 'Der Bearbeitungskontext muss eingefroren sein.');
  pruefe(kontext.rohStand('roh') === rohStand, 'rohStand() muss den Rückgabewert unverändert delegieren.');
  pruefe(
    await kontext.schreiben({ feld: 'neu' }, 'Prüfänderung') === 'gespeichert',
    'schreiben() muss den Rückgabewert unverändert delegieren.',
  );
  pruefe(kontext.neuZeichnen('halten') === 'neu gezeichnet', 'neuZeichnen() muss delegieren.');
  pruefe(kontext.melden('Hinweis', 'ok') === 'gemeldet', 'melden() muss delegieren.');
  pruefe(kontext.runtimeHolen() === ersterHost, 'runtimeHolen() muss den ersten Runtime-Host liefern.');

  aktuellerHost = zweiterHost;
  pruefe(
    kontext.runtimeHolen() === zweiterHost,
    'runtimeHolen() darf keinen beim Einrichten eingefrorenen Runtime-Host liefern.',
  );
  pruefe(
    aufrufe.map(([name]) => name).join(',') ===
      ['rohStand', 'schreiben', 'neuZeichnen', 'melden', 'runtimeHolen', 'runtimeHolen'].join(','),
    'Der Kontext muss alle Aufrufe ausschließlich an die zugehörigen Rückrufe weitergeben.',
  );

  const urspruenglicherRohStand = kontext.rohStand;
  const mutierungsfehler = fehlerErmitteln(() => {
    kontext.rohStand = () => null;
  });
  pruefe(
    mutierungsfehler instanceof TypeError && kontext.rohStand === urspruenglicherRohStand,
    'Die eingefrorene Kontextoberfläche darf nicht überschrieben werden.',
  );

  rueckrufe.rohStand = () => null;
  pruefe(
    kontext.rohStand() === rohStand,
    'Der Kontext darf seine geprüften Rückrufe nicht über ein später verändertes Übergabeobjekt verlieren.',
  );
}

function ungueltigeRueckrufePruefen() {
  for (const uebergabe of [null, [], 'kein Objekt']) {
    const fehlerBeimAufruf = fehlerErmitteln(() => bearbeitungskontextErstellen(uebergabe));
    pruefe(
      fehlerBeimAufruf instanceof BearbeitungskontextFehler,
      'Ungültige Kontextübergaben müssen kontrolliert mit BearbeitungskontextFehler scheitern.',
    );
  }

  for (const fehlenderName of PFLICHT_RUECKRUFE) {
    const rueckrufe = Object.fromEntries(PFLICHT_RUECKRUFE.map((name) => [name, () => undefined]));
    rueckrufe[fehlenderName] = null;
    const fehlerBeimAufruf = fehlerErmitteln(() => bearbeitungskontextErstellen(rueckrufe));
    pruefe(
      fehlerBeimAufruf instanceof BearbeitungskontextFehler &&
        fehlerBeimAufruf.message.includes(fehlenderName),
      'Der fehlende Rückruf „' + fehlenderName + '“ muss kontrolliert und eindeutig abgewiesen werden.',
    );
  }
}

function quellgrenzenPruefen() {
  const bearbeiten = dateiLesen('bearbeiten.js');
  const texte = dateiLesen('texte-bearbeiten.js');
  const struktur = dateiLesen('struktur-bedienung.js');
  const rahmen = dateiLesen('rahmen-assistent.js');
  const vorschauServer = dateiLesen('werkzeuge/vorschau-server.mjs');
  const heimServer = dateiLesen('werkzeuge/heim-server.mjs');
  const serverTest = dateiLesen('werkzeuge/pruefe-server-sicherheit.mjs');

  pruefe(
    /import\s*\{\s*bearbeitungskontextErstellen\s*\}\s*from\s*'\.\/bearbeiten-kontext\.js'/.test(bearbeiten),
    'bearbeiten.js muss den Bearbeitungskontext herstellen.',
  );
  pruefe(
    /bearbeitungskontextErstellen\s*\(\s*\{[\s\S]{0,700}runtimeHolen[\s\S]{0,120}\}\s*\)/.test(bearbeiten),
    'bearbeiten.js muss dem Kontext einen dynamischen Runtime-Leser übergeben.',
  );
  pruefe(
    (bearbeiten.match(/window\.ageOfBeast/g) || []).length === 1,
    'Nur bearbeiten.js darf den Runtime-Host direkt lesen.',
  );

  for (const [name, quelltext, kontextName] of [
    ['texte-bearbeiten.js', texte, 'kontext'],
    ['struktur-bedienung.js', struktur, 'kontext'],
    ['rahmen-assistent.js', rahmen, 'bearbeitungsKontext'],
  ]) {
    pruefe(
      !/window\.ageOfBeast/.test(quelltext),
      name + ' darf window.ageOfBeast nicht direkt lesen.',
    );
    pruefe(
      new RegExp('\\b' + kontextName + '\\.runtimeHolen\\s*\\(').test(quelltext),
      name + ' muss seinen Runtime-Host über den Bearbeitungskontext holen.',
    );
  }

  pruefe(
    vorschauServer.includes("'bearbeiten-kontext.js'") && heimServer.includes("'bearbeiten-kontext.js'"),
    'Beide lokalen Server müssen ausschließlich bearbeiten-kontext.js als neue Browser-Abhängigkeit freigeben.',
  );
  pruefe(
    serverTest.includes("'/bearbeiten-kontext.js'"),
    'Der Serversicherheitstest muss bearbeiten-kontext.js als öffentlich erwartete Browser-Abhängigkeit prüfen.',
  );
}

try {
  await delegierenUndEinfrierenPruefen();
  ungueltigeRueckrufePruefen();
  quellgrenzenPruefen();

  console.log('Age-of-Beast-Wiki – Bearbeitungskontext geprüft');
  console.log('--------------------------------------------------');
  console.log('Prüfungen: ' + pruefungen);

  if (fehler.length) {
    console.error('FEHLER: ' + fehler.length + ' Vertragsverletzung(en) erkannt.');
    for (const eintrag of fehler) console.error('  - ' + eintrag);
    process.exitCode = 1;
  } else {
    console.log('Ergebnis: Delegation, Unveränderlichkeit, Fehlerpfade, Runtime-Wechsel und Quellgrenzen sind erfüllt.');
  }
} catch (unerwarteterFehler) {
  console.error('Bearbeitungskontext-Prüfung konnte nicht vollständig ausgeführt werden:', unerwarteterFehler?.stack || unerwarteterFehler);
  process.exitCode = 1;
}
