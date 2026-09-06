/* ===================================================================
   Age of Beast — was eine Schadensschwelle am Tisch bedeutet
   [Aufgabe: Charakterbogen]

   -------------------------------------------------------------------
   Janniks Wunsch vom 06.09.2026, wörtlich: „Und den schadensthreshold
   auch mit popup anzeigen."

   Ein Popup hatte die Schwelle schon — es war nur 22 Bildpunkte breit
   und brauchte zwei Tipps, also praktisch unerreichbar (siehe
   `styles/charakterbogen.css` und `karte/kartenblase.js`). Was gefehlt
   hat, war der **Satz** darin: Die Herleitung sagte „Grundwert 1,
   Bonus +5 durch Gambeson" — und nicht, was die 6 am Tisch bedeutet.

   ── Warum eine eigene Datei ────────────────────────────────────────

   Das hier ist **Regeltext**, keine Bedienung und keine Rechnung. In
   `bogen-werte.js` stand es zwischen Umschaltern und HTML-Bausteinen
   und hat die Datei über die 500-Zeilen-Grenze geschoben, die
   `werkzeuge/pruefe-altlasten.mjs` bewacht. Getrennt lässt es sich
   zudem prüfen, ohne den halben Bogen zu laden.

   Die Regel steht in `docs/daggerheart/REGELN-GRUNDLAGEN.md`: Unter der
   schweren Schwelle kostet ein Treffer 1 Lebenspunkt, dazwischen 2, ab
   der ernsten 3.

   ⚠️ **Die Zahlen werden gerechnet, nicht abgeschrieben.** Wer die
   Rüstung ablegt, hat andere Schwellen — und der Satz muss mitwandern,
   sonst steht im Popup etwas anderes als daneben auf dem Bogen.

   Arbeitet zusammen mit: `karte/bogen-werte.js` (hängt den Satz an die
   Blase), `werkzeuge/pruefe-blase.mjs` (rechnet ihn nach).
   =================================================================== */

/**
 * Der Satz zu einer Schwelle — oder ein leerer Text, wenn der Wert
 * keine Schwelle ist oder die Zahlen fehlen.
 *
 * `werte` ist die Wertetabelle aus `werkzeuge/werte-rechnen.mjs`.
 */
export function schwellenErklaerung(schluessel, werte) {
  const schwer = werte?.schwelleSchwer?.endwert;
  const ernst = werte?.schwelleErnst?.endwert;
  if (typeof schwer !== 'number' || typeof ernst !== 'number') return '';

  if (schluessel === 'schwelleSchwer') {
    return 'Ein Treffer unter ' + schwer + ' Schaden kostet 1 Lebenspunkt, '
      + 'ab ' + schwer + ' kostet er 2.';
  }
  if (schluessel === 'schwelleErnst') {
    return 'Ab ' + ernst + ' Schaden kostet ein Treffer 3 Lebenspunkte — '
      + 'darunter, ab ' + schwer + ', sind es 2.';
  }
  return '';
}
