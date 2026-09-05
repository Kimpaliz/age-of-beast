/* ===================================================================
   Age of Beast — die Charaktererschaffung, Ablauf und Bedienung
   [Aufgabe: Charakterbogen]

   -------------------------------------------------------------------
   Janniks Frage vom 05.09.2026: „gibt es schon eine caracter erstellung
   für spieler die einen durch die erstellung begleitet für daggerheart?
   wenn nicht. dann bitte."

   Es gab keine. Diese Datei ist die Bedienung; die Regeln stehen in
   `werkzeuge/erschaffung-regeln.mjs` (ohne Browser, deshalb in Node
   nachrechenbar), die Formulare in `karte/erschaffung-schritte.js`.

   ── Drei Entscheidungen ─────────────────────────────────────────────

   **Man darf springen.** Der Regeltext sagt zu den neun Schritten
   ausdrücklich: „Frühere Entscheidungen dürfen angepasst werden,
   während die Figur Gestalt annimmt." Ein Assistent, der einen erst
   weiterlässt, wenn ein Schritt vollständig ist, widerspräche seiner
   eigenen Regel. Deshalb ist jeder Schritt jederzeit erreichbar, und
   was fehlt, steht daneben statt zu blockieren.

   **Es wird nach jeder Änderung gemerkt.** Eine Charaktererschaffung
   dauert; ein versehentlich geschlossener Tab darf sie nicht kosten.
   Gemerkt wird der Entwurf, nicht erst die fertige Figur.

   **Der Bogen wird nicht hier gezeichnet.** Am Ende entsteht genau die
   `spielwerte`-Form, die `karte/bogen-zeigen.js` ohnehin liest — und
   die Figur erscheint auf `bogen.html` neben den Weltfiguren. Ein
   zweiter Bogen im Assistenten wäre ein zweiter Bogen, der auseinander
   läuft.

   Arbeitet zusammen mit: `karte/figuren-eigen.js` (merkt die Figur),
   `karte/karten-daten.js` (Kataloge), `karte/kartenblase.js` (Karte
   beim Überfahren), `werkzeuge/pruefe-erschaffung.mjs`.
   =================================================================== */

import {
  fehltImSchritt, istVollstaendig, leererZustand, schritteLesen,
  standAllerSchritte, zuEintrag,
} from '../werkzeuge/erschaffung-regeln.mjs';
import { ladeKarten } from './karten-daten.js';
import { blasenAnbinden } from './kartenblase.js';
import { figurAblegen, speicherGehtOffenbar } from './figuren-eigen.js';
import { schrittZeichnen, sicher } from './erschaffung-schritte.js';

const ENTWURF = 'aob.erschaffung.v1';

const zielSchritte = document.getElementById('schrittleiste');
const zielInhalt = document.getElementById('schrittinhalt');
const zielFuss = document.getElementById('schrittfuss');
const zielMeldung = document.getElementById('erschaffungsmeldung');

let schritte = [];
let kataloge = { karten: [], gegenstaende: [], klassen: [] };
let zustand = leererZustand();
let aktuell = 1;

/* ------------------------------------------------------------------ *
 * Entwurf merken
 * ------------------------------------------------------------------ */

function entwurfLesen() {
  try {
    const roh = window.localStorage.getItem(ENTWURF);
    const gelesen = roh ? JSON.parse(roh) : null;
    return gelesen && typeof gelesen === 'object' ? { ...leererZustand(), ...gelesen } : null;
  } catch (fehler) {
    return null;
  }
}

function entwurfSchreiben() {
  try {
    window.localStorage.setItem(ENTWURF, JSON.stringify(zustand));
  } catch (fehler) {
    /* Nicht merken zu können ist unangenehm, darf aber die Eingabe
       nicht scheitern lassen. Der Hinweis dazu steht oben auf der
       Seite, einmal, statt bei jedem Tastendruck. */
  }
}

/* ------------------------------------------------------------------ *
 * Zeichnen
 * ------------------------------------------------------------------ */

function leisteZeichnen() {
  const stand = standAllerSchritte(zustand, kataloge);
  zielSchritte.innerHTML = schritte.map((s) => {
    const fertig = stand[s.nummer - 1].fertig;
    const an = s.nummer === aktuell;
    return '<button type="button" class="schrittknopf' + (an ? ' aktiv' : '')
      + (fertig ? ' fertig' : '') + '" data-schritt="' + s.nummer + '"'
      + ' aria-current="' + (an ? 'step' : 'false') + '">'
      + '<span class="schrittnummer" aria-hidden="true">' + s.nummer + '</span>'
      + '<span class="schrittname">' + sicher(s.titel) + '</span>'
      + '<span class="schrittmarke">' + (fertig ? 'fertig' : 'offen') + '</span>'
      + '</button>';
  }).join('');
}

function inhaltZeichnen() {
  const s = schritte[aktuell - 1];
  const fehlt = fehltImSchritt(aktuell, zustand, kataloge);

  const t = ['<div class="schritt-kopf">'];
  t.push('<span class="mikro">Schritt ' + aktuell + ' von 9</span>');
  t.push('<h2>' + sicher(s.titel) + '</h2>');
  /* Der Regeltext steht wörtlich da, nicht umformuliert. Er ist der
     Grund, warum der Schritt so aussieht — und im Zweifel gilt er,
     nicht meine Zusammenfassung. */
  t.push('<p class="schritt-regel">' + sicher(s.regel) + '</p>');
  t.push('<p class="schritt-quelle"><a href="wiki.html?w=age-of-beast#/eintrag/'
    + encodeURIComponent(s.eintragId) + '">Die Regel im Wiki nachlesen &rsaquo;</a></p>');
  t.push('</div>');

  t.push(fehlt.length
    ? '<ul class="schritt-fehlt">' + fehlt.map((f) => '<li>' + sicher(f) + '</li>').join('') + '</ul>'
    : '<p class="schritt-fertig">Dieser Schritt ist vollständig.</p>');

  t.push('<div class="schritt-koerper">' + schrittZeichnen(aktuell, zustand, kataloge) + '</div>');
  zielInhalt.innerHTML = t.join('');
  blasenAnbinden(zielInhalt);
}

function fussZeichnen() {
  const fertig = istVollstaendig(zustand, kataloge);
  const offen = standAllerSchritte(zustand, kataloge).filter((s) => !s.fertig).length;
  const t = [];
  t.push('<button type="button" class="modul-knopf" data-gehe="zurueck"'
    + (aktuell === 1 ? ' disabled' : '') + '>&lsaquo; Zurück</button>');
  t.push('<span class="fuss-mitte">' + (fertig
    ? 'Alle neun Schritte stehen.'
    : offen + ' von 9 Schritten noch offen') + '</span>');
  t.push('<button type="button" class="modul-knopf" data-gehe="weiter"'
    + (aktuell === 9 ? ' disabled' : '') + '>Weiter &rsaquo;</button>');
  t.push('<button type="button" class="modul-knopf betont" data-fertig="ja"'
    + (fertig ? '' : ' disabled title="Es fehlen noch Angaben"') + '>Bogen anlegen</button>');
  zielFuss.innerHTML = t.join('');
}

function allesZeichnen() {
  leisteZeichnen();
  inhaltZeichnen();
  fussZeichnen();
}

/* ------------------------------------------------------------------ *
 * Bedienung
 * ------------------------------------------------------------------ */

function aendern(aenderung) {
  Object.assign(zustand, aenderung);
  entwurfSchreiben();
  allesZeichnen();
}

function anbinden() {
  /* Ein Horcher für die ganze Seite statt einer je Knopf: Nach jedem
     Zeichnen entstehen die Knöpfe neu, und jede Neuverdrahtung wäre
     eine Gelegenheit, eine zu vergessen. */
  document.addEventListener('click', (e) => {
    const schrittknopf = e.target.closest('[data-schritt]');
    if (schrittknopf) {
      aktuell = Number(schrittknopf.dataset.schritt);
      allesZeichnen();
      zielInhalt.scrollIntoView({ block: 'start', behavior: 'smooth' });
      return;
    }

    const gehe = e.target.closest('[data-gehe]');
    if (gehe) {
      aktuell = Math.min(9, Math.max(1, aktuell + (gehe.dataset.gehe === 'weiter' ? 1 : -1)));
      allesZeichnen();
      return;
    }

    const wahl = e.target.closest('[data-wahl]');
    if (wahl) {
      const feld = wahl.dataset.wahl;
      const wert = wahl.dataset.wert || null;
      const neu = { [feld]: zustand[feld] === wert ? null : wert };
      /* Eine neue Klasse macht Unterklasse, Klassengegenstand und
         Domänenkarten ungültig — sie gehören zur alten. Sie stehen zu
         lassen wäre der stillste Weg zu einer Figur, die es nicht
         geben darf. */
      if (feld === 'klasse' && wert !== zustand.klasse) {
        neu.unterklasse = null;
        neu.klassengegenstand = null;
        neu.domaenenkarten = [];
      }
      aendern(neu);
      return;
    }

    const eig = e.target.closest('[data-eigenschaft]');
    if (eig) {
      const schluessel = eig.dataset.eigenschaft;
      const punkte = Number(eig.dataset.punkte);
      const eigenschaften = { ...zustand.eigenschaften };
      if (eigenschaften[schluessel] === punkte) delete eigenschaften[schluessel];
      else eigenschaften[schluessel] = punkte;
      aendern({ eigenschaften });
      return;
    }

    const karte = e.target.closest('[data-domaenenkarte]');
    if (karte) {
      const name = karte.dataset.domaenenkarte;
      const liste = [...(zustand.domaenenkarten || [])];
      const i = liste.indexOf(name);
      if (i >= 0) liste.splice(i, 1);
      else if (liste.length < 2) liste.push(name);
      aendern({ domaenenkarten: liste });
      return;
    }

    if (e.target.closest('[data-fertig]')) anlegen();
  });

  /* Texteingaben: gemerkt wird bei jedem Zeichen, **neu gezeichnet
     wird nicht**. Ein Neuzeichnen bei jedem Tastendruck nähme das Feld
     unter dem Finger weg. Die Leiste zieht beim Verlassen nach. */
  document.addEventListener('input', (e) => {
    const feld = e.target.closest('[data-feld]');
    if (feld) {
      zustand[feld.dataset.feld] = e.target.value;
      entwurfSchreiben();
      return;
    }
    const erf = e.target.closest('[data-erfahrung]');
    if (erf) {
      const liste = [...(zustand.erfahrungen || ['', ''])];
      liste[Number(erf.dataset.erfahrung)] = e.target.value;
      zustand.erfahrungen = liste;
      entwurfSchreiben();
    }
  });

  document.addEventListener('change', (e) => {
    if (e.target.closest('[data-feld]') || e.target.closest('[data-erfahrung]')) {
      leisteZeichnen();
      fussZeichnen();
    }
  });
}

/* ------------------------------------------------------------------ *
 * Anlegen
 * ------------------------------------------------------------------ */

function anlegen() {
  if (!istVollstaendig(zustand, kataloge)) return;
  const eintrag = zuEintrag(zustand, kataloge);
  const ging = figurAblegen(eintrag);

  zielMeldung.hidden = false;
  zielMeldung.className = 'hinweis ' + (ging ? 'gut' : 'warnung');
  zielMeldung.innerHTML = ging
    ? '<strong>' + sicher(eintrag.name) + ' ist angelegt.</strong><br>'
      + 'Der Bogen liegt auf diesem Gerät und steht ab sofort in der Auswahlleiste. '
      + '<a class="modul-knopf" href="bogen.html?figur=' + encodeURIComponent(eintrag.id)
      + '">Bogen ansehen &rsaquo;</a>'
    : '<strong>Der Bogen ließ sich nicht merken.</strong><br>'
      + 'Dieser Browser erlaubt keinen Speicher für die Seite (privates Fenster oder '
      + 'gesperrte Website-Daten). Die Angaben stehen noch da — schreib sie ab, '
      + 'bevor du die Seite schließt.';
  zielMeldung.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

/* ------------------------------------------------------------------ *
 * Start
 * ------------------------------------------------------------------ */

async function starten() {
  const welt = window.AGE_OF_BEAST_WELT;
  try {
    schritte = schritteLesen(welt);
  } catch (grund) {
    zielMeldung.hidden = false;
    zielMeldung.className = 'hinweis warnung';
    zielMeldung.innerHTML = '<strong>Die Schritte konnten nicht gelesen werden.</strong><br>'
      + sicher(grund.message) + '<br>Der Assistent folgt dem Regeleintrag im Wiki; '
      + 'ohne ihn würde er sich Schritte ausdenken, und das tut er nicht.';
    return;
  }

  const geladen = await ladeKarten().catch(() => null);
  const klassen = await fetch(new URL('../daten/daggerheart-klassen.json', import.meta.url))
    .then((a) => (a.ok ? a.json() : null)).catch(() => null);

  kataloge = {
    karten: geladen ? geladen.alle.filter((k) => k.quelleTyp === 'karte') : [],
    gegenstaende: geladen ? geladen.alle.filter((k) => k.quelleTyp === 'gegenstand') : [],
    klassen: klassen?.klassen || [],
  };

  if (!kataloge.klassen.length || !kataloge.karten.length) {
    zielMeldung.hidden = false;
    zielMeldung.className = 'hinweis warnung';
    zielMeldung.innerHTML = '<strong>Die Regelkataloge fehlen.</strong><br>'
      + 'Ohne Klassen, Karten und Ausrüstung kann der Assistent nichts zur Wahl stellen.';
    return;
  }

  if (!speicherGehtOffenbar()) {
    zielMeldung.hidden = false;
    zielMeldung.className = 'hinweis warnung';
    zielMeldung.innerHTML = '<strong>Dieser Browser merkt sich nichts.</strong><br>'
      + 'Privates Fenster oder gesperrte Website-Daten: Der Entwurf überlebt kein Neuladen.';
  }

  zustand = entwurfLesen() || leererZustand();
  anbinden();
  allesZeichnen();
}

starten();
