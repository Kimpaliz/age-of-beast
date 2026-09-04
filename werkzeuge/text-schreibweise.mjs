/**
 * [Aufgabe: Bearbeiten]
 * Uebersetzt zwischen dem HTML der Weltenschmiede und einer einfachen,
 * gut lesbaren Schreibweise fuer das Bearbeitungsfeld.
 *
 * Warum es das gibt: In der Weltenschmiede stehen die Texte als HTML in der
 * Datenbank, zum Beispiel
 *
 *     <h3>Ton</h3><p>Duester und <strong>rau</strong>.</p>
 *
 * Das will niemand von Hand tippen. Im Wiki erscheint im Bearbeitungsfeld
 * deshalb nur
 *
 *     ## Ton
 *
 *     Duester und **rau**.
 *
 * Beim Speichern wird daraus wieder HTML. Damit dabei nichts verloren geht,
 * prueft `pruefe-schreibweise.mjs` alle echten Texte des Projekts einmal
 * hin und wieder zurueck.
 *
 * Dieses Modul enthaelt reine Logik: kein Dateizugriff, keine Node-Bausteine.
 * Dadurch laeuft es unveraendert im Browser und im Node-Pruefskript.
 *
 * Die Schreibweise im Ueberblick:
 *
 *     # Ueberschrift          -> <h2>
 *     ## Ueberschrift         -> <h3>
 *     ### Ueberschrift        -> <h4>
 *     - Punkt                 -> <ul><li>
 *     1. Punkt                -> <ol><li>
 *     > Zitat                 -> <blockquote>
 *     **fett**                -> <strong>
 *     *kursiv*                -> <em>
 *     __unterstrichen__       -> <u>
 *     `Code`                  -> <code>
 *     Leerzeile               -> neuer Absatz <p>
 *     Zeilenumbruch im Absatz -> <br>
 */

/* ------------------------------------------------------------------ *
 * Zwischenmarken
 *
 * Waehrend der Umwandlung werden Auszeichnungen kurz durch Marken ersetzt.
 * Sie bestehen aus einem Steuerzeichen, das in echten Texten nicht vorkommt,
 * und verschwinden am Ende der Umwandlung wieder. Bewusst zur Laufzeit
 * gebaut, damit im Quelltext dieser Datei keine unsichtbaren Zeichen stehen.
 * ------------------------------------------------------------------ */

const STEUER = String.fromCharCode(1);
const marke = (name) => STEUER + name + STEUER;

const MARKE_FETT = marke('F');
const MARKE_KURSIV = marke('K');
const MARKE_STRICH = marke('U');
const MARKE_CODE = marke('C');
const MARKE_UMBRUCH = marke('B');

/* ------------------------------------------------------------------ *
 * Kleine Helfer
 * ------------------------------------------------------------------ */

/** Wandelt HTML-Sonderzeichen in echte Zeichen zurueck. */
function zeichenEntschluesseln(text) {
  return String(text ?? '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/** Wandelt echte Zeichen in HTML-Sonderzeichen um. */
function zeichenSchuetzen(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Schuetzt Zeichen, die in der Schreibweise eine Bedeutung haben, mit einem
 * Rueckstrich. Sonst wuerde ein Stern im Fliesstext beim Zurueckwandeln
 * versehentlich zu Kursivschrift.
 */
function sonderzeichenSchuetzen(text) {
  return String(text ?? '').replace(/([\\*_`])/g, '\\$1');
}

/**
 * Schuetzt einen Zeilenanfang, der sonst als Ueberschrift, Listenpunkt oder
 * Zitat gelesen wuerde.
 */
function zeilenanfangSchuetzen(zeile) {
  return zeile.replace(/^(\s*)(#{1,3}\s|-\s|>\s|\d+\.\s)/, (treffer, luft, anfang) => luft + '\\' + anfang);
}

/* ------------------------------------------------------------------ *
 * HTML  ->  Schreibweise
 * ------------------------------------------------------------------ */

/** Wandelt den Inhalt eines Absatzes oder Listenpunktes in Schreibweise um. */
function inlineAlsSchreibweise(html) {
  let text = String(html ?? '');

  // Zeilenumbrueche im Absatz merken, bevor die Tags fallen
  text = text.replace(/<\s*br\s*\/?\s*>/gi, MARKE_UMBRUCH);

  // Auszeichnungen in Marken uebersetzen. Oeffnend und schliessend ergeben
  // dieselbe Marke; die Schreibweise unterscheidet sie ebenfalls nicht.
  text = text
    .replace(/<\s*\/?\s*(strong|b)\s*>/gi, MARKE_FETT)
    .replace(/<\s*\/?\s*(em|i)\s*>/gi, MARKE_KURSIV)
    .replace(/<\s*\/?\s*u\s*>/gi, MARKE_STRICH)
    .replace(/<\s*\/?\s*code\s*>/gi, MARKE_CODE);

  // Alles uebrige HTML faellt weg
  text = text.replace(/<[^>]*>/g, '');

  // Echte Zeichen herstellen, dann die Bedeutungstraeger schuetzen.
  // Die Marken bleiben dabei unberuehrt, weil sie keines dieser Zeichen
  // enthalten.
  text = sonderzeichenSchuetzen(zeichenEntschluesseln(text));

  // Marken in die Schreibweise setzen
  return text
    .split(MARKE_FETT).join('**')
    .split(MARKE_KURSIV).join('*')
    .split(MARKE_STRICH).join('__')
    .split(MARKE_CODE).join('`')
    .split(MARKE_UMBRUCH).join('\n');
}

/**
 * Wandelt HTML aus der Weltenschmiede in die einfache Schreibweise um.
 *
 * @param {string} html
 * @returns {string}
 */
export function alsSchreibweise(html) {
  const roh = String(html ?? '').trim();
  if (!roh) return '';

  const bloecke = [];
  // Findet die Blockelemente der Reihe nach. Alles, was zwischen zwei
  // Bloecken steht, gilt als eigener Absatz.
  const muster = /<\s*(p|h2|h3|h4|blockquote|ul|ol)\s*>([\s\S]*?)<\s*\/\s*\1\s*>/gi;
  let zuletzt = 0;
  let treffer;

  const alsAbsatzAufnehmen = (stueck) => {
    const text = inlineAlsSchreibweise(stueck).trim();
    if (text) bloecke.push(text.split('\n').map(zeilenanfangSchuetzen).join('\n'));
  };

  while ((treffer = muster.exec(roh)) !== null) {
    if (treffer.index > zuletzt) alsAbsatzAufnehmen(roh.slice(zuletzt, treffer.index));
    zuletzt = muster.lastIndex;

    const art = treffer[1].toLowerCase();
    const inhalt = treffer[2];

    if (art === 'ul' || art === 'ol') {
      const punkte = [...inhalt.matchAll(/<\s*li\s*>([\s\S]*?)<\s*\/\s*li\s*>/gi)]
        .map((m) => inlineAlsSchreibweise(m[1]).trim())
        .filter(Boolean);
      if (!punkte.length) continue;
      bloecke.push(
        punkte
          .map((punkt, i) => (art === 'ul' ? '- ' : i + 1 + '. ') + punkt.replace(/\n/g, ' '))
          .join('\n'),
      );
      continue;
    }

    const text = inlineAlsSchreibweise(inhalt).trim();
    if (!text) continue;

    if (art === 'h2') bloecke.push('# ' + text.replace(/\n/g, ' '));
    else if (art === 'h3') bloecke.push('## ' + text.replace(/\n/g, ' '));
    else if (art === 'h4') bloecke.push('### ' + text.replace(/\n/g, ' '));
    else if (art === 'blockquote') bloecke.push(text.split('\n').map((z) => '> ' + z).join('\n'));
    else bloecke.push(text.split('\n').map(zeilenanfangSchuetzen).join('\n'));
  }

  if (zuletzt < roh.length) alsAbsatzAufnehmen(roh.slice(zuletzt));

  return bloecke.join('\n\n');
}

/* ------------------------------------------------------------------ *
 * Schreibweise  ->  HTML
 * ------------------------------------------------------------------ */

/** Wandelt eine Zeile Schreibweise in sicheres HTML mit Auszeichnungen um. */
function inlineAlsHtml(text) {
  // Geschuetzte Zeichen zuerst beiseitelegen, damit sie unten nicht als
  // Auszeichnung gelesen werden.
  // Die Ziffer gehoert dazu, weil `zeilenanfangSchuetzen` auch eine
  // Aufzaehlung wie „1. " schuetzt, die keine sein soll.
  const beiseite = [];
  let roh = String(text ?? '').replace(/\\([\\*_`#>\-\d])/g, (treffer, zeichen) => {
    beiseite.push(zeichen);
    return marke(String(beiseite.length - 1));
  });

  roh = zeichenSchuetzen(roh);

  // Reihenfolge ist wichtig: die laengeren Marken zuerst.
  roh = roh
    .replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__([\s\S]+?)__/g, '<u>$1</u>')
    .replace(/\*([^*\n]+?)\*/g, '<em>$1</em>')
    .replace(/`([^`\n]+?)`/g, '<code>$1</code>');

  const zurueck = new RegExp(STEUER + '(\\d+)' + STEUER, 'g');
  return roh.replace(zurueck, (treffer, nummer) => zeichenSchuetzen(beiseite[Number(nummer)]));
}

/**
 * Wandelt die einfache Schreibweise in HTML fuer die Weltenschmiede um.
 *
 * @param {string} text
 * @returns {string}
 */
export function alsHtml(text) {
  const zeilen = String(text ?? '').replace(/\r\n?/g, '\n').split('\n');
  const teile = [];

  /** Gesammelte Zeilen eines Absatzes, einer Liste oder eines Zitats. */
  let sammlung = [];
  let art = null;

  const abschliessen = () => {
    if (!sammlung.length) { art = null; return; }
    if (art === 'ul' || art === 'ol') {
      teile.push(
        '<' + art + '>' +
        sammlung.map((z) => '<li>' + inlineAlsHtml(z) + '</li>').join('') +
        '</' + art + '>',
      );
    } else if (art === 'zitat') {
      teile.push('<blockquote>' + sammlung.map(inlineAlsHtml).join('<br>') + '</blockquote>');
    } else {
      teile.push('<p>' + sammlung.map(inlineAlsHtml).join('<br>') + '</p>');
    }
    sammlung = [];
    art = null;
  };

  for (const rohZeile of zeilen) {
    const zeile = rohZeile.trim();

    if (!zeile) { abschliessen(); continue; }

    const ueberschrift = zeile.match(/^(#{1,3})\s+(.*)$/);
    if (ueberschrift) {
      abschliessen();
      const stufe = { 1: 'h2', 2: 'h3', 3: 'h4' }[ueberschrift[1].length];
      teile.push('<' + stufe + '>' + inlineAlsHtml(ueberschrift[2].trim()) + '</' + stufe + '>');
      continue;
    }

    const punkt = zeile.match(/^-\s+(.*)$/);
    if (punkt) {
      if (art !== 'ul') abschliessen();
      art = 'ul';
      sammlung.push(punkt[1].trim());
      continue;
    }

    const nummer = zeile.match(/^\d+\.\s+(.*)$/);
    if (nummer) {
      if (art !== 'ol') abschliessen();
      art = 'ol';
      sammlung.push(nummer[1].trim());
      continue;
    }

    const zitat = zeile.match(/^>\s+(.*)$/);
    if (zitat) {
      if (art !== 'zitat') abschliessen();
      art = 'zitat';
      sammlung.push(zitat[1].trim());
      continue;
    }

    if (art && art !== 'absatz') abschliessen();
    art = 'absatz';
    sammlung.push(zeile);
  }

  abschliessen();
  return teile.join('');
}

/**
 * Reiner Text ohne jede Auszeichnung. Die Weltenschmiede fuehrt neben dem
 * HTML eine Nur-Text-Fassung mit; beide muessen zusammenpassen.
 *
 * @param {string} html
 * @returns {string}
 */
export function alsReinerText(html) {
  return zeichenEntschluesseln(
    String(html ?? '')
      .replace(/<\s*\/\s*(p|h2|h3|h4|li|blockquote)\s*>/gi, '\n')
      .replace(/<\s*br\s*\/?\s*>/gi, '\n')
      .replace(/<[^>]*>/g, ''),
  )
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
