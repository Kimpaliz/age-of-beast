/**
 * [Aufgabe: Weltdaten]
 * Legt die Weltdaten aus `daten/quelle.json` in Firestore ab.
 *
 * Gebraucht wird das genau einmal: beim Umzug von der Datei in die
 * Datenbank. Danach schreibt das Wiki selbst.
 *
 * Aufruf:
 *   node werkzeuge/welt-hochladen.mjs --pruefen     (nur zeigen, was käme)
 *   node werkzeuge/welt-hochladen.mjs --wirklich    (tatsächlich schreiben)
 *
 * Ohne `--wirklich` wird nichts geschrieben. Das ist Absicht: Ein
 * versehentlicher Aufruf würde sonst den in Firestore gepflegten Stand
 * mit einer womöglich alten Datei überschreiben.
 *
 * Zugang: Das Werkzeug holt sich ein Token über die bereits auf diesem
 * Rechner eingerichtete Google-Anmeldung (`gcloud auth`). Es braucht
 * deshalb weder ein npm-Paket noch einen Dienstschlüssel im Repository —
 * das Wiki bleibt ohne Abhängigkeiten und ohne Geheimnis in Git.
 *
 * Sicherheitsleine: Das Werkzeug schreibt ausschliesslich in Sammlungen,
 * deren Name mit `wiki_` beginnt. Andere Anwendungen im selben
 * Firebase-Projekt kann es damit nicht berühren.
 */
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SAMMLUNG, STAND_DOKUMENT, inDokumente, standErzeugen } from './firestore-format.mjs';

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), '..');
const PROJEKT = 'kampagnenrahmen-jt';

if (!SAMMLUNG.startsWith('wiki_')) {
  console.error('Abbruch: Die Zielsammlung „' + SAMMLUNG + '" gehört nicht zum Wiki.');
  process.exit(1);
}

const wirklich = process.argv.includes('--wirklich');

/** Holt ein Zugangstoken von der eingerichteten gcloud-Anmeldung. */
function tokenHolen() {
  if (process.env.FIRESTORE_TOKEN) return process.env.FIRESTORE_TOKEN.trim();
  const kandidaten = [
    'gcloud.cmd',
    join(process.env.LOCALAPPDATA || '', 'Google', 'Cloud SDK', 'google-cloud-sdk', 'bin', 'gcloud.cmd'),
    'gcloud',
  ];
  for (const befehl of kandidaten) {
    try {
      // `shell: true` ist unter Windows noetig: Node startet eine .cmd
      // sonst nicht und meldet EINVAL.
      const aus = execFileSync(befehl, ['auth', 'print-access-token'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
        shell: process.platform === 'win32',
      });
      const token = aus.trim();
      if (token) return token;
    } catch { /* nächsten Kandidaten versuchen */ }
  }
  throw new Error(
    'Kein Zugangstoken. Entweder `gcloud auth login` ausführen '
    + 'oder die Umgebungsvariable FIRESTORE_TOKEN setzen.',
  );
}

function adresse(dokument) {
  return 'https://firestore.googleapis.com/v1/projects/' + PROJEKT
    + '/databases/(default)/documents/' + SAMMLUNG + '/' + encodeURIComponent(dokument);
}

async function schreiben(token, dokument, felder) {
  const antwort = await fetch(adresse(dokument), {
    method: 'PATCH',
    headers: {
      authorization: 'Bearer ' + token,
      'content-type': 'application/json',
      'x-goog-user-project': PROJEKT,
    },
    body: JSON.stringify({ fields: felder }),
  });
  if (!antwort.ok) {
    const text = await antwort.text();
    throw new Error('Schreiben von „' + dokument + '" fehlgeschlagen (' + antwort.status + '): ' + text.slice(0, 300));
  }
}

const quelle = JSON.parse(await readFile(join(WURZEL, 'daten', 'quelle.json'), 'utf8'));
const dokumente = inDokumente(quelle);
const stand = standErzeugen(Date.now(), Math.random());
const jetzt = new Date().toISOString();

let gesamt = 0;
console.log('Firebase-Projekt: ' + PROJEKT);
console.log('Sammlung:         ' + SAMMLUNG);
console.log('');
console.log('Dokumente:');
for (const dokument of dokumente) {
  const bytes = Buffer.byteLength(dokument.inhalt, 'utf8');
  gesamt += bytes;
  const warnung = bytes > 1024 * 1024 ? '  ÜBER DER GRENZE VON 1 MiB' : '';
  console.log('  ' + dokument.name.padEnd(14) + (bytes / 1024).toFixed(1).padStart(9) + ' KB' + warnung);
  if (bytes > 1024 * 1024) {
    console.error('\nAbbruch: „' + dokument.name + '" ist zu gross für ein Firestore-Dokument.');
    process.exit(1);
  }
}
console.log('  ' + '_stand'.padEnd(14) + '      klein');
console.log('');
console.log('Zusammen: ' + (gesamt / 1024).toFixed(1) + ' KB in ' + (dokumente.length + 1) + ' Dokumenten');
console.log('Stand:    ' + stand);

if (!wirklich) {
  console.log('');
  console.log('Nichts geschrieben. Mit --wirklich tatsächlich ablegen.');
  process.exit(0);
}

const token = tokenHolen();
console.log('');
for (const dokument of dokumente) {
  await schreiben(token, dokument.name, {
    inhalt: { stringValue: dokument.inhalt },
    stand: { stringValue: stand },
    geaendertVon: { stringValue: 'welt-hochladen' },
    geaendertAm: { timestampValue: jetzt },
  });
  console.log('geschrieben: ' + dokument.name);
}

await schreiben(token, STAND_DOKUMENT, {
  inhalt: { stringValue: '{}' },
  stand: { stringValue: stand },
  geaendertVon: { stringValue: 'welt-hochladen' },
  geaendertAm: { timestampValue: jetzt },
});
console.log('geschrieben: ' + STAND_DOKUMENT);

console.log('');
console.log('Fertig. ' + (dokumente.length + 1) + ' Dokumente in ' + SAMMLUNG + '.');
