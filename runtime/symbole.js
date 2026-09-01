/* Age-of-Beast – Kategoriesymbole.

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
   Pfade tragen keine eigene Farbe, sondern erben `currentColor` — dadurch
   nimmt ein Symbol die Farbe seiner Kategorie automatisch an.

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

  const ERSATZ = 'wiki';

  function kennung(kategorie) {
    return 'aob-symbol-' + String(kategorie || '').replace(/[^a-z0-9-]/gi, '');
  }

  /* Der Sprite steht einmal im Dokument, unsichtbar und für Vorlesegeraete
     ausgeblendet. Jedes <use> weiter unten verweist nur noch darauf. */
  function sprite() {
    const symbole = Object.keys(MOTIVE).map((name) => {
      const pfade = MOTIVE[name].map((d) => '<path d="' + d + '"/>').join('');
      return '<symbol id="' + kennung(name) + '" viewBox="0 0 24 24">' + pfade + '</symbol>';
    }).join('');
    return '<svg class="symbol-vorrat" aria-hidden="true" focusable="false" width="0" height="0">' + symbole + '</svg>';
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

  bausteine.symbole = function symboleErstellen() {
    return { sprite, symbol, kennt, motive: () => Object.keys(MOTIVE) };
  };

})();
