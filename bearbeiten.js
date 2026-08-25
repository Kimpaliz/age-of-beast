/* ===================================================================
   Age-of-Beast-Wiki – Anmeldung und Speichern (Fassung 2.0.0)
   -------------------------------------------------------------------
   Das Wiki kommt ohne Server und ohne Datenbankanbieter aus. Die Welt
   liegt als Datei `daten/quelle.json` im GitHub-Repository, und dort
   wird auch gespeichert. Jede Änderung ist ein Commit: mit Geschichte,
   mit Urheber, jederzeit rücknehmbar.

   Ohne Anmeldung zeigt das Wiki die Kopie aus `daten/welt.js`. Sie liegt
   im Repository, lädt sofort und braucht kein Internet.

   Mit Schlüssel holt dieses Modul den aktuellen Stand direkt aus dem
   Repository — also auch das, was noch nicht veröffentlicht ist — und
   schaltet das Bearbeiten frei.

   -------------------------------------------------------------------
   Warum ein Schlüssel und kein Anmeldeknopf

   GitHub Pages liefert nur Dateien aus. Dort läuft kein Programm, das ein
   Geheimnis verwahren könnte, und es gibt niemanden, der prüfen würde, ob
   ein Anmeldeknopf wirklich gedrückt wurde. Ein Knopf wäre also reine
   Verzierung; wer die Daten ändern darf, entscheidet allein der Schlüssel.

   Deshalb sollte er eng zugeschnitten sein: nur dieses eine Repository,
   nur „Contents: Read and write". Dann kann er nichts anderes anfassen.
   =================================================================== */

import { weltDateien, QUELLE } from './werkzeuge/welt-dateien.mjs';
import { inTiefeSetzen } from './werkzeuge/bearbeiten-stellen.mjs';
import { bearbeitenEinrichten } from './texte-bearbeiten.js';
import { strukturEinrichten } from './struktur-bedienung.js';
import {
  REPO,
  schluesselPruefen,
  dateiLesen,
  dateienSchreiben,
  veroeffentlichungStand,
} from './werkzeuge/github-speicher.mjs';

/** Wo der Schlüssel im Browser liegt. Nur auf diesem Gerät, nur für diese Seite. */
const SCHLUESSEL_ABLAGE = 'age-of-beast-schluessel';

/** Adresse, unter der sich ein passender Schlüssel erzeugen lässt. */
const SCHLUESSEL_ADRESSE = 'https://github.com/settings/personal-access-tokens/new';

let schluessel = null;
let konto = null;

/** Der zuletzt geholte Weltstand im Quellformat – die Wahrheit. */
let rohStand = null;
/** Kennung genau dieses Inhalts, um gleichzeitige Änderungen zu erkennen. */
let quelleSha = null;
/** Die Bearbeitungsansicht wird nur einmal eingerichtet. */
let bearbeitenBereit = false;

/* ------------------------------------------------------------------ *
 * Anzeige im Kopf
 * ------------------------------------------------------------------ */

const knopf = document.getElementById('anmelde-knopf');
const anzeige = document.getElementById('anmelde-status');

function melden(text, zustand) {
  if (anzeige) {
    anzeige.textContent = text || '';
    anzeige.hidden = !text;
    anzeige.dataset.zustand = zustand || '';
  }
  if (knopf) knopf.dataset.zustand = zustand || '';
}

function knopfText(text, beschriftung) {
  if (!knopf) return;
  knopf.textContent = text;
  knopf.setAttribute('aria-label', beschriftung || text);
}

/* ------------------------------------------------------------------ *
 * Der Schlüssel-Dialog
 * ------------------------------------------------------------------ */

/**
 * Fragt den Schlüssel ab. Der Dialog wird erst gebaut, wenn er gebraucht
 * wird – Besucher ohne Anmeldung bekommen ihn nie zu sehen.
 *
 * @returns {Promise<string|null>} der eingegebene Schlüssel oder `null`
 */
function schluesselAbfragen() {
  return new Promise((fertig) => {
    const huelle = document.createElement('div');
    huelle.className = 'schluessel-huelle';
    huelle.innerHTML = `
      <div class="schluessel-kasten" role="dialog" aria-modal="true" aria-labelledby="schluessel-titel">
        <h2 id="schluessel-titel">Zum Bearbeiten anmelden</h2>
        <p class="schluessel-text">
          Das Wiki speichert direkt in dein GitHub-Repository
          <code>${REPO.besitzer}/${REPO.name}</code>. Dafür braucht es einmalig
          einen Schlüssel. Er bleibt nur auf diesem Gerät.
        </p>
        <ol class="schluessel-schritte">
          <li><a href="${SCHLUESSEL_ADRESSE}" target="_blank" rel="noopener">Schlüssel bei GitHub erzeugen</a> (öffnet einen neuen Tab)</li>
          <li>Bei <em>Repository access</em>: <strong>Only select repositories</strong> → <code>${REPO.name}</code></li>
          <li>Bei <em>Permissions</em> → <em>Repository permissions</em>: <strong>Contents</strong> auf <strong>Read and write</strong></li>
          <li>Erzeugen, kopieren und hier einfügen</li>
        </ol>
        <label class="schluessel-beschriftung" for="schluessel-feld">Schlüssel</label>
        <input type="password" id="schluessel-feld" class="schluessel-feld"
               autocomplete="off" spellcheck="false" placeholder="github_pat_…">
        <p class="schluessel-hinweis">
          Der Schlüssel darf nur Dateien in diesem einen Repository ändern.
          Käme er abhanden, könnte damit niemand an dein Konto, deine anderen
          Repositories oder irgendwelche Zahlungsdaten. Jede Änderung wäre
          zudem ein Commit, den du zurücknehmen kannst. Widerrufen lässt er
          sich jederzeit in den GitHub-Einstellungen.
        </p>
        <div class="schluessel-knoepfe">
          <button type="button" class="schluessel-ok">Anmelden</button>
          <button type="button" class="schluessel-abbruch">Abbrechen</button>
          <span class="schluessel-meldung" role="status"></span>
        </div>
      </div>`;

    document.body.append(huelle);
    const feld = huelle.querySelector('#schluessel-feld');
    const meldung = huelle.querySelector('.schluessel-meldung');
    feld.focus();

    const schliessen = (wert) => { huelle.remove(); fertig(wert); };

    huelle.querySelector('.schluessel-ok').addEventListener('click', () => {
      const wert = feld.value.trim();
      if (!wert) {
        meldung.textContent = 'Bitte den Schlüssel einfügen.';
        meldung.dataset.zustand = 'fehler';
        feld.focus();
        return;
      }
      schliessen(wert);
    });

    huelle.querySelector('.schluessel-abbruch').addEventListener('click', () => schliessen(null));
    huelle.addEventListener('click', (e) => { if (e.target === huelle) schliessen(null); });
    huelle.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') schliessen(null);
      if (e.key === 'Enter' && e.target === feld) huelle.querySelector('.schluessel-ok').click();
    });
  });
}

/* ------------------------------------------------------------------ *
 * An- und Abmelden
 * ------------------------------------------------------------------ */

async function anmelden() {
  let wert = schluesselLesen();
  if (!wert) {
    wert = await schluesselAbfragen();
    if (!wert) return false;
  }

  melden('Schlüssel wird geprüft …', 'laedt');
  try {
    const ergebnis = await schluesselPruefen(wert);
    schluessel = wert;
    konto = ergebnis.konto;
    schluesselSchreiben(wert);
  } catch (fehler) {
    schluesselLoeschen();
    melden(fehler.message || 'Der Schlüssel wurde nicht anerkannt.', 'fehler');
    knopfText('Anmelden', 'Zum Bearbeiten mit einem GitHub-Schlüssel anmelden');
    return false;
  }

  return liveLaden();
}

async function abmelden() {
  schluesselLoeschen();
  location.reload();
}

function schluesselLesen() {
  try { return localStorage.getItem(SCHLUESSEL_ABLAGE) || null; } catch { return null; }
}
function schluesselSchreiben(wert) {
  try { localStorage.setItem(SCHLUESSEL_ABLAGE, wert); } catch { /* egal */ }
}
function schluesselLoeschen() {
  schluessel = null;
  konto = null;
  try { localStorage.removeItem(SCHLUESSEL_ABLAGE); } catch { /* egal */ }
}

/* ------------------------------------------------------------------ *
 * Live-Stand holen und anzeigen
 * ------------------------------------------------------------------ */

async function liveLaden() {
  melden('Weltstand wird geholt …', 'laedt');
  try {
    const datei = await dateiLesen(schluessel, QUELLE);
    rohStand = JSON.parse(datei.text);
    quelleSha = datei.sha;
  } catch (fehler) {
    melden(fehler.message || 'Der Weltstand ließ sich nicht holen.', 'fehler');
    return false;
  }

  if (!weltNeuZeichnen(false)) {
    melden('Der Weltstand ließ sich nicht anzeigen.', 'fehler');
    return false;
  }

  document.documentElement.dataset.quelle = 'live';
  const quelle = document.getElementById('kopf-quelle');
  if (quelle) quelle.textContent = 'live aus GitHub';
  knopfText('Abmelden', 'Abmelden, angemeldet als ' + konto);
  melden('', 'angemeldet');

  bearbeitenAnbieten();
  return true;
}

/**
 * Baut aus dem gehaltenen Rohstand die Wiki-Fassung und zeichnet sie.
 *
 * @param {boolean} stelleHalten  Nach dem Speichern nicht nach oben springen
 */
function weltNeuZeichnen(stelleHalten) {
  if (!rohStand) return false;
  const { welt } = weltDateien(rohStand);
  return Boolean(window.ageOfBeast && window.ageOfBeast.weltSetzen(welt, stelleHalten));
}

/* ------------------------------------------------------------------ *
 * Speichern
 * ------------------------------------------------------------------ */

function bearbeitenAnbieten() {
  if (bearbeitenBereit) return;
  bearbeitenBereit = true;

  const werkzeug = {
    rohStand: () => rohStand,
    schreiben,
    neuZeichnen: () => weltNeuZeichnen(true),
  };

  // Zwei Bedienungen am selben Eintrag: Stifte fuer die Texte, Leisten fuer
  // den Aufbau. Sie kennen einander nicht und teilen sich nur den Schalter.
  bearbeitenEinrichten(werkzeug);
  strukturEinrichten(werkzeug);
}

/**
 * Trägt Änderungen ein und legt sie als einen Commit ab.
 *
 * Die Änderungen werden zuerst auf einer **Kopie** ausgeführt. Erst wenn
 * GitHub den Commit bestätigt hat, wird die Kopie übernommen. Schlägt das
 * Speichern fehl, bleibt der angezeigte Stand also unberührt – sonst zeigte
 * das Wiki etwas, das nirgends gespeichert ist.
 *
 * @param {Object<string,string>} aenderungen  Pfad -> neuer Wert
 * @param {string} beschreibung                für die Commit-Nachricht
 */
async function schreiben(aenderungen, beschreibung) {
  const kopie = structuredClone(rohStand);

  for (const [pfad, wert] of Object.entries(aenderungen)) {
    if (!inTiefeSetzen(kopie, pfad, wert)) {
      throw new Error('Die Stelle „' + pfad + '" gibt es nicht mehr. Bitte die Seite neu laden.');
    }
  }

  const { dateien } = weltDateien(kopie);
  const ergebnis = await dateienSchreiben(schluessel, {
    dateien,
    nachricht: beschreibung || 'Wiki: Text geändert',
    erwarteteSha: quelleSha,
    erwartetePfad: QUELLE,
  });

  rohStand = kopie;
  quelleSha = null; // wird gleich frisch geholt
  try {
    const datei = await dateiLesen(schluessel, QUELLE);
    quelleSha = datei.sha;
  } catch { /* nicht schlimm; beim nächsten Speichern wird ohne Vergleich geschrieben */ }

  veroeffentlichungMelden(ergebnis);
}

/**
 * Sagt Bescheid, wann die öffentliche Seite den neuen Stand zeigt.
 *
 * Gespeichert ist sofort – aber GitHub Pages baut die Seite neu, und das
 * dauert etwa eine Minute. Ohne diesen Hinweis sähe es nach einem Fehler
 * aus, wenn die Änderung auf dem Handy noch nicht da ist.
 */
function veroeffentlichungMelden(ergebnis) {
  melden('Gespeichert (' + ergebnis.kurz + '). Wird veröffentlicht …', 'laedt');

  let versuche = 0;
  const nachsehen = async () => {
    versuche += 1;
    const stand = await veroeffentlichungStand(schluessel, ergebnis.commit);

    if (stand.zustand === 'fertig') {
      melden('Veröffentlicht. Die Seite ist überall aktuell.', 'angemeldet');
      setTimeout(() => melden('', 'angemeldet'), 6000);
      return;
    }
    if (stand.zustand === 'fehlgeschlagen') {
      melden('Gespeichert, aber das Veröffentlichen ist fehlgeschlagen.', 'fehler');
      return;
    }
    if (versuche >= 20) {
      melden('Gespeichert. Das Veröffentlichen dauert gerade länger.', 'angemeldet');
      return;
    }
    setTimeout(nachsehen, 5000);
  };

  setTimeout(nachsehen, 5000);
}

/* ------------------------------------------------------------------ *
 * Start
 * ------------------------------------------------------------------ */

if (knopf) {
  knopfText('Anmelden', 'Zum Bearbeiten mit einem GitHub-Schlüssel anmelden');
  knopf.hidden = false;
  knopf.addEventListener('click', () => {
    if (schluessel) abmelden();
    else anmelden();
  });
}

// Liegt hier schon ein Schlüssel, wird die Sitzung stillschweigend fortgesetzt.
if (schluesselLesen()) anmelden();
