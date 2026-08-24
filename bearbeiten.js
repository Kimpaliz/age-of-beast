/* ===================================================================
   Age-of-Beast-Wiki – Anmeldung und Live-Daten
   -------------------------------------------------------------------
   Ohne Anmeldung zeigt das Wiki die feste Kopie aus daten/welt.js.
   Sie liegt im Repository, laedt sofort und braucht kein Internet.

   Meldet sich Jannik mit seinem Google-Konto an, holt dieses Modul den
   aktuellen Stand direkt aus der Weltenschmiede, wandelt ihn mit
   werkzeuge/welt-umwandeln.mjs in dasselbe Format um und reicht ihn an
   das Wiki weiter. Angezeigt wird dann der Live-Stand.

   Wichtig zur Sicherheit: Die Pruefung auf die Adresse hier im Browser
   ist reine Bequemlichkeit fuer die Anzeige. Verbindlich gesperrt wird
   in den Regeln der Realtime Database. Dort ist Lesen und Schreiben auf
   ein bestaetigtes Google-Konto mit genau dieser Adresse beschraenkt.
   Wer die Datei hier veraendert, kommt trotzdem an keine Daten.
   =================================================================== */

import { umwandeln } from './werkzeuge/welt-umwandeln.mjs';

const SDK = 'https://www.gstatic.com/firebasejs/12.16.0/';

const KONFIG = {
  projectId: 'kampagnenrahmen-jt',
  appId: '1:971944384167:web:94518864ee402fa6f96d82',
  databaseURL: 'https://kampagnenrahmen-jt-default-rtdb.europe-west1.firebasedatabase.app',
  storageBucket: 'kampagnenrahmen-jt.firebasestorage.app',
  apiKey: 'AIzaSyAJ8dXU-Jzn_8JK-Jb4Qw-r-butAQnTlYE',
  authDomain: 'kampagnenrahmen-jt.web.app',
  messagingSenderId: '971944384167',
};

/** Nur dieses Konto darf lesen und schreiben. Ebenso in den DB-Regeln hinterlegt. */
const KONTO = 'kimpaliz1989@gmail.com';

/** Wo der Weltstand in der Datenbank liegt. Der Schluessel traegt aus */
/** historischen Gruenden noch den alten Projektnamen. */
const PROJEKT_PFAD = 'rooms/project-sturmwende-20260730/project';

/** Merker, damit Besucher ohne Anmeldung das Firebase-SDK nie laden. */
const MERKER = 'age-of-beast-angemeldet';

let dienste = null;
let abmeldenMoeglich = false;

/* ------------------------------------------------------------------ *
 * Anzeige
 * ------------------------------------------------------------------ */

const knopf = document.getElementById('anmelde-knopf');
const anzeige = document.getElementById('anmelde-status');

function melden(text, zustand) {
  if (anzeige) {
    anzeige.textContent = text || '';
    anzeige.hidden = !text;
  }
  if (knopf) knopf.dataset.zustand = zustand || '';
}

function knopfText(text, beschriftung) {
  if (!knopf) return;
  knopf.textContent = text;
  knopf.setAttribute('aria-label', beschriftung || text);
}

/* ------------------------------------------------------------------ *
 * Firebase erst laden, wenn es wirklich gebraucht wird
 * ------------------------------------------------------------------ */

async function firebaseLaden() {
  if (dienste) return dienste;
  melden('Anmeldung wird geladen …', 'laedt');

  const [appModul, authModul, dbModul] = await Promise.all([
    import(SDK + 'firebase-app.js'),
    import(SDK + 'firebase-auth.js'),
    import(SDK + 'firebase-database.js'),
  ]);

  const app = appModul.initializeApp(KONFIG);
  dienste = {
    auth: authModul.getAuth(app),
    db: dbModul.getDatabase(app),
    anbieter: new authModul.GoogleAuthProvider(),
    anmeldenMitFenster: authModul.signInWithPopup,
    abmelden: authModul.signOut,
    beobachten: authModul.onAuthStateChanged,
    verweis: dbModul.ref,
    einmalLesen: dbModul.get,
  };
  return dienste;
}

/* ------------------------------------------------------------------ *
 * Live-Stand holen und anzeigen
 * ------------------------------------------------------------------ */

async function liveLaden() {
  const d = await dienste;
  melden('Weltstand wird geholt …', 'laedt');

  const schnappschuss = await d.einmalLesen(d.verweis(d.db, PROJEKT_PFAD));
  if (!schnappschuss.exists()) {
    melden('In der Weltenschmiede wurde nichts gefunden.', 'fehler');
    return false;
  }

  const { welt } = umwandeln(schnappschuss.val());
  const angekommen = window.ageOfBeast && window.ageOfBeast.weltSetzen(welt);
  if (!angekommen) {
    melden('Der Weltstand liess sich nicht anzeigen.', 'fehler');
    return false;
  }

  document.documentElement.dataset.quelle = 'live';
  const quelle = document.getElementById('kopf-quelle');
  if (quelle) quelle.textContent = 'live aus der Weltenschmiede';
  melden('', 'angemeldet');
  return true;
}

/* ------------------------------------------------------------------ *
 * An- und Abmelden
 * ------------------------------------------------------------------ */

async function anmelden() {
  try {
    const d = await firebaseLaden();
    dienste = d;
    const ergebnis = await d.anmeldenMitFenster(d.auth, d.anbieter);
    await nachAnmeldung(ergebnis.user);
  } catch (fehler) {
    const code = (fehler && fehler.code) || '';
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      melden('', '');
      return;
    }
    melden('Anmeldung fehlgeschlagen: ' + (fehler && fehler.message ? fehler.message : code), 'fehler');
  }
}

async function nachAnmeldung(nutzer) {
  if (!nutzer) return;
  const adresse = (nutzer.email || '').toLowerCase();

  if (adresse !== KONTO) {
    melden('Dieses Konto darf nicht bearbeiten.', 'fehler');
    await dienste.abmelden(dienste.auth);
    try { localStorage.removeItem(MERKER); } catch (e) { /* egal */ }
    knopfText('Anmelden', 'Zum Bearbeiten mit Google anmelden');
    abmeldenMoeglich = false;
    return;
  }

  try { localStorage.setItem(MERKER, 'ja'); } catch (e) { /* egal */ }
  abmeldenMoeglich = true;
  knopfText('Abmelden', 'Abmelden, angemeldet als ' + adresse);
  await liveLaden();
}

async function abmelden() {
  try { localStorage.removeItem(MERKER); } catch (e) { /* egal */ }
  if (dienste) await dienste.abmelden(dienste.auth);
  location.reload();
}

/* ------------------------------------------------------------------ *
 * Start
 * ------------------------------------------------------------------ */

if (knopf) {
  knopfText('Anmelden', 'Zum Bearbeiten mit Google anmelden');
  knopf.hidden = false;
  knopf.addEventListener('click', () => {
    if (abmeldenMoeglich) abmelden();
    else anmelden();
  });
}

// War beim letzten Mal jemand angemeldet? Dann Sitzung fortsetzen.
let warAngemeldet = false;
try { warAngemeldet = localStorage.getItem(MERKER) === 'ja'; } catch (e) { /* egal */ }

if (warAngemeldet) {
  firebaseLaden()
    .then((d) => {
      d.beobachten(d.auth, (nutzer) => {
        if (nutzer) nachAnmeldung(nutzer);
        else melden('', '');
      });
    })
    .catch(() => melden('Die Anmeldung liess sich nicht laden.', 'fehler'));
}
