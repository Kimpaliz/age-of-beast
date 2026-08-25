/* ===================================================================
   Age-of-Beast-Wiki – Texte bearbeiten
   -------------------------------------------------------------------
   Angemeldet erscheint im Kopf der Knopf „Bearbeiten". Ist er gedrückt,
   bekommt jeder änderbare Text auf einer Eintragsseite einen Stift:

     - der Name des Eintrags
     - der Kurztext direkt darunter
     - die Überschrift eines Abschnitts
     - der Text eines Abschnitts

   Ein Klick auf den Stift öffnet ein Feld. Gespeichert wird genau an der
   Stelle im Weltstand, aus der der Text stammt – welche das ist, steht in
   `abschnitt.herkunft` und wird von `welt-umwandeln.mjs` gesetzt.

   Was hier NICHT geht, und zwar mit Absicht: Abschnitte anlegen, löschen
   oder umsortieren, Steckbriefzeilen und Verknüpfungen ändern, Einträge
   anlegen oder löschen. Das ist der Umfang der Fassungen 2.1.0 und 2.2.0.

   Diese Datei enthält ausschließlich die Bedienung. Sie weiß bewusst
   nicht, wohin gespeichert wird – das entscheidet `bearbeiten.js` und
   reicht es als `werkzeug.schreiben` herein. Genau diese Trennung hat den
   Umzug von Firebase nach GitHub zu einer kleinen Änderung gemacht.

   Welche Stelle im Weltstand zu einem Feld gehört und wie umgerechnet
   wird, steht in `werkzeuge/bearbeiten-stellen.mjs` – dort ohne DOM, damit
   `werkzeuge/pruefe-bearbeiten.mjs` es in Node nachprüfen kann.
   =================================================================== */

import {
  ART,
  stelleFinden,
  zumBearbeiten,
  zumSpeichern,
} from './werkzeuge/bearbeiten-stellen.mjs';

const HILFE_SCHREIBWEISE =
  'Leerzeile = neuer Absatz · ## Überschrift · **fett** · *kursiv* · - Listenpunkt';

/* ================================================================
   1. Das Bearbeitungsfeld
   ================================================================ */

/** Merkt sich das gerade offene Feld, damit nie zwei zugleich offen sind. */
let offenesFeld = null;

function feldSchliessen() {
  if (!offenesFeld) return;
  const { kasten, ziel } = offenesFeld;
  kasten.remove();
  ziel.hidden = false;
  offenesFeld = null;
}

/**
 * Öffnet ein Bearbeitungsfeld unter dem angeklickten Element.
 *
 * @param {HTMLElement} ziel   Das angezeigte Element (h1, p.anriss, h2, div)
 * @param {object} stelle      Ergebnis von `stelleFinden`
 * @param {Function} sichern   Bekommt den neuen Feldinhalt, gibt ein Promise
 */
function feldOeffnen(ziel, stelle, sichern) {
  feldSchliessen();

  const kasten = document.createElement('div');
  kasten.className = 'bearbeiten-kasten';

  const beschriftung = document.createElement('label');
  beschriftung.className = 'bearbeiten-beschriftung';
  beschriftung.textContent = stelle.beschriftung;

  const eingabe =
    stelle.art === ART.zeile ? document.createElement('input') : document.createElement('textarea');
  if (stelle.art === ART.zeile) eingabe.type = 'text';
  eingabe.className = 'bearbeiten-eingabe';
  eingabe.value = zumBearbeiten(stelle.wert, stelle.art);
  eingabe.spellcheck = true;

  const kennung = 'bearbeiten-eingabe-' + Math.random().toString(36).slice(2, 9);
  eingabe.id = kennung;
  beschriftung.htmlFor = kennung;

  if (stelle.art !== ART.zeile) {
    // Das Feld soll den ganzen Text zeigen, ohne dass gescrollt werden muss.
    const zeilen = eingabe.value.split('\n').length;
    eingabe.rows = Math.min(30, Math.max(6, zeilen + 2));
  }

  const knopfleiste = document.createElement('div');
  knopfleiste.className = 'bearbeiten-knopfleiste';

  const speichern = document.createElement('button');
  speichern.type = 'button';
  speichern.className = 'bearbeiten-speichern';
  speichern.textContent = 'Speichern';

  const abbrechen = document.createElement('button');
  abbrechen.type = 'button';
  abbrechen.className = 'bearbeiten-abbrechen';
  abbrechen.textContent = 'Abbrechen';

  const meldung = document.createElement('span');
  meldung.className = 'bearbeiten-meldung';
  meldung.setAttribute('role', 'status');

  knopfleiste.append(speichern, abbrechen, meldung);
  kasten.append(beschriftung, eingabe);

  if (stelle.art === ART.schreibweise) {
    const hilfe = document.createElement('p');
    hilfe.className = 'bearbeiten-hilfe';
    hilfe.textContent = HILFE_SCHREIBWEISE;
    kasten.append(hilfe);
  }

  kasten.append(knopfleiste);

  ziel.hidden = true;
  ziel.after(kasten);
  offenesFeld = { kasten, ziel };

  eingabe.focus();
  if (stelle.art !== ART.zeile) eingabe.setSelectionRange(0, 0);

  const abbruch = () => feldSchliessen();

  const sichernVersuchen = async () => {
    speichern.disabled = true;
    abbrechen.disabled = true;
    meldung.textContent = 'Wird gespeichert …';
    meldung.dataset.zustand = 'laedt';
    try {
      await sichern(eingabe.value);
      // Die Seite wird danach neu gezeichnet; der Kasten verschwindet mit ihr.
      offenesFeld = null;
    } catch (fehler) {
      speichern.disabled = false;
      abbrechen.disabled = false;
      meldung.textContent = 'Nicht gespeichert: ' + (fehler?.message || fehler);
      meldung.dataset.zustand = 'fehler';
    }
  };

  speichern.addEventListener('click', sichernVersuchen);
  abbrechen.addEventListener('click', abbruch);

  eingabe.addEventListener('keydown', (ereignis) => {
    if (ereignis.key === 'Escape') { ereignis.preventDefault(); abbruch(); }
    // Strg+Eingabe speichert. Bei der einzelnen Zeile genügt die Eingabetaste.
    if (ereignis.key === 'Enter' && (ereignis.ctrlKey || ereignis.metaKey || stelle.art === ART.zeile)) {
      ereignis.preventDefault();
      sichernVersuchen();
    }
  });
}

/* ================================================================
   2. Stifte setzen
   ================================================================ */

function stiftBauen(beschriftung) {
  const knopf = document.createElement('button');
  knopf.type = 'button';
  knopf.className = 'bearbeiten-stift';
  knopf.title = beschriftung;
  knopf.setAttribute('aria-label', beschriftung);
  knopf.textContent = '✎';
  return knopf;
}

/* ================================================================
   3. Einrichten
   ================================================================ */

/**
 * Richtet die Bearbeitungsansicht ein.
 *
 * @param {object} werkzeug
 * @param {Function} werkzeug.rohStand    Gibt den gehaltenen Rohstand zurück
 * @param {Function} werkzeug.schreiben   Schreibt ein Bündel Änderungen
 * @param {Function} werkzeug.neuZeichnen Baut die Welt neu auf und zeichnet
 */
export function bearbeitenEinrichten(werkzeug) {
  const knopf = document.getElementById('bearbeiten-knopf');
  if (!knopf) return;

  let an = false;

  const zustandSetzen = (neu) => {
    an = neu;
    document.documentElement.dataset.bearbeiten = an ? 'an' : '';
    knopf.setAttribute('aria-pressed', String(an));
    knopf.textContent = an ? 'Fertig' : 'Bearbeiten';
    if (!an) feldSchliessen();
    stifteSetzen();
  };

  knopf.hidden = false;
  knopf.addEventListener('click', () => zustandSetzen(!an));

  /** Baut die Stiftknöpfe auf der gerade gezeichneten Seite auf. */
  function stifteSetzen() {
    document.querySelectorAll('.bearbeiten-stift').forEach((alt) => alt.remove());
    if (!an) return;

    const artikel = document.querySelector('.artikel[data-eintrag]');
    if (!artikel) return;

    const eintragId = artikel.dataset.eintrag;
    const kategorie = artikel.dataset.kategorie;
    const roh = werkzeug.rohStand();
    const element = roh?.elements?.[kategorie]?.[eintragId];
    if (!element) return;

    const welt = window.ageOfBeast.weltHolen();
    const eintrag = welt.eintraege.find((e) => e.id === eintragId);
    if (!eintrag) return;

    for (const ziel of artikel.querySelectorAll('[data-feld]')) {
      const feld = ziel.dataset.feld;
      const abschnitt = ziel.closest('[data-abschnitt]');
      const herkunft = abschnitt
        ? eintrag.abschnitte[Number(abschnitt.dataset.abschnitt)]?.herkunft
        : null;

      const stelle = stelleFinden(element, feld, herkunft);
      if (!stelle) continue;

      const stift = stiftBauen(stelle.beschriftung + ' ändern');
      stift.addEventListener('click', () => {
        // Beim Öffnen wird der Wert frisch geholt: Zwischen dem Setzen des
        // Stifts und dem Klick kann bereits ein anderes Feld gespeichert
        // worden sein.
        const jetzt = stelleFinden(werkzeug.rohStand()?.elements?.[kategorie]?.[eintragId], feld, herkunft);
        if (!jetzt) {
          window.alert(
            'Dieser Text lässt sich gerade nicht bearbeiten. ' +
              'Vermutlich hat sich der Aufbau des Eintrags in der Weltenschmiede geändert. ' +
              'Bitte die Seite neu laden.',
          );
          return;
        }
        feldOeffnen(ziel, jetzt, (eingabe) =>
          sichern(kategorie, eintragId, eintrag.name, jetzt, eingabe));
      });

      ziel.append(stift);
    }
  }

  /**
   * Gibt eine Änderung weiter und zeichnet neu.
   *
   * Das Eintragen in den Weltstand übernimmt bewusst die Ablage, nicht
   * diese Datei: Sie soll nicht wissen, wohin gespeichert wird. Erst wenn
   * die Ablage bestätigt hat, wird neu gezeichnet – so steht im Wiki nie
   * etwas, das nirgends gespeichert ist.
   */
  async function sichern(kategorie, eintragId, eintragName, stelle, eingabe) {
    const werte = zumSpeichern(eingabe, stelle.art, stelle.ziele);
    const basis = 'elements/' + kategorie + '/' + eintragId + '/';
    const jetzt = new Date().toISOString();

    const aenderungen = {};
    for (const [pfad, wert] of Object.entries(werte)) aenderungen[basis + pfad] = wert;
    aenderungen[basis + 'updatedAt'] = jetzt;
    aenderungen.updatedAt = jetzt;

    await werkzeug.schreiben(aenderungen, eintragName + ': ' + stelle.beschriftung + ' geändert');

    werkzeug.neuZeichnen();
  }

  // Nach jedem Seitenwechsel müssen die Stifte neu gesetzt werden.
  window.ageOfBeast.beiNeuZeichnen(stifteSetzen);

  zustandSetzen(false);
}
