/* ===================================================================
   Age of Beast — eigene Figuren, auf dem Gerät gemerkt
   [Aufgabe: Charakterbogen]

   -------------------------------------------------------------------
   Wer die Charaktererschaffung durchläuft, bekommt am Ende einen
   Bogen. Der muss irgendwo bleiben.

   **Warum auf dem Gerät und nicht in der Welt.** Die Weltdaten liegen
   in Firestore, und dorthin schreiben darf nur, wer angemeldet ist —
   `bogen.html` hat gar keine Anmeldung. Eine Erschaffung, die erst nach
   einem Google-Konto funktioniert, wäre für die Runde am Tisch
   unbrauchbar. Also: erst auf dem Gerät, sofort benutzbar.

   ⚠️ **Das ist ausdrücklich keine Sicherung.** `localStorage` gilt je
   Gerät und Browser. Wer die Website-Daten löscht, verliert die Figur.
   Deshalb gibt es `alsText()` — damit lässt sich ein Bogen kopieren und
   woanders ablegen, und daraus entsteht auch der Weg in die Welt,
   sobald es ihn gibt.

   Arbeitet zusammen mit: `karte/erschaffung.js` (legt an),
   `karte/bogen-zeigen.js` (zeigt sie neben den Weltfiguren),
   `werkzeuge/pruefe-erschaffung.mjs`.
   =================================================================== */

const SCHLUESSEL = 'aob.figuren.v1';

/* `localStorage` kann **werfen** statt leer zu sein: privates Fenster,
   gesperrte Website-Daten, Vorschaubild-Aufnahme. Ohne diesen Fang
   bliebe die ganze Seite leer. */
function lesen() {
  try {
    const roh = window.localStorage.getItem(SCHLUESSEL);
    const gelesen = roh ? JSON.parse(roh) : null;
    return gelesen && typeof gelesen === 'object' ? gelesen : {};
  } catch (fehler) {
    return {};
  }
}

function schreiben(alles) {
  try {
    window.localStorage.setItem(SCHLUESSEL, JSON.stringify(alles));
    return true;
  } catch (fehler) {
    return false;
  }
}

/** Alle eigenen Figuren, in der Reihenfolge ihres Anlegens. */
export function alleFiguren() {
  const alles = lesen();
  return Object.values(alles)
    .filter((e) => e && e.id && e.spielwerte)
    .sort((a, b) => String(a.angelegt || '').localeCompare(String(b.angelegt || '')));
}

export function figurHolen(id) {
  return lesen()[id] || null;
}

/**
 * Legt eine Figur ab oder ersetzt sie.
 *
 * Der Zeitpunkt wird **nur beim ersten Mal** gesetzt. Sonst spränge die
 * Figur bei jeder Änderung ans Ende der Liste, und wer zwei Bögen
 * pflegt, fände sie jedes Mal woanders.
 */
export function figurAblegen(eintrag) {
  if (!eintrag?.id) return false;
  const alles = lesen();
  const vorhanden = alles[eintrag.id];
  alles[eintrag.id] = {
    ...eintrag,
    eigen: true,
    angelegt: vorhanden?.angelegt || new Date().toISOString(),
    geaendert: new Date().toISOString(),
  };
  return schreiben(alles);
}

export function figurEntfernen(id) {
  const alles = lesen();
  if (!alles[id]) return false;
  delete alles[id];
  return schreiben(alles);
}

/** Ein Bogen als Text zum Kopieren — der Rückweg von diesem Gerät weg. */
export function alsText(eintrag) {
  return JSON.stringify(eintrag, null, 2);
}

/** Ob das Merken auf diesem Gerät überhaupt geht. */
export function speicherGehtOffenbar() {
  try {
    const probe = SCHLUESSEL + '.probe';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return true;
  } catch (fehler) {
    return false;
  }
}

export { SCHLUESSEL as FIGUREN_SCHLUESSEL };
