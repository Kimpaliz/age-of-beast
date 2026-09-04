/**
 * Die Wikis der Plattform: auflisten, anlegen, übernehmen.  [Aufgabe: Rahmen]
 *
 * Jedes Wiki ist ein Dokument unter `wiki_projekte/{wikiId}` mit seinen
 * Weltdaten als Untersammlung `welt`. Warum so — und warum die
 * Mitgliedschaft **auf** dem Dokument steht statt in einer eigenen
 * Sammlung — steht in `docs/PLATTFORM.md`.
 *
 * Dieselbe Arbeitsteilung wie in `firestore-speicher.mjs`:
 * **Lesen** geht über die REST-Schnittstelle, ohne SDK und ohne
 * Anmeldung — die Besucheransicht soll kein fremdes Skript laden.
 * **Schreiben** geht über das Firebase-SDK, das erst beim Anmelden
 * nachgeladen wird.
 *
 * ⚠️ Eine Abfrage ohne Filter wird von den Regeln abgewiesen (HTTP 403),
 * und das ist Absicht: Wer alle Wikis auflisten dürfte, sähe auch die
 * privaten. Jede Abfrage hier trägt deshalb ihre Bedingung mit.
 *
 * Arbeitet zusammen mit: `runtime/plattform.js` (Bedienung),
 * `firestore-speicher.mjs` (Anmeldung und SDK-Verbindung).

 */
import { FIREBASE } from '../firebase-konfig.js';
import { verbinden } from './firestore-speicher.mjs';

export const WIKI_SAMMLUNG = 'wiki_projekte';

/* Die Kennung eines Wikis steht in der Adresse und in Dateinamen. Sie
   darf deshalb nur das enthalten, was dort überall gefahrlos ist. */
export const KENNUNG_MUSTER = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/;

/**
 * Macht aus einem Namen eine Kennung: „Age of Beast" → `age-of-beast`.
 * Umlaute werden ausgeschrieben, weil ein `ä` in einer Adresse als
 * Prozentfolge erscheint und dann niemand mehr die Kennung wiedererkennt.
 */
export function kennungAus(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
    .replace(/-+$/g, '');
}

/* ------------------------------------------------------------------ *
 * Lesen — ohne SDK
 * ------------------------------------------------------------------ */

const ABFRAGE_ADRESSE = 'https://firestore.googleapis.com/v1/projects/'
  + FIREBASE.projectId + '/databases/(default)/documents:runQuery?key='
  + encodeURIComponent(FIREBASE.apiKey);

/* Firestore liefert Werte typisiert (`stringValue`, `booleanValue`, …).
   Diese Umkehrung bleibt bewusst klein: Ein Wiki-Steckbrief hat nur
   Text, Wahrheitswerte, Listen und eine Map. */
function wertAus(v) {
  if (v == null) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('timestampValue' in v) return v.timestampValue;
  if ('nullValue' in v) return null;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(wertAus);
  if ('mapValue' in v) return feldeAus(v.mapValue.fields || {});
  return null;
}

function feldeAus(felder) {
  const aus = {};
  for (const [k, v] of Object.entries(felder)) aus[k] = wertAus(v);
  return aus;
}

function wikiAus(dokument) {
  if (!dokument) return null;
  const kennung = dokument.name.split('/').pop();
  return { kennung, ...feldeAus(dokument.fields || {}) };
}

async function abfragen(strukturierteAbfrage, token) {
  const kopf = { 'content-type': 'application/json', accept: 'application/json' };
  if (token) kopf.authorization = 'Bearer ' + token;
  const antwort = await fetch(ABFRAGE_ADRESSE, {
    method: 'POST',
    headers: kopf,
    body: JSON.stringify({ structuredQuery: strukturierteAbfrage }),
  });
  if (!antwort.ok) {
    const text = await antwort.text();
    throw new Error('Die Wikis liessen sich nicht abfragen (HTTP '
      + antwort.status + '): ' + text.slice(0, 300));
  }
  const zeilen = await antwort.json();
  return zeilen.map((z) => wikiAus(z.document)).filter(Boolean);
}

/**
 * Alle öffentlich lesbaren Wikis. Geht ohne Anmeldung.
 *
 * ⚠️ **Sortiert wird hier, nicht in Firestore.** Ein `orderBy` neben dem
 * Filter verlangt einen zusammengesetzten Index — also eine
 * Infrastrukturänderung, die jemand veröffentlichen müsste. Genau das
 * soll die Plattform nicht brauchen: Ein neues Wiki ist ein
 * Schreibvorgang, kein Eingriff (siehe `docs/PLATTFORM.md`). Bei
 * höchstens hundert Wikis kostet das Sortieren im Browser nichts.
 * Gemessen am 04.09.2026: ohne diesen Umweg antwortete die Abfrage mit
 * HTTP 400 „The query requires an index".
 */
export async function oeffentlicheWikis() {
  const wikis = await abfragen({
    from: [{ collectionId: WIKI_SAMMLUNG }],
    where: {
      fieldFilter: {
        field: { fieldPath: 'oeffentlich' },
        op: 'EQUAL',
        value: { booleanValue: true },
      },
    },
    limit: 100,
  });
  return wikis.sort((a, b) =>
    String(a.name || '').localeCompare(String(b.name || ''), 'de'));
}

/**
 * Die Wikis, in denen dieses Konto Mitglied ist.
 *
 * **Über das SDK, nicht über REST.** Die Regel lässt die Abfrage nur
 * durch, wenn sie sich auf die eigene Kennung beschränkt — dafür braucht
 * es einen gültigen Anmeldetoken. Den über REST mitzuführen hiesse, ihn
 * selbst zu holen, im Blick zu behalten und rechtzeitig zu erneuern. Wer
 * hier ankommt, ist ohnehin angemeldet, und dann ist das SDK schon
 * geladen: Es kennt den Token und erneuert ihn von selbst.
 */
export async function meineWikis(uid) {
  if (!uid) return [];
  const { db, storeModul } = await verbinden();
  const abfrage = storeModul.query(
    storeModul.collection(db, WIKI_SAMMLUNG),
    storeModul.where('mitgliederIds', 'array-contains', uid),
    storeModul.limit(100),
  );
  const schnappschuss = await storeModul.getDocs(abfrage);
  return schnappschuss.docs.map((d) => ({ kennung: d.id, ...d.data() }));
}

/* ------------------------------------------------------------------ *
 * Schreiben — über das SDK
 * ------------------------------------------------------------------ */

/**
 * Legt ein Wiki an. Der Anlegende ist sein Besitzer, und zwar allein —
 * das erzwingen auch die Regeln. Ein Anlegen, das gleich Fremde
 * einträgt, wäre der bequemste Weg, jemandem ungefragt ein Wiki
 * unterzuschieben.
 *
 * @returns {Promise<string>} die vergebene Kennung
 */
export async function wikiAnlegen({ name, beschreibung, oeffentlich, regelwerke, konto }) {
  if (!konto || !konto.uid) throw new Error('Zum Anlegen muss man angemeldet sein.');
  const sauber = String(name || '').trim();
  if (!sauber) throw new Error('Das Wiki braucht einen Namen.');

  const kennung = kennungAus(sauber);
  if (!KENNUNG_MUSTER.test(kennung)) {
    throw new Error('Aus „' + sauber + '" lässt sich keine brauchbare Kennung bilden. '
      + 'Buchstaben und Ziffern genügen.');
  }

  const { db, storeModul } = await verbinden();
  const bezug = storeModul.doc(db, WIKI_SAMMLUNG, kennung);

  /* Erst nachsehen, dann schreiben: Ohne diese Abfrage überschriebe ein
     gleicher Name ein fremdes Wiki — die Regeln erlauben `create` nur
     auf ein noch nicht vorhandenes Dokument, aber die Fehlermeldung
     wäre für Jannik nicht zu deuten. */
  const vorhanden = await storeModul.getDoc(bezug);
  if (vorhanden.exists()) {
    throw new Error('Ein Wiki mit der Kennung „' + kennung + '" gibt es schon. '
      + 'Wähle einen anderen Namen.');
  }

  await storeModul.setDoc(bezug, {
    name: sauber,
    beschreibung: String(beschreibung || '').trim(),
    oeffentlich: Boolean(oeffentlich),
    regelwerke: Array.isArray(regelwerke) ? regelwerke : [],
    mitgliederIds: [konto.uid],
    rollen: { [konto.uid]: 'besitzer' },
    erstelltAm: storeModul.serverTimestamp(),
    erstelltVon: konto.uid,
  });
  return kennung;
}

/**
 * Trägt ein bereits bestehendes Wiki in die Plattform ein und zieht
 * seine Weltdaten in den neuen Baum um.
 *
 * Das ist der einmalige Weg für das Age-of-Beast-Wiki, dessen Welt seit
 * dem 02.09.2026 in der alten Sammlung `wiki_welt` liegt. Die alte
 * Sammlung wird dabei **nicht** angerührt: Erst wenn beide nachweislich
 * dasselbe tragen, schaltet der Leser um — dieselbe Vorsicht wie bei
 * jeder anderen Umstellung.
 *
 * @param {object} arg
 * @param {string} arg.kennung   Kennung des neuen Wikis
 * @param {object} arg.quelle    `{ quelle, staende }` aus `weltLesen()`
 * @returns {Promise<number>} Anzahl übernommener Weltmodule
 */
export async function weltUebernehmen({ kennung, dokumente, konto }) {
  if (!konto || !konto.uid) throw new Error('Zum Übernehmen muss man angemeldet sein.');
  if (!KENNUNG_MUSTER.test(kennung)) throw new Error('Ungültige Kennung.');
  const teile = Object.entries(dokumente || {});
  if (!teile.length) throw new Error('Es gibt nichts zu übernehmen.');

  const { db, storeModul } = await verbinden();

  /* In einem Rutsch: Eine halb umgezogene Welt liesse sich nicht
     zusammensetzen. Firestore erlaubt 500 Schreibvorgänge je Stapel; die
     Welt hat zehn Module, also passt sie mit weitem Abstand hinein. */
  const stapel = storeModul.writeBatch(db);
  for (const [teil, inhalt] of teile) {
    stapel.set(storeModul.doc(db, WIKI_SAMMLUNG, kennung, 'welt', teil), {
      inhalt: String(inhalt),
      stand: new Date().toISOString() + '-uebernahme',
      geaendertAm: storeModul.serverTimestamp(),
      geaendertVon: konto.uid,
    });
  }
  await stapel.commit();
  return teile.length;
}
