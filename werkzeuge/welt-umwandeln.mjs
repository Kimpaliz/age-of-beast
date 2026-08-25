/**
 * Wandelt die Rohdaten der Weltenschmiede in das schlanke Wiki-Format um.
 *
 * Dieses Modul enthaelt ausschliesslich reine Logik: kein Dateizugriff, keine
 * Node-Bausteine. Dadurch laeuft es an zwei Orten mit demselben Ergebnis:
 *
 *   - im Node-Skript `welt-aufbereiten.mjs`, das die Dateien unter `daten/`
 *     erzeugt,
 *   - direkt im Browser, wenn Jannik angemeldet ist und das Wiki die Daten
 *     live aus der Weltenschmiede liest.
 *
 * Genau deshalb sehen Leseansicht und Bearbeitungsansicht identisch aus.
 *
 * Wichtig: Das Skript prueft, ob jeder Text aus den Rohdaten im Wiki ankommt.
 * Texte, die in keinem Panel stehen, werden als eigener Abschnitt ergaenzt.
 * Die zurueckgegebene Bilanz belegt das.
 */

// Anzeigename der Welt. Bewusst hier festgelegt und nicht aus der
// Weltenschmiede übernommen, weil das Projekt dort weiterhin unter dem
// alten Namen 'Sturmwende' geführt wird.
const WELT_TITEL = 'Age of Beast';

/* ------------------------------------------------------------------ *
 * Beschriftungen
 * ------------------------------------------------------------------ */

// Reihenfolge der Kategorien im Wiki
const KATEGORIEN = [
  { schluessel: 'wiki', name: 'Kampagne', einzahl: 'Kampagnenübersicht', zeichen: '◆' },
  { schluessel: 'factions', name: 'Fraktionen', einzahl: 'Fraktion', zeichen: '⚑' },
  { schluessel: 'species', name: 'Spezies', einzahl: 'Spezies', zeichen: '❖' },
  { schluessel: 'characters', name: 'Figuren', einzahl: 'Figur', zeichen: '☗' },
  { schluessel: 'items', name: 'Gegenstände', einzahl: 'Gegenstand', zeichen: '⚔' },
  { schluessel: 'places', name: 'Orte', einzahl: 'Ort', zeichen: '⌂' },
  { schluessel: 'events', name: 'Ereignisse', einzahl: 'Ereignis', zeichen: '✦' },
  { schluessel: 'lore', name: 'Wissen', einzahl: 'Wissenseintrag', zeichen: '✎' },
];

// Deutsche Überschriften für Textfelder, die in keinem Panel stehen
const FELD_UEBERSCHRIFT = {
  biology: 'Biologie und Erscheinung',
  society: 'Gesellschaft',
  notes: 'Ausführliche Beschreibung',
  drive: 'Antrieb',
  resource: 'Mittel und Rückhalt',
  info: 'Hinweis',
  role: 'Rolle',
  secret: 'Geheimnis',
  function: 'Aufbau und Funktion',
  history: 'Geschichte',
  definition: 'Kurzdefinition',
  usage: 'Verwendung',
  motive: 'Beweggrund',
  pressure: 'Druck',
  traits: 'Merkmale',
  source: 'Quelle',
};

// Reihenfolge, in der Zusatztexte angehängt werden
const FELD_REIHENFOLGE = [
  'definition', 'info', 'role', 'notes', 'drive', 'resource',
  'function', 'history', 'biology', 'society', 'traits',
  'motive', 'pressure', 'secret', 'usage', 'source',
];

// Attributschlüssel, deren Wert auf einen anderen Eintrag zeigt
const VERWEIS_FELDER = new Set([
  'leaderId', 'headquartersPlaceId', 'factionId', 'locationId',
  'ownerId', 'residencePlaceId', 'species',
]);

// Diese Schlüssel sind Technik, keine Inhalte
const KEINE_INHALTE = new Set(['connections', 'tags', 'aliases']);

// Woher je Kategorie die Unterart für das Etikett stammt
// (zum Beispiel „SPEZIES · KERN-ABSTAMMUNG")
const UNTERART_FELD = {
  species: ['classification'],
  factions: ['type'],
  items: ['rarity', 'type'],
  characters: ['characterType', 'occupation'],
  // `wiki` bewusst ohne Unterart: Der Kampagneneintrag heißt ohnehin so.
};

// Kürzel aus der Weltenschmiede in lesbare Wörter übersetzen
const UNTERART_KLARTEXT = {
  sc: 'Spielfigur',
  pc: 'Spielfigur',
  npc: 'Nichtspielerfigur',
  nsc: 'Nichtspielerfigur',
};

/* ------------------------------------------------------------------ *
 * Hilfsfunktionen
 * ------------------------------------------------------------------ */

const nurText = (html) =>
  String(html ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();

const vergleichsform = (text) => nurText(text).toLowerCase().replace(/[^\p{L}\p{N} ]/gu, '');

/** Ist `text` inhaltlich schon in `bestand` enthalten? Satzweise geprüft. */
function schonEnthalten(text, bestand) {
  const saetze = vergleichsform(text)
    .split(/(?<=[.!?])\s+|\s{2,}/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);
  if (saetze.length === 0) return vergleichsform(text).length > 0 && bestand.includes(vergleichsform(text));
  const gefunden = saetze.filter((s) => bestand.includes(s)).length;
  return gefunden / saetze.length >= 0.8;
}

/** Erzeugt aus HTML-Text der Weltenschmiede sauberes, sicheres Wiki-HTML. */
export function htmlSaeubern(roh) {
  let html = String(roh ?? '').trim();
  if (!html) return '';
  // Skripte, Stile und Ereignis-Attribute entfernen
  html = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript:/gi, '');
  // Nur erlaubte Auszeichnungen behalten. Öffnende und schließende Tags
  // werden getrennt erkannt, damit `</strong>` erhalten bleibt.
  const erlaubt = /^(p|br|strong|b|em|i|u|ul|ol|li|h3|h4|blockquote|code)$/i;
  html = html.replace(/<\s*(\/?)\s*([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g, (treffer, schraegstrich, name) => {
    if (!erlaubt.test(name)) return '';
    return `<${schraegstrich}${name.toLowerCase()}>`;
  });
  // Übrig gebliebene spitze Klammern entfernen
  html = html.replace(/<(?!\/?(?:p|br|strong|b|em|i|u|ul|ol|li|h3|h4|blockquote|code)>)/g, '&lt;');
  return html.replace(/(<p><\/p>)+/g, '').trim();
}

/** Reiner Text ohne Auszeichnung wird zu Absätzen. */
export function alsAbsaetze(text) {
  const roh = String(text ?? '').trim();
  if (!roh) return '';
  if (/<\w+/.test(roh)) return htmlSaeubern(roh);
  return roh
    .split(/\n+/)
    .map((zeile) => zeile.trim())
    .filter(Boolean)
    .map((zeile) => `<p>${zeile.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`)
    .join('');
}

/**
 * Merkt sich, aus welchem Panel ein Abschnitt stammt.
 *
 * Die Bearbeitungsansicht braucht das, um beim Speichern genau an dieselbe
 * Stelle in der Weltenschmiede zurueckzuschreiben. Ohne diese Angabe waere
 * ein angezeigter Abschnitt nicht mehr seiner Quelle zuzuordnen: Die
 * Reihenfolge der Anzeige folgt `panelOrder`, die Stelle in der Datenbank
 * aber der urspruenglichen Reihenfolge in `customPanels`.
 *
 * Ergibt `null`, wenn die Stelle nicht eindeutig ist. Solche Abschnitte
 * bleiben im Wiki lesbar, lassen sich dort aber nicht bearbeiten.
 *
 * @param {Array} panelsRoh  `customPanels` in Datenbankreihenfolge
 * @param {object} panel     Das Panel, um das es geht
 * @param {Array} felder     Seine Textfelder
 * @returns {{art: string, panel: number, panelId: string, feld?: number}|null}
 */
function panelHerkunft(panelsRoh, panel, felder) {
  const stelle = panelsRoh.indexOf(panel);
  if (stelle === -1) return null;
  // Mehr als ein Textfeld gaebe es im Wiki nur als einen Block zu sehen.
  // Welches Feld dann zu aendern waere, ist nicht zu entscheiden.
  if (felder.length > 1) return null;
  const herkunft = { art: 'panel', panel: stelle, panelId: panel.id || '' };
  if (felder.length === 1) herkunft.feld = 0;
  return herkunft;
}

/**
 * Wandelt einen Rohstand der Weltenschmiede in das Wiki-Format um.
 *
 * @param {object} roh  Der Projektknoten, wie er in der Realtime Database liegt.
 * @returns {{welt: object, bilanz: object, gepflegteBegriffe: Set<string>, ausgeschlossen: string[]}}
 */
export function umwandeln(roh) {
  const rohElemente = roh.elements || {};

  // Nachschlagewerk: welche IDs gibt es überhaupt?
  const alleIds = new Map();
  for (const [kategorie, gruppe] of Object.entries(rohElemente)) {
    for (const [id, element] of Object.entries(gruppe)) {
      alleIds.set(id, { kategorie, name: element.name || id });
    }
  }

  const bilanz = { panels: 0, zusatztexte: 0, uebersprungen: 0, anrissDubletten: 0, quellenzeilen: 0, attribute: 0, verbindungen: 0 };
  const eintraege = [];

  for (const kategorieInfo of KATEGORIEN) {
    const gruppe = rohElemente[kategorieInfo.schluessel];
    if (!gruppe) continue;

    for (const [id, element] of Object.entries(gruppe)) {
      // --- Panels (Hauptinhalt) ---------------------------------------
      const reihenfolge = Array.isArray(element.panelOrder) ? element.panelOrder : [];
      const panelsRoh = Array.isArray(element.customPanels) ? element.customPanels : [];
      const sortiert = [...panelsRoh].sort((a, b) => {
        const ia = reihenfolge.indexOf(a.id);
        const ib = reihenfolge.indexOf(b.id);
        return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
      });

      const abschnitte = [];
      for (const panel of sortiert) {
        const felder = Array.isArray(panel.textFields) ? panel.textFields : [];
        const teile = felder
          .map((feld) => htmlSaeubern(feld.html) || alsAbsaetze(feld.text))
          .filter(Boolean);
        const html = teile.join('') || alsAbsaetze(panel.text);
        if (!html) continue;
        abschnitte.push({ titel: panel.title || '', html, herkunft: panelHerkunft(panelsRoh, panel, felder) });
        bilanz.panels += 1;
      }

      // Alles, was bereits in den Panels steht. Diese Bilanz wird VOR dem
      // Aussortieren gezogen, sonst gälte ein aussortierter Text später
      // fälschlich als fehlend und käme hinten wieder herein.
      const bestand = vergleichsform(abschnitte.map((a) => a.html).join(' ') + ' ' + (element.description || ''));

      // --- Zusatztexte, die in keinem Panel vorkommen ------------------
      for (const schluessel of FELD_REIHENFOLGE) {
        const ausRichText = element.richText?.[schluessel];
        const wert = ausRichText ?? element.fields?.[schluessel];
        if (!wert || typeof wert !== 'string' || nurText(wert).length < 15) continue;
        if (schonEnthalten(wert, bestand)) { bilanz.uebersprungen += 1; continue; }
        abschnitte.push({
          titel: FELD_UEBERSCHRIFT[schluessel] || schluessel,
          html: alsAbsaetze(wert),
          herkunft: {
            art: ausRichText === undefined || ausRichText === null ? 'feld' : 'richText',
            schluessel,
          },
          ergaenzt: true,
        });
        bilanz.zusatztexte += 1;
      }

      // --- Abschnitte aussortieren, die nur den Anriss wiederholen -----
      // Bei den Spezies ist die Kurzbeschreibung wortgleich das erste Panel.
      // Beides untereinander zu drucken sähe nach einem Fehler aus.
      const anriss = vergleichsform(element.description);
      if (anriss.length > 40) {
        for (let i = abschnitte.length - 1; i >= 0; i -= 1) {
          const text = vergleichsform(abschnitte[i].html);
          if (text.length > 20 && anriss.includes(text)) {
            abschnitte.splice(i, 1);
            bilanz.anrissDubletten += 1;
          }
        }
      }

      // --- Quellenangabe aus dem Fließtext nehmen ---------------------
      // In der Weltenschmiede endet jede Spezies mit einem Absatz
      // „Regelquelle: …". Dieselbe Angabe steht im Wiki im Steckbrief unter
      // „Herkunft"; im Text wäre sie eine sichtbare Dopplung.
      if (nurText(element.fields?.source)) {
        for (let i = abschnitte.length - 1; i >= 0; i -= 1) {
          const vorher = abschnitte[i].html;
          const nachher = vorher.replace(/<p>(?:<strong>)?\s*Regelquelle:\s*(?:<\/strong>)?[^<]*<\/p>\s*$/i, '');
          if (nachher === vorher) continue;
          if (nurText(nachher)) abschnitte[i].html = nachher;
          else abschnitte.splice(i, 1);
          bilanz.quellenzeilen += 1;
        }
      }

      // --- Attributtabelle --------------------------------------------
      const attribute = [];
      for (const zeile of element.attributeRows || []) {
        const schluessel = zeile.key;
        if (!schluessel || KEINE_INHALTE.has(schluessel)) continue;
        const wert = element.fields?.[schluessel];
        if (wert === undefined || wert === null || wert === '') continue;
        const text = nurText(wert);
        if (!text) continue;
        // Die Attributspalte ist schmal. Längere Angaben stehen ohnehin im
        // Fließtext und würden hier nur eine hohe, unlesbare Säule ergeben.
        if (text.length > 110) continue;
        // `schluessel` wird nur zum Zurueckschreiben gebraucht: Er verbindet
        // die Beschriftung in `attributeRows` mit dem Wert in `fields`.
        // Ohne ihn wuesste die Bearbeitung nicht, welches Feld gemeint ist.
        const eintrag = { schluessel, beschriftung: zeile.label || schluessel, wert: text };
        if (VERWEIS_FELDER.has(schluessel) && alleIds.has(wert)) {
          eintrag.ziel = wert;
          eintrag.wert = alleIds.get(wert).name;
        }
        attribute.push(eintrag);
        bilanz.attribute += 1;
      }

      // --- Verbindungen ------------------------------------------------
      const verbindungen = (element.fields?.connections || [])
        .filter((v) => v && v.targetId && alleIds.has(v.targetId))
        .map((v) => ({ art: v.kind || 'Verbunden', text: v.label || '', ziel: v.targetId }));
      bilanz.verbindungen += verbindungen.length;

      // --- Andere Bezeichnungen ---------------------------------------
      const aliasRoh = element.fields?.aliases;
      const aliase = String(aliasRoh || '')
        .split(/[,;]/)
        .map((a) => a.trim())
        .filter(Boolean);

      // --- Unterart für das Etikett -----------------------------------
      let unterart = '';
      for (const schluessel of UNTERART_FELD[kategorieInfo.schluessel] || []) {
        const roh = nurText(element.fields?.[schluessel]);
        if (!roh) continue;
        const wert = UNTERART_KLARTEXT[roh.toLowerCase()] || roh;
        // Nur kurze Klassifizierungen taugen als Etikett
        if (wert.length > 28) continue;
        // Doppelungen wie „Kampagnenübersicht · Kampagnen-Frame" vermeiden
        const a = vergleichsform(wert);
        const b = vergleichsform(kategorieInfo.einzahl);
        if (a === b || a.startsWith(b) || b.startsWith(a)) continue;
        unterart = wert;
        break;
      }

      eintraege.push({
        id,
        name: element.name || id,
        kategorie: kategorieInfo.schluessel,
        unterart,
        kurz: nurText(element.description),
        aliase,
        quelle: nurText(element.fields?.source || ''),
        attribute,
        abschnitte,
        verbindungen,
        geaendert: element.updatedAt || '',
      });
    }
  }

  /* ------------------------------------------------------------------ *
   * Wörterbuch für die automatische Verlinkung
   * ------------------------------------------------------------------ */

  // Begriffe, die absichtlich NICHT automatisch verlinkt werden.
  // `prototyp` ist ein alter Arbeitsalias des Kampagnen-Eintrags. Als Verweis
  // wäre er irreführend, weil das Wort im Text etwas anderes meint.
  const NICHT_VERLINKEN = new Set(['prototyp']);

  const woerterbuch = {};
  const ausgeschlossen = [];
  const gepflegteBegriffe = new Set();
  const eintragen = (begriff, ziel, gepflegt = false) => {
    const schluessel = String(begriff || '').trim().toLowerCase();
    if (schluessel.length < 3) return;
    if (NICHT_VERLINKEN.has(schluessel)) return;
    // Ein bereits belegter Begriff wird nicht überschrieben
    if (woerterbuch[schluessel]) return;
    woerterbuch[schluessel] = ziel;
    if (gepflegt) gepflegteBegriffe.add(schluessel);
  };

  // 1. Von Jannik in der Weltenschmiede gepflegte Begriffe haben Vorrang
  for (const gruppe of Object.values(rohElemente)) {
    for (const element of Object.values(gruppe)) {
      for (const [begriff, verweis] of Object.entries(element.textLinks || {})) {
        if (verweis?.id && alleIds.has(verweis.id)) eintragen(begriff, verweis.id, true);
      }
    }
  }

  // 2. Mehrdeutige andere Bezeichnungen ermitteln: Ein Alias, den sich mehrere
  //    Einträge teilen (zum Beispiel `Elemental Kin`), darf nicht automatisch
  //    auf einen davon zeigen.
  const aliasZaehler = new Map();
  for (const eintrag of eintraege) {
    for (const alias of eintrag.aliase) {
      const schluessel = alias.trim().toLowerCase();
      aliasZaehler.set(schluessel, (aliasZaehler.get(schluessel) || 0) + 1);
    }
  }

  // 3. Danach Namen und eindeutige andere Bezeichnungen aller Einträge
  for (const eintrag of eintraege) {
    eintragen(eintrag.name, eintrag.id);
    for (const alias of eintrag.aliase) {
      const schluessel = alias.trim().toLowerCase();
      if (aliasZaehler.get(schluessel) > 1) {
        if (!ausgeschlossen.includes(alias)) ausgeschlossen.push(alias);
        continue;
      }
      eintragen(alias, eintrag.id);
    }
  }

  /* ------------------------------------------------------------------ *
   * Schreiben
   * ------------------------------------------------------------------ */

  // Bewusst ohne Zeitstempel der Erzeugung: Diese Funktion muss zu
  // demselben Rohstand immer dasselbe Ergebnis liefern, Zeichen für
  // Zeichen. Seit das Wiki selbst speichert, landen diese Dateien in
  // jedem Commit – ein wandernder Zeitstempel wäre bei jeder Änderung
  // eine Zeile Rauschen im Vergleich, und angezeigt wurde er nie.
  // Wann die Daten zuletzt bearbeitet wurden, steht in `standDerDaten`.
  const welt = {
    // Der Weltname wird hier bewusst fest vorgegeben und NICHT aus der
    // Weltenschmiede übernommen: dort heißt das Projekt aus historischen
    // Gründen weiterhin 'Sturmwende'. Umbenannt am 24.08.2026.
    titel: WELT_TITEL,
    untertitel: roh.project?.subtitle || '',
    standDerDaten: roh.updatedAt || '',
    kategorien: KATEGORIEN.filter((k) => eintraege.some((e) => e.kategorie === k.schluessel)),
    eintraege,
    woerterbuch,
  };

  return { welt, bilanz, gepflegteBegriffe, ausgeschlossen };
}
