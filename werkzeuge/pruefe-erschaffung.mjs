/**
 * Prüft die Charaktererschaffung an den echten Regeldaten.
 * [Aufgabe: Charakterbogen]
 *
 * -------------------------------------------------------------------
 * Janniks Auftrag vom 05.09.2026: eine Erschaffung, die Spieler durch
 * die neun Daggerheart-Schritte begleitet.
 *
 * ── Die Prüfung, auf die es ankommt ─────────────────────────────────
 *
 * **Was der Assistent auswirft, muss der vorhandene Bogen lesen können
 * — und dabei genau die Klassenwerte ergeben.** Eine Erschaffung, die
 * eine eigene Datenform baut, hätte einen zweiten Bogen zur Folge, und
 * zwei Bögen laufen auseinander. Deshalb geht die fertige Figur hier
 * durch `bogenAusDaten()` aus `werkzeuge/werte-rechnen.mjs`, also durch
 * dieselbe Rechnung, die `bogen.html` benutzt.
 *
 * ⚠️ **Die Schwellen sind der Fall, an dem man es merkt.** Die Regel
 * lautet „Grundschwellen der Rüstung **plus Stufe**". Wer sie schon im
 * Assistenten addiert, hat sie zweimal drin — die Zahl bleibt plausibel,
 * und niemand sieht es. Geprüft wird deshalb beides: dass der
 * Assistent den **Grundwert** übergibt, und dass der Bogen daraus die
 * Stufe dazurechnet.
 *
 * Aufruf:  node werkzeuge/pruefe-erschaffung.mjs
 *
 * Arbeitet zusammen mit: `werkzeuge/erschaffung-regeln.mjs` (Prüfling),
 * `werkzeuge/klassen-auslesen.mjs` (erzeugt die Klassendaten),
 * `karte/erschaffung.js` (die Bedienung dazu).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { macheMelder } from './helfer.mjs';
import { bogenAusDaten, ersterRang, ersterRangSchwellen } from './werte-rechnen.mjs';
import {
  EIGENSCHAFTEN, EIGENSCHAFTSVORRAT, START,
  abstammungen, domaenenkarten, fehltImSchritt, gemeinschaften, istVollstaendig,
  kennung, leererZustand, schritteLesen, standAllerSchritte, startruestungen,
  startwaffen, unterklassen, zuEintrag, zuSpielwerten, zweihaendig,
} from './erschaffung-regeln.mjs';

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), '..');
const lies = (p) => JSON.parse(readFileSync(join(WURZEL, p), 'utf8'));

const welt = lies('daten/welt.json');
const karten = lies('daten/daggerheart-karten.json').karten || [];
const gegenstaende = lies('daten/daggerheart-gegenstaende.json').gegenstaende || [];
const klassen = lies('daten/daggerheart-klassen.json').klassen || [];
const kat = { karten, gegenstaende, klassen };

/* Für die Bogenrechnung wird derselbe Namensschlüssel gebraucht wie im
   Browser (`karte/karten-daten.js`). */
function kern(name) {
  return String(name || '').toLowerCase()
    .replace(/[’'`]/g, '')
    .replace(/\s*(armor|armour|rüstung|ruestung)\s*$/u, '')
    .replace(/[^a-z0-9äöüß]+/gu, '');
}
const nachName = new Map();
for (const e of [...karten, ...gegenstaende]) {
  const k = kern(e.name);
  if (k && !nachName.has(k)) nachName.set(k, e);
}
const finde = (name) => nachName.get(kern(name)) || null;

const { melde, ende } = macheMelder();
console.log('Age-of-Beast-Wiki – Charaktererschaffung an den echten Regeldaten\n');

/* ------------------------------------------------------------------ *
 * 1 · Die neun Schritte kommen aus dem Wiki
 * ------------------------------------------------------------------ */

const schritte = schritteLesen(welt);
melde(schritte.length === 9, 'Neun Schritte aus dem Regeleintrag', schritte.length + ' gelesen');
melde(schritte.every((s) => s.titel && s.regel),
  'Jeder Schritt hat Titel und Regeltext');
melde(schritte.every((s) => !/^\d/.test(s.titel)),
  'Die Nummer steckt nicht doppelt im Titel',
  schritte.map((s) => s.titel).join(' | '));

/* Die Gegenprobe: Fehlt der Eintrag, denkt sich der Assistent **keine**
   Schritte aus, sondern bricht ab. Ein Assistent mit sieben Schritten,
   weil zwei Abschnitte umbenannt wurden, wäre die stillste Art, eine
   Figur unvollständig zu bauen. */
let brachAb = false;
try { schritteLesen({ eintraege: [] }); } catch (f) { brachAb = true; }
melde(brachAb, 'Ohne den Regeleintrag bricht das Lesen ab');

let brachAbBeiSieben = false;
try {
  schritteLesen({ eintraege: [{ id: 'regel-charaktererschaffung', abschnitte: new Array(7).fill({}) }] });
} catch (f) { brachAbBeiSieben = true; }
melde(brachAbBeiSieben, 'Bei sieben statt neun Abschnitten bricht es ebenfalls ab');

/* ------------------------------------------------------------------ *
 * 2 · Zu jedem Schritt gibt es überhaupt etwas zu wählen
 * ------------------------------------------------------------------ */

melde(klassen.length === 9, 'Neun Klassen im Katalog', klassen.length + '');
melde(abstammungen(karten).length >= 10, 'Abstammungen vorhanden', abstammungen(karten).length + '');
melde(gemeinschaften(karten).length >= 5, 'Gemeinschaften vorhanden', gemeinschaften(karten).length + '');
melde(startruestungen(gegenstaende).length >= 3, 'Rüstungen des ersten Rangs vorhanden',
  startruestungen(gegenstaende).length + '');
melde(startwaffen(gegenstaende, 'primaerwaffe').length >= 10, 'Primärwaffen des ersten Rangs vorhanden',
  startwaffen(gegenstaende, 'primaerwaffe').length + '');
melde(startwaffen(gegenstaende, 'sekundaerwaffe').length >= 3, 'Sekundärwaffen des ersten Rangs vorhanden',
  startwaffen(gegenstaende, 'sekundaerwaffe').length + '');

for (const k of klassen) {
  const zwei = unterklassen(karten, k.name);
  melde(zwei.length === 2, k.name + ': genau zwei Unterklassen',
    zwei.map((u) => u.name).join(', '));
  const dom = domaenenkarten(karten, k);
  melde(dom.length >= 2, k.name + ': mindestens zwei Domänenkarten der Stufe 1',
    dom.length + ' aus ' + k.domaenen.join(' & '));
  melde(dom.every((d) => k.domaenen.includes(d.domaene)),
    k.name + ': keine fremde Domäne in der Auswahl');
  melde(k.gegenstaende.length === 2, k.name + ': zwei Klassengegenstände zur Wahl',
    k.gegenstaende.join(' / '));
}

/* ------------------------------------------------------------------ *
 * 3 · Ein leerer Bogen sagt, was fehlt — und wo nichts fehlen darf
 * ------------------------------------------------------------------ */

const leer = leererZustand();
const standLeer = standAllerSchritte(leer, kat);
melde(!istVollstaendig(leer, kat), 'Ein leerer Bogen ist nicht vollständig');
for (const n of [1, 2, 3, 4, 5, 7, 8]) {
  melde(!standLeer[n - 1].fertig && standLeer[n - 1].fehlt.length > 0,
    'Schritt ' + n + ' meldet leer, was fehlt', standLeer[n - 1].fehlt.join(' / '));
}
/* Schritt 6 und 9 haben laut Regeltext ausdrücklich keine Pflicht:
   „hat keine unmittelbare Regelwirkung" und „dürfen erst im Spiel
   entstehen". Wer hier eine Pflicht erfände, verschärfte eine Regel,
   die es nicht gibt. */
for (const n of [6, 9]) {
  melde(standLeer[n - 1].fertig,
    'Schritt ' + n + ' verlangt nichts — so steht es in der Regel');
}

/* ------------------------------------------------------------------ *
 * 4 · Die Eigenschaftsverteilung
 * ------------------------------------------------------------------ */

const mitEigenschaften = (werte) => ({
  ...leererZustand(),
  eigenschaften: Object.fromEntries(EIGENSCHAFTEN.map(([s], i) => [s, werte[i]])),
});

melde(fehltImSchritt(3, mitEigenschaften([2, 1, 1, 0, 0, -1]), kat).length === 0,
  'Die vorgeschriebene Verteilung wird angenommen');
melde(fehltImSchritt(3, mitEigenschaften([1, 1, 2, -1, 0, 0]), kat).length === 0,
  'Dieselben Zahlen in anderer Reihenfolge ebenso');
melde(fehltImSchritt(3, mitEigenschaften([2, 2, 1, 0, 0, -1]), kat).length > 0,
  'Zwei Zweien werden abgelehnt');
melde(fehltImSchritt(3, mitEigenschaften([2, 1, 1, 0, 0, 0]), kat).length > 0,
  'Eine fehlende −1 wird abgelehnt');
melde(fehltImSchritt(3, mitEigenschaften([3, 1, 1, 0, 0, -1]), kat).length > 0,
  'Ein zu hoher Wert wird abgelehnt');
melde(EIGENSCHAFTSVORRAT.length === 6, 'Der Vorrat hat sechs Zahlen');

/* ------------------------------------------------------------------ *
 * 5 · Eine vollständige Figur — und ihr Weg auf den Bogen
 * ------------------------------------------------------------------ */

const rogue = klassen.find((k) => k.name === 'Rogue');
const einhaendig = startwaffen(gegenstaende, 'primaerwaffe')
  .find((w) => !zweihaendig(w) && !w.wirkung);
const beideHaende = startwaffen(gegenstaende, 'primaerwaffe').find((w) => zweihaendig(w));
const leder = startruestungen(gegenstaende).find((r) => /leather/i.test(r.name));
const zweiKarten = domaenenkarten(karten, rogue).slice(0, 2).map((d) => d.name);

melde(Boolean(rogue && einhaendig && beideHaende && leder && zweiKarten.length === 2),
  'Die Prüffiguren-Bausteine stehen alle im Katalog');

const fertig = {
  ...leererZustand(),
  klasse: 'Rogue',
  unterklasse: unterklassen(karten, 'Rogue')[0].name,
  abstammung: abstammungen(karten)[0].name,
  gemeinschaft: gemeinschaften(karten)[0].name,
  eigenschaften: { agility: 1, strength: -1, finesse: 2, instinct: 1, presence: 0, knowledge: 0 },
  name: 'Prüffigur Träumer',
  fuerwort: 'sie',
  primaerwaffe: einhaendig.name,
  ruestung: leder.name,
  klassengegenstand: rogue.gegenstaende[0],
  erfahrungen: ['Aufgewachsen in den Docks', 'Kennt jede Schmugglerroute'],
  domaenenkarten: zweiKarten,
};

const offenNoch = standAllerSchritte(fertig, kat).filter((s) => !s.fertig);
melde(offenNoch.length === 0, 'Die Prüffigur ist vollständig',
  offenNoch.map((s) => s.nummer + ': ' + s.fehlt.join(' / ')).join(' | '));

const werte = zuSpielwerten(fertig, kat);
melde(werte.evasion === rogue.evasion,
  'Das Ausweichen kommt aus der Klasse', werte.evasion + ' gegen ' + rogue.evasion);
melde(werte.hp === rogue.hp, 'Die Lebenspunkte kommen aus der Klasse',
  werte.hp + ' gegen ' + rogue.hp);
melde(werte.stress === START.stress, 'Sechs Stressfelder für alle', String(werte.stress));
melde(werte.stufe === 1, 'Stufe 1');
melde(String(werte.domaenen) === String(rogue.domaenen),
  'Die Domänen kommen aus der Klasse', werte.domaenen.join(' & '));
melde(werte.erfahrungen.length === 2 && werte.erfahrungen.every((e) => e.bonus === 2),
  'Beide Erfahrungen beginnen mit +2');
melde(werte.karten.length === 2, 'Zwei Domänenkarten auf dem Bogen');
melde(werte.vorrat.length >= 5, 'Der Grundvorrat steht auf dem Bogen',
  werte.vorrat.join(', '));
melde(werte.offen.length === 2,
  'Nur Hintergrund und Verbindungen bleiben offen — beide ohne Pflicht',
  werte.offen.join(' | '));

/* ⚠️ Der Grundwert, nicht die Summe. */
melde(werte.ruestung.basisSchwer === leder.schwellen.schwer,
  'Die Rüstung übergibt die **Grundschwelle**, nicht die Summe',
  werte.ruestung.basisSchwer + ' gegen ' + leder.schwellen.schwer);

/* ------------------------------------------------------------------ *
 * 6 · Der Bogen rechnet damit — dieselbe Rechnung wie bogen.html
 * ------------------------------------------------------------------ */

const gerechnet = bogenAusDaten(werte, finde);
melde(gerechnet.werte.evasion.endwert === rogue.evasion,
  'Der Bogen zeigt das Klassen-Ausweichen',
  gerechnet.werte.evasion.endwert + ' gegen ' + rogue.evasion);
melde(gerechnet.werte.ruestungswert.endwert === leder.score,
  'Der Bogen zeigt den Rüstungswert der gewählten Rüstung',
  gerechnet.werte.ruestungswert.endwert + ' gegen ' + leder.score);
melde(gerechnet.werte.schwelleSchwer.endwert === leder.schwellen.schwer + 1,
  'Die schwere Schwelle ist Grundwert + Stufe, genau einmal gerechnet',
  gerechnet.werte.schwelleSchwer.endwert + ' gegen ' + (leder.schwellen.schwer + 1));
melde(gerechnet.werte.schwelleErnst.endwert === leder.schwellen.ernst + 1,
  'Die ernste Schwelle ebenso',
  gerechnet.werte.schwelleErnst.endwert + ' gegen ' + (leder.schwellen.ernst + 1));
melde(gerechnet.werte.hp.endwert === rogue.hp, 'Die Lebenspunkte stehen auf dem Bogen');
melde(gerechnet.ausruestung.length >= 3,
  'Waffe, Rüstung und Klassengegenstand sind an- und ablegbar',
  gerechnet.ausruestung.map((s) => s.name).join(', '));

/* ------------------------------------------------------------------ *
 * 7 · Was die Regel verbietet
 * ------------------------------------------------------------------ */

const zweihandUndNebenhand = {
  ...fertig,
  primaerwaffe: beideHaende.name,
  sekundaerwaffe: startwaffen(gegenstaende, 'sekundaerwaffe')[0].name,
};
melde(fehltImSchritt(5, zweihandUndNebenhand, kat).some((f) => /beide Hände/.test(f)),
  'Zweihändige Waffe plus Nebenhand wird abgelehnt',
  beideHaende.name + ' (' + beideHaende.traglast + ')');
melde(fehltImSchritt(5, { ...fertig, primaerwaffe: beideHaende.name }, kat).length === 0,
  'Dieselbe Waffe allein ist in Ordnung');

const fremdeUnterklasse = { ...fertig, unterklasse: unterklassen(karten, 'Wizard')[0].name };
melde(fehltImSchritt(1, fremdeUnterklasse, kat).some((f) => /gehört nicht zur Klasse/.test(f)),
  'Eine Unterklasse einer anderen Klasse wird abgelehnt');

melde(fehltImSchritt(8, { ...fertig, domaenenkarten: [zweiKarten[0]] }, kat).length > 0,
  'Eine einzelne Domänenkarte reicht nicht');
melde(fehltImSchritt(8, { ...fertig, domaenenkarten: [...zweiKarten, 'noch eine'] }, kat).length > 0,
  'Drei Domänenkarten sind zu viele');

/* ------------------------------------------------------------------ *
 * 8 · Der Eintrag, wie ihn die Bogenseite liest
 * ------------------------------------------------------------------ */

const eintrag = zuEintrag(fertig, kat);
melde(eintrag.kategorie === 'characters', 'Der Eintrag ist eine Figur');
melde(eintrag.eigen === true, 'Er ist als eigene Figur gekennzeichnet');
melde(Boolean(eintrag.spielwerte), 'Er trägt Spielwerte — sonst zeigt ihn bogen.html nicht');
melde(/^figur-eigen-/.test(eintrag.id), 'Die Kennung ist als eigene erkennbar', eintrag.id);
melde(eintrag.id === zuEintrag(fertig, kat).id,
  'Dieselbe Figur bekommt dieselbe Kennung — sonst läge sie nach dem Speichern doppelt vor');

melde(kennung('Träumer Süß') === 'traeumer-suess',
  'Umlaute werden umschrieben statt weggeworfen', kennung('Träumer Süß'));
melde(kennung('') === 'ohne-namen', 'Ein leerer Name ergibt trotzdem eine Kennung');
melde(kennung('!!!') === 'ohne-namen', 'Und ein Name ganz ohne Buchstaben ebenso');

/* ------------------------------------------------------------------ *
 * 9 · Jeder Schritt wird wirklich gezeichnet
 * ------------------------------------------------------------------ */

/**
 * ⚠️ **Die Prüfung, die am 05.09.2026 gefehlt hat.** Die 94 Prüfungen
 * oben zählten, was zur Wahl steht — gezeichnet wurde nie eine Kachel.
 * Deshalb fiel nicht auf, dass `schritt5` bei vier von acht Rüstungen
 * warf (`r.schwellen.schwer`, wo nur eine Stufenliste steht). Im Browser
 * blieb der **vorige** Schritt stehen: `inhaltZeichnen()` bricht vor dem
 * Schreiben ab, also sah es aus, als reagiere die Leiste nicht.
 *
 * `karte/erschaffung-schritte.js` ist eine Browser-Datei, fasst aber kein
 * DOM an — sie baut nur Zeichenketten. Genau deshalb lässt sie sich hier
 * laden und in Node ausführen.
 */
const { schrittZeichnen } = await import('../karte/erschaffung-schritte.js');

const ZUSTAENDE = [
  ['leer', leererZustand()],
  ['halb', { ...leererZustand(), klasse: 'Rogue' }],
  ['zweihändig', { ...fertig, primaerwaffe: beideHaende.name, sekundaerwaffe: null }],
  ['vollständig', fertig],
];

for (const [wie, z] of ZUSTAENDE) {
  for (let n = 1; n <= 9; n += 1) {
    let html = null;
    let fehler = null;
    try { html = schrittZeichnen(n, z, kat); } catch (f) { fehler = f.message; }
    melde(fehler === null, 'Schritt ' + n + ' zeichnet (' + wie + ')', fehler || '');
    if (fehler !== null) continue;

    melde(typeof html === 'string' && html.length > 0,
      'Schritt ' + n + ' liefert Inhalt (' + wie + ')', String(html).length + ' Zeichen');

    /* Kein rohes Markup im sichtbaren Text. Der zweite Fehler desselben
       Tages: `sicher(namen.join('</strong> oder <strong>'))` entschärft
       die **Auszeichnung** mit, sie stand danach als Text auf der Seite. */
    const sichtbar = String(html).replace(/<[^>]+>/gu, ' ');
    melde(!/&lt;\/?strong|&lt;\/?span|&lt;\/?em/u.test(sichtbar),
      'Schritt ' + n + ' zeigt kein entschärftes Markup als Text (' + wie + ')',
      (sichtbar.match(/&lt;[^;]{0,20}/u) || [''])[0]);

    /* Und kein `undefined`/`NaN`, das durch die Anzeige durchrutscht. */
    melde(!/\b(undefined|NaN)\b/u.test(sichtbar),
      'Schritt ' + n + ' zeigt kein „undefined" oder „NaN" (' + wie + ')',
      (sichtbar.match(/.{0,40}(undefined|NaN).{0,20}/u) || [''])[0].trim());
  }
}

/* Die Stufenlisten selbst — der Anlass für den Absturz. */
{
  const mitListe = startruestungen(gegenstaende)
    .filter((r) => typeof r.score !== 'number');
  melde(mitListe.length > 0,
    'Es gibt Rüstungen ohne festen Rüstungswert — genau die brachen die Anzeige',
    mitListe.map((r) => r.name).join(', '));
  for (const r of mitListe) {
    melde(ersterRang(r.scoreStufen) !== null,
      '„' + r.name + '": der erste Rang ist aus der Stufenliste lesbar',
      r.scoreStufen + ' → ' + ersterRang(r.scoreStufen));
    melde(ersterRangSchwellen(r.schwellenStufen) !== null,
      '„' + r.name + '": auch die Schwellen des ersten Rangs',
      r.schwellenStufen + ' → ' + JSON.stringify(ersterRangSchwellen(r.schwellenStufen)));
  }
  /* Gegenprobe: Unsinn ergibt `null`, keine geratene Zahl. */
  melde(ersterRang('keine Zahl') === null, 'Ein unlesbares Format ergibt null statt einer Zahl');
  melde(ersterRangSchwellen('6') === null, 'Ein Schwellenpaar ohne Schrägstrich ebenso');
  melde(ersterRang('3·4·5·6') === 3, 'Aus „3·4·5·6" wird der erste Rang 3');
}

/* Und die so gelesene Rüstung rechnet auf dem Bogen mit. */
{
  const mitListe = startruestungen(gegenstaende).find((r) => typeof r.score !== 'number');
  if (mitListe) {
    const werteMitListe = zuSpielwerten({ ...fertig, ruestung: mitListe.name }, kat);
    const gerechnetMitListe = bogenAusDaten(werteMitListe, finde);
    melde(gerechnetMitListe.werte.ruestungswert.endwert === ersterRang(mitListe.scoreStufen),
      'Eine Rüstung aus der Stufenliste ergibt auf dem Bogen ihren Rang-1-Wert',
      gerechnetMitListe.werte.ruestungswert.endwert + ' aus ' + mitListe.scoreStufen);
  }
}

ende();
