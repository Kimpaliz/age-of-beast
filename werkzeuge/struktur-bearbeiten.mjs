/**
 * [Aufgabe: Bearbeiten]
 * Ändert den Aufbau eines Eintrags: Abschnitte und Steckbriefzeilen
 * anlegen, löschen und umsortieren.
 *
 * Während `bearbeiten-stellen.mjs` einen vorhandenen Text an seiner Stelle
 * ersetzt, verändern die Funktionen hier die Struktur darum herum. Beide
 * liefern dasselbe Ergebnis: eine Zuordnung von Pfad auf neuen Wert, die
 * `bearbeiten.js` in einem Rutsch in den Weltstand einträgt.
 *
 * Reine Logik: kein DOM, kein Dateizugriff, keine Node-Bausteine. Dadurch
 * läuft dasselbe Modul im Browser und in `pruefe-struktur.mjs`.
 *
 * Drei Eigenheiten der Weltenschmiede, die hier beachtet werden müssen:
 *
 *   1. `customPanels` ist die Ablage, `panelOrder` die Anzeigereihenfolge.
 *      Ein neuer Abschnitt muss in beide.
 *   2. `panelOrder` enthält auch feste Panels wie `core-connections`, die
 *      gar nicht in `customPanels` stehen. Sie dürfen nie verlorengehen.
 *   3. Eine Steckbriefzeile besteht aus zwei Teilen: der Beschriftung in
 *      `attributeRows` und dem Wert in `fields`. Beide gehören zusammen.
 */

/** Panels, die die Weltenschmiede selbst führt. Nie anfassen. */
const FESTE_PANELS = new Set(['core-connections', 'references']);

/** Schlüssel, die keine Steckbriefzeile sind. */
const KEINE_ZEILE = new Set(['connections', 'tags', 'aliases']);

/**
 * Starttext für einen neuen Abschnitt.
 *
 * Warum überhaupt einer: `welt-umwandeln.mjs` überspringt jedes Panel ohne
 * Text — und zwar zu Recht, ein leerer Abschnitt hat nichts anzuzeigen.
 * Ein neu angelegter Abschnitt ohne Text wäre also unsichtbar, und damit
 * gäbe es nichts, woran ein Stift hängen könnte. Der Satz hier macht ihn
 * sichtbar und ist beim ersten Bearbeiten sofort überschrieben.
 */
export const STARTTEXT = 'Hier steht noch nichts.';

/* ------------------------------------------------------------------ *
 * Hilfen
 * ------------------------------------------------------------------ */

/** Macht aus einer Beschriftung einen Schlüssel: "Gebunden an" wird "gebundenAn". */
export function alsSchluessel(beschriftung) {
  const ersetzt = String(beschriftung || '')
    .toLowerCase()
    .split('ä').join('ae')
    .split('ö').join('oe')
    .split('ü').join('ue')
    .split('ß').join('ss');
  const woerter = ersetzt.split(/[^a-z0-9]+/).filter(Boolean);
  if (!woerter.length) return '';
  return woerter[0] + woerter.slice(1).map((w) => w[0].toUpperCase() + w.slice(1)).join('');
}

/** Hängt eine Zahl an, bis der Schlüssel frei ist. */
function freierSchluessel(vorschlag, belegt) {
  const basis = vorschlag || 'feld';
  if (!belegt.has(basis)) return basis;
  let n = 2;
  while (belegt.has(basis + n)) n += 1;
  return basis + n;
}

/** Eine Kennung, die es im Eintrag noch nicht gibt. */
function freieKennung(praefix, belegt) {
  let n = 1;
  let kennung = praefix + '-' + n;
  while (belegt.has(kennung)) {
    n += 1;
    kennung = praefix + '-' + n;
  }
  return kennung;
}

/** Die Anzeigereihenfolge der eigenen Abschnitte, so wie das Wiki sie zeigt. */
export function abschnittsReihenfolge(element) {
  const panels = Array.isArray(element?.customPanels) ? element.customPanels : [];
  const ordnung = Array.isArray(element?.panelOrder) ? element.panelOrder : [];
  return [...panels]
    .sort((a, b) => {
      const ia = ordnung.indexOf(a.id);
      const ib = ordnung.indexOf(b.id);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    })
    .map((p) => p.id);
}

/* ------------------------------------------------------------------ *
 * Abschnitte
 * ------------------------------------------------------------------ */

/**
 * Legt einen leeren Textabschnitt am Ende an.
 *
 * @param {object} element    Rohknoten des Eintrags
 * @param {string} eintragId  Wird Teil der neuen Kennung
 * @param {string} [titel]    Überschrift des neuen Abschnitts
 * @returns {{aenderungen: object, beschreibung: string, neueId: string}}
 */
export function abschnittAnlegen(element, eintragId, titel) {
  const panels = Array.isArray(element?.customPanels) ? [...element.customPanels] : [];
  const ordnung = Array.isArray(element?.panelOrder) ? [...element.panelOrder] : [];

  const belegt = new Set(panels.map((p) => p && p.id).filter(Boolean));
  const kennung = freieKennung('panel-' + (eintragId || 'eintrag'), belegt);
  const textKennung = freieKennung('text-' + (eintragId || 'eintrag'), belegt);

  panels.push({
    id: kennung,
    image: '',
    imageSettings: {
      color: 'gold',
      fit: 'contain',
      frame: 'simple',
      positionX: 50,
      positionY: 50,
      zoom: 100,
    },
    kind: 'text',
    text: STARTTEXT,
    textFields: [
      { html: '<p>' + STARTTEXT + '</p>', id: textKennung, label: 'Text', text: STARTTEXT },
    ],
    textLayout: 'single',
    title: titel || 'Neuer Abschnitt',
  });
  ordnung.push(kennung);

  return {
    aenderungen: { customPanels: panels, panelOrder: ordnung },
    beschreibung: 'Abschnitt angelegt',
    neueId: kennung,
  };
}

/**
 * Löscht einen Abschnitt samt seiner Einträge in Reihenfolge und Maßen.
 *
 * @param {object} element  Rohknoten des Eintrags
 * @param {string} panelId  Kennung des Abschnitts
 */
export function abschnittLoeschen(element, panelId) {
  const panels = Array.isArray(element?.customPanels) ? element.customPanels : [];
  const treffer = panels.find((p) => p && p.id === panelId);
  if (!treffer || FESTE_PANELS.has(panelId)) return null;

  const uebrig = panels.filter((p) => !p || p.id !== panelId);
  const ordnung = (Array.isArray(element.panelOrder) ? element.panelOrder : []).filter(
    (id) => id !== panelId,
  );

  const aenderungen = { customPanels: uebrig, panelOrder: ordnung };

  // Breiten und Höhen sind nach Kennung abgelegt und blieben sonst als
  // Reste zurück.
  for (const name of ['panelWidths', 'panelHeights']) {
    const bestand = element[name];
    if (bestand && typeof bestand === 'object' && panelId in bestand) {
      const kopie = { ...bestand };
      delete kopie[panelId];
      aenderungen[name] = kopie;
    }
  }

  return {
    aenderungen,
    beschreibung: 'Abschnitt ' + (treffer.title || 'ohne Titel') + ' gelöscht',
  };
}

/**
 * Verschiebt einen Abschnitt um eine Stelle nach oben oder unten.
 *
 * Geändert wird nur `panelOrder`. Feste Panels bleiben dabei an ihrem
 * Platz: Getauscht werden ausschließlich die Plätze der beiden eigenen
 * Abschnitte.
 *
 * @param {object} element   Rohknoten des Eintrags
 * @param {string} panelId   Kennung des Abschnitts
 * @param {number} richtung  Kleiner als 0 nach oben, sonst nach unten
 */
export function abschnittVerschieben(element, panelId, richtung) {
  const reihenfolge = abschnittsReihenfolge(element);
  const stelle = reihenfolge.indexOf(panelId);
  const ziel = stelle + (richtung < 0 ? -1 : 1);
  if (stelle === -1 || ziel < 0 || ziel >= reihenfolge.length) return null;

  const neueReihenfolge = [...reihenfolge];
  neueReihenfolge[stelle] = reihenfolge[ziel];
  neueReihenfolge[ziel] = reihenfolge[stelle];

  // Die eigenen Abschnitte in der neuen Folge zurück in panelOrder legen,
  // ohne feste Einträge wie core-connections zu berühren.
  const eigene = new Set(reihenfolge);
  const alt = Array.isArray(element.panelOrder) ? [...element.panelOrder] : [];
  const fehlende = reihenfolge.filter((id) => !alt.includes(id));
  const ordnung = [...alt, ...fehlende];

  let n = 0;
  const neu = ordnung.map((id) => (eigene.has(id) ? neueReihenfolge[n++] : id));

  return {
    aenderungen: { panelOrder: neu },
    beschreibung: 'Abschnitt verschoben',
  };
}

/* ------------------------------------------------------------------ *
 * Steckbriefzeilen
 * ------------------------------------------------------------------ */

/** Die Steckbriefzeilen eines Eintrags, wie sie bearbeitet werden können. */
export function steckbriefZeilen(element) {
  const zeilen = Array.isArray(element?.attributeRows) ? element.attributeRows : [];
  return zeilen
    .filter((z) => z && z.key && !KEINE_ZEILE.has(z.key))
    .map((z) => ({
      schluessel: z.key,
      beschriftung: z.label || z.key,
      wert: String(element?.fields?.[z.key] ?? ''),
    }));
}

/**
 * Ändert Beschriftung und Wert einer vorhandenen Zeile.
 *
 * Der Schlüssel bleibt, auch wenn die Beschriftung sich ändert: Er ist die
 * Verbindung zwischen `attributeRows` und `fields`, und andere Stellen der
 * Weltenschmiede könnten daran hängen.
 */
export function zeileSetzen(element, schluessel, beschriftung, wert) {
  const zeilen = Array.isArray(element?.attributeRows) ? element.attributeRows : [];
  const stelle = zeilen.findIndex((z) => z && z.key === schluessel);
  if (stelle === -1) return null;

  const aenderungen = {};
  if ((zeilen[stelle].label || '') !== beschriftung) {
    aenderungen['attributeRows/' + stelle + '/label'] = beschriftung;
  }
  if (String(element?.fields?.[schluessel] ?? '') !== wert) {
    aenderungen['fields/' + schluessel] = wert;
  }
  if (!Object.keys(aenderungen).length) return null;

  return { aenderungen, beschreibung: 'Steckbriefzeile ' + beschriftung + ' geändert' };
}

/** Hängt eine neue Steckbriefzeile an. */
export function zeileAnlegen(element, eintragId, beschriftung, wert) {
  const text = String(beschriftung || '').trim();
  if (!text) return null;

  const zeilen = Array.isArray(element?.attributeRows) ? [...element.attributeRows] : [];
  const belegteSchluessel = new Set(zeilen.map((z) => z && z.key).filter(Boolean));
  for (const k of Object.keys(element?.fields || {})) belegteSchluessel.add(k);

  const schluessel = freierSchluessel(alsSchluessel(text), belegteSchluessel);
  const kennung = freieKennung(
    'attribute-' + (eintragId || 'eintrag') + '-' + schluessel,
    new Set(zeilen.map((z) => z && z.id).filter(Boolean)),
  );

  zeilen.push({ id: kennung, key: schluessel, label: text });

  return {
    aenderungen: {
      attributeRows: zeilen,
      ['fields/' + schluessel]: String(wert ?? ''),
    },
    beschreibung: 'Steckbriefzeile ' + text + ' angelegt',
  };
}

/**
 * Entfernt eine Steckbriefzeile.
 *
 * Der Wert in `fields` wird wirklich entfernt, nicht nur geleert. Ein
 * geleerter Schlüssel bliebe sonst für immer stehen: Anlegen und wieder
 * Entfernen derselben Zeile hinterließe bei jedem Durchgang einen leeren
 * Eintrag mehr. Deshalb wird `fields` als Ganzes neu geschrieben – genau
 * wie `attributeRows` daneben.
 */
export function zeileLoeschen(element, schluessel) {
  const zeilen = Array.isArray(element?.attributeRows) ? element.attributeRows : [];
  const treffer = zeilen.find((z) => z && z.key === schluessel);
  if (!treffer) return null;

  const aenderungen = { attributeRows: zeilen.filter((z) => !z || z.key !== schluessel) };
  if (element?.fields && schluessel in element.fields) {
    const felder = { ...element.fields };
    delete felder[schluessel];
    aenderungen.fields = felder;
  }

  return {
    aenderungen,
    beschreibung: 'Steckbriefzeile ' + (treffer.label || schluessel) + ' entfernt',
  };
}
