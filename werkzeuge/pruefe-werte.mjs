/**
 * Prüft die Rechnung des Charakterbogens an den echten Bogendaten.
 * [Aufgabe: Charakterbogen]
 *
 * -------------------------------------------------------------------
 * `werkzeuge/werte-rechnen.mjs` ist bewusst ohne DOM gebaut. Erst
 * dadurch lässt sich hier prüfen, was sonst nur ein Mensch im Browser
 * beurteilen könnte.
 *
 * ── Die eine Prüfung, auf die es ankommt ────────────────────────────
 *
 * **Mit allem, was der Bogen trägt, muss wieder genau der eingetragene
 * Wert herauskommen.** Brix hat `evasion: 13` in den Weltdaten; die
 * Rechnung zerlegt das in Grundwert plus Beiträge und muss am Ende
 * wieder bei 13 landen. Wäre das nicht so, zeigte der Bogen beim
 * blossen Aufrufen eine andere Zahl als das Blatt am Tisch — ohne dass
 * jemand etwas angefasst hätte, und ohne dass es auffiele.
 *
 * ⚠️ **Was diese Prüfung nicht kann.** Der Grundwert wird
 * zurückgerechnet (13 − 1 = 12). Ist die Wirkung eines Gegenstands im
 * Regelwerk falsch erfasst, wandert der Fehler in den Grundwert, und
 * die Summe stimmt trotzdem. Sichtbar wird er erst beim **Ablegen**.
 * Genau deshalb steht in `ausruestungHtml` jede Wirkung im Klartext an
 * ihrem Stück: Was man sieht, kann man am Spieltisch widerlegen.
 *
 * Aufruf:  node werkzeuge/pruefe-werte.mjs
 *
 * Arbeitet zusammen mit: `werkzeuge/werte-rechnen.mjs` (Prüfling),
 * `karte/bogen-werte.js` (die Bedienung dazu), `daten/welt.json` und
 * `daten/daggerheart-gegenstaende.json` (die echten Daten).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { macheMelder } from './helfer.mjs';
import {
  ausruestungBauen, basisZurueckrechnen, bogenAusDaten, herleitung, wirkungLesen,
} from './werte-rechnen.mjs';

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), '..');
const lies = (p) => JSON.parse(readFileSync(join(WURZEL, p), 'utf8'));

const welt = lies('daten/welt.json');
const gegenstaende = lies('daten/daggerheart-gegenstaende.json').gegenstaende || [];
const karten = lies('daten/daggerheart-karten.json').karten || [];

/* Dieselbe Namensnormalisierung wie `karte/karten-daten.js`. Sie steht
   hier ein zweites Mal, weil jenes Modul `fetch` benutzt und in Node
   nicht lädt. Der Vergleich unten hält beide zusammen: Findet diese
   Prüfung den Gambeson nicht, findet ihn der Browser auch nicht. */
function kern(name) {
  return String(name || '')
    .toLowerCase()
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

const figuren = (welt.eintraege || []).filter((e) => e.spielwerte);
const { melde, ende } = macheMelder();

console.log('Age-of-Beast-Wiki – Bogenrechnung an den echten Daten\n');

melde(figuren.length > 0, 'Es gibt Figuren mit Spielwerten', figuren.length + ' Figuren');

/* ------------------------------------------------------------------ *
 * 1 · Der Umlauf: eingetragener Wert → Zerlegung → derselbe Wert
 * ------------------------------------------------------------------ */

for (const figur of figuren) {
  const w = figur.spielwerte;
  const r = bogenAusDaten(w, finde);
  const name = figur.name;

  if (typeof w.evasion === 'number') {
    melde(r.werte.evasion.endwert === w.evasion,
      name + ': Ausweichen wie eingetragen',
      'gerechnet ' + r.werte.evasion.endwert + ', eingetragen ' + w.evasion);
  }
  if (typeof w.hp === 'number') {
    melde(r.werte.hp.endwert === w.hp, name + ': Lebenspunkte wie eingetragen',
      'gerechnet ' + r.werte.hp.endwert + ', eingetragen ' + w.hp);
  }
  if (typeof w.stress === 'number') {
    melde(r.werte.stress.endwert === w.stress, name + ': Stress wie eingetragen',
      'gerechnet ' + r.werte.stress.endwert + ', eingetragen ' + w.stress);
  }
  for (const [schluessel, wert] of Object.entries(w.attribute || {})) {
    if (!r.werte[schluessel]) continue;
    melde(r.werte[schluessel].endwert === wert,
      name + ': ' + schluessel + ' wie eingetragen',
      'gerechnet ' + r.werte[schluessel].endwert + ', eingetragen ' + wert);
  }

  /* Rüstungswert und Schwellen sind **nicht** zurückgerechnet, sondern
     echt hergeleitet: 0 plus Rüstung, Stufe plus Rüstung. Dass sie
     trotzdem dasselbe ergeben wie die bisherige Anzeige, ist der
     eigentliche Nachweis, dass die Rechnung stimmt. */
  if (w.ruestung && typeof w.ruestung.score === 'number') {
    melde(r.werte.ruestungswert.endwert === w.ruestung.score,
      name + ': Rüstungswert entsteht aus der Rüstung',
      'gerechnet ' + r.werte.ruestungswert.endwert + ', Rüstung ' + w.ruestung.score);
  }
  if (w.ruestung && typeof w.ruestung.basisSchwer === 'number' && typeof w.stufe === 'number') {
    const soll = w.ruestung.basisSchwer + w.stufe;
    melde(r.werte.schwelleSchwer.endwert === soll,
      name + ': schwere Schwelle = Rüstung + Stufe',
      'gerechnet ' + r.werte.schwelleSchwer.endwert + ', erwartet ' + soll);
  }
  if (w.ruestung && typeof w.ruestung.basisErnst === 'number' && typeof w.stufe === 'number') {
    const soll = w.ruestung.basisErnst + w.stufe;
    melde(r.werte.schwelleErnst.endwert === soll,
      name + ': ernste Schwelle = Rüstung + Stufe',
      'gerechnet ' + r.werte.schwelleErnst.endwert + ', erwartet ' + soll);
  }
}

/* ------------------------------------------------------------------ *
 * 2 · Ablegen nimmt genau zurück, was das Stück beigetragen hat
 * ------------------------------------------------------------------ */

for (const figur of figuren) {
  const w = figur.spielwerte;
  const alles = bogenAusDaten(w, finde);

  for (const stueck of alles.ausruestung) {
    const ohne = bogenAusDaten(w, finde, { [stueck.schluessel]: false });

    /* Für jeden Wert gilt: Die Differenz ist genau die Summe der
       Beiträge dieses einen Stücks — nicht mehr und nicht weniger. */
    let stimmig = true;
    let abweichung = '';
    for (const schluessel of Object.keys(alles.werte)) {
      const vorher = alles.werte[schluessel];
      const nachher = ohne.werte[schluessel];
      const seins = vorher.beitraege
        .filter((b) => b.quelle === stueck.name)
        .reduce((s, b) => s + b.delta, 0);
      if (vorher.endwert - nachher.endwert !== seins) {
        stimmig = false;
        abweichung = schluessel + ': ' + vorher.endwert + ' → ' + nachher.endwert
          + ', erwartete Differenz ' + seins;
      }
    }
    melde(stimmig, figur.name + ': „' + stueck.name + '" ablegen nimmt genau seins zurück',
      abweichung);

    /* Und wieder anlegen stellt den Ausgangszustand her. Ein Rechner,
       der beim Hin und Her driftet, wäre nach zehn Klicks falsch. */
    const zurueck = bogenAusDaten(w, finde, { [stueck.schluessel]: true });
    const gleich = Object.keys(alles.werte)
      .every((s) => zurueck.werte[s].endwert === alles.werte[s].endwert);
    melde(gleich, figur.name + ': „' + stueck.name + '" wieder anlegen stellt alles her');
  }
}

/* ------------------------------------------------------------------ *
 * 3 · Die Rüstung wirkt wirklich — sonst prüfte Abschnitt 2 nichts
 * ------------------------------------------------------------------ */

/* Ohne diese Gegenprobe wäre Abschnitt 2 auch von einem Rechner
   erfüllt, der gar nichts tut: Wenn kein Stück etwas beiträgt, ist
   jede Differenz null und alles „stimmt". */
{
  const brix = figuren.find((f) => /Brix/i.test(f.name));
  melde(Boolean(brix), 'Brix Borin steht als Prüffall in den Daten');
  if (brix) {
    const w = brix.spielwerte;
    const alles = bogenAusDaten(w, finde);
    const ruestung = alles.ausruestung.find((s) => s.rolle === 'ruestung');
    melde(Boolean(ruestung), 'Brix trägt eine Rüstung');

    if (ruestung) {
      const ohne = bogenAusDaten(w, finde, { [ruestung.schluessel]: false });
      melde(ohne.werte.ruestungswert.endwert === 0,
        'Ohne Rüstung ist der Rüstungswert 0',
        'gerechnet ' + ohne.werte.ruestungswert.endwert);
      melde(ohne.werte.schwelleSchwer.endwert === w.stufe,
        'Ohne Rüstung bleibt als schwere Schwelle die blosse Stufe',
        'gerechnet ' + ohne.werte.schwelleSchwer.endwert + ', Stufe ' + w.stufe);
      melde(alles.werte.ruestungswert.endwert > ohne.werte.ruestungswert.endwert,
        'Die Rüstung verändert überhaupt etwas',
        alles.werte.ruestungswert.endwert + ' gegen ' + ohne.werte.ruestungswert.endwert);
    }

    /* Die Herleitung muss die Quelle **beim Namen nennen** — genau das
       hat Jannik verlangt („wodurch es verursacht wird"). */
    const zeilen = herleitung(alles.werte.ruestungswert);
    melde(zeilen.some((z) => ruestung && z.includes(ruestung.name)),
      'Die Herleitung nennt die Rüstung namentlich',
      zeilen.join(' | '));
    melde(zeilen[1] && zeilen[1].startsWith('Grundwert'),
      'Die Herleitung beginnt mit dem Grundwert', zeilen[1]);
  }
}

/* ------------------------------------------------------------------ *
 * 4 · Keine Wirkung wird doppelt gezählt
 * ------------------------------------------------------------------ */

/* Der Fall, der das teuer macht: Auf Brix' Bogen steht beim Gambeson
   `merkmal: "Flexible: +1 Ausweichen"`, im Regelwerk steht
   `wirkung: "+1 auf Evasion"`. Beide Texte treffen dasselbe Muster.
   Würden sie nebeneinander verrechnet, käme +2 heraus — eine Zahl, die
   plausibel bleibt und deshalb niemandem auffällt. */
{
  const brix = figuren.find((f) => /Brix/i.test(f.name));
  if (brix) {
    const ausruestung = ausruestungBauen(brix.spielwerte, finde);
    const gambeson = ausruestung.find((s) => s.rolle === 'ruestung');
    if (gambeson) {
      const treffer = wirkungLesen(gambeson.wirkung).beitraege
        .filter((b) => b.wert === 'evasion');
      melde(treffer.length === 1,
        'Die Rüstungswirkung liefert genau einen Ausweichen-Beitrag',
        treffer.length + ' Beiträge aus ' + JSON.stringify(gambeson.wirkung));

      /* Die schärfere Fassung: Nicht „die Felder unterscheiden sich",
         sondern **die Wirkung ist genau die des Regelwerks**. Der erste
         Anlauf prüfte nur auf Ungleichheit — und blieb grün, als der
         Rot-Beweis beide Texte aneinanderhängte. Eine Prüfung, die den
         Fehler nicht sieht, gegen den sie gebaut ist, ist Zierde. */
      const regel = finde(gambeson.regelname || gambeson.name);
      melde(Boolean(regel), 'Der Gambeson steht im Regelwerk');
      if (regel) {
        melde(gambeson.wirkung === (regel.wirkung || null),
          'Die Wirkung ist wortgleich die des Regelwerks',
          JSON.stringify(gambeson.wirkung) + ' gegen ' + JSON.stringify(regel.wirkung));
        melde(gambeson.merkmal === (regel.merkmal || null),
          'Das Merkmal ist wortgleich das des Regelwerks',
          JSON.stringify(gambeson.merkmal) + ' gegen ' + JSON.stringify(regel.merkmal));
      }
      const bogentext = (brix.spielwerte.ruestung || {}).merkmal || '';
      melde(!String(gambeson.wirkung || '').includes(bogentext),
        'Der Merkmalstext des Bogens steckt nicht zusätzlich in der Wirkung',
        JSON.stringify(bogentext));
    }
  }
}

/* ------------------------------------------------------------------ *
 * 4b · Ein Fall, den die echten Daten nicht hergeben
 * ------------------------------------------------------------------ */

/* ⚠️ **Der Rot-Beweis hat hier eine Lücke aufgedeckt.** Bei beiden
   Figuren heben sich die Ausweichen-Beiträge zufällig auf: Brix' Dolch
   gibt −1, sein Gambeson +1; Lukas' Lederrüstung wirkt gar nicht. Wird
   die Rückrechnung ausgebaut, kommt trotzdem dieselbe Zahl heraus —
   die Prüfungen oben blieben grün.
   Deshalb hier eine erfundene Figur mit einem **echten** Gegenstand
   aus dem Katalog, dessen Wirkung sich nicht wegkürzt. */
{
  const kette = finde('Chainmail Armor');
  melde(Boolean(kette), 'Das Kettenhemd steht im Katalog');
  if (kette) {
    const evasionBeitrag = wirkungLesen(kette.wirkung).beitraege
      .find((b) => b.wert === 'evasion');
    melde(Boolean(evasionBeitrag) && evasionBeitrag.delta !== 0,
      'Das Kettenhemd verändert das Ausweichen',
      JSON.stringify(kette.wirkung));

    /* Ein Bogen, wie er in den Weltdaten stünde: der Endwert **mit**
       Rüstung. Grundwert 12, Kettenhemd −1, also steht 11 auf dem
       Blatt. Die Rechnung muss daraus wieder 11 machen. */
    const probe = {
      stufe: 1,
      evasion: 12 + evasionBeitrag.delta,
      hp: 6,
      stress: 6,
      attribute: { agility: 0, strength: 0, finesse: 0, instinct: 0, presence: 0, knowledge: 0 },
      ruestung: {
        name: 'Kettenhemd', regelname: 'Chainmail Armor',
        score: kette.score, basisSchwer: kette.schwellen.schwer, basisErnst: kette.schwellen.ernst,
      },
      waffen: [],
    };

    const mit = bogenAusDaten(probe, finde);
    melde(mit.werte.evasion.endwert === probe.evasion,
      'Probefigur: Ausweichen mit Rüstung wie eingetragen',
      'gerechnet ' + mit.werte.evasion.endwert + ', eingetragen ' + probe.evasion);
    melde(mit.werte.evasion.grundwert === 12,
      'Probefigur: der zurückgerechnete Grundwert ist 12',
      'gerechnet ' + mit.werte.evasion.grundwert);

    const ohne = bogenAusDaten(probe, finde, { 'ruestung:Kettenhemd': false });
    melde(ohne.werte.evasion.endwert === 12,
      'Probefigur: ohne Rüstung steht wieder der Grundwert da',
      'gerechnet ' + ohne.werte.evasion.endwert);
    melde(ohne.werte.evasion.endwert !== mit.werte.evasion.endwert,
      'Probefigur: An- und Ablegen ändert das Ausweichen wirklich',
      mit.werte.evasion.endwert + ' gegen ' + ohne.werte.evasion.endwert);
  }
}

/* ------------------------------------------------------------------ *
 * 5 · Was Spielregel ist, wird gezeigt und nicht gerechnet
 * ------------------------------------------------------------------ */

{
  /* Ein echter Text aus dem Katalog, der keine Zahl auf einen Wert legt. */
  const regeltext = 'Rüstungsfeld markieren für +Ausweichen = Rüstungswert';
  const gelesen = wirkungLesen(regeltext);
  melde(gelesen.beitraege.length === 0,
    'Eine Wirkung ohne feste Zahl wird nicht eingerechnet',
    JSON.stringify(gelesen.beitraege));
  melde(gelesen.rest === regeltext,
    'Sie bleibt vollständig als Hinweis stehen');

  /* Und die gefährliche Mischform: Zahl **und** Regel im selben Satz.
     Wer nur die Zahl nimmt, verschluckt die Regel stillschweigend. */
  const gemischt = '−1 Evasion; zusätzlicher Schadenswürfel, niedrigster wird verworfen';
  const g = wirkungLesen(gemischt);
  melde(g.beitraege.some((b) => b.wert === 'evasion' && b.delta === -1),
    'Aus einer Mischform wird die Zahl gelesen');
  melde(g.rest === gemischt,
    'Und der ganze Satz bleibt trotzdem als Hinweis stehen', String(g.rest));
}

/* ------------------------------------------------------------------ *
 * 6 · Die Schlüssel taugen zum Merken
 * ------------------------------------------------------------------ */

for (const figur of figuren) {
  const stuecke = ausruestungBauen(figur.spielwerte, finde);
  const schluessel = stuecke.map((s) => s.schluessel);
  melde(new Set(schluessel).size === schluessel.length,
    figur.name + ': jedes Ausrüstungsstück hat einen eigenen Schlüssel',
    schluessel.join(', '));
  melde(schluessel.every((s) => !/^\d+$/.test(s)),
    figur.name + ': kein Schlüssel ist bloss eine Position in der Liste');
}

/* ------------------------------------------------------------------ *
 * 7 · Der Grundwert wandert nicht mit
 * ------------------------------------------------------------------ */

/* Der Grundwert wird aus dem eingetragenen Endwert zurückgerechnet.
   Nähme man dabei den **aktuellen** Trage-Zustand statt des
   eingetragenen, verschöbe sich der Grundwert mit jedem Klick — und
   nach Ablegen und Wiederanlegen stünde eine andere Zahl da als vorher. */
for (const figur of figuren) {
  const w = figur.spielwerte;
  const alles = ausruestungBauen(w, finde);
  const voll = basisZurueckrechnen(w, alles);
  const halb = basisZurueckrechnen(w, alles.map((s, i) => ({ ...s, angelegt: i !== 0 })));
  melde(JSON.stringify(voll.basis) === JSON.stringify(halb.basis),
    figur.name + ': der Grundwert hängt nicht am Trage-Zustand',
    JSON.stringify(voll.basis) + ' gegen ' + JSON.stringify(halb.basis));
}

/* ------------------------------------------------------------------ *
 * 8 · Was der Bogen nennt, findet der Katalog auch
 * ------------------------------------------------------------------ */

for (const figur of figuren) {
  const stuecke = ausruestungBauen(figur.spielwerte, finde);
  for (const s of stuecke) {
    /* Kein Fehler, wenn ein Stück fehlt — auf den Bögen der Runde
       stehen Gegenstände, die es in Daggerheart nicht gibt. Es muss nur
       **sichtbar** sein, und genau das prüft die Bedingung: Ein Stück
       ohne Regelwerk trägt keine erfundenen Zahlen. */
    if (s.imRegelwerk) continue;
    melde(s.score === null && s.schwellen === null,
      figur.name + ': „' + s.name + '" ist nicht im Regelwerk und bringt keine Zahlen mit',
      JSON.stringify({ score: s.score, schwellen: s.schwellen }));
  }
}

/* ------------------------------------------------------------------ *
 * 9 · Ein Antippen auf dem Handy schliesst die Blase nicht sofort wieder
 * ------------------------------------------------------------------ */

/* ⚠️ **Dieser Fehler war da, und nur der Browser hat ihn gezeigt.**
   `kartenblase.js` schliesst die Blase, wenn man daneben klickt. Der
   Horcher fragte nach `[data-karte]` — die Zahlen des Bogens tragen
   das aber nicht. Beim Antippen einer Zahl öffnete der Auslöser die
   Blase, und derselbe Klick schloss sie eine Zeile später wieder: Auf
   dem Handy tat sich **gar nichts**. Am Schreibtisch fiel es nicht auf,
   weil dort `mouseenter` öffnet und `mouseleave` schliesst.

   Die Bedingung ist deshalb eine eigene Funktion und wird hier mit
   einer winzigen DOM-Attrappe wirklich ausgeführt — kein Textvergleich
   am Quelltext, sondern das Verhalten selbst. */
{
  const { gehoertZurBlase } = await import('../karte/kartenblase.js');

  /* Eine Attrappe, die `closest` beantwortet wie ein Browser: sie geht
     die Elternkette hoch und vergleicht Attribute und Klasse. */
  const macheElement = (attribute = {}, klasse = '', eltern = null) => ({
    attribute, klasse, eltern,
    closest(auswahl) {
      for (let a = this; a; a = a.eltern) {
        if (auswahl.startsWith('[') && auswahl.slice(1, -1) in a.attribute) return a;
        if (auswahl.startsWith('.') && a.klasse === auswahl.slice(1)) return a;
      }
      return null;
    },
  });

  const zahl = macheElement({ 'data-wert': 'evasion', 'data-blase': 'ja' });
  const kartenname = macheElement({ 'data-karte': 'Gambeson', 'data-blase': 'ja' });
  const inDerBlase = macheElement({}, 'blase-wert',
    macheElement({}, 'kartenblase'));
  const irgendwo = macheElement({}, 'bogen-name');

  melde(gehoertZurBlase(zahl),
    'Ein Antippen auf eine Bogenzahl schliesst die Blase nicht');
  melde(gehoertZurBlase(kartenname),
    'Ein Antippen auf einen Kartennamen schliesst sie ebenfalls nicht');
  melde(gehoertZurBlase(inDerBlase),
    'Ein Klick in die Blase selbst schliesst sie nicht');
  melde(!gehoertZurBlase(irgendwo),
    'Ein Klick daneben schliesst sie sehr wohl');
  melde(!gehoertZurBlase(null), 'Ohne Element wird nichts behauptet');
}

ende();
