/* ===================================================================
   Age-of-Beast-Wiki
   -------------------------------------------------------------------
   Diese Datei baut die gesamte Oberfläche auf. Sie braucht keinen
   Server und keine Bibliothek: Die Weltdaten liegen in daten/welt.js
   und werden hier zu Seiten, Verweisen und Vorschaukarten verarbeitet.

   Aufbau der Datei:
     1. Daten einlesen und Nachschlagewerke aufbauen
     2. Automatische Verlinkung
     3. Bausteine der Oberfläche
     4. Seiten zeichnen (Start, Kategorie, Eintrag)
     5. Vorschaukarte beim Überfahren eines Verweises
     6. Suche
     7. Navigation, Adresszeile, Bedienung
   =================================================================== */

(function () {
  'use strict';

  /* ================================================================
     1. Daten einlesen und Nachschlagewerke aufbauen
     ================================================================ */

  let WELT = window.AGE_OF_BEAST_WELT;

  if (!WELT || !Array.isArray(WELT.eintraege)) {
    document.getElementById('inhalt').innerHTML =
      '<div class="hinweis"><strong>Die Weltdaten konnten nicht geladen werden.</strong><br>' +
      'Die Datei <code>daten/welt.js</code> fehlt oder ist beschädigt. ' +
      'Sie lässt sich mit <code>node werkzeuge/welt-aufbereiten.mjs</code> neu erzeugen.</div>';
    return;
  }

  /* ----------------------------------------------------------------
     Nachschlagewerke

     Alles Folgende wird aus WELT abgeleitet. Die Werte stehen bewusst
     als `let` und werden in nachschlagewerkeAufbauen() gesetzt: So kann
     die Bearbeitungsansicht die Weltdaten austauschen und neu zeichnen,
     ohne die Seite neu zu laden.
     ---------------------------------------------------------------- */

  /** id -> Eintrag */
  let nachId;
  /** Kategorieschluessel -> Beschreibung der Kategorie */
  let kategorieInfo;
  /** Kategorieschluessel -> Eintraege, alphabetisch */
  let nachKategorie;
  /** id -> reiner Text des Eintrags */
  let volltext;
  /** Alle Woerterbuchbegriffe, laengste zuerst */
  let begriffe;
  /** Ein einziger Suchausdruck ueber alle Begriffe */
  let verweisMuster;
  /** id -> Set von IDs, die diesen Eintrag im Text erwaehnen */
  let erwaehntVon;
  /** id -> Set von IDs, die dieser Eintrag im Text erwaehnt */
  let erwaehnt;
  /** id -> Liste eingehender fester Verbindungen */
  let verbundenVon;

  /** Reiner Text eines Eintrags – für Suche und Erwähnungen */
  const alsText = (eintrag) =>
    [eintrag.kurz, ...eintrag.abschnitte.map((a) => a.titel + ' ' + a.html)]
      .join(' ')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ');


  /* ================================================================
     2. Automatische Verlinkung
     ---------------------------------------------------------------
     Aus dem Wörterbuch wird ein einziger Suchausdruck gebaut. Er
     erkennt ganze Wörter, längere Begriffe zuerst.

     Zwei bewusste Regeln halten den Text lesbar:
       - Ein Begriff wird je Eintrag nur beim ersten Mal verlinkt.
       - Der Treffer muss groß geschrieben sein. Deutsche Hauptwörter
         sind das immer; so wird aus der Zahl „elf" kein Verweis auf
         die Spezies „Elf".
     ================================================================ */

  const maskieren = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  /** Beginnt der Treffer mit einem Großbuchstaben? */
  const grossGeschrieben = (treffer) => {
    const ersterBuchstabe = treffer.match(/\p{L}/u);
    return ersterBuchstabe ? ersterBuchstabe[0] === ersterBuchstabe[0].toUpperCase() : false;
  };

  /** Welche Einträge werden in einem Text erwähnt? */
  function erwaehnteEintraege(text, eigeneId) {
    const gefunden = new Set();
    if (!verweisMuster) return gefunden;
    verweisMuster.lastIndex = 0;
    let treffer;
    while ((treffer = verweisMuster.exec(text)) !== null) {
      if (!grossGeschrieben(treffer[1])) continue;
      const ziel = WELT.woerterbuch[treffer[1].toLowerCase()];
      if (ziel && ziel !== eigeneId) gefunden.add(ziel);
    }
    return gefunden;
  }

  /** Baut saemtliche Nachschlagewerke aus dem aktuellen WELT neu auf. */
  function nachschlagewerkeAufbauen() {
    nachId = new Map(WELT.eintraege.map((e) => [e.id, e]));

    kategorieInfo = new Map(WELT.kategorien.map((k) => [k.schluessel, k]));

    nachKategorie = new Map();
    for (const kategorie of WELT.kategorien) {
      nachKategorie.set(
        kategorie.schluessel,
        WELT.eintraege
          .filter((e) => e.kategorie === kategorie.schluessel)
          .sort((a, b) => a.name.localeCompare(b.name, 'de')),
      );
    }

    volltext = new Map(WELT.eintraege.map((e) => [e.id, alsText(e)]));

    begriffe = Object.keys(WELT.woerterbuch).sort((a, b) => b.length - a.length);

    verweisMuster = begriffe.length
      ? new RegExp(
          '(?<![\\p{L}\\p{N}])(' + begriffe.map(maskieren).join('|') + ')(?![\\p{L}\\p{N}])',
          'giu',
        )
      : null;

    erwaehntVon = new Map(WELT.eintraege.map((e) => [e.id, new Set()]));
    /** id -> Set von IDs, die dieser Eintrag im Text erwähnt */
    erwaehnt = new Map();
    for (const eintrag of WELT.eintraege) {
      const ziele = erwaehnteEintraege(volltext.get(eintrag.id), eintrag.id);
      erwaehnt.set(eintrag.id, ziele);
      for (const ziel of ziele) erwaehntVon.get(ziel).add(eintrag.id);
    }

    verbundenVon = new Map(WELT.eintraege.map((e) => [e.id, []]));
    for (const eintrag of WELT.eintraege) {
      for (const verbindung of eintrag.verbindungen) {
        if (verbundenVon.has(verbindung.ziel)) {
          verbundenVon.get(verbindung.ziel).push({
            art: verbindung.art,
            text: verbindung.text,
            ziel: eintrag.id,
          });
        }
      }
    }
  }

  nachschlagewerkeAufbauen();

  /** Wie viele andere Einträge hängen mit diesem zusammen? */
  function verknuepfungsZahl(eintrag) {
    const alle = new Set();
    for (const v of eintrag.verbindungen) alle.add(v.ziel);
    for (const v of verbundenVon.get(eintrag.id) || []) alle.add(v.ziel);
    for (const id of erwaehnt.get(eintrag.id) || []) alle.add(id);
    for (const id of erwaehntVon.get(eintrag.id) || []) alle.add(id);
    alle.delete(eintrag.id);
    return alle.size;
  }

  /**
   * Wie weit ist ein Eintrag ausgearbeitet? Rein aus dem Umfang
   * abgeleitet, damit auf einen Blick sichtbar ist, wo noch Arbeit wartet.
   */
  function reifegrad(eintrag) {
    const zeichen = volltext.get(eintrag.id).length;
    return eintrag.abschnitte.length >= 3 && zeichen > 900 ? 'ausgebaut' : 'knapp';
  }

  /**
   * Setzt in einem bereits gezeichneten Bereich die Verweise.
   * Arbeitet auf Textknoten, damit vorhandenes HTML unangetastet bleibt.
   */
  function verweiseSetzen(bereich, eigeneId, schonVerlinkt) {
    if (!verweisMuster) return;
    const belegt = schonVerlinkt || new Set();

    const laeufer = document.createTreeWalker(bereich, NodeFilter.SHOW_TEXT, {
      acceptNode(knoten) {
        if (!knoten.nodeValue || !knoten.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        // In Überschriften, Verweisen und Code wird nicht verlinkt:
        // Eine unterstrichene Überschrift stört den Lesefluss und würde
        // den Begriff für den Fließtext darunter verbrauchen.
        if (knoten.parentElement.closest('a, code, h1, h2, h3, h4')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    const knotenListe = [];
    while (laeufer.nextNode()) knotenListe.push(laeufer.currentNode);

    for (const knoten of knotenListe) {
      const text = knoten.nodeValue;
      verweisMuster.lastIndex = 0;

      let teile = null;
      let letztesEnde = 0;
      let treffer;

      while ((treffer = verweisMuster.exec(text)) !== null) {
        const wort = treffer[1];
        const ziel = WELT.woerterbuch[wort.toLowerCase()];

        if (!ziel || ziel === eigeneId) continue;
        if (belegt.has(ziel)) continue;
        if (!grossGeschrieben(wort)) continue;
        if (!nachId.has(ziel)) continue;

        if (!teile) teile = document.createDocumentFragment();
        if (treffer.index > letztesEnde) {
          teile.appendChild(document.createTextNode(text.slice(letztesEnde, treffer.index)));
        }

        const verweis = document.createElement('a');
        verweis.className = 'verweis';
        verweis.href = '#/eintrag/' + encodeURIComponent(ziel);
        verweis.dataset.ziel = ziel;
        verweis.textContent = wort;
        teile.appendChild(verweis);

        belegt.add(ziel);
        letztesEnde = treffer.index + wort.length;
      }

      if (teile) {
        if (letztesEnde < text.length) {
          teile.appendChild(document.createTextNode(text.slice(letztesEnde)));
        }
        knoten.parentNode.replaceChild(teile, knoten);
      }
    }
  }

  /* ================================================================
     3. Bausteine der Oberfläche
     ================================================================ */

  const inhalt = document.getElementById('inhalt');
  const navigation = document.getElementById('navigation');
  const rahmen = document.getElementById('rahmen');

  const sicher = (text) =>
    String(text ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const kategorieName = (s) => kategorieInfo.get(s)?.name ?? s;
  const kategorieEinzahl = (s) => kategorieInfo.get(s)?.einzahl ?? kategorieName(s);

  const kuerzen = (text, laenge) => {
    const t = String(text || '').trim();
    if (t.length <= laenge) return t;
    const schnitt = t.lastIndexOf(' ', laenge);
    return t.slice(0, schnitt > 0 ? schnitt : laenge) + ' …';
  };

  const datumDeutsch = (iso) => {
    if (!iso) return 'unbekannt';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return 'unbekannt';
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const datumKurz = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  /** „SPEZIES · KERN-ABSTAMMUNG" */
  const etikett = (eintrag) =>
    sicher(kategorieEinzahl(eintrag.kategorie)) +
    (eintrag.unterart ? ' &middot; ' + sicher(eintrag.unterart) : '');

  const anzahlWort = (n, einzahl, mehrzahl) => n + ' ' + (n === 1 ? einzahl : mehrzahl);

  /** Eine Kachel für Start- und Kategorieseite */
  function kachel(eintrag) {
    const zahl = verknuepfungsZahl(eintrag);
    const reife = reifegrad(eintrag);
    return (
      '<a class="kachel" href="#/eintrag/' + encodeURIComponent(eintrag.id) + '" ' +
      'data-kategorie="' + sicher(eintrag.kategorie) + '">' +
      '<span class="mikro k-etikett">' + etikett(eintrag) + '</span>' +
      '<h2>' + sicher(eintrag.name) + '</h2>' +
      '<p>' + sicher(kuerzen(eintrag.kurz, 150)) + '</p>' +
      '<span class="k-fuss">' +
      '<span>' + anzahlWort(zahl, 'Verknüpfung', 'Verknüpfungen') + '</span>' +
      '<span class="reife ' + reife + '">' + (reife === 'ausgebaut' ? 'ausgebaut' : 'knapp') + '</span>' +
      '</span></a>'
    );
  }

  /* ---------------------------- Navigation ------------------------ */

  function navigationZeichnen() {
    navigation.innerHTML = WELT.kategorien
      .map((kategorie) => {
        const liste = nachKategorie.get(kategorie.schluessel) || [];
        if (!liste.length) return '';
        return (
          // Die Kategorie steht am Element, damit Module wie „Werkstatt"
          // ihren eigenen Farbton setzen können (siehe stil.css).
          '<section class="nav-gruppe" data-kategorie="' + sicher(kategorie.schluessel) + '">' +
          '<h2 class="mikro">' +
          '<a href="#/kategorie/' + encodeURIComponent(kategorie.schluessel) + '">' +
          sicher(kategorie.name) + '</a>' +
          '<span class="anzahl">' + liste.length + '</span>' +
          '</h2><ul>' +
          liste
            .map(
              (e) =>
                '<li><a href="#/eintrag/' + encodeURIComponent(e.id) + '" data-nav="' + sicher(e.id) + '">' +
                sicher(e.name) + '</a></li>',
            )
            .join('') +
          '</ul></section>'
        );
      })
      .join('');
  }

  function navigationMarkieren(id) {
    navigation.querySelectorAll('a[data-nav]').forEach((a) => {
      if (a.dataset.nav === id) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  /* ================================================================
     4. Seiten zeichnen
     ================================================================ */

  /* ---------------------------- Startseite ------------------------ */

  function startseiteZeichnen() {
    const kampagne = WELT.eintraege.find((e) => e.kategorie === 'wiki');

    const filter =
      '<div class="filter" id="filter">' +
      '<button type="button" data-filter="alle" aria-pressed="true">Alle</button>' +
      WELT.kategorien
        .map(
          (k) =>
            '<button type="button" data-filter="' + sicher(k.schluessel) + '" aria-pressed="false">' +
            sicher(k.name) + '</button>',
        )
        .join('') +
      '</div>';

    // Kampagneneintrag zuerst, danach alles alphabetisch
    const sortiert = [...WELT.eintraege].sort((a, b) => {
      if (a.kategorie === 'wiki' && b.kategorie !== 'wiki') return -1;
      if (b.kategorie === 'wiki' && a.kategorie !== 'wiki') return 1;
      const ka = WELT.kategorien.findIndex((k) => k.schluessel === a.kategorie);
      const kb = WELT.kategorien.findIndex((k) => k.schluessel === b.kategorie);
      return ka - kb || a.name.localeCompare(b.name, 'de');
    });

    inhalt.innerHTML =
      '<div class="seitenkopf">' +
      '<span class="mikro">Arbeitsfläche &middot; ' +
      anzahlWort(WELT.eintraege.length, 'Eintrag', 'Einträge') +
      ' &middot; Stand ' + datumDeutsch(WELT.standDerDaten) + '</span>' +
      '<h1>' + sicher(WELT.titel) + '</h1>' +
      '<p class="einleitung" id="start-einleitung">' +
      (kampagne ? sicher(kampagne.kurz) : sicher(WELT.untertitel)) +
      ' Verlinkte Begriffe zeigen beim Überfahren eine Kurzfassung.' +
      '</p></div>' +
      filter +
      '<div class="kacheln" id="kacheln">' + sortiert.map(kachel).join('') + '</div>' +
      '<p class="mikro fusszeile">Die Inhalte stammen aus der Weltenschmiede. ' +
      'Zuletzt dort bearbeitet am ' + datumDeutsch(WELT.standDerDaten) + '.</p>';

    const einleitung = document.getElementById('start-einleitung');
    if (einleitung) verweiseSetzen(einleitung, kampagne ? kampagne.id : null);

    filterVerdrahten();
    navigationMarkieren(null);
    document.title = WELT.titel + ' – Weltwiki';
  }

  function filterVerdrahten() {
    const filter = document.getElementById('filter');
    const kacheln = document.getElementById('kacheln');
    if (!filter || !kacheln) return;

    filter.addEventListener('click', (e) => {
      const knopf = e.target.closest('button[data-filter]');
      if (!knopf) return;
      const wahl = knopf.dataset.filter;

      filter.querySelectorAll('button').forEach((b) => {
        b.setAttribute('aria-pressed', String(b === knopf));
      });

      let sichtbar = 0;
      kacheln.querySelectorAll('.kachel').forEach((k) => {
        const passt = wahl === 'alle' || k.dataset.kategorie === wahl;
        k.hidden = !passt;
        if (passt) sichtbar += 1;
      });

      let leer = kacheln.parentElement.querySelector('.leermeldung');
      if (!sichtbar) {
        if (!leer) {
          leer = document.createElement('p');
          leer.className = 'leermeldung';
          leer.textContent = 'In dieser Kategorie gibt es noch keine Einträge.';
          kacheln.after(leer);
        }
      } else if (leer) {
        leer.remove();
      }
    });
  }

  /* ------------------------- Kategorieseite ----------------------- */

  function kategorieZeichnen(schluessel) {
    const kategorie = kategorieInfo.get(schluessel);
    const liste = nachKategorie.get(schluessel);
    if (!kategorie || !liste) return nichtGefunden();

    inhalt.innerHTML =
      '<p class="brotkrumen">' +
      '<a class="zurueck" href="#/">&lsaquo; Arbeitsfläche</a>' +
      '<span class="pfad">' + sicher(WELT.titel) + ' / ' + sicher(kategorie.name) + '</span></p>' +
      '<div class="seitenkopf">' +
      '<span class="mikro">' + anzahlWort(liste.length, 'Eintrag', 'Einträge') + '</span>' +
      '<h1>' + sicher(kategorie.name) + '</h1></div>' +
      '<div class="kacheln">' + liste.map(kachel).join('') + '</div>';

    navigationMarkieren(null);
    document.title = kategorie.name + ' – ' + WELT.titel;
  }

  /* --------------------------- Eintragsseite ---------------------- */

  function eintragZeichnen(id) {
    const eintrag = nachId.get(id);
    if (!eintrag) return nichtGefunden();

    const hinaus = eintrag.verbindungen;
    const herein = verbundenVon.get(eintrag.id) || [];

    /* --- linke Spalte: Fließtext --- */

    // Die `data-`Angaben sind die Anker für die Bearbeitungsansicht. Ohne
    // Anmeldung stören sie niemanden; angemeldet hängt bearbeiten.js dort
    // seine Stiftknöpfe ein. Ein Abschnitt bekommt nur dann einen Anker,
    // wenn seine Herkunft bekannt ist – nur dann lässt er sich auch
    // zurückschreiben.
    const textTeile = [];
    if (eintrag.kurz) textTeile.push('<p class="anriss" data-feld="kurz">' + sicher(eintrag.kurz) + '</p>');
    eintrag.abschnitte.forEach((abschnitt, stelle) => {
      const anker = abschnitt.herkunft ? ' data-abschnitt="' + stelle + '"' : '';
      // Die Überschrift eines ergänzten Abschnitts ist keine Eingabe von
      // Jannik, sondern eine feste Beschriftung. Sie bleibt unantastbar.
      const titelAnker = abschnitt.herkunft?.art === 'panel' ? ' data-feld="titel"' : '';
      // Nur Abschnitte aus einem Panel lassen sich umsortieren oder löschen.
      // Ergänzte Abschnitte stammen aus einem Feld und haben keinen Platz in
      // der Reihenfolge; ihre Kennung fehlt deshalb bewusst.
      const panelAnker =
        abschnitt.herkunft?.art === 'panel' && abschnitt.herkunft.panelId
          ? ' data-panel="' + sicher(abschnitt.herkunft.panelId) + '"'
          : '';
      textTeile.push(
        '<section class="abschnitt' + (abschnitt.ergaenzt ? ' ergaenzt' : '') + '"' + anker + panelAnker + '>' +
          (abschnitt.titel ? '<h2' + titelAnker + '>' + sicher(abschnitt.titel) + '</h2>' : '') +
          '<div class="abschnitt-text"' + (anker ? ' data-feld="text"' : '') + '>' + abschnitt.html + '</div>' +
          '</section>',
      );
    });

    /* --- rechte Spalte: Attribute, Verbindungen, Erwähnungen --- */

    const seiteTeile = [];

    if (eintrag.attribute.length) {
      seiteTeile.push(
        '<section class="steckbrief"><h2 class="mikro">Attribute</h2><dl class="eigenschaften">' +
          eintrag.attribute
            .map((a) => {
              const wert = a.ziel
                ? '<a class="verweis" href="#/eintrag/' + encodeURIComponent(a.ziel) + '" data-ziel="' +
                  sicher(a.ziel) + '">' + sicher(a.wert) + '</a>'
                : sicher(a.wert);
              // `data-zeile` traegt den Schluessel, unter dem der Wert in der
              // Weltenschmiede steht. Die Bearbeitung haengt daran.
              const zeilenAnker = a.schluessel ? ' data-zeile="' + sicher(a.schluessel) + '"' : '';
              return '<dt' + zeilenAnker + '>' + sicher(a.beschriftung) + '</dt><dd' + zeilenAnker + '>' + wert + '</dd>';
            })
            .join('') +
          '</dl></section>',
      );
    }

    if (hinaus.length || herein.length) {
      const zeile = (v, richtung) => {
        const ziel = nachId.get(v.ziel);
        if (!ziel) return '';
        return (
          '<li' + (v.text ? ' class="mit-erklaerung"' : '') + '>' +
          '<a class="verweis" href="#/eintrag/' + encodeURIComponent(ziel.id) + '" data-ziel="' +
          sicher(ziel.id) + '">' + sicher(ziel.name) + '</a>' +
          '<span class="art">' + sicher(richtung === 'hinaus' ? v.art : v.art + ' von') + '</span>' +
          (v.text ? '<span class="erklaerung">' + sicher(v.text) + '</span>' : '') +
          '</li>'
        );
      };
      // Eine Beziehung, die schon in eine Richtung dasteht, wird nicht
      // ein zweites Mal von der Gegenseite wiederholt.
      const bereitsGenannt = new Set(hinaus.map((v) => v.ziel));
      const hereinGefiltert = herein.filter((v) => !bereitsGenannt.has(v.ziel));

      seiteTeile.push(
        '<section><h2 class="mikro">Verknüpfungen</h2><ul class="bezugsliste">' +
          hinaus.map((v) => zeile(v, 'hinaus')).join('') +
          hereinGefiltert.map((v) => zeile(v, 'herein')).join('') +
          '</ul></section>',
      );
    }

    const erwaehnungen = [...(erwaehntVon.get(eintrag.id) || [])]
      .map((quelle) => nachId.get(quelle))
      .filter(Boolean)
      .filter((q) => !hinaus.some((v) => v.ziel === q.id) && !herein.some((v) => v.ziel === q.id))
      .sort((a, b) => a.name.localeCompare(b.name, 'de'));

    if (erwaehnungen.length) {
      seiteTeile.push(
        '<section><h2 class="mikro">Erwähnt in</h2><ul class="bezugsliste">' +
          erwaehnungen
            .map(
              (q) =>
                '<li><a class="verweis" href="#/eintrag/' + encodeURIComponent(q.id) + '" data-ziel="' +
                sicher(q.id) + '">' + sicher(q.name) + '</a>' +
                '<span class="art">' + sicher(kategorieName(q.kategorie)) + '</span></li>',
            )
            .join('') +
          '</ul></section>',
      );
    }

    if (eintrag.quelle || eintrag.geaendert) {
      seiteTeile.push(
        '<section><h2 class="mikro">Herkunft</h2><dl class="eigenschaften">' +
          (eintrag.quelle ? '<dt>Regelquelle</dt><dd>' + sicher(eintrag.quelle) + '</dd>' : '') +
          (eintrag.geaendert ? '<dt>Zuletzt</dt><dd>' + sicher(datumKurz(eintrag.geaendert)) + '</dd>' : '') +
          '</dl></section>',
      );
    }

    /* --- zusammensetzen --- */

    inhalt.innerHTML =
      '<p class="brotkrumen">' +
      '<a class="zurueck" href="#/">&lsaquo; Arbeitsfläche</a>' +
      '<span class="pfad">' + sicher(WELT.titel) + ' / ' +
      '<a href="#/kategorie/' + encodeURIComponent(eintrag.kategorie) + '">' +
      sicher(kategorieName(eintrag.kategorie)) + '</a> / ' + sicher(eintrag.name) + '</span></p>' +
      '<article class="artikel" data-eintrag="' + sicher(eintrag.id) + '" data-kategorie="' +
      sicher(eintrag.kategorie) + '">' +
      '<span class="mikro">' + etikett(eintrag) + '</span>' +
      '<h1 data-feld="name">' + sicher(eintrag.name) + '</h1>' +
      (eintrag.aliase.length
        ? '<p class="mikro" style="margin:-1.1rem 0 1.5rem">Auch: ' + sicher(eintrag.aliase.join(' · ')) + '</p>'
        : '') +
      '<div class="artikel-raster">' +
      '<div class="artikel-text">' + textTeile.join('') + '</div>' +
      (seiteTeile.length ? '<aside class="artikel-seite">' + seiteTeile.join('') + '</aside>' : '') +
      '</div></article>';

    // Verweise nur im Fließtext setzen; ein Begriff je Eintrag einmal
    const belegt = new Set();
    inhalt.querySelectorAll('.artikel-text .anriss, .artikel-text .abschnitt').forEach((bereich) => {
      verweiseSetzen(bereich, eintrag.id, belegt);
    });

    navigationMarkieren(eintrag.id);
    document.title = eintrag.name + ' – ' + WELT.titel;
  }

  function nichtGefunden() {
    inhalt.innerHTML =
      '<div class="seitenkopf"><span class="mikro">Fehler</span>' +
      '<h1>Nicht gefunden</h1>' +
      '<p class="einleitung">Diese Seite gibt es im Wiki nicht.</p></div>' +
      '<p><a class="verweis" href="#/">Zurück zur Arbeitsfläche</a></p>';
    navigationMarkieren(null);
  }

  /* ================================================================
     5. Vorschaukarte
     ================================================================ */

  const vorschau = document.getElementById('vorschau');
  let vorschauZiel = null;
  let einblendUhr = null;
  let ausblendUhr = null;
  let letzterZeiger = 'mouse';

  function vorschauInhalt(eintrag) {
    const zahl = verknuepfungsZahl(eintrag);
    return (
      '<span class="mikro v-etikett">' + etikett(eintrag) + '</span>' +
      '<div class="v-name">' + sicher(eintrag.name) + '</div>' +
      (eintrag.kurz ? '<p class="v-text">' + sicher(kuerzen(eintrag.kurz, 190)) + '</p>' : '') +
      '<span class="v-fuss">' +
      '<span>' + anzahlWort(zahl, 'Verknüpfung', 'Verknüpfungen') +
      ' &middot; ' + reifegrad(eintrag) + '</span>' +
      '<a class="v-oeffnen" href="#/eintrag/' + encodeURIComponent(eintrag.id) + '">Öffnen &rarr;</a>' +
      '</span>'
    );
  }

  function vorschauZeigen(verweis) {
    const eintrag = nachId.get(verweis.dataset.ziel);
    if (!eintrag) return;

    if (vorschauZiel) vorschauZiel.classList.remove('aktiv');
    vorschauZiel = verweis;
    verweis.classList.add('aktiv');

    vorschau.innerHTML = vorschauInhalt(eintrag);
    vorschau.hidden = false;

    const platz = verweis.getBoundingClientRect();
    const eigen = vorschau.getBoundingClientRect();
    const rand = 12;

    let links = platz.left + window.scrollX;
    links = Math.min(links, window.scrollX + document.documentElement.clientWidth - eigen.width - rand);
    links = Math.max(links, window.scrollX + rand);

    const passtDarunter = window.innerHeight - platz.bottom > eigen.height + rand;
    const oben = passtDarunter || platz.top < eigen.height + rand
      ? platz.bottom + window.scrollY + 8
      : platz.top + window.scrollY - eigen.height - 8;

    vorschau.style.left = links + 'px';
    vorschau.style.top = oben + 'px';
  }

  function vorschauVerbergen() {
    if (vorschauZiel) vorschauZiel.classList.remove('aktiv');
    vorschau.hidden = true;
    vorschau.innerHTML = '';
    vorschauZiel = null;
  }

  const abbrechen = () => { clearTimeout(einblendUhr); clearTimeout(ausblendUhr); };

  document.addEventListener('pointerdown', (e) => {
    letzterZeiger = e.pointerType || 'mouse';
  }, true);

  document.addEventListener('pointerover', (e) => {
    if (letzterZeiger === 'touch') return;
    const verweis = e.target.closest('a.verweis[data-ziel]');
    if (verweis) {
      abbrechen();
      if (vorschauZiel === verweis) return;
      einblendUhr = setTimeout(() => vorschauZeigen(verweis), 170);
      return;
    }
    if (e.target.closest('#vorschau')) { abbrechen(); return; }
    if (vorschauZiel) {
      abbrechen();
      ausblendUhr = setTimeout(vorschauVerbergen, 160);
    }
  });

  document.addEventListener('focusin', (e) => {
    const verweis = e.target.closest('a.verweis[data-ziel]');
    if (verweis) { abbrechen(); vorschauZeigen(verweis); }
    else if (!e.target.closest('#vorschau')) vorschauVerbergen();
  });

  // Auf dem Handy: erstes Antippen zeigt die Vorschau, „Öffnen" führt hin
  document.addEventListener('click', (e) => {
    const verweis = e.target.closest('a.verweis[data-ziel]');
    if (verweis && letzterZeiger === 'touch' && vorschauZiel !== verweis) {
      e.preventDefault();
      abbrechen();
      vorschauZeigen(verweis);
      return;
    }
    if (!e.target.closest('#vorschau')) vorschauVerbergen();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') vorschauVerbergen();
  });

  window.addEventListener('scroll', () => { if (vorschauZiel) vorschauVerbergen(); }, { passive: true });
  window.addEventListener('resize', vorschauVerbergen);

  /* --- Schein folgt der Maus, aber nur innerhalb der Kachel --- */

  document.addEventListener('pointermove', (e) => {
    const kachelEl = e.target.closest('.kachel');
    if (!kachelEl) return;
    const platz = kachelEl.getBoundingClientRect();
    kachelEl.style.setProperty('--maus-x', ((e.clientX - platz.left) / platz.width) * 100 + '%');
    kachelEl.style.setProperty('--maus-y', ((e.clientY - platz.top) / platz.height) * 100 + '%');
  }, { passive: true });

  /* ================================================================
     6. Suche
     ================================================================ */

  const suchfeld = document.getElementById('suchfeld');
  const suchTreffer = document.getElementById('such-treffer');
  const sucheLeeren = document.getElementById('suche-leeren');
  let auswahl = -1;

  function suchen(begriff) {
    const b = begriff.trim().toLowerCase();
    if (b.length < 2) return [];

    const gefunden = [];
    for (const eintrag of WELT.eintraege) {
      const name = eintrag.name.toLowerCase();
      const aliase = eintrag.aliase.join(' ').toLowerCase();
      const kurz = (eintrag.kurz || '').toLowerCase();
      const text = volltext.get(eintrag.id).toLowerCase();

      let punkte = 0;
      let stelle = '';

      if (name === b) punkte = 100;
      else if (name.startsWith(b)) punkte = 80;
      else if (name.includes(b)) punkte = 60;
      else if (aliase.includes(b)) { punkte = 50; stelle = 'Andere Bezeichnung'; }
      else if (kurz.includes(b)) { punkte = 35; stelle = eintrag.kurz; }
      else if (text.includes(b)) {
        punkte = 20;
        const pos = text.indexOf(b);
        stelle = '…' + volltext.get(eintrag.id).slice(Math.max(0, pos - 40), pos + 70).trim() + '…';
      }

      if (punkte > 0) gefunden.push({ eintrag, punkte, stelle: stelle || eintrag.kurz || '' });
    }

    return gefunden
      .sort((a, b2) => b2.punkte - a.punkte || a.eintrag.name.localeCompare(b2.eintrag.name, 'de'))
      .slice(0, 12);
  }

  function hervorheben(text, begriff) {
    const sicherer = sicher(text);
    if (!begriff) return sicherer;
    return sicherer.replace(new RegExp('(' + maskieren(sicher(begriff)) + ')', 'gi'), '<mark>$1</mark>');
  }

  function trefferZeichnen(begriff) {
    auswahl = -1;

    if (begriff.trim().length < 2) { suchTreffer.hidden = true; return; }

    const ergebnisse = suchen(begriff);
    if (!ergebnisse.length) {
      suchTreffer.innerHTML = '<div class="leer">Nichts gefunden für „' + sicher(begriff) + '“.</div>';
      suchTreffer.hidden = false;
      return;
    }

    suchTreffer.innerHTML = ergebnisse
      .map(
        (t, i) =>
          '<button type="button" class="treffer" role="option" data-index="' + i +
          '" data-ziel="' + sicher(t.eintrag.id) + '">' +
          '<strong>' + hervorheben(t.eintrag.name, begriff) + '</strong>' +
          '<small>' + sicher(kategorieEinzahl(t.eintrag.kategorie)) +
          (t.stelle ? ' &middot; ' + hervorheben(kuerzen(t.stelle, 90), begriff) : '') +
          '</small></button>',
      )
      .join('');
    suchTreffer.hidden = false;
  }

  function trefferOeffnen(ziel) {
    location.hash = '#/eintrag/' + encodeURIComponent(ziel);
    suchTreffer.hidden = true;
    suchfeld.blur();
  }

  suchfeld.addEventListener('input', () => {
    sucheLeeren.hidden = !suchfeld.value;
    trefferZeichnen(suchfeld.value);
  });

  suchfeld.addEventListener('keydown', (e) => {
    const knoepfe = [...suchTreffer.querySelectorAll('.treffer')];
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!knoepfe.length) return;
      e.preventDefault();
      auswahl = e.key === 'ArrowDown'
        ? (auswahl + 1) % knoepfe.length
        : (auswahl - 1 + knoepfe.length) % knoepfe.length;
      knoepfe.forEach((k, i) => k.classList.toggle('aktiv', i === auswahl));
      knoepfe[auswahl].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      const ziel = auswahl >= 0 ? knoepfe[auswahl] : knoepfe[0];
      if (ziel) { e.preventDefault(); trefferOeffnen(ziel.dataset.ziel); }
    } else if (e.key === 'Escape') {
      suchTreffer.hidden = true;
      suchfeld.blur();
    }
  });

  suchTreffer.addEventListener('click', (e) => {
    const knopf = e.target.closest('.treffer');
    if (knopf) trefferOeffnen(knopf.dataset.ziel);
  });

  sucheLeeren.addEventListener('click', () => {
    suchfeld.value = '';
    sucheLeeren.hidden = true;
    suchTreffer.hidden = true;
    suchfeld.focus();
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.suche')) suchTreffer.hidden = true;
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && !/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) {
      e.preventDefault();
      suchfeld.focus();
      suchfeld.select();
    }
  });

  /* ================================================================
     7. Navigation, Adresszeile, Bedienung
     ================================================================ */

  const schmal = () => window.matchMedia('(max-width: 60rem)').matches;

  /**
   * Rückrufe, die nach jedem Zeichnen einer Seite laufen.
   *
   * Die Bearbeitungsansicht hängt sich hier ein: Sie muss ihre Stiftknöpfe
   * nach jedem Seitenwechsel neu setzen, weil der Inhalt dabei komplett
   * neu geschrieben wird.
   */
  const nachDemZeichnen = [];

  function seiteZeichnen() {
    const teile = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);

    vorschauVerbergen();

    if (!teile.length) startseiteZeichnen();
    else if (teile[0] === 'eintrag' && teile[1]) eintragZeichnen(decodeURIComponent(teile[1]));
    else if (teile[0] === 'kategorie' && teile[1]) kategorieZeichnen(decodeURIComponent(teile[1]));
    else nichtGefunden();

    if (schmal()) leisteSetzen(false);
    window.scrollTo({ top: 0, behavior: 'auto' });

    for (const rueckruf of nachDemZeichnen) {
      try { rueckruf(); } catch (fehler) { console.error('Rückruf nach dem Zeichnen:', fehler); }
    }
  }

  window.addEventListener('hashchange', seiteZeichnen);

  /* --------------------- Seitenleiste ein und aus ----------------- */

  const leisteSchalter = document.getElementById('leiste-schalter');
  const LEISTE_GESPEICHERT = 'age-of-beast-leiste';

  function leisteSetzen(offen) {
    rahmen.classList.toggle('leiste-zu', !offen);
    leisteSchalter.setAttribute('aria-expanded', String(offen));
    if (!schmal()) {
      try { localStorage.setItem(LEISTE_GESPEICHERT, offen ? 'offen' : 'zu'); } catch (e) { /* egal */ }
    }
  }

  leisteSchalter.addEventListener('click', () => {
    leisteSetzen(rahmen.classList.contains('leiste-zu'));
  });

  // Beim Überfahren des Knopfes leuchtet die Leistenkante kurz auf,
  // damit klar ist, wozu er gehört.
  leisteSchalter.addEventListener('pointerenter', () => rahmen.classList.add('leiste-hervorheben'));
  leisteSchalter.addEventListener('pointerleave', () => rahmen.classList.remove('leiste-hervorheben'));

  let leisteStart = true;
  try { leisteStart = localStorage.getItem(LEISTE_GESPEICHERT) !== 'zu'; } catch (e) { /* egal */ }
  leisteSetzen(schmal() ? false : leisteStart);

  /* --------------------------- Hell und dunkel -------------------- */

  const themaKnopf = document.getElementById('thema-knopf');
  const THEMA_GESPEICHERT = 'age-of-beast-thema';

  /**
   * Wechselt zwischen hell und dunkel.
   *
   * Waehrend des Wechsels werden alle Uebergaenge kurz stillgelegt. Grund:
   * Aendert sich nur eine Variable wie --verweis, loest das im Browser
   * keinen neuen Farbuebergang aus. Elemente mit `transition: color`
   * behielten dadurch die Farbe des vorherigen Themas - im schlimmsten Fall
   * ein dunkler Verweis auf dunklem Grund. Nach einem Bildaufbau werden die
   * Uebergaenge wieder freigegeben, damit das Ueberfahren weich bleibt.
   */
  function themaSetzen(thema) {
    const wurzel = document.documentElement;
    wurzel.classList.add('thema-wechsel');
    wurzel.dataset.thema = thema;
    themaKnopf.firstElementChild.textContent = thema === 'hell' ? '☀' : '☾';
    try { localStorage.setItem(THEMA_GESPEICHERT, thema); } catch (e) { /* egal */ }

    // Neuberechnung jetzt erzwingen, solange die Uebergaenge stillgelegt sind.
    // Ohne das kann die Freigabe schneller sein als die Berechnung: Der Browser
    // uebernimmt eine geaenderte Variable dann nicht mehr in eine Eigenschaft mit
    // laufendem Uebergang - ein Verweis behielte die Farbe des anderen Themas.
    void wurzel.offsetWidth;

    // Freigeben, sobald die neuen Werte uebernommen sind. requestAnimationFrame
    // feuert in einem unsichtbaren Tab nicht - ohne die Zeitgeber-Rueckfallebene
    // bliebe die Klasse dort haengen und saemtliche Uebergaenge waeren tot.
    let freigegeben = false;
    const freigeben = () => {
      if (freigegeben) return;
      freigegeben = true;
      wurzel.classList.remove('thema-wechsel');
    };
    requestAnimationFrame(() => requestAnimationFrame(freigeben));
    setTimeout(freigeben, 120);
  }

  let startThema = 'dunkel';
  try { startThema = localStorage.getItem(THEMA_GESPEICHERT) || 'dunkel'; } catch (e) { /* egal */ }
  themaSetzen(startThema);

  themaKnopf.addEventListener('click', () => {
    themaSetzen(document.documentElement.dataset.thema === 'hell' ? 'dunkel' : 'hell');
  });

  /* ------------------------------ Start --------------------------- */

  function kopfzeileSetzen() {
    document.getElementById('welt-titel').textContent = WELT.titel;
    document.getElementById('welt-untertitel').textContent = WELT.untertitel;
    document.getElementById('kopf-stand').textContent = 'Stand ' + datumKurz(WELT.standDerDaten);
  }

  kopfzeileSetzen();

  navigationZeichnen();
  seiteZeichnen();

  /* ----------------------------------------------------------------
     Schnittstelle fuer die Bearbeitungsansicht

     bearbeiten.js laedt die Weltdaten angemeldet live aus der
     Weltenschmiede und reicht sie hier herein. Die Seite wird dann
     ohne Neuladen neu gezeichnet.
     ---------------------------------------------------------------- */

  window.ageOfBeast = {
    /** Tauscht die Weltdaten aus und zeichnet alles neu. */
    weltSetzen(neueWelt, stelleHalten) {
      if (!neueWelt || !Array.isArray(neueWelt.eintraege)) return false;
      // Nach dem Speichern eines Textes soll die Seite nicht nach oben
      // springen: Jannik will sehen, was er gerade geändert hat.
      const hoehe = window.scrollY;
      WELT = neueWelt;
      nachschlagewerkeAufbauen();
      kopfzeileSetzen();
      navigationZeichnen();
      seiteZeichnen();
      if (stelleHalten) window.scrollTo({ top: hoehe, behavior: 'auto' });
      return true;
    },
    /** Der gerade angezeigte Weltstand. */
    weltHolen: () => WELT,
    /**
     * Meldet einen Rückruf an, der nach jedem Zeichnen einer Seite läuft.
     * Er wird sofort einmal ausgeführt, damit die bereits gezeichnete
     * Seite nicht übersprungen wird.
     */
    beiNeuZeichnen(rueckruf) {
      if (typeof rueckruf !== 'function') return;
      nachDemZeichnen.push(rueckruf);
      try { rueckruf(); } catch (fehler) { console.error('Rückruf nach dem Zeichnen:', fehler); }
    },
  };
})();
