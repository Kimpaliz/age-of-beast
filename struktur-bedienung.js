/* ===================================================================
   [Aufgabe: Bearbeiten]
   Age-of-Beast-Wiki – Aufbau bearbeiten
   -------------------------------------------------------------------
   Ergänzt den Bearbeitungsmodus um alles, was ein Stift am Text nicht
   kann: Abschnitte anlegen, löschen und umsortieren, Steckbriefzeilen
   ändern, anlegen und entfernen.

   Die Stifte selbst stehen in `texte-bearbeiten.js`. Beide Dateien
   arbeiten nebeneinander am selben Eintrag und teilen sich nur zwei
   Dinge: den Schalter im Kopf und die Meldung, dass neu gezeichnet
   wurde.

   Was hier NICHT passiert: entscheiden, wie eine Änderung aussieht.
   Das steht in `werkzeuge/struktur-bearbeiten.mjs` – dort ohne DOM,
   damit `werkzeuge/pruefe-struktur.mjs` es in Node an allen echten
   Einträgen nachprüfen kann. Diese Datei ist reine Bedienung.
   =================================================================== */

import {
  abschnittAnlegen,
  abschnittLoeschen,
  abschnittVerschieben,
  abschnittsReihenfolge,
  steckbriefZeilen,
  zeileAnlegen,
  zeileLoeschen,
  zeileSetzen,
} from './werkzeuge/struktur-bearbeiten.mjs';

/* ================================================================
   Kleine Bausteine
   ================================================================ */

function knopfBauen(zeichen, beschriftung, klasse) {
  const knopf = document.createElement('button');
  knopf.type = 'button';
  knopf.className = 'struktur-knopf' + (klasse ? ' ' + klasse : '');
  knopf.textContent = zeichen;
  knopf.title = beschriftung;
  knopf.setAttribute('aria-label', beschriftung);
  return knopf;
}

/** Merkt sich das offene Zeilenformular, damit nie zwei zugleich offen sind. */
let offenesFormular = null;

function formularSchliessen() {
  if (!offenesFormular) return;
  offenesFormular.remove();
  offenesFormular = null;
}

/* ================================================================
   Einrichtung
   ================================================================ */

export function strukturEinrichten(kontext) {
  /** Ist der Bearbeitungsmodus gerade an? */
  const an = () => document.documentElement.dataset.bearbeiten === 'an';

  /**
   * Trägt eine Änderung ein und zeichnet neu.
   *
   * Wie bei den Stiften gilt: Erst wenn die Ablage bestätigt hat, wird
   * neu gezeichnet. Schlägt das Speichern fehl, bleibt der angezeigte
   * Stand unberührt.
   */
  async function anwenden(kategorie, eintragId, eintragName, schritt) {
    if (!schritt) return;
    const basis = 'elements/' + kategorie + '/' + eintragId + '/';
    const jetzt = new Date().toISOString();

    const aenderungen = {};
    for (const [pfad, wert] of Object.entries(schritt.aenderungen)) {
      aenderungen[basis + pfad] = wert;
    }
    aenderungen[basis + 'updatedAt'] = jetzt;
    aenderungen.updatedAt = jetzt;

    await kontext.schreiben(aenderungen, eintragName + ': ' + schritt.beschreibung);
    kontext.neuZeichnen();
  }

  /** Zeigt einen Fehler so, dass er nicht zu übersehen ist. */
  function schiefgegangen(fehler) {
    window.alert(
      'Das hat nicht geklappt:\n\n' +
        (fehler && fehler.message ? fehler.message : String(fehler)) +
        '\n\nDer angezeigte Stand ist unverändert.',
    );
  }

  /* --------------------------------------------------------------
     Aufbauen
     -------------------------------------------------------------- */

  function bedienungSetzen() {
    // Alles Frühere entfernen – auch wenn der Modus gerade aus ist.
    document.querySelectorAll('.struktur-leiste, .struktur-anhang').forEach((alt) => alt.remove());
    formularSchliessen();
    if (!an()) return;

    const artikel = document.querySelector('.artikel[data-eintrag]');
    if (!artikel) return;

    const eintragId = artikel.dataset.eintrag;
    const kategorie = artikel.dataset.kategorie;
    const holen = () => kontext.rohStand()?.elements?.[kategorie]?.[eintragId];
    const element = holen();
    if (!element) return;

    const runtime = kontext.runtimeHolen();
    const welt = typeof runtime?.weltHolen === 'function' ? runtime.weltHolen() : null;
    if (!welt || !Array.isArray(welt.eintraege)) return;
    const eintrag = welt.eintraege.find((e) => e.id === eintragId);
    if (!eintrag) return;
    const name = eintrag.name;

    const lauf = (schritt) =>
      anwenden(kategorie, eintragId, name, schritt).catch(schiefgegangen);

    /* --- Abschnitte: verschieben und löschen -------------------- */

    const reihenfolge = abschnittsReihenfolge(element);

    for (const abschnitt of artikel.querySelectorAll('section.abschnitt[data-panel]')) {
      const panelId = abschnitt.dataset.panel;
      const stelle = reihenfolge.indexOf(panelId);

      const leiste = document.createElement('div');
      leiste.className = 'struktur-leiste';

      const hoch = knopfBauen('↑', 'Abschnitt nach oben');
      hoch.disabled = stelle <= 0;
      hoch.addEventListener('click', () => lauf(abschnittVerschieben(holen(), panelId, -1)));

      const runter = knopfBauen('↓', 'Abschnitt nach unten');
      runter.disabled = stelle === -1 || stelle >= reihenfolge.length - 1;
      runter.addEventListener('click', () => lauf(abschnittVerschieben(holen(), panelId, 1)));

      const weg = knopfBauen('✕', 'Abschnitt löschen', 'gefahr');
      weg.addEventListener('click', () => {
        const ueberschrift = abschnitt.querySelector('h2')?.textContent || 'ohne Überschrift';
        if (!window.confirm('Den Abschnitt „' + ueberschrift + '" wirklich löschen?\n\nDer Text ist danach weg.')) return;
        lauf(abschnittLoeschen(holen(), panelId));
      });

      leiste.append(hoch, runter, weg);
      abschnitt.prepend(leiste);
    }

    /* --- Abschnitt anlegen -------------------------------------- */

    const spalte = artikel.querySelector('.artikel-text');
    if (spalte) {
      const anhang = document.createElement('div');
      anhang.className = 'struktur-anhang';
      const neu = document.createElement('button');
      neu.type = 'button';
      neu.className = 'struktur-neu';
      neu.textContent = '+ Abschnitt';
      neu.addEventListener('click', () => lauf(abschnittAnlegen(holen(), eintragId)));
      anhang.append(neu);
      spalte.append(anhang);
    }

    /* --- Steckbriefzeilen --------------------------------------- */

    const steckbrief = artikel.querySelector('.steckbrief');
    const zeilen = steckbriefZeilen(element);

    if (steckbrief) {
      for (const dd of steckbrief.querySelectorAll('dd[data-zeile]')) {
        const schluessel = dd.dataset.zeile;
        const zeile = zeilen.find((z) => z.schluessel === schluessel);
        if (!zeile) continue;

        const leiste = document.createElement('span');
        leiste.className = 'struktur-leiste zeile';

        const stift = knopfBauen('✎', 'Zeile „' + zeile.beschriftung + '" ändern');
        stift.addEventListener('click', () => zeileOeffnen(dd, zeile, lauf, holen));

        const weg = knopfBauen('✕', 'Zeile „' + zeile.beschriftung + '" entfernen', 'gefahr');
        weg.addEventListener('click', () => {
          if (!window.confirm('Die Zeile „' + zeile.beschriftung + '" wirklich entfernen?')) return;
          lauf(zeileLoeschen(holen(), schluessel));
        });

        leiste.append(stift, weg);
        dd.append(leiste);
      }

      const anhang = document.createElement('div');
      anhang.className = 'struktur-anhang';
      const neu = document.createElement('button');
      neu.type = 'button';
      neu.className = 'struktur-neu';
      neu.textContent = '+ Zeile';
      neu.addEventListener('click', () => zeileOeffnen(anhang, null, lauf, holen, eintragId));
      anhang.append(neu);
      steckbrief.append(anhang);
    }
  }

  /* --------------------------------------------------------------
     Formular für eine Steckbriefzeile
     -------------------------------------------------------------- */

  function zeileOeffnen(ziel, zeile, lauf, holen, eintragId) {
    formularSchliessen();

    const kasten = document.createElement('div');
    kasten.className = 'zeile-formular';

    const beschriftung = document.createElement('input');
    beschriftung.type = 'text';
    beschriftung.className = 'zeile-feld';
    beschriftung.placeholder = 'Beschriftung';
    beschriftung.value = zeile ? zeile.beschriftung : '';

    const wert = document.createElement('input');
    wert.type = 'text';
    wert.className = 'zeile-feld';
    wert.placeholder = 'Wert';
    wert.value = zeile ? zeile.wert : '';

    const knoepfe = document.createElement('div');
    knoepfe.className = 'zeile-knoepfe';

    const sichern = document.createElement('button');
    sichern.type = 'button';
    sichern.className = 'bearbeiten-speichern';
    sichern.textContent = 'Speichern';

    const abbrechen = document.createElement('button');
    abbrechen.type = 'button';
    abbrechen.className = 'bearbeiten-abbrechen';
    abbrechen.textContent = 'Abbrechen';
    abbrechen.addEventListener('click', formularSchliessen);

    sichern.addEventListener('click', async () => {
      const b = beschriftung.value.trim();
      if (!b) {
        window.alert('Die Beschriftung darf nicht leer sein.');
        beschriftung.focus();
        return;
      }
      sichern.disabled = true;
      abbrechen.disabled = true;
      try {
        const schritt = zeile
          ? zeileSetzen(holen(), zeile.schluessel, b, wert.value)
          : zeileAnlegen(holen(), eintragId, b, wert.value);
        if (!schritt) {
          // Nichts geändert – das ist kein Fehler.
          formularSchliessen();
          return;
        }
        formularSchliessen();
        await lauf(schritt);
      } finally {
        sichern.disabled = false;
        abbrechen.disabled = false;
      }
    });

    kasten.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); formularSchliessen(); }
      if (e.key === 'Enter') { e.preventDefault(); sichern.click(); }
    });

    knoepfe.append(sichern, abbrechen);
    kasten.append(beschriftung, wert, knoepfe);
    ziel.append(kasten);
    offenesFormular = kasten;
    beschriftung.focus();
    beschriftung.select();
  }

  /* --------------------------------------------------------------
     Anschluss
     -------------------------------------------------------------- */

  const runtime = kontext.runtimeHolen();
  if (typeof runtime?.beiNeuZeichnen === 'function') runtime.beiNeuZeichnen(bedienungSetzen);
  document.addEventListener('bearbeiten-umgeschaltet', bedienungSetzen);
  bedienungSetzen();
}
