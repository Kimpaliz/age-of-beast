/* Age of Beast — Kategoriesymbole.
   [Aufgabe: Leseruntime]


   Warum es diese Datei gibt: Bis hierher unterschied nur ein Wort und bei
   zwei von zehn Kategorien eine Farbe, worum es auf einer Kachel geht. Wer
   das Wiki überfliegt, muss aber am Bild erkennen, ob vor ihm eine Fraktion,
   ein Ort oder ein Gegenstand liegt.

   Warum gezeichnete Pfade statt Schriftzeichen: In den Weltdaten standen
   bereits Zeichen wie ☗ und ⌂. Sie sind unbrauchbar, weil keine der
   verwendeten Schriften sie vollständig enthält — je nach Gerät erscheint
   ein leeres Kästchen. Ein Pfad ist überall derselbe.

   Bauart: Ein einziger Sprite mit zehn <symbol>, jedes Icon steht genau
   einmal im Dokument und wird über <use> beliebig oft eingesetzt. Alle
   Pfade tragen keine eigene Farbe, sondern erben `currentColor`. Ohne
   persönliche Auswahl folgt ein Symbol seiner Kategorie; eine bewusst
   gewählte Eintragsfarbe überschreibt nur dieses einzelne Symbol.

   Der Baustein fasst kein DOM an. Er liefert Zeichenketten; wer sie
   einsetzt, entscheiden die Ansichten. */
(function () {

  'use strict';

  const bausteine = window.__aobLeserBausteine = window.__aobLeserBausteine || {};

  /* Alle Pfade in einem 24x24-Feld, gezeichnet als Striche ohne Füllung.
     Die Motive sind bewusst so gewählt, dass sich keine zwei bei kleiner
     Darstellung verwechseln lassen. */
  const MOTIVE = {
    // Kampagne: aufgeschlagenes Buch – die Kampagne ist das Buch, in dem
    // alles andere steht.
    wiki: [
      'M12 6.9c-1.9-1.4-4.5-2-7.4-1.7v11.6c2.9-.3 5.5.3 7.4 1.7',
      'M12 6.9c1.9-1.4 4.5-2 7.4-1.7v11.6c-2.9-.3-5.5.3-7.4 1.7',
      'M12 6.9v11.6',
    ],
    // Fraktionen: Standarte mit Schwalbenschwanz.
    factions: [
      'M6.4 3.4v17.2',
      'M6.4 4.9h11l-2.9 3.9 2.9 3.9h-11',
    ],
    // Spezies: Pfotenabdruck. In einer Welt namens Age of Beast das
    // sprechendste Zeichen für „Volk, Art, Kreatur".
    species: [
      'M7.6 11.5c-1 0-1.8-1.1-1.8-2.5s.8-2.5 1.8-2.5 1.8 1.1 1.8 2.5-.8 2.5-1.8 2.5z',
      'M11.5 9.9c-1 0-1.9-1.2-1.9-2.7s.8-2.7 1.9-2.7 1.9 1.2 1.9 2.7-.8 2.7-1.9 2.7z',
      'M15.6 10.5c-1 0-1.8-1.1-1.8-2.5s.8-2.5 1.8-2.5 1.8 1.1 1.8 2.5-.8 2.5-1.8 2.5z',
      'M18.6 14.4c-1 0-1.7-1-1.7-2.3s.8-2.3 1.7-2.3 1.7 1 1.7 2.3-.8 2.3-1.7 2.3z',
      'M12.1 12.6c2.4 0 4.4 1.6 4.4 3.9 0 2.5-2 3.9-4.4 3.9s-4.4-1.4-4.4-3.9c0-2.3 2-3.9 4.4-3.9z',
    ],
    // Figuren: Kopf und Schultern.
    characters: [
      'M12 4.6a3.4 3.4 0 1 1 0 6.8 3.4 3.4 0 0 1 0-6.8z',
      'M5.4 20.1c0-3.7 3-5.9 6.6-5.9s6.6 2.2 6.6 5.9',
    ],
    // Gegenstände: Schwert mit Parierstange – im Rollenspiel das Zeichen
    // für Ausrüstung schlechthin.
    items: [
      'M12 2.9l1.5 2.3v8.1h-3V5.2z',
      'M7.9 13.3h8.2',
      'M12 13.3v4.1',
      'M10.4 17.4h3.2',
    ],
    // Orte: Turm mit Zinnen, Tor und Fenster.
    places: [
      'M6.6 20.4V9h10.8v11.4',
      'M6.6 9V6.2h2.2v1.6h2.1V6.2h2.2v1.6h2.1V6.2h2.2V9',
      'M10.4 20.4v-4a1.6 1.6 0 0 1 3.2 0v4',
      'M11.1 11.4h1.8v1.9h-1.8z',
    ],
    // Ereignisse: Sanduhr – ein Ereignis ist ein Punkt in der Zeit.
    events: [
      'M7.1 3.6h9.8',
      'M7.1 20.4h9.8',
      'M8.4 3.6v3.1L12 12l3.6-5.3V3.6',
      'M8.4 20.4v-3.1L12 12l3.6 5.3v3.1',
    ],
    // Wissen: Federkiel – aufgeschriebenes Wissen.
    lore: [
      'M19.4 4.6C13 5.7 9.1 9.4 7.5 13.9l-1.2 3.9 3.9-1.2c4.5-1.6 8.2-5.5 9.2-12z',
      'M16.7 7.3C13 9 10.5 11.5 9 14.8',
      'M6.3 17.8l-1.9 1.9',
    ],
    // Werkstatt: Schmiedehammer.
    werkstatt: [
      'M13.6 4.2l6.2 6.2-2.6 2.6-6.2-6.2z',
      'M11.6 9.5l-6.9 6.9a1.8 1.8 0 0 0 2.6 2.6l6.9-6.9',
    ],
    // Regeln: Waage – Regeln wägen ab.
    regeln: [
      'M12 4.4v14.8',
      'M7.9 19.4h8.2',
      'M4.7 8.1h14.6',
      'M12 5.9a1.4 1.4 0 1 1 0 2.8 1.4 1.4 0 0 1 0-2.8z',
      'M5.2 8.4l-2.3 4.4h4.6z',
      'M18.8 8.4l-2.3 4.4h4.6z',
    ],
  };

  /* Selectable motifs for individual entries. Category symbols stay
     separate: an empty value deliberately means "use category icon". */
  const EINTRAGS_MOTIVE = {
    person: { name: 'Person', pfade: MOTIVE.characters },
    crown: { name: 'Krone', pfade: [
      'M4 7l4 4 4-6 4 6 4-4-2 11H6z',
      'M6 18h12',
    ] },
    banner: { name: 'Banner', pfade: MOTIVE.factions },
    shield: { name: 'Schild', pfade: [
      'M12 3l7 3v5c0 4.7-2.8 8-7 10-4.2-2-7-5.3-7-10V6z',
    ] },
    sword: { name: 'Schwert', pfade: MOTIVE.items },
    key: { name: 'Schlüssel', pfade: [
      'M15.5 4.5a4 4 0 1 1-2.8 6.8A4 4 0 0 1 15.5 4.5z',
      'M12.7 11.3L4 20',
      'M6.2 17.8l2 2',
      'M8.5 15.5l2 2',
    ] },
    potion: { name: 'Trank', pfade: [
      'M9 3h6',
      'M10 3v5l-4 7a2 2 0 0 0 1.7 3h8.6a2 2 0 0 0 1.7-3l-4-7V3',
      'M7.4 14h9.2',
    ] },
    book: { name: 'Buch', pfade: MOTIVE.wiki },
    scroll: { name: 'Schriftrolle', pfade: [
      'M7 4h10a2 2 0 0 1 2 2v12H8a3 3 0 0 1-3-3V6a2 2 0 0 1 2-2z',
      'M8 8h7',
      'M8 12h7',
      'M8 16h5',
    ] },
    map: { name: 'Karte', pfade: [
      'M3.5 6l5-2 7 2 5-2v14l-5 2-7-2-5 2z',
      'M8.5 4v14',
      'M15.5 6v14',
    ] },
    pin: { name: 'Ortsmarke', pfade: [
      'M12 21s6-6.1 6-11a6 6 0 1 0-12 0c0 4.9 6 11 6 11z',
      'M12 7.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z',
    ] },
    castle: { name: 'Bauwerk', pfade: MOTIVE.places },
    tree: { name: 'Baum', pfade: [
      'M12 3l-5 7h3l-4 6h12l-4-6h3z',
      'M12 16v5',
    ] },
    mountain: { name: 'Berg', pfade: [
      'M3 20L10 7l3 5 2-3 6 11z',
      'M8.2 10.3L10 12l1.4-1.4',
    ] },
    star: { name: 'Stern', pfade: [
      'M12 3l2.5 5.5 6 .7-4.4 4.1 1.2 5.9-5.3-3-5.3 3 1.2-5.9-4.4-4.1 6-.7z',
    ] },
    sun: { name: 'Sonne', pfade: [
      'M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10z',
      'M12 2v2', 'M12 20v2', 'M2 12h2', 'M20 12h2',
      'M4.9 4.9l1.4 1.4', 'M17.7 17.7l1.4 1.4',
      'M19.1 4.9l-1.4 1.4', 'M6.3 17.7l-1.4 1.4',
    ] },
    moon: { name: 'Mond', pfade: [
      'M18.5 15.5C14 17 9 14 9 9c0-1.4.4-2.6 1-3.7C5.8 6.2 4 9.5 4.8 13c1 4.4 5.4 7.2 9.7 6.2 1.8-.4 3.2-1.8 4-3.7z',
    ] },
    flame: { name: 'Flamme', pfade: [
      'M13 3c.5 4-3 5-3 8 0 1.8 1 2.8 2 3.5-.2-2.4 1.2-3.7 2.4-4.7 2.2 1.8 3.6 4 3.6 6.3a6 6 0 0 1-12 0C6 10.8 10.6 8.2 13 3z',
    ] },
    skull: { name: 'Schädel', pfade: [
      'M5 11C5 6.6 8.1 4 12 4s7 2.6 7 7v3.5l-2 2V20H7v-3.5l-2-2z',
      'M8.5 11.5h1', 'M14.5 11.5h1', 'M10 16v2', 'M14 16v2',
    ] },
    gem: { name: 'Edelstein', pfade: [
      'M7 4h10l4 5-9 11L3 9z',
      'M3 9h18', 'M7 4l2 5 3 11', 'M17 4l-2 5-3 11',
    ] },
    gear: { name: 'Zahnrad', pfade: [
      'M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8z',
      'M12 2v3', 'M12 19v3', 'M2 12h3', 'M19 12h3',
      'M4.9 4.9L7 7', 'M17 17l2.1 2.1', 'M19.1 4.9L17 7', 'M7 17l-2.1 2.1',
    ] },
    eye: { name: 'Auge', pfade: [
      'M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z',
      'M12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z',
    ] },
  };

  /* Fixed names keep stored values safe and make the palette predictable.
     The actual dark/light colors live in CSS. */
  const EINTRAGS_FARBEN = {
    gold: 'Gold',
    red: 'Rot',
    orange: 'Orange',
    green: 'Grün',
    turquoise: 'Türkis',
    blue: 'Blau',
    purple: 'Lila',
    pink: 'Pink',
  };

  const ERSATZ = 'wiki';

  function kennung(kategorie) {
    return 'aob-symbol-' + String(kategorie || '').replace(/[^a-z0-9-]/gi, '');
  }

  function eintragsKennung(icon) {
    return 'aob-eintrag-symbol-' + String(icon || '').replace(/[^a-z0-9-]/gi, '');
  }

  /* Der Sprite steht einmal im Dokument, unsichtbar und für Vorlesegeraete
     ausgeblendet. Jedes <use> weiter unten verweist nur noch darauf. */
  function sprite() {
    const kategorien = Object.keys(MOTIVE).map((name) => {
      const pfade = MOTIVE[name].map((d) => '<path d="' + d + '"/>').join('');
      return '<symbol id="' + kennung(name) + '" viewBox="0 0 24 24">' + pfade + '</symbol>';
    }).join('');
    const eintraege = Object.entries(EINTRAGS_MOTIVE).map(([name, motiv]) => {
      const pfade = motiv.pfade.map((d) => '<path d="' + d + '"/>').join('');
      return '<symbol id="' + eintragsKennung(name) + '" viewBox="0 0 24 24">' + pfade + '</symbol>';
    }).join('');
    return '<svg class="symbol-vorrat" aria-hidden="true" focusable="false" width="0" height="0">' + kategorien + eintraege + '</svg>';
  }

  /* Liefert ein einzelnes Symbol. Es ist immer schmückend: Daneben steht
     stets der Name der Kategorie als Text, deshalb aria-hidden. */
  function symbol(kategorie, klasse) {
    const name = Object.prototype.hasOwnProperty.call(MOTIVE, kategorie) ? kategorie : ERSATZ;
    const klassen = 'symbol' + (klasse ? ' ' + klasse : '');
    return '<svg class="' + klassen + '" aria-hidden="true" focusable="false"><use href="#' + kennung(name) + '"/></svg>';
  }

  function kennt(kategorie) {
    return Object.prototype.hasOwnProperty.call(MOTIVE, kategorie);
  }

  function eintragSymbol(icon, kategorie, klasse, farbe) {
    const name = String(icon || '');
    const farbName = String(farbe || '');
    const hatFarbe = Object.prototype.hasOwnProperty.call(EINTRAGS_FARBEN, farbName);
    const klassen = 'symbol eintrag-symbol' + (klasse ? ' ' + klasse : '')
      + (hatFarbe ? ' eintrag-farbe-' + farbName : '');
    const farbMerkmal = hatFarbe ? ' data-icon-farbe="' + farbName + '"' : '';
    if (!Object.prototype.hasOwnProperty.call(EINTRAGS_MOTIVE, name)) {
      const kategorieName = Object.prototype.hasOwnProperty.call(MOTIVE, kategorie) ? kategorie : ERSATZ;
      return '<svg class="' + klassen + '"' + farbMerkmal
        + ' aria-hidden="true" focusable="false"><use href="#' + kennung(kategorieName) + '"/></svg>';
    }
    return '<svg class="' + klassen + '"' + farbMerkmal
      + ' aria-hidden="true" focusable="false"><use href="#' + eintragsKennung(name) + '"/></svg>';
  }

  function eintragsMotive() {
    return Object.entries(EINTRAGS_MOTIVE).map(([kennung, motiv]) => ({
      kennung, name: motiv.name,
    }));
  }

  function eintragsFarben() {
    return Object.entries(EINTRAGS_FARBEN).map(([kennung, name]) => ({ kennung, name }));
  }

  function api() {
    return {
      sprite,
      symbol,
      kennt,
      motive: () => Object.keys(MOTIVE),
      eintragSymbol,
      kenntEintrag: (icon) => Object.prototype.hasOwnProperty.call(EINTRAGS_MOTIVE, icon),
      eintragsMotive,
      kenntFarbe: (farbe) => Object.prototype.hasOwnProperty.call(EINTRAGS_FARBEN, farbe),
      eintragsFarben,
    };
  }

  bausteine.symbole = function symboleErstellen() {
    return api();
  };

  window.aobSymbole = Object.freeze(api());

})();
