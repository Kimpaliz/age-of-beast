/* ===================================================================
   Age of Beast — die Werte des Bogens rechnen, zeigen und umschalten
   [Aufgabe: Charakterbogen]

   -------------------------------------------------------------------
   Janniks Wunsch vom 04.09.2026, wörtlich: „Die Charakterbögen, die
   Werte wie Stress, HP, Rüstung usw. sollen sich automatisch ändern
   beim An- oder Ablegen von Items. Und beim Drüberhalten wird angezeigt,
   was Grundwert und was Bonus oder Malus ist und wodurch es verursacht
   wird."

   Dieses Modul ist die **Bedienung** dazu. Gerechnet wird nicht hier,
   sondern in `werkzeuge/werte-rechnen.mjs` — dort ohne DOM, damit
   `werkzeuge/pruefe-werte.mjs` es in Node an den echten Bogendaten
   nachrechnen kann. Was hier steht, ist nur: Zeichnen, Umschalten,
   Merken.

   ── Drei Entscheidungen ─────────────────────────────────────────────

   **Der Bogen wird erst gezeichnet, wenn der Gegenstandskatalog da
   ist.** Sonst stünde einen Moment lang eine Zahl da, die sich gleich
   darauf ändert — bei Brix von 14 auf 13, weil die Wirkung des Dolchs
   verspätet ankommt. Eine Zahl, die von selbst springt, ist am
   Spieltisch schlimmer als eine, die kurz auf sich warten lässt.

   **Die Herleitung benutzt dieselbe Blase wie die Karten.** Ein zweites
   Kästchen mit eigener Platzierung, eigener Tastaturbedienung und
   eigenem Escape wäre nicht nur doppelte Arbeit — beide könnten
   gleichzeitig offen stehen und sich überdecken. `kartenblase.js` kann
   seit dem 05.09.2026 auch fertigen Inhalt annehmen.

   **Abgelegt wird je Gerät gemerkt, nicht in den Weltdaten.** Was
   gerade getragen wird, ist ein Spielzustand am Tisch und keine
   Aussage über die Figur. Die Weltdaten bleiben unangetastet; damit
   braucht dieser Schritt auch keine Datenfreigabe.

   Arbeitet zusammen mit: `karte/bogen-zeigen.js` (ruft die Bausteine),
   `karte/karten-daten.js` (Gegenstände), `karte/kartenblase.js`
   (Herleitung), `werkzeuge/werte-rechnen.mjs` (die Rechnung).
   =================================================================== */

import { bogenAusDaten, herleitung } from '../werkzeuge/werte-rechnen.mjs';
import { ladeKarten, namensKern } from './karten-daten.js';
import { blaseAnbinden, blasenAnbinden } from './kartenblase.js';

const SCHLUESSEL = 'aob.ausruestung.v1';

function sicher(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function mod(n) {
  if (n === null || n === undefined) return '—';
  if (n > 0) return '+' + n;
  if (n < 0) return '−' + Math.abs(n);
  return '0';
}

/* ------------------------------------------------------------------ *
 * Was gerade getragen wird — je Gerät gemerkt
 * ------------------------------------------------------------------ */

/* `localStorage` kann **werfen** statt leer zu sein: privates Fenster,
   gesperrte Website-Daten, Vorschaubild-Aufnahme. Ohne diesen Fang
   bliebe der ganze Bogen leer. */
function alleZustaende() {
  try {
    const roh = window.localStorage.getItem(SCHLUESSEL);
    const gelesen = roh ? JSON.parse(roh) : null;
    return gelesen && typeof gelesen === 'object' ? gelesen : {};
  } catch (fehler) {
    return {};
  }
}

function zustandLesen(figurId) {
  const alles = alleZustaende();
  const meiner = alles[figurId];
  return meiner && typeof meiner === 'object' ? meiner : {};
}

function zustandSchreiben(figurId, angelegt) {
  try {
    const alles = alleZustaende();
    alles[figurId] = angelegt;
    window.localStorage.setItem(SCHLUESSEL, JSON.stringify(alles));
  } catch (fehler) {
    /* Nicht merken zu können ist unangenehm, aber kein Grund, das
       Umschalten selbst scheitern zu lassen. */
  }
}

/* ------------------------------------------------------------------ *
 * Der Katalog als Nachschlagewerk ohne Warten
 * ------------------------------------------------------------------ */

let katalog = null;

/**
 * Lädt den Gegenstandskatalog einmal und macht daraus eine **synchrone**
 * Suchfunktion. Die Rechnung darf nicht warten müssen: Sie läuft bei
 * jedem Klick, und ein `await` mitten im Umschalten würde die Reihenfolge
 * zweier schneller Klicks umkehren können.
 */
export async function katalogLaden() {
  if (katalog) return katalog;
  const { nachName } = await ladeKarten();
  katalog = (name) => nachName.get(namensKern(name)) || null;
  return katalog;
}

/* ------------------------------------------------------------------ *
 * Rechnen
 * ------------------------------------------------------------------ */

/**
 * Ein Rechner für **eine** Figur. Er hält den Umschaltzustand und gibt
 * bei jedem `rechne()` den vollständigen Bogen samt Herleitung zurück.
 */
export function rechnerFuer(figur) {
  const werte = figur.spielwerte || {};
  const angelegt = zustandLesen(figur.id);
  let letztes = null;

  const rechne = () => {
    letztes = bogenAusDaten(werte, katalog || (() => null), angelegt);
    return letztes;
  };

  return {
    rechne,
    ergebnis: () => letztes || rechne(),
    /** Schaltet ein Stück um und merkt sich das. */
    umschalten(schluessel) {
      const jetzt = letztes ? letztes.ausruestung.find((s) => s.schluessel === schluessel) : null;
      angelegt[schluessel] = !(jetzt ? jetzt.angelegt : true);
      zustandSchreiben(figur.id, angelegt);
      return rechne();
    },
    /** Alles wieder anlegen — der Zustand, den die Bogendaten beschreiben. */
    zuruecksetzen() {
      for (const k of Object.keys(angelegt)) delete angelegt[k];
      zustandSchreiben(figur.id, angelegt);
      return rechne();
    },
    etwasAbgelegt: () => Object.values(angelegt).some((v) => v === false),
  };
}

/* ------------------------------------------------------------------ *
 * Die Herleitung als Blaseninhalt
 * ------------------------------------------------------------------ */

/**
 * Genau das, was Jannik beim Drüberhalten sehen will: Grundwert, jeder
 * Beitrag, und wodurch er verursacht wird.
 *
 * Die Zeilen kommen aus `herleitung()` — also aus der Rechnung, nicht
 * aus der Anzeige. Damit lässt sich in Node prüfen, dass hier steht,
 * was gerechnet wurde.
 */
export function herleitungHtml(ergebnis) {
  const t = [];
  t.push('<article class="herleitung">');
  t.push('<header class="herleitung-kopf"><h3>' + sicher(ergebnis.name) + '</h3>'
    + '<strong class="herleitung-summe">' + ergebnis.endwert + '</strong></header>');
  t.push('<ul class="herleitung-liste">');
  t.push('<li class="h-grund"><span class="h-was">Grundwert</span>'
    + '<span class="h-zahl">' + ergebnis.grundwert + '</span>'
    + (ergebnis.grundQuelle ? '<span class="h-quelle">' + sicher(ergebnis.grundQuelle) + '</span>' : '')
    + '</li>');
  for (const b of ergebnis.beitraege) {
    t.push('<li class="h-beitrag ' + (b.delta > 0 ? 'plus' : 'minus') + '">'
      + '<span class="h-was">' + (b.delta > 0 ? 'Bonus' : 'Malus') + '</span>'
      + '<span class="h-zahl">' + mod(b.delta) + '</span>'
      + '<span class="h-quelle">durch ' + sicher(b.quelle || 'unbekannt')
      + (b.text ? ' <em>' + sicher(b.text) + '</em>' : '') + '</span></li>');
  }
  if (!ergebnis.beitraege.length) {
    t.push('<li class="h-leer">Keine Boni oder Mali aus der Ausrüstung.</li>');
  }
  t.push('</ul>');
  t.push('</article>');
  return t.join('');
}

/**
 * Macht eine Zahl zum Auslöser ihrer eigenen Herleitung.
 *
 * Der Bauer wird **nachgeschlagen statt eingefroren**: Nach einem
 * Umschalten soll die Blase den neuen Stand zeigen, nicht den von vor
 * dem Klick.
 */
function herleitungAnbinden(element, holeErgebnis) {
  element.classList.add('mit-herleitung');
  element.setAttribute('title', 'Herleitung anzeigen');
  blaseAnbinden(element, () => herleitungHtml(holeErgebnis()));
}

/* ------------------------------------------------------------------ *
 * Die vier Bereiche, die sich beim Umschalten ändern
 * ------------------------------------------------------------------ */

const ATTRIBUT_NAMEN = [
  ['agility', 'Agility', 'Beweglichkeit'],
  ['strength', 'Strength', 'Stärke'],
  ['finesse', 'Finesse', 'Fingerfertigkeit'],
  ['instinct', 'Instinct', 'Instinkt'],
  ['presence', 'Presence', 'Ausstrahlung'],
  ['knowledge', 'Knowledge', 'Wissen'],
];

export function attributeHtml(r) {
  const t = ['<div class="attribute">'];
  for (const [schluessel, en, de] of ATTRIBUT_NAMEN) {
    const w = r.werte[schluessel];
    const stark = w.endwert > 0;
    t.push('<div class="attribut' + (stark ? ' stark' : '')
      + (w.hatBeitraege ? ' veraendert' : '') + '">'
      + '<span class="attribut-wert" data-wert="' + schluessel + '" tabindex="0">'
      + mod(w.endwert) + '</span>'
      + '<span class="attribut-name">' + en + '</span>'
      + '<span class="attribut-de">' + de + '</span>'
      + '</div>');
  }
  return t.join('') + '</div>';
}

export function verteidigungHtml(r) {
  const ev = r.werte.evasion;
  const rs = r.werte.ruestungswert;
  const a = r.werte.schwelleSchwer.endwert;
  const b = r.werte.schwelleErnst.endwert;

  const t = ['<div class="verteidigung">'];
  t.push('<div class="schild' + (ev.hatBeitraege ? ' veraendert' : '') + '">'
    + '<span class="mikro">Ausweichen</span>'
    + '<strong data-wert="evasion" tabindex="0">' + ev.endwert + '</strong></div>');
  t.push('<div class="schild' + (rs.hatBeitraege ? ' veraendert' : '') + '">'
    + '<span class="mikro">Rüstung</span>'
    + '<strong data-wert="ruestungswert" tabindex="0">' + rs.endwert + '</strong>'
    + '<small>' + (rs.hatBeitraege
      ? sicher(rs.beitraege.map((x) => x.quelle).join(', '))
      : 'ohne Rüstung') + '</small></div>');
  t.push('</div>');

  /* Die Schwellen schlägt man am Tisch am häufigsten nach — deshalb als
     Balken mit den drei Bereichen statt als zwei nackte Zahlen. Unter
     der schweren Schwelle kostet ein Treffer 1 Lebenspunkt, dazwischen
     2, ab der ernsten 3.

     **Gerechnet, nicht abgeschrieben:** Die Regel lautet „Grundwert der
     Rüstung **plus eigene Stufe**". Wer den Kartenwert direkt überträgt,
     spielt auf jeder Stufe mit zu niedrigen Schwellen. */
  t.push('<div class="schwellen">');
  t.push('<div class="schwelle-bereich s1"><strong>1</strong><small>unter ' + a + '</small></div>');
  t.push('<div class="schwelle-marke" data-wert="schwelleSchwer" tabindex="0">' + a + '</div>');
  t.push('<div class="schwelle-bereich s2"><strong>2</strong><small>ab ' + a + '</small></div>');
  t.push('<div class="schwelle-marke" data-wert="schwelleErnst" tabindex="0">' + b + '</div>');
  t.push('<div class="schwelle-bereich s3"><strong>3</strong><small>ab ' + b + '</small></div>');
  t.push('</div>');
  t.push('<p class="schwellen-hinweis">Lebenspunkte je Treffer'
    + ' &middot; Zahl antippen zeigt, woraus sie entsteht</p>');
  return t.join('');
}

/* Eine Leiste aus Kästchen. `gefuellt` sind die bereits belegten. */
function leiste(anzahl, gefuellt, art) {
  if (!anzahl) return '<span class="offen">noch offen</span>';
  const voll = gefuellt || 0;
  let s = '<div class="leiste ' + art + '" role="img" aria-label="'
    + voll + ' von ' + anzahl + '">';
  for (let i = 0; i < anzahl; i += 1) {
    s += '<span class="kaestchen' + (i < voll ? ' voll' : '') + '"></span>';
  }
  return s + '</div>';
}

export function vorraeteHtml(r, w) {
  const t = ['<div class="vorraete">'];
  for (const [schluessel, beschriftung] of [['hp', 'Lebenspunkte'], ['stress', 'Stress']]) {
    const wert = r.werte[schluessel];
    t.push('<div class="vorrat' + (wert.hatBeitraege ? ' veraendert' : '') + '">'
      + '<span class="mikro">' + beschriftung
      + ' <b data-wert="' + schluessel + '" tabindex="0">' + wert.endwert + '</b></span>'
      + leiste(wert.endwert, 0, schluessel) + '</div>');
  }
  /* Hoffnung hängt an keiner Ausrüstung — sie kommt unverändert aus den
     Bogendaten und bekommt deshalb auch keine Herleitung. */
  const h = w.hoffnung || {};
  t.push('<div class="vorrat"><span class="mikro">Hoffnung'
    + (h.start === null || h.start === undefined ? '' : ' <small>Start ' + h.start + '</small>')
    + '</span>' + leiste(h.max, h.start, 'hoffnung') + '</div>');
  return t.join('') + '</div>';
}

/* ------------------------------------------------------------------ *
 * Die Ausrüstung selbst
 * ------------------------------------------------------------------ */

const ROLLENNAMEN = {
  waffe: 'Waffe',
  ruestung: 'Rüstung',
  klassengegenstand: 'Klassengegenstand',
};

function stueckZeile(s) {
  const t = [];
  t.push('<li class="stueck' + (s.angelegt ? '' : ' abgelegt') + '"'
    + ' data-stueck="' + sicher(s.schluessel) + '">');

  /* Die Beschriftung steht als `aria-label` am Knopf, **nicht** als
     versteckter Textknoten daneben. Ein weggeschnittener Text ist für
     ein Vorlesegerät dasselbe, für jede Farbmessung aber eine Zeile mit
     Kontrast 1:1 — der Bogenfarben-Wächter hat sie beim ersten Lauf zu
     Recht gemeldet. */
  t.push('<button type="button" class="stueck-schalter"'
    + ' aria-pressed="' + (s.angelegt ? 'true' : 'false') + '"'
    + ' aria-label="' + sicher(s.name) + (s.angelegt ? ' ablegen' : ' anlegen') + '"'
    + ' title="' + (s.angelegt ? 'Ablegen' : 'Anlegen') + '">'
    + '<span class="stueck-haken" aria-hidden="true"></span></button>');

  t.push('<div class="stueck-text">');
  t.push('<span class="mikro">' + sicher(s.hand ? s.hand + ' · Waffe'
    : ROLLENNAMEN[s.rolle] || s.rolle) + '</span>');
  t.push('<span class="karte-anker" data-karte="'
    + sicher(s.regelname || s.name) + '">' + sicher(s.name) + '</span>');

  /* Was das Stück zahlenmäßig bewirkt, steht direkt daneben. Ohne diese
     Zeile sähe eine Rüstung, die das Ausweichen senkt, wie ein
     Tippfehler im Bogen aus. */
  const teile = [];
  if (typeof s.score === 'number') teile.push('Rüstungswert ' + s.score);
  if (s.schwellen) teile.push('Schwellen ' + s.schwellen.schwer + '/' + s.schwellen.ernst);
  if (s.schaden) teile.push(s.schaden);
  if (s.merkmal) teile.push(s.merkmal + (s.wirkung ? ': ' + s.wirkung : ''));
  else if (s.wirkung) teile.push(s.wirkung);
  if (teile.length) t.push('<small>' + sicher(teile.join(' · ')) + '</small>');

  if (!s.imRegelwerk) {
    t.push('<small class="stueck-fremd">Steht in keinem geladenen Regelwerk —'
      + ' es wird nichts eingerechnet.</small>');
  }
  for (const a of s.abweichungen || []) {
    t.push('<small class="stueck-abweichung">' + sicher(a) + '</small>');
  }
  t.push('</div>');
  t.push('</li>');
  return t.join('');
}

export function ausruestungHtml(r) {
  if (!r.ausruestung.length) {
    return '<ul class="ausruestung"><li class="bogen-luecke">'
      + '<span class="offen">noch offen</span></li></ul>';
  }
  const t = ['<p class="ausruestung-hinweis">Antippen legt an oder ab. '
    + 'Die Werte oben rechnen sich sofort mit.</p>'];
  t.push('<ul class="ausruestung">');
  for (const s of r.ausruestung) t.push(stueckZeile(s));
  t.push('</ul>');

  /* Wirkungen, die keine Zahl sind, werden **gezeigt und nicht
     gerechnet**. Sie hängen an einer Entscheidung am Tisch; eine
     geratene Zahl wäre schlimmer als keine. */
  if (r.hinweise.length) {
    t.push('<ul class="wirkungshinweise">');
    for (const h of r.hinweise) {
      t.push('<li><strong>' + sicher(h.quelle) + '</strong> '
        + sicher(h.text) + '</li>');
    }
    t.push('</ul>');
    t.push('<p class="wirkungshinweise-fuss">Diese Wirkungen sind Spielregeln,'
      + ' keine Zahlen — sie werden bewusst nicht eingerechnet.</p>');
  }
  return t.join('');
}

/* ------------------------------------------------------------------ *
 * Verdrahten
 * ------------------------------------------------------------------ */

/**
 * Bindet Umschalter und Herleitungen an einen fertig gezeichneten Bogen.
 *
 * Beim Umschalten werden **nur die vier betroffenen Bereiche** neu
 * gezeichnet, nicht der ganze Bogen: Wer die Rüstung ablegt, soll nicht
 * seinen Blätterstand und den Fokus verlieren.
 */
export function bogenVerdrahten(bereich, rechner, figur) {
  const w = figur.spielwerte || {};

  const bereiche = {
    attribute: () => attributeHtml(rechner.ergebnis()),
    verteidigung: () => verteidigungHtml(rechner.ergebnis()),
    vorraete: () => vorraeteHtml(rechner.ergebnis(), w),
    ausruestung: () => ausruestungHtml(rechner.ergebnis()),
  };

  function anbinden() {
    /* Herleitung an jede Zahl, die aus der Rechnung kommt. */
    for (const el of bereich.querySelectorAll('[data-wert]:not([data-blase])')) {
      const schluessel = el.dataset.wert;
      herleitungAnbinden(el, () => rechner.ergebnis().werte[schluessel]);
    }
    /* Kartenblasen für neu entstandene Namen. */
    blasenAnbinden(bereich);

    for (const knopf of bereich.querySelectorAll('.stueck-schalter:not([data-verdrahtet])')) {
      knopf.dataset.verdrahtet = 'ja';
      knopf.addEventListener('click', () => {
        const zeile = knopf.closest('[data-stueck]');
        if (!zeile) return;
        rechner.umschalten(zeile.dataset.stueck);
        neuZeichnen();
      });
    }

    const zurueck = bereich.querySelector('.ausruestung-zuruecksetzen:not([data-verdrahtet])');
    if (zurueck) {
      zurueck.dataset.verdrahtet = 'ja';
      zurueck.addEventListener('click', () => { rechner.zuruecksetzen(); neuZeichnen(); });
    }
  }

  function neuZeichnen() {
    for (const [name, bauer] of Object.entries(bereiche)) {
      const ziel = bereich.querySelector('[data-bereich="' + name + '"]');
      if (ziel) ziel.innerHTML = bauer();
    }
    hinweisSetzen();
    anbinden();
  }

  /* Ist etwas abgelegt, sagt der Bogen das oben — sonst sucht man den
     Grund für eine Zahl, die nicht zum Blatt am Tisch passt. */
  function hinweisSetzen() {
    const platz = bereich.querySelector('[data-bereich="abgelegt-hinweis"]');
    if (!platz) return;
    platz.innerHTML = rechner.etwasAbgelegt()
      ? '<p class="abgelegt-hinweis">Ein Teil der Ausrüstung ist abgelegt —'
        + ' die Werte unterscheiden sich vom eingetragenen Bogen.'
        + ' <button type="button" class="ausruestung-zuruecksetzen">Alles anlegen</button></p>'
      : '';
  }

  hinweisSetzen();
  anbinden();
}
