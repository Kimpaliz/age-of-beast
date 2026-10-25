/* [Aufgabe: Charakterbogen]
   Shared interactive sheet renderer for the wiki and the standalone page.
   Values stay structured; the existing calculator owns equipment effects. */
import { attributeHtml, ausruestungHtml, verteidigungHtml, vorraeteHtml } from './bogen-werte.js';
import { sheetProficiency } from '../werkzeuge/charakterbogen-daten.mjs';
const symbole = globalThis.window?.aobSymbole || null;

function sheetIcon(name) {
  return symbole?.eintragSymbol(name, 'characters', 'sheet-section-icon') || '';
}

/* Die Klassenfarbe kommt nicht aus dem Namen der Klasse, sondern aus
   ihrem Paar von Domänen. Fehlt eines der beiden Felder, bleibt der
   Bogen absichtlich beim ruhigen Grundton: Eine erfundene Zuordnung
   wäre am Spieltisch irreführender als keine Markierung. */
const KLASSEN_NACH_DOMAENEN = new Map([
  ['Codex|Grace', 'bard'],
  ['Arcana|Sage', 'druid'],
  ['Blade|Valor', 'guardian'],
  ['Bone|Sage', 'ranger'],
  ['Grace|Midnight', 'rogue'],
  ['Splendor|Valor', 'seraph'],
  ['Arcana|Midnight', 'sorcerer'],
  ['Blade|Bone', 'warrior'],
  ['Codex|Splendor', 'wizard'],
]);

function klassenSchluessel(domaenen) {
  if (!Array.isArray(domaenen)) return '';
  const paar = [...new Set(domaenen.filter((d) => typeof d === 'string'))].sort();
  return paar.length === 2 ? KLASSEN_NACH_DOMAENEN.get(paar.join('|')) || '' : '';
}

function sicher(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const OFFEN = '<span class="offen">noch offen</span>';

/**
 * Ein Name, hinter dem eine Karte steckt. `data-karte` traegt den
 * **Regelnamen** — auf dem Bogen steht „Dolch", in den Regeln „Dagger".
 * Ohne diese Trennung fände die Blase nichts, und der Bogen müsste
 * englisch beschriftet werden.
 */
function mitKarte(anzeige, regelname) {
  const gesucht = regelname || anzeige;
  if (!gesucht) return sicher(anzeige);
  return '<span class="karte-anker" data-karte="' + sicher(gesucht) + '">'
    + sicher(anzeige) + '</span>';
}

/* Ein Modifikator wird immer mit Vorzeichen geschrieben — „+2" und „−1"
   lesen sich am Tisch schneller als „2" und „-1". Das Minus ist ein
   echtes Minuszeichen; der Bindestrich stünde zu hoch. */
function mod(n) {
  if (n === null || n === undefined) return '—';
  if (n > 0) return '+' + n;
  if (n < 0) return '−' + Math.abs(n);
  return '0';
}

export function bogen(e, rechner, optionen) {
  const w = e.spielwerte || {};
  const t = [];

  const klasse = klassenSchluessel(w.domaenen);
  t.push('<article class="bogen"' + (klasse ? ' data-klasse="' + klasse + '"' : '') + '>');

  /* ── Kopf: Name, Herkunft, Klasse, Stufe ── */
  t.push('<header class="bogen-kopf">');
  t.push('<div class="bogen-kopf-text">');
  t.push('<h2 class="bogen-name">' + (symbole?.eintragSymbol(e.icon, e.kategorie, 'bogen-eintrag-icon', e.iconColor) || '')
    + '<span>' + sicher(e.name) + '</span></h2>');

  /* Abstammung und Gemeinschaft sind eigene Karten — deshalb einzeln
     verlinkt statt als eine zusammengesetzte Zeile. Das Fuerwort ist
     keine Karte. */
  const herkunftTeile = [];
  if (w.abstammung) herkunftTeile.push(mitKarte(w.abstammung));
  if (w.gemeinschaft) herkunftTeile.push(mitKarte(w.gemeinschaft));
  if (w.fuerwort) herkunftTeile.push(sicher(w.fuerwort));
  t.push('<p class="bogen-herkunft">'
    + (herkunftTeile.length ? herkunftTeile.join(' · ') : OFFEN) + '</p>');

  let beruf = OFFEN;
  if (w.klasse) {
    beruf = mitKarte(w.klasse);
    if (w.klasseDe) beruf += ' <span class="fremd">(' + sicher(w.klasseDe) + ')</span>';
    if (w.unterklasse) {
      beruf += ' — ' + mitKarte(w.unterklasse);
      if (w.unterklasseDe) beruf += ' <span class="fremd">(' + sicher(w.unterklasseDe) + ')</span>';
    }
  }
  t.push('<p class="bogen-beruf">' + beruf + '</p>');
  if (w.player) t.push('<p class="bogen-herkunft">Spieler: ' + sicher(w.player) + '</p>');
  t.push('</div>');
  t.push('<div class="bogen-kopf-rechts">');
  t.push('<button type="button" class="modul-knopf" data-sheet-print title="A4-Druckvorschau">Druckansicht</button>');
  t.push('<span class="stern-platz" data-fav-typ="bogen" data-fav-id="' + sicher(e.id)
    + '" data-fav-name="' + sicher(e.name) + '"></span>');
  t.push('<div class="bogen-stufe"><span class="mikro">Stufe</span><strong>'
    + (w.stufe === null || w.stufe === undefined ? '?' : w.stufe) + '</strong></div>');
  t.push('</div>');
  t.push('<div class="bogen-stufe"><span class="mikro">Übung</span><strong>'
    + (sheetProficiency(w) ?? '—') + '</strong></div>');
  t.push('</header>');

  if (e.kurz) t.push('<p class="bogen-kurz">' + sicher(e.kurz) + '</p>');

  /* ── Die rechnenden Bereiche ──────────────────────────────────────
     Attribute, Verteidigung, Vorräte und Ausrüstung hängen zusammen:
     Wer die Rüstung ablegt, ändert Ausweichen, Rüstungswert und
     Schwellen auf einmal. Deshalb baut sie `karte/bogen-werte.js`, und
     hier stehen nur die vier Behälter, die es beim Umschalten neu
     füllt. Das erspart es, den ganzen Bogen neu zu zeichnen — sonst
     verlöre man bei jedem Klick Blätterstand und Fokus. */
  t.push('<div data-bereich="abgelegt-hinweis"></div>');

  t.push('<section class="bogen-block bogen-attribute"><h3>' + sheetIcon('person') + 'Attribute</h3>'
    + '<div data-bereich="attribute">' + attributeHtml(rechner.ergebnis()) + '</div></section>');

  t.push('<section class="bogen-block"><h3>' + sheetIcon('shield') + 'Verteidigung</h3>'
    + '<div data-bereich="verteidigung">' + verteidigungHtml(rechner.ergebnis())
    + '</div></section>');

  t.push('<section class="bogen-block"><h3>' + sheetIcon('potion') + 'Vorräte</h3>'
    + '<div data-bereich="vorraete">' + vorraeteHtml(rechner.ergebnis(), w)
    + '</div></section>');

  /* ── Erfahrungen ── */
  t.push('<section class="bogen-block"><h3>' + sheetIcon('scroll') + 'Erfahrungen</h3>');
  if (w.erfahrungen && w.erfahrungen.length) {
    t.push('<ul class="erfahrungen">');
    for (const x of w.erfahrungen) {
      t.push('<li><span class="erf-name">' + sicher(x.name)
        + (x.vorlaeufig ? ' <small class="sheet-provisional">vorläufig</small>' : '') + '</span>'
        + '<span class="erf-bonus">' + mod(x.bonus) + '</span></li>');
    }
    t.push('</ul>');
  } else {
    t.push('<p class="bogen-luecke">' + OFFEN + '</p>');
  }
  t.push('</section>');

  /* ── Ausrüstung ── */
  t.push('<section class="bogen-block"><h3>' + sheetIcon('sword') + 'Ausrüstung</h3>'
    + '<div data-bereich="ausruestung">' + ausruestungHtml(rechner.ergebnis(), optionen)
    + '</div></section>');

  /* ── Domänen, Karten, Klassenfertigkeiten ── */
  t.push('<section class="bogen-block"><h3>' + sheetIcon('book') + 'Domänen und Karten</h3>');
  if (w.domaenen && w.domaenen.length) {
    t.push('<p class="domaenen">' + w.domaenen.map((d) =>
      '<span class="domaene-marke" data-domaene="' + sicher(d) + '">'
      + sicher(d) + '</span>').join('') + '</p>');
  }
  if (w.karten && w.karten.length) {
    /* Die Karten liegen als Kacheln unter `karten.html`. Der Verweis
       traegt den Namen mit, damit man dort sofort bei der richtigen
       Karte landet statt in 270 Kacheln zu suchen. */
    t.push('<ul class="kartenliste">');
    for (const k of w.karten) {
      t.push('<li><a href="karten.html?karte=' + encodeURIComponent(k) + '"'
        + ' class="karte-anker" data-karte="' + sicher(k) + '">'
        + sicher(k) + '</a></li>');
    }
    t.push('</ul>');
  } else {
    t.push('<p class="bogen-luecke">Fähigkeitskarten ' + OFFEN + '</p>');
  }

  if (w.klassenfertigkeit || w.hoffnungsfertigkeit || w.zauberattribut) {
    t.push('<dl class="fertigkeiten">');
    if (w.klassenfertigkeit) {
      t.push('<dt>Klassenfertigkeit</dt><dd>' + sicher(w.klassenfertigkeit) + '</dd>');
    }
    if (w.hoffnungsfertigkeit) {
      t.push('<dt>Hoffnungsfertigkeit</dt><dd>' + sicher(w.hoffnungsfertigkeit) + '</dd>');
    }
    if (w.zauberattribut) {
      t.push('<dt>Zauberattribut</dt><dd>' + sicher(w.zauberattribut) + '</dd>');
    }
    t.push('</dl>');
  }
  t.push('</section>');

  /* ── Was noch aussteht ── */
  if (w.offen && w.offen.length) {
    t.push('<section class="bogen-block bogen-offen"><h3>Noch offen</h3><ul>');
    for (const x of w.offen) t.push('<li>' + sicher(x) + '</li>');
    t.push('</ul></section>');
  }

  t.push('<footer class="bogen-fuss"><a href="' + sicher(optionen.wikiEintrag(e.id))
    + '">' + (symbole?.eintragSymbol(e.icon, e.kategorie, 'bogen-verweis-icon', e.iconColor) || '')
    + '<span>Eintrag im Wiki</span> &rsaquo;</a></footer>');
  t.push('</article>');
  return t.join('');
}
