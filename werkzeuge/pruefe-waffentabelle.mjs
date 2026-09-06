/**
 * Die Merkmalspalte der Tier-1-Waffen sitzt auf der richtigen Zeile.
 * [Aufgabe: Prüfwesen]
 *
 * -------------------------------------------------------------------
 * **Was ohne diese Prüfung still durchkam** — und am 05./06.09.2026
 * wirklich durchkam (Vorgang #12): In `REGELN-GRUNDLAGEN.md` stand die
 * Spalte „Feature" bei den Nahkampfwaffen **um eine Zeile zu tief**.
 * „Reliable" lag beim Longsword statt beim Broadsword, „Massive" bei
 * der Mace statt beim Greatsword, „Heavy" beim **Dolch** statt beim
 * Warhammer, „Quick" bei der Hellebarde statt beim Rapier.
 *
 * Der Dolch trug dadurch −1 Evasion. Auf Brix' Bogen zerlegte sich das
 * Ausweichen in „Grundwert 13, −1 durch Dolch, +1 durch Gambeson", und
 * wer den Dolch ablegte, wurde **besser** im Ausweichen. Die
 * Gesamtzahl stimmte trotzdem, weil der Grundwert aus ihr
 * zurückgerechnet wird — deshalb fiel es keiner Rechenprüfung auf.
 *
 * ── Zwei Prüfungen, mit Absicht verschieden ────────────────────────
 *
 * **1 · Die Zuordnung, namentlich.** Ein Abgleich gegen das SRD ist von
 * aussen; ein Programm kann ihn nicht herleiten, nur festhalten. Diese
 * Liste ist deshalb bewusst eine **abgeschriebene Quelle** mit Datum
 * und Fundstelle — kein Ergebnis einer Rechnung.
 *
 * **2 · Die Regel dahinter.** Ein Merkmal, das Evasion senkt, gehört zu
 * einer **zweihändigen** Waffe. Diese Prüfung braucht keine Liste und
 * fängt denselben Fehler auch dann, wenn jemand die Tabelle um neue
 * Waffen erweitert: „Heavy" auf einem einhändigen Dolch ist innerlich
 * unstimmig, egal was eine Liste sagt.
 *
 * ── Ausdrücklich offen ─────────────────────────────────────────────
 *
 * **Shortbow, Crossbow und Longbow werden nicht geprüft.** Für sie
 * widersprechen sich die Quellen (eine führt *Cumbersome* erst ab
 * Tier 3). Sie stehen unverändert in der Tabelle, und diese Prüfung
 * behauptet nichts über sie — eine geratene Zusicherung wäre schlimmer
 * als keine.
 *
 * Arbeitet zusammen mit: `docs/daggerheart/REGELN-GRUNDLAGEN.md` (die
 * Quelle), `werkzeuge/gegenstaende-auslesen.mjs` (macht den Katalog
 * daraus), `daten/daggerheart-gegenstaende.json` (das Ergebnis).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { macheMelder, WURZEL } from './helfer.mjs';

const { melde, ende } = macheMelder({ still: true });

const katalog = JSON.parse(
  readFileSync(join(WURZEL, 'daten/daggerheart-gegenstaende.json'), 'utf8'));
const waffen = (katalog.gegenstaende || [])
  .filter((g) => g.art === 'primaerwaffe' && g.abStufe === 1);

/* ── 1 · Die Zuordnung, gegen das SRD abgeschrieben ─────────────────
 *
 * Abgeglichen am 06.09.2026 über daggerheart.org/reference/weapons und
 * daggerheartsrd.com/rules/primary-weapon-tables/. `null` heisst: Die
 * Waffe traegt im SRD **kein** Merkmal — das ist eine Zusicherung, kein
 * fehlender Eintrag. */
const LAUT_SRD = {
  Broadsword: 'Reliable',
  Longsword: null,
  Battleaxe: null,
  Greatsword: 'Massive',
  Mace: null,
  Warhammer: 'Heavy',
  Dagger: null,
  Quarterstaff: null,
  Cutlass: null,
  Rapier: 'Quick',
  Halberd: 'Cumbersome',
  Spear: 'Cumbersome',
};

for (const [name, soll] of Object.entries(LAUT_SRD)) {
  const w = waffen.find((x) => x.name === name);
  if (!w) { melde(false, name + ' steht als Tier-1-Primärwaffe im Katalog'); continue; }
  const ist = w.merkmal ?? null;
  melde(ist === soll,
    soll === null
      ? name + ' trägt laut SRD kein Merkmal'
      : name + ' trägt laut SRD „' + soll + '"',
    'im Katalog: ' + (ist === null ? '—' : ist));
}

/* ── 2 · Die Regel: Wer Evasion kostet, braucht zwei Hände ──────────
 *
 * Genau diese Unstimmigkeit hat den Fehler auffliegen lassen: „Heavy"
 * auf einem einhändigen Dolch und „Massive" auf einer einhändigen Mace
 * ergeben im Regelwerk keinen Sinn. */
for (const w of waffen) {
  const senktEvasion = /(^|\s)−1\s*Evasion/u.test(w.wirkung || '');
  if (!senktEvasion) continue;
  melde(w.traglast === 'Zweihändig',
    w.name + ': ein Merkmal, das Evasion senkt, gehört zu einer zweihändigen Waffe',
    w.traglast + ', „' + w.merkmal + ': ' + w.wirkung + '"');
}

/* Und die Gegenprobe zur Regel: Es gibt solche Merkmale überhaupt —
   sonst liefe die Schleife oben ins Leere und wäre stets grün. */
{
  const mitMalus = waffen.filter((w) => /(^|\s)−1\s*Evasion/u.test(w.wirkung || ''));
  melde(mitMalus.length >= 2,
    'es gibt überhaupt Waffen mit Evasion-Malus — sonst prüfte die Regel nichts',
    mitMalus.map((w) => w.name).join(', ') || 'keine');
}

/* ── 3 · Der Dolch im Besonderen ───────────────────────────────────
 *
 * Er steht in Brix' Ausrüstung und war der sichtbare Schaden. Eine
 * eigene Zeile dafür, damit die Meldung den Fall benennt statt nur
 * eine Tabellenzeile. */
{
  const dolch = waffen.find((w) => w.name === 'Dagger');
  melde(dolch && !dolch.wirkung,
    'der Dolch senkt kein Ausweichen — er trägt im SRD gar kein Merkmal',
    dolch ? String(dolch.wirkung ?? '—') : 'nicht im Katalog');
}

ende();
