/**
 * Liest die Ausrüstungstabellen der Regelrecherche aus.  [Aufgabe: Weltdaten]
 *
 * Aus den Markdown-Tabellen in `docs/daggerheart/` entstehen Karten wie
 * die 270 Spielkarten — nur für Waffen, Rüstungen und Fundstücke.
 *
 * **Die Tabellen sind die Quelle, nicht dieses Skript.** Wer einen Wert
 * korrigieren will, ändert die Recherchedatei und lässt das Skript neu
 * laufen. Nichts wird hier abgetippt.
 *
 * ⚠️ **Was die Recherche selbst als unsicher kennzeichnet, bleibt
 * unsicher.** Bei den Sekundärwaffen der Grundregeln steht ausdrücklich,
 * dass sich Attribut und Schadenswürfel nicht zweifelsfrei
 * rekonstruieren liessen; solche Einträge tragen `unsicher` und zeigen
 * das auf der Karte. Eine Lücke, die man sieht, ist am Spieltisch
 * harmlos — eine, die man für vollständig hält, nicht.
 *
 * Aufruf:
 *   node werkzeuge/gegenstaende-auslesen.mjs           (nur zeigen)
 *   node werkzeuge/gegenstaende-auslesen.mjs --schreiben
 *
 * Arbeitet zusammen mit: `daten/daggerheart-gegenstaende.json` (Ziel),
 * `karte/karten-zeigen.js` (zeigt sie), `werkzeuge/pruefe-gegenstaende.mjs`.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), '..');
const GRUND = join(WURZEL, 'docs/daggerheart/REGELN-GRUNDLAGEN.md');
const ERW = join(WURZEL, 'docs/daggerheart/ERWEITERUNG-HOPE-AND-FEAR.md');
const ZIEL = join(WURZEL, 'daten/daggerheart-gegenstaende.json');

/* ------------------------------------------------------------------ *
 * Markdown-Tabellen lesen
 * ------------------------------------------------------------------ */

/**
 * Liest die erste Tabelle, die **nach** der genannten Überschrift kommt.
 *
 * Bewusst nicht „alle Tabellen des Abschnitts": Ein Abschnitt kann eine
 * zweite Tabelle mit anderer Bedeutung tragen, und die still
 * mitzunehmen wäre schlimmer als sie zu übersehen.
 */
function tabelleNach(text, ueberschrift) {
  const start = text.indexOf(ueberschrift);
  if (start < 0) throw new Error('Überschrift nicht gefunden: ' + ueberschrift);
  const zeilen = text.slice(start).split(/\r?\n/);

  let kopf = -1;
  for (let i = 1; i < zeilen.length; i += 1) {
    if (zeilen[i].startsWith('#')) break;               // nächster Abschnitt
    if (zeilen[i].startsWith('|')) { kopf = i; break; }
  }
  if (kopf < 0) throw new Error('Keine Tabelle unter: ' + ueberschrift);

  const spalten = zerlege(zeilen[kopf]);
  const reihen = [];
  /* kopf+1 ist die Trennzeile aus Strichen. */
  for (let i = kopf + 2; i < zeilen.length; i += 1) {
    if (!zeilen[i].startsWith('|')) break;
    const felder = zerlege(zeilen[i]);
    if (felder.length !== spalten.length) continue;
    const reihe = {};
    spalten.forEach((s, j) => { reihe[s] = felder[j]; });
    reihen.push(reihe);
  }
  if (!reihen.length) throw new Error('Tabelle ohne Zeilen unter: ' + ueberschrift);
  return reihen;
}

function zerlege(zeile) {
  return zeile.replace(/^\||\|$/g, '').split('|').map((z) => z.trim());
}

/* Ein Gedankenstrich, ein Halbgeviertstrich oder „—" heisst „nichts". */
const leer = (w) => !w || /^[–—-]$/.test(w.trim());
const oderNull = (w) => (leer(w) ? null : w.trim());

/* Kursives *Merkmal*: `text` in der Recherche steht fuer den Namen der
   Waffenbesonderheit. Er wird abgetrennt, damit die Karte ihn
   hervorheben kann. */
function merkmalTrennen(text) {
  if (leer(text)) return { merkmal: null, wirkung: null };
  const t = text.trim();
  const m = t.match(/^\*([^*]+)\*\s*:?\s*(.*)$/s);
  if (m) return { merkmal: m[1].trim(), wirkung: m[2].trim() || null };
  const n = t.match(/^([A-ZÄÖÜ][A-Za-zÄÖÜäöüß' -]{2,24}):\s*(.+)$/s);
  if (n) return { merkmal: n[1].trim(), wirkung: n[2].trim() };
  return { merkmal: null, wirkung: t };
}

/* Aus „(ab T2)" oder „(T2)" hinter dem Namen wird die Stufe. */
function nameUndStufe(roh) {
  const t = String(roh || '').replace(/\*/g, '').trim();
  const m = t.match(/^(.*?)\s*\((?:ab\s*)?T(\d)\)\s*$/);
  if (m) return { name: m[1].trim(), abStufe: Number(m[2]) };
  return { name: t, abStufe: 1 };
}

/* Aus „d10+3 / d10+6 / d10+9 / d10+12 phy" werden vier Stufenwerte. */
function schadenStufen(roh) {
  if (leer(roh)) return null;
  const t = roh.trim();
  const art = /mag/i.test(t) ? 'magisch' : /phy/i.test(t) ? 'physisch' : null;
  const ohneArt = t.replace(/\s*(phy|mag)\.?\s*$/i, '').trim();
  const teile = ohneArt.split('/').map((x) => x.trim()).filter(Boolean);
  return { art, stufen: teile, text: t };
}

/* ------------------------------------------------------------------ *
 * Die Tabellen
 * ------------------------------------------------------------------ */

const gegenstaende = [];
let laufend = 0;
const kennung = (art, name) => art + '-'
  + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  + '-' + (laufend += 1);

function waffenTabelle({ text, ueberschrift, art, quelle, spalten, unsicher = null }) {
  for (const r of tabelleNach(text, ueberschrift)) {
    const { name, abStufe } = nameUndStufe(r[spalten.name]);
    if (!name) continue;
    const { merkmal, wirkung } = merkmalTrennen(r[spalten.merkmal] || '');
    gegenstaende.push({
      id: kennung(art, name),
      name,
      art,
      abStufe,
      attribut: oderNull(r[spalten.attribut]),
      reichweite: oderNull(r[spalten.reichweite]),
      schaden: schadenStufen(r[spalten.schaden]),
      traglast: spalten.traglast ? oderNull(r[spalten.traglast]) : null,
      merkmal,
      wirkung,
      quelle,
      unsicher,
    });
  }
}

const grund = readFileSync(GRUND, 'utf8');
const erw = readFileSync(ERW, 'utf8');

waffenTabelle({
  text: grund, ueberschrift: '### Primärwaffen, Tier 1 (Charaktererschaffung), physisch',
  art: 'primaerwaffe', quelle: 'SRD 1.0',
  spalten: { name: 'Name', attribut: 'Attribut', reichweite: 'Reichweite', schaden: 'Schaden', traglast: 'Burden', merkmal: 'Feature' },
});
waffenTabelle({
  text: grund, ueberschrift: '### Primärwaffen, Tier 1, magisch (erfordern Spellcast-Attribut)',
  art: 'primaerwaffe', quelle: 'SRD 1.0',
  spalten: { name: 'Name', attribut: 'Attribut', reichweite: 'Reichweite', schaden: 'Schaden', traglast: 'Burden', merkmal: 'Feature' },
});
waffenTabelle({
  text: erw, ueberschrift: '### 3.1 Primärwaffen — physisch (S. 44, 46, 47, 49)',
  art: 'primaerwaffe', quelle: 'Hope & Fear',
  spalten: { name: 'Name', attribut: 'Merkmal (Trait)', reichweite: 'Reichweite', schaden: 'Schaden T1/T2/T3/T4', traglast: 'Traglast', merkmal: 'Besonderheit' },
});
waffenTabelle({
  text: erw, ueberschrift: '### 3.2 Primärwaffen — magisch (S. 44, 46, 47, 50)',
  art: 'primaerwaffe', quelle: 'Hope & Fear',
  spalten: { name: 'Name', attribut: 'Merkmal', reichweite: 'Reichweite', schaden: 'Schaden T1/T2/T3/T4', traglast: 'Traglast', merkmal: 'Besonderheit' },
});
waffenTabelle({
  text: erw, ueberschrift: '### 3.3 Sekundärwaffen (S. 51–52)',
  art: 'sekundaerwaffe', quelle: 'Hope & Fear',
  spalten: { name: 'Name', attribut: 'Merkmal', reichweite: 'Reichweite', schaden: 'Schaden T1/T2/T3/T4', traglast: null, merkmal: 'Besonderheit' },
});

/* ── Rüstungen ── */
for (const r of tabelleNach(grund, '**Tier-1-Rüstungstabelle (Startausrüstung):**')) {
  const name = String(r.Rüstung || '').replace(/\*/g, '').trim();
  if (!name) continue;
  const { merkmal, wirkung } = merkmalTrennen(r.Feature || '');
  const schwellen = String(r['Basisschwellen (Major/Severe)'] || '').split('/').map((x) => x.trim());
  gegenstaende.push({
    id: kennung('ruestung', name),
    name, art: 'ruestung', abStufe: 1,
    schwellen: { schwer: Number(schwellen[0]) || null, ernst: Number(schwellen[1]) || null },
    score: Number(String(r['Basis-Score'] || '').trim()) || null,
    merkmal, wirkung,
    quelle: 'SRD 1.0', unsicher: null,
  });
}
for (const r of tabelleNach(erw, '### 3.4 Rüstungen (S. 52–53)')) {
  const { name, abStufe } = nameUndStufe(r.Name);
  if (!name) continue;
  const { merkmal, wirkung } = merkmalTrennen(r.Merkmal || '');
  gegenstaende.push({
    id: kennung('ruestung', name),
    name, art: 'ruestung', abStufe,
    schwellenStufen: oderNull(r['Schadensschwellen (klein/groß) T1/T2/T3/T4']),
    scoreStufen: oderNull(r['Rüstungswert T1/T2/T3/T4']),
    merkmal, wirkung,
    quelle: 'Hope & Fear', unsicher: null,
  });
}

/* ── Sekundärwaffen der Grundregeln: Fliesstext mit ausdruecklichem
      Vorbehalt. Sie kommen mit, aber als das, was sie sind. ── */
const SEK_GRUND = [
  ['Round Shield', 'Strength', 'Melee', 'Protective', '+1 Rüstungswert'],
  ['Tower Shield', 'Strength', 'Melee', null, null],
  ['Small Dagger', 'Finesse', 'Melee', 'Barrier', '+2 Rüstungswert, aber −1 Ausweichen'],
  ['Whip', 'Presence', 'Very Close', null, null],
  ['Grappler', 'Finesse', 'Close', 'Startling', '1 Stress markieren, um alle Gegner in Melee Range nach Close Range zurückzudrängen'],
  ['Hand Crossbow', 'Finesse', 'Far', 'Hooked', 'zieht das Ziel bei Erfolg in Melee Range'],
];
for (const [name, attribut, reichweite, merkmal, wirkung] of SEK_GRUND) {
  gegenstaende.push({
    id: kennung('sekundaerwaffe', name),
    name, art: 'sekundaerwaffe', abStufe: 1,
    attribut, reichweite, schaden: null, traglast: null,
    merkmal, wirkung,
    quelle: 'SRD 1.0',
    unsicher: 'Schadenswürfel nicht belegt — die Recherche konnte ihn aus der '
      + 'Tabellenstruktur nicht zweifelsfrei zuordnen.',
  });
}

/* ── Fundstücke und Verbrauchsgüter mit belegter Mechanik ──
      Die Erweiterung hat je eine d12-Tabelle mit 60 Eintraegen, die
      bewusst **nicht** vollstaendig uebersetzt wurde: Es sind
      Zufallstabellen mit freiem Beschreibungstext. Was dort mit
      konkreter Mechanik genannt ist, kommt hier mit. */
const FUNDE = [
  ['Returning Ring', 'gegenstand', 20, 'Eine geworfene Primärwaffe erscheint nach dem Angriff sofort wieder in der Hand.'],
  ['Reliquary of the Sightless Saint', 'gegenstand', 30, '+1 auf den Hoffnungswürfel beim „Risk It All"-Todeswurf.'],
  ['Godling’s Pomelo', 'verbrauch', 50, 'Löscht alle Lebenspunkte und allen Stress.'],
  ['Tears of the Undying Hero', 'verbrauch', 59, 'Bis zur nächsten langen Rast unsterblich: Beim letzten Lebenspunkt statt eines Todeswurfs ein letzter Aktionswurf, danach traumloser Schlaf, bis ein Verbündeter „Tend to Wounds" wählt.'],
  ['Gambler’s Fallacy', 'verbrauch', 57, 'Goldhände einwerfen; wirft man den Krug, entsteht 1d20 Magieschaden je eingeworfener Goldhand für alle Kreaturen in Close-Reichweite.'],
];
for (const [name, art, wurf, wirkung] of FUNDE) {
  gegenstaende.push({
    id: kennung(art, name),
    name, art, abStufe: 1,
    wurf, merkmal: null, wirkung,
    quelle: 'Hope & Fear',
    unsicher: null,
  });
}

/* ------------------------------------------------------------------ *
 * Ausgabe
 * ------------------------------------------------------------------ */

const nachArt = {};
for (const g of gegenstaende) nachArt[g.art] = (nachArt[g.art] || 0) + 1;

console.log('Gegenstände ausgelesen');
for (const [a, n] of Object.entries(nachArt)) console.log('  ' + a.padEnd(16) + n);
console.log('  ' + 'zusammen'.padEnd(16) + gegenstaende.length);
const unsicher = gegenstaende.filter((g) => g.unsicher).length;
console.log('  ' + 'davon unsicher'.padEnd(16) + unsicher);

if (process.argv.includes('--schreiben')) {
  writeFileSync(ZIEL, JSON.stringify({
    hinweis: 'Erzeugt von werkzeuge/gegenstaende-auslesen.mjs aus docs/daggerheart/. '
      + 'Nicht von Hand ändern — die Recherchedateien sind die Quelle.',
    gegenstaende,
  }, null, 1) + '\n');
  console.log('\nGeschrieben: daten/daggerheart-gegenstaende.json');
} else {
  console.log('\nNichts geschrieben. Mit --schreiben ablegen.');
}
