/**
 * Liest die Klassentabelle der Regelrecherche aus.  [Aufgabe: Weltdaten]
 *
 * -------------------------------------------------------------------
 * Die neun Klassen sind die einzige Sache, die der
 * Charaktererschaffung noch fehlte. Unterklassen, Abstammungen,
 * Gemeinschaften und Domänenkarten liegen längst als Karten in
 * `daten/daggerheart-karten.json`; die Klassen selbst standen nur als
 * Tabelle in `docs/daggerheart/REGELN-GRUNDLAGEN.md`.
 *
 * **Die Tabelle ist die Quelle, nicht dieses Skript.** Wer einen Wert
 * korrigieren will, ändert die Recherchedatei und lässt das Skript neu
 * laufen. Nichts wird hier abgetippt — dieselbe Regel wie bei
 * `werkzeuge/gegenstaende-auslesen.mjs`.
 *
 * ⚠️ **Warum die Startwerte wichtig sind.** Ausweichen und
 * Lebenspunkte hängen an der Klasse; ohne sie kann eine
 * Charaktererschaffung Schritt 4 („Angaben und Startwerte") nicht
 * ausrechnen, sondern nur nach einer Zahl fragen. Eine Zahl, nach der
 * gefragt wird, ist eine Zahl, die falsch sein kann.
 *
 * Aufruf:
 *   node werkzeuge/klassen-auslesen.mjs             (nur zeigen)
 *   node werkzeuge/klassen-auslesen.mjs --schreiben
 *
 * Arbeitet zusammen mit: `daten/daggerheart-klassen.json` (Ziel),
 * `werkzeuge/erschaffung-regeln.mjs` (rechnet damit),
 * `werkzeuge/pruefe-erschaffung.mjs` (prüft beides).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), '..');
const GRUND = join(WURZEL, 'docs/daggerheart/REGELN-GRUNDLAGEN.md');
const ZIEL = join(WURZEL, 'daten/daggerheart-klassen.json');

/* ------------------------------------------------------------------ *
 * Tabelle lesen
 * ------------------------------------------------------------------ */

function zerlege(zeile) {
  return zeile.replace(/^\||\|$/g, '').split('|').map((z) => z.trim());
}

/** Die Tabelle, deren Kopfzeile mit dem gesuchten Feld beginnt. */
function tabelleMitKopf(text, erstesFeld) {
  const zeilen = text.split(/\r?\n/);
  for (let i = 0; i < zeilen.length; i += 1) {
    if (!zeilen[i].startsWith('|')) continue;
    const spalten = zerlege(zeilen[i]);
    if (spalten[0] !== erstesFeld) continue;
    const reihen = [];
    for (let j = i + 2; j < zeilen.length; j += 1) {
      if (!zeilen[j].startsWith('|')) break;
      const felder = zerlege(zeilen[j]);
      if (felder.length !== spalten.length) continue;
      const reihe = {};
      spalten.forEach((s, k) => { reihe[s] = felder[k]; });
      reihen.push(reihe);
    }
    if (reihen.length) return { spalten, reihen };
  }
  throw new Error('Keine Tabelle mit erster Spalte „' + erstesFeld + '" gefunden.');
}

/** `**Bard**` → `Bard`, `*Rally*: …` bleibt als Text erhalten. */
const blank = (w) => String(w || '').replace(/\*\*/g, '').trim();

/** „Grace & Codex" → ["Grace", "Codex"] */
function domaenen(text) {
  return String(text || '').split(/\s*&\s*/).map((d) => blank(d)).filter(Boolean);
}

/** Aus „*Rally*: 1×/Sitzung …" werden Name und Text. */
function merkmal(text) {
  const roh = String(text || '').trim();
  if (!roh || roh === '–' || roh === '—') return null;
  const t = /^\*([^*]+)\*\s*:\s*(.+)$/s.exec(roh);
  return t ? { name: t[1].trim(), text: t[2].trim() } : { name: null, text: roh };
}

/* ------------------------------------------------------------------ *
 * Klassengegenstände
 * ------------------------------------------------------------------ */

/**
 * Die zwei Startgegenstände je Klasse stehen als Fließtext unter der
 * Tabelle: „Bard – Liebesroman oder ungeöffneter Brief; Druid – …".
 *
 * Bewusst aus **diesem einen Absatz** gelesen und nicht irgendwo im
 * Dokument gesucht: Ein zweiter Absatz mit ähnlichem Bau würde sonst
 * still mitgenommen.
 */
function klassengegenstaende(text, namen) {
  const start = text.indexOf('**Class Items**');
  if (start < 0) throw new Error('Der Absatz „Class Items" fehlt.');
  const ende = text.indexOf('\n\n', start);
  const absatz = text.slice(start, ende < 0 ? undefined : ende).replace(/\n/g, ' ');

  const raus = {};
  for (const name of namen) {
    /* Jeder Eintrag endet am Semikolon oder am Punkt des Absatzes. */
    const muster = new RegExp(name + '\\s*[–-]\\s*([^;.]+)', 'u');
    const treffer = muster.exec(absatz);
    if (!treffer) continue;
    raus[name] = treffer[1].split(/\s+oder\s+/u).map((s) => s.trim()).filter(Boolean);
  }
  return raus;
}

/* ------------------------------------------------------------------ *
 * Lauf
 * ------------------------------------------------------------------ */

const text = readFileSync(GRUND, 'utf8');
const { reihen } = tabelleMitKopf(text, 'Klasse');

const klassen = reihen.map((r) => {
  const name = blank(r['Klasse']);
  return {
    id: 'klasse-' + name.toLowerCase(),
    name,
    domaenen: domaenen(r['Domänen']),
    evasion: Number(r['Start-Evasion']),
    hp: Number(r['Start-HP']),
    hoffnungsfertigkeit: merkmal(r['Hope Feature (3 Hope, sofern nicht anders angegeben)']
      ?? r['Hope Feature']),
    klassenfertigkeit: merkmal(r['Class Feature(s)']),
    gegenstaende: [],
  };
});

const dinge = klassengegenstaende(text, klassen.map((k) => k.name));
for (const k of klassen) k.gegenstaende = dinge[k.name] || [];

/* ── Was nicht stimmen darf, bricht hier ab ──────────────────────────
   Ein stillschweigend halb gelesener Datensatz wäre schlimmer als gar
   keiner: Die Erschaffung rechnet damit, und niemand sähe es. */
const fehler = [];
if (klassen.length !== 9) fehler.push('9 Klassen erwartet, ' + klassen.length + ' gelesen.');
for (const k of klassen) {
  if (!k.name) fehler.push('Eine Klasse ohne Namen.');
  if (k.domaenen.length !== 2) fehler.push(k.name + ': ' + k.domaenen.length + ' Domänen statt 2.');
  if (!Number.isInteger(k.evasion)) fehler.push(k.name + ': Start-Evasion ist keine Zahl.');
  if (!Number.isInteger(k.hp)) fehler.push(k.name + ': Start-HP ist keine Zahl.');
  if (k.gegenstaende.length !== 2) {
    fehler.push(k.name + ': ' + k.gegenstaende.length + ' Klassengegenstände statt 2.');
  }
}
if (fehler.length) {
  console.error('Klassentabelle nicht sauber lesbar:\n- ' + fehler.join('\n- '));
  process.exit(1);
}

console.log('Klassen ausgelesen');
for (const k of klassen) {
  console.log('  ' + k.name.padEnd(10) + k.domaenen.join(' & ').padEnd(20)
    + 'Ausweichen ' + k.evasion + '  LP ' + k.hp + '  ' + k.gegenstaende.join(' / '));
}

if (process.argv.includes('--schreiben')) {
  writeFileSync(ZIEL, JSON.stringify({
    hinweis: 'Erzeugt von werkzeuge/klassen-auslesen.mjs aus docs/daggerheart/. '
      + 'Nicht von Hand ändern — die Recherchedateien sind die Quelle.',
    klassen,
  }, null, 1) + '\n');
  console.log('\nGeschrieben: daten/daggerheart-klassen.json');
} else {
  console.log('\nNichts geschrieben. Mit --schreiben ablegen.');
}
