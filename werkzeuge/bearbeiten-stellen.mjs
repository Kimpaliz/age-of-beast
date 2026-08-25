/**
 * Findet die Stellen in der Weltenschmiede, die zu einem angezeigten Feld
 * gehoeren, und rechnet zwischen Anzeige- und Speicherform um.
 *
 * Dieses Modul enthaelt ausschliesslich reine Logik: kein Dateizugriff, kein
 * DOM, keine Node-Bausteine. Dadurch laeuft es an zwei Orten:
 *
 *   - im Browser, wo `texte-bearbeiten.js` daraus die Bedienung baut,
 *   - im Node-Skript `pruefe-bearbeiten.mjs`, das an allen echten Texten
 *     nachweist, dass Oeffnen und Speichern nichts veraendert.
 *
 * Dieselbe Trennung wie bei `welt-umwandeln.mjs`, und aus demselben Grund.
 */

import { alsSchreibweise, alsHtml, alsReinerText } from './text-schreibweise.mjs';

/** Wie ein Feld bearbeitet wird. */
export const ART = {
  /** Eine einzelne Zeile ohne Auszeichnung – Name, Ueberschrift. */
  zeile: 'zeile',
  /** Mehrere Zeilen reiner Text – der Kurztext. */
  absatz: 'absatz',
  /** Fliesstext in der einfachen Schreibweise mit `##` und `**`. */
  schreibweise: 'schreibweise',
};

/**
 * In welcher Form ein Zielpfad den neuen Text bekommt.
 *
 * Die Weltenschmiede fuehrt zu einem Panel drei Fassungen desselben Textes:
 * das HTML im Textfeld, eine Nur-Text-Fassung daneben und eine zweite am
 * Panel selbst. Wer nur eine davon aenderte, hinterliesse drei Staende.
 */
export const FORM = {
  /** Als HTML, so wie die Weltenschmiede es erwartet. */
  html: 'html',
  /** Als reiner Text ohne jede Auszeichnung. */
  rein: 'rein',
};

/**
 * Ermittelt, wo ein angezeigtes Feld in der Weltenschmiede steht.
 *
 * @param {object} element   Der Rohknoten des Eintrags
 * @param {string} feld      'name' | 'kurz' | 'titel' | 'text'
 * @param {object|null} herkunft  `abschnitt.herkunft` aus welt-umwandeln.mjs
 * @returns {{ziele: Array<{pfad: string, form: string}>, wert: string,
 *            art: string, beschriftung: string}|null}
 *   `null` heisst: Diese Stelle ist nicht eindeutig oder nicht mehr da.
 *   Dann wird nichts angeboten und erst recht nichts geschrieben.
 */
export function stelleFinden(element, feld, herkunft) {
  if (!element) return null;

  if (feld === 'name') {
    return {
      ziele: [{ pfad: 'name', form: FORM.rein }],
      wert: String(element.name ?? ''),
      art: ART.zeile,
      beschriftung: 'Name des Eintrags',
    };
  }

  if (feld === 'kurz') {
    return {
      ziele: [{ pfad: 'description', form: FORM.rein }],
      wert: String(element.description ?? ''),
      art: ART.absatz,
      beschriftung: 'Kurztext',
    };
  }

  if (!herkunft) return null;

  if (herkunft.art === 'panel') {
    const panel = (element.customPanels || [])[herkunft.panel];
    if (!panel) return null;
    // Sicherheitsleine: Stimmt die Stelle noch? Hat die Weltenschmiede
    // zwischenzeitlich Panels umsortiert, zeigt die gemerkte Nummer auf
    // ein fremdes Panel. Dann wird nicht geschrieben.
    if (herkunft.panelId && (panel.id || '') !== herkunft.panelId) return null;

    const stelle = 'customPanels/' + herkunft.panel;

    if (feld === 'titel') {
      return {
        ziele: [{ pfad: stelle + '/title', form: FORM.rein }],
        wert: String(panel.title ?? ''),
        art: ART.zeile,
        beschriftung: 'Überschrift des Abschnitts',
      };
    }

    if (feld !== 'text') return null;

    if (herkunft.feld === undefined) {
      // Ein Panel ohne Textfeld fuehrt nur reinen Text.
      return {
        ziele: [{ pfad: stelle + '/text', form: FORM.rein }],
        wert: String(panel.text ?? ''),
        art: ART.absatz,
        beschriftung: 'Text des Abschnitts',
      };
    }

    const textfeld = (panel.textFields || [])[herkunft.feld];
    if (!textfeld) return null;
    return {
      ziele: [
        { pfad: stelle + '/textFields/' + herkunft.feld + '/html', form: FORM.html },
        { pfad: stelle + '/textFields/' + herkunft.feld + '/text', form: FORM.rein },
        { pfad: stelle + '/text', form: FORM.rein },
      ],
      wert: String(textfeld.html ?? ''),
      art: ART.schreibweise,
      beschriftung: 'Text des Abschnitts',
    };
  }

  if (feld !== 'text') return null;

  if (herkunft.art === 'richText') {
    const wert = element.richText?.[herkunft.schluessel];
    if (typeof wert !== 'string') return null;
    return {
      ziele: [{ pfad: 'richText/' + herkunft.schluessel, form: FORM.html }],
      wert,
      art: ART.schreibweise,
      beschriftung: 'Text des Abschnitts',
    };
  }

  if (herkunft.art === 'feld') {
    const wert = element.fields?.[herkunft.schluessel];
    if (typeof wert !== 'string') return null;
    // Manche dieser Felder fuehren reinen Text, andere HTML.
    const alsHtmlGefuehrt = /<\w+/.test(wert);
    return {
      ziele: [{ pfad: 'fields/' + herkunft.schluessel, form: alsHtmlGefuehrt ? FORM.html : FORM.rein }],
      wert,
      art: alsHtmlGefuehrt ? ART.schreibweise : ART.absatz,
      beschriftung: 'Text des Abschnitts',
    };
  }

  return null;
}

/** Vom gespeicherten Wert in das, was im Bearbeitungsfeld stehen soll. */
export function zumBearbeiten(wert, art) {
  if (art === ART.schreibweise) return alsSchreibweise(wert);
  return String(wert ?? '');
}

/**
 * Vom Feldinhalt in die Werte, die geschrieben werden.
 *
 * @returns {object}  Pfad -> neuer Wert, noch ohne den Praefix des Eintrags
 */
export function zumSpeichern(eingabe, art, ziele) {
  const werte = {};

  if (art === ART.zeile) {
    const sauber = String(eingabe).replace(/\s+/g, ' ').trim();
    for (const ziel of ziele) werte[ziel.pfad] = sauber;
    return werte;
  }

  if (art === ART.absatz) {
    const sauber = String(eingabe).replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    for (const ziel of ziele) werte[ziel.pfad] = sauber;
    return werte;
  }

  // Schreibweise: HTML fuer die Anzeige, reiner Text daneben.
  const html = alsHtml(eingabe);
  const rein = alsReinerText(html);
  for (const ziel of ziele) werte[ziel.pfad] = ziel.form === FORM.html ? html : rein;
  return werte;
}

/**
 * Schreibt einen Wert an einen Pfad in einem bereits geladenen Rohstand.
 *
 * Der Rohstand liegt im Browser, damit das Wiki nach dem Speichern sofort
 * das Ergebnis zeigen kann, ohne alle Daten erneut zu holen.
 *
 * @returns {boolean} Ob der Pfad vorhanden war
 */
export function inTiefeSetzen(objekt, pfad, wert) {
  const teile = String(pfad).split('/').filter(Boolean);
  if (!teile.length || !objekt) return false;
  let stelle = objekt;
  for (let i = 0; i < teile.length - 1; i += 1) {
    const schluessel = teile[i];
    if (stelle[schluessel] === undefined || stelle[schluessel] === null) return false;
    stelle = stelle[schluessel];
  }
  stelle[teile[teile.length - 1]] = wert;
  return true;
}
