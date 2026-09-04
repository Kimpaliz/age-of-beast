/* ===================================================================
   Age-of-Beast-Wiki – Weltdaten aus Firestore lesen und schreiben
   -------------------------------------------------------------------
   Zwei getrennte Wege, mit Absicht:

   **Lesen** geht über die REST-Schnittstelle von Firestore — ein
   gewöhnliches `fetch`. Kein SDK, kein fremdes Skript, keine
   Anmeldung. Wer das Wiki nur liest, lädt damit exakt so wenig wie
   vorher. Das ist der Grund für diesen Umweg: Die bequeme Lösung wäre,
   überall das SDK zu benutzen, aber dann zöge jeder Besucher rund ein
   halbes Megabyte fremden Code nach, nur um Text zu lesen.

   **Schreiben** geht über das Firebase-SDK, das erst beim Anmelden
   geladen wird. Es kümmert sich um das Anmeldetoken, das ständige
   Erneuern und die Fehlerfälle — das von Hand nachzubauen wäre
   fahrlässig.

   Die Aufteilung der Welt in Dokumente steckt vollständig in
   `firestore-format.mjs` und ist dort ohne Netz prüfbar.
   =================================================================== */

import { FIREBASE, SDK, ADMIN_EMAIL } from '../firebase-konfig.js';
import {
  SAMMLUNG,
  ZUGANG,
  STAND_DOKUMENT,
  ausDokumenten,
  inDokumente,
  dokumentZuPfad,
  karteAusListe,
  standAusAntwort,
  standErzeugen,
  sammlungsAdresse,
  dokumentAdresse,
} from './firestore-format.mjs';

/* ------------------------------------------------------------------ *
 * Lesen — ohne SDK, ohne Anmeldung
 * ------------------------------------------------------------------ */

/**
 * Holt den Standwert. Ein einziger Abruf, der die Frage beantwortet
 * „hat sich seit meinem letzten Besuch etwas geändert?". Ohne ihn
 * müsste das Wiki bei jedem Aufruf alle neun Dokumente laden.
 */
export async function standLesen() {
  const adresse = dokumentAdresse(FIREBASE.projectId, SAMMLUNG, STAND_DOKUMENT)
    + '?key=' + encodeURIComponent(FIREBASE.apiKey);
  const antwort = await fetch(adresse, { headers: { accept: 'application/json' } });
  if (antwort.status === 404) return null;
  if (!antwort.ok) throw new Error(await fehlertextLesen(antwort, 'Der Stand ließ sich nicht abfragen'));
  return standAusAntwort(await antwort.json());
}

/**
 * Holt die ganze Welt im Quellformat.
 * Liefert `{ quelle, staende }` — `staende` hält je Dokument den
 * Standwert, den ein späterer Schreibvorgang zum Vergleich braucht.
 */
export async function weltLesen() {
  const adresse = sammlungsAdresse(FIREBASE.projectId, SAMMLUNG, 300)
    + '&key=' + encodeURIComponent(FIREBASE.apiKey);
  const antwort = await fetch(adresse, { headers: { accept: 'application/json' } });
  if (!antwort.ok) throw new Error(await fehlertextLesen(antwort, 'Die Weltdaten ließen sich nicht laden'));

  const roh = await antwort.json();
  if (roh.nextPageToken) {
    // Bei neun Dokumenten kann das nicht vorkommen. Sollte es je passieren,
    // fehlte ein Teil der Welt — dann lieber laut abbrechen als still eine
    // halbe Welt anzeigen.
    throw new Error('Die Weltdaten passen nicht in eine Seite. Das Format muss angepasst werden.');
  }

  const karte = karteAusListe(roh);
  if (!karte.size) throw new Error('In Firestore liegen noch keine Weltdaten.');

  const staende = new Map();
  for (const dokument of roh.documents ?? []) {
    const name = String(dokument.name ?? '').split('/').pop();
    const stand = standAusAntwort(dokument);
    if (name) staende.set(name, stand);
  }

  return { quelle: ausDokumenten(karte), staende };
}

async function fehlertextLesen(antwort, einleitung) {
  let einzelheit = '';
  try {
    const inhalt = await antwort.json();
    einzelheit = inhalt?.error?.message || '';
  } catch { /* Antwort war kein JSON */ }
  if (antwort.status === 403) {
    return einleitung + ': Der Zugriff wurde abgelehnt. '
      + 'Vermutlich fehlen die Firestore-Regeln für das Wiki.';
  }
  return einleitung + ' (' + antwort.status + ')' + (einzelheit ? ': ' + einzelheit : '') + '.';
}

/* ------------------------------------------------------------------ *
 * Anmelden — SDK erst hier
 * ------------------------------------------------------------------ */

let verbindung = null;
let verbindungsVersuch = null;

/* Auch `plattform-speicher.mjs` braucht die Verbindung — deshalb
   exportiert. Die Funktion baut sie hoechstens einmal auf und merkt sie
   sich; ein zweiter Aufrufer bekommt dieselbe. */
export async function verbinden() {
  if (verbindung) return verbindung;
  if (verbindungsVersuch) return verbindungsVersuch;

  verbindungsVersuch = (async () => {
    const [app, auth, store] = await Promise.all([
      import(`${SDK}/firebase-app.js`),
      import(`${SDK}/firebase-auth.js`),
      import(`${SDK}/firebase-firestore.js`),
    ]);
    const anwendung = app.initializeApp(FIREBASE, 'age-of-beast-wiki');
    verbindung = {
      auth: auth.getAuth(anwendung),
      db: store.getFirestore(anwendung),
      authModul: auth,
      storeModul: store,
    };
    return verbindung;
  })();

  try {
    return await verbindungsVersuch;
  } finally {
    verbindungsVersuch = null;
  }
}

/**
 * Meldet mit einem Google-Konto an.
 *
 * Warum ein Popup und keine Weiterleitung: Die Weiterleitung verlässt
 * die Seite und kehrt zurück — jeder ungespeicherte Text wäre weg.
 * Blockiert der Browser das Popup, wird das ausdrücklich gemeldet,
 * statt still nichts zu tun.
 */
export async function anmelden() {
  const { auth, authModul } = await verbinden();
  const anbieter = new authModul.GoogleAuthProvider();
  // Auch bei nur einem Konto die Auswahl zeigen: Sonst landet man
  // stillschweigend im zuletzt benutzten Google-Konto.
  anbieter.setCustomParameters({ prompt: 'select_account' });

  try {
    const ergebnis = await authModul.signInWithPopup(auth, anbieter);
    return kontoAus(ergebnis.user);
  } catch (fehler) {
    throw new Error(anmeldeFehlerText(fehler));
  }
}

function anmeldeFehlerText(fehler) {
  const code = fehler?.code || '';
  if (code === 'auth/popup-blocked') {
    return 'Der Browser hat das Anmeldefenster blockiert. Bitte Popups für diese Seite erlauben.';
  }
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return 'Die Anmeldung wurde abgebrochen.';
  }
  if (code === 'auth/unauthorized-domain') {
    return 'Diese Adresse ist bei Firebase nicht als Anmeldeort eingetragen.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Keine Verbindung zu Google. Bitte Netzwerk prüfen.';
  }
  return fehler?.message || 'Die Anmeldung ist fehlgeschlagen.';
}

export async function abmelden() {
  if (!verbindung) return;
  await verbindung.authModul.signOut(verbindung.auth);
}

/**
 * Ruft `rueckruf` mit dem Konto auf, sobald der Anmeldezustand
 * feststeht — und erneut bei jedem Wechsel. Firebase stellt eine
 * frühere Anmeldung selbst wieder her; ohne diesen Weg müsste man
 * sich nach jedem Neuladen erneut anmelden.
 */
export async function beiKontoWechsel(rueckruf) {
  const { auth, authModul } = await verbinden();
  return authModul.onAuthStateChanged(auth, (nutzer) => rueckruf(nutzer ? kontoAus(nutzer) : null));
}

function kontoAus(nutzer) {
  return {
    uid: nutzer.uid,
    email: nutzer.email || '',
    name: nutzer.displayName || nutzer.email || 'Unbekannt',
    bestaetigt: Boolean(nutzer.emailVerified),
  };
}

/* ------------------------------------------------------------------ *
 * Freigabe
 * ------------------------------------------------------------------ */

/**
 * Darf dieses Konto schreiben?
 *
 * Die Antwort ist hier nur die **Anzeige**. Entschieden wird sie in
 * `firestore.rules`: Eine veränderte Browserseite kann sich den Knopf
 * freischalten, aber keinen Schreibvorgang durchsetzen.
 */
export async function darfSchreiben(konto) {
  if (!konto) return { erlaubt: false, grund: 'nicht angemeldet' };

  /* Der Verwalter zuerst, und zwar ohne Umweg über die Freigabeliste:
     Für ihn gibt es dort keinen Eintrag, und `istWikiAdmin()` in den
     Regeln fragt ebenfalls nur die Adresse ab. Ohne diesen Zweig wäre
     ausgerechnet der Verwalter der einzige, der sich anmelden kann und
     trotzdem keinen Stift bekommt. */
  if (konto.bestaetigt && konto.email === ADMIN_EMAIL) {
    return { erlaubt: true, grund: 'Verwalter' };
  }

  const { db, storeModul } = await verbinden();
  try {
    const eintrag = await storeModul.getDoc(storeModul.doc(db, ZUGANG, konto.uid));
    if (eintrag.exists() && eintrag.data()?.status === 'bestaetigt') {
      return { erlaubt: true, grund: 'freigeschaltet' };
    }
  } catch {
    // Kein Leserecht auf den eigenen Eintrag heisst: nicht freigeschaltet.
  }
  return { erlaubt: false, grund: 'nicht freigeschaltet' };
}

/**
 * Legt einmalig eine Anfrage an. Mehr kann ein nicht freigeschaltetes
 * Konto nicht tun — die Regeln lassen genau dieses eine Dokument zu,
 * und auch das nur mit der eigenen Kennung.
 */
export async function zugangAnfragen(konto) {
  const { db, storeModul } = await verbinden();
  const stelle = storeModul.doc(db, ZUGANG, konto.uid);
  const vorhanden = await storeModul.getDoc(stelle).catch(() => null);
  if (vorhanden?.exists()) return vorhanden.data()?.status || 'offen';

  await storeModul.setDoc(stelle, {
    konto: konto.uid,
    email: konto.email,
    name: konto.name,
    status: 'offen',
    angefragtAm: storeModul.serverTimestamp(),
  });
  return 'offen';
}

/* ------------------------------------------------------------------ *
 * Schreiben
 * ------------------------------------------------------------------ */

/**
 * Schreibt die geänderten Teile der Welt.
 *
 * Geschrieben werden **nur** die Dokumente, deren Inhalt sich wirklich
 * geändert hat. Eine Textänderung an einer Spezies berührt damit ein
 * Dokument statt neun.
 *
 * Der Schutz gegen gleichzeitiges Bearbeiten liegt in der Transaktion:
 * Sie liest die betroffenen Dokumente noch einmal und bricht ab, wenn
 * ihr Stand nicht mehr der ist, auf dem die Änderung beruht. Ohne das
 * würde der zweite Speichervorgang die Arbeit des ersten stillschweigend
 * überschreiben.
 *
 * @param {Object} auftrag
 * @param {Object} auftrag.vorher     Quelle, auf der die Änderung beruht
 * @param {Object} auftrag.nachher    Quelle mit der Änderung
 * @param {Map}    auftrag.staende    Dokumentname -> gelesener Stand
 * @param {Object} auftrag.konto      angemeldetes Konto
 * @returns {Promise<{geschrieben: string[], staende: Map}>}
 */
export async function weltSchreiben({ vorher, nachher, staende, konto }) {
  if (!konto?.uid) throw new Error('Zum Speichern ist eine Anmeldung nötig.');

  const alteDokumente = new Map(inDokumente(vorher).map((d) => [d.name, d.inhalt]));
  const neueDokumente = inDokumente(nachher);

  const zuSchreiben = neueDokumente.filter((d) => alteDokumente.get(d.name) !== d.inhalt);
  if (!zuSchreiben.length) return { geschrieben: [], staende };

  const { db, storeModul } = await verbinden();
  const neueStaende = new Map(staende);
  const gemeinsamerStand = standErzeugen(Date.now(), Math.random());

  await storeModul.runTransaction(db, async (vorgang) => {
    // Erst alles lesen, dann alles schreiben — Firestore verlangt diese
    // Reihenfolge innerhalb einer Transaktion.
    for (const dokument of zuSchreiben) {
      const stelle = storeModul.doc(db, SAMMLUNG, dokument.name);
      const jetzt = await vorgang.get(stelle);
      const standJetzt = jetzt.exists() ? (jetzt.data()?.stand ?? null) : null;
      const standErwartet = staende.get(dokument.name) ?? null;
      if (standJetzt !== standErwartet) {
        throw new Error(
          'Der Eintrag „' + dokument.name + '" wurde inzwischen an anderer Stelle geändert. '
          + 'Bitte lade die Seite neu; sonst würde diese Änderung die andere überschreiben.',
        );
      }
    }

    for (const dokument of zuSchreiben) {
      const stelle = storeModul.doc(db, SAMMLUNG, dokument.name);
      vorgang.set(stelle, {
        inhalt: dokument.inhalt,
        stand: gemeinsamerStand,
        geaendertVon: konto.uid,
        geaendertAm: storeModul.serverTimestamp(),
      });
      neueStaende.set(dokument.name, gemeinsamerStand);
    }

    // Der Standzeiger wird mitgeschrieben, damit andere Browser die
    // Änderung mit einem einzigen Abruf bemerken.
    vorgang.set(storeModul.doc(db, SAMMLUNG, STAND_DOKUMENT), {
      inhalt: '{}',
      stand: gemeinsamerStand,
      geaendertVon: konto.uid,
      geaendertAm: storeModul.serverTimestamp(),
    });
    neueStaende.set(STAND_DOKUMENT, gemeinsamerStand);
  });

  return { geschrieben: zuSchreiben.map((d) => d.name), staende: neueStaende };
}

/** Welches Dokument betrifft dieser Datenpfad? Nur für die Anzeige. */
export { dokumentZuPfad };
