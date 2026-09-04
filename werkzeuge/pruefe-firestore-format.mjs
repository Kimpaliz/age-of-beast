/**
 * [Aufgabe: Prüfwesen]
 * Prueft werkzeuge/firestore-format.mjs — die Zerlegung der Weltdaten in
 * Firestore-Dokumente und ihr Wiederzusammensetzen.
 *
 * Warum es diese Pruefung gibt: Firestore sieht die Welt nie als Ganzes,
 * sondern als neun einzelne Dokumente. Geht beim Zerlegen oder beim
 * Zusammensetzen auch nur ein Feld verloren, faellt das nicht sofort auf —
 * es faellt erst auf, wenn jemand einen fehlenden Eintrag im Wiki sucht,
 * lange nachdem der Fehler entstanden ist. Deshalb wird hier mit der
 * echten `daten/quelle.json` gemessen statt mit einer kleinen
 * Alibi-Probe, und es werden gezielt die Formen nachgebaut, die eine
 * Firestore-REST-Antwort im Fehlerfall annehmen kann.
 *
 * Kein Browser, kein Netzwerk, keine Firestore-Verbindung: Alle
 * REST-Antworten werden von Hand nachgebaut.
 *
 * Aufruf:
 *   node werkzeuge/pruefe-firestore-format.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  istGueltigerModulname,
  inDokumente,
  ausDokumenten,
  dokumentZuPfad,
  inhaltAusAntwort,
  nameAusAntwort,
  karteAusListe,
  sammlungsAdresse,
  dokumentAdresse,
  standErzeugen,
  KOPF_DOKUMENT,
  RAHMEN_DOKUMENT,
} from './firestore-format.mjs';
import { QUELLE } from './welt-dateien.mjs';

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), '..');

let pruefungen = 0;
const fehler = [];
function pruefe(wert, text) {
  pruefungen += 1;
  if (!wert) fehler.push(text);
}

// Die echte Quelle — nicht nur ein erfundenes Beispiel. Mit rund 480 KB und
// sieben Modulen deckt sie Groessen und Eigenheiten ab, die eine Handvoll
// Testdaten nie zufaellig treffen wuerde.
const roh = JSON.parse(readFileSync(join(WURZEL, QUELLE), 'utf8'));
const dokumente = inDokumente(roh);
const dokumentKarte = new Map(dokumente.map((d) => [d.name, d.inhalt]));

/* ------------------------------------------------------------------ *
 * 1. Der Umlauf ist verlustfrei
 *
 * „Verlustfrei" hat zwei Bedeutungen, die auseinanderfallen koennen:
 * derselbe Inhalt, aber vielleicht in anderer Schluesselreihenfolge. Ein
 * gewoehnliches deepEqual saehe beides als gleich an — und genau das waere
 * die Luecke, denn `daten/quelle.json` liegt in Git, und eine verschobene
 * Reihenfolge macht dort jede betroffene Zeile zu einer Diff-Zeile, obwohl
 * sich inhaltlich nichts geaendert hat. Deshalb zwei getrennte Messungen:
 * zeichengleich (JSON.stringify, reihenfolgeempfindlich) und kanonisch
 * (Schluessel rekursiv sortiert, reihenfolgeblind) — beide werden geprueft
 * und einzeln gemeldet, damit sich eine blosse Umordnung von einem
 * echten Inhaltsverlust unterscheiden laesst.
 * ------------------------------------------------------------------ */

/** Kanonische Zeichenkette: Schluessel rekursiv sortiert, Arrays bleiben in
    ihrer Reihenfolge (sie ist inhaltlich, keine Ablageform). Zwei Werte mit
    derselben kanonischen Zeichenkette enthalten denselben Inhalt — ganz
    unabhaengig davon, in welcher Reihenfolge irgendeine Ebene ihre
    Schluessel traegt. */
function kanonisch(wert) {
  if (Array.isArray(wert)) return '[' + wert.map(kanonisch).join(',') + ']';
  if (wert && typeof wert === 'object') {
    return '{' + Object.keys(wert).sort()
      .map((k) => JSON.stringify(k) + ':' + kanonisch(wert[k]))
      .join(',') + '}';
  }
  return JSON.stringify(wert);
}

/** Erste abweichende Stelle zweier Zeichenketten, mit etwas Umgebung —
    genuegt bei 480 KB, um sofort zur Ursache zu springen, statt zwei
    riesige Bloecke nebeneinanderzulegen. */
function ersteAbweichung(a, b) {
  const laenge = Math.max(a.length, b.length);
  for (let i = 0; i < laenge; i += 1) {
    if (a[i] !== b[i]) {
      return 'Zeichen ' + i + ': original „' + a.slice(Math.max(0, i - 40), i + 40)
        + '" gegen Umlauf „' + b.slice(Math.max(0, i - 40), i + 40) + '"';
    }
  }
  return '(keine — eine Zeichenkette ist nur ein Praefix der anderen)';
}

const umlaufKarte = ausDokumenten(dokumentKarte);
// Der Vertrag erlaubt ausdruecklich beide Eingabeformen („eine Abbildung
// Name -> Text", Map oder Objekt). Beide muessen zum selben Ergebnis
// fuehren, sonst waere die Wahl der Aufrufform ein unsichtbarer Unterschied
// zwischen Werkzeug-Skript und Browser-Code.
const umlaufObjekt = ausDokumenten(Object.fromEntries(dokumentKarte));
pruefe(
  JSON.stringify(umlaufKarte) === JSON.stringify(umlaufObjekt),
  'ausDokumenten() liefert fuer dieselben Dokumente als Map und als Objekt unterschiedliche Ergebnisse.',
);

const originalZeichen = JSON.stringify(roh);
const umlaufZeichen = JSON.stringify(umlaufKarte);
const zeichengleich = originalZeichen === umlaufZeichen;
pruefe(
  zeichengleich,
  'ausDokumenten(inDokumente(quelle)) ist NICHT zeichengleich zur Quelle. '
    + ersteAbweichung(originalZeichen, umlaufZeichen)
    + ' — Reihenfolge der obersten Schluessel im Original: ' + Object.keys(roh).join(', ')
    + '; nach dem Umlauf: ' + Object.keys(umlaufKarte).join(', ') + '.',
);

const originalKanonisch = kanonisch(roh);
const umlaufKanonisch = kanonisch(umlaufKarte);
const inhaltlichGleich = originalKanonisch === umlaufKanonisch;
pruefe(
  inhaltlichGleich,
  'ausDokumenten(inDokumente(quelle)) veraendert echten Inhalt, nicht nur die Reihenfolge. '
    + ersteAbweichung(originalKanonisch, umlaufKanonisch),
);

/* ------------------------------------------------------------------ *
 * 2. Kein Dokument sprengt die Firestore-Grenze
 *
 * Firestore lehnt ein Dokument ab 1 MiB rundweg ab. Gemessen wird die
 * UTF-8-Bytelaenge des Inhalts, nicht `string.length`: Deutsche Umlaute
 * und Sonderzeichen sind in UTF-8 mehrere Bytes, aber genau ein
 * JavaScript-Zeichen — `.length` wuerde die Datei kleiner ausweisen, als
 * Firestore sie tatsaechlich sieht.
 * ------------------------------------------------------------------ */

const FIRESTORE_GRENZE = 1024 * 1024; // 1 MiB, Firestores harte Dokumentgrenze
let groesstesDokument = { name: '(keines)', bytes: 0 };
pruefe(dokumente.length > 0, 'inDokumente(quelle) liefert aus der echten Quelle keine Dokumente.');
for (const { name, inhalt } of dokumente) {
  const bytes = Buffer.byteLength(inhalt, 'utf8');
  if (bytes > groesstesDokument.bytes) groesstesDokument = { name, bytes };
  pruefe(
    bytes < FIRESTORE_GRENZE,
    'Dokument „' + name + '" ist ' + bytes + ' Bytes (UTF-8) gross und sprengt die Firestore-Grenze von ' + FIRESTORE_GRENZE + ' Bytes.',
  );
}

/* ------------------------------------------------------------------ *
 * 3. Alle Modulnamen sind gueltige Dokumentnamen
 *
 * Ein ungueltiger Modulname faellt sonst erst beim Schreiben nach
 * Firestore auf. Getestet werden die echten Modulnamen aus quelle.json
 * und daneben gezielt die Faelle, die istGueltigerModulname laut eigenem
 * Kommentar ablehnen soll — inklusive der beiden Grenzen bei 100/101
 * Zeichen in beide Richtungen.
 * ------------------------------------------------------------------ */

const ECHTE_MODULNAMEN = Object.keys(roh.elements ?? {});
pruefe(ECHTE_MODULNAMEN.length > 0, 'quelle.json enthaelt keine Module unter elements — die Probe waere gegenstandslos.');
for (const name of ECHTE_MODULNAMEN) {
  pruefe(istGueltigerModulname(name), 'Der echte Modulname „' + name + '" aus quelle.json gilt als ungueltig.');
}

const UNGUELTIGE_NAMEN = [
  ['leerer Name', ''],
  ['ein Punkt', '.'],
  ['zwei Punkte', '..'],
  ['Schraegstrich', 'a/b'],
  ['fuehrender und schliessender Unterstrich', '__x__'],
  ['reserviertes Kopfdokument', '_kopf'],
  ['101 Zeichen', 'a'.repeat(101)],
  ['Leerzeichen', 'mein modul'],
  ['Umlaut', 'grösse'],
];
for (const [beschreibung, name] of UNGUELTIGE_NAMEN) {
  pruefe(
    !istGueltigerModulname(name),
    'istGueltigerModulname akzeptiert faelschlich einen Namen mit „' + beschreibung + '": ' + JSON.stringify(name),
  );
}
// Die Grenze liegt bei 101, nicht bei 100 — genau 100 Zeichen bleiben erlaubt.
pruefe(istGueltigerModulname('a'.repeat(100)), 'Ein Name mit genau 100 Zeichen (der erlaubten Grenze) wird faelschlich abgelehnt.');

/* ------------------------------------------------------------------ *
 * 4. dokumentZuPfad trifft das richtige Dokument
 *
 * Der Bearbeitungsteil darf beim Speichern eines einzelnen Feldes nicht
 * versehentlich alle neun Dokumente ueberschreiben. Die Pfade stammen aus
 * den echten Daten, nicht ausgedacht — ein erfundener Pfad koennte eine
 * Form treffen, die in der Wirklichkeit nie vorkommt.
 * ------------------------------------------------------------------ */

const ECHTE_PFADE = [
  ['elements/species/species-dh-aetheris/name', 'species'],
  ['elements/regeln/regel-spielfluss-spotlight/title', 'regeln'],
  ['elements/wiki/wiki-sturmwende-kampagnenframe/panels/0/text', 'wiki'],
  ['elements/factions/faction-sturmwende-gelbroecke-provisorisch/name', 'factions'],
];
for (const [pfad, erwartetesModul] of ECHTE_PFADE) {
  const [, modul, id] = pfad.split('/');
  // Die Wurzel des Pfades muss es wirklich geben — sonst prueft der Fall
  // eine Form, die es in quelle.json gar nicht gibt.
  pruefe(
    Boolean(roh.elements?.[modul]?.[id]),
    'Testpfad „' + pfad + '" verweist auf ein Element, das es in quelle.json gar nicht gibt — der Fall pruefte nichts Echtes.',
  );
  const ergebnis = dokumentZuPfad(pfad);
  pruefe(
    ergebnis === erwartetesModul,
    'dokumentZuPfad("' + pfad + '") liefert „' + ergebnis + '" statt „' + erwartetesModul + '".',
  );
}

pruefe(dokumentZuPfad('rahmen/rahmen-prototyp/status') === RAHMEN_DOKUMENT, 'Ein Rahmenpfad landet nicht im Rahmendokument.');
pruefe(dokumentZuPfad('project/title') === KOPF_DOKUMENT, 'Ein Kopf-Feldpfad (project/...) landet nicht im Kopfdokument.');
pruefe(dokumentZuPfad('nichtvorhanden/x/y') === null, 'Ein unbekannter Pfad liefert nicht null.');
pruefe(dokumentZuPfad('') === null, 'Der leere Pfad liefert nicht null.');
pruefe(dokumentZuPfad('elements') === null, 'Der Pfad „elements" allein, ohne Modul dahinter, liefert nicht null.');

/* ------------------------------------------------------------------ *
 * 5. Die REST-Hilfsfunktionen
 *
 * Diese drei Funktionen lesen echte Firestore-REST-Antworten — Text, der
 * ueber das Netz kommt und nie garantiert die erwartete Form hat. Sie
 * duerfen bei einer unerwarteten Form nicht werfen (ein einziges falsch
 * geformtes Dokument wuerde sonst die gesamte Anzeige mitreissen), sondern
 * muessen still null bzw. eine leere Karte liefern.
 * ------------------------------------------------------------------ */

// -- inhaltAusAntwort --------------------------------------------------
pruefe(
  inhaltAusAntwort({ fields: { inhalt: { stringValue: '{"a":1}' } } }) === '{"a":1}',
  'inhaltAusAntwort liest den Inhalt eines wohlgeformten Dokuments nicht korrekt.',
);
pruefe(inhaltAusAntwort({ fields: {} }) === null, 'inhaltAusAntwort liefert bei fehlendem Feld "inhalt" nicht null.');
pruefe(inhaltAusAntwort({}) === null, 'inhaltAusAntwort liefert ohne "fields" nicht null.');
pruefe(
  inhaltAusAntwort({ fields: { inhalt: { integerValue: '5' } } }) === null,
  'inhaltAusAntwort akzeptiert faelschlich einen falschen Werttyp (integerValue statt stringValue).',
);
{
  let wirftFehler = false;
  try { inhaltAusAntwort(undefined); } catch { wirftFehler = true; }
  pruefe(!wirftFehler, 'inhaltAusAntwort wirft bei undefined, statt null zu liefern.');
  pruefe(inhaltAusAntwort(undefined) === null, 'inhaltAusAntwort(undefined) liefert nicht null.');
}

// -- nameAusAntwort ------------------------------------------------------
pruefe(
  nameAusAntwort({ name: 'projects/p/databases/(default)/documents/wiki_welt/_kopf' }) === '_kopf',
  'nameAusAntwort schneidet den Dokumentnamen nicht korrekt vom REST-Pfad ab.',
);
pruefe(nameAusAntwort({ name: 'einfach' }) === 'einfach', 'nameAusAntwort liefert bei einem Namen ohne Schraegstrich nicht den Namen selbst.');
{
  let wirftFehler = false;
  try { nameAusAntwort(undefined); } catch { wirftFehler = true; }
  pruefe(!wirftFehler, 'nameAusAntwort wirft bei undefined, statt eine leere Zeichenkette zu liefern.');
  pruefe(nameAusAntwort(undefined) === '', 'nameAusAntwort(undefined) liefert nicht die leere Zeichenkette.');
}

// -- karteAusListe ---------------------------------------------------------
const listenAntwort = {
  documents: [
    { name: 'projects/p/databases/(default)/documents/wiki_welt/_kopf', fields: { inhalt: { stringValue: '{"v":1}' } } },
    { name: 'projects/p/databases/(default)/documents/wiki_welt/species', fields: { inhalt: { stringValue: '[]' } } },
    // Ein Dokument ohne brauchbaren Inhalt darf die Karte nicht verunreinigen.
    { name: 'projects/p/databases/(default)/documents/wiki_welt/kaputt', fields: {} },
  ],
};
const karteAusEchterListe = karteAusListe(listenAntwort);
pruefe(
  karteAusEchterListe.size === 2,
  'karteAusListe nimmt ein Dokument ohne brauchbaren Inhalt trotzdem in die Karte auf (Groesse ' + karteAusEchterListe.size + ' statt 2).',
);
pruefe(karteAusEchterListe.get('_kopf') === '{"v":1}', 'karteAusListe liest den Inhalt des Kopfdokuments falsch aus einer Liste.');
pruefe(karteAusEchterListe.get('species') === '[]', 'karteAusListe liest den Inhalt eines Moduldokuments falsch aus einer Liste.');

pruefe(karteAusListe({ documents: [] }).size === 0, 'karteAusListe liefert bei einer leeren Liste keine leere Karte.');
pruefe(karteAusListe({}).size === 0, 'karteAusListe liefert bei fehlendem "documents"-Feld keine leere Karte.');
{
  let wirftFehler = false;
  let ergebnisGroesse = -1;
  try { ergebnisGroesse = karteAusListe(undefined).size; } catch { wirftFehler = true; }
  pruefe(!wirftFehler, 'karteAusListe wirft bei undefined, statt eine leere Karte zu liefern.');
  pruefe(ergebnisGroesse === 0, 'karteAusListe(undefined) liefert keine leere Karte.');
}

/* ------------------------------------------------------------------ *
 * 6. Adressen kodieren Projektkennung und Namen korrekt
 *
 * Projekt- und Dokumentnamen landen roh in einer URL. Ohne Kodierung
 * wuerde ein Sonderzeichen (Schraegstrich, Leerzeichen, Et-Zeichen) die
 * Anfrage an eine andere Adresse schicken oder die URL unbrauchbar machen.
 * ------------------------------------------------------------------ */

const SONDERNAME = 'modul mit/Sonderzeichen & Ümlaut';

const sammlungOhneGrenze = sammlungsAdresse('mein projekt', SONDERNAME, undefined);
pruefe(
  sammlungOhneGrenze === 'https://firestore.googleapis.com/v1/projects/' + encodeURIComponent('mein projekt')
    + '/databases/(default)/documents/' + encodeURIComponent(SONDERNAME),
  'sammlungsAdresse kodiert Projektkennung oder Sammlungsname nicht wie erwartet: ' + sammlungOhneGrenze,
);
pruefe(!sammlungOhneGrenze.includes(SONDERNAME), 'sammlungsAdresse enthaelt den Sondernamen unkodiert — das wuerde die URL zerstoeren.');
pruefe(!sammlungOhneGrenze.includes('pageSize'), 'sammlungsAdresse haengt ohne angegebene Seitengroesse trotzdem einen pageSize-Parameter an.');

const sammlungMitGrenze = sammlungsAdresse('mein projekt', SONDERNAME, 50);
pruefe(sammlungMitGrenze.endsWith('?pageSize=50'), 'sammlungsAdresse haengt eine gegebene Seitengroesse nicht als pageSize an: ' + sammlungMitGrenze);

const dokAdresse = dokumentAdresse('mein projekt', 'wiki_welt', SONDERNAME);
pruefe(
  dokAdresse === 'https://firestore.googleapis.com/v1/projects/' + encodeURIComponent('mein projekt')
    + '/databases/(default)/documents/wiki_welt/' + encodeURIComponent(SONDERNAME),
  'dokumentAdresse kodiert den Dokumentnamen nicht wie erwartet: ' + dokAdresse,
);
pruefe(!dokAdresse.includes(SONDERNAME), 'dokumentAdresse enthaelt den Sondernamen unkodiert — das wuerde die URL zerstoeren.');

/* ------------------------------------------------------------------ *
 * 7. standErzeugen ist bei festen Eingaben vorhersagbar
 *
 * Der Standwert entscheidet, ob dem Wiki acht weitere Abrufe erspart
 * bleiben. Zeit und Zufall werden deshalb als Parameter uebergeben statt
 * intern `Date.now()`/`Math.random()` zu rufen — nur so laesst sich das
 * Ergebnis ohne Warten und ohne echten Zufall von Hand nachrechnen.
 * ------------------------------------------------------------------ */

const FESTE_ZEIT = 1735689600000; // 2025-01-01T00:00:00.000Z
const beiHalb = standErzeugen(FESTE_ZEIT, 0.5);
pruefe(
  beiHalb === '2025-01-01T00:00:00.000Z-7fffff',
  'standErzeugen(feste Zeit, 0.5) liefert nicht den von Hand nachgerechneten Wert „2025-01-01T00:00:00.000Z-7fffff": ' + beiHalb,
);
pruefe(
  standErzeugen(FESTE_ZEIT, 0.5) === beiHalb,
  'standErzeugen ist bei zweimal denselben Eingaben nicht deterministisch.',
);

const s1 = standErzeugen(FESTE_ZEIT, 0.1);
const s2 = standErzeugen(FESTE_ZEIT, 0.9);
pruefe(
  s1 === '2025-01-01T00:00:00.000Z-199999' && s2 === '2025-01-01T00:00:00.000Z-e66665',
  'standErzeugen liefert bei anderen Zufallswerten nicht die von Hand nachgerechneten Werte (' + s1 + ' / ' + s2 + ').',
);
pruefe(
  s1 !== s2,
  'Zwei Aufrufe in derselben Millisekunde mit unterschiedlichem Zufallswert liefern denselben Stand — zwei gleichzeitige Speichervorgaenge waeren dann nicht mehr unterscheidbar.',
);

/* ------------------------------------------------------------------ *
 * 8. Ein fehlendes Kopfdokument wirft, statt still etwas Halbes zu liefern
 *
 * Ohne das Kopfdokument fehlen project, version und die beiden Zeitstempel
 * spurlos. Ein Weltstand ohne sie waere kein Fehler, den man sieht — er
 * saehe nur aus wie eine leere, neue Welt. Deshalb muss hier ein Fehler
 * kommen, keine Attrappe.
 * ------------------------------------------------------------------ */

function wirftMitMeldung(aufruf) {
  try {
    aufruf();
    return { geworfen: false, meldung: '' };
  } catch (e) {
    return { geworfen: true, meldung: (e && e.message) || String(e) };
  }
}

for (const [beschreibung, eingabe] of [
  ['leeres Objekt', {}],
  ['leere Map', new Map()],
  ['null', null],
  ['undefined', undefined],
]) {
  const ergebnis = wirftMitMeldung(() => ausDokumenten(eingabe));
  pruefe(ergebnis.geworfen, 'ausDokumenten(' + beschreibung + ') wirft keinen Fehler bei fehlendem Kopfdokument — es kaeme ein unvollstaendiger Weltstand still zurueck.');
  pruefe(ergebnis.meldung.length > 0, 'ausDokumenten(' + beschreibung + ') wirft ohne verstaendliche Meldung.');
}

// Gegenprobe: Mit vorhandenem, aber sonst leerem Kopfdokument darf es NICHT
// werfen — sonst waeren die vier Fehler oben ein Zufallstreffer und keine
// echte Pruefung des Kopfdokuments.
const nurKopf = wirftMitMeldung(() => ausDokumenten({ [KOPF_DOKUMENT]: '{}' }));
pruefe(!nurKopf.geworfen, 'ausDokumenten mit vorhandenem, aber sonst leerem Kopfdokument wirft faelschlich (' + nurKopf.meldung + ').');

/* ------------------------------------------------------------------ *
 * Ergebnis
 * ------------------------------------------------------------------ */

if (fehler.length) {
  console.error('Firestore-Format-Pruefung fehlgeschlagen:\n- ' + fehler.join('\n- '));
  process.exitCode = 1;
} else {
  console.log('Age-of-Beast-Wiki – Firestore-Format geprueft');
  console.log('Pruefungen: ' + pruefungen);
  console.log(
    'Dokumente aus der echten Quelle: ' + dokumente.length
      + ', groesstes: „' + groesstesDokument.name + '" mit ' + (groesstesDokument.bytes / 1024).toFixed(1) + ' KB',
  );
  console.log('Ergebnis: Der Umlauf ist zeichengleich und inhaltlich verlustfrei, kein Dokument sprengt die Firestore-Grenze, Modulnamen, Pfade, REST-Hilfsfunktionen, Adressen und Stand verhalten sich wie erwartet.');
}
