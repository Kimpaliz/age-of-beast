/* ===================================================================
   Age of Beast — das Hauptmenü
   [Aufgabe: Rahmen]

   -------------------------------------------------------------------
   Hier landet man zuerst: Wikis öffnen oder ein neues anlegen.

   **Ohne Anmeldung ist die Seite nicht leer.** Wer nur lesen will, sieht
   die öffentlichen Wikis und kommt mit einem Klick hinein. Eine
   Anmeldeschranke davor würde die Besucheransicht zerstören, für die es
   das Wiki überhaupt gibt — geschützt sind die Inhalte durch die
   Firestore-Regeln, nicht durch diese Seite.

   **Angemeldet kommen zwei Dinge dazu:** die eigenen Wikis und das
   Anlegen. Beides braucht den Anmeldetoken, weil die Regeln eine
   Abfrage nur durchlassen, wenn sie sich auf die eigene Kennung
   beschränkt.

   **Ein neues Wiki löst keinen Deploy aus.** Das ist die tragende
   Entwurfsentscheidung; warum, steht in `docs/PLATTFORM.md`.

   Arbeitet zusammen mit: `werkzeuge/plattform-speicher.mjs` (Daten),
   `werkzeuge/firestore-speicher.mjs` (Anmeldung).
   =================================================================== */

import {
  oeffentlicheWikis, meineWikis, wikiAnlegen, kennungAus, KENNUNG_MUSTER,
} from '../werkzeuge/plattform-speicher.mjs';
import { anmelden, abmelden, beiKontoWechsel } from '../werkzeuge/firestore-speicher.mjs';

/* Ein Regelwerk ist ein Paket aus Daten und Vorlagen, kein Programm —
   ein zweites soll ein Eintrag sein, kein Umbau. */
const REGELWERKE = [
  {
    schluessel: 'daggerheart',
    name: 'Daggerheart',
    beschreibung: '393 Karten, 123 Gegenstände und der Charakterbogen.',
  },
];

const teile = {
  meldung: document.getElementById('menue-meldung'),
  abschnittMeine: document.getElementById('abschnitt-meine'),
  listeMeine: document.getElementById('liste-meine'),
  listeOffen: document.getElementById('liste-offen'),
  abschnittAnlegen: document.getElementById('abschnitt-anlegen'),
  form: document.getElementById('wiki-form'),
  name: document.getElementById('wiki-name'),
  kennung: document.getElementById('wiki-kennung'),
  beschreibung: document.getElementById('wiki-beschreibung'),
  oeffentlich: document.getElementById('wiki-oeffentlich'),
  regelwerke: document.getElementById('regelwerk-wahl'),
  anlegenKnopf: document.getElementById('wiki-anlegen'),
  formMeldung: document.getElementById('form-meldung'),
  anmeldeKnopf: document.getElementById('anmelde-knopf'),
  anmeldeStatus: document.getElementById('anmelde-status'),
  themaKnopf: document.getElementById('thema-knopf'),
};

let konto = null;

function sicher(t) {
  return String(t ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function melde(text, art) {
  if (!teile.meldung) return;
  if (!text) { teile.meldung.hidden = true; return; }
  teile.meldung.hidden = false;
  teile.meldung.className = 'hinweis' + (art ? ' ' + art : '');
  teile.meldung.innerHTML = text;
}

/* ------------------------------------------------------------------ *
 * Wikis anzeigen
 * ------------------------------------------------------------------ */

function kachel(w, rolle) {
  const regelwerke = (w.regelwerke || [])
    .map((r) => (REGELWERKE.find((x) => x.schluessel === r) || {}).name || r);
  return '<a class="wiki-kachel" href="wiki.html?w=' + encodeURIComponent(w.kennung) + '">'
    + '<span class="wiki-kachel-kopf">'
    + '<span class="wiki-kachel-name">' + sicher(w.name) + '</span>'
    + (rolle ? '<span class="wiki-rolle">' + sicher(rolle) + '</span>' : '')
    + (w.oeffentlich ? '<span class="wiki-marke offen">öffentlich</span>' : '')
    + '</span>'
    + (w.beschreibung ? '<span class="wiki-kachel-text">' + sicher(w.beschreibung) + '</span>' : '')
    + (regelwerke.length
      ? '<span class="wiki-regelwerke">' + regelwerke.map((r) =>
        '<span class="regelwerk-marke">' + sicher(r) + '</span>').join('') + '</span>'
      : '')
    + '</a>';
}

function leerText(text) {
  return '<p class="liste-leer">' + text + '</p>';
}

async function listenFuellen() {
  /* Die öffentlichen Wikis gehen ohne Anmeldung — deshalb zuerst und
     unabhängig davon, ob der zweite Abruf gelingt. */
  try {
    const offen = await oeffentlicheWikis();
    teile.listeOffen.innerHTML = offen.length
      ? offen.map((w) => kachel(w, null)).join('')
      : leerText('Es ist noch kein Wiki öffentlich gestellt.');
  } catch (fehler) {
    teile.listeOffen.innerHTML = leerText(
      'Die öffentlichen Wikis liessen sich nicht laden: ' + sicher(fehler.message));
  }

  if (!konto) {
    teile.abschnittMeine.hidden = true;
    teile.abschnittAnlegen.hidden = true;
    return;
  }

  teile.abschnittAnlegen.hidden = false;
  teile.abschnittMeine.hidden = false;
  try {
    const meine = await meineWikis(konto.uid);
    teile.listeMeine.innerHTML = meine.length
      ? meine.map((w) => kachel(w, (w.rollen || {})[konto.uid])).join('')
      : leerText('Du bist noch in keinem Wiki eingetragen. Leg unten eins an.');
  } catch (fehler) {
    teile.listeMeine.innerHTML = leerText(
      'Deine Wikis liessen sich nicht laden: ' + sicher(fehler.message));
  }
}

/* ------------------------------------------------------------------ *
 * Anmeldung
 * ------------------------------------------------------------------ */

function kontoAnzeigen() {
  if (konto) {
    teile.anmeldeStatus.hidden = false;
    teile.anmeldeStatus.textContent = konto.name || konto.email || 'angemeldet';
    teile.anmeldeKnopf.textContent = 'Abmelden';
  } else {
    teile.anmeldeStatus.hidden = true;
    teile.anmeldeKnopf.textContent = 'Anmelden';
  }
}

teile.anmeldeKnopf?.addEventListener('click', async () => {
  teile.anmeldeKnopf.disabled = true;
  try {
    if (konto) {
      await abmelden();
      spurSetzen(false);
    } else {
      /* Beim ersten Mal gibt es noch keinen Horcher — er wird hier
         gestartet und meldet danach jede Aenderung von selbst. */
      await kontoHorchen();
      await anmelden();
      spurSetzen(true);
    }
    melde('');
  } catch (fehler) {
    /* Ein blockiertes Popup ist der häufigste Fall und sieht sonst aus,
       als sei gar nichts passiert. */
    melde('<strong>Die Anmeldung hat nicht geklappt.</strong><br>'
      + sicher(fehler.message)
      + (/popup/i.test(fehler.message || '')
        ? '<br>Dein Browser hat vermutlich das Anmeldefenster blockiert.'
        : ''), 'warnung');
  } finally {
    teile.anmeldeKnopf.disabled = false;
  }
});

/* ------------------------------------------------------------------ *
 * Anlegen
 * ------------------------------------------------------------------ */

function regelwerkeZeichnen() {
  teile.regelwerke.innerHTML = REGELWERKE.map((r) =>
    '<label class="regelwerk-feld">'
    + '<input type="checkbox" value="' + sicher(r.schluessel) + '">'
    + '<span><span class="regelwerk-name">' + sicher(r.name) + '</span>'
    + '<small>' + sicher(r.beschreibung) + '</small></span>'
    + '</label>').join('');
}

/* Die Kennung entsteht sichtbar aus dem Namen. Sonst überrascht sie
   später in der Adresse. */
teile.name?.addEventListener('input', () => {
  const k = kennungAus(teile.name.value);
  teile.kennung.textContent = k
    ? (KENNUNG_MUSTER.test(k)
      ? 'Adresse: wiki.html?w=' + k
      : 'Aus diesem Namen lässt sich keine Adresse bilden.')
    : 'Die Adresse ergibt sich aus dem Namen.';
});

teile.form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  teile.formMeldung.textContent = '';
  teile.anlegenKnopf.disabled = true;
  try {
    const regelwerke = [...teile.regelwerke.querySelectorAll('input:checked')]
      .map((i) => i.value);
    const kennung = await wikiAnlegen({
      name: teile.name.value,
      beschreibung: teile.beschreibung.value,
      oeffentlich: teile.oeffentlich.checked,
      regelwerke,
      konto,
    });
    teile.formMeldung.textContent = 'Angelegt.';
    teile.form.reset();
    teile.kennung.textContent = 'Die Adresse ergibt sich aus dem Namen.';
    await listenFuellen();
    location.href = 'wiki.html?w=' + encodeURIComponent(kennung);
  } catch (fehler) {
    teile.formMeldung.textContent = fehler.message;
  } finally {
    teile.anlegenKnopf.disabled = false;
  }
});

/* ------------------------------------------------------------------ *
 * Hell und dunkel
 * ------------------------------------------------------------------ */

const THEMA = 'aob.thema';
function themaSetzen(wert) {
  if (wert === 'hell') document.documentElement.dataset.thema = 'hell';
  else delete document.documentElement.dataset.thema;
  try { localStorage.setItem(THEMA, wert); } catch (e) { /* privates Fenster */ }
}
try {
  const gemerkt = localStorage.getItem(THEMA);
  if (gemerkt) themaSetzen(gemerkt);
} catch (e) { /* privates Fenster */ }
teile.themaKnopf?.addEventListener('click', () => {
  themaSetzen(document.documentElement.dataset.thema === 'hell' ? 'dunkel' : 'hell');
});

/* ------------------------------------------------------------------ *
 * Start
 * ------------------------------------------------------------------ */

regelwerkeZeichnen();
listenFuellen();

/* ⚠️ **Das Firebase-SDK wird nur geladen, wenn es gebraucht wird.**

   `beiKontoWechsel()` zieht `firebase-app`, `-auth` und `-firestore`
   nach — drei fremde Skripte von gstatic. Ruft man es beim Seitenaufbau
   auf, laedt sie **jeder Besucher**, auch wer sich nie anmeldet. Genau
   das vermeidet die Leseansicht des Wikis seit dem 02.09.2026
   sorgfaeltig, und das Hauptmenue haette es gleich wieder eingerissen.

   Woher weiss die Seite ohne SDK, ob jemand angemeldet ist? Gar nicht —
   die Sitzung liegt in einer IndexedDB, die nur das SDK versteht.
   Deshalb merkt sich der Browser eine **Spur**: Wer sich hier einmal
   angemeldet hat, bekommt das SDK beim naechsten Besuch von selbst;
   wer noch nie angemeldet war, klickt einmal auf „Anmelden“. Der
   schlimmste Fall ist also ein zusaetzlicher Klick, und der trifft nur
   den ersten Besuch.

   Die Spur ist bewusst **kein Sicherheitsmerkmal**: Sie sagt nur „hier
   wurde schon einmal angemeldet“. Wer wirklich angemeldet ist,
   entscheidet allein Firebase. */
const SPUR = 'aob.angemeldet';

function spurSetzen(an) {
  try {
    if (an) localStorage.setItem(SPUR, '1');
    else localStorage.removeItem(SPUR);
  } catch (e) { /* privates Fenster */ }
}

function spurVorhanden() {
  try { return localStorage.getItem(SPUR) === '1'; } catch (e) { return false; }
}

let horcherLaeuft = false;

async function kontoHorchen() {
  if (horcherLaeuft) return;
  horcherLaeuft = true;
  try {
    await beiKontoWechsel((neuesKonto) => {
      konto = neuesKonto;
      spurSetzen(Boolean(neuesKonto));
      kontoAnzeigen();
      listenFuellen();
    });
  } catch (fehler) {
    horcherLaeuft = false;
    melde('<strong>Die Anmeldung ist gerade nicht erreichbar.</strong><br>'
      + 'Öffentliche Wikis kannst du trotzdem lesen. <small>'
      + sicher(fehler.message) + '</small>', 'warnung');
  }
}

/* Nur wer schon einmal angemeldet war, bekommt das SDK ungefragt. */
if (spurVorhanden()) kontoHorchen();
