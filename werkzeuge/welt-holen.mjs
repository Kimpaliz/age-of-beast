/**
 * Holt den aktuellen Sturmwende-Stand aus der Weltenschmiede
 * (Firebase Realtime Database) und legt ihn als Rohdatei unter
 * `werkzeuge/rohdaten-weltenschmiede.json` ab.
 *
 * Dieses Skript LIEST nur. Es schreibt niemals in die Datenbank.
 *
 * Voraussetzung: einmalige Google-Anmeldung auf dem eigenen Rechner.
 * Falls sie fehlt, meldet das Skript unten genau, was zu tun ist.
 *
 * Aufruf:
 *   node werkzeuge/welt-holen.mjs
 *
 * Es werden bewusst keine zusätzlichen Pakete gebraucht: Das Zugangstoken
 * kommt von der bereits installierten Google-Cloud-Kommandozeile, der Abruf
 * über das in Node eingebaute `fetch`.
 */

import { writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = dirname(fileURLToPath(import.meta.url));
const ZIEL = join(HIER, 'rohdaten-weltenschmiede.json');

const DATENBANK = 'https://kampagnenrahmen-jt-default-rtdb.europe-west1.firebasedatabase.app';
const PROJEKT_PFAD = 'rooms/project-sturmwende-20260730/project';

/* --- Zugangstoken besorgen ---------------------------------------- */

function tokenHolen() {
  const windows = process.platform === 'win32';
  // Auf diesem Rechner ist die PowerShell-Skriptausführung gesperrt,
  // deshalb der Umweg über cmd.
  const befehl = windows ? 'cmd' : 'gcloud';
  const argumente = windows
    ? ['/c', 'call gcloud.cmd auth application-default print-access-token']
    : ['auth', 'application-default', 'print-access-token'];

  try {
    return execFileSync(befehl, argumente, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch (fehler) {
    console.error('Es konnte kein Zugang zur Weltenschmiede hergestellt werden.\n');
    console.error('Bitte einmalig anmelden mit:\n');
    console.error('  gcloud auth application-default login\n');
    console.error('Meldung des Systems:', String(fehler.stderr || fehler.message).trim().split('\n')[0]);
    process.exit(1);
  }
}

/* --- Abrufen ------------------------------------------------------- */

const token = tokenHolen();
if (!token || token.length < 20) {
  console.error('Das Zugangstoken sieht nicht gültig aus. Bitte erneut anmelden mit:');
  console.error('  gcloud auth application-default login');
  process.exit(1);
}

const antwort = await fetch(`${DATENBANK}/${PROJEKT_PFAD}.json`, {
  headers: { Authorization: `Bearer ${token}` },
});

if (!antwort.ok) {
  console.error(`Der Abruf schlug fehl (HTTP ${antwort.status}).`);
  if (antwort.status === 401 || antwort.status === 403) {
    console.error('Die Anmeldung reicht nicht aus. Bitte neu anmelden mit:');
    console.error('  gcloud auth application-default login');
  }
  process.exit(1);
}

const daten = await antwort.json();

if (!daten || !daten.elements) {
  console.error('Unter dem Pfad kamen keine Weltdaten zurück. Wurde das Projekt umbenannt?');
  process.exit(1);
}

writeFileSync(ZIEL, JSON.stringify(daten, null, 2), 'utf8');

const anzahl = Object.values(daten.elements).reduce((n, gruppe) => n + Object.keys(gruppe).length, 0);
console.log(`Geholt: ${anzahl} Einträge, Stand ${daten.updatedAt}`);
console.log(`Gespeichert unter: ${ZIEL}`);
console.log('');
console.log('Nächster Schritt:  node werkzeuge/welt-aufbereiten.mjs');
