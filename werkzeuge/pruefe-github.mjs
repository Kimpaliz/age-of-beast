/**
 * Prueft den Weg, auf dem das Wiki im Browser nach GitHub speichert.
 *
 * Es wird **nichts** geschrieben und nichts abgefragt: Diese Pruefung
 * braucht kein Netz und keinen Schluessel. Sie sichert die zwei Dinge ab,
 * die beim Speichern still schiefgehen koennten.
 *
 *   1. **Umkodierung.** Der Browser muss die Dateien Base64-kodiert
 *      hochladen. Bei 280 KB und deutschen Umlauten ist das die Stelle,
 *      an der eine naive Umsetzung entweder Zeichen zerstoert oder am
 *      Aufrufstapel scheitert.
 *
 *   2. **Gleiche Dateien.** Der Browser legt bei jedem Speichern auch die
 *      abgeleiteten Dateien `daten/welt.json` und `daten/welt.js` in den
 *      Commit. Erzeugte er sie auch nur um ein Leerzeichen anders als das
 *      Skript auf der Festplatte, wuerde der Veroeffentlichungslauf
 *      danach zu Recht meckern – und zwar erst nach dem Speichern, also
 *      zum denkbar unguenstigsten Zeitpunkt.
 *
 * Zusaetzlich wird geprueft, dass `umwandeln()` wirklich vorhersagbar ist:
 * zweimal derselbe Rohstand muss zweimal dieselben Bytes ergeben.
 *
 * Aufruf:
 *   node werkzeuge/pruefe-github.mjs
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { weltDateien, QUELLE } from './welt-dateien.mjs';
import {
  alsBase64,
  ausBase64,
  dateienSchreiben,
  GitHubFehler,
} from './github-speicher.mjs';

const HIER = dirname(fileURLToPath(import.meta.url));
const WURZEL = join(HIER, '..');

const fehler = [];
const melde = (text) => fehler.push(text);

/* ------------------------------------------------------------------ *
 * 1. Umkodierung
 * ------------------------------------------------------------------ */

const KNIFFLIGE_TEXTE = [
  ['leer', ''],
  ['Umlaute', 'Größe, Fährte, Öl, Übermut, weiß'],
  ['französisch', 'Créatures étranges – naïve Idée'],
  ['Sonderzeichen', '« » „ " ‚ ‘ … – — · ✎ ◆ ⚑ ❖ ☗ ⚔'],
  ['Zeilenumbrüche', 'Erste\nZweite\r\nDritte\tmit Tabulator'],
  ['HTML', '<p>Ein <strong>Test</strong> &amp; noch einer</p>'],
];

for (const [name, text] of KNIFFLIGE_TEXTE) {
  const zurueck = ausBase64(alsBase64(text));
  if (zurueck !== text) melde(`Umkodierung verändert „${name}": ${JSON.stringify(zurueck)}`);
}

// Der Ernstfall: die echte Quelldatei in voller Länge.
const quelleText = readFileSync(join(WURZEL, QUELLE), 'utf8');
let grossOk = false;
try {
  const zurueck = ausBase64(alsBase64(quelleText));
  grossOk = zurueck === quelleText;
  if (!grossOk) melde('Die echte Quelldatei kommt nach dem Umkodieren verändert zurück.');
} catch (f) {
  melde('Die echte Quelldatei ließ sich nicht umkodieren: ' + f.message);
}

/* ------------------------------------------------------------------ *
 * 2. Gleiche Dateien wie auf der Festplatte
 * ------------------------------------------------------------------ */

const roh = JSON.parse(quelleText);
const { dateien } = weltDateien(roh);

const ERWARTET = [QUELLE, 'daten/welt.json', 'daten/welt.js'];
for (const pfad of ERWARTET) {
  if (!(pfad in dateien)) { melde('Im Commit fehlte die Datei ' + pfad); continue; }
  const aufPlatte = readFileSync(join(WURZEL, pfad), 'utf8');
  if (dateien[pfad] === aufPlatte) continue;

  melde(
    `Der Browser würde ${pfad} anders schreiben als das Skript ` +
      `(${dateien[pfad].length} statt ${aufPlatte.length} Zeichen).`,
  );
  for (let i = 0; i < Math.max(dateien[pfad].length, aufPlatte.length); i += 1) {
    if (dateien[pfad][i] !== aufPlatte[i]) {
      melde('  Erste Abweichung bei Zeichen ' + i + ':');
      melde('    Browser: ' + JSON.stringify(dateien[pfad].slice(Math.max(0, i - 50), i + 50)));
      melde('    Platte:  ' + JSON.stringify(aufPlatte.slice(Math.max(0, i - 50), i + 50)));
      break;
    }
  }
}

/* ------------------------------------------------------------------ *
 * 3. Zweimal dasselbe Ergebnis
 * ------------------------------------------------------------------ */

const nochmal = weltDateien(JSON.parse(quelleText)).dateien;
for (const pfad of ERWARTET) {
  if (dateien[pfad] !== nochmal[pfad]) {
    melde(`${pfad} fällt bei zwei Läufen unterschiedlich aus – irgendwo steckt noch etwas Wanderndes drin.`);
  }
}

/* ------------------------------------------------------------------ *
 * 4. Schreibvertrag mit isolierter Fetch-Attrappe
 * ------------------------------------------------------------------ */

const TEST_DATEIEN = {
  [QUELLE]: '{"version":42}\n',
  'daten/welt.json': '{"titel":"Probe"}\n',
  'daten/welt.js': 'window.AGE_OF_BEAST_WELT = {"titel":"Probe"};\n',
};
let attrappenSzenarien = 0;

function jsonAntwort(inhalt, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 409 ? 'Conflict' : 'OK',
    text: async () => JSON.stringify(inhalt),
  };
}

async function mitFetchAttrappe(name, beantworten, pruefen) {
  const echtesFetch = globalThis.fetch;
  const aufrufe = [];
  globalThis.fetch = async (adresse, einstellungen = {}) => {
    const aufruf = {
      adresse: String(adresse),
      methode: einstellungen.method || 'GET',
      body: einstellungen.body,
    };
    aufrufe.push(aufruf);
    return beantworten(aufruf, aufrufe);
  };

  try {
    await pruefen(aufrufe);
  } catch (fehler) {
    melde(name + ': Die Fetch-Attrappe ist selbst fehlgeschlagen: ' + (fehler.message || String(fehler)));
  } finally {
    globalThis.fetch = echtesFetch;
  }
}

function istSchreibzugriff(aufruf) {
  return aufruf.methode === 'POST' || aufruf.methode === 'PATCH' ||
    aufruf.methode === 'PUT' || aufruf.methode === 'DELETE';
}

function erwarteGitHubFehler(name, fehler, status) {
  if (!(fehler instanceof GitHubFehler)) {
    melde(name + ': Es kam kein GitHubFehler zurück.');
    return;
  }
  if (fehler.status !== status) {
    melde(name + ': Erwarteter Status ' + status + ', erhalten ' + fehler.status + '.');
  }
}

function erfolgreicheAntworten(quellenSha) {
  let blobNummer = 0;
  return (aufruf) => {
    const adresse = new URL(aufruf.adresse);
    const pfad = adresse.pathname;

    if (aufruf.methode === 'GET' && pfad.endsWith('/git/ref/heads/main')) {
      return jsonAntwort({ object: { sha: 'kopf-commit' } });
    }
    if (aufruf.methode === 'GET' && pfad.endsWith('/git/commits/kopf-commit')) {
      return jsonAntwort({ tree: { sha: 'kopf-baum' } });
    }
    if (aufruf.methode === 'GET' && pfad.endsWith('/git/trees/kopf-baum')) {
      if (adresse.searchParams.get('recursive') !== '1') {
        throw new Error('Der Commit-Baum wurde nicht rekursiv gelesen.');
      }
      return jsonAntwort({
        tree: [
          { path: QUELLE, type: 'blob', sha: quellenSha },
          { path: 'daten/welt.json', type: 'blob', sha: 'kopf-welt-json' },
          { path: 'daten/welt.js', type: 'blob', sha: 'kopf-welt-js' },
        ],
      });
    }
    if (aufruf.methode === 'POST' && pfad.endsWith('/git/blobs')) {
      blobNummer += 1;
      return jsonAntwort({ sha: 'neuer-blob-' + blobNummer });
    }
    if (aufruf.methode === 'POST' && pfad.endsWith('/git/trees')) {
      return jsonAntwort({ sha: 'neuer-baum' });
    }
    if (aufruf.methode === 'POST' && pfad.endsWith('/git/commits')) {
      return jsonAntwort({ sha: 'neuer-commit' });
    }
    if (aufruf.methode === 'PATCH' && pfad.endsWith('/git/refs/heads/main')) {
      return jsonAntwort({ ref: 'refs/heads/main' });
    }
    throw new Error('Unerwartete GitHub-Anfrage: ' + aufruf.methode + ' ' + adresse.pathname + adresse.search);
  };
}

async function vorNetzzugriffAbgelehnt(name, auftrag, status) {
  attrappenSzenarien += 1;
  await mitFetchAttrappe(
    name,
    () => {
      throw new Error('Ein ungültiger Auftrag darf keine Anfrage auslösen.');
    },
    async (aufrufe) => {
      let fehler = null;
      try {
        await dateienSchreiben(null, auftrag);
      } catch (gefangen) {
        fehler = gefangen;
      }
      if (!fehler) melde(name + ': Der ungültige Auftrag wurde angenommen.');
      else erwarteGitHubFehler(name, fehler, status);
      if (aufrufe.length) melde(name + ': Es gab trotz Vorabprüfung ' + aufrufe.length + ' Anfrage(n).');
    },
  );
}

await vorNetzzugriffAbgelehnt(
  'Fehlende Quellen-SHA',
  {
    dateien: { ...TEST_DATEIEN },
    nachricht: 'Probe',
    erwarteteSha: '',
    erwartetePfad: QUELLE,
  },
  409,
);

await vorNetzzugriffAbgelehnt(
  'Falscher Quellenpfad',
  {
    dateien: { ...TEST_DATEIEN },
    nachricht: 'Probe',
    erwarteteSha: 'quelle-kopf',
    erwartetePfad: 'daten/welt.json',
  },
  409,
);

const ohneWeltJs = { ...TEST_DATEIEN };
delete ohneWeltJs['daten/welt.js'];
await vorNetzzugriffAbgelehnt(
  'Unvollständiges Dateiset',
  {
    dateien: ohneWeltJs,
    nachricht: 'Probe',
    erwarteteSha: 'quelle-kopf',
    erwartetePfad: QUELLE,
  },
  400,
);

await vorNetzzugriffAbgelehnt(
  'Zusätzliche Datei im Dateiset',
  {
    dateien: { ...TEST_DATEIEN, 'daten/fremd.json': '{}' },
    nachricht: 'Probe',
    erwarteteSha: 'quelle-kopf',
    erwartetePfad: QUELLE,
  },
  400,
);

await vorNetzzugriffAbgelehnt(
  'Nichttext in einer Weltdatei',
  {
    dateien: { ...TEST_DATEIEN, 'daten/welt.js': { falsch: true } },
    nachricht: 'Probe',
    erwarteteSha: 'quelle-kopf',
    erwartetePfad: QUELLE,
  },
  400,
);

attrappenSzenarien += 1;
await mitFetchAttrappe(
  'Head-Konflikt',
  erfolgreicheAntworten('andere-quellen-sha'),
  async (aufrufe) => {
    let fehler = null;
    try {
      await dateienSchreiben(null, {
        dateien: { ...TEST_DATEIEN },
        nachricht: 'Probe',
        erwarteteSha: 'quelle-kopf',
        erwartetePfad: QUELLE,
      });
    } catch (gefangen) {
      fehler = gefangen;
    }
    if (!fehler) melde('Head-Konflikt: Die alte Quellen-SHA wurde angenommen.');
    else erwarteGitHubFehler('Head-Konflikt', fehler, 409);
    if (aufrufe.length !== 3) {
      melde('Head-Konflikt: Erwartet wurden Ref, Commit und Baum, erhalten ' + aufrufe.length + ' Anfragen.');
    }
    if (aufrufe.some(istSchreibzugriff)) {
      melde('Head-Konflikt: Vor dem Abbruch wurde bereits eine GitHub-Schreibanfrage ausgelöst.');
    }
  },
);

attrappenSzenarien += 1;
await mitFetchAttrappe(
  'Erfolgreicher Schreibvertrag',
  erfolgreicheAntworten('quelle-kopf'),
  async (aufrufe) => {
    let ergebnis = null;
    try {
      ergebnis = await dateienSchreiben(null, {
        dateien: { ...TEST_DATEIEN },
        nachricht: 'Probe',
        erwarteteSha: 'quelle-kopf',
        erwartetePfad: QUELLE,
      });
    } catch (fehler) {
      melde('Erfolgreicher Schreibvertrag: Unerwarteter Fehler: ' + (fehler.message || String(fehler)));
    }

    if (ergebnis?.commit !== 'neuer-commit') {
      melde('Erfolgreicher Schreibvertrag: Der erwartete Commit wurde nicht zurückgegeben.');
    }
    if (aufrufe.length !== 9) {
      melde('Erfolgreicher Schreibvertrag: Erwartet wurden 9 GitHub-Anfragen, erhalten ' + aufrufe.length + '.');
    }
    const blobAufrufe = aufrufe.filter((aufruf) =>
      aufruf.methode === 'POST' && new URL(aufruf.adresse).pathname.endsWith('/git/blobs'),
    );
    if (blobAufrufe.length !== ERWARTET.length) {
      melde('Erfolgreicher Schreibvertrag: Es wurden nicht genau drei Blobs angelegt.');
    }
    const baumAufruf = aufrufe.find((aufruf) =>
      aufruf.methode === 'POST' && new URL(aufruf.adresse).pathname.endsWith('/git/trees'),
    );
    if (!baumAufruf) {
      melde('Erfolgreicher Schreibvertrag: Die neue Baum-Anfrage fehlt.');
    } else {
      const pfade = JSON.parse(baumAufruf.body).tree.map((eintrag) => eintrag.path);
      if (pfade.join('|') !== ERWARTET.join('|')) {
        melde('Erfolgreicher Schreibvertrag: Der Baum enthält nicht genau die drei Vertragsdateien.');
      }
    }
    const refAufruf = aufrufe.find((aufruf) =>
      aufruf.methode === 'PATCH' && new URL(aufruf.adresse).pathname.endsWith('/git/refs/heads/main'),
    );
    if (!refAufruf) {
      melde('Erfolgreicher Schreibvertrag: Das finale Ref-Update fehlt.');
    } else if (JSON.parse(refAufruf.body).force !== false) {
      melde('Erfolgreicher Schreibvertrag: Das Ref-Update ist nicht explizit force:false.');
    }
  },
);

/* ------------------------------------------------------------------ *
 * Bilanz
 * ------------------------------------------------------------------ */

console.log('Age-of-Beast-Wiki – Speicherweg nach GitHub geprueft');
console.log('----------------------------------------------------');
console.log(`Kniffligste Texte:      ${KNIFFLIGE_TEXTE.length}`);
console.log(`Echte Quelldatei:       ${Math.round(quelleText.length / 1024)} KB, umkodiert ${grossOk ? 'unveraendert' : 'FEHLERHAFT'}`);
console.log(`Dateien im Commit:      ${Object.keys(dateien).join(', ')}`);
console.log(`Fetch-Attrappen:        ${attrappenSzenarien}`);

if (!fehler.length) {
  console.log('');
  console.log('Alles in Ordnung:');
  console.log('  - Umkodierung veraendert keinen Text, auch nicht bei voller Dateigroesse.');
  console.log('  - Der Browser schreibt Zeichen fuer Zeichen dieselben Dateien wie das Skript.');
  console.log('  - Zwei Laeufe ergeben dasselbe Ergebnis.');
  console.log('  - Der Schreibvertrag weist ungültige, alte und konkurrierende Aufträge vor dem Schreiben ab.');
  process.exit(0);
}

console.error('');
console.error(`FEHLER: ${fehler.length} Beanstandung(en).`);
for (const zeile of fehler) console.error('  ' + zeile);
console.error('');
console.error('Behebung: node werkzeuge/welt-aufbereiten.mjs   und das Ergebnis mitliefern.');
process.exit(1);
