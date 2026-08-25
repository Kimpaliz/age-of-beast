/**
 * ACHTUNG – NICHT MEHR IM BETRIEB (seit Fassung 2.0.0, 25.08.2026)
 * ================================================================
 *
 * Seit dem Umstieg auf GitHub ist `daten/quelle.json` im Repository die
 * Wahrheit. Sie wird im Wiki bearbeitet und dort gespeichert. Die
 * Weltenschmiede wird nicht mehr benutzt.
 *
 * Dieses Skript holt den Stand aus der **alten** Quelle, der Weltenschmiede
 * (Firebase Realtime Database). Es bleibt nur als Rückweg erhalten, falls
 * dort noch einmal etwas nachzuholen wäre.
 *
 * WER ES AUSFÜHRT, ÜBERSCHREIBT `daten/quelle.json` mit dem alten Stand
 * und verliert alles, was seither im Wiki geändert wurde. Vorher also die
 * Datei sichern oder in Git nachsehen.
 *
 * ----------------------------------------------------------------
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
const ZIEL = join(HIER, '..', 'daten', 'quelle.json');

const DATENBANK = 'https://kampagnenrahmen-jt-default-rtdb.europe-west1.firebasedatabase.app';
const PROJEKT_PFAD = 'rooms/project-sturmwende-20260730/project';

/* --- Sicherung gegen versehentliches Ausfuehren -------------------- */

// Seit Fassung 2.0.0 ist `daten/quelle.json` die Wahrheit. Dieses Skript
// wuerde sie mit dem alten Stand aus der Weltenschmiede ueberschreiben.
// Ein versehentliches Ausfuehren kostet dann alle Aenderungen seither.
if (!process.argv.includes('--wirklich')) {
  console.error('Dieses Skript ist seit Fassung 2.0.0 nicht mehr im Betrieb.');
  console.error('');
  console.error('Die Wahrheit ist `daten/quelle.json` im Repository. Sie wird im');
  console.error('Wiki bearbeitet. Dieses Skript wuerde sie mit dem alten Stand aus');
  console.error('der Weltenschmiede ueberschreiben und alles verlieren, was seither');
  console.error('geaendert wurde.');
  console.error('');
  console.error('Wenn das wirklich gewollt ist:');
  console.error('  node werkzeuge/welt-holen.mjs --wirklich');
  process.exit(1);
}

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
