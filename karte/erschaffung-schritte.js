/* ===================================================================
   Age of Beast — die neun Schritte der Charaktererschaffung, gezeichnet
   [Aufgabe: Charakterbogen]

   -------------------------------------------------------------------
   Je Schritt eine Funktion, die das Formular baut. Was zur Wahl steht,
   kommt aus `werkzeuge/erschaffung-regeln.mjs` und damit aus den
   Katalogen — hier steht keine einzige Liste von Klassen, Waffen oder
   Karten.

   **Jede Wahl zeigt, was sie bedeutet.** Eine Liste mit neun
   Klassennamen ist für jemanden, der Daggerheart zum ersten Mal spielt,
   keine Entscheidungsgrundlage. Deshalb steht an jeder Klasse ihr
   Ausweichen, ihre Lebenspunkte und ihre zwei Domänen; an jeder Waffe
   Schaden, Reichweite und Merkmal; an jeder Rüstung Rüstungswert und
   Schwellen. Das ist der Unterschied zwischen einem Formular und einer
   Begleitung.

   **Namen bleiben englisch.** Auf den Karten steht „Nightwalker", am
   Tisch sagt man „Nightwalker". Eine Übersetzung, die es auf keiner
   Karte gibt, macht das Nachschlagen schwerer.

   Arbeitet zusammen mit: `karte/erschaffung.js` (Ablauf und Bedienung),
   `karte/kartenblase.js` (die Karte beim Überfahren).
   =================================================================== */

import {
  EIGENSCHAFTEN, EIGENSCHAFTSVORRAT, GRUNDVORRAT, START,
  abstammungen, domaenenkarten, gemeinschaften, klasseVon, startruestungen,
  startwaffen, unterklassen, zweihaendig,
} from '../werkzeuge/erschaffung-regeln.mjs';
import { ersterRang, ersterRangSchwellen } from '../werkzeuge/werte-rechnen.mjs';

export function sicher(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const mod = (n) => (n > 0 ? '+' + n : n < 0 ? '−' + Math.abs(n) : '0');

/**
 * Eine Auswahlkachel. `data-wahl` sagt, welches Feld sie setzt —
 * `erschaffung.js` hört auf genau ein Ereignis für alle Kacheln.
 */
function kachel({ feld, wert, titel, unter, zeilen, gewaehlt, karte }) {
  return '<button type="button" class="wahl' + (gewaehlt ? ' gewaehlt' : '') + '"'
    + ' data-wahl="' + sicher(feld) + '" data-wert="' + sicher(wert) + '"'
    + ' aria-pressed="' + (gewaehlt ? 'true' : 'false') + '">'
    + '<span class="wahl-titel"' + (karte ? ' data-karte="' + sicher(karte) + '"' : '') + '>'
    + sicher(titel) + '</span>'
    + (unter ? '<span class="wahl-unter">' + sicher(unter) + '</span>' : '')
    + (zeilen && zeilen.length
      ? '<span class="wahl-werte">' + zeilen.map((z) => '<span>' + sicher(z) + '</span>').join('') + '</span>'
      : '')
    + '</button>';
}

const raster = (inhalt) => '<div class="wahl-raster">' + inhalt + '</div>';

const feldkopf = (text) => '<h3 class="schritt-feldkopf">' + sicher(text) + '</h3>';

/* ------------------------------------------------------------------ *
 * 1 · Klasse und Subklasse
 * ------------------------------------------------------------------ */

function schritt1(z, kat) {
  const t = [feldkopf('Klasse')];
  t.push(raster((kat.klassen || []).map((k) => kachel({
    feld: 'klasse', wert: k.name, titel: k.name,
    unter: k.domaenen.join(' & '),
    zeilen: ['Ausweichen ' + k.evasion, 'Lebenspunkte ' + k.hp],
    gewaehlt: z.klasse === k.name,
  })).join('')));

  if (!z.klasse) {
    t.push('<p class="schritt-hinweis">Die Unterklassen erscheinen, sobald eine Klasse steht — '
      + 'jede Klasse hat ihre eigenen zwei.</p>');
    return t.join('');
  }

  const zwei = unterklassen(kat.karten, z.klasse);
  t.push(feldkopf('Unterklasse'));
  t.push(raster(zwei.map((u) => {
    const grund = (u.merkmaleFoundation || [])[0];
    return kachel({
      feld: 'unterklasse', wert: u.name, titel: u.name, karte: u.name,
      unter: grund ? grund.name : null,
      zeilen: grund ? [kuerzen(grund.text, 110)] : [],
      gewaehlt: z.unterklasse === u.name,
    });
  }).join('')));

  const k = klasseVon(z, kat);
  if (k) {
    /* ⚠️ Erst **jeden Namen einzeln** entschärfen, dann mit Auszeichnung
       verbinden. Andersherum — `sicher(join('</strong> …'))` — landet das
       Markup als sichtbarer Text auf der Seite; genau so stand es bis zum
       05.09.2026 hier und in Schritt 8. */
    t.push('<p class="schritt-hinweis">Deine Domänen sind damit '
      + k.domaenen.map((d) => '<strong>' + sicher(d) + '</strong>').join(' und ')
      + '. Aus ihnen wählst du in Schritt 8 zwei Karten.</p>');
  }
  return t.join('');
}

function kuerzen(text, laenge) {
  const s = String(text || '').trim();
  if (s.length <= laenge) return s;
  const schnitt = s.lastIndexOf(' ', laenge);
  return s.slice(0, schnitt > 0 ? schnitt : laenge) + ' …';
}

/* ------------------------------------------------------------------ *
 * 2 · Herkunft
 * ------------------------------------------------------------------ */

function schritt2(z, kat) {
  const merkmalstext = (e) => (e.merkmale || [])
    .map((m) => m.name).filter(Boolean).join(' · ');

  const t = [feldkopf('Abstammung')];
  t.push(raster(abstammungen(kat.karten).map((a) => kachel({
    feld: 'abstammung', wert: a.name, titel: a.name, karte: a.name,
    unter: merkmalstext(a), gewaehlt: z.abstammung === a.name,
  })).join('')));

  t.push(feldkopf('Gemeinschaft'));
  t.push(raster(gemeinschaften(kat.karten).map((g) => kachel({
    feld: 'gemeinschaft', wert: g.name, titel: g.name, karte: g.name,
    unter: merkmalstext(g), gewaehlt: z.gemeinschaft === g.name,
  })).join('')));
  return t.join('');
}

/* ------------------------------------------------------------------ *
 * 3 · Eigenschaften
 * ------------------------------------------------------------------ */

/**
 * Der Vorrat wird **ausgeteilt**, nicht abgefragt. Sechs Zahlen liegen
 * bereit; jede Eigenschaft nimmt eine. Ein Zahlenfeld je Eigenschaft
 * wäre einfacher zu bauen und ließe jede Verteilung zu — auch eine,
 * die es nicht gibt.
 */
function schritt3(z, kat) {
  const vergeben = EIGENSCHAFTEN.map(([s]) => z.eigenschaften?.[s])
    .filter((w) => typeof w === 'number');
  const rest = [...EIGENSCHAFTSVORRAT];
  for (const w of vergeben) {
    const i = rest.indexOf(w);
    if (i >= 0) rest.splice(i, 1);
  }

  const t = ['<p class="vorrat-zeile"><span class="mikro">Noch zu vergeben</span>'
    + (rest.length
      ? rest.map((w) => '<b class="vorratswert">' + mod(w) + '</b>').join('')
      : '<em>nichts mehr — die Verteilung steht</em>') + '</p>'];

  t.push('<div class="eigenschaften-tafel">');
  for (const [schluessel, en, de] of EIGENSCHAFTEN) {
    const wert = z.eigenschaften?.[schluessel];
    t.push('<div class="eigenschaft' + (typeof wert === 'number' ? ' gesetzt' : '') + '">');
    t.push('<span class="eigenschaft-name">' + en + '<small>' + de + '</small></span>');
    t.push('<span class="eigenschaft-knoepfe">');
    /* Angeboten wird, was noch im Vorrat liegt — plus der eigene Wert,
       damit man ihn zurückgeben kann. */
    const angebot = [...new Set([...rest, ...(typeof wert === 'number' ? [wert] : [])])]
      .sort((a, b) => b - a);
    for (const w of angebot) {
      t.push('<button type="button" class="eigenschaft-knopf' + (wert === w ? ' gewaehlt' : '') + '"'
        + ' data-eigenschaft="' + schluessel + '" data-punkte="' + w + '"'
        + ' aria-pressed="' + (wert === w ? 'true' : 'false') + '">' + mod(w) + '</button>');
    }
    t.push('</span></div>');
  }
  t.push('</div>');
  return t.join('');
}

/* ------------------------------------------------------------------ *
 * 4 · Angaben und Startwerte
 * ------------------------------------------------------------------ */

function schritt4(z, kat) {
  const k = klasseVon(z, kat);
  const t = ['<div class="feld-reihe">'];
  t.push(textfeld('name', 'Name', z.name, 'Wie heißt deine Figur?'));
  t.push(textfeld('fuerwort', 'Fürwort', z.fuerwort, 'sie · er · they …'));
  t.push('</div>');
  t.push(textbereich('beschreibung', 'Beschreibung', z.beschreibung,
    'Ein, zwei Sätze: Wie sieht sie aus, wie tritt sie auf?'));

  t.push(feldkopf('Was daraus schon feststeht'));
  t.push('<div class="startwerte">');
  const zeile = (was, wert, woher) => '<div class="startwert"><span class="mikro">'
    + sicher(was) + '</span><strong>' + sicher(wert) + '</strong><small>'
    + sicher(woher) + '</small></div>';
  t.push(zeile('Stufe', START.stufe, 'immer 1 am Anfang'));
  t.push(zeile('Ausweichen', k ? k.evasion : '—', k ? k.name + '-Basis' : 'braucht die Klasse'));
  t.push(zeile('Lebenspunkte', k ? k.hp : '—', k ? k.name + '-Basis' : 'braucht die Klasse'));
  t.push(zeile('Stress', START.stress, 'für alle gleich'));
  t.push(zeile('Hoffnung', START.hoffnungStart + ' von ' + START.hoffnungMax, 'Startwert'));
  t.push(zeile('Kompetenz', START.kompetenz, 'für alle gleich'));
  t.push('</div>');
  return t.join('');
}

function textfeld(feld, beschriftung, wert, hilfe) {
  return '<label class="feld"><span class="mikro">' + sicher(beschriftung) + '</span>'
    + '<input type="text" data-feld="' + feld + '" value="' + sicher(wert || '') + '"'
    + ' placeholder="' + sicher(hilfe) + '"></label>';
}

function textbereich(feld, beschriftung, wert, hilfe) {
  return '<label class="feld"><span class="mikro">' + sicher(beschriftung) + '</span>'
    + '<textarea data-feld="' + feld + '" rows="3" placeholder="' + sicher(hilfe) + '">'
    + sicher(wert || '') + '</textarea></label>';
}

/* ------------------------------------------------------------------ *
 * 5 · Startausrüstung
 * ------------------------------------------------------------------ */

function schritt5(z, kat) {
  const prim = startwaffen(kat.gegenstaende, 'primaerwaffe');
  const gewaehltePrim = prim.find((w) => w.name === z.primaerwaffe) || null;
  const beideHaende = gewaehltePrim && zweihaendig(gewaehltePrim);

  const waffenzeilen = (w) => [
    w.schaden ? w.schaden.text : null, w.attribut, w.reichweite, w.traglast,
    w.merkmal ? w.merkmal + (w.wirkung ? ': ' + w.wirkung : '') : null,
  ].filter(Boolean);

  const t = [feldkopf('Primärwaffe')];
  t.push(raster(prim.map((w) => kachel({
    feld: 'primaerwaffe', wert: w.name, titel: w.name, karte: w.name,
    zeilen: waffenzeilen(w), gewaehlt: z.primaerwaffe === w.name,
  })).join('')));

  t.push(feldkopf('Sekundärwaffe'));
  if (beideHaende) {
    t.push('<p class="schritt-hinweis">' + sicher(gewaehltePrim.name)
      + ' braucht beide Hände — eine Sekundärwaffe entfällt.</p>');
  } else {
    t.push(raster([
      kachel({ feld: 'sekundaerwaffe', wert: '', titel: 'keine',
        unter: 'freie Hand', gewaehlt: !z.sekundaerwaffe }),
      ...startwaffen(kat.gegenstaende, 'sekundaerwaffe').map((w) => kachel({
        feld: 'sekundaerwaffe', wert: w.name, titel: w.name, karte: w.name,
        zeilen: waffenzeilen(w), gewaehlt: z.sekundaerwaffe === w.name,
      })),
    ].join('')));
  }

  /* ⚠️ **Kein Feld hier ist sicher da.** Vier der acht Rüstungen des
     ersten Rangs tragen statt `score` und `schwellen` eine Liste über
     alle Ränge. Bis zum 05.09.2026 stand hier `r.schwellen.schwer` —
     das warf, der ganze Schritt wurde nicht gezeichnet, und weil
     `inhaltZeichnen()` vor dem Schreiben abbrach, blieb der **vorige**
     Schritt stehen. Es sah aus, als reagiere die Leiste nicht. */
  t.push(feldkopf('Rüstung'));
  t.push(raster(startruestungen(kat.gegenstaende).map((r) => {
    const score = typeof r.score === 'number' ? r.score : ersterRang(r.scoreStufen);
    const schwellen = r.schwellen || ersterRangSchwellen(r.schwellenStufen);
    return kachel({
      feld: 'ruestung', wert: r.name, titel: r.name, karte: r.name,
      zeilen: [
        score === null ? 'Rüstungswert unbekannt' : 'Rüstungswert ' + score,
        schwellen
          ? 'Schwellen ' + schwellen.schwer + ' / ' + schwellen.ernst + ' (+ Stufe)'
          : 'Schwellen unbekannt',
        r.merkmal ? r.merkmal + (r.wirkung ? ': ' + r.wirkung : '') : null,
      ].filter(Boolean),
      gewaehlt: z.ruestung === r.name,
    });
  }).join('')));

  const k = klasseVon(z, kat);
  t.push(feldkopf('Klassengegenstand'));
  if (!k) {
    t.push('<p class="schritt-hinweis">Er hängt an der Klasse — erst Schritt 1.</p>');
  } else {
    t.push(raster(k.gegenstaende.map((g) => kachel({
      feld: 'klassengegenstand', wert: g, titel: g,
      gewaehlt: z.klassengegenstand === g,
    })).join('')));
  }

  t.push('<p class="schritt-hinweis">Dazu gehört immer, ohne Wahl: '
    + sicher(GRUNDVORRAT.join(', ')) + '.</p>');
  return t.join('');
}

/* ------------------------------------------------------------------ *
 * 6 · Hintergrund · 7 · Erfahrungen · 9 · Verbindungen
 * ------------------------------------------------------------------ */

function schritt6(z) {
  return textbereich('hintergrund', 'Hintergrund', z.hintergrund,
    'Woher kommt sie? Wen hat sie verloren? Was schuldet sie wem?')
    + '<p class="schritt-hinweis">Kein Pflichtfeld — der Regeltext sagt ausdrücklich, '
    + 'dass der Hintergrund keine unmittelbare Regelwirkung hat.</p>';
}

function schritt7(z) {
  const t = ['<p class="schritt-hinweis">Beide starten mit <strong>+2</strong>. '
    + 'Gut sind Erfahrungen, die oft, aber nicht immer passen: '
    + '„Aufgewachsen in den Docks" trägt weiter als „Kämpfen".</p>'];
  for (let i = 0; i < 2; i += 1) {
    t.push('<label class="feld"><span class="mikro">Erfahrung ' + (i + 1)
      + ' <b class="erf-bonus">+2</b></span>'
      + '<input type="text" data-erfahrung="' + i + '" value="'
      + sicher((z.erfahrungen || [])[i] || '') + '"'
      + ' placeholder="Ein Satz, kein Schlagwort"></label>');
  }
  return t.join('');
}

function schritt9(z) {
  return textbereich('verbindungen', 'Verbindungen', z.verbindungen,
    'Wen aus der Gruppe kennst du — und woher?')
    + '<p class="schritt-hinweis">Auch das ist kein Pflichtfeld: Verbindungen '
    + 'dürfen laut Regel erst im Spiel entstehen.</p>';
}

/* ------------------------------------------------------------------ *
 * 8 · Domänenkarten
 * ------------------------------------------------------------------ */

function schritt8(z, kat) {
  const k = klasseVon(z, kat);
  if (!k) return '<p class="schritt-hinweis">Die Domänen hängen an der Klasse — erst Schritt 1.</p>';

  const gewaehlt = z.domaenenkarten || [];
  const t = ['<p class="schritt-hinweis">Zwei Karten aus '
    + k.domaenen.map((d) => '<strong>' + sicher(d) + '</strong>').join(' oder ')
    + '. Beide dürfen aus derselben Domäne kommen. '
    + '<span class="zaehler">' + gewaehlt.length + ' von 2</span></p>'];

  t.push(raster(domaenenkarten(kat.karten, k).map((d) => {
    const an = gewaehlt.includes(d.name);
    /* Ist die Auswahl voll, bleiben nur die gewählten anklickbar —
       sonst klickt man eine dritte an und es passiert nichts, ohne
       dass jemand sagt warum. */
    const gesperrt = !an && gewaehlt.length >= 2;
    return '<button type="button" class="wahl' + (an ? ' gewaehlt' : '')
      + (gesperrt ? ' gesperrt' : '') + '"'
      + ' data-domaenenkarte="' + sicher(d.name) + '"'
      + (gesperrt ? ' disabled' : '')
      + ' aria-pressed="' + (an ? 'true' : 'false') + '">'
      + '<span class="wahl-titel" data-karte="' + sicher(d.name) + '">' + sicher(d.name) + '</span>'
      + '<span class="wahl-unter">' + sicher(d.domaene)
      + (d.kartentyp ? ' · ' + sicher(d.kartentyp) : '') + '</span>'
      + '<span class="wahl-werte"><span>'
      + sicher(kuerzen(String(d.regeltext || '').replace(/<[^>]+>/g, ' '), 150))
      + '</span></span></button>';
  }).join('')));
  return t.join('');
}

/* ------------------------------------------------------------------ *
 * Der Wegweiser
 * ------------------------------------------------------------------ */

const BAUER = {
  1: schritt1, 2: schritt2, 3: schritt3, 4: schritt4, 5: schritt5,
  6: (z) => schritt6(z), 7: (z) => schritt7(z), 8: schritt8, 9: (z) => schritt9(z),
};

export function schrittZeichnen(nummer, zustand, kataloge) {
  const bauer = BAUER[nummer];
  return bauer ? bauer(zustand, kataloge) : '';
}
