/* ===================================================================
   Age-of-Beast-Wiki – Kampagnenrahmen-Assistent
   -------------------------------------------------------------------
   Der Assistent der Daggerheart-Werkstatt, übersetzt ins Wiki. Neun
   Schritte, 33 Felder und zwei Listen — mit denselben Fragen und
   Hilfetexten wie im Original.

   Der eigentliche Wert liegt nicht in den Eingabefeldern, sondern in den
   Fragen: „Was tut die Gruppe regelmäßig?" statt „Aktivität". Genau die
   sind übernommen; sie stehen in `daten/rahmen-felder.json` und werden
   von `werkzeuge/rahmen-felder-lesen.mjs` aus der Werkstatt gelesen.

   Gespeichert wird schrittweise: Ein Klick auf Speichern schreibt alle
   geänderten Felder eines Schritts in **einen** Commit. Das ergibt
   nachvollziehbare Änderungen statt eines Commits je Tastendruck.

   Die Rahmen liegen als Rohform unter `rahmen` in `daten/quelle.json`.
   Der Wiki-Eintrag wird daraus bei jedem Aufbereiten erzeugt — deshalb
   wirkt eine Änderung hier sofort auch im Eintrag.
   =================================================================== */

const FELDER_ADRESSE = 'daten/rahmen-felder.json';

/** Einmal geladen, dann behalten. */
let beschreibung = null;

async function beschreibungLaden() {
  if (beschreibung) return beschreibung;
  const antwort = await fetch(FELDER_ADRESSE, { cache: 'no-cache' });
  if (!antwort.ok) throw new Error('Die Feldbeschreibung fehlt (' + antwort.status + ').');
  beschreibung = await antwort.json();
  return beschreibung;
}

/* ================================================================
   Kleine Helfer
   ================================================================ */

const sicher = (text) =>
  String(text ?? '')
    .split('&').join('&amp;')
    .split('<').join('&lt;')
    .split('>').join('&gt;')
    .split('"').join('&quot;');

/** Liest `core/concept` aus einem verschachtelten Objekt. */
function inTiefeLesen(objekt, pfad) {
  let stelle = objekt;
  for (const teil of String(pfad).split('/').filter(Boolean)) {
    if (stelle === null || stelle === undefined) return '';
    stelle = stelle[teil];
  }
  return stelle === null || stelle === undefined ? '' : String(stelle);
}

/* ================================================================
   Einrichtung
   ================================================================ */

export function rahmenAssistentEinrichten(werkzeug) {
  /** Welcher Schritt ist gerade offen? Je Rahmen gemerkt. */
  const offenerSchritt = new Map();

  /**
   * Eine Meldung, die den nächsten Neuaufbau überlebt.
   *
   * Nach dem Speichern zeichnet das Wiki die Seite neu — der Assistent
   * wird dabei vollständig ersetzt. Eine Bestätigung, die vorher in das
   * alte Feld geschrieben wurde, wäre sofort wieder weg: Man klickt auf
   * Speichern und sieht nichts. Deshalb wird sie hier zwischengelegt und
   * beim Aufbau des neuen Schritts angezeigt.
   */
  let naechsteMeldung = '';

  /**
   * Zeichnet den Assistenten für einen Rahmen.
   * Wird von `wiki.js` über `window.ageOfBeast.rahmenZeichnen` gerufen.
   */
  async function zeichnen(inhalt, rahmenId) {
    const stand = werkzeug.rohStand();
    const rahmen = stand?.rahmen?.[rahmenId];

    if (!rahmen) {
      inhalt.innerHTML =
        '<div class="hinweis"><strong>Diesen Kampagnenrahmen gibt es nicht.</strong><br>' +
        'Vielleicht wurde er umbenannt. Zurück zur ' +
        '<a href="#/">Arbeitsfläche</a>.</div>';
      return;
    }

    let b;
    try {
      b = await beschreibungLaden();
    } catch (fehler) {
      inhalt.innerHTML =
        '<div class="hinweis"><strong>Der Assistent lässt sich nicht laden.</strong><br>' +
        sicher(fehler.message) + '</div>';
      return;
    }

    const schrittNr = offenerSchritt.get(rahmenId) || 1;
    const titel = rahmen.inhalt?.title || 'Kampagnenrahmen';

    /* --- Gerüst ------------------------------------------------- */

    inhalt.innerHTML =
      '<p class="brotkrumen"><a class="zurueck" href="#/eintrag/' + sicher(rahmenId) + '">&lsaquo; Zum Eintrag</a>' +
      '<span class="pfad">Werkstatt / Kampagnenrahmen / ' + sicher(titel) + '</span></p>' +
      '<div class="assistent" data-kategorie="werkstatt">' +
        '<span class="mikro">Kampagnenrahmen-Assistent</span>' +
        '<h1>' + sicher(titel) + '</h1>' +
        '<ol class="schritt-leiste">' +
          b.schritte.map((s) =>
            '<li><button type="button" class="schritt-knopf" data-schritt="' + s.nummer + '"' +
            (s.nummer === schrittNr ? ' aria-current="step"' : '') + '>' +
            '<span class="nummer">' + s.nummer + '</span>' +
            '<span class="name">' + sicher(s.kurz) + '</span></button></li>',
          ).join('') +
        '</ol>' +
        '<div class="schritt-inhalt" id="schritt-inhalt"></div>' +
      '</div>';

    document.title = titel + ' – Assistent';

    for (const knopf of inhalt.querySelectorAll('.schritt-knopf')) {
      knopf.addEventListener('click', () => {
        offenerSchritt.set(rahmenId, Number(knopf.dataset.schritt));
        zeichnen(inhalt, rahmenId);
      });
    }

    schrittZeichnen(inhalt.querySelector('#schritt-inhalt'), b, rahmen, rahmenId, schrittNr);
  }

  /* --------------------------------------------------------------
     Ein Schritt
     -------------------------------------------------------------- */

  function schrittZeichnen(bereich, b, rahmen, rahmenId, nummer) {
    const schritt = b.schritte.find((s) => s.nummer === nummer);
    const felder = b.felder.filter((f) => f.schritt === nummer);
    const listen = b.listen.filter((l) => l.schritt === nummer);

    bereich.innerHTML = '<h2>' + sicher(schritt ? schritt.name : 'Schritt ' + nummer) + '</h2>';

    if (!felder.length && !listen.length) {
      bereich.insertAdjacentHTML(
        'beforeend',
        '<p class="leise">Dieser Schritt fasst nur zusammen. Es gibt hier nichts einzutragen.</p>',
      );
      return;
    }

    const formular = document.createElement('div');
    formular.className = 'assistent-formular';

    /** Pfad -> Eingabefeld, für das Speichern am Ende. */
    const eingaben = new Map();

    for (const feld of felder) {
      formular.append(feldBauen(feld, rahmen, eingaben));
    }

    for (const liste of listen) {
      formular.append(listeBauen(liste, rahmen, eingaben));
    }

    /* --- Speichern ---------------------------------------------- */

    const leiste = document.createElement('div');
    leiste.className = 'assistent-knopfleiste';

    const speichern = document.createElement('button');
    speichern.type = 'button';
    speichern.className = 'bearbeiten-speichern';
    speichern.textContent = 'Diesen Schritt speichern';

    const meldung = document.createElement('span');
    meldung.className = 'assistent-meldung leise';
    // Eine Bestätigung aus dem vorherigen Speichern nachreichen.
    if (naechsteMeldung) {
      meldung.textContent = naechsteMeldung;
      naechsteMeldung = '';
    }

    speichern.addEventListener('click', async () => {
      const aenderungen = {};
      for (const [pfad, feld] of eingaben) {
        const alt = inTiefeLesen(rahmen.inhalt, pfad);
        if (feld.value !== alt) {
          aenderungen['rahmen/' + rahmenId + '/inhalt/' + pfad] = feld.value;
        }
      }

      if (!Object.keys(aenderungen).length) {
        meldung.textContent = 'Nichts geändert.';
        return;
      }

      speichern.disabled = true;
      meldung.textContent = 'Wird gespeichert …';
      aenderungen['rahmen/' + rahmenId + '/geaendertAm'] = new Date().toISOString();
      aenderungen.updatedAt = new Date().toISOString();

      try {
        const anzahl = Object.keys(aenderungen).length - 2;
        await werkzeug.schreiben(
          aenderungen,
          (rahmen.inhalt?.title || 'Rahmen') + ': ' + (schritt ? schritt.name : 'Schritt ' + nummer) +
            ' (' + anzahl + (anzahl === 1 ? ' Feld' : ' Felder') + ')',
        );
        // Erst vormerken, dann neu zeichnen: Der Neuaufbau ersetzt dieses
        // Feld, die Meldung erscheint danach im frisch gebauten.
        naechsteMeldung =
          'Gespeichert — ' + anzahl + (anzahl === 1 ? ' Feld' : ' Felder') + ' geändert.';
        werkzeug.neuZeichnen();
      } catch (fehler) {
        meldung.textContent = '';
        window.alert(
          'Das Speichern hat nicht geklappt:\n\n' +
            (fehler && fehler.message ? fehler.message : String(fehler)) +
            '\n\nDeine Eingaben stehen noch im Feld.',
        );
      } finally {
        speichern.disabled = false;
      }
    });

    leiste.append(speichern, meldung);
    formular.append(leiste);
    bereich.append(formular);
  }

  /* --------------------------------------------------------------
     Ein einzelnes Feld
     -------------------------------------------------------------- */

  function feldBauen(feld, rahmen, eingaben) {
    const gruppe = document.createElement('div');
    gruppe.className = 'assistent-feld';

    const kennung = 'rf-' + feld.pfad.split('/').join('-');

    const beschriftung = document.createElement('label');
    beschriftung.className = 'assistent-beschriftung';
    beschriftung.setAttribute('for', kennung);
    beschriftung.textContent = feld.beschriftung;
    if (feld.pflicht) {
      const stern = document.createElement('span');
      stern.className = 'pflicht';
      stern.textContent = ' *';
      stern.title = 'Pflichtfeld';
      beschriftung.append(stern);
    }
    gruppe.append(beschriftung);

    if (feld.hilfe) {
      const hilfe = document.createElement('p');
      hilfe.className = 'assistent-hilfe';
      hilfe.textContent = feld.hilfe;
      gruppe.append(hilfe);
    }

    const eingabe =
      feld.art === 'absatz' ? document.createElement('textarea') : document.createElement('input');
    if (feld.art !== 'absatz') eingabe.type = 'text';
    eingabe.id = kennung;
    eingabe.className = 'assistent-eingabe';
    eingabe.value = inTiefeLesen(rahmen.inhalt, feld.pfad);
    if (feld.beispiel) eingabe.placeholder = feld.beispiel;
    if (feld.hoechstlaenge) eingabe.maxLength = feld.hoechstlaenge;
    if (feld.art === 'absatz') eingabe.rows = 4;

    eingaben.set(feld.pfad, eingabe);
    gruppe.append(eingabe);
    return gruppe;
  }

  /* --------------------------------------------------------------
     Eine Liste (Besonderheiten, Fraktionen)
     -------------------------------------------------------------- */

  function listeBauen(liste, rahmen, eingaben) {
    const block = document.createElement('section');
    block.className = 'assistent-liste';

    const kopf = document.createElement('h3');
    kopf.textContent = liste.name;
    block.append(kopf);

    if (liste.hilfe) {
      const hilfe = document.createElement('p');
      hilfe.className = 'assistent-hilfe';
      hilfe.textContent = liste.hilfe;
      block.append(hilfe);
    }

    const vorhanden = Array.isArray(rahmen.inhalt?.[liste.pfad]) ? rahmen.inhalt[liste.pfad] : [];
    const anzahl = Math.max(liste.anzahl, vorhanden.length);

    for (let n = 0; n < anzahl; n += 1) {
      const karte = document.createElement('div');
      karte.className = 'assistent-listeneintrag';

      const nummer = document.createElement('span');
      nummer.className = 'mikro';
      nummer.textContent = liste.name + ' ' + (n + 1);
      karte.append(nummer);

      for (const teil of liste.felder) {
        karte.append(
          feldBauen(
            {
              pfad: liste.pfad + '/' + n + '/' + teil.schluessel,
              beschriftung: teil.beschriftung,
              hilfe: '',
              beispiel: '',
              art: teil.art,
              pflicht: false,
              hoechstlaenge: teil.art === 'absatz' ? 600 : 120,
            },
            rahmen,
            eingaben,
          ),
        );
      }
      block.append(karte);
    }

    return block;
  }

  /* --------------------------------------------------------------
     Anschluss
     -------------------------------------------------------------- */

  window.ageOfBeast.rahmenZeichnen = zeichnen;
}
