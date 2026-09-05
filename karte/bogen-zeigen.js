/* ===================================================================
   Age of Beast — die Spielfiguren als Daggerheart-Charakterbögen
   [Aufgabe: Charakterbogen]

   -------------------------------------------------------------------
   Zeichnet aus `eintrag.spielwerte` einen vollständigen Bogen.

   Drei Entscheidungen, die den Unterschied machen:

   **Die Werte kommen als Struktur, nicht als Fließtext.** In der
   Weltquelle stehen sie unter `fields.spielwerte`;
   `werkzeuge/welt-umwandeln.mjs` reicht sie unverändert durch. Müsste
   der Bogen sie aus Absätzen herauslesen, bräche er beim ersten anders
   formulierten Satz.

   **Was fehlt, wird gezeigt.** Eine Figur ohne Klasse bekommt keinen
   erfundenen Wert und kein weggelassenes Feld, sondern ein sichtbares
   „noch offen". Am Spieltisch ist eine Lücke, die man sieht, harmlos —
   eine, die man für vollständig hält, nicht.

   **Die Leisten werden gezeichnet, nicht getippt.** Lebenspunkte,
   Stress und Hoffnung sind Kästchen, weil man sie im Spiel abhakt.
   Hoffnung startet gefüllt (Startwert 2), die anderen beiden leer.

   =================================================================== */

import { blasenAnbinden } from './kartenblase.js';
import {
  attributeHtml, ausruestungHtml, bogenVerdrahten, katalogLaden, rechnerFuer,
  verteidigungHtml, vorraeteHtml,
} from './bogen-werte.js';

const ziel = document.getElementById('boegen');
const meldung = document.getElementById('bogenmeldung');

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

function bogen(e, rechner) {
  const w = e.spielwerte || {};
  const t = [];

  const klasse = klassenSchluessel(w.domaenen);
  t.push('<article class="bogen"' + (klasse ? ' data-klasse="' + klasse + '"' : '') + '>');

  /* ── Kopf: Name, Herkunft, Klasse, Stufe ── */
  t.push('<header class="bogen-kopf">');
  t.push('<div class="bogen-kopf-text">');
  t.push('<h2 class="bogen-name">' + sicher(e.name) + '</h2>');

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
  t.push('</div>');
  t.push('<div class="bogen-kopf-rechts">');
  t.push('<span class="stern-platz" data-fav-typ="bogen" data-fav-id="' + sicher(e.id)
    + '" data-fav-name="' + sicher(e.name) + '"></span>');
  t.push('<div class="bogen-stufe"><span class="mikro">Stufe</span><strong>'
    + (w.stufe === null || w.stufe === undefined ? '?' : w.stufe) + '</strong></div>');
  t.push('</div>');
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

  t.push('<section class="bogen-block"><h3>Attribute</h3>'
    + '<div data-bereich="attribute">' + attributeHtml(rechner.ergebnis()) + '</div></section>');

  t.push('<section class="bogen-block"><h3>Verteidigung</h3>'
    + '<div data-bereich="verteidigung">' + verteidigungHtml(rechner.ergebnis())
    + '</div></section>');

  t.push('<section class="bogen-block"><h3>Vorräte</h3>'
    + '<div data-bereich="vorraete">' + vorraeteHtml(rechner.ergebnis(), w)
    + '</div></section>');

  /* ── Erfahrungen ── */
  t.push('<section class="bogen-block"><h3>Erfahrungen</h3>');
  if (w.erfahrungen && w.erfahrungen.length) {
    t.push('<ul class="erfahrungen">');
    for (const x of w.erfahrungen) {
      t.push('<li><span class="erf-name">' + sicher(x.name) + '</span>'
        + '<span class="erf-bonus">' + mod(x.bonus) + '</span></li>');
    }
    t.push('</ul>');
  } else {
    t.push('<p class="bogen-luecke">' + OFFEN + '</p>');
  }
  t.push('</section>');

  /* ── Ausrüstung ── */
  t.push('<section class="bogen-block"><h3>Ausrüstung</h3>'
    + '<div data-bereich="ausruestung">' + ausruestungHtml(rechner.ergebnis())
    + '</div></section>');

  /* ── Domänen, Karten, Klassenfertigkeiten ── */
  t.push('<section class="bogen-block"><h3>Domänen und Karten</h3>');
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

  t.push('<footer class="bogen-fuss"><a href="./#' + encodeURIComponent(e.id)
    + '">Eintrag im Wiki &rsaquo;</a></footer>');
  t.push('</article>');
  return t.join('');
}

/* ------------------------------------------------------------------ *
 * Laden
 * ------------------------------------------------------------------ */

const welt = window.AGE_OF_BEAST_WELT;
const figuren = ((welt && welt.eintraege) || []).filter((e) => e.spielwerte);

if (!figuren.length) {
  if (meldung) {
    meldung.hidden = false;
    meldung.innerHTML = '<strong>Es sind noch keine Spielwerte hinterlegt.</strong><br>'
      + 'Der Bogen liest <code>spielwerte</code> aus den Weltdaten. '
      + 'Solange dort keine Figur welche trägt, ist hier nichts zu zeigen.';
  }
} else {
  /* Wer schon Werte hat, steht vorn — ein leerer Bogen ist der
     uninteressantere Einstieg. */
  /* Wer schon Werte hat, steht vorn — ein leerer Bogen ist der
     uninteressantere Einstieg. */
  figuren.sort((a, b) => (b.spielwerte.stufe ? 1 : 0) - (a.spielwerte.stufe ? 1 : 0));

  const leiste = document.getElementById('bogenwahl');

  /* Welche Figur gezeigt wird, steht in der Adresse. Damit ist ein
     einzelner Bogen verlinkbar — sonst landete jeder Verweis immer bei
     derselben Figur. */
  function gewaehlt() {
    const ausAdresse = new URLSearchParams(location.search).get('figur')
      || location.hash.replace(/^#/, '');
    const treffer = figuren.find((f) => f.id === ausAdresse);
    return treffer || figuren[0];
  }

  function leisteZeichnen(aktiv) {
    if (!leiste) return;
    leiste.innerHTML = figuren.map((f) => {
      const an = f.id === aktiv.id;
      const w = f.spielwerte || {};
      const unter = [w.klasse, w.abstammung].filter(Boolean).join(' · ');
      return '<button type="button" class="bogenwahl-knopf" data-figur="'
        + sicher(f.id) + '"' + (an ? ' aria-pressed="true"' : ' aria-pressed="false"') + '>'
        + '<span class="bogenwahl-name">' + sicher(f.name) + '</span>'
        + (unter ? '<span class="bogenwahl-unter">' + sicher(unter) + '</span>' : '')
        + '</button>';
    }).join('');
    for (const b of leiste.querySelectorAll('button')) {
      b.addEventListener('click', () => zeigen(b.dataset.figur, true));
    }
  }

  function sterneSetzen(bereich) {
    const fav = window.aobFavoriten;
    if (!fav) return;
    for (const platz of bereich.querySelectorAll('.stern-platz:empty')) {
      platz.appendChild(fav.knopf(platz.dataset.favTyp, platz.dataset.favId,
        platz.dataset.favName));
    }
  }

  function zeigen(id, adresseSetzen) {
    const figur = figuren.find((f) => f.id === id) || figuren[0];
    const rechner = rechnerFuer(figur);
    rechner.rechne();
    ziel.innerHTML = bogen(figur, rechner);
    /* Erst nach dem Zeichnen: Vorher gibt es die Ausloeser noch nicht. */
    blasenAnbinden(ziel);
    bogenVerdrahten(ziel, rechner, figur);
    sterneSetzen(ziel);
    leisteZeichnen(figur);
    document.title = figur.name + ' – Charakterbogen – Age of Beast';
    if (adresseSetzen) {
      const u = new URL(location.href);
      u.searchParams.set('figur', figur.id);
      u.hash = '';
      history.replaceState(null, '', u);
    }
  }

  /* ⚠️ **Erst der Katalog, dann der erste Bogen.** Die Wirkungen der
     Gegenstände stehen in `daten/daggerheart-gegenstaende.json`. Wer
     ohne sie zeichnet, zeigt bei Brix ein Ausweichen von 14 und
     korrigiert es Sekundenbruchteile später auf 13 — eine Zahl, die von
     selbst springt, ist am Spieltisch schlimmer als eine, die kurz auf
     sich warten lässt. Schlägt das Laden fehl, wird trotzdem gezeichnet:
     dann ohne Gegenstandswirkungen, und die Ausrüstungsliste sagt das
     bei jedem Stück selbst. */
  katalogLaden()
    .catch(() => null)
    .then(() => {
      zeigen(gewaehlt().id, false);
      window.addEventListener('popstate', () => zeigen(gewaehlt().id, false));
    });
}
