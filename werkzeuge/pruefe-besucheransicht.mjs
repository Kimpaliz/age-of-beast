/**
 * Ein Besucher laedt kein fremdes Skript.  [Aufgabe: Prüfwesen]
 *
 * Das Wiki ist eine oeffentliche Leseseite. Wer nur liest, soll dafuer
 * nichts von gstatic, keine Analysedienste und kein Firebase-SDK
 * bekommen — gelesen wird ueber die REST-Schnittstelle.
 *
 * ⚠️ **Warum es diese Pruefung gibt:** Am 04.09.2026 hat das neue
 * Hauptmenue genau das eingerissen. `beiKontoWechsel()` beim
 * Seitenaufbau zieht `firebase-app`, `-auth` und `-firestore` nach —
 * drei Skripte, die **jeder** Besucher geladen haette, auch wer sich nie
 * anmeldet. Aufgefallen ist es nur, weil ich die Netzwerkliste der
 * veroeffentlichten Seite durchgesehen habe; keine Pruefung hat
 * angeschlagen.
 *
 * Geprueft wird der **Quelltext**, nicht ein Browserlauf: Ein `import`
 * des SDK auf oberster Ebene laedt immer, ein Aufruf hinter einer
 * Bedingung nicht. Die Unterscheidung steht im Code und ist dort
 * nachlesbar.
 *
 * Kein Browser, kein Netzwerk. Es wird nichts geschrieben.
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), '..');

let pruefungen = 0;
const fehler = [];
const pruefe = (wert, text) => { pruefungen += 1; if (!wert) fehler.push(text); };

const lies = (p) => (existsSync(join(WURZEL, p)) ? readFileSync(join(WURZEL, p), 'utf8') : null);

/* Kommentare zaehlen nicht mit — sonst schlaegt die Pruefung an der
   Begruendung an, warum etwas **nicht** dasteht. Derselbe Fehler ist am
   04.09.2026 schon einmal passiert (Fehlerbuch, Tonwaechter). */
const ohneKommentare = (t) => t
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/(^|[^:])\/\/.*$/gm, '$1 ');

/* ------------------------------------------------------------------ *
 * 1. Keine Seite bindet ein fremdes Skript direkt ein
 * ------------------------------------------------------------------ */

const SEITEN = ['index.html', 'wiki.html', 'karten.html', 'karte.html',
  'bogen.html', 'favoriten.html', 'vorlagen.html'];

for (const seite of SEITEN) {
  const text = lies(seite);
  if (text === null) continue;
  const fremd = [...text.matchAll(/<script[^>]+src=["']([^"']+)["']/gu)]
    .map((m) => m[1])
    .filter((q) => /^https?:\/\//u.test(q));
  pruefe(fremd.length === 0,
    seite + ' bindet ein fremdes Skript direkt ein: ' + fremd.join(', '));

  const fremdeStile = [...text.matchAll(/<link[^>]+href=["'](https?:\/\/[^"']+)["']/gu)]
    .map((m) => m[1])
    .filter((q) => !/^https?:\/\/(fonts\.googleapis|fonts\.gstatic)\./u.test(q));
  pruefe(fremdeStile.length === 0,
    seite + ' laedt eine fremde Formatvorlage: ' + fremdeStile.join(', '));
}

/* ------------------------------------------------------------------ *
 * 2. Das SDK wird nur nach einer Bedingung geladen
 * ------------------------------------------------------------------ */

/* `verbinden()` in `firestore-speicher.mjs` ist die einzige Stelle, die
   das SDK holt. Wer sie beim Seitenaufbau **unbedingt** aufruft, laedt
   es fuer jeden. Erlaubt ist der Aufruf nur aus einer Funktion heraus
   oder hinter einer Bedingung. */
const menue = lies('runtime/plattform.js');
pruefe(menue !== null, 'runtime/plattform.js fehlt.');

if (menue) {
  const code = ohneKommentare(menue);

  /* Aufrufe auf oberster Ebene erkennt man an der Einrueckung: Sie
     stehen in Spalte 0. Alles Eingerueckte steht in einer Funktion. */
  const obersteEbene = code.split('\n').filter((z) => /^[A-Za-z]/.test(z));
  const sofort = obersteEbene.filter((z) => /\bbeiKontoWechsel\s*\(/.test(z));
  pruefe(sofort.length === 0,
    'runtime/plattform.js ruft beiKontoWechsel() beim Seitenaufbau auf ('
    + sofort.join(' | ').slice(0, 120) + '). Damit laedt **jeder** Besucher das '
    + 'Firebase-SDK von gstatic, auch wer sich nie anmeldet.');

  pruefe(/if\s*\([^)]*spurVorhanden\(\)[^)]*\)\s*kontoHorchen\(\)/.test(code),
    'Der Horcher startet nicht mehr hinter der Spur. Ohne diese Bedingung '
    + 'laedt das SDK bei jedem Besuch.');

  pruefe(/localStorage/.test(code) && /try\s*\{/.test(code),
    'Die Spur wird nicht in try/catch gelesen. In einem privaten Fenster '
    + '**wirft** localStorage, es ist nicht bloss leer.');

  pruefe(/oeffentlicheWikis\s*\(/.test(code),
    'Das Menue fragt die oeffentlichen Wikis nicht ab — dann waere es fuer '
    + 'einen Besucher ohne Anmeldung leer.');
}

/* ------------------------------------------------------------------ *
 * 3. Der Leseweg der Wikis geht ohne SDK
 * ------------------------------------------------------------------ */

const speicher = lies('werkzeuge/plattform-speicher.mjs');
if (speicher) {
  const code = ohneKommentare(speicher);
  const block = code.slice(code.indexOf('export async function oeffentlicheWikis'));
  const rumpf = block.slice(0, block.indexOf('\n}') + 2);
  pruefe(!/verbinden\s*\(/.test(rumpf),
    'oeffentlicheWikis() benutzt verbinden() und damit das SDK. Die Liste '
    + 'muss ohne Anmeldung ueber die REST-Schnittstelle gehen.');
}

/* ------------------------------------------------------------------ *
 * Ergebnis
 * ------------------------------------------------------------------ */

if (fehler.length) {
  console.error('Besucheransicht fehlgeschlagen:\n- ' + fehler.join('\n- '));
  process.exitCode = 1;
} else {
  console.log('Besucheransicht geprueft');
  console.log('Pruefungen: ' + pruefungen);
  console.log('Ergebnis: Wer nur liest, laedt kein fremdes Skript.');
}
