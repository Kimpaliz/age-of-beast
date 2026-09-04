/* ===================================================================
   Age-of-Beast-Wiki – Weltdaten, Anmeldung und Speichern (Fassung 3.0.0)
   -------------------------------------------------------------------
   Die Welt liegt in Firestore, im Firebase-Projekt `kampagnenrahmen-jt`.
   Angemeldet wird mit dem Google-Konto.

   Was sich gegenüber Fassung 2 geändert hat und warum

   Vorher lag die Welt als Datei im GitHub-Repository, und wer sie ändern
   wollte, brauchte einen selbst erzeugten GitHub-Schlüssel. Der Weg
   funktionierte — am 01.09.2026 wurde darüber gespeichert (Commit
   0f09f40) —, aber der Schlüssel blieb die Hürde: Er musste von Hand
   angelegt, richtig zugeschnitten und in den Browser kopiert werden, und
   das für jeden, der je mitschreiben soll.

   Ein Google-Knopf ging damals nicht: GitHub Pages liefert nur Dateien
   aus, es gibt dort keine Stelle, die eine Anmeldung nachprüfen könnte.
   Firebase ist genau diese Stelle. Die Regeln in `firestore.rules`
   entscheiden, wer schreiben darf — nicht der Browser.

   Drei Wege, drei Aufgaben:

   1. `daten/welt.js` liegt weiterhin im Repository und wird sofort
      angezeigt. Kein Warten, kein leerer Bildschirm, und das Wiki
      funktioniert auch, wenn Firebase gerade nicht erreichbar ist.
   2. Firestore wird danach abgefragt und ersetzt die Anzeige, sobald
      etwas Neueres da ist. Das läuft ohne Anmeldung und ohne fremdes
      Skript über die REST-Schnittstelle.
   3. Erst zum Bearbeiten wird das Firebase-SDK geladen.

   Gespeichert heisst jetzt veröffentlicht. Das Warten auf den
   Seitenbau von GitHub Pages entfällt.
   =================================================================== */

import { weltDateien } from './werkzeuge/welt-dateien.mjs';
import { inTiefeSetzen } from './werkzeuge/bearbeiten-stellen.mjs';
import { bearbeitungskontextErstellen } from './bearbeiten-kontext.js';
import { bearbeitenEinrichten } from './texte-bearbeiten.js';
import { strukturEinrichten } from './struktur-bedienung.js';
import { rahmenAssistentEinrichten } from './rahmen-assistent.js';
import { ADMIN_EMAIL } from './firebase-konfig.js';
import {
  standLesen,
  weltLesen,
  anmelden as firebaseAnmelden,
  abmelden as firebaseAbmelden,
  beiKontoWechsel,
  darfSchreiben,
  zugangAnfragen,
  weltSchreiben,
} from './werkzeuge/firestore-speicher.mjs';

/** Merkt sich nur, dass zuletzt angemeldet war – niemals ein Geheimnis.
    Firebase stellt die Anmeldung selbst wieder her; dieser Eintrag
    verhindert bloss, dass beim Start unnötig das SDK geladen wird. */
const ANMELDE_MERKER = 'age-of-beast-angemeldet';

/** Ablage eines früheren GitHub-Schlüssels. Wird nur noch aufgeräumt. */
const ALTE_SCHLUESSEL_ABLAGE = 'age-of-beast-schluessel';

let konto = null;
let darfBearbeiten = false;

/** Der zuletzt geholte Weltstand im Quellformat – die Wahrheit. */
let rohStand = null;
/** Je Dokument der gelesene Stand, um gleichzeitige Änderungen zu erkennen. */
let staende = new Map();
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

function quelleAnzeigen(text, kennzeichen) {
  document.documentElement.dataset.quelle = kennzeichen;
  const feld = document.getElementById('kopf-quelle');
  if (feld) feld.textContent = text;
}

/* ------------------------------------------------------------------ *
 * Die Welt holen — ohne Anmeldung
 * ------------------------------------------------------------------ */

/** Zwischenspeicher der zuletzt geholten Welt, im Browser dieses Besuchers. */
const WELT_ABLAGE = 'age-of-beast-welt';

/**
 * Holt die Welt aus Firestore und zeichnet sie.
 *
 * Der Standabruf davor ist kein Geiz, sondern Rücksicht: Ein voller
 * Abruf sind neun Lesevorgänge, ein Standabruf einer. Der kostenlose
 * Firebase-Tarif zählt Lesevorgänge.
 *
 * Verglichen wird gegen den **im Browser gemerkten** Stand, nicht gegen
 * `daten/welt.js`. Das ist der springende Punkt: Die mitgelieferte Datei
 * ändert sich nur bei einer Veröffentlichung des Repositories, während
 * hier laufend gespeichert wird. Ein Vergleich gegen sie schlüge deshalb
 * fast immer fehl und spärte nichts.
 */
async function weltAusFirestoreHolen({ erzwingen = false } = {}) {
  try {
    const gemerkt = erzwingen ? null : zwischenspeicherLesen();
    if (gemerkt) {
      const stand = await standLesen();
      if (stand && stand === gemerkt.stand) {
        rohStand = gemerkt.quelle;
        staende = new Map(gemerkt.staende);
        if (weltNeuZeichnen(false)) {
          quelleAnzeigen('aktueller Stand', 'live');
          return true;
        }
      }
    }

    const { quelle, staende: gelesen } = await weltLesen();
    rohStand = quelle;
    staende = gelesen;
    if (!weltNeuZeichnen(false)) return false;
    zwischenspeicherSchreiben();
    quelleAnzeigen('aktueller Stand', 'live');
    return true;
  } catch (fehler) {
    // Ein Fehler hier darf das Wiki nicht lahmlegen: Die mitgelieferte
    // Kopie steht ja schon auf dem Bildschirm. Nur wer bearbeiten will,
    // muss es erfahren.
    if (konto) melden(fehler.message || 'Die Weltdaten ließen sich nicht laden.', 'fehler');
    quelleAnzeigen('gespeicherter Stand', 'datei');
    return false;
  }
}

function zwischenspeicherLesen() {
  try {
    const roh = localStorage.getItem(WELT_ABLAGE);
    if (!roh) return null;
    const abgelegt = JSON.parse(roh);
    if (!abgelegt?.stand || !abgelegt?.quelle || !Array.isArray(abgelegt.staende)) return null;
    return abgelegt;
  } catch {
    // Beschädigt oder gesperrt: dann eben der volle Abruf.
    return null;
  }
}

function zwischenspeicherSchreiben() {
  try {
    const stand = staende.get('_stand') ?? null;
    if (!stand || !rohStand) return;
    localStorage.setItem(WELT_ABLAGE, JSON.stringify({
      stand,
      quelle: rohStand,
      staende: [...staende.entries()],
    }));
  } catch {
    // Voller oder gesperrter Speicher ist kein Grund zum Abbrechen –
    // es wird dann eben jedes Mal voll geladen.
  }
}

/**
 * Baut aus dem gehaltenen Rohstand die Wiki-Fassung und zeichnet sie.
 *
 * @param {boolean} stelleHalten  Nach dem Speichern nicht nach oben springen
 */
function weltNeuZeichnen(stelleHalten) {
  if (!rohStand) return false;
  const { welt } = weltDateien(rohStand);
  const runtime = runtimeHolen();
  return Boolean(runtime && runtime.weltSetzen(welt, stelleHalten));
}

/** Liest den Runtime-Host bei jedem Zugriff neu, statt ihn einzufrieren. */
function runtimeHolen() {
  return window.ageOfBeast || null;
}

/* ------------------------------------------------------------------ *
 * An- und Abmelden
 * ------------------------------------------------------------------ */

async function anmelden() {
  melden('Anmeldefenster wird geöffnet …', 'laedt');
  try {
    await firebaseAnmelden();
    // Wie es weitergeht, entscheidet `kontoUebernehmen` – es wird von
    // Firebase mit dem neuen Konto aufgerufen.
    try { localStorage.setItem(ANMELDE_MERKER, '1'); } catch { /* egal */ }
  } catch (fehler) {
    melden(fehler.message || 'Die Anmeldung ist fehlgeschlagen.', 'fehler');
    knopfText('Anmelden', 'Mit dem Google-Konto anmelden, um zu bearbeiten');
  }
}

async function abmelden() {
  try { localStorage.removeItem(ANMELDE_MERKER); } catch { /* egal */ }
  await firebaseAbmelden().catch(() => {});
  location.reload();
}

/**
 * Wird bei jedem Wechsel des Anmeldezustands aufgerufen – auch beim
 * Start, wenn Firebase eine frühere Anmeldung wiederherstellt.
 */
async function kontoUebernehmen(neuesKonto) {
  konto = neuesKonto;

  if (!konto) {
    darfBearbeiten = false;
    knopfText('Anmelden', 'Mit dem Google-Konto anmelden, um zu bearbeiten');
    melden('', '');
    return;
  }

  knopfText('Abmelden', 'Abmelden, angemeldet als ' + konto.email);

  const freigabe = await darfSchreiben(konto);
  darfBearbeiten = freigabe.erlaubt;

  if (!darfBearbeiten) {
    await zugangMelden();
    return;
  }

  melden('Weltstand wird geholt …', 'laedt');
  await weltAusFirestoreHolen({ erzwingen: true });
  melden('', 'angemeldet');
  bearbeitenAnbieten();
}

/**
 * Sagt einem angemeldeten, aber nicht freigeschalteten Konto, woran es
 * liegt – und legt genau eine Anfrage an.
 *
 * Ohne das sähe es wie ein Fehler aus: angemeldet, aber kein Stift.
 */
async function zugangMelden() {
  if (konto.email === ADMIN_EMAIL && !konto.bestaetigt) {
    melden('Diese Google-Adresse ist noch nicht bestätigt.', 'fehler');
    return;
  }
  try {
    const status = await zugangAnfragen(konto);
    melden(
      status === 'offen'
        ? 'Angemeldet als ' + konto.email + '. Zum Bearbeiten fehlt noch die Freigabe.'
        : 'Angemeldet. Der Zugang steht auf „' + status + '".',
      'fehler',
    );
  } catch {
    melden('Angemeldet als ' + konto.email + ', aber ohne Recht zum Bearbeiten.', 'fehler');
  }
}

/* ------------------------------------------------------------------ *
 * Bearbeiten
 * ------------------------------------------------------------------ */

function bearbeitenAnbieten() {
  if (bearbeitenBereit) return;

  const kontext = bearbeitungskontextErstellen({
    rohStand: () => rohStand,
    schreiben,
    neuZeichnen: () => weltNeuZeichnen(true),
    melden,
    runtimeHolen,
  });

  bearbeitenBereit = true;

  // Zwei Bedienungen am selben Eintrag: Stifte fuer die Texte, Leisten fuer
  // den Aufbau. Sie kennen einander nicht und teilen sich nur den Schalter.
  bearbeitenEinrichten(kontext);
  strukturEinrichten(kontext);
  rahmenAssistentEinrichten(kontext);
}

/**
 * Trägt Änderungen ein und speichert sie.
 *
 * Die Änderungen werden zuerst auf einer **Kopie** ausgeführt. Erst wenn
 * Firestore bestätigt hat, wird die Kopie übernommen. Schlägt das
 * Speichern fehl, bleibt der angezeigte Stand also unberührt – sonst
 * zeigte das Wiki etwas, das nirgends gespeichert ist.
 *
 * @param {Object<string,string>} aenderungen  Pfad -> neuer Wert
 * @param {string} beschreibung                für die Rückmeldung
 */
async function schreiben(aenderungen, beschreibung) {
  if (!rohStand) {
    throw new Error('Es liegt kein Weltstand vor. Bitte lade die Seite neu.');
  }
  if (!darfBearbeiten || !konto) {
    throw new Error('Zum Speichern fehlt die Freigabe.');
  }

  const kopie = structuredClone(rohStand);

  for (const [pfad, wert] of Object.entries(aenderungen)) {
    if (!inTiefeSetzen(kopie, pfad, wert)) {
      throw new Error('Die Stelle „' + pfad + '" gibt es nicht mehr. Bitte die Seite neu laden.');
    }
  }

  const ergebnis = await weltSchreiben({
    vorher: rohStand,
    nachher: kopie,
    staende,
    konto,
  });

  rohStand = kopie;
  staende = ergebnis.staende;
  // Sonst läge im Browser ein alter Stand mit neuer Kennung – der nächste
  // Besuch zeigte dann die Änderung nicht an.
  zwischenspeicherSchreiben();

  const teile = ergebnis.geschrieben.filter((n) => !n.startsWith('_'));
  melden(
    ergebnis.geschrieben.length
      ? 'Gespeichert und veröffentlicht' + (teile.length ? ' (' + teile.join(', ') + ')' : '') + '.'
      : 'Nichts zu speichern – der Text war unverändert.',
    'angemeldet',
  );
  setTimeout(() => melden('', 'angemeldet'), 6000);

  return { kurz: beschreibung || 'gespeichert', geschrieben: ergebnis.geschrieben };
}

/* ------------------------------------------------------------------ *
 * Start
 * ------------------------------------------------------------------ */

/** Einen früher gespeicherten GitHub-Schlüssel restlos entfernen. */
function alteAblageLoeschen() {
  try { localStorage.removeItem(ALTE_SCHLUESSEL_ABLAGE); } catch { /* egal */ }
  try { sessionStorage.removeItem(ALTE_SCHLUESSEL_ABLAGE); } catch { /* egal */ }
}

function warAngemeldet() {
  try { return localStorage.getItem(ANMELDE_MERKER) === '1'; } catch { return false; }
}

alteAblageLoeschen();

if (knopf) {
  knopfText('Anmelden', 'Mit dem Google-Konto anmelden, um zu bearbeiten');
  knopf.hidden = false;
  knopf.addEventListener('click', () => {
    if (konto) abmelden();
    else anmelden();
  });
}

// Zuerst der öffentliche Weg: aktuelle Weltdaten ohne Anmeldung und ohne
// fremdes Skript. Fehlschläge sind hier stumm – die mitgelieferte Kopie
// steht bereits auf dem Bildschirm.
weltAusFirestoreHolen();

// War hier zuletzt jemand angemeldet, wird die Anmeldung wiederhergestellt.
// Ohne den Merker bliebe das SDK für alle anderen ungeladen.
if (warAngemeldet()) {
  beiKontoWechsel(kontoUebernehmen).catch(() => {
    melden('Die Anmeldung ließ sich nicht wiederherstellen.', 'fehler');
  });
} else if (knopf) {
  // Nach einem Klick auf „Anmelden" muss der Wechsel trotzdem beobachtet
  // werden – das übernimmt `anmelden()` über denselben Weg.
  knopf.addEventListener('click', function einmal() {
    knopf.removeEventListener('click', einmal);
    beiKontoWechsel(kontoUebernehmen).catch(() => {});
  }, { once: true });
}
