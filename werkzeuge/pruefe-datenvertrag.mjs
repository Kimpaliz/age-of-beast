/**
 * Prüft den lesenden Datenvertrag des Age-of-Beast-Wikis.
 *
 * Der Prüfer liest ausschließlich die kanonische Legacy-v0-Quelle und den
 * separaten Rahmen-Descriptor. Er schreibt weder Rohdaten noch Ableitungen,
 * benutzt kein Netzwerk und legt keine temporären Dateien an.
 *
 * Neben dem echten Bestand werden bewusst isolierte Kopien verletzt. So
 * schützt dieser Test nicht nur vor einer versehentlichen grünen Zeichen-
 * suche: Jede Vertragsregel muss an einem echten Datenobjekt nachweisbar
 * fehlschlagen.
 *
 * Aufruf:
 *   node werkzeuge/pruefe-datenvertrag.mjs
 */

import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = dirname(fileURLToPath(import.meta.url));
const WURZEL = join(HIER, '..');
const QUELLE = join(WURZEL, 'daten', 'quelle.json');
const RAHMEN_DESCRIPTOR = join(WURZEL, 'daten', 'rahmen-felder.json');
const DATEN_WURZEL = realpathSync(join(WURZEL, 'daten'));

/* ------------------------------------------------------------------ *
 * Vertragliche Konstanten
 * ------------------------------------------------------------------ */

// Diese Liste entspricht der KATEGORIEN-Konstante in welt-umwandeln.mjs.
// places, events und lore sind dort bereits implementiert, obwohl Legacy-v0
// zurzeit nur sieben Kategorien tatsächlich belegt.
const BEKANNTE_KATEGORIEN = new Set([
  'wiki', 'factions', 'species', 'characters', 'items', 'places', 'events',
  'lore', 'werkstatt', 'regeln',
]);

// Nur diese Felder werden im Transformator als direkte Ziel-IDs behandelt.
// Leere optionale Werte bleiben in Legacy-v0 erlaubt und sind kein Verweis.
const REFERENZ_FELDER = new Set([
  'leaderId', 'headquartersPlaceId', 'factionId', 'locationId', 'ownerId',
  'residencePlaceId', 'species',
]);

// Diese zwei festen Kennungen gehören zur Weltenschmiede-Oberfläche, nicht
// zu customPanels. Sie sind daher in panelOrder zulässig.
const FESTE_PANEL_IDS = new Set(['core-connections', 'references']);

// Der Descriptor ist kein freier Weltinhalt. Die Pfade sind absichtlich
// vollständig festgeschrieben: Eine neue Frage benötigt eine bewusste
// Änderung des Assistenten, seiner Quelle und dieses Vertrags.
const RAHMEN_FELD_PFADE = new Set([
  'title',
  'tagline',
  'core/concept',
  'core/recurringActivity',
  'core/centralStakes',
  'pitch',
  'mood/tone',
  'mood/themes',
  'mood/touchstones',
  'overview/before',
  'overview/change',
  'overview/today',
  'overview/forces',
  'overview/charactersMatter',
  'engine/recurringSituation',
  'engine/risingPressure',
  'engine/meaningfulChoices',
  'engine/consequences',
  'characterHooks/sharedReason',
  'characterHooks/ancestryNotes',
  'characterHooks/communityNotes',
  'characterHooks/classNotes',
  'characterHooks/creationQuestions',
  'opening/location',
  'opening/situation',
  'opening/importantNpc',
  'opening/immediateProblem',
  'opening/firstGoal',
  'optionalMechanic/name',
  'optionalMechanic/trigger',
  'optionalMechanic/effect',
  'optionalMechanic/tracking',
  'finalNotes',
]);

const RAHMEN_LISTEN_PFADE = new Map([
  ['distinctions', new Set(['name', 'description', 'everydayImpact'])],
  ['factions', new Set(['name', 'goal', 'leverage', 'relationship'])],
]);

const RAHMEN_SCHRITTE = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]);
const RAHMEN_LISTEN_SCHRITT = new Map([['distinctions', 5], ['factions', 6]]);
const RAHMEN_FELD_ARTEN = new Set(['zeile', 'absatz']);

const istObjekt = (wert) => wert !== null && typeof wert === 'object' && !Array.isArray(wert);
const istText = (wert) => typeof wert === 'string' && wert.trim().length > 0;
const kopieren = (wert) => JSON.parse(JSON.stringify(wert));

function neueBilanz() {
  return {
    pruefungen: 0,
    eintraege: 0,
    rahmen: 0,
    kategorien: 0,
    panel: 0,
    attributeZeilen: 0,
    direkteReferenzen: 0,
    verbindungen: 0,
    textLinks: 0,
    bilder: 0,
    descriptorFelder: 0,
    descriptorListen: 0,
  };
}

function fordere(fehler, bilanz, bedingung, code, text) {
  bilanz.pruefungen += 1;
  if (!bedingung) fehler.push({ code, text });
  return bedingung;
}

function liegtInnerhalb(wurzel, ziel) {
  const rest = relative(wurzel, ziel);
  return rest === '' || (!rest.startsWith('..') && !rest.includes(':'));
}

/**
 * Dekodiert höchstens viermal, damit auch doppelt URL-kodierte Traversals
 * erkannt werden. Ein Pfad, der mehr Runden braucht, ist kein normaler
 * lokaler Asset-Pfad und wird vorsichtshalber abgewiesen.
 */
function mehrfachDekodieren(text) {
  let wert = text;
  for (let runde = 0; runde < 4; runde += 1) {
    let dekodiert;
    try {
      dekodiert = decodeURIComponent(wert);
    } catch {
      return null;
    }
    if (dekodiert === wert) return wert;
    wert = dekodiert;
  }
  try {
    return decodeURIComponent(wert) === wert ? wert : null;
  } catch {
    return null;
  }
}

/**
 * Prüft Syntax und reale Zielauflösung eines Bildpfads.
 *
 * Hier wird nicht nur nach "../" gesucht: Backslashes, mehrfach URL-kodierte
 * Formen, Query/Fragment und Symlinks außerhalb von daten/ werden ebenfalls
 * abgewiesen. Damit bleibt der Browser bei lokalen Repository-Dateien.
 */
function bildPruefen(pfad) {
  if (!istText(pfad)) return { ok: false, grund: 'ist kein nichtleerer Text' };

  const roh = pfad.trim();
  const dekodiert = mehrfachDekodieren(roh);
  if (dekodiert === null) return { ok: false, grund: 'enthält ungültige oder zu tief verschachtelte URL-Kodierung' };
  if (!roh.startsWith('daten/') || !dekodiert.startsWith('daten/')) {
    return { ok: false, grund: 'beginnt nicht mit daten/' };
  }
  if (/[\\\u0000?#]/u.test(roh) || /[\\\u0000?#]/u.test(dekodiert)) {
    return { ok: false, grund: 'enthält Windows-Trenner, Steuerzeichen, Query oder Fragment' };
  }

  const teile = dekodiert.split('/');
  if (teile.some((teil) => teil === '.' || teil === '..')) {
    return { ok: false, grund: 'enthält einen .- oder ..-Pfadteil' };
  }

  const absolut = resolve(WURZEL, ...teile);
  if (!liegtInnerhalb(DATEN_WURZEL, absolut)) {
    return { ok: false, grund: 'verlässt daten/ nach der Auflösung' };
  }
  if (!existsSync(absolut)) return { ok: false, grund: 'zeigt auf keine vorhandene lokale Datei' };

  try {
    if (!liegtInnerhalb(DATEN_WURZEL, realpathSync(absolut))) {
      return { ok: false, grund: 'folgt einem Link außerhalb von daten/' };
    }
  } catch {
    return { ok: false, grund: 'lässt sich nicht sicher auflösen' };
  }

  return { ok: true };
}

function eintragPruefen(ort, element, fehler, bilanz) {
  const panelIds = new Set();
  const hatPanels = Object.hasOwn(element, 'customPanels');

  // Legacy-v0 kennt Einträge ohne Panels. Sobald customPanels vorhanden ist,
  // verlangt der Transformator jedoch echte, eindeutige Panel-IDs.
  if (hatPanels) {
    const panelsSindArray = fordere(
      fehler, bilanz, Array.isArray(element.customPanels), 'panels-kein-array',
      ort + '.customPanels muss ein Array sein.',
    );
    if (panelsSindArray) {
      for (const [index, panel] of element.customPanels.entries()) {
        bilanz.panel += 1;
        const panelOrt = ort + '.customPanels[' + index + ']';
        if (!fordere(fehler, bilanz, istObjekt(panel), 'panel-kein-objekt', panelOrt + ' muss ein Objekt sein.')) continue;
        const idGueltig = fordere(
          fehler, bilanz, istText(panel.id), 'panel-id-fehlt', panelOrt + '.id fehlt oder ist leer.',
        );
        if (!idGueltig) continue;
        fordere(
          fehler, bilanz, !panelIds.has(panel.id), 'panel-id-doppelt',
          panelOrt + '.id „' + panel.id + '“ kommt im selben Eintrag mehrfach vor.',
        );
        panelIds.add(panel.id);
      }
    }
  }

  // panelOrder ist in Legacy-v0 optional. Ist es vorhanden, darf es nur
  // eigene Panels oder die zwei festen Weltenschmiede-Panels enthalten.
  if (Object.hasOwn(element, 'panelOrder')) {
    const reihenfolgeIstArray = fordere(
      fehler, bilanz, Array.isArray(element.panelOrder), 'panelorder-kein-array',
      ort + '.panelOrder muss ein Array sein.',
    );
    if (reihenfolgeIstArray) {
      const erlaubte = new Set([...FESTE_PANEL_IDS, ...panelIds]);
      const gesehen = new Set();
      for (const [index, panelId] of element.panelOrder.entries()) {
        const reihenfolgeOrt = ort + '.panelOrder[' + index + ']';
        const idGueltig = fordere(
          fehler, bilanz, istText(panelId), 'panelorder-id-fehlt', reihenfolgeOrt + ' muss eine Panel-ID enthalten.',
        );
        if (!idGueltig) continue;
        fordere(
          fehler, bilanz, !gesehen.has(panelId), 'panelorder-id-doppelt',
          reihenfolgeOrt + ' enthält die Panel-ID „' + panelId + '“ mehrfach.',
        );
        fordere(
          fehler, bilanz, erlaubte.has(panelId), 'panelorder-id-nicht-erlaubt',
          reihenfolgeOrt + ' verweist auf das unbekannte Panel „' + panelId + '“.',
        );
        gesehen.add(panelId);
      }
      for (const panelId of panelIds) {
        fordere(
          fehler, bilanz, gesehen.has(panelId), 'panelorder-panel-fehlt',
          ort + '.panelOrder enthält das eigene Panel „' + panelId + '“ nicht.',
        );
      }
    }
  }

  // attributeRows und fields sind ebenfalls optionales Legacy-Format. Jede
  // tatsächlich vorhandene Zeile muss aber auf einen echten fields-Schlüssel
  // zeigen, sonst kann die Bearbeitungsoberfläche nicht zurückschreiben.
  if (Object.hasOwn(element, 'attributeRows')) {
    const zeilenSindArray = fordere(
      fehler, bilanz, Array.isArray(element.attributeRows), 'attributezeilen-kein-array',
      ort + '.attributeRows muss ein Array sein.',
    );
    const felder = istObjekt(element.fields) ? element.fields : {};
    const schluessel = new Set();
    if (zeilenSindArray) {
      for (const [index, zeile] of element.attributeRows.entries()) {
        bilanz.attributeZeilen += 1;
        const zeilenOrt = ort + '.attributeRows[' + index + ']';
        if (!fordere(fehler, bilanz, istObjekt(zeile), 'attributezeile-kein-objekt', zeilenOrt + ' muss ein Objekt sein.')) continue;
        const keyGueltig = fordere(
          fehler, bilanz, istText(zeile.key), 'attributezeile-key-fehlt', zeilenOrt + '.key fehlt oder ist leer.',
        );
        if (!keyGueltig) continue;
        fordere(
          fehler, bilanz, !schluessel.has(zeile.key), 'attributezeile-key-doppelt',
          zeilenOrt + '.key „' + zeile.key + '“ kommt mehrfach vor.',
        );
        fordere(
          fehler, bilanz, Object.hasOwn(felder, zeile.key), 'attributefeld-fehlt',
          zeilenOrt + '.key „' + zeile.key + '“ besitzt keinen passenden fields-Eintrag.',
        );
        schluessel.add(zeile.key);
      }
    }
  }

  if (Object.hasOwn(element, 'image') && element.image !== '' && element.image !== null && element.image !== undefined) {
    bilanz.bilder += 1;
    const ergebnis = bildPruefen(element.image);
    fordere(
      fehler, bilanz, ergebnis.ok, 'bildpfad-unsicher',
      ort + '.image „' + String(element.image) + '“ ist kein sicherer lokaler Pfad unter daten/: ' + ergebnis.grund + '.',
    );
  }
}

function referenzenPruefen(ort, element, globaleIds, fehler, bilanz) {
  const felder = istObjekt(element.fields) ? element.fields : {};

  for (const schluessel of REFERENZ_FELDER) {
    if (!Object.hasOwn(felder, schluessel) || !istText(felder[schluessel])) continue;
    bilanz.direkteReferenzen += 1;
    fordere(
      fehler, bilanz, globaleIds.has(felder[schluessel]), 'referenz-fehlt',
      ort + '.fields.' + schluessel + ' verweist auf die unbekannte ID „' + felder[schluessel] + '“.',
    );
  }

  // connections ist im Transformator nur dann eine Verbindungsliste, wenn
  // das Feld vorhanden ist. Jede echte Zeile benötigt eine gültige targetId.
  if (Object.hasOwn(felder, 'connections')) {
    const verbindungenSindArray = fordere(
      fehler, bilanz, Array.isArray(felder.connections), 'connections-kein-array',
      ort + '.fields.connections muss ein Array sein.',
    );
    if (verbindungenSindArray) {
      for (const [index, verbindung] of felder.connections.entries()) {
        bilanz.verbindungen += 1;
        const verbindungsOrt = ort + '.fields.connections[' + index + ']';
        if (!fordere(fehler, bilanz, istObjekt(verbindung), 'connection-kein-objekt', verbindungsOrt + ' muss ein Objekt sein.')) continue;
        const zielGueltig = fordere(
          fehler, bilanz, istText(verbindung.targetId), 'connection-ziel-fehlt',
          verbindungsOrt + '.targetId fehlt oder ist leer.',
        );
        if (!zielGueltig) continue;
        fordere(
          fehler, bilanz, globaleIds.has(verbindung.targetId), 'connection-ziel-fehlt',
          verbindungsOrt + '.targetId verweist auf die unbekannte ID „' + verbindung.targetId + '“.',
        );
      }
    }
  }

  // textLinks stammt aus der Weltenschmiede. Nur nichtleere .id-Werte sind
  // Referenzen; sonstige Legacy-Metadaten in einem Link-Objekt bleiben frei.
  if (Object.hasOwn(element, 'textLinks')) {
    const linksSindObjekt = fordere(
      fehler, bilanz, istObjekt(element.textLinks), 'textlinks-kein-objekt',
      ort + '.textLinks muss ein Objekt sein.',
    );
    if (linksSindObjekt) {
      for (const [begriff, verweis] of Object.entries(element.textLinks)) {
        if (!istObjekt(verweis) || !istText(verweis.id)) continue;
        bilanz.textLinks += 1;
        fordere(
          fehler, bilanz, globaleIds.has(verweis.id), 'textlink-ziel-fehlt',
          ort + '.textLinks.' + begriff + '.id verweist auf die unbekannte ID „' + verweis.id + '“.',
        );
      }
    }
  }
}

function rahmenDescriptorPruefen(descriptor, fehler, bilanz) {
  if (!fordere(fehler, bilanz, istObjekt(descriptor), 'descriptor-kein-objekt', 'daten/rahmen-felder.json muss ein Objekt sein.')) return;

  // Legacy-v0 besitzt noch keine descriptorVersion. Seine eigene, reale
  // Versionskennung ist der vom Leser erzeugte Zeitstempel gelesenAm. Eine
  // neue numerische Versionspflicht würde hier eine nicht vorhandene Struktur
  // erfinden und ist deshalb bewusst nicht Teil dieses Wächters.
  fordere(
    fehler, bilanz,
    istText(descriptor.gelesenAm) && Number.isFinite(Date.parse(descriptor.gelesenAm)),
    'descriptor-kennung-fehlt',
    'daten/rahmen-felder.json benötigt in Legacy-v0 die gültige eigene Lesekennung „gelesenAm“.',
  );

  const schritteSindArray = fordere(
    fehler, bilanz, Array.isArray(descriptor.schritte), 'descriptor-schritte-kein-array',
    'daten/rahmen-felder.json.schritte muss ein Array sein.',
  );
  const schrittNummern = new Set();
  if (schritteSindArray) {
    for (const [index, schritt] of descriptor.schritte.entries()) {
      const ort = 'daten/rahmen-felder.json.schritte[' + index + ']';
      if (!fordere(fehler, bilanz, istObjekt(schritt), 'descriptor-schritt-kein-objekt', ort + ' muss ein Objekt sein.')) continue;
      const nummerGueltig = fordere(
        fehler, bilanz, RAHMEN_SCHRITTE.has(schritt.nummer), 'descriptor-schritt-nicht-erlaubt',
        ort + '.nummer „' + String(schritt.nummer) + '“ ist nicht in der Schritt-Allowlist 1 bis 9.',
      );
      if (!nummerGueltig) continue;
      fordere(
        fehler, bilanz, !schrittNummern.has(schritt.nummer), 'descriptor-schritt-doppelt',
        ort + '.nummer „' + schritt.nummer + '“ kommt mehrfach vor.',
      );
      schrittNummern.add(schritt.nummer);
    }
  }
  for (const nummer of RAHMEN_SCHRITTE) {
    fordere(
      fehler, bilanz, schrittNummern.has(nummer), 'descriptor-schritt-fehlt',
      'daten/rahmen-felder.json enthält den erwarteten Schritt ' + nummer + ' nicht.',
    );
  }

  const felderSindArray = fordere(
    fehler, bilanz, Array.isArray(descriptor.felder), 'descriptor-felder-kein-array',
    'daten/rahmen-felder.json.felder muss ein Array sein.',
  );
  const feldPfade = new Set();
  if (felderSindArray) {
    for (const [index, feld] of descriptor.felder.entries()) {
      bilanz.descriptorFelder += 1;
      const ort = 'daten/rahmen-felder.json.felder[' + index + ']';
      if (!fordere(fehler, bilanz, istObjekt(feld), 'descriptor-feld-kein-objekt', ort + ' muss ein Objekt sein.')) continue;
      const pfadGueltig = fordere(
        fehler, bilanz, istText(feld.pfad) && RAHMEN_FELD_PFADE.has(feld.pfad), 'descriptor-pfad-nicht-erlaubt',
        ort + '.pfad „' + String(feld.pfad) + '“ ist nicht in der Rahmen-Pfad-Allowlist.',
      );
      if (pfadGueltig) {
        fordere(
          fehler, bilanz, !feldPfade.has(feld.pfad), 'descriptor-pfad-doppelt',
          ort + '.pfad „' + feld.pfad + '“ kommt mehrfach vor.',
        );
        feldPfade.add(feld.pfad);
      }
      fordere(
        fehler, bilanz, RAHMEN_SCHRITTE.has(feld.schritt), 'descriptor-feld-schritt-nicht-erlaubt',
        ort + '.schritt „' + String(feld.schritt) + '“ ist nicht in der Schritt-Allowlist.',
      );
      fordere(
        fehler, bilanz, RAHMEN_FELD_ARTEN.has(feld.art), 'descriptor-feld-art-nicht-erlaubt',
        ort + '.art „' + String(feld.art) + '“ ist weder zeile noch absatz.',
      );
    }
  }
  for (const pfad of RAHMEN_FELD_PFADE) {
    fordere(
      fehler, bilanz, feldPfade.has(pfad), 'descriptor-pfad-fehlt',
      'daten/rahmen-felder.json enthält den erwarteten Feldpfad „' + pfad + '“ nicht.',
    );
  }

  const listenSindArray = fordere(
    fehler, bilanz, Array.isArray(descriptor.listen), 'descriptor-listen-kein-array',
    'daten/rahmen-felder.json.listen muss ein Array sein.',
  );
  const listenPfade = new Set();
  if (listenSindArray) {
    for (const [index, liste] of descriptor.listen.entries()) {
      bilanz.descriptorListen += 1;
      const ort = 'daten/rahmen-felder.json.listen[' + index + ']';
      if (!fordere(fehler, bilanz, istObjekt(liste), 'descriptor-liste-kein-objekt', ort + ' muss ein Objekt sein.')) continue;
      const pfadGueltig = fordere(
        fehler, bilanz, istText(liste.pfad) && RAHMEN_LISTEN_PFADE.has(liste.pfad), 'descriptor-listenpfad-nicht-erlaubt',
        ort + '.pfad „' + String(liste.pfad) + '“ ist nicht in der Listen-Pfad-Allowlist.',
      );
      if (pfadGueltig) {
        fordere(
          fehler, bilanz, !listenPfade.has(liste.pfad), 'descriptor-listenpfad-doppelt',
          ort + '.pfad „' + liste.pfad + '“ kommt mehrfach vor.',
        );
        listenPfade.add(liste.pfad);
        fordere(
          fehler, bilanz, liste.schritt === RAHMEN_LISTEN_SCHRITT.get(liste.pfad), 'descriptor-liste-schritt-falsch',
          ort + '.schritt gehört nicht zum Listenpfad „' + liste.pfad + '“.',
        );
      }

      const listenFelderSindArray = fordere(
        fehler, bilanz, Array.isArray(liste.felder), 'descriptor-listenfelder-kein-array',
        ort + '.felder muss ein Array sein.',
      );
      if (!listenFelderSindArray || !pfadGueltig) continue;
      const erlaubteFelder = RAHMEN_LISTEN_PFADE.get(liste.pfad);
      const feldSchluessel = new Set();
      for (const [feldIndex, feld] of liste.felder.entries()) {
        const feldOrt = ort + '.felder[' + feldIndex + ']';
        if (!fordere(fehler, bilanz, istObjekt(feld), 'descriptor-listenfeld-kein-objekt', feldOrt + ' muss ein Objekt sein.')) continue;
        const schluesselGueltig = fordere(
          fehler, bilanz, istText(feld.schluessel) && erlaubteFelder.has(feld.schluessel), 'descriptor-listenfeld-nicht-erlaubt',
          feldOrt + '.schluessel „' + String(feld.schluessel) + '“ ist nicht für „' + liste.pfad + '“ erlaubt.',
        );
        if (!schluesselGueltig) continue;
        fordere(
          fehler, bilanz, !feldSchluessel.has(feld.schluessel), 'descriptor-listenfeld-doppelt',
          feldOrt + '.schluessel „' + feld.schluessel + '“ kommt mehrfach vor.',
        );
        feldSchluessel.add(feld.schluessel);
      }
      for (const schluessel of erlaubteFelder) {
        fordere(
          fehler, bilanz, feldSchluessel.has(schluessel), 'descriptor-listenfeld-fehlt',
          ort + '.felder enthält den erwarteten Schlüssel „' + schluessel + '“ nicht.',
        );
      }
    }
  }
  for (const pfad of RAHMEN_LISTEN_PFADE.keys()) {
    fordere(
      fehler, bilanz, listenPfade.has(pfad), 'descriptor-listenpfad-fehlt',
      'daten/rahmen-felder.json enthält die erwartete Liste „' + pfad + '“ nicht.',
    );
  }
}

/** Prüft eine Rohdaten-/Descriptor-Kopie vollständig, ohne sie zu ändern. */
function datenvertragPruefen(roh, descriptor) {
  const fehler = [];
  const bilanz = neueBilanz();
  const alleElemente = [];
  const globaleIds = new Map();

  const rohGueltig = fordere(
    fehler, bilanz, istObjekt(roh), 'quelle-kein-objekt', 'daten/quelle.json muss ein Objekt sein.',
  );
  const elementeGueltig = rohGueltig && fordere(
    fehler, bilanz, istObjekt(roh.elements), 'elements-kein-objekt',
    'daten/quelle.json.elements muss ein Objekt sein.',
  );
  const elemente = elementeGueltig ? roh.elements : {};

  const idEintragen = (id, ort) => {
    if (!istText(id)) return;
    const vorher = globaleIds.get(id);
    fordere(
      fehler, bilanz, !vorher, 'id-doppelt',
      'Die globale ID „' + id + '“ kommt mehrfach vor: ' + vorher + ' und ' + ort + '.',
    );
    if (!vorher) globaleIds.set(id, ort);
  };

  for (const [kategorie, gruppe] of Object.entries(elemente)) {
    bilanz.kategorien += 1;
    fordere(
      fehler, bilanz, BEKANNTE_KATEGORIEN.has(kategorie), 'kategorie-unbekannt',
      'elements.' + kategorie + ' ist keine dem Transformator bekannte Kategorie.',
    );
    if (!fordere(fehler, bilanz, istObjekt(gruppe), 'kategorie-kein-objekt', 'elements.' + kategorie + ' muss ein Objekt sein.')) continue;

    for (const [mapKey, element] of Object.entries(gruppe)) {
      const ort = 'elements.' + kategorie + '.' + mapKey;
      if (!fordere(fehler, bilanz, istObjekt(element), 'element-kein-objekt', ort + ' muss ein Objekt sein.')) continue;
      bilanz.eintraege += 1;
      const idGueltig = fordere(
        fehler, bilanz, istText(element.id), 'element-id-fehlt', ort + '.id fehlt oder ist leer.',
      );
      if (idGueltig) {
        fordere(
          fehler, bilanz, element.id === mapKey, 'element-id-stimmt-nicht',
          ort + '.id ist „' + element.id + '“, muss aber dem Map-Schlüssel „' + mapKey + '“ entsprechen.',
        );
        idEintragen(element.id, ort);
      }
      eintragPruefen(ort, element, fehler, bilanz);
      alleElemente.push({ ort, element });
    }
  }

  // rahmen ist in der aktuellen Quelle vorhanden, aber ein leerer oder
  // fehlender Rahmenbestand bleibt für Legacy-v0 erlaubt. Wenn der Knoten
  // existiert, muss jede Rahmen-ID jedoch eindeutig und selbstkonsistent sein.
  const rahmenVorhanden = rohGueltig && Object.hasOwn(roh, 'rahmen');
  const rahmenGueltig = !rahmenVorhanden || fordere(
    fehler, bilanz, istObjekt(roh.rahmen), 'rahmen-kein-objekt',
    'daten/quelle.json.rahmen muss ein Objekt sein.',
  );
  const rahmen = rahmenVorhanden && rahmenGueltig ? roh.rahmen : {};
  const werkstattIds = new Set(Object.values(elemente.werkstatt || {}).map((element) => element?.id).filter(istText));

  for (const [mapKey, rahmenEintrag] of Object.entries(rahmen)) {
    const ort = 'rahmen.' + mapKey;
    if (!fordere(fehler, bilanz, istObjekt(rahmenEintrag), 'rahmen-eintrag-kein-objekt', ort + ' muss ein Objekt sein.')) continue;
    bilanz.rahmen += 1;
    const idGueltig = fordere(
      fehler, bilanz, istText(rahmenEintrag.id), 'rahmen-id-fehlt', ort + '.id fehlt oder ist leer.',
    );
    if (!idGueltig) continue;
    fordere(
      fehler, bilanz, rahmenEintrag.id === mapKey, 'rahmen-id-stimmt-nicht',
      ort + '.id ist „' + rahmenEintrag.id + '“, muss aber dem Map-Schlüssel „' + mapKey + '“ entsprechen.',
    );
    idEintragen(rahmenEintrag.id, ort);
    fordere(
      fehler, bilanz, !werkstattIds.has(rahmenEintrag.id), 'rahmen-werkstatt-kollision',
      ort + '.id „' + rahmenEintrag.id + '“ würde einen vorhandenen elements.werkstatt-Eintrag verdrängen.',
    );
  }

  for (const { ort, element } of alleElemente) {
    referenzenPruefen(ort, element, globaleIds, fehler, bilanz);
  }

  rahmenDescriptorPruefen(descriptor, fehler, bilanz);
  return { fehler, bilanz };
}

function ersteElementReferenz(roh, bedingung, beschreibung) {
  for (const [kategorie, gruppe] of Object.entries(roh.elements || {})) {
    for (const [id, element] of Object.entries(gruppe || {})) {
      if (bedingung(element, kategorie, id)) return { kategorie, id, element };
    }
  }
  throw new Error('Die Mutationsprobe benötigt ' + beschreibung + ', fand aber keinen passenden echten Eintrag.');
}

function ersterRahmen(roh) {
  const treffer = Object.entries(roh.rahmen || {})[0];
  if (!treffer) throw new Error('Die Mutationsprobe benötigt einen echten Rahmen, fand aber keinen.');
  return { id: treffer[0], rahmen: treffer[1] };
}

function mutationPruefen(roh, descriptor, name, erwarteterCode, mutieren) {
  const rohKopie = kopieren(roh);
  const descriptorKopie = kopieren(descriptor);
  mutieren(rohKopie, descriptorKopie);
  const ergebnis = datenvertragPruefen(rohKopie, descriptorKopie);
  const entdeckt = ergebnis.fehler.some((fehler) => fehler.code === erwarteterCode);
  return {
    name,
    erwarteterCode,
    entdeckt,
    bilanz: ergebnis.bilanz,
    fehler: ergebnis.fehler,
  };
}

function dateiLesen(pfad, name) {
  try {
    return JSON.parse(readFileSync(pfad, 'utf8'));
  } catch (fehler) {
    throw new Error(name + ' lässt sich nicht als JSON lesen: ' + fehler.message);
  }
}

function ausfuehren() {
  const roh = dateiLesen(QUELLE, 'daten/quelle.json');
  const descriptor = dateiLesen(RAHMEN_DESCRIPTOR, 'daten/rahmen-felder.json');
  const basis = datenvertragPruefen(roh, descriptor);

  const mutatione = [
    {
      name: 'Map-Schlüssel und element.id weichen ab',
      code: 'element-id-stimmt-nicht',
      mutieren: (kopie) => {
        const ziel = ersteElementReferenz(kopie, () => true, 'einen Roh-Eintrag');
        kopie.elements[ziel.kategorie][ziel.id].id = 'id-vertragsbruch-map-schluessel';
      },
    },
    {
      name: 'Rahmen-ID kollidiert global mit einem Wiki-Eintrag',
      code: 'id-doppelt',
      mutieren: (kopie) => {
        const rahmen = ersterRahmen(kopie);
        const wiki = ersteElementReferenz(kopie, (_element, kategorie) => kategorie === 'wiki', 'einen Wiki-Eintrag');
        kopie.rahmen[rahmen.id].id = wiki.element.id;
      },
    },
    {
      name: 'Unbekannte Kategorie',
      code: 'kategorie-unbekannt',
      mutieren: (kopie) => {
        kopie.elements.unbekannt = {};
      },
    },
    {
      name: 'Doppelte Panel-ID',
      code: 'panel-id-doppelt',
      mutieren: (kopie) => {
        const ziel = ersteElementReferenz(kopie, (element) => Array.isArray(element.customPanels) && element.customPanels.length >= 2, 'einen Eintrag mit zwei Panels');
        const panels = kopie.elements[ziel.kategorie][ziel.id].customPanels;
        panels[1].id = panels[0].id;
      },
    },
    {
      name: 'panelOrder verweist auf ein fremdes Panel',
      code: 'panelorder-id-nicht-erlaubt',
      mutieren: (kopie) => {
        const ziel = ersteElementReferenz(kopie, (element) => Array.isArray(element.panelOrder), 'einen Eintrag mit panelOrder');
        kopie.elements[ziel.kategorie][ziel.id].panelOrder.push('panel-vertragsbruch-fremd');
      },
    },
    {
      name: 'Attributzeile ohne fields-Eintrag',
      code: 'attributefeld-fehlt',
      mutieren: (kopie) => {
        const ziel = ersteElementReferenz(kopie, (element) => Array.isArray(element.attributeRows) && element.attributeRows.length > 0, 'einen Eintrag mit Attributzeile');
        const element = kopie.elements[ziel.kategorie][ziel.id];
        delete element.fields[element.attributeRows[0].key];
      },
    },
    {
      name: 'Direkte Referenz auf unbekannte ID',
      code: 'referenz-fehlt',
      mutieren: (kopie) => {
        const ziel = ersteElementReferenz(
          kopie,
          (element) => istObjekt(element.fields) && Object.hasOwn(element.fields, 'factionId'),
          'einen Eintrag mit factionId',
        );
        kopie.elements[ziel.kategorie][ziel.id].fields.factionId = 'id-vertragsbruch-unbekannt';
      },
    },
    {
      name: 'connections.targetId verweist auf unbekannte ID',
      code: 'connection-ziel-fehlt',
      mutieren: (kopie) => {
        const ziel = ersteElementReferenz(
          kopie,
          (element) => Array.isArray(element.fields?.connections) && element.fields.connections.length > 0,
          'einen Eintrag mit Verbindung',
        );
        kopie.elements[ziel.kategorie][ziel.id].fields.connections[0].targetId = 'id-vertragsbruch-verbindung';
      },
    },
    {
      name: 'textLinks-Referenz verweist auf unbekannte ID',
      code: 'textlink-ziel-fehlt',
      mutieren: (kopie) => {
        const ziel = ersteElementReferenz(
          kopie,
          (element) => istObjekt(element.textLinks) && Object.keys(element.textLinks).length > 0,
          'einen Eintrag mit textLinks',
        );
        const [begriff] = Object.keys(kopie.elements[ziel.kategorie][ziel.id].textLinks);
        kopie.elements[ziel.kategorie][ziel.id].textLinks[begriff].id = 'id-vertragsbruch-textlink';
      },
    },
    {
      name: 'Bildpfad mit ../-Traversal',
      code: 'bildpfad-unsicher',
      mutieren: (kopie) => {
        const ziel = ersteElementReferenz(kopie, (element) => istText(element.image), 'einen Eintrag mit Bild');
        kopie.elements[ziel.kategorie][ziel.id].image = 'daten/../ausserhalb.svg';
      },
    },
    {
      name: 'Bildpfad mit Windows-Traversal',
      code: 'bildpfad-unsicher',
      mutieren: (kopie) => {
        const ziel = ersteElementReferenz(kopie, (element) => istText(element.image), 'einen Eintrag mit Bild');
        kopie.elements[ziel.kategorie][ziel.id].image = 'daten\\..\\ausserhalb.svg';
      },
    },
    {
      name: 'Bildpfad mit doppelt URL-kodiertem Traversal',
      code: 'bildpfad-unsicher',
      mutieren: (kopie) => {
        const ziel = ersteElementReferenz(kopie, (element) => istText(element.image), 'einen Eintrag mit Bild');
        kopie.elements[ziel.kategorie][ziel.id].image = 'daten/%252e%252e/ausserhalb.svg';
      },
    },
    {
      name: 'Rahmen verdrängt Werkstatt-Eintrag',
      code: 'rahmen-werkstatt-kollision',
      mutieren: (kopie) => {
        const rahmen = ersterRahmen(kopie);
        const werkstatt = ersteElementReferenz(kopie, (_element, kategorie) => kategorie === 'werkstatt', 'einen Werkstatt-Eintrag');
        kopie.rahmen[rahmen.id].id = werkstatt.element.id;
      },
    },
    {
      name: 'Legacy-Descriptor ohne eigene Lesekennung',
      code: 'descriptor-kennung-fehlt',
      mutieren: (_kopie, descriptorKopie) => {
        delete descriptorKopie.gelesenAm;
      },
    },
    {
      name: 'Rahmen-Feldpfad außerhalb der Allowlist',
      code: 'descriptor-pfad-nicht-erlaubt',
      mutieren: (_kopie, descriptorKopie) => {
        descriptorKopie.felder[0].pfad = 'core/../../vertragsbruch';
      },
    },
    {
      name: 'Rahmen-Listenpfad außerhalb der Allowlist',
      code: 'descriptor-listenpfad-nicht-erlaubt',
      mutieren: (_kopie, descriptorKopie) => {
        descriptorKopie.listen[0].pfad = '__proto__';
      },
    },
  ];

  const mutationsergebnisse = mutatione.map((mutation) =>
    mutationPruefen(roh, descriptor, mutation.name, mutation.code, mutation.mutieren),
  );
  const mutationsfehler = mutationsergebnisse.filter((ergebnis) => !ergebnis.entdeckt);
  const mutationspruefungen = mutationsergebnisse.reduce(
    (summe, ergebnis) => summe + ergebnis.bilanz.pruefungen + 1,
    0,
  );

  console.log('Age-of-Beast-Wiki – Datenvertrag geprüft');
  console.log('-----------------------------------------');
  console.log('Modus:                 Legacy-v0, rein lesend');
  console.log('Roh-Einträge:          ' + basis.bilanz.eintraege);
  console.log('Rahmen:                 ' + basis.bilanz.rahmen);
  console.log('Belegte Kategorien:     ' + basis.bilanz.kategorien);
  console.log('Panel:                  ' + basis.bilanz.panel);
  console.log('Attributzeilen:         ' + basis.bilanz.attributeZeilen);
  console.log('Direkte Referenzen:     ' + basis.bilanz.direkteReferenzen);
  console.log('Verbindungen:           ' + basis.bilanz.verbindungen);
  console.log('textLinks-Referenzen:   ' + basis.bilanz.textLinks);
  console.log('Lokale Bilder:          ' + basis.bilanz.bilder);
  console.log('Descriptor-Felder:      ' + basis.bilanz.descriptorFelder);
  console.log('Descriptor-Listen:      ' + basis.bilanz.descriptorListen);
  console.log('Basisprüfungen:         ' + basis.bilanz.pruefungen);
  console.log('Mutationsproben:        ' + mutationsergebnisse.length);
  console.log('Prüfungen über alle Läufe: ' + (basis.bilanz.pruefungen + mutationspruefungen));

  if (!basis.fehler.length && !mutationsfehler.length) {
    console.log('');
    console.log('Alles in Ordnung:');
    console.log('  - Der reale Legacy-v0-Bestand erfüllt alle Datenvertragsregeln.');
    console.log('  - Jede der ' + mutationsergebnisse.length + ' isolierten Vertragsverletzungen wurde erkannt.');
    console.log('  - datenvertragVersion wird weder verlangt noch geschrieben.');
    return 0;
  }

  if (basis.fehler.length) {
    console.error('');
    console.error('FEHLER im realen Bestand: ' + basis.fehler.length + ' Beanstandung(en).');
    for (const fehler of basis.fehler) console.error('  [' + fehler.code + '] ' + fehler.text);
  }
  if (mutationsfehler.length) {
    console.error('');
    console.error('FEHLER in Mutationsproben: ' + mutationsfehler.length + ' Regel(n) wurden nicht erkannt.');
    for (const ergebnis of mutationsfehler) {
      console.error('  ' + ergebnis.name + ' hätte [' + ergebnis.erwarteterCode + '] auslösen müssen.');
      for (const fehler of ergebnis.fehler.slice(0, 3)) console.error('    tatsächlich: [' + fehler.code + '] ' + fehler.text);
    }
  }
  return 1;
}

try {
  process.exitCode = ausfuehren();
} catch (fehler) {
  console.error('Datenvertragsprüfung konnte nicht ausgeführt werden: ' + fehler.message);
  process.exitCode = 1;
}
