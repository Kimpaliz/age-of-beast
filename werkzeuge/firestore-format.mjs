/* ===================================================================
   [Aufgabe: Speicher]
   Age-of-Beast-Wiki – Weltdaten als Firestore-Dokumente
   -------------------------------------------------------------------
   Reine Logik: kein DOM, kein Netz, keine Node-Bausteine. Dieselbe Datei
   laeuft im Browser und in der Pruefung.

   Warum die Welt aufgeteilt wird

   Die Weltdaten sind ohne Einrueckung rund 490 KB gross — das ist die
   Menge, die in Firestore landet. (Die Datei `daten/quelle.json` auf der
   Platte ist mit ihrer Einrueckung deutlich groesser; diese Zahl waere
   hier die falsche.) Als ein Dokument abgelegt, wuerde jede geaenderte
   Zeile alles neu schreiben, und die Grenze von 1 MB je Dokument rueckte
   in Sicht. Aufgeteilt wird deshalb nach Modul: Die Welt hat sieben
   (species, regeln, factions, ...), das groesste misst rund 260 KB.

   Die genauen Zahlen nennt `node werkzeuge/welt-hochladen.mjs --pruefen`;
   sie stehen hier bewusst gerundet, damit sie nicht bei jeder Textaenderung
   still falsch werden.

   Warum der Inhalt eine Zeichenkette ist

   Firestore koennte verschachtelte Objekte speichern, aber mit Regeln:
   Feldnamen duerfen keine Punkte enthalten, Arrays keine Arrays, und die
   Verschachtelung ist begrenzt. Die Weltdaten halten sich an nichts davon.
   Als JSON-Zeichenkette abgelegt, kommt exakt zurueck, was hineinging —
   und genau das laesst sich zeichenweise nachpruefen.

   Abgefragt wird auf einzelnen Feldern nie: Das Wiki liest immer die ganze
   Welt. Der einzige Vorteil echter Felder entfaellt damit.
   =================================================================== */

/** Sammlung fuer die Weltdaten. Das Praefix trennt sie von allem, was
    andere Anwendungen im selben Firebase-Projekt ablegen. */
export const SAMMLUNG = 'wiki_welt';

/** Sammlung fuer die Freigabe zum Bearbeiten. */
export const ZUGANG = 'wiki_zugang';

/** Dokument mit dem Stand. Es wird zuerst gelesen: Hat sich nichts
    geaendert, bleiben die uebrigen acht Abrufe erspart. */
export const STAND_DOKUMENT = '_stand';

/** Dokument fuer alles ausserhalb von `elements` und `rahmen`. */
export const KOPF_DOKUMENT = '_kopf';

/** Diese Schluessel der Quelle wandern in das Kopfdokument. */
const KOPF_FELDER = ['project', 'tools', 'version', 'createdAt', 'updatedAt'];

/** Der Rahmen bekommt ein eigenes Dokument. */
export const RAHMEN_DOKUMENT = '_rahmen';

/* ------------------------------------------------------------------ *
 * Namen
 * ------------------------------------------------------------------ */

/* Ein Modulname wird zum Dokumentnamen. Firestore verbietet in Namen
   unter anderem Schraegstriche und die beiden Punkte `.` und `..`; ausserdem
   sind Namen mit fuehrendem und schliessendem Unterstrich reserviert. Die
   Modulnamen der Weltenschmiede sind harmlos, aber verlassen wollen wir
   uns darauf nicht. */
export function istGueltigerModulname(name) {
  const s = String(name ?? '');
  if (!s || s.length > 100) return false;
  if (s === '.' || s === '..') return false;
  if (s.includes('/')) return false;
  if (/^__.*__$/u.test(s)) return false;
  // Reserviert fuer die Dokumente dieses Formats.
  if (s.startsWith('_')) return false;
  return /^[A-Za-z0-9_-]+$/u.test(s);
}

/* ------------------------------------------------------------------ *
 * Welt -> Dokumente
 * ------------------------------------------------------------------ */

/**
 * Zerlegt die Quelle in Dokumente.
 * Liefert eine Liste `{ name, inhalt }`, wobei `inhalt` JSON-Text ist.
 */
export function inDokumente(quelle) {
  if (!quelle || typeof quelle !== 'object') {
    throw new TypeError('Die Quelle muss ein Objekt sein.');
  }
  const dokumente = [];

  const elemente = quelle.elements && typeof quelle.elements === 'object' ? quelle.elements : {};
  // Sortiert, damit die Liste der Dokumente vorhersagbar ist. Die
  // ursprüngliche Reihenfolge steht getrennt im Kopf und geht dadurch
  // nicht verloren.
  for (const name of Object.keys(elemente).slice().sort()) {
    if (!istGueltigerModulname(name)) {
      throw new RangeError('Der Modulname „' + name + '" taugt nicht als Dokumentname.');
    }
    dokumente.push({ name, inhalt: JSON.stringify(elemente[name]) });
  }

  const felder = {};
  for (const feld of KOPF_FELDER) {
    if (Object.prototype.hasOwnProperty.call(quelle, feld)) felder[feld] = quelle[feld];
  }

  /* Warum die Reihenfolge mitgespeichert wird
     ---------------------------------------------------------------
     Firestore liefert Dokumente alphabetisch, und ein Objekt aus
     festen Feldern zusammenzusetzen ergibt immer dieselbe Reihenfolge —
     nur eben nicht die ursprüngliche. Der Inhalt wäre vollständig, die
     Datei sähe trotzdem völlig anders aus.

     Das ist kein Schönheitsfehler: `daten/quelle.json` liegt in Git.
     Ohne diese zwei Listen zeigte der erste Abgleich nach dem Umzug
     eine komplett umsortierte Datei, in der keine echte Änderung mehr
     zu erkennen wäre. */
  const kopf = {
    felder,
    reihenfolge: Object.keys(quelle),
    module: Object.keys(elemente),
  };

  dokumente.push({ name: KOPF_DOKUMENT, inhalt: JSON.stringify(kopf) });
  dokumente.push({ name: RAHMEN_DOKUMENT, inhalt: JSON.stringify(quelle.rahmen ?? {}) });

  return dokumente;
}

/**
 * Setzt die Quelle aus Dokumenten wieder zusammen.
 * `dokumente` ist eine Abbildung Name -> JSON-Text.
 */
export function ausDokumenten(dokumente) {
  const karte = dokumente instanceof Map ? dokumente : new Map(Object.entries(dokumente ?? {}));

  const kopfText = karte.get(KOPF_DOKUMENT);
  if (kopfText === undefined) throw new Error('Das Kopfdokument fehlt.');
  const kopf = JSON.parse(kopfText);
  const felder = kopf?.felder ?? {};
  const reihenfolge = Array.isArray(kopf?.reihenfolge) ? kopf.reihenfolge : [];
  const modulfolge = Array.isArray(kopf?.module) ? kopf.module : [];

  // Alle Moduldokumente einsammeln.
  const module = new Map();
  for (const [name, text] of karte) {
    if (name === KOPF_DOKUMENT || name === RAHMEN_DOKUMENT || name === STAND_DOKUMENT) continue;
    module.set(name, JSON.parse(text));
  }

  /* Erst die gemerkte Reihenfolge, dann alles, was seither dazugekommen
     ist. Ein Modul, das nach dem letzten Speichern angelegt wurde, steht
     in `modulfolge` noch nicht — es darf trotzdem nicht verloren gehen. */
  const elemente = {};
  for (const name of modulfolge) {
    if (module.has(name)) {
      elemente[name] = module.get(name);
      module.delete(name);
    }
  }
  for (const name of [...module.keys()].sort()) elemente[name] = module.get(name);

  let rahmen = null;
  const rahmenText = karte.get(RAHMEN_DOKUMENT);
  if (rahmenText !== undefined) {
    const gelesen = JSON.parse(rahmenText);
    // Ein leerer Rahmen wird nicht gesetzt: Die Quelle kannte das Feld dann
    // gar nicht, und ein leeres Objekt waere ein Unterschied.
    if (gelesen && Object.keys(gelesen).length) rahmen = gelesen;
  }

  // Die oberste Ebene in der ursprünglichen Reihenfolge aufbauen.
  const quelle = {};
  for (const schluessel of reihenfolge) {
    if (schluessel === 'elements') quelle.elements = elemente;
    else if (schluessel === 'rahmen') { if (rahmen) quelle.rahmen = rahmen; }
    else if (Object.prototype.hasOwnProperty.call(felder, schluessel)) quelle[schluessel] = felder[schluessel];
  }

  // Sicherheitsnetz für den Fall, dass die Reihenfolge fehlt oder
  // unvollständig ist: Nichts darf allein deswegen verschwinden.
  if (!Object.prototype.hasOwnProperty.call(quelle, 'elements')) quelle.elements = elemente;
  for (const [schluessel, wert] of Object.entries(felder)) {
    if (!Object.prototype.hasOwnProperty.call(quelle, schluessel)) quelle[schluessel] = wert;
  }
  if (rahmen && !Object.prototype.hasOwnProperty.call(quelle, 'rahmen')) quelle.rahmen = rahmen;

  return quelle;
}

/**
 * Welches Dokument traegt diesen Datenpfad?
 * Der Bearbeitungsteil arbeitet mit Pfaden wie
 * `elements/species/species-dh-clank/name`. Damit ein Speichervorgang nicht
 * alle neun Dokumente schreibt, wird hier bestimmt, welches eine genuegt.
 */
export function dokumentZuPfad(pfad) {
  const teile = String(pfad ?? '').split('/').filter(Boolean);
  if (!teile.length) return null;
  if (teile[0] === 'elements') return teile.length >= 2 ? teile[1] : null;
  if (teile[0] === 'rahmen') return RAHMEN_DOKUMENT;
  if (KOPF_FELDER.includes(teile[0])) return KOPF_DOKUMENT;
  return null;
}

/* ------------------------------------------------------------------ *
 * Firestore-REST
 * ------------------------------------------------------------------ */

/* Die REST-Schnittstelle verpackt jeden Wert in seinen Typ. Fuer das
   Lesen ohne Anmeldung ist das der ganze Unterschied zum SDK — und der
   Grund, warum die Besucheransicht ohne ein einziges fremdes Skript
   auskommt. */

/** Liest das Feld `inhalt` aus einer REST-Antwort. */
export function inhaltAusAntwort(dokument) {
  const wert = dokument?.fields?.inhalt;
  if (!wert || typeof wert.stringValue !== 'string') return null;
  return wert.stringValue;
}

/** Der Dokumentname am Ende des REST-Pfades. */
export function nameAusAntwort(dokument) {
  const voll = String(dokument?.name ?? '');
  const schnitt = voll.lastIndexOf('/');
  return schnitt === -1 ? voll : voll.slice(schnitt + 1);
}

/** Baut aus einer Listenantwort die Abbildung Name -> Inhalt. */
export function karteAusListe(antwort) {
  const karte = new Map();
  for (const dokument of antwort?.documents ?? []) {
    const name = nameAusAntwort(dokument);
    const inhalt = inhaltAusAntwort(dokument);
    if (name && inhalt !== null) karte.set(name, inhalt);
  }
  return karte;
}

/** Adresse der Sammlung an der REST-Schnittstelle. */
export function sammlungsAdresse(projektId, sammlung, seitengroesse) {
  const grenze = Number.isFinite(seitengroesse) ? '?pageSize=' + seitengroesse : '';
  return 'https://firestore.googleapis.com/v1/projects/' + encodeURIComponent(projektId)
    + '/databases/(default)/documents/' + encodeURIComponent(sammlung) + grenze;
}

/** Adresse eines einzelnen Dokuments. */
export function dokumentAdresse(projektId, sammlung, dokument) {
  return 'https://firestore.googleapis.com/v1/projects/' + encodeURIComponent(projektId)
    + '/databases/(default)/documents/' + encodeURIComponent(sammlung)
    + '/' + encodeURIComponent(dokument);
}

/* ------------------------------------------------------------------ *
 * Stand
 * ------------------------------------------------------------------ */

/** Der Standwert, mit dem sich „hat sich etwas geaendert?" beantworten laesst. */
export function standAusAntwort(dokument) {
  const wert = dokument?.fields?.stand;
  if (wert && typeof wert.stringValue === 'string') return wert.stringValue;
  return null;
}

/** Ein neuer Standwert. Zeit plus Zufall, damit zwei Speichervorgaenge in
    derselben Millisekunde unterscheidbar bleiben. */
export function standErzeugen(jetzt, zufall) {
  const zeit = new Date(jetzt ?? Date.now()).toISOString();
  const teil = Math.floor((zufall ?? Math.random()) * 0xffffff).toString(16).padStart(6, '0');
  return zeit + '-' + teil;
}
