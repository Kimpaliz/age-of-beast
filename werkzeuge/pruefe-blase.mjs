/**
 * Ein Tipp muss reichen.  [Aufgabe: Prüfwesen]
 *
 * -------------------------------------------------------------------
 * Janniks Meldung vom 06.09.2026, wörtlich: „Die popup fenster im
 * caracterbogen muss ich immer doppelklicken. Ich will aber nur einmal
 * klicken müssen."
 *
 * **Die Ursache war die Reihenfolge der Ereignisse.** Ein Tipp auf ein
 * Element mit `tabindex="0"` löst nacheinander `pointerdown` → `focus`
 * → `click` aus. Der Fokus öffnete die Blase, und der Klick danach fand
 * sie offen — also schloss er sie als Umschalter wieder. Sichtbar
 * passierte beim ersten Tipp gar nichts.
 *
 * ── Warum ohne Browser ─────────────────────────────────────────────
 *
 * `pruefe-bogenfarben.mjs` fährt zwar einen echten Browser, kann diesen
 * Fall aber **nicht** sehen: Ihr Messrahmen liegt bei `left:-2000px`
 * und ist nicht fokussiert, also löst ein `focus()` darin gar kein
 * Fokus-Ereignis aus — und genau dieses Ereignis ist die Ursache.
 * Gemessen am 06.09.2026: Die Farbmessung war grün, während im echten
 * Browser jeder Tipp doppelt nötig war.
 *
 * Deshalb hier ein **Papier-DOM**: gerade genug, damit
 * `karte/kartenblase.js` wirklich läuft, und in Node deterministisch.
 * Es gibt keinen Rahmen, der etwas verschluckt, und die Prüfung läuft
 * auch auf dem Bauserver — ohne Browser, ohne Fremdbibliothek.
 *
 * ⚠️ Ein Papier-DOM prüft nur, was es nachbaut. Es beweist die
 * **Reihenfolge**, nicht das Aussehen; die Farben und die Grösse der
 * Tippziele misst `pruefe-bogenfarben.mjs` im echten Browser.
 */

import { macheMelder } from './helfer.mjs';

const { melde, ende } = macheMelder({ still: true });

/* ------------------------------------------------------------------ *
 * Das Papier-DOM
 * ------------------------------------------------------------------ */

function macheElement(art) {
  const horcher = new Map();
  const el = {
    tagName: String(art).toUpperCase(),
    className: '',
    hidden: false,
    innerHTML: '',
    dataset: {},
    style: {},
    attribute: {},
    kinder: [],
    classList: {
      add() {}, remove() {}, contains: () => false,
    },
    setAttribute(name, wert) { el.attribute[name] = String(wert); },
    getAttribute(name) { return el.attribute[name] ?? null; },
    appendChild(kind) { el.kinder.push(kind); return kind; },
    addEventListener(art2, fn) {
      if (!horcher.has(art2)) horcher.set(art2, []);
      horcher.get(art2).push(fn);
    },
    /* Der Auslöser trägt `data-blase`; `closest` muss das treffen, sonst
       schliesst der Horcher auf dem Dokument die Blase sofort wieder. */
    closest(wahl) {
      if (wahl === '[data-blase]') return el.dataset.blase ? el : null;
      if (wahl === '.kartenblase') return el.className.includes('kartenblase') ? el : null;
      return null;
    },
    getBoundingClientRect: () => ({ left: 0, top: 0, right: 10, bottom: 10, width: 10, height: 10 }),
    /** Ein Ereignis auslösen — gibt zurück, ob es Horcher gab. */
    feuere(art2, ereignis = {}) {
      const liste = horcher.get(art2) || [];
      for (const fn of liste) fn({ preventDefault() {}, target: el, ...ereignis });
      return liste.length > 0;
    },
    hatHorcher: (art2) => (horcher.get(art2) || []).length > 0,
  };
  return el;
}

function papierDom() {
  const dokumentHorcher = new Map();
  const koerper = macheElement('body');

  globalThis.document = {
    body: koerper,
    createElement: macheElement,
    addEventListener(art, fn) {
      if (!dokumentHorcher.has(art)) dokumentHorcher.set(art, []);
      dokumentHorcher.get(art).push(fn);
    },
    querySelector: () => null,
    querySelectorAll: () => [],
    feuere(art, ereignis = {}) {
      for (const fn of dokumentHorcher.get(art) || []) fn({ preventDefault() {}, ...ereignis });
    },
  };

  /* Am Schreibtisch, nicht am Telefon: So bleibt `mouseenter` aktiv und
     der Tipp muss sich **gegen** das Überfahren behaupten. Der
     Telefonfall wird unten eigens gemessen. */
  let beruehrung = false;
  globalThis.window = {
    matchMedia: (frage) => ({ matches: beruehrung && frage.includes('hover: none') }),
    innerWidth: 1280,
    innerHeight: 900,
    scrollX: 0,
    scrollY: 0,
    addEventListener() {},
  };
  globalThis.matchMedia = globalThis.window.matchMedia;
  globalThis.addEventListener = () => {};

  return {
    dokument: globalThis.document,
    aufTelefonSchalten() {
      beruehrung = true;
      globalThis.window.innerWidth = 412;
    },
  };
}

/* ------------------------------------------------------------------ *
 * Die Messung
 * ------------------------------------------------------------------ */

const dom = papierDom();
const blasenModul = await import('../karte/kartenblase.js');
const { blaseAnbinden, fokusDarfOeffnen } = blasenModul;

function neuerAusloeser(name) {
  const el = macheElement('span');
  el.dataset.wert = name;
  blaseAnbinden(el, () => '<article>Herleitung für ' + name + '</article>');
  return el;
}

/* Die Blase hängt am Körper des Papier-DOM. */
const blaseImDom = () => dom.dokument.body.kinder.find((k) => k.className === 'kartenblase') || null;
const blaseOffen = () => {
  const b = blaseImDom();
  return Boolean(b) && b.hidden === false;
};

/** Ein Tipp, so wie der Browser ihn auslöst. */
function tippen(el) {
  dom.dokument.feuere('pointerdown', { target: el });
  el.feuere('focus');
  el.feuere('click');
}

/* ── 1 · Die reine Entscheidung ───────────────────────────────────── */

/* ⚠️ Nicht direkt aufrufen: Fehlt der Export, wirft die Prüfung sonst
   und meldet **gar nichts** — auch nicht die vier Fälle darunter, um
   die es eigentlich geht. Ein Wächter, der beim gesuchten Fehler
   abstürzt, ist keiner. */
const darfOeffnen = typeof fokusDarfOeffnen === 'function'
  ? fokusDarfOeffnen
  : () => 'nicht vorhanden';

melde(typeof fokusDarfOeffnen === 'function',
  'kartenblase.js sagt nach aussen, wann ein Fokus öffnen darf');
melde(darfOeffnen('tastatur') === true,
  'ein Fokus von der Tastatur öffnet — sonst wäre die Blase ohne Maus unerreichbar');
melde(darfOeffnen('zeiger') === false,
  'ein Fokus vom Finger oder von der Maus öffnet nicht — sonst schliesst der Klick danach wieder');

/* ── 2 · Der Fall, um den es geht: EIN Tipp ───────────────────────── */

{
  const a = neuerAusloeser('evasion');
  melde(a.hatHorcher('click') && a.hatHorcher('focus'),
    'ein Auslöser bekommt Klick und Fokus verdrahtet');

  tippen(a);
  melde(blaseOffen(),
    'EIN Tipp öffnet die Blase — genau Janniks Meldung vom 06.09.2026',
    blaseOffen() ? 'offen' : 'nach dem ersten Tipp immer noch zu');
}

/* ── 3 · Und ein zweiter Tipp schliesst sie wieder ────────────────── */

{
  const a = neuerAusloeser('ruestungswert');
  tippen(a);
  const nachEinem = blaseOffen();
  tippen(a);
  melde(nachEinem && !blaseOffen(),
    'ein zweiter Tipp schliesst sie — sonst bekäme man sie auf dem Telefon nicht mehr weg',
    'nach 1 Tipp ' + (nachEinem ? 'offen' : 'zu') + ', nach 2 ' + (blaseOffen() ? 'offen' : 'zu'));
}

/* ── 4 · Die Tastatur bleibt bedienbar ───────────────────────────── */

{
  const a = neuerAusloeser('hp');
  /* Kein pointerdown davor: So kommt der Fokus von der Tastatur. */
  dom.dokument.feuere('keydown', { key: 'Tab' });
  a.feuere('focus');
  melde(blaseOffen(),
    'wer mit Tab auf eine Zahl geht, sieht die Herleitung ohne Maus',
    blaseOffen() ? 'offen' : 'zu');
  a.feuere('blur');
  melde(!blaseOffen(), 'und beim Weitergehen verschwindet sie wieder');
}

/* ── 5 · Auf dem Telefon gilt dasselbe ───────────────────────────── */

{
  dom.aufTelefonSchalten();
  const a = neuerAusloeser('stress');
  tippen(a);
  melde(blaseOffen(),
    'auch auf dem Telefon reicht ein Tipp — dort gibt es kein Überfahren, das den Fehler verdeckt',
    blaseOffen() ? 'offen' : 'zu');
}

/* ── 6 · Die Schwelle sagt, was sie bedeutet ─────────────────────── */

/* Janniks zweiter Wunsch vom selben Tag: „Und den schadensthreshold auch
   mit popup anzeigen." Ein Popup gab es schon — es war 22 Bildpunkte
   breit und brauchte zwei Tipps. Was fehlte, war der Satz darin. */

const textModul = await import('../karte/schwellen-text.js').catch((f) => ({ fehler: f }));
const schwellenErklaerung = textModul.schwellenErklaerung;

melde(typeof schwellenErklaerung === 'function',
  'schwellen-text.js erklärt eine Schwelle in einem Satz',
  textModul.fehler ? String(textModul.fehler.message).slice(0, 80) : '');

if (typeof schwellenErklaerung === 'function') {
  const werte = { schwelleSchwer: { endwert: 6 }, schwelleErnst: { endwert: 12 } };

  const schwer = schwellenErklaerung('schwelleSchwer', werte);
  melde(schwer.includes('6') && /1 Lebenspunkt/.test(schwer) && / 2\./.test(schwer),
    'die schwere Schwelle nennt beide Seiten: darunter 1 Lebenspunkt, ab ihr 2', schwer);

  const ernst = schwellenErklaerung('schwelleErnst', werte);
  melde(ernst.includes('12') && /3 Lebenspunkte/.test(ernst),
    'die ernste Schwelle nennt die 3 Lebenspunkte', ernst);

  /* ⚠️ Die Sätze werden **gerechnet**, nicht abgeschrieben: Legt jemand
     die Rüstung ab, muss die Zahl im Satz mitwandern. */
  const ohne = schwellenErklaerung('schwelleSchwer',
    { schwelleSchwer: { endwert: 1 }, schwelleErnst: { endwert: 1 } });
  melde(ohne.includes('1') && !ohne.includes('6'),
    'der Satz folgt dem aktuellen Wert, statt eine Zahl festzuschreiben', ohne);

  melde(schwellenErklaerung('evasion', werte) === '',
    'jeder andere Wert bekommt keine Fussnote angedichtet');
  melde(schwellenErklaerung('schwelleSchwer', {}) === '',
    'ohne Zahlen wird nichts behauptet');
}

/* ── 7 · Und man trifft sie mit dem Daumen ───────────────────────── */

/* Gemessen am 06.09.2026 auf einem Telefon: 22 bzw. 29 Bildpunkte
   breit. 44 ist das übliche Mindestmass für einen Finger — darunter
   tippt man daneben, und das Popup sieht aus, als gäbe es keins. */
{
  const { readFileSync } = await import('node:fs');
  const { join } = await import('node:path');
  const { WURZEL } = await import('./helfer.mjs');
  const css = readFileSync(join(WURZEL, 'styles/charakterbogen.css'), 'utf8');
  const block = css.slice(css.indexOf('.schwelle-marke {'));
  const bis = block.slice(0, block.indexOf('}'));
  const breite = bis.match(/min-width:\s*([\d.]+)rem/);
  const hoehe = bis.match(/min-height:\s*([\d.]+)rem/);
  melde(Boolean(breite) && Number(breite[1]) * 16 >= 44,
    'die Schwellen-Marke ist breit genug für einen Daumen',
    breite ? Number(breite[1]) * 16 + ' Bildpunkte' : 'keine min-width');
  melde(Boolean(hoehe) && Number(hoehe[1]) * 16 >= 44,
    'und hoch genug',
    hoehe ? Number(hoehe[1]) * 16 + ' Bildpunkte' : 'keine min-height');
}

ende();
