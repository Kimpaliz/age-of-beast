/* ===================================================================
   Age of Beast – Kartenorte und Koordinaten
   [Aufgabe: Karte]

   -------------------------------------------------------------------
   Ortsdaten bleiben im Raster von Janniks Vorlage. Die Anzeige darf
   sich mit Zoom und Bildschirmgröße ändern, ohne dass eine Ortsangabe
   dadurch eine andere Bedeutung bekommt.
   =================================================================== */

import { VORLAGE } from './welt-regionen.mjs';

export const KARTENRASTER = Object.freeze({
  breite: VORLAGE.breite,
  hoehe: VORLAGE.hoehe,
});

function istObjekt(wert) {
  return wert !== null && typeof wert === 'object' && !Array.isArray(wert);
}

function istBildgroesse(wert) {
  return istObjekt(wert)
    && Number.isFinite(wert.breite) && wert.breite > 0
    && Number.isFinite(wert.hoehe) && wert.hoehe > 0;
}

/** Ein Kartenpunkt ist ganzzahlig, damit er direkt abgeschrieben werden kann. */
export function istKartenpunkt(wert) {
  return istObjekt(wert)
    && Number.isInteger(wert.x)
    && Number.isInteger(wert.y);
}

/** Prüft den Rand mit, weil der Vorlagenrand eine gültige Kartenposition ist. */
export function liegtImKartenraster(kartenpunkt) {
  return istKartenpunkt(kartenpunkt)
    && kartenpunkt.x >= 0 && kartenpunkt.x <= KARTENRASTER.breite
    && kartenpunkt.y >= 0 && kartenpunkt.y <= KARTENRASTER.hoehe;
}

/**
 * Skaliert einen Vorlagenpunkt auf die rechnerische Bildgröße. Es wird
 * nicht gerundet: Erst dadurch bleibt die Rückrechnung verlustfrei.
 */
export function kartenpunktZuBildpunkt(kartenpunkt, bildgroesse) {
  if (!istKartenpunkt(kartenpunkt) || !istBildgroesse(bildgroesse)) {
    throw new TypeError('Kartenpunkt und Bildgröße müssen gültig sein.');
  }
  return {
    x: (kartenpunkt.x / KARTENRASTER.breite) * bildgroesse.breite,
    y: (kartenpunkt.y / KARTENRASTER.hoehe) * bildgroesse.hoehe,
  };
}

/**
 * Liest einen Bildpunkt wieder als Rasterkoordinate. Rasterpunkte sind
 * bewusst ganzzahlig; das Runden macht den abgelesenen Wert kopierbar.
 */
export function bildpunktZuKartenpunkt(bildpunkt, bildgroesse) {
  if (!istObjekt(bildpunkt) || !Number.isFinite(bildpunkt.x)
    || !Number.isFinite(bildpunkt.y) || !istBildgroesse(bildgroesse)) {
    throw new TypeError('Bildpunkt und Bildgröße müssen gültig sein.');
  }
  return {
    x: Math.round((bildpunkt.x / bildgroesse.breite) * KARTENRASTER.breite),
    y: Math.round((bildpunkt.y / bildgroesse.hoehe) * KARTENRASTER.hoehe),
  };
}

/** Liefert nur Einträge, die als Stecknadel dargestellt werden können. */
export function eintraegeMitKartenpunkt(eintraege) {
  if (!Array.isArray(eintraege)) return [];
  return eintraege.filter((eintrag) => istObjekt(eintrag)
    && istKartenpunkt(eintrag.kartenpunkt));
}
