/* ===================================================================
   Age of Beast — die Spielfiguren als Daggerheart-Charakterbögen
   [Aufgabe: Karte]

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

const ziel = document.getElementById('boegen');
const meldung = document.getElementById('bogenmeldung');

/* Die sechs Attribute in der Reihenfolge des offiziellen Bogens. Die
   deutschen Namen stehen dabei, weil am Tisch deutsch gesprochen wird —
   auf den Karten steht aber englisch. */
const ATTRIBUTE = [
  ['agility', 'Agility', 'Beweglichkeit'],
  ['strength', 'Strength', 'Stärke'],
  ['finesse', 'Finesse', 'Fingerfertigkeit'],
  ['instinct', 'Instinct', 'Instinkt'],
  ['presence', 'Presence', 'Ausstrahlung'],
  ['knowledge', 'Knowledge', 'Wissen'],
];

function sicher(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const OFFEN = '<span class="offen">noch offen</span>';

/* Ein Modifikator wird immer mit Vorzeichen geschrieben — „+2" und „−1"
   lesen sich am Tisch schneller als „2" und „-1". Das Minus ist ein
   echtes Minuszeichen; der Bindestrich stünde zu hoch. */
function mod(n) {
  if (n === null || n === undefined) return '—';
  if (n > 0) return '+' + n;
  if (n < 0) return '−' + Math.abs(n);
  return '0';
}

/* Eine Leiste aus Kästchen. `gefuellt` sind die bereits belegten. */
function leiste(anzahl, gefuellt, art) {
  if (!anzahl) return OFFEN;
  const voll = gefuellt || 0;
  let s = '<div class="leiste ' + art + '" role="img" aria-label="'
    + voll + ' von ' + anzahl + '">';
  for (let i = 0; i < anzahl; i += 1) {
    s += '<span class="kaestchen' + (i < voll ? ' voll' : '') + '"></span>';
  }
  return s + '</div>';
}

function bogen(e) {
  const w = e.spielwerte || {};
  const t = [];

  t.push('<article class="bogen">');

  /* ── Kopf: Name, Herkunft, Klasse, Stufe ── */
  t.push('<header class="bogen-kopf">');
  t.push('<div class="bogen-kopf-text">');
  t.push('<h2 class="bogen-name">' + sicher(e.name) + '</h2>');

  const herkunft = [w.abstammung, w.gemeinschaft].filter(Boolean).join(' · ');
  t.push('<p class="bogen-herkunft">' + (herkunft ? sicher(herkunft) : OFFEN) + '</p>');

  let beruf = OFFEN;
  if (w.klasse) {
    beruf = sicher(w.klasse);
    if (w.klasseDe) beruf += ' <span class="fremd">(' + sicher(w.klasseDe) + ')</span>';
    if (w.unterklasse) {
      beruf += ' — ' + sicher(w.unterklasse);
      if (w.unterklasseDe) beruf += ' <span class="fremd">(' + sicher(w.unterklasseDe) + ')</span>';
    }
  }
  t.push('<p class="bogen-beruf">' + beruf + '</p>');
  t.push('</div>');
  t.push('<div class="bogen-stufe"><span class="mikro">Stufe</span><strong>'
    + (w.stufe === null || w.stufe === undefined ? '?' : w.stufe) + '</strong></div>');
  t.push('</header>');

  if (e.kurz) t.push('<p class="bogen-kurz">' + sicher(e.kurz) + '</p>');

  /* ── Die sechs Attribute ── */
  t.push('<section class="bogen-block"><h3>Attribute</h3><div class="attribute">');
  for (const [schluessel, en, de] of ATTRIBUTE) {
    const wert = w.attribute ? w.attribute[schluessel] : null;
    const stark = typeof wert === 'number' && wert > 0;
    t.push('<div class="attribut' + (stark ? ' stark' : '') + '">'
      + '<span class="attribut-wert">' + mod(wert) + '</span>'
      + '<span class="attribut-name">' + en + '</span>'
      + '<span class="attribut-de">' + de + '</span>'
      + '</div>');
  }
  t.push('</div></section>');

  /* ── Verteidigung ── */
  t.push('<section class="bogen-block"><h3>Verteidigung</h3><div class="verteidigung">');
  t.push('<div class="schild"><span class="mikro">Ausweichen</span><strong>'
    + (w.evasion === null || w.evasion === undefined ? '—' : w.evasion) + '</strong></div>');
  const score = w.ruestung && w.ruestung.score !== undefined ? w.ruestung.score : '—';
  t.push('<div class="schild"><span class="mikro">Rüstung</span><strong>' + score + '</strong>'
    + (w.ruestung && w.ruestung.name ? '<small>' + sicher(w.ruestung.name) + '</small>' : '')
    + '</div>');
  t.push('</div>');

  /* Die Schwellen schlägt man am Tisch am häufigsten nach — deshalb als
     Balken mit den drei Bereichen statt als zwei nackte Zahlen. Unter
     der schweren Schwelle kostet ein Treffer 1 Lebenspunkt, dazwischen
     2, ab der ernsten 3. */
  if (w.ruestung && w.ruestung.schwelleSchwer) {
    const a = w.ruestung.schwelleSchwer;
    const b = w.ruestung.schwelleErnst;
    t.push('<div class="schwellen">');
    t.push('<div class="schwelle-bereich s1"><strong>1</strong><small>unter ' + a + '</small></div>');
    t.push('<div class="schwelle-marke">' + a + '</div>');
    t.push('<div class="schwelle-bereich s2"><strong>2</strong><small>ab ' + a + '</small></div>');
    t.push('<div class="schwelle-marke">' + b + '</div>');
    t.push('<div class="schwelle-bereich s3"><strong>3</strong><small>ab ' + b + '</small></div>');
    t.push('</div>');
    t.push('<p class="schwellen-hinweis">Lebenspunkte je Treffer</p>');
  } else {
    t.push('<p class="bogen-luecke">Schadensschwellen ' + OFFEN + '</p>');
  }
  t.push('</section>');

  /* ── Die drei Leisten ── */
  t.push('<section class="bogen-block"><h3>Vorräte</h3><div class="vorraete">');
  t.push('<div class="vorrat"><span class="mikro">Lebenspunkte</span>'
    + leiste(w.hp, 0, 'hp') + '</div>');
  t.push('<div class="vorrat"><span class="mikro">Stress</span>'
    + leiste(w.stress, 0, 'stress') + '</div>');
  const hStart = w.hoffnung ? w.hoffnung.start : null;
  const hMax = w.hoffnung ? w.hoffnung.max : null;
  t.push('<div class="vorrat"><span class="mikro">Hoffnung'
    + (hStart === null || hStart === undefined ? '' : ' <small>Start ' + hStart + '</small>')
    + '</span>' + leiste(hMax, hStart, 'hoffnung') + '</div>');
  t.push('</div></section>');

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
  t.push('<section class="bogen-block"><h3>Ausrüstung</h3><ul class="ausruestung">');
  let etwas = false;
  if (w.waffen && w.waffen.length) {
    for (const x of w.waffen) {
      etwas = true;
      t.push('<li><span class="mikro">' + sicher(x.hand || 'Waffe') + '</span>'
        + sicher(x.name) + '</li>');
    }
  }
  if (w.ruestung && w.ruestung.name) {
    etwas = true;
    t.push('<li><span class="mikro">Rüstung</span>' + sicher(w.ruestung.name)
      + ' <small>Score ' + w.ruestung.score + '</small></li>');
  }
  if (!etwas) t.push('<li class="bogen-luecke">' + OFFEN + '</li>');
  t.push('</ul></section>');

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
      t.push('<li><a href="karten.html?karte=' + encodeURIComponent(k) + '">'
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
  figuren.sort((a, b) => (b.spielwerte.stufe ? 1 : 0) - (a.spielwerte.stufe ? 1 : 0));
  ziel.innerHTML = figuren.map(bogen).join('');
}
